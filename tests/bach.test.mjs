import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const WTC = JSON.parse(readFileSync(new URL('../src/data/bach/wtc.json', import.meta.url), 'utf8'));

test('48 pieces, BWV 846 to 893 in order, 24 per book', () => {
  assert.deepEqual(WTC.map((p) => p.bwv), Array.from({ length: 48 }, (_, i) => 846 + i));
  assert.equal(WTC.filter((p) => p.book === 1).length, 24);
  assert.equal(WTC.filter((p) => p.book === 2).length, 24);
  for (const book of [1, 2]) assert.deepEqual(WTC.filter((p) => p.book === book).map((p) => p.no), Array.from({ length: 24 }, (_, i) => i + 1));
});

test('keys rise by semitone, major then parallel minor, in both books', () => {
  const order = ['C major', 'C minor', 'C♯ major', 'C♯ minor', 'D major', 'D minor', 'E♭ major', 'E♭ minor', 'E major', 'E minor', 'F major', 'F minor', 'F♯ major', 'F♯ minor', 'G major', 'G minor', 'A♭ major', 'G♯ minor', 'A major', 'A minor', 'B♭ major', 'B♭ minor', 'B major', 'B minor'];
  const norm = (k) => (k === 'D♯ minor' ? 'E♭ minor' : k); // enharmonic spelling used by the sources for No. 8
  for (const book of [1, 2]) {
    assert.deepEqual(WTC.filter((p) => p.book === book).map((p) => norm(p.fugueKey)), order, `book ${book}`);
  }
});

test('prelude and fugue share a key except where the sources say otherwise', () => {
  const differ = WTC.filter((p) => p.preludeKey !== p.fugueKey).map((p) => [p.bwv, p.preludeKey, p.fugueKey]);
  assert.deepEqual(differ, [[853, 'E♭ minor', 'D♯ minor']]);
});

test('voice counts agree with independent sources', () => {
  const v = (bwv) => WTC.find((p) => p.bwv === bwv).voices;
  assert.equal(v(846), 4);
  assert.equal(v(848), 3);
  assert.equal(v(855), 2); // the only two-voice fugue
  assert.equal(v(867), 5);
  assert.equal(v(881), 3);
  assert.ok(WTC.every((p) => p.voices >= 2 && p.voices <= 5));
});
