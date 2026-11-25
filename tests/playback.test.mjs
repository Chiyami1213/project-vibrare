import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleOnAudioClock, LOOKAHEAD } from '../src/lib/playback.ts';
import { fixPlayback, listStaticPages, readStaticPage } from '../src/lib/static-pages.ts';

// These tests read the real delivered pages (src/static-pages/), so a page that arrives with a player this rewrite does not
// recognise is found here, not by someone listening to it.

const pages = listStaticPages().map((url) => ({ url, html: readStaticPage(url) }));
const frameDriven = (html) => /st\.pos \+= \(now - st\.last\)/.test(html) || /q \+= \(now - last\) \/ 1000/.test(html) || /timer = setTimeout\(step, d \* 1000\)/.test(html);

test('every page with a frame-driven or timeout-driven player is rewritten to the audio clock', () => {
  const players = pages.filter((p) => frameDriven(p.html));
  assert.ok(players.length >= 60, `expected the fugue, concerto, Blavet, Touhou and Japanese pages, found ${players.length}`);
  for (const { url, html } of players) {
    const out = scheduleOnAudioClock(html);
    assert.ok(out, `${url}: the player was not recognised`);
    assert.doesNotMatch(out, /st\.pos \+= \(now - st\.last\)|q \+= \(now - last\)|setTimeout\(step, d \* 1000\)/, `${url}: a frame or timeout step is left`);
    assert.match(out, /noteAt\(|note\(m\[i\], d \* 0\.95, 0\.62, next\)/, `${url}: notes are not given an audio time`);
  }
});

test('the rewritten players hand notes over ahead of the clock and silence them on Stop', () => {
  for (const url of ['/analysis/baroque/bach/fugue-analysis/wtc-1/bwv850-fugue-analysis.html', '/analysis/baroque/blavet/la-vibray/i-andante.html', '/analysis/touhou/analysis/th11-09-satori-phase4.html']) {
    const out = fixPlayback(pages.find((p) => p.url === url).html);
    assert.match(out, new RegExp(`const LOOK = ${LOOKAHEAD};`), url);
    assert.match(out, /function stop\(natural\) \{ if \(!cur\) return; cancelAnimationFrame\(raf\); clearInterval\(timer\); if \(!natural\) PIANO\.mute\(\(\) => false\);/, url);
    assert.match(out, /if \(st\.pos > end \+ 0\.2\) \{ stop\(true\); return; \}/, url);
    assert.match(out, /timer = setInterval\(step, 25\);/, url);
    assert.match(out, /get time\(\) \{ return AC \? AC\.currentTime : 0; \}/, url);
    assert.match(out, /t = Math\.max\(AC\.currentTime \+ 0\.005, at == null \? AC\.currentTime \+ 0\.02 : at\)/, url);
  }
});

test('the Japanese guides keep their gain nodes so that Stop can silence what is already scheduled', () => {
  const out = fixPlayback(pages.find((p) => p.url.endsWith('japanese-music/chapter-6.html')).html);
  assert.match(out, /function stop\(natural\) \{ clearInterval\(timer\); timer = null; if \(!natural\) silence\(\);/);
  assert.match(out, /live\.push\(\{ g: out, end: t \+ hold \+ 0\.3 \}\)/);
  assert.match(out, /pump\(\); timer = setInterval\(pump, 25\);/);
});

test('Touhou analysis: the clock is set wherever the position is set, and a redraw does not repeat notes', () => {
  const out = fixPlayback(pages.find((p) => p.url.endsWith('th11-09-satori-analysis.html')).html);
  assert.equal((out.match(/qa = q; aa = PIANO\.time \+ 0\.05; tp = \+sl\.value; su = q;/g) ?? []).length, 2);
  assert.match(out, /si = stAll\.findIndex\(x => x\.t >= Math\.max\(q, su\) - 1e-6\);/);
  assert.doesNotMatch(out, /\blast\b = |\(now - last\)/);
});

test('the rewrite is repeatable, and leaves a page without a player alone', () => {
  for (const { html } of pages.slice(0, 80).filter((p) => frameDriven(p.html)).filter((_, i) => i % 9 === 0)) {
    const once = fixPlayback(html);
    assert.equal(fixPlayback(once), once);
  }
  assert.equal(scheduleOnAudioClock('<p>no player</p>'), null);
  assert.equal(fixPlayback('<p>no player</p>'), '<p>no player</p>');
});
