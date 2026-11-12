import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCLE, keyInfo, signature, signatureText, tonicName } from '../src/scripts/circle.ts';

const names = (list) => list.map((n) => n.name).join(' ');

test('circle goes up a fifth each step and ends where it started', () => {
  assert.equal(CIRCLE.length, 12);
  const majors = CIRCLE.map((_, i) => tonicName(i, 'major'));
  assert.deepEqual(majors, ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F']);
  const minors = CIRCLE.map((_, i) => tonicName(i, 'minor'));
  assert.deepEqual(minors, ['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'B♭', 'F', 'C', 'G', 'D']);
});

test('every key signature matches the accidentals of its spelled scale (major and relative minor)', () => {
  CIRCLE.forEach((key, i) => {
    for (const mode of ['major', 'minor']) {
      const info = keyInfo(i, mode);
      const accidentals = info.scale.map((n) => n.name).filter((n) => /[♯♭]/u.test(n)).sort();
      assert.deepEqual(accidentals, [...signature(key.fifths)].sort(), `${info.title}`);
    }
  });
});

test('relative keys share notes', () => {
  CIRCLE.forEach((_, i) => {
    assert.deepEqual([...keyInfo(i, 'major').scale.map((n) => n.name)].sort(), [...keyInfo(i, 'minor').scale.map((n) => n.name)].sort());
  });
});

test('signature text', () => {
  assert.equal(signatureText(0), 'No sharps or flats');
  assert.equal(signatureText(1), '1 sharp: F♯');
  assert.equal(signatureText(-2), '2 flats: B♭ E♭');
  assert.equal(signatureText(6), '6 sharps: F♯ C♯ G♯ D♯ A♯ E♯');
});

test('neighbours and chords', () => {
  const g = keyInfo(1, 'major');
  assert.equal(g.title, 'G major');
  assert.equal(g.relative, 'E minor');
  assert.equal(g.dominant, 'D major');
  assert.equal(g.subdominant, 'C major');
  assert.equal(names(g.chords), 'G Am Bm C D Em F♯°');
  assert.equal(g.chords.map((c) => c.interval).join(' '), 'I ii iii IV V vi vii°');
  const c = keyInfo(0, 'major');
  assert.equal(c.subdominant, 'F major'); // wraps around
  const am = keyInfo(0, 'minor');
  assert.equal(names(am.chords), 'Am B° C Dm Em F G');
  assert.equal(am.relative, 'C major');
  const f = keyInfo(11, 'major');
  assert.equal(f.dominant, 'C major'); // wraps around the other way
  assert.equal(names(keyInfo(7, 'major').chords), 'D♭ E♭m Fm G♭ A♭ B♭m C°');
  // enharmonic spelling at the bottom of the circle follows the side we are on
  assert.equal(keyInfo(7, 'major').subdominant, 'G♭ major');
  assert.equal(keyInfo(6, 'major').dominant, 'C♯ major');
  assert.equal(keyInfo(7, 'minor').subdominant, 'E♭ minor');
  assert.equal(keyInfo(6, 'minor').dominant, 'A♯ minor');
  assert.equal(keyInfo(5, 'major').dominant, 'F♯ major'); // sharp side keeps F♯
  assert.equal(keyInfo(8, 'major').subdominant, 'D♭ major');
});
