// Music-theory helpers for the calculators. Pure functions, no DOM.
// Notes are spelled correctly: a third above F# is A#, not Bb.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = [0, 2, 4, 5, 7, 9, 11]; // semitones above C for C D E F G A B

export interface Note {
  letter: number; // index into LETTERS
  alter: number; // semitones above/below the natural letter (-1 = flat, 1 = sharp, ...)
  octave: number;
}

export function noteName(n: Pick<Note, 'letter' | 'alter'>): string {
  const a = Math.abs(n.alter);
  // double sharps/flats first, then a single one: 3 -> 𝄪♯ , -3 -> 𝄫♭
  const sym = n.alter > 0 ? '𝄪'.repeat(Math.floor(a / 2)) + '♯'.repeat(a % 2) : '𝄫'.repeat(Math.floor(a / 2)) + '♭'.repeat(a % 2);
  return LETTERS[n.letter] + sym;
}

const semis = (n: Note) => n.octave * 12 + NATURAL[n.letter] + n.alter;

/** Move a note by `steps` letter names and `semitones` half steps (both signed). */
export function transpose(n: Note, steps: number, semitones: number): Note {
  const abs = n.octave * 7 + n.letter + steps;
  const octave = Math.floor(abs / 7);
  const letter = ((abs % 7) + 7) % 7;
  const alter = semis(n) + semitones - (octave * 12 + NATURAL[letter]);
  return { letter, octave, alter };
}

// ---------- Intervals ----------

export interface Interval {
  code: string; // e.g. "M3"
  name: string; // e.g. "Major 3rd"
  steps: number; // letter-name steps (3rd = 2)
  semitones: number;
}

const PERFECT_BASE: Record<number, number> = { 1: 0, 4: 5, 5: 7 };
const MAJOR_BASE: Record<number, number> = { 2: 2, 3: 4, 6: 9, 7: 11 };
const QUALITY_NAME: Record<string, string> = {
  P: 'Perfect',
  M: 'Major',
  m: 'Minor',
  A: 'Augmented',
  d: 'Diminished',
};

