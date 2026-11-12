import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCLE, keyInfo, scaleMidis, signature, signatureText, tonicName, tonicMidis } from '../src/scripts/circle.ts';

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

import { chordShape, diatonicChords, noteToPc, pcPosition } from '../src/scripts/circle.ts';

test('pitch classes sit on the circle of fifths', () => {
  assert.equal(pcPosition(0), 0); // C
  assert.equal(pcPosition(7), 1); // G
  assert.equal(pcPosition(2), 2); // D
  assert.equal(pcPosition(6), 6); // F sharp
  assert.equal(pcPosition(5), 11); // F
  assert.equal(noteToPc(1, -1), 1); // D flat
});

test('chord shapes: triangle, square, equilateral triangle', () => {
  const C = (...pcs) => chordShape(pcs);
  assert.equal(C(0, 4, 7).name, 'Triangle'); // C major triad
  assert.deepEqual(C(0, 4, 7).gaps, [1, 3, 8]);
  assert.equal(C(0, 4, 8).name, 'Equilateral triangle'); // C augmented
  assert.equal(C(0, 3, 6, 9).name, 'Square'); // C diminished 7th
  assert.deepEqual(C(0, 3, 6, 9).gaps, [3, 3, 3, 3]);
  assert.equal(C(0, 4, 7, 10).name, 'Quadrilateral'); // C7
  assert.equal(C(0, 2, 4, 6, 8, 10).name, 'Regular hexagon'); // whole-tone set
  assert.equal(C(0, 4, 7, 11, 2).name, 'Pentagon'); // Cmaj9
  for (const s of [C(0, 4, 7), C(0, 3, 6, 9), C(0, 2, 4, 6, 8, 10)]) assert.equal(s.gaps.reduce((a, b) => a + b, 0), 12);
});

test('diatonic chords of a key', () => {
  const g = diatonicChords(1, 'major'); // G major
  assert.deepEqual(g.map((c) => c.roman), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  assert.deepEqual(g.map((c) => c.chordId), ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
  assert.deepEqual([g[6].letter, g[6].alter], [3, 1]); // F sharp
  const g7 = diatonicChords(1, 'major', true);
  assert.deepEqual(g7.map((c) => c.roman), ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7']);
  const am = diatonicChords(0, 'minor', true);
  assert.deepEqual(am.map((c) => c.roman), ['i7', 'iiø7', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7']);
});

test('the tonic chord and the scale played for a key', () => {
  assert.deepEqual(tonicMidis(0, 'major').map((m) => m % 12), [0, 4, 7]); // C E G
  assert.deepEqual(tonicMidis(0, 'minor').map((m) => m % 12), [9, 0, 4]); // A minor: A C E
  for (let pos = 0; pos < 12; pos++) {
    for (const mode of ['major', 'minor']) {
      const scale = scaleMidis(pos, mode);
      assert.equal(scale.length, 8, `${pos} ${mode}`);
      assert.equal(scale[7] - scale[0], 12, 'ends an octave above the tonic');
      for (let i = 1; i < 8; i++) assert.ok(scale[i] > scale[i - 1] && scale[i] - scale[i - 1] <= 2, `${pos} ${mode} step ${i}`);
      assert.ok(scale[0] >= 55 && scale[0] <= 66, `register ${scale[0]}`);
    }
  }
  assert.deepEqual(scaleMidis(0, 'major').map((m) => m % 12), [0, 2, 4, 5, 7, 9, 11, 0]);
  assert.deepEqual(scaleMidis(1, 'major').map((m) => m % 12), [7, 9, 11, 0, 2, 4, 6, 7]); // G major
});
