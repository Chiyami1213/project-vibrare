import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bpmLabel, gameLabel, keyLabel, keysLabel, roleLabel } from '../src/scripts/touhou.ts';

const GAMES = JSON.parse(readFileSync(new URL('../src/data/touhou/games.json', import.meta.url), 'utf8'));

test('15 numbered games, Th06 to Th20, in order', () => {
  assert.deepEqual(GAMES.map((g) => g.number), [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.deepEqual(GAMES.map((g) => g.id), GAMES.map((g) => 'th' + String(g.number).padStart(2, '0')));
  assert.equal(gameLabel(GAMES[0]), 'Th06');
});

test('track counts match the cross-checked sources', () => {
  const counts = Object.fromEntries(GAMES.map((g) => [g.id, g.tracks.length]));
  assert.deepEqual(counts, { th06: 17, th07: 20, th08: 21, th09: 19, th10: 18, th11: 17, th12: 17, th13: 17, th14: 17, th15: 17, th16: 17, th17: 17, th18: 17, th19: 22, th20: 18 });
});

test('every track is numbered 1..n and has a title and scene', () => {
  for (const g of GAMES) {
    g.tracks.forEach((t, i) => {
      assert.equal(t.n, i + 1, `${g.id} #${i + 1}`);
      assert.ok(t.title.length > 0 && t.scene.length > 0, `${g.id} #${t.n}`);
      assert.ok(!/　/.test(t.title), `${g.id} #${t.n} has a full-width space`);
    });
  }
});

test('release years', () => {
  assert.deepEqual(GAMES.map((g) => g.year), [2002, 2003, 2004, 2005, 2007, 2008, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023, 2025]);
});

test('corrections found by cross-checking are in the data', () => {
  const title = (id, n) => GAMES.find((g) => g.id === id).tracks[n - 1].title;
  assert.equal(title('th13', 6), '素敵な墓場で暮しましょ');
  assert.equal(title('th13', 17), 'デザイアドリーム');
  assert.equal(title('th10', 1), '封印されし神々');
  assert.equal(title('th14', 5), '柳の下のデュラハン');
  assert.equal(title('th09', 10), 'お宇佐さまの素い幡');
  assert.equal(GAMES.find((g) => g.id === 'th06').tracks.length, 17); // remake bonus track left out
});

test('role labels', () => {
  const g = (id) => GAMES.find((x) => x.id === id);
  assert.deepEqual(roleLabel(g('th06').tracks[0]), { label: 'Title screen' });
  assert.deepEqual(roleLabel(g('th06').tracks[1]), { label: 'Stage 1' });
  assert.deepEqual(roleLabel(g('th06').tracks[2]), { label: 'Stage 1 boss', character: 'ルーミア' });
  assert.deepEqual(roleLabel(g('th06').tracks[14]), { label: 'Extra boss', character: 'フランドール・スカーレット' });
  assert.deepEqual(roleLabel(g('th06').tracks[15]), { label: 'Ending' });
  assert.deepEqual(roleLabel(g('th09').tracks[1]), { label: 'Character theme', character: '博麗霊夢' });
  assert.deepEqual(roleLabel(g('th09').tracks[15]), { label: '会話イベント1' });
});

// ---- BPM and keys from the Touhou Music Database wiki (atwiki)
const KEY_CODES = ['Am', 'Bbm/A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'Ebm/D#m', 'Em', 'Fm', 'F#m', 'Gm', 'Abm/G#m', 'Chromatic', 'Major Scale'];

test('BPM and key data: well-formed, and complete for the early games', () => {
  let withBpm = 0;
  let withKey = 0;
  for (const g of GAMES) {
    for (const t of g.tracks) {
      if (t.bpm) {
        withBpm++;
        assert.ok(t.bpm.length >= 1 && t.bpm.length <= 3, `${g.id} #${t.n}`);
        for (const v of t.bpm) assert.ok(typeof v === 'number' && v >= 60 && v <= 260, `${g.id} #${t.n} bpm ${v}`);
        assert.deepEqual(t.bpm, [...t.bpm].sort((a, b) => b - a), `${g.id} #${t.n} is not largest first`);
      }
      if (t.keys) {
        withKey++;
        for (const k of t.keys) {
          assert.ok(KEY_CODES.includes(k.key), `${g.id} #${t.n} key ${k.key}`);
          assert.match(k.range, /^\d+:\d{2}～(\d+:\d{2})?$/, `${g.id} #${t.n} range ${k.range}`);
        }
      }
    }
  }
  assert.equal(withBpm, 163);
  assert.equal(withKey, 140);
  // Th06 is complete on the wiki
  for (const t of GAMES[0].tracks) assert.ok(t.bpm && t.keys, `th06 #${t.n}`);
  assert.deepEqual(GAMES[0].tracks[0].bpm, [146, 143]);
});

test('BPM and key labels', () => {
  assert.equal(bpmLabel([146, 143]), '146 / 143');
  assert.equal(bpmLabel([160.73]), '160.73');
  assert.equal(bpmLabel(undefined), '');
  assert.equal(keyLabel('Am'), 'A minor');
  assert.equal(keyLabel('Ebm/D#m'), 'E♭/D♯ minor');
  assert.equal(keyLabel('F#m'), 'F♯ minor');
  assert.equal(keyLabel('Chromatic'), 'Chromatic');
  assert.equal(keyLabel('Major Scale'), 'Major');
  assert.equal(keyLabel('???'), '???');
  // keys come in the order they are heard, with repeats merged
  const keys = [
    { key: 'Dm', range: '0:00～0:46' },
    { key: 'Dm', range: '1:13～1:26' },
    { key: 'Fm', range: '0:46～1:12' },
  ];
  assert.equal(keysLabel(keys), 'D minor → F minor → D minor');
  assert.equal(keysLabel([{ key: 'Ebm/D#m', range: '0:00～' }]), 'E♭/D♯ minor');
  assert.equal(keysLabel(undefined), '');
  assert.equal(keyLabel('Ebm/D#m', true), 'E♭/D♯m');
  const long = ['Dm', 'F#m', 'Ebm/D#m', 'F#m'].map((key, i) => ({ key, range: `${i}:00～` }));
  assert.equal(keysLabel(long), 'Dm → F♯m → E♭/D♯m → F♯m'); // four keys: short form
});

test('a typo on the wiki is corrected: Th09 #2 has a key range ending 1:45, not "1;45"', () => {
  const t = GAMES[3].tracks[1];
  assert.equal(t.title, '春色小径 ～ Colorful Path');
  assert.ok(t.keys.some((k) => k.range === '1:20～1:45'));
});
