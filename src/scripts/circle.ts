// Circle of fifths data and helpers (no DOM).
import { SCALES, applyInterval, makeRoot, noteName, parseInterval, spell, type SpelledNote } from './theory.ts';
import { chordInfo, findChord } from './chords.ts';

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

// ---------- Chord shapes on the circle ----------

const NATURAL = [0, 2, 4, 5, 7, 9, 11];

/** Position (0-11, clockwise from C at the top) of a pitch class on the circle of fifths. */
export const pcPosition = (pc: number) => (((pc % 12) + 12) * 7) % 12;

export const noteToPc = (letter: number, alter: number) => (((NATURAL[letter] + alter) % 12) + 12) % 12;

export interface Shape {
  positions: number[]; // clockwise, starting from the first vertex after C
  gaps: number[]; // steps around the circle between neighbouring vertices (they sum to 12)
  name: string;
}

/** Join pitch classes on the circle of fifths and describe the polygon they make. */
export function chordShape(pcs: number[]): Shape {
  const positions = [...new Set(pcs.map(pcPosition))].sort((a, b) => a - b);
  const n = positions.length;
  const gaps = positions.map((p, i) => (positions[(i + 1) % n] - p + 12) % 12 || 12);
  const regular = n > 2 && gaps.every((g) => g === gaps[0]);
  const names: Record<number, string> = { 2: 'Line', 3: 'Triangle', 4: 'Quadrilateral', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon' };
  let name = names[n] ?? `${n}-sided shape`;
  if (regular) name = n === 3 ? 'Equilateral triangle' : n === 4 ? 'Square' : n === 6 ? 'Regular hexagon' : name;
  return { positions, gaps, name };
}

export interface DiatonicChord {
  roman: string;
  letter: number;
  alter: number;
  chordId: string;
}

const TRIAD_IDS: Record<Mode, string[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
};
const SEVENTH_IDS: Record<Mode, string[]> = {
  major: ['major-7', 'minor-7', 'minor-7', 'major-7', 'dominant-7', 'minor-7', 'half-diminished-7'],
  minor: ['minor-7', 'half-diminished-7', 'major-7', 'minor-7', 'minor-7', 'major-7', 'dominant-7'],
};
const SEVENTH_SUFFIX: Record<string, string> = { 'major-7': 'maj7', 'minor-7': '7', 'dominant-7': '7', 'half-diminished-7': 'ø7' };

/** The seven chords built on the degrees of a key, as triads or seventh chords. */
export function diatonicChords(position: number, mode: Mode, sevenths = false): DiatonicChord[] {
  const key = CIRCLE[wrap(position)];
  const tonic = mode === 'major' ? key.major : key.minor;
  const pattern = SCALES.find((s) => s.id === (mode === 'major' ? 'major' : 'natural-minor'))!;
  const root = makeRoot(tonic.letter, tonic.alter);
  const ids = (sevenths ? SEVENTH_IDS : TRIAD_IDS)[mode];
  return pattern.intervals.map((code, i) => {
    const n = applyInterval(root, parseInterval(code), 'up');
    const roman = ROMAN[mode][i].replace('°', '');
    const suffix = sevenths ? SEVENTH_SUFFIX[ids[i]] : ids[i] === 'diminished' ? '°' : '';
    return { roman: roman + suffix, letter: n.letter, alter: n.alter, chordId: ids[i] };
  });
}

// ---------- Sound ----------

/** The pitches of a diatonic chord (as MIDI numbers, lowest first). */
export function diatonicChordMidis(c: DiatonicChord): number[] {
  return chordInfo(c.letter, c.alter, findChord(c.chordId)!, 0).notes.map((n) => n.midi);
}

/** The tonic triad of a key. */
export function tonicMidis(position: number, mode: Mode): number[] {
  return diatonicChordMidis(diatonicChords(position, mode, false)[0]);
}

/** The scale of a key, rising from its tonic through one octave (8 notes), in a comfortable register. */
export function scaleMidis(position: number, mode: Mode): number[] {
  const roots = diatonicChords(position, mode, false).map((c) => diatonicChordMidis(c)[0]);
  const rising: number[] = [];
  roots.forEach((m, i) => {
    let x = m;
    while (i > 0 && x <= rising[i - 1]) x += 12;
    rising.push(x);
  });
  rising.push(rising[0] + 12);
  const up = rising[0] + 12 > 66 ? 0 : 12; // tonic between G3 and F#4
  return rising.map((m) => m + up);
}
