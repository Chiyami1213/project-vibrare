import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, SCALES, CHORDS, INTERVALS, parseInterval, applyInterval, spell, makeRoot, noteName } from '../src/scripts/theory.ts';

const root = (name) => {
  const letter = LETTERS.indexOf(name[0]);
  const alter = name.length === 1 ? 0 : name[1] === '#' ? 1 : -1;
  return makeRoot(letter, alter);
};
const names = (r, list, close) => spell(root(r), list, close).map((n) => n.name).join(' ');
const find = (arr, id) => arr.find((p) => p.id === id);

test('interval semitones', () => {
  const s = Object.fromEntries(INTERVALS.map((i) => [i.code, i.semitones]));
  assert.deepEqual(s, { P1: 0, m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, A4: 6, d5: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12 });
  assert.equal(parseInterval('d7').semitones, 9);
  assert.equal(parseInterval('M9').semitones, 14);
  assert.equal(parseInterval('P8').name, 'Perfect octave');
});

test('intervals are spelled correctly, up and down', () => {
  const up = (r, code) => noteName(applyInterval(root(r), parseInterval(code), 'up'));
  const down = (r, code) => noteName(applyInterval(root(r), parseInterval(code), 'down'));
  assert.equal(up('F#', 'M3'), 'A♯');
  assert.equal(up('C', 'd5'), 'G♭');
  assert.equal(up('C', 'A4'), 'F♯');
  assert.equal(up('B', 'M2'), 'C♯');
  assert.equal(up('E', 'm2'), 'F');
  assert.equal(up('Bb', 'P5'), 'F');
  assert.equal(down('C', 'M3'), 'A♭');
  assert.equal(down('C', 'P5'), 'F');
  assert.equal(down('F', 'P4'), 'C');
  assert.equal(down('D', 'm2'), 'C♯');
  assert.equal(up('C', 'P8'), 'C');
});

test('scales', () => {
  assert.equal(names('C', find(SCALES, 'major'), true), 'C D E F G A B C');
  assert.equal(names('F#', find(SCALES, 'major')), 'F♯ G♯ A♯ B C♯ D♯ E♯');
  assert.equal(names('Eb', find(SCALES, 'major')), 'E♭ F G A♭ B♭ C D');
  assert.equal(names('A', find(SCALES, 'natural-minor')), 'A B C D E F G');
  assert.equal(names('A', find(SCALES, 'harmonic-minor')), 'A B C D E F G♯');
  assert.equal(names('A', find(SCALES, 'melodic-minor')), 'A B C D E F♯ G♯');
  assert.equal(names('D', find(SCALES, 'dorian')), 'D E F G A B C');
  assert.equal(names('E', find(SCALES, 'phrygian')), 'E F G A B C D');
  assert.equal(names('F', find(SCALES, 'lydian')), 'F G A B C D E');
  assert.equal(names('B', find(SCALES, 'locrian')), 'B C D E F G A');
  assert.equal(names('C', find(SCALES, 'major-pentatonic')), 'C D E G A');
  assert.equal(names('C', find(SCALES, 'whole-tone')), 'C D E F♯ G♯ B♭');
});

test('chords', () => {
  assert.equal(names('C', find(CHORDS, 'major')), 'C E G');
  assert.equal(names('A', find(CHORDS, 'minor')), 'A C E');
  assert.equal(names('B', find(CHORDS, 'diminished')), 'B D F');
  assert.equal(names('C', find(CHORDS, 'augmented')), 'C E G♯');
  assert.equal(names('G', find(CHORDS, 'dominant-7')), 'G B D F');
  assert.equal(names('B', find(CHORDS, 'diminished-7')), 'B D F A♭');
  assert.equal(names('B', find(CHORDS, 'half-diminished-7')), 'B D F A');
  assert.equal(names('F#', find(CHORDS, 'major')), 'F♯ A♯ C♯');
  assert.equal(names('C', find(CHORDS, 'dominant-9')), 'C E G B♭ D');
  assert.equal(names('Eb', find(CHORDS, 'minor-7')), 'E♭ G♭ B♭ D♭');
});

test('rare triple accidentals are written out', () => {
  assert.equal(names('Cb', find(CHORDS, 'diminished-7')), 'C♭ E𝄫 G𝄫 B𝄫♭');
});

test('every pattern spells on every natural/flat/sharp root', () => {
  for (const l of LETTERS.keys()) for (const a of [-1, 0, 1]) {
    for (const p of [...SCALES, ...CHORDS]) {
      for (const n of spell(makeRoot(l, a), p, true)) assert.match(n.name, /^[A-G][♭♯𝄫𝄪]*$/u, `${p.id} ${l}${a}: ${n.name}`);
    }
  }
});
