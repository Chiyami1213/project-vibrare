// The analysis pages that were delivered as whole HTML files (src/static-pages/) are shown inside the site: their styles are
// scoped to one wrapper, they take the site's colours and theme, and their links point at each other's routes.
// The text functions have no DOM, so they are tested; the two file functions at the end run at build time only.
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { scheduleOnAudioClock } from './playback.ts';

/** The colours every page of the site shares; a delivered page's own values for them are dropped, so the site's win. */
const SHARED_TOKENS = new Set(['--bg', '--fg', '--muted', '--line', '--tile', '--accent', 'color-scheme']);

/** Declarations of a `body` rule that the site's own layout decides. */
const BODY_DROP = new Set(['margin', 'padding', 'background', 'background-color', 'min-height', 'overflow', 'overflow-x', 'display', 'width', 'max-width']);

const WRAP = '.sp';

/** Split at the separators that are not inside parentheses or brackets. */
function splitTop(s: string, sep1 = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === sep1 && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function declarations(body: string): { prop: string; text: string }[] {
  return splitTop(body, ';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => ({ prop: d.slice(0, d.indexOf(':')).trim(), text: d }));
}

/** One selector, made to apply inside the wrapper. Returns null when the rule has nothing to say inside the site. */
function scopeSelector(sel: string): string | null {
  const s = sel.trim();
  if (!s) return null;
  if (/^html\b/.test(s)) return null; // html { scroll-behavior }
  if (/^body::(before|after)/.test(s)) return null; // the safe-area bar of the standalone page
  if (s === 'body') return WRAP;
  const b = /^body((?:\.[\w-]+)+)\s+(.*)$/.exec(s); // body.toc-open #toc: the class is switched on the real body
  if (b) return `body${b[1]} ${WRAP} ${b[2]}`;
  if (/^body\b/.test(s)) return `${WRAP}${s.slice(4)}`;
  const r = /^(:root(?:\[[^\]]*\]|:not\([^)]*\))*)\s*(.*)$/.exec(s); // :root[data-theme="dark"] .x
  if (r) return `${r[1]} ${WRAP}${r[2] ? ' ' + r[2] : ''}`;
  if (s === '*') return `${WRAP} *`;
  return `${WRAP} ${s}`;
}

/** The rules of one block, scoped. */
function scopeRules(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const selector = css.slice(i, open).trim();
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (selector.startsWith('@')) {
      const name = selector.split(/[\s(]/)[0];
      if (name === '@media' || name === '@supports') out += `${selector}{${scopeRules(body)}}\n`;
      else out += `${selector}{${body}}\n`; // @keyframes and @font-face stay as they are
      continue;
    }
    const sels = splitTop(selector).map((x) => x.trim());
    let decls = declarations(body);
    if (sels.every((x) => x === ':root')) {
      decls = decls.filter((d) => !SHARED_TOKENS.has(d.prop));
      if (decls.length) out += `${WRAP}{${decls.map((d) => d.text).join(';')}}\n`;
      continue;
    }
    // the dark-theme token blocks: :root[data-theme="dark"] { ... } and :root:not([data-theme="light"]) { ... }
    if (sels.length === 1 && /^:root(\[[^\]]*\]|:not\([^)]*\))+$/.test(sels[0])) {
      const keep = decls.filter((d) => !SHARED_TOKENS.has(d.prop));
      if (keep.length) out += `${sels[0]} ${WRAP}{${keep.map((d) => d.text).join(';')}}\n`;
      continue;
    }
    if (sels.every((x) => x === 'body')) decls = decls.filter((d) => !BODY_DROP.has(d.prop));
    const scoped = sels.map(scopeSelector).filter((x): x is string => x !== null);
    if (!scoped.length || !decls.length) continue;
    out += `${scoped.join(',')}{${decls.map((d) => d.text).join(';')}}\n`;
  }
  return out;
}

