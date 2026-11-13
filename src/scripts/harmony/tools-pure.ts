// The logic of the tonal-harmony tools, with no page in it, so it is tested: chords from Roman numerals, smooth voicings,
// the progression chart, secondary functions, the fifths substitution matrix, mixture, augmented sixths and the
// Neapolitan, tendency tones, the motion classifier, voicing report, the V7 resolution lab, the meter grid, the
// overtone series, the clef reader, figured bass, non-chord tones, steps and intervals, scales and modes.
import { Chord as TChord, Interval, Note, Scale } from 'tonal';

const LETTERS = 'CDEFGAB';
const mod = (a: number, n: number) => ((a % n) + n) % n;
export const midiOf = (n: string) => Note.midi(n) ?? 60;

// ---------- chords from Roman numerals ----------

const MAJOR_STEPS = ['1P', '2M', '3M', '4P', '5P', '6M', '7M'];
const MINOR_STEPS = ['1P', '2M', '3m', '4P', '5P', '6m', '7m'];
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

export type ChordType = 'M' | 'm' | 'dim' | 'aug' | 'dom7' | 'm7' | 'M7' | 'dim7' | 'm7b5' | 'mM7' | 'aug7';
const TYPE_STEPS: Record<ChordType, string[]> = {
  M: ['3M', '5P'],
  m: ['3m', '5P'],
  dim: ['3m', '5d'],
  aug: ['3M', '5A'],
  dom7: ['3M', '5P', '7m'],
  m7: ['3m', '5P', '7m'],
  M7: ['3M', '5P', '7M'],
  dim7: ['3m', '5d', '7d'],
  m7b5: ['3m', '5d', '7m'],
  mM7: ['3m', '5P', '7M'],
  aug7: ['3M', '5A', '7M'],
};
const SYMBOL: Record<ChordType, string> = { M: '', m: 'm', dim: '°', aug: '+', dom7: '7', m7: 'm7', M7: 'maj7', dim7: '°7', m7b5: 'ø7', mM7: 'mM7', aug7: '+M7' };
export const isSeventh = (t: ChordType) => TYPE_STEPS[t].length === 3;

export interface Chord {
  numeral: string; // as given
  root: string; // pitch class
  type: ChordType;
  notes: string[]; // root position, pitch classes
  inversion: number; // 0 root, 1, 2, 3
  bass: string;
  symbol: string; // lead-sheet: D7, F#°7, C/E
  figures: string; // 6/5, 4/3, 6/4, 4/2, 6, "" for root position
}

const FIG_INVERSION: Record<string, number> = { '6': 1, '65': 1, '64': 2, '43': 2, '42': 3, '2': 3 };

/** The inversion figures of a chord: "6", "6/4", "6/5", "4/3", "4/2" ("" in root position). */
export function figuresFor(seventh: boolean, inversion: number): string {
  const t = seventh ? ['', '6/5', '4/3', '4/2'] : ['', '6', '6/4'];
  return t[inversion] ?? '';
}

/**
 * A chord from a Roman numeral in a key: "V7", "viiø65", "ii°6", "bVI", "N6", "V7/V", "vii°7/vi", "It+6" is not a numeral.
 * A minor key uses the natural minor scale, with the leading tone raised for vii and the sixth raised for a diminished vi.
 */
