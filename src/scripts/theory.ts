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
  symbol?: string; // chords: suffix written after the root, e.g. "maj7"
  aka?: string[]; // chords: other common spellings of the suffix
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

// Chord catalogue. `symbol` is the suffix written after the root (C + "maj7" = Cmaj7).
// The first four entries per size are the common ones; ids are stable (used in URLs and tests).
const c = (id: string, name: string, symbol: string, intervals: string[], aka: string[] = []): Pattern => ({
  id,
  name,
  symbol,
  aka,
  intervals,
});

export const CHORDS: Pattern[] = [
  // ----- three notes -----
  c('major', 'Major', '', ['P1', 'M3', 'P5'], ['maj']),
  c('minor', 'Minor', 'm', ['P1', 'm3', 'P5'], ['min', '−']),
  c('diminished', 'Diminished', '°', ['P1', 'm3', 'd5'], ['dim']),
  c('augmented', 'Augmented', '+', ['P1', 'M3', 'A5'], ['aug']),
  c('sus2', 'Suspended 2nd', 'sus2', ['P1', 'M2', 'P5']),
  c('sus4', 'Suspended 4th', 'sus4', ['P1', 'P4', 'P5']),
  c('major-b5', 'Major flat five', '(♭5)', ['P1', 'M3', 'd5']),
  // ----- four notes -----
  c('dominant-7', 'Dominant 7th', '7', ['P1', 'M3', 'P5', 'm7']),
  c('minor-7', 'Minor 7th', 'm7', ['P1', 'm3', 'P5', 'm7'], ['min7', '−7']),
  c('half-diminished-7', 'Half-diminished 7th', 'ø7', ['P1', 'm3', 'd5', 'm7'], ['m7(♭5)']),
  c('diminished-7', 'Diminished 7th', '°7', ['P1', 'm3', 'd5', 'd7'], ['dim7']),
  c('augmented-7', 'Augmented 7th', '+7', ['P1', 'M3', 'A5', 'm7'], ['7(♯5)']),
  c('dominant-7-b5', 'Dominant 7th flat five', '7(♭5)', ['P1', 'M3', 'd5', 'm7']),
  c('dominant-7-sus2', 'Dominant 7th sus2', '7sus2', ['P1', 'M2', 'P5', 'm7']),
  c('dominant-7-sus4', 'Dominant 7th sus4', '7sus4', ['P1', 'P4', 'P5', 'm7']),
  c('major-7', 'Major 7th', 'maj7', ['P1', 'M3', 'P5', 'M7'], ['△7', 'M7']),
  c('minor-major-7', 'Minor major 7th', 'm(maj7)', ['P1', 'm3', 'P5', 'M7'], ['m△7']),
  c('augmented-major-7', 'Augmented major 7th', '+maj7', ['P1', 'M3', 'A5', 'M7'], ['+△7']),
  c('major-7-b5', 'Major 7th flat five', 'maj7(♭5)', ['P1', 'M3', 'd5', 'M7'], ['△7(♭5)']),
  c('major-7-sus2', 'Major 7th sus2', 'maj7sus2', ['P1', 'M2', 'P5', 'M7']),
  c('major-7-sus4', 'Major 7th sus4', 'maj7sus4', ['P1', 'P4', 'P5', 'M7']),
  c('major-6', 'Major 6th', '6', ['P1', 'M3', 'P5', 'M6']),
  c('minor-6', 'Minor 6th', 'm6', ['P1', 'm3', 'P5', 'M6']),
  c('add9', 'Add 9', 'add9', ['P1', 'M3', 'P5', 'M9']),
  c('minor-add9', 'Minor add 9', 'm(add9)', ['P1', 'm3', 'P5', 'M9']),
  c('add11', 'Add 11', 'add11', ['P1', 'M3', 'P5', 'P11']),
  c('add-sharp-11', 'Add ♯11', 'add♯11', ['P1', 'M3', 'P5', 'A11']),
  c('minor-add11', 'Minor add 11', 'm(add11)', ['P1', 'm3', 'P5', 'P11']),
  c('add9-b5', 'Add 9 flat five', 'add9(♭5)', ['P1', 'M3', 'd5', 'M9']),
  c('add9-sus4', 'Add 9 sus4', 'add9sus4', ['P1', 'P4', 'P5', 'M9']),
  c('augmented-add9', 'Augmented add 9', '+add9', ['P1', 'M3', 'A5', 'M9']),
  // ----- five notes -----
  c('dominant-9', 'Dominant 9th', '9', ['P1', 'M3', 'P5', 'm7', 'M9'], ['7(9)']),
  c('minor-9', 'Minor 9th', 'm9', ['P1', 'm3', 'P5', 'm7', 'M9'], ['m7(9)']),
  c('major-9', 'Major 9th', 'maj9', ['P1', 'M3', 'P5', 'M7', 'M9'], ['△7(9)']),
  c('dominant-7-sharp-11', 'Dominant 7th ♯11', '7(♯11)', ['P1', 'M3', 'P5', 'm7', 'A11']),
  c('minor-7-11', 'Minor 7th 11', 'm7(11)', ['P1', 'm3', 'P5', 'm7', 'P11']),
  c('dominant-7-13', 'Dominant 7th 13', '7(13)', ['P1', 'M3', 'P5', 'm7', 'M13']),
  c('six-nine', 'Six nine', '6(9)', ['P1', 'M3', 'P5', 'M6', 'M9'], ['6/9']),
  c('minor-six-nine', 'Minor six nine', 'm6(9)', ['P1', 'm3', 'P5', 'M6', 'M9']),
  c('major-7-13', 'Major 7th 13', 'maj7(13)', ['P1', 'M3', 'P5', 'M7', 'M13']),
  c('major-7-9-sus4', 'Major 9th sus4', 'maj7(9)sus4', ['P1', 'P4', 'P5', 'M7', 'M9']),
  c('dominant-7-b9', 'Dominant 7th ♭9', '7(♭9)', ['P1', 'M3', 'P5', 'm7', 'm9']),
  c('dominant-7-sharp-9', 'Dominant 7th ♯9', '7(♯9)', ['P1', 'M3', 'P5', 'm7', 'A9']),
  c('dominant-7-b13', 'Dominant 7th ♭13', '7(♭13)', ['P1', 'M3', 'P5', 'm7', 'm13']),
  c('minor-major-9', 'Minor major 9th', 'm(maj9)', ['P1', 'm3', 'P5', 'M7', 'M9']),
  c('diminished-7-9', 'Diminished 7th 9', '°7(9)', ['P1', 'm3', 'd5', 'd7', 'M9']),
  c('diminished-7-b9', 'Diminished 7th ♭9', '°7(♭9)', ['P1', 'm3', 'd5', 'd7', 'm9']),
  c('augmented-7-9', 'Augmented 7th 9', '+7(9)', ['P1', 'M3', 'A5', 'm7', 'M9']),
  c('augmented-7-b9', 'Augmented 7th ♭9', '+7(♭9)', ['P1', 'M3', 'A5', 'm7', 'm9']),
  c('augmented-7-sharp-9', 'Augmented 7th ♯9', '+7(♯9)', ['P1', 'M3', 'A5', 'm7', 'A9']),
  c('augmented-major-9', 'Augmented major 9th', '+maj7(9)', ['P1', 'M3', 'A5', 'M7', 'M9']),
  // ----- six notes -----
  c('dominant-7-9-13', 'Dominant 7th 9, 13', '7(9,13)', ['P1', 'M3', 'P5', 'm7', 'M9', 'M13']),
  c('dominant-7-9-b13', 'Dominant 7th 9, ♭13', '7(9,♭13)', ['P1', 'M3', 'P5', 'm7', 'M9', 'm13']),
  c('dominant-7-b9-13', 'Dominant 7th ♭9, 13', '7(♭9,13)', ['P1', 'M3', 'P5', 'm7', 'm9', 'M13']),
  c('dominant-7-b9-b13', 'Dominant 7th ♭9, ♭13', '7(♭9,♭13)', ['P1', 'M3', 'P5', 'm7', 'm9', 'm13']),
  c('dominant-7-sharp-9-13', 'Dominant 7th ♯9, 13', '7(♯9,13)', ['P1', 'M3', 'P5', 'm7', 'A9', 'M13']),
  c('dominant-7-sharp-9-b13', 'Dominant 7th ♯9, ♭13', '7(♯9,♭13)', ['P1', 'M3', 'P5', 'm7', 'A9', 'm13']),
  c('major-7-9-13', 'Major 7th 9, 13', 'maj7(9,13)', ['P1', 'M3', 'P5', 'M7', 'M9', 'M13']),
  c('minor-7-9-11', 'Minor 7th 9, 11', 'm7(9,11)', ['P1', 'm3', 'P5', 'm7', 'M9', 'P11']),
  c('minor-major-7-9-11', 'Minor major 7th 9, 11', 'm(maj7)(9,11)', ['P1', 'm3', 'P5', 'M7', 'M9', 'P11']),
  c('minor-6-9-11', 'Minor 6th 9, 11', 'm6(9,11)', ['P1', 'm3', 'P5', 'M6', 'M9', 'P11']),
];

/** Chords grouped by number of notes, in catalogue order. */
export const CHORD_GROUPS: { size: number; label: string; chords: Pattern[] }[] = [
  { size: 3, label: 'Three notes' },
  { size: 4, label: 'Four notes' },
  { size: 5, label: 'Five notes' },
  { size: 6, label: 'Six notes' },
].map((g) => ({ ...g, chords: CHORDS.filter((x) => x.intervals.length === g.size) }));

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

/** The notes above `root` for a list of interval codes, each with its octave (for drawing on a staff). */
export function noteList(root: Note, codes: string[]): Note[] {
  return codes.map((code) => applyInterval(root, parseInterval(code), 'up'));
}