/** The page's own CSS, scoped to the wrapper, with the site's colours and no page-level layout of its own. */
export function scopeCss(css: string): string {
  return scopeRules(css.replace(/\/\*[\s\S]*?\*\//g, ''));
}

/** Stop a page from applying the theme it saved in the browser for itself: the site's setting is the only one. */
export function dropOwnTheme(html: string): string {
  return html.replace(/(?:store\.get|localStorage\.getItem)\(\s*(['"])(?:th|qz|jpm|fugue|kb)-theme\1\s*\)/g, 'null');
}

/**
 * Playback fixes for the delivered pages. Most of them fire each note from a requestAnimationFrame callback, using the time
 * since the last frame. A hidden tab, or a window the system has covered, gets no frames, so the music stops; and the first frame
 * after coming back finds minutes to catch up on and plays every note it missed at once. Here the same step also runs from a
 * timer (which keeps going while a page is making sound) that takes the place of the pending frame request, so there is still one
 * chain of steps, and one step never counts more than a quarter of a second.
 * Quantz's pages schedule on the audio clock already; they only skip a note that is more than 0.3 s late instead of playing it
 * at once. Each patch applies only where its anchor text is found.
 */
function frameFix(html: string): string {
  let out = html;
  // pages with `const step = now => { ... st.pos += (now - st.last) ... }` (the fugue, Quantz concerto, Blavet and Touhou excerpts)
  if (/st\.pos \+= \(now - st\.last\)/.test(out) && /let cur = null, raf = 0;/.test(out) && /\};\s*raf = requestAnimationFrame\(step\);/.test(out)) {
    out = out
      .replace(/let cur = null, raf = 0;/, 'let cur = null, raf = 0, timer = 0;')
      .replace(/(function stop\(\) \{ if \(!cur\) return; cancelAnimationFrame\(raf\);)/, '$1 clearInterval(timer);')
      .replace(/st\.pos \+= \(now - st\.last\)/, 'st.pos += Math.min(250, Math.max(0, now - st.last))')
      .replace(/(\};\s*)raf = requestAnimationFrame\(step\);/, '$1raf = requestAnimationFrame(step); timer = setInterval(() => { cancelAnimationFrame(raf); step(performance.now()); }, 25);');
  }
  // the Touhou analysis page: `const tick = now => { q += (now - last) ... raf = requestAnimationFrame(tick); }`
  if (/q \+= \(now - last\) \/ 1000/.test(out) && /let raf = 0, last = 0,/.test(out) && /\};\s*raf = requestAnimationFrame\(tick\);/.test(out)) {
    out = out
      .replace(/let raf = 0, last = 0,/, 'let raf = 0, timer = 0, last = 0,')
      .replace(/const stop = \(\) => \{ cancelAnimationFrame\(raf\);/, 'const stop = () => { cancelAnimationFrame(raf); clearInterval(timer);')
      .replace(/q \+= \(now - last\) \/ 1000/, 'q += Math.min(250, Math.max(0, now - last)) / 1000')
      .replace(/(\};\s*)raf = requestAnimationFrame\(tick\);/, '$1raf = requestAnimationFrame(tick); timer = setInterval(() => { cancelAnimationFrame(raf); tick(performance.now()); }, 25);');
  }
  return out;
}

/**
 * The playback of a delivered page, made to run on the audio clock (see playback.ts). A page whose player that does not know
 * gets the smaller frameFix instead; Quantz's exercises and First Lessons already schedule on the audio clock, and only skip a
 * note that is more than 0.3 s late rather than playing it at once. The sounds, which a page decodes when Play is first pressed
 * (a second or more on a slow machine), are decoded once the page is idle, or on the first pointer press.
 */
export function fixPlayback(html: string): string {
  let out = html;
  const clock = scheduleOnAudioClock(out);
  out = clock ?? frameFix(out);
  if (!out.includes('AC.currentTime - 0.3) continue;')) out = out.replace(/(const at = st\.offset \+ ev\.t;)/, '$1 if (at < AC.currentTime - 0.3) continue;');
  const warmable = /const PIANO = \(\(\) => \{/.test(out) || /return \{ seq, one, stop, ready, note \}/.test(out);
  if (warmable && !/\bwarmUpSamples\b/.test(out)) {
    out += `<script>/* warmUpSamples */(function () { var done = false; function warm() { if (done) return; done = true; try { if (typeof PIANO !== 'undefined') PIANO.ready(); else if (typeof PLAYER !== 'undefined' && PLAYER.ready) PLAYER.ready(); } catch (e) {} }
      addEventListener('pointerdown', warm, { once: true, passive: true });
      addEventListener('load', function () { setTimeout(function () { (window.requestIdleCallback || setTimeout)(warm, { timeout: 4000 }); }, 1200); }); })();</script>`;
  }
  return out;
}

/** The route (with its trailing slash) a file is shown at: /analysis/…/x.html is /analysis/…/x/, and …/index.html is …/. */
export function routeOf(url: string): string {
  const u = url.replace(/\.html$/, '');
  return (u.endsWith('/index') ? u.slice(0, -'index'.length) : u + '/').replace(/\/+$/, '/');
}

/**
 * Point the links between delivered pages at their routes, in the markup and in the strings of the scripts.
 * `known` holds the old addresses (/analysis/…/x.html) of all the delivered pages.
 */
export function rewriteLinks(html: string, fromUrl: string, known: Set<string>): string {
  const dir = posix.dirname(fromUrl);
  return html.replace(/(["'`])([^"'`\s<>\\#]+?\.html)((?:#[^"'`\s<>\\]*)?)(?=["'`])/g, (all, q: string, target: string, hash: string) => {
    if (/^[a-z]+:/i.test(target)) return all;
    const abs = target.startsWith('/') ? target : posix.normalize(posix.join(dir, decodeURI(target)));
    return known.has(abs) ? `${q}${routeOf(abs)}${hash}` : all;
  });
}

/** Pull the page-level style blocks (not the ones inside the engraved scores) out of a page, and strip the document shell. */
export function splitPage(html: string): { title: string; description: string; css: string; body: string } {
  // The scripts are set aside first: what looks like markup inside them (a <style> or <meta> in a string) is code, and stays.
  const scripts: string[] = [];
  const marked = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (all) => {
    scripts.push(all);
    return `@@script-${scripts.length - 1}@@`;
  });
  const svgRanges: [number, number][] = [];
  for (const m of marked.matchAll(/<svg[\s\S]*?<\/svg>/g)) svgRanges.push([m.index!, m.index! + m[0].length]);
  const inSvg = (at: number) => svgRanges.some(([x, y]) => at >= x && at < y);
  const css: string[] = [];
  let body = marked.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (all, text: string, at: number) => {
    if (inSvg(at)) return all;
    css.push(text);
    return '';
  });
  const title = (/<title>([^<]*)<\/title>/.exec(marked)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  const lead = /<p class="(?:lead|sub)"[^>]*>([\s\S]*?)<\/p>/.exec(body);
  const description = (lead ? lead[1] : '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  body = body
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<meta\b[^>]*>/g, '')
    .replace(/<link\b[^>]*>/g, '')
    .replace(/<\/?(html|head|body)\b[^>]*>/gi, '')
    .replace(/@@script-(\d+)@@/g, (_all, i: string) => scripts[Number(i)]);
  return { title, description, css: css.join('\n'), body };
}

/** Every delivered page: its old address (/analysis/…/x.html), found under src/static-pages/. Build time only. */
export function listStaticPages(): string[] {
  const root = join(process.cwd(), 'src', 'static-pages');
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push('/' + relative(root, p).split(sep).join('/'));
    }
  };
  walk(root);
  return out.sort();
}

export function readStaticPage(url: string): string {
  return readFileSync(join(process.cwd(), 'src', 'static-pages', url), 'utf8');
}