export function chordFromNumeral(tonic: string, major: boolean, numeral: string): Chord | null {
  const secondary = numeral.split('/');
  if (secondary.length === 2 && !/^\d+$/.test(secondary[1]) && !/^[2-9]$/.test(secondary[1])) {
    const target = chordFromNumeral(tonic, major, secondary[1]);
    if (!target) return null;
    return chordFromNumeral(target.root, true, secondary[0]) && { ...(chordFromNumeral(target.root, true, secondary[0]) as Chord), numeral };
  }
  const m = /^([b#♭♯]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i|N)([°o+ø]?)(Δ|M)?(7|6\/5|65|4\/3|43|4\/2|42|6\/4|64|6|2)?$/.exec(numeral.replace('/', '/'));
  if (!m) return null;
  const [, pre, rn, mark, delta, fig] = m;
  const figures = (fig ?? '').replace('/', '');
  const seventh = delta !== undefined || ['7', '65', '43', '42', '2'].includes(figures);
  const inversion = FIG_INVERSION[figures] ?? 0;
  let deg: number;
  let acc = pre === 'b' || pre === '♭' ? -1 : pre === '#' || pre === '♯' ? 1 : 0;
  let upper = rn === rn.toUpperCase();
  if (rn === 'N') {
    deg = 1; // the Neapolitan: a major triad on the lowered second degree
    acc = -1;
    upper = true;
  } else {
    deg = ROMAN.indexOf(rn.toLowerCase());
  }
  const scale = major ? MAJOR_STEPS : MINOR_STEPS;
  let step = scale[deg];
  // the leading tone, and the raised sixth of a diminished or half-diminished vi, in a minor key
  if (!major && deg === 6 && (!upper || mark === '°' || mark === 'ø')) step = '7M';
  if (!major && deg === 5 && (mark === '°' || mark === 'ø')) step = '6M';
  let root = Note.transpose(tonic, step);
  if (acc) root = Note.transpose(root, acc > 0 ? '1A' : '-1A');
  let type: ChordType;
  if (mark === '°') type = seventh ? 'dim7' : 'dim';
  else if (mark === 'ø') type = 'm7b5';
  else if (mark === '+') type = seventh ? 'aug7' : 'aug';
  else if (seventh) type = delta ? (upper ? 'M7' : 'mM7') : upper ? 'dom7' : 'm7';
  else type = upper ? 'M' : 'm';
  const notes = [root, ...TYPE_STEPS[type].map((s) => Note.transpose(root, s))];
  const bass = notes[Math.min(inversion, notes.length - 1)];
  const symbol = `${root}${SYMBOL[type]}${inversion ? `/${bass}` : ''}`;
  return { numeral, root, type, notes, inversion, bass, symbol, figures: figuresFor(seventh, inversion) };
}

/** The notes of a chord as pitches, the bass first, stacked upward from `bassOctave`. */
export function stackPitches(c: Chord, bassOctave = 3): string[] {
  const order = [...c.notes.slice(c.inversion), ...c.notes.slice(0, c.inversion)];
  const out: string[] = [];
  let prev = -1;
  for (const pc of order) {
    let o = out.length === 0 ? bassOctave : Math.floor(prev / 12) - 1;
    let n = `${pc}${o}`;
    while (midiOf(n) <= prev) n = `${pc}${++o}`;
    out.push(n);
    prev = midiOf(n);
  }
  return out;
}

// ---------- smooth voicings ----------

/** Four voices for each chord (S A T B as MIDI numbers), chosen to move as little as possible from one chord to the next. */
export function voiceLead(chords: string[][], bassOctave = 2): number[][] {
  const RANGES: [number, number][] = [[60, 81], [55, 72], [48, 67], [40, 62]]; // S A T B, as the notes give (extended)
  const out: number[][] = [];
  let prev: number[] | null = null;
  for (const notes of chords) {
    const pcs = notes.map((n) => Note.chroma(n) ?? 0);
    const bassPc = pcs[0];
    const cands: number[][] = [];
    const inRange = (v: number, i: number) => Array.from({ length: 80 }, (_, k) => k + 36).filter((m) => m >= RANGES[i][0] && m <= RANGES[i][1]);
    for (const b of inRange(0, 3).filter((m) => mod(m, 12) === bassPc)) {
      for (const t of inRange(0, 2).filter((m) => pcs.includes(mod(m, 12)) && m >= b)) {
        for (const a of inRange(0, 1).filter((m) => pcs.includes(mod(m, 12)) && m >= t && m - t <= 12)) {
          for (const s of inRange(0, 0).filter((m) => pcs.includes(mod(m, 12)) && m >= a && m - a <= 12)) {
            const set = new Set([s, a, t, b].map((m) => mod(m, 12)));
            if (pcs.every((p) => set.has(p)) || (pcs.length === 4 && set.size >= 3)) cands.push([s, a, t, b]);
          }
        }
      }
    }
    void bassOctave;
    const cost = (c: number[]) => (prev ? c.reduce((s, m, i) => s + Math.abs(m - prev![i]) * (i === 3 ? 0.4 : 1), 0) : Math.abs(c[0] - 67) + Math.abs(c[3] - 48));
    const best = cands.sort((x, y) => cost(x) - cost(y))[0] ?? [72, 67, 64, 48];
    out.push(best);
    prev = best;
  }
  return out;
}

// ---------- 9. progression chart ----------

// the groups of the flow chart, left to right (notes p.14); a chord may go to its own group or any group to its right
export const CHART: Record<'major' | 'minor', string[][]> = {
  major: [['iii'], ['vi'], ['IV', 'ii'], ['V', 'vii°'], ['I']],
  minor: [['VII'], ['III'], ['VI'], ['iv', 'ii°'], ['V', 'vii°'], ['i']],
};
export type Arrow = 'ok' | 'back';

/** Whether each step of a progression goes with the chart (green) or against it (red). The tonic can go anywhere. */
export function progressionArrows(mode: 'major' | 'minor', chords: string[]): Arrow[] {
  const groups = CHART[mode];
  const tonic = mode === 'major' ? 'I' : 'i';
  const at = (c: string) => groups.findIndex((g) => g.includes(c.replace(/7|6|65|43|42|\/.*$/g, (x) => (x.startsWith('/') ? '' : ''))));
  const clean = (c: string) => c.replace(/[0-9\/]+$/, '').replace(/ø$/, '°');
  return chords.slice(1).map((next, i) => {
    const a = clean(chords[i]);
    const b = clean(next);
    if (a === tonic) return 'ok';
    const ga = groups.findIndex((g) => g.includes(a));
    const gb = groups.findIndex((g) => g.includes(b));
    if (ga < 0 || gb < 0) return 'ok';
    if (ga === gb) return groups[ga].indexOf(a) <= groups[ga].indexOf(b) || groups[ga].includes('V') ? 'ok' : 'back'; // [V ↔ vii°] goes both ways
    return gb > ga ? 'ok' : 'back';
  });
}

// ---------- 20. secondary functions ----------

export interface Secondary {
  label: string;
  numeral: string;
  chord: Chord;
  steps: string[];
}

/** V, V7, vii°, vii°7 and viiø7 of a target chord of the key, each with the steps of the spelling procedure. */
export function secondaryChords(tonic: string, major: boolean, target: string): Secondary[] | null {
  const t = chordFromNumeral(tonic, major, target);
  if (!t) return null;
  const mk = (label: string, numeral: string, how: (c: Chord) => string[]): Secondary => {
    const chord = chordFromNumeral(t.root, true, numeral)!;
    return { label: `${label}/${target}`, numeral: `${numeral}/${target}`, chord, steps: [`Name the root of the chord to be tonicized: ${t.root}.`, ...how(chord)] };
  };
  const up5 = Note.transpose(t.root, '5P');
  const lt = Note.transpose(t.root, '7M');
  return [
    mk('V', 'V', (c) => [`Go up a P5: ${up5}.`, `Build a major triad: ${c.notes.join(' ')}.`]),
    mk('V7', 'V7', (c) => [`Go up a P5: ${up5}.`, `Build a major-minor seventh chord: ${c.notes.join(' ')}.`]),
    mk('vii°', 'vii°', (c) => [`Go up a M7 (down a half step): ${lt}.`, `Build a diminished triad: ${c.notes.join(' ')}.`]),
    mk('vii°7', 'vii°7', (c) => [`The leading tone of ${t.root}: ${lt}.`, `Build a fully diminished seventh chord: ${c.notes.join(' ')}.`]),
    mk('viiø7', 'viiø7', (c) => [`The leading tone of ${t.root}: ${lt}.`, `Build a half-diminished seventh chord: ${c.notes.join(' ')}.`]),
  ];
}

const sameChroma = (a: string, b: string) => Note.chroma(a) === Note.chroma(b);

/** Analysis of a chromatic chord in a key (notes p.40): its type, the chord it points to, and the steps that show it. */
export function analyseSecondary(tonic: string, major: boolean, notes: string[]): { text: string; steps: string[]; numeral: string | null } {
  const symbols = detectChords(notes);
  const steps: string[] = [`Write the lead-sheet symbol: ${symbols[0] ?? 'unknown'}.`];
  const first = symbols[0] ?? '';
  const m = /^([A-G][#b]?)(.*)$/.exec(first);
  if (!m) return { text: 'This is not a chord the tool can name.', steps, numeral: null };
  const [, root, q] = m;
  const triads = (major ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] : ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']).map((n) => chordFromNumeral(tonic, major, n)!);
  const findTarget = (pc: string) => triads.find((c) => sameChroma(c.root, pc));
  let pcTarget: string;
  let kind: string;
  if (q === '' || q === '7' || q === 'M' || q === 'dom7') {
    kind = q === '7' ? 'major-minor seventh' : 'major';
    steps.push(`Is it a major triad or a major-minor seventh chord? Yes: ${kind}.`);
    pcTarget = Note.transpose(root, '-5P');
    steps.push(`Go down a P5: ${pcTarget}.`);
  } else if (/dim|°|m7b5|ø/.test(q)) {
    kind = 'diminished';
    steps.push('It is a diminished or half-diminished chord: its root is a leading tone.');
    pcTarget = Note.transpose(root, '2m');
    steps.push(`Go up a half step: ${pcTarget}.`);
  } else {
    return { text: `${first} is not a secondary dominant or leading-tone chord.`, steps, numeral: null };
  }
  const tgt = findTarget(pcTarget);
  steps.push(tgt ? `A triad on ${pcTarget} is diatonic here: ${tgt.numeral}.` : `A triad on ${pcTarget} is not diatonic in this key: it is not a secondary chord.`);
  if (!tgt) return { text: `${first} does not point to a diatonic chord of this key.`, steps, numeral: null };
  const numeral = kind === 'diminished' ? `${/ø|m7b5/.test(q) ? 'viiø7' : /7/.test(q) ? 'vii°7' : 'vii°'}/${tgt.numeral}` : `${q === '7' ? 'V7' : 'V'}/${tgt.numeral}`;
  return { text: `${first} is ${numeral}.`, steps, numeral };
}
const detectChords = (notes: string[]): string[] => TChord.detect(notes.map((n) => Note.pitchClass(n)));

// ---------- 21. fifths substitution ----------

export type Slot = 'diatonic' | 'dominant' | 'leading';
export const SLOT_LABELS: Record<Slot, string> = { diatonic: 'Diatonic', dominant: 'Secondary Dominant', leading: 'Secondary Leading-Tone' };
const SUB_BASE = ['iii7', 'vi7', 'ii7', 'V7', 'I'];

/** One of the 27 progressions: iii7, vi7 and ii7 each diatonic, a secondary dominant or a secondary leading-tone chord of the chord after it. */
export function substitutionPath(tonic: string, choices: [Slot, Slot, Slot]): { labels: string[]; chords: Chord[] } {
  const major = true;
  const chords: Chord[] = [];
  const labels: string[] = [];
  for (let i = 0; i < 5; i++) {
    const base = SUB_BASE[i];
    const next = SUB_BASE[i + 1];
    const slot = i < 3 ? choices[i] : 'diatonic';
    let numeral = base;
    const target = next?.replace(/7$/, '');
    if (slot === 'dominant') numeral = `V7/${target}`;
    else if (slot === 'leading') numeral = `${target === 'V' || target === 'I' ? 'vii°7' : 'viiø7'}/${target}`;
    // the leading-tone chord of a minor chord target is half-diminished, of a major one fully diminished (the notes p.43)
    if (slot === 'leading') {
      const tm = /^[a-z]/.test(target);
      numeral = `${tm ? 'viiø7' : 'vii°7'}/${target}`;
    }
    const c = base === 'I' ? chordFromNumeral(tonic, major, 'I')! : chordFromNumeral(tonic, major, numeral)!;
    chords.push(c);
    labels.push(numeral);
  }
  return { labels, chords };
}
export const ALL_SLOTS: Slot[] = ['diatonic', 'dominant', 'leading'];
export function allSubstitutionPaths(): [Slot, Slot, Slot][] {
  const out: [Slot, Slot, Slot][] = [];
  for (const a of ALL_SLOTS) for (const b of ALL_SLOTS) for (const c of ALL_SLOTS) out.push([a, b, c]);
  return out;
}

// ---------- 22. pivot chords ----------

const MAJOR_TRIADS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MINOR_TRIADS = ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'vii°']; // harmonic minor, as in the notes
export function diatonicTriads(tonic: string, major: boolean): Chord[] {
  return (major ? MAJOR_TRIADS : MINOR_TRIADS).map((n) => chordFromNumeral(tonic, major, n)!).map((c, i) => (!major && i === 4 ? chordFromNumeral(tonic, false, 'V')! : c));
}
export interface Pivot {
  chord: string; // the notes
  inA: string;
  inB: string;
}
export function pivotChords(a: { tonic: string; major: boolean }, b: { tonic: string; major: boolean }): Pivot[] {
  const A = diatonicTriads(a.tonic, a.major);
  const B = diatonicTriads(b.tonic, b.major);
  const out: Pivot[] = [];
  for (const x of A) for (const y of B) {
    const set = (c: Chord) => c.notes.map((n) => Note.chroma(n)!).sort((p, q) => p - q).join();
    if (set(x) === set(y)) out.push({ chord: x.symbol, inA: x.numeral, inB: y.numeral });
  }
  return out;
}

// ---------- 23. mode mixture ----------

export interface Borrowed {
  numeral: string;
  chord: Chord;
  degrees: string[]; // ♭3̂ ♭6̂ ♭7̂
}
// the order of the notes p.46: ♭6̂ is the most common, then ♭3̂, then ♭7̂
export const MIXTURE_ORDER = ['♭6̂', '♭3̂', '♭7̂'];
export function borrowedChords(tonic: string): Borrowed[] {
  const major = new Set(MAJOR_STEPS.map((s) => Note.chroma(Note.transpose(tonic, s))));
  const flat: [string, string][] = [['♭3̂', '3m'], ['♭6̂', '6m'], ['♭7̂', '7m']];
  const out: Borrowed[] = [];
  for (const numeral of ['i', 'ii°', 'iiø7', 'bIII', 'iv', 'iv7', 'bVI', 'bVII', 'vii°7']) {
    const chord = chordFromNumeral(tonic, true, numeral)!;
    const degrees = flat.filter(([, s]) => chord.notes.some((n) => Note.chroma(n) === Note.chroma(Note.transpose(tonic, s)))).map(([d]) => d);
    if (chord.notes.some((n) => !major.has(Note.chroma(n)))) out.push({ numeral, chord, degrees });
  }
  const rank = (b: Borrowed) => Math.min(...b.degrees.map((d) => MIXTURE_ORDER.indexOf(d)), 9);
  return out.sort((x, y) => rank(x) - rank(y));
}

// ---------- 24. augmented sixths and the Neapolitan ----------

export type Aug6 = 'It' | 'Fr' | 'Ger';
export interface ChromaticChord {
  name: string;
  notes: string[]; // bass first
  steps: string[];
  resolution: string[]; // pitch classes of the chord it resolves to
  resolutionName: string;
}
export function augmentedSixth(tonic: string, major: boolean, type: Aug6): ChromaticChord {
  const dom = Note.transpose(tonic, '5P');
  const bass = Note.transpose(dom, '2m'); // a half step above ⑤: ♭6̂ in major, 6̂ in minor
  const upper = Note.transpose(dom, '-2m'); // a half step below ⑤: ♯4̂
  const third = tonic; // 1̂
  const extra = type === 'Fr' ? Note.transpose(tonic, '2M') : type === 'Ger' ? Note.transpose(tonic, '3m') : null;
  const notes = [bass, third, ...(extra ? [extra] : [third]), upper];
  const uniq = type === 'It' ? [bass, third, upper] : [bass, third, extra!, upper];
  void notes;
  return {
    name: { It: 'Italian sixth', Fr: 'French sixth', Ger: 'German sixth' }[type],
    notes: uniq,
    steps: [
      `Pick the scale degree to approach: 5̂ = ${dom}.`,
      `The bass is a minor second above it: ${bass} (${major ? '♭6̂' : '6̂'}).`,
      `The upper voice is a minor second below it, written up the octave: ${upper} (♯4̂). With the bass it makes the augmented sixth.`,
      `Add 1̂ (${third})${type === 'It' ? ' (doubled)' : ''}${type === 'Fr' ? ` and 2̂ (${extra})` : ''}${type === 'Ger' ? ` and ${major ? '♭3̂' : '3̂'} (${extra})` : ''}.`,
    ],
    resolution: [dom, Note.transpose(dom, '3M'), Note.transpose(dom, '5P')].map((n) => Note.pitchClass(n)),
    resolutionName: 'V (the augmented sixth expands to an octave on 5̂)',
  };
}
export function neapolitan(tonic: string): ChromaticChord {
  const n = chordFromNumeral(tonic, true, 'N6')!;
  return {
    name: 'Neapolitan sixth (N6)',
    notes: [n.bass, ...n.notes.filter((x) => x !== n.bass)],
    steps: [
      `The root is ♭2̂: ${n.root}, a major triad.`,
      `Use it in first inversion, with the 3rd in the bass: ${n.bass} (4̂). Double the bass.`,
      `♭2̂ (${n.root}) resolves down, usually to the leading tone ${Note.transpose(tonic, '7M')}: a diminished third.`,
    ],
    resolution: ['G', 'B', 'D'].map((x, i) => [Note.transpose(tonic, '5P'), Note.transpose(tonic, '7M'), Note.transpose(tonic, '2M')][i]).map((x) => Note.pitchClass(x)),
    resolutionName: 'V',
  };
}

// ---------- 25. tendency tones ----------

export interface Tendency {
  note: string;
  kind: string;
  to: string;
}
export function tendencies(tonic: string, major: boolean, chordNotes: string[], seventh: boolean): Tendency[] {
  const out: Tendency[] = [];
  const lt = Note.transpose(tonic, '7M');
  const down6 = Note.transpose(tonic, '6m');
  const has = (n: string) => chordNotes.some((c) => Note.chroma(c) === Note.chroma(n));
  if (has(lt)) out.push({ note: lt, kind: 'Leading tone 7̂', to: `up to ${tonic} (1̂)` });
  if (major && has(down6) && !has(Note.transpose(tonic, '6M'))) out.push({ note: down6, kind: '♭6̂', to: `down to ${Note.transpose(tonic, '5P')} (5̂)` });
  if (seventh) out.push({ note: chordNotes[3], kind: 'Chordal 7th', to: 'down a step' });
  for (let i = 0; i < chordNotes.length; i++) for (let j = i + 1; j < chordNotes.length; j++) {
    const d = mod((Note.chroma(chordNotes[j]) ?? 0) - (Note.chroma(chordNotes[i]) ?? 0), 12);
    if (d === 6) out.push({ note: `${chordNotes[i]}–${chordNotes[j]}`, kind: 'Tritone', to: 'the diminished fifth contracts to a third, the augmented fourth expands to a sixth' });
  }
  return out;
}

// ---------- 13. motion classifier ----------

export interface Motion {
  kind: 'parallel' | 'similar' | 'oblique' | 'contrary' | 'static';
  intervals: [string, string]; // simple intervals of the first and second sonority
  flags: string[];
}
const simple = (lo: number, hi: number) => mod(hi - lo, 12);
const isP58 = (s: number) => s === 7 || s === 0;

/** Two voices, two sonorities: the kind of motion, and parallel, contrary, hidden and unequal fifths and octaves. */
export function classifyMotion(a1: string, b1: string, a2: string, b2: string): Motion {
  const ua = midiOf(a2) - midiOf(a1);
  const ub = midiOf(b2) - midiOf(b1); // a = upper voice, b = lower voice
  const kind: Motion['kind'] = ua === 0 && ub === 0 ? 'static' : ua === 0 || ub === 0 ? 'oblique' : Math.sign(ua) !== Math.sign(ub) ? 'contrary' : ua === ub ? 'parallel' : 'similar';
  const s1 = simple(midiOf(b1), midiOf(a1));
  const s2 = simple(midiOf(b2), midiOf(a2));
  const i1 = Interval.distance(b1, a1);
  const i2 = Interval.distance(b2, a2);
  const flags: string[] = [];
  const dir = ua !== 0 || ub !== 0;
  if (dir && isP58(s1) && s1 === s2 && kind !== 'oblique' && kind !== 'static') {
    flags.push(kind === 'contrary' ? `consecutive ${s1 === 7 ? 'fifths' : 'octaves'} by contrary motion` : `parallel ${s1 === 7 ? 'fifths' : 'octaves'}`);
  } else if (dir && isP58(s1) && s1 === s2 && kind === 'oblique') {
    flags.push(`repeated ${s1 === 7 ? 'fifth' : 'octave'} (oblique): allowed, but not the same notes`);
  }
  if ((kind === 'similar' || kind === 'parallel') && isP58(s2) && !isP58(s1)) {
    flags.push(`hidden ${s2 === 7 ? 'fifth' : 'octave'} (direct motion into a perfect interval)${Math.abs(ua) > 2 ? ', with a leap in the upper voice' : ''}`);
  }
  if ((s1 === 7 && s2 === 6) || (s1 === 6 && s2 === 7)) flags.push('unequal fifths (a perfect and a diminished fifth)');
  return { kind, intervals: [i1, i2], flags };
}

// ---------- 12. voicing explorer ----------

export const VOICE_RANGES = {
  S: { low: 'C4', high: 'G5', extLow: 'B3', extHigh: 'A5' },
  A: { low: 'G3', high: 'C5', extHigh: 'D5' },
  T: { low: 'C3', high: 'G4', extHigh: 'A4' },
  B: { low: 'E2', high: 'C4', extLow: 'D2', extHigh: 'D4' },
} as const;

export interface VoicingReport {
  ranges: { voice: string; ok: boolean; extended: boolean }[];
  spacing: { pair: string; ok: boolean; semitones: number; limit: number }[];
  position: 'closed' | 'open' | 'keyboard' | 'unclear';
  doubling: Record<string, number>;
  missing: string[];
}

/** S A T B as pitches (top to bottom) against the notes of a chord (pitch classes). */
export function voicingReport(chordNotes: string[], voices: [string, string, string, string]): VoicingReport {
  const names = ['S', 'A', 'T', 'B'] as const;
  const ranges = names.map((v, i) => {
    const r = VOICE_RANGES[v] as { low: string; high: string; extLow?: string; extHigh?: string };
    const m = midiOf(voices[i]);
    const ok = m >= midiOf(r.low) && m <= midiOf(r.high);
    const ext = (r.extLow ? m >= midiOf(r.extLow) : ok) && (r.extHigh ? m <= midiOf(r.extHigh) : ok);
    return { voice: v, ok, extended: !ok && ext };
  });
  const m = voices.map(midiOf);
  const spacing = [
    { pair: 'S–A', semitones: m[0] - m[1], limit: 12 },
    { pair: 'A–T', semitones: m[1] - m[2], limit: 12 },
    { pair: 'T–B', semitones: m[2] - m[3], limit: 19 },
  ].map((s) => ({ ...s, ok: s.semitones >= 0 && s.semitones <= s.limit }));
  const position = m[0] - m[2] < 12 ? 'closed' : m[0] - m[2] <= 24 && m[3] < m[2] - 12 ? 'open' : m[0] - m[2] <= 24 ? 'open' : 'unclear';
  const doubling: Record<string, number> = {};
  const unique: string[] = [];
  for (const n of chordNotes) unique.push(Note.pitchClass(n));
  for (const v of voices) {
    const pc = unique.find((u) => Note.chroma(u) === Note.chroma(v));
    if (pc) doubling[pc] = (doubling[pc] ?? 0) + 1;
  }
  const missing = unique.filter((u) => !(u in doubling));
  return { ranges, spacing, position, doubling, missing };
}

// ---------- 18. V7 resolution lab ----------

export interface V7Result {
  works: number; // voicing pairs that follow the rules
  total: number;
  example: { v7: string[]; one: string[] } | null; // S A T B
  reason: string; // when none works: what goes wrong first
}

/** Every voicing of V7 and I in C major (S A T B) within the ranges; the rules of the notes for the resolution. */
export function v7Lab(complete7: boolean, completeI: boolean): V7Result {
  const V7 = ['G', 'B', 'D', 'F'];
  const I = ['C', 'E', 'G'];
  const rng = (v: 'S' | 'A' | 'T' | 'B') => {
    const r = VOICE_RANGES[v];
    return [midiOf(r.low), midiOf(r.high)] as const;
  };
  const gen = (pcs: string[], complete: boolean) => {
    const set = new Set(pcs.map((p) => Note.chroma(p)!));
    const out: number[][] = [];
    const cand = (v: 'S' | 'A' | 'T' | 'B') => {
      const [lo, hi] = rng(v);
      const l: number[] = [];
      for (let m = lo; m <= hi; m++) if (set.has(mod(m, 12))) l.push(m);
      return l;
    };
    const root = Note.chroma(pcs[0])!;
    for (const b of cand('B')) for (const t of cand('T')) for (const a of cand('A')) for (const s of cand('S')) {
      if (!(s >= a && a >= t && t >= b) || s - a > 12 || a - t > 12 || t - b > 19) continue;
      const v = [s, a, t, b];
      const counts = new Map<number, number>();
      for (const x of v) counts.set(mod(x, 12), (counts.get(mod(x, 12)) ?? 0) + 1);
      const has5 = counts.has(Note.chroma(pcs[2])!);
      const roots = counts.get(root) ?? 0;
      if (pcs.length === 4) {
        // V7: complete = each member once; incomplete = no 5th, root doubled
        if (complete ? counts.size !== 4 : has5 || roots !== 2) continue;
      } else if (complete ? counts.size !== 3 || roots !== 2 : has5 || roots !== 3) continue; // I: complete = root doubled; incomplete = root tripled, no 5th
      if (mod(b, 12) !== root) continue;
      out.push(v);
    }
    return out;
  };
  const A = gen(V7, complete7);
  const B = gen(I, completeI);
  let works = 0;
  let total = 0;
  let best: { v7: number[]; one: number[]; cost: number } | null = null;
  let firstFault = '';
  const LT = Note.chroma('B')!;
  const SEVENTH = Note.chroma('F')!;
  for (const x of A) for (const y of B) {
    total++;
    let fault = '';
    // the chordal 7th resolves down a step; the leading tone goes up to the tonic in an outer voice
    x.forEach((m, i) => {
      if (mod(m, 12) === SEVENTH && !(y[i] - m === -1 || y[i] - m === -2)) fault ||= 'the chordal 7th does not resolve down by step';
      if (mod(m, 12) === LT && (i === 0 || i === 3) && y[i] - m !== 1) fault ||= 'the leading tone in an outer voice does not rise to the tonic';
    });
    // no parallel fifths or octaves between any two voices, no hidden ones in the outer voices
    for (let i = 0; i < 4 && !fault; i++) for (let j = i + 1; j < 4 && !fault; j++) {
      const m = classifyMotion(Note.fromMidi(x[i]), Note.fromMidi(x[j]), Note.fromMidi(y[i]), Note.fromMidi(y[j]));
      const outer = i === 0 && j === 3;
      for (const f of m.flags) if (/parallel|consecutive/.test(f) || (outer && /hidden/.test(f))) fault ||= f;
    }
    if (fault) {
      firstFault ||= fault;
      continue;
    }
    works++;
    const cost = x.reduce((s, m, i) => s + Math.abs(y[i] - m), 0);
    if (!best || cost < best.cost) best = { v7: x, one: y, cost };
  }
  const names = (v: number[]) => v.map((m) => Note.fromMidi(m));
  return { works, total, example: best ? { v7: names(best.v7), one: names(best.one) } : null, reason: works ? '' : firstFault || 'no voicing of these chords fits the ranges' };
}

// ---------- 7. meter lab ----------

export interface MeterInfo {
  sig: string;
  beats: number; // beats to a bar
  division: number; // divisions to a beat
  type: string;
  pattern: string; // S w M w
}
export const METERS = ['2/4', '3/4', '4/4', '2/2', '3/2', '6/8', '9/8', '12/8', '3/8', '2/8'];
export function meterInfo(sig: string): MeterInfo {
  const [top, bottom] = sig.split('/').map(Number);
  const compound = top % 3 === 0 && top > 3 && bottom >= 8;
  const beats = compound ? top / 3 : top;
  const division = compound ? 3 : 2;
  const pattern = beats === 4 ? 'S w M w' : beats === 3 ? 'S w w' : beats === 2 ? 'S w' : Array.from({ length: beats }, (_, i) => (i === 0 ? 'S' : 'w')).join(' ');
  return { sig, beats, division, type: `${compound ? 'Compound' : 'Simple'} ${['', '', 'duple', 'triple', 'quadruple'][beats] ?? `${beats}-beat`}`, pattern };
}
/** The accents of one bar at the level of the division: "S w M w" for the beats, each beat split into its divisions. */
export function meterGrid(sig: string): { beat: number; strength: 'S' | 'M' | 'w'; divisions: number }[] {
  const m = meterInfo(sig);
  const pat = m.pattern.split(' ') as ('S' | 'w' | 'M')[];
  return pat.map((s, i) => ({ beat: i + 1, strength: s, divisions: m.division }));
}
/** The hemiola: two bars of 3/4 felt as one bar of 3/2 (accents on beats 1, 3 and 5 of six). */
export const HEMIOLA = { written: [1, 0, 0, 1, 0, 0], felt: [1, 0, 1, 0, 1, 0] };

// ---------- 5. overtone series ----------

export function partial(fundamentalMidi: number, n: number): { n: number; midi: number; name: string; cents: number; interval: string } {
  const exact = fundamentalMidi + 12 * Math.log2(n);
  const near = Math.round(exact);
  return { n, midi: exact, name: Note.fromMidi(near), cents: Math.round((exact - near) * 100), interval: n === 1 ? 'fundamental' : Interval.distance(Note.fromMidi(near - Math.round(12 * Math.log2(n))), Note.fromMidi(near)) };
}

// ---------- 1. clef reader ----------

export const CLEFS: { id: string; vex: string; label: string; ref: string; line: number }[] = [
  { id: 'french', vex: 'french', label: 'French Violin', ref: 'G4', line: 1 },
  { id: 'treble', vex: 'treble', label: 'Treble', ref: 'G4', line: 2 },
  { id: 'soprano', vex: 'soprano', label: 'Soprano', ref: 'C4', line: 1 },
  { id: 'mezzo-soprano', vex: 'mezzo-soprano', label: 'Mezzo-Soprano', ref: 'C4', line: 2 },
  { id: 'alto', vex: 'alto', label: 'Alto', ref: 'C4', line: 3 },
  { id: 'tenor', vex: 'tenor', label: 'Tenor', ref: 'C4', line: 4 },
  { id: 'baritone-c', vex: 'baritone-c', label: 'Baritone (C Clef)', ref: 'C4', line: 5 },
  { id: 'baritone-f', vex: 'baritone-f', label: 'Baritone (F Clef)', ref: 'F3', line: 3 },
  { id: 'bass', vex: 'bass', label: 'Bass', ref: 'F3', line: 4 },
  { id: 'subbass', vex: 'subbass', label: 'Sub-Bass', ref: 'F3', line: 5 },
];
export const stepOfPitch = (p: string) => Number(p.slice(-1)) * 7 + LETTERS.indexOf(p[0]);
export const pitchOfStep = (s: number) => `${LETTERS[mod(s, 7)]}${Math.floor(s / 7)}`;
/** The note on the bottom line of a clef. */
export const bottomLine = (c: { ref: string; line: number }) => pitchOfStep(stepOfPitch(c.ref) - 2 * (c.line - 1));
/** The note at a staff position (0 = bottom line, 1 = first space, …; negative below). */
export const noteAt = (c: { ref: string; line: number }, pos: number) => pitchOfStep(stepOfPitch(c.ref) - 2 * (c.line - 1) + pos);

// ---------- 11. figured bass ----------

export interface FbResult {
  notes: string[]; // bass first
  figures: string;
  chord: string; // the name of the position
  abbreviation: string;
  steps: string[];
}
const FB_FULL: Record<string, { stack: number[]; name: string; abbr: string }> = {
  '': { stack: [5, 3], name: 'triad, root position', abbr: 'none' },
  '5 3': { stack: [5, 3], name: 'triad, root position', abbr: 'none' },
  '6': { stack: [6, 3], name: 'triad, first inversion', abbr: '6/3 → 6' },
  '6 3': { stack: [6, 3], name: 'triad, first inversion', abbr: '6/3 → 6' },
  '6 4': { stack: [6, 4], name: 'triad, second inversion', abbr: '6/4' },
  '7': { stack: [7, 5, 3], name: 'seventh chord, root position', abbr: '7/5/3 → 7' },
  '6 5': { stack: [6, 5, 3], name: 'seventh chord, first inversion', abbr: '6/5/3 → 6/5' },
  '4 3': { stack: [6, 4, 3], name: 'seventh chord, second inversion', abbr: '6/4/3 → 4/3' },
  '4 2': { stack: [6, 4, 2], name: 'seventh chord, third inversion', abbr: '6/4/2 → 4/2' },
  '2': { stack: [6, 4, 2], name: 'seventh chord, third inversion', abbr: '6/4/2 → 2' },
};
/** A bass note and its figures in a key: the notes above the bass. An accidental alone alters the 3rd; a slash or + raises. */
export function explainFigures(tonic: string, major: boolean, bass: string, figures: string): FbResult | null {
  const toks = figures.trim().split(/\s+/).filter(Boolean);
  const alter = new Map<number, number>();
  const nums: string[] = [];
  for (const t of toks) {
    const m = /^([#b♭♯♮]?)(\d)?([+\\/]?)$/.exec(t);
    if (!m || (!m[1] && !m[2])) return null;
    const acc = m[1] === '#' || m[1] === '♯' ? 1 : m[1] === 'b' || m[1] === '♭' ? -1 : m[1] === '♮' ? 0 : 0;
    const n = m[2] ? Number(m[2]) : 3; // an accidental alone: the 3rd
    if (m[2]) nums.push(m[2]);
    if (m[1]) alter.set(n, m[1] === '♮' ? 99 : acc);
    if (m[3]) alter.set(n, 1);
  }
  const key = nums.join(' ');
  const full = FB_FULL[key] ?? { stack: nums.map(Number), name: 'figured chord', abbr: key };
  // figures are read against the key signature: a minor key has the natural minor scale, and an accidental changes it
  const scale = Scale.get(`${tonic} ${major ? 'major' : 'minor'}`).notes;
  const bassPc = Note.pitchClass(bass);
  const idx = scale.findIndex((n) => n[0] === bassPc[0]);
  if (idx < 0) return null;
  const notes = [bassPc];
  for (const n of [...full.stack].sort((a, b) => a - b)) {
    let p = scale[(idx + n - 1) % 7];
    const a = alter.get(n);
    if (a === 99) p = Note.pitchClass(Note.transpose(p, Note.accidentals(p).includes('#') ? '-1A' : Note.accidentals(p).includes('b') ? '1A' : '0A')) || p;
    else if (a) p = Note.transpose(p, a > 0 ? '1A' : '-1A');
    notes.push(p);
  }
  const steps = [`The bass is ${bassPc}.`, `The figures ${key || '(none)'} stand for ${full.stack.join(', ')} above the bass, in the key.`];
  if (alter.size) steps.push('An accidental (or a slash or +) alters the note it belongs to: an accidental alone alters the 3rd.');
  return { notes, figures: key || '5 3', chord: full.name, abbreviation: full.abbr, steps };
}

// ---------- 17. non-chord tones ----------

export interface NctRow {
  preparation: string;
  type: string;
  abbr: string;
  resolution: string;
  metric: string;
  look: string;
}
export const NCT_ROWS: NctRow[] = [
  { preparation: 'step', type: 'Passing tone', abbr: 'P', resolution: 'step in the same direction', metric: 'weak', look: 'a leap of a 3rd filled in' },
  { preparation: 'step', type: 'Neighbour tone', abbr: 'N', resolution: 'step in the opposite direction', metric: 'weak', look: 'a common tone on both sides' },
  { preparation: 'common tone', type: 'Suspension', abbr: 'S', resolution: 'step down', metric: 'strong', look: 'a tie and a step down' },
  { preparation: 'common tone', type: 'Retardation', abbr: 'R', resolution: 'step up', metric: 'strong', look: 'a tie and a step up' },
  { preparation: 'leap', type: 'Appoggiatura', abbr: 'App', resolution: 'step', metric: 'strong', look: 'a leap to a dissonance on the beat' },
  { preparation: 'step', type: 'Escape tone', abbr: 'ET', resolution: 'leap in the opposite direction', metric: 'weak', look: 'a step away, then a leap back' },
  { preparation: 'common tone', type: 'Anticipation', abbr: 'Ant', resolution: 'common tone', metric: 'weak', look: 'a note that arrives early and repeats' },
  { preparation: 'none', type: 'Pedal point', abbr: 'Ped', resolution: 'common tone', metric: 'any', look: 'a held or repeated note under changing chords' },
  { preparation: 'leap', type: 'Neighbour group', abbr: 'NG', resolution: 'step', metric: 'weak', look: 'two neighbours around a chord tone' },
];
export function nctFor(preparation: string, resolution: string, metric: string): NctRow[] {
  return NCT_ROWS.filter((r) => (!preparation || r.preparation === preparation) && (!resolution || r.resolution.startsWith(resolution)) && (!metric || r.metric === metric || r.metric === 'any'));
}

// ---------- 3. steps and 7. intervals ----------

/** The kind of step between two spelled notes: diatonic (different letters) or chromatic (the same letter). */
export function stepKind(a: string, b: string): { semitones: number; name: string; kind: 'diatonic' | 'chromatic' | 'other'; text: string } {
  const semis = Math.abs(midiOf(b) - midiOf(a));
  const sameLetter = a[0] === b[0];
  const name = semis === 1 ? 'half step' : semis === 2 ? 'whole step' : `${semis} half steps`;
  if (semis === 1) return { semitones: 1, name, kind: sameLetter ? 'chromatic' : 'diatonic', text: sameLetter ? 'a chromatic half step (the same letter, an augmented unison)' : 'a diatonic half step (different letters, a minor second)' };
  if (semis === 2) return { semitones: 2, name, kind: sameLetter ? 'other' : 'diatonic', text: sameLetter ? 'a double sharp or flat on the same letter' : 'a whole step (different letters, a major second)' };
  return { semitones: semis, name, kind: 'other', text: `${semis} half steps` };
}

export function intervalReport(a: string, b: string) {
  const lo = midiOf(a) <= midiOf(b) ? a : b;
  const hi = lo === a ? b : a;
  const name = Interval.distance(lo, hi);
  const iv = Interval.get(name);
  const simpleIv = Interval.get(Interval.simplify(name));
  const num = Math.abs(iv.num ?? 1);
  const simpleNum = Math.abs(simpleIv.num ?? 1);
  const inversion = Interval.get(Interval.invert(Interval.simplify(name)));
  return { name, semitones: iv.semitones ?? 0, quality: iv.q, number: num, simple: Interval.simplify(name), compound: num > 8, simpleNumber: simpleNum, inversion: inversion.name, sum: simpleNum + Math.abs(inversion.num ?? 1) };
}

// ---------- 4. scales and 6. modes ----------

export const SCALE_TYPES: [string, string][] = [
  ['major', 'Major'], ['minor', 'Natural Minor'], ['harmonic minor', 'Harmonic Minor'], ['melodic minor', 'Melodic Minor'], ['chromatic', 'Chromatic'],
  ['major pentatonic', 'Major Pentatonic'], ['minor pentatonic', 'Minor Pentatonic'],
  ['ionian', 'Ionian'], ['dorian', 'Dorian'], ['phrygian', 'Phrygian'], ['lydian', 'Lydian'], ['mixolydian', 'Mixolydian'], ['aeolian', 'Aeolian'], ['locrian', 'Locrian'],
];
export function scaleReport(tonic: string, type: string) {
  const s = Scale.get(`${tonic} ${type}`);
  const notes = s.notes;
  const steps = notes.map((n, i) => {
    const next = notes[(i + 1) % notes.length];
    const semis = mod((Note.chroma(next) ?? 0) - (Note.chroma(n) ?? 0), 12) || 12;
    return semis === 1 ? 'H' : semis === 2 ? 'W' : semis === 3 ? '1½' : String(semis);
  });
  const solfege = ['do', 'di', 're', 'ri', 'mi', 'fa', 'fi', 'sol', 'si', 'la', 'li', 'ti'];
  return { notes, steps, solfege: notes.map((n) => solfege[mod((Note.chroma(n) ?? 0) - (Note.chroma(tonic) ?? 0), 12)]), degrees: notes.map((_, i) => String(i + 1)) };
}
/** Brightness order of the modes (notes p.6): Lydian … Locrian. */
export const MODE_BRIGHTNESS = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];
/** The note that sets a mode apart from the nearer of Ionian and Aeolian. */
export function characteristicNote(tonic: string, mode: string): { degree: string; note: string; against: string } | null {
  const notes = Scale.get(`${tonic} ${mode}`).notes;
  const against = (m: string) => Scale.get(`${tonic} ${m}`).notes;
  const ion = against('ionian');
  const aeo = against('aeolian');
  if (mode === 'ionian' || mode === 'aeolian') return null;
  const diffs = (ref: string[]) => notes.map((n, i) => (Note.chroma(n) !== Note.chroma(ref[i]) ? i : -1)).filter((i) => i >= 0);
  const di = diffs(ion);
  const da = diffs(aeo);
  const pick = di.length <= da.length ? { idx: di, ref: ion, name: 'Ionian' } : { idx: da, ref: aeo, name: 'Aeolian' };
  const i = pick.idx.find((x) => x !== 2) ?? pick.idx[0];
  return { degree: `${i + 1}̂`, note: notes[i], against: pick.name };
}

// ---------- cadence strength (for the cadence player) ----------

/** After the notes (p.22): the half and imperfect cadences are weak, the perfect authentic strong; the rest in between, in this order. */
export const CADENCE_ORDER = ['cad-hc', 'cad-phc', 'cad-pc', 'cad-evaded', 'cad-dc', 'cad-iac-inv', 'cad-iac-lt', 'cad-iac-root', 'cad-pac'];
export const CADENCE_LABELS: Record<string, string> = {
  'cad-hc': 'Half Cadence', 'cad-phc': 'Phrygian Half Cadence', 'cad-pc': 'Plagal Cadence', 'cad-evaded': 'Evaded Cadence', 'cad-dc': 'Deceptive Cadence',
  'cad-iac-inv': 'Imperfect Authentic Cadence (Inverted)', 'cad-iac-lt': 'Imperfect Authentic Cadence (Leading Tone)', 'cad-iac-root': 'Imperfect Authentic Cadence (Root Position)', 'cad-pac': 'Perfect Authentic Cadence',
};
export const CADENCE_QUIZ_NAMES: Record<string, string> = {
  'cad-hc': 'HC', 'cad-phc': 'PHC', 'cad-pc': 'PC', 'cad-evaded': 'Evaded', 'cad-dc': 'DC', 'cad-iac-inv': 'IAC', 'cad-iac-lt': 'IAC', 'cad-iac-root': 'IAC', 'cad-pac': 'PAC',
};