function ordinal(n: number): string {
  if (n === 1) return 'unison';
  if (n === 8) return 'octave';
  const suffix = n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

/** Parse a code such as "P5", "m3", "d7", "M9" (numbers above 7 add an octave). */
export function parseInterval(code: string): Interval {
  const quality = code[0];
  const number = Number(code.slice(1));
  const simple = number === 8 ? 8 : ((number - 1) % 7) + 1;
  const octaves = number === 8 ? 0 : Math.floor((number - 1) / 7);
  const perfectKind = simple in PERFECT_BASE;
  let base: number;
  if (simple === 8) base = 12;
  else if (perfectKind) base = PERFECT_BASE[simple];
  else base = MAJOR_BASE[simple];
  let offset = 0;
  if (quality === 'A') offset = 1;
  else if (quality === 'm') offset = -1;
  else if (quality === 'd') offset = perfectKind || simple === 8 ? -1 : -2;
  else if (quality !== 'P' && quality !== 'M') throw new Error(`Bad interval ${code}`);
  return {
    code,
    name: `${QUALITY_NAME[quality]} ${ordinal(number)}`,
    steps: number - 1,
    semitones: base + offset + octaves * 12,
  };
}

export const INTERVALS: Interval[] = [
  'P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8',
].map(parseInterval);

export function applyInterval(start: Note, interval: Interval, direction: 'up' | 'down'): Note {
  const sign = direction === 'up' ? 1 : -1;
  return transpose(start, sign * interval.steps, sign * interval.semitones);
}

// ---------- Scales and chords ----------

export interface Pattern {
  id: string;
  name: string;
  intervals: string[]; // interval codes above the root
}

export const SCALES: Pattern[] = [
  { id: 'major', name: 'Major (Ionian)', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'] },
  { id: 'natural-minor', name: 'Natural minor (Aeolian)', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'] },
  { id: 'harmonic-minor', name: 'Harmonic minor', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'] },
  { id: 'melodic-minor', name: 'Melodic minor (ascending)', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'] },
  { id: 'dorian', name: 'Dorian', intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'] },
  { id: 'phrygian', name: 'Phrygian', intervals: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'] },
  { id: 'lydian', name: 'Lydian', intervals: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'] },
  { id: 'locrian', name: 'Locrian', intervals: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'] },
  { id: 'major-pentatonic', name: 'Major pentatonic', intervals: ['P1', 'M2', 'M3', 'P5', 'M6'] },
  { id: 'minor-pentatonic', name: 'Minor pentatonic', intervals: ['P1', 'm3', 'P4', 'P5', 'm7'] },
  { id: 'blues', name: 'Blues', intervals: ['P1', 'm3', 'P4', 'A4', 'P5', 'm7'] },
  { id: 'whole-tone', name: 'Whole tone', intervals: ['P1', 'M2', 'M3', 'A4', 'A5', 'm7'] },
];

export const CHORDS: Pattern[] = [
  { id: 'major', name: 'Major', intervals: ['P1', 'M3', 'P5'] },
  { id: 'minor', name: 'Minor', intervals: ['P1', 'm3', 'P5'] },
  { id: 'diminished', name: 'Diminished', intervals: ['P1', 'm3', 'd5'] },
  { id: 'augmented', name: 'Augmented', intervals: ['P1', 'M3', 'A5'] },
  { id: 'sus2', name: 'Suspended 2nd', intervals: ['P1', 'M2', 'P5'] },
  { id: 'sus4', name: 'Suspended 4th', intervals: ['P1', 'P4', 'P5'] },
  { id: 'major-6', name: 'Major 6th', intervals: ['P1', 'M3', 'P5', 'M6'] },
  { id: 'minor-6', name: 'Minor 6th', intervals: ['P1', 'm3', 'P5', 'M6'] },
  { id: 'major-7', name: 'Major 7th', intervals: ['P1', 'M3', 'P5', 'M7'] },
  { id: 'dominant-7', name: 'Dominant 7th', intervals: ['P1', 'M3', 'P5', 'm7'] },
  { id: 'minor-7', name: 'Minor 7th', intervals: ['P1', 'm3', 'P5', 'm7'] },
  { id: 'minor-major-7', name: 'Minor major 7th', intervals: ['P1', 'm3', 'P5', 'M7'] },
  { id: 'half-diminished-7', name: 'Half-diminished 7th', intervals: ['P1', 'm3', 'd5', 'm7'] },
  { id: 'diminished-7', name: 'Diminished 7th', intervals: ['P1', 'm3', 'd5', 'd7'] },
  { id: 'augmented-7', name: 'Augmented 7th', intervals: ['P1', 'M3', 'A5', 'm7'] },
  { id: 'add9', name: 'Add 9', intervals: ['P1', 'M3', 'P5', 'M9'] },
  { id: 'dominant-9', name: 'Dominant 9th', intervals: ['P1', 'M3', 'P5', 'm7', 'M9'] },
  { id: 'major-9', name: 'Major 9th', intervals: ['P1', 'M3', 'P5', 'M7', 'M9'] },
  { id: 'minor-9', name: 'Minor 9th', intervals: ['P1', 'm3', 'P5', 'm7', 'M9'] },
];

export interface SpelledNote {
  name: string;
  interval: string; // code relative to the root
}

/** Spell a scale/chord pattern above `root`. */
export function spell(root: Note, pattern: Pattern, closeOctave = false): SpelledNote[] {
  const codes = closeOctave ? [...pattern.intervals, 'P8'] : pattern.intervals;
  return codes.map((code) => ({
    name: noteName(applyInterval(root, parseInterval(code), 'up')),
    interval: code,
  }));
}

export function makeRoot(letter: number, alter: number): Note {
  return { letter, alter, octave: 4 };
}
