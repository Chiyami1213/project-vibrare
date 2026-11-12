// Circle of fifths data and helpers (no DOM).
import { SCALES, makeRoot, noteName, spell, type SpelledNote } from './theory.ts';

export type Mode = 'major' | 'minor';

interface Tonic {
  letter: number; // index into LETTERS
  alter: number;
}

export interface CircleKey {
  major: Tonic;
  minor: Tonic; // the relative minor
  fifths: number; // key signature: +n sharps, -n flats
}

// Clockwise from the top: each step is a fifth up.
export const CIRCLE: CircleKey[] = [
  { major: { letter: 0, alter: 0 }, minor: { letter: 5, alter: 0 }, fifths: 0 }, // C / Am
  { major: { letter: 4, alter: 0 }, minor: { letter: 2, alter: 0 }, fifths: 1 }, // G / Em
  { major: { letter: 1, alter: 0 }, minor: { letter: 6, alter: 0 }, fifths: 2 }, // D / Bm
  { major: { letter: 5, alter: 0 }, minor: { letter: 3, alter: 1 }, fifths: 3 }, // A / F#m
  { major: { letter: 2, alter: 0 }, minor: { letter: 0, alter: 1 }, fifths: 4 }, // E / C#m
  { major: { letter: 6, alter: 0 }, minor: { letter: 4, alter: 1 }, fifths: 5 }, // B / G#m
  { major: { letter: 3, alter: 1 }, minor: { letter: 1, alter: 1 }, fifths: 6 }, // F# / D#m
  { major: { letter: 1, alter: -1 }, minor: { letter: 6, alter: -1 }, fifths: -5 }, // Db / Bbm
  { major: { letter: 5, alter: -1 }, minor: { letter: 3, alter: 0 }, fifths: -4 }, // Ab / Fm
  { major: { letter: 2, alter: -1 }, minor: { letter: 0, alter: 0 }, fifths: -3 }, // Eb / Cm
  { major: { letter: 6, alter: -1 }, minor: { letter: 4, alter: 0 }, fifths: -2 }, // Bb / Gm
  { major: { letter: 3, alter: 0 }, minor: { letter: 1, alter: 0 }, fifths: -1 }, // F / Dm
];

const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];
const FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'];

/** The accidentals of a key signature, in the order they are written. */
export function signature(fifths: number): string[] {
  return fifths >= 0 ? SHARP_ORDER.slice(0, fifths) : FLAT_ORDER.slice(0, -fifths);
}

export function signatureText(fifths: number): string {
  if (fifths === 0) return 'No sharps or flats';
  const n = Math.abs(fifths);
  return `${n} ${fifths > 0 ? 'sharp' : 'flat'}${n > 1 ? 's' : ''}: ${signature(fifths).join(' ')}`;
}

const wrap = (i: number) => ((i % 12) + 12) % 12;

// The bottom of the circle has two spellings for the same keys. Pick the one that
// matches the side we are on, so D♭ major's subdominant is G♭ (not F♯) and
// F♯ major's dominant is C♯ (not D♭).
const FLAT_SPELLING: Record<number, Record<Mode, Tonic>> = {
  6: { major: { letter: 4, alter: -1 }, minor: { letter: 2, alter: -1 } }, // G♭ / E♭m
};
const SHARP_SPELLING: Record<number, Record<Mode, Tonic>> = {
  7: { major: { letter: 0, alter: 1 }, minor: { letter: 5, alter: 1 } }, // C♯ / A♯m
};

/** Name of the key at `target`, spelled to suit the key we came from (`from`). */
function neighbourName(target: number, from: number, mode: Mode): string {
  const t = wrap(target);
  const f = wrap(from);
  const alt = f >= 7 ? FLAT_SPELLING[t] : f === 6 ? SHARP_SPELLING[t] : undefined;
  return alt ? noteName(alt[mode]) : tonicName(t, mode);
}

export function tonicName(position: number, mode: Mode): string {
  const t = mode === 'major' ? CIRCLE[wrap(position)].major : CIRCLE[wrap(position)].minor;
  return noteName(t);
}

const ROMAN: Record<Mode, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
};
const QUALITY: Record<Mode, string[]> = {
  major: ['', 'm', 'm', '', '', 'm', '°'],
  minor: ['m', '°', '', 'm', 'm', '', ''],
};

export interface KeyInfo {
  title: string; // "G major"
  signature: string;
  relative: string; // "E minor"
  dominant: string; // V (or v) chord's key, one step clockwise
  subdominant: string; // one step counter-clockwise
  scale: SpelledNote[]; // notes, labelled with degree numbers
  chords: SpelledNote[]; // diatonic triads, labelled with Roman numerals
}

export function keyInfo(position: number, mode: Mode): KeyInfo {
  const p = wrap(position);
  const key = CIRCLE[p];
  const tonic = mode === 'major' ? key.major : key.minor;
  const pattern = SCALES.find((s) => s.id === (mode === 'major' ? 'major' : 'natural-minor'))!;
  const notes = spell(makeRoot(tonic.letter, tonic.alter), pattern);
  const other: Mode = mode === 'major' ? 'minor' : 'major';
  return {
    title: `${tonicName(p, mode)} ${mode}`,
    signature: signatureText(key.fifths),
    relative: `${tonicName(p, other)} ${other}`,
    dominant: `${neighbourName(p + 1, p, mode)} ${mode}`,
    subdominant: `${neighbourName(p - 1, p, mode)} ${mode}`,
    scale: notes.map((n, i) => ({ name: n.name, interval: String(i + 1) })),
    chords: notes.map((n, i) => ({ name: n.name + QUALITY[mode][i], interval: ROMAN[mode][i] })),
  };
}
