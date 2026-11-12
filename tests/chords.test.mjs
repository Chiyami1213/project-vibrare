import test from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, CHORD_GROUPS, LETTERS } from '../src/scripts/theory.ts';
import { chordInfo, findChord, parseRoot, rootParam, inversionLabel } from '../src/scripts/chords.ts';

const info = (root, id, inv = 0) => {
  const r = parseRoot(root);
  return chordInfo(r.letter, r.alter, findChord(id), inv);
};
const names = (i) => i.notes.map((n) => n.name).join(' ');

test('catalogue: unique ids, grouped by size, every chord has a symbol', () => {
  assert.equal(new Set(CHORDS.map((c) => c.id)).size, CHORDS.length);
  assert.deepEqual(CHORD_GROUPS.map((g) => [g.size, g.chords.length]), [[3, 7], [4, 24], [5, 20], [6, 10]]);
  assert.equal(CHORD_GROUPS.reduce((n, g) => n + g.chords.length, 0), CHORDS.length);
  for (const c of CHORDS) assert.equal(typeof c.symbol, 'string', c.id);
});

test('the chord from the reference URL: B-flat half-diminished 7th', () => {
  const i = info('Bb', 'half-diminished7');
  assert.equal(i.symbol, 'B♭ø7');
  assert.equal(names(i), 'B♭ D♭ F♭ A♭'); // the diminished fifth above B♭ is F♭
  assert.deepEqual(i.aka, ['B♭m7(♭5)']);
});

test('chord lookup tolerates hyphenation', () => {
  assert.equal(findChord('half-diminished7').id, 'half-diminished-7');
  assert.equal(findChord('dominant7').id, 'dominant-7');
  assert.equal(findChord('major-7').id, 'major-7');
  assert.equal(findChord('nope'), undefined);
});

test('roots parse and serialise', () => {
  assert.deepEqual(parseRoot('F♯'), { letter: 3, alter: 1 });
  assert.deepEqual(parseRoot('Bb'), { letter: 6, alter: -1 });
  assert.deepEqual(parseRoot('c'), { letter: 0, alter: 0 });
  assert.equal(parseRoot('H'), null);
  assert.equal(rootParam(6, -1), 'Bb');
  assert.equal(rootParam(3, 1), 'F#');
});

test('inversions and slash names', () => {
  const c = info('C', 'major');
  assert.equal(c.display, 'C');
  const first = info('C', 'major', 1);
  assert.equal(names(first), 'E G C');
  assert.equal(first.display, 'C/E');
  assert.equal(first.inversionLabel, '1st inversion');
  const second = info('C', 'major', 2);
  assert.equal(names(second), 'G C E');
  assert.equal(second.display, 'C/G');
  const third = info('G', 'dominant-7', 3);
  assert.equal(third.display, 'G7/F');
  assert.equal(names(third), 'F G B D');
  assert.equal(inversionLabel(0), 'Root position');
  assert.equal(inversionLabel(3), '3rd inversion');
});

test('inversions are clamped to the chord size', () => {
  assert.equal(info('C', 'major', 9).inversion, 2);
  assert.equal(info('C', 'major', -3).inversion, 0);
});

test('voicing is ascending, bass stays between C3 and B3, notes are one octave stack', () => {
  for (const c of CHORDS) {
    for (const letter of LETTERS.keys()) {
      for (const alter of [-1, 0, 1]) {
        for (let inv = 0; inv < c.intervals.length; inv++) {
          const i = chordInfo(letter, alter, c, inv);
          const m = i.notes.map((n) => n.midi);
          assert.deepEqual(m, [...m].sort((a, b) => a - b), `${c.id} ${letter}${alter} inv${inv}`);
          assert.ok(m[0] >= 48 && m[0] <= 59, `bass ${m[0]} for ${c.id}`);
          assert.ok(m[m.length - 1] - m[0] <= 33, `span for ${c.id}`);
          assert.equal(i.notes.length, c.intervals.length);
        }
      }
    }
  }
});

test('midi pitches: C major root position is C3 E3 G3; Bb half-diminished', () => {
  assert.deepEqual(info('C', 'major').notes.map((n) => n.midi), [48, 52, 55]);
  assert.deepEqual(info('C', 'major', 1).notes.map((n) => n.midi), [52, 55, 60]);
  assert.deepEqual(info('Bb', 'half-diminished-7').notes.map((n) => n.midi), [58, 61, 64, 68]);
});

test('chord DNA splits root, internal notes, colours and bass', () => {
  const d = info('C', 'dominant-9', 1).dna;
  assert.equal(d.root.name, 'C');
  assert.deepEqual(d.internal.map((n) => n.name), ['E', 'G', 'B♭']);
  assert.deepEqual(d.colors.map((n) => n.name), ['D']);
  assert.equal(d.bass.name, 'E');
  const six = info('C', 'six-nine').dna;
  assert.deepEqual(six.internal.map((n) => n.name), ['E', 'G', 'A']);
  assert.deepEqual(six.colors.map((n) => n.name), ['D']);
});

test('extended chords are spelled correctly', () => {
  assert.equal(names(info('C', 'dominant-7-sharp-9')), 'C E G B♭ D♯');
  assert.equal(names(info('C', 'dominant-7-b13')), 'C E G B♭ A♭');
  assert.equal(names(info('C', 'dominant-7-9-b13')), 'C E G B♭ D A♭');
  assert.equal(names(info('C', 'add-sharp-11')), 'C E G F♯');
  assert.equal(names(info('C', 'minor-7-9-11')), 'C E♭ G B♭ D F');
  assert.equal(names(info('C', 'augmented-major-9')), 'C E G♯ B D');
  assert.equal(names(info('F♯', 'major')), 'F♯ A♯ C♯');
  assert.equal(info('B', 'half-diminished-7').symbol, 'Bø7');
});

test('DNA keeps chord order in inversions', () => {
  const d = info('A', 'dominant-9', 2).dna;
  assert.deepEqual(d.internal.map((n) => n.name), ['C♯', 'E', 'G']);
  assert.deepEqual(d.colors.map((n) => n.name), ['B']);
  assert.equal(d.bass.name, 'E');
});
