import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gameLabel, roleLabel } from '../src/scripts/touhou.ts';

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
