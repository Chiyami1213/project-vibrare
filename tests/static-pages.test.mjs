import test from 'node:test';
import assert from 'node:assert/strict';
import { dropOwnTheme, rewriteLinks, routeOf, scopeCss, splitPage } from '../src/lib/static-pages.ts';

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
