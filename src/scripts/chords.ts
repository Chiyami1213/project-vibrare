// Chord calculator logic: inversions, slash-chord names, piano voicing, "chord DNA". No DOM.
import { CHORDS, LETTERS, applyInterval, makeRoot, noteName, parseInterval } from './theory.ts';
import type { Pattern } from './theory.ts';

const NATURAL = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

export type Role = 'root' | 'internal' | 'color';

export interface ChordNote {
  name: string; // correctly spelled, e.g. "B♭"
  interval: string; // above the root, e.g. "m7"
  midi: number; // sounding pitch in this voicing
  role: Role;
}

export interface ChordInfo {
  display: string; // "B♭ø7" or "B♭ø7/D♭" for an inversion
  symbol: string; // "B♭ø7"
  fullName: string; // "B♭ Half-diminished 7th"
  aka: string[]; // other spellings of the symbol, with the same root
  inversion: number;
  inversionLabel: string;
  notes: ChordNote[]; // ascending from the bass note
  bass: ChordNote;
  dna: { root: ChordNote; internal: ChordNote[]; colors: ChordNote[]; bass: ChordNote };
}

export function inversionLabel(k: number): string {
  return k === 0 ? 'Root position' : `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} inversion`;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find a chord by id; tolerates other hyphenation, e.g. "half-diminished7". */
export function findChord(idLike: string): Pattern | undefined {
  const want = squash(idLike);
  return CHORDS.find((c) => c.id === idLike) ?? CHORDS.find((c) => squash(c.id) === want);
}

/** "Bb", "C#", "F♯", "g" -> { letter, alter }; null if it is not a note name. */
export function parseRoot(text: string): { letter: number; alter: number } | null {
  const m = /^([A-Ga-g])([#b♯♭]?)$/.exec(text.trim());
  if (!m) return null;
  const letter = LETTERS.indexOf(m[1].toUpperCase());
  const alter = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return { letter, alter };
}

export function rootParam(letter: number, alter: number): string {
  return LETTERS[letter] + (alter > 0 ? '#' : alter < 0 ? 'b' : '');
}

function roleOf(interval: string): Role {
  const p = parseInterval(interval);
  if (p.steps === 0) return 'root';
  return p.steps >= 8 ? 'color' : 'internal'; // 9ths, 11ths and 13ths are the colours
}

export function chordInfo(letter: number, alter: number, chord: Pattern, inversion: number): ChordInfo {
  const size = chord.intervals.length;
  const k = Math.max(0, Math.min(size - 1, Math.floor(inversion)));
  const root = makeRoot(letter, alter);
  const rootMidi = 48 + NATURAL[letter] + alter; // around C3, adjusted below

  let tones = chord.intervals.map((code) => ({
    name: noteName(applyInterval(root, parseInterval(code), 'up')),
    interval: code,
    midi: rootMidi + parseInterval(code).semitones,
    role: roleOf(code),
  }));
  // inversion k: the k lowest notes move up an octave
  tones = tones.map((t, i) => (i < k ? { ...t, midi: t.midi + 12 } : t)).sort((a, b) => a.midi - b.midi);
  // keep the bass between C3 and B3
  let shift = 0;
  while (tones[0].midi + shift > 59) shift -= 12;
  while (tones[0].midi + shift < 48) shift += 12;
  const notes: ChordNote[] = tones.map((t) => ({ ...t, midi: t.midi + shift }));

  // the DNA lists notes in chord order (root, third, fifth...), whatever the inversion
  const inChordOrder = chord.intervals.map((code) => notes.find((n) => n.interval === code)!);

  const rootName = noteName(root);
  const symbol = rootName + (chord.symbol ?? '');
  const bass = notes[0];
  return {
    display: k === 0 ? symbol : `${symbol}/${bass.name}`,
    symbol,
    fullName: `${rootName} ${chord.name}`,
    aka: (chord.aka ?? []).map((a) => rootName + a),
    inversion: k,
    inversionLabel: inversionLabel(k),
    notes,
    bass,
    dna: {
      root: inChordOrder[0],
      internal: inChordOrder.filter((n) => n.role === 'internal'),
      colors: inChordOrder.filter((n) => n.role === 'color'),
      bass,
    },
  };
}
