import test from 'node:test';
import assert from 'node:assert/strict';
import { dropOwnTheme, fixPlayback, rewriteLinks, routeOf, scopeCss, splitPage } from '../src/lib/static-pages.ts';

test('routeOf: a file is a folder route, an index is its folder', () => {
  assert.equal(routeOf('/analysis/a/b.html'), '/analysis/a/b/');
  assert.equal(routeOf('/analysis/a/index.html'), '/analysis/a/');
});

test('scopeCss: the rules apply inside the wrapper only', () => {
  const css = scopeCss('h1 { margin: 0 } .a, .b > p { color: red }');
  assert.match(css, /\.sp h1\{margin: 0\}/);
  assert.match(css, /\.sp \.a,\.sp \.b > p\{color: red\}/);
});

test('scopeCss: the shared colours of the page are dropped so the site\'s win, its own tokens are kept', () => {
  const css = scopeCss(':root { --bg: #fff; --accent: red; --c-blue: #00f; color-scheme: light }');
  assert.doesNotMatch(css, /--bg|--accent|color-scheme/);
  assert.match(css, /\.sp\{--c-blue: #00f\}/);
});

test('scopeCss: dark-theme token blocks follow the site\'s data-theme', () => {
  const css = scopeCss(
    ':root[data-theme="dark"] { --bg: #000; --c-blue: #4af } @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --c-blue: #4af } }',
  );
  assert.match(css, /:root\[data-theme="dark"\] \.sp\{--c-blue: #4af\}/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\) \.sp\{--c-blue: #4af\}\n\}/);
  assert.doesNotMatch(css, /--bg/);
});

test('scopeCss: body and html rules do not reach the site\'s own page', () => {
  const css = scopeCss('html { scroll-behavior: smooth } body { margin: 0; background: #fff; font: 16px/1.6 serif } body::before { content: "" } body.toc-open #toc { transform: none }');
  assert.doesNotMatch(css, /scroll-behavior|margin|background|::before/);
  assert.match(css, /\.sp\{font: 16px\/1\.6 serif\}/);
  assert.match(css, /body\.toc-open \.sp #toc\{transform: none\}/);
});

test('scopeCss: keyframes stay whole and media queries are scoped inside', () => {
  const css = scopeCss('@keyframes spin { from { opacity: 0 } to { opacity: 1 } } @media (max-width: 600px) { .x { color: red } }');
  assert.match(css, /@keyframes spin\{ from \{ opacity: 0 \} to \{ opacity: 1 \} \}/);
  assert.match(css, /@media \(max-width: 600px\)\{\.sp \.x\{color: red\}\n\}/);
});

test('dropOwnTheme: a page does not read the theme it saved for itself', () => {
  assert.equal(dropOwnTheme("const t = store.get('th-theme'); if (t) x()"), 'const t = null; if (t) x()');
  assert.equal(dropOwnTheme("localStorage.getItem('jpm-theme')"), 'null');
  assert.equal(dropOwnTheme("localStorage.getItem('other')"), "localStorage.getItem('other')");
});

test('rewriteLinks: links between delivered pages become routes, other links stay', () => {
  const known = new Set(['/analysis/x/index.html', '/analysis/x/one.html', '/analysis/y/two.html']);
  const html = '<a href="one.html#top">1</a> <a href="index.html">i</a> <a href="/analysis/y/two.html">2</a> <a href="gone.html">g</a> <a href="https://e.com/one.html">e</a> const u = \'../y/two.html\'';
  const out = rewriteLinks(html, '/analysis/x/other.html', known);
  assert.match(out, /href="\/analysis\/x\/one\/#top"/);
  assert.match(out, /href="\/analysis\/x\/"/);
  assert.match(out, /href="\/analysis\/y\/two\/"/);
  assert.match(out, /href="gone\.html"/);
  assert.match(out, /href="https:\/\/e\.com\/one\.html"/);
  assert.match(out, /const u = '\/analysis\/y\/two\/'/);
});

test('splitPage: the shell goes, page-level styles are pulled out, scripts and score styles stay as they are', () => {
  const html =
    '<!doctype html><html><head><title>T</title><meta name="x" content="y"><style>p{color:red}</style></head><body><p class="lead">A <b>lead</b> &amp; more.</p>' +
    '<svg><style>.k{fill:red}</style></svg><script>const s = "<meta x><style>q{}</style>";</script></body></html>';
  const page = splitPage(html);
  assert.equal(page.title, 'T');
  assert.equal(page.description, 'A lead & more.');
  assert.equal(page.css.trim(), 'p{color:red}');
  assert.match(page.body, /<svg><style>\.k\{fill:red\}<\/style><\/svg>/);
  assert.match(page.body, /const s = "<meta x><style>q\{\}<\/style>";/);
  assert.doesNotMatch(page.body, /<html|<head|<body|<title/);
});

test('fixPlayback: a frame-driven player is also driven by a timer, and one step is at most a quarter of a second', () => {
  const html = `const PIANO = (() => {})();
  const PLAYER = (() => {
    let cur = null, raf = 0;
    function stop() { if (!cur) return; cancelAnimationFrame(raf); cur = null; }
    async function start() {
      const step = now => {
        if (cur !== st) return;
        st.pos += (now - st.last) / 1000 * tempo / 60; st.last = now;
        if (done) { stop(); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
  })();`;
  const out = fixPlayback(html);
  assert.match(out, /let cur = null, raf = 0, timer = 0;/);
  assert.match(out, /cancelAnimationFrame\(raf\); clearInterval\(timer\);/);
  assert.match(out, /st\.pos \+= Math\.min\(250, Math\.max\(0, now - st\.last\)\) \/ 1000/);
  // the timer takes the place of the pending frame request, so there is never more than one chain of steps
  assert.equal(out.match(/setInterval\(\(\) => \{ cancelAnimationFrame\(raf\); step\(performance\.now\(\)\); \}, 25\)/g).length, 1);
  // the call inside step stays a plain frame request
  assert.match(out, /stop\(\); return; }\s*raf = requestAnimationFrame\(step\);\s*};\s*raf = requestAnimationFrame\(step\); timer = setInterval/);
});

test('fixPlayback: a note more than 0.3 s late is skipped; the samples are warmed up when the page is idle', () => {
  const html = 'const PIANO = (() => {})(); while (a) { const ev = x; const at = st.offset + ev.t; play(at); }';
  const out = fixPlayback(html);
  assert.match(out, /const at = st\.offset \+ ev\.t; if \(at < AC\.currentTime - 0\.3\) continue;/);
  assert.match(out, /warmUpSamples/);
  assert.equal(fixPlayback(out), out, 'a second pass changes nothing');
});

test('fixPlayback: a page without those players is left as it is', () => {
  const html = '<p>Nothing to patch here.</p>';
  assert.equal(fixPlayback(html), html);
});


test("the site's styles for a generic class name do not reach a delivered page that uses the same name", async () => {
  // Verovio draws <g class="staff">; the site's own .staff (a text colour for its VexFlow boxes) once made the staff lines
  // near-white on the white score in the dark theme. A rule that is about one class alone has to leave .sp alone, when a
  // delivered page uses that class too.
  const { readFileSync } = await import('node:fs');
  const { listStaticPages, readStaticPage } = await import('../src/lib/static-pages.ts');
  const used = new Set();
  for (const url of listStaticPages()) for (const m of readStaticPage(url).matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  const css = ['global.css', 'content-pages.css'].map((f) => readFileSync(new URL(`../src/styles/${f}`, import.meta.url), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const allowed = new Set(['sp', 'hero', 'theme']); // the wrapper, and the classes of the overrides for the pages themselves
  const firstCompound = (s) => {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if ('([' .includes(s[i])) depth++;
      else if (')]'.includes(s[i])) depth--;
      else if (depth === 0 && /[\s>+~]/.test(s[i])) return s.slice(0, i);
    }
    return s;
  };
  const bad = new Set();
  for (const m of css.matchAll(/([^{}@]+)\{[^{}]*\}/g)) {
    for (const sel of m[1].split(',')) {
      const first = firstCompound(sel.trim());
      const excluded = [...first.matchAll(/:not\(:where\(\.sp \.([\w-]+)\)\)/g)].map((x) => x[1]);
      const bare = first.replace(/:not\(:where\(\.sp \.[\w-]+\)\)/g, '').replace(/::?[\w-]+(\([^)]*\))?/g, '');
      const classes = [...bare.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((x) => x[1]);
      if (classes.length !== 1) continue; // two classes together are specific enough not to meet a page's single one
      const c = classes[0];
      if (used.has(c) && !allowed.has(c) && !excluded.includes(c)) bad.add(`.${c}  in  ${sel.trim().replace(/\s+/g, ' ')}`);
    }
  }
  assert.deepEqual([...bad].sort(), [], 'a delivered page uses this class name: exclude it from .sp in the CSS, or rename it');
});
