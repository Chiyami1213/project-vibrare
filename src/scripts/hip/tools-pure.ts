// The logic of the seven HIP tools, with no page in it, so it is tested against the acceptance lists of the pack
// (content/hip/BUILD_BRIEF.md §6): Quantz tempo calculator, appoggiatura lab, rhythm lab, trill builder, breath and
// articulation planner, dissonance dynamics, messa di voce. Notation is the pack's mini-notation (see notation.ts).
import { Interval, Note } from 'tonal';

const EPS = 1e-9;
const round = (n: number, p = 4) => Number(n.toFixed(p));
const num = (n: number) => String(round(n, 4));

// ---------- 1. Quantz tempo calculator ----------

export type Metre = 'C' | '¢' | '2/4' | '3/4' | '3/8' | '6/8' | '9/8' | '12/8';
export type TempoClass = 'assai' | 'allegretto' | 'cantabile' | 'adagio-assai' | 'allegro';
export const METRES: Metre[] = ['C', '¢', '2/4', '3/4', '3/8', '6/8', '9/8', '12/8'];

export const TEMPO_GROUPS: { cls: TempoClass; label: string; words: string[] }[] = [
  { cls: 'assai', label: 'Allegro Assai', words: ['Allegro assai', 'Allegro di molto', 'Presto'] },
  { cls: 'allegretto', label: 'Allegretto', words: ['Allegretto', 'Allegro ma non tanto', 'Allegro ma non troppo', 'Allegro non presto', 'Allegro moderato'] },
  { cls: 'allegro', label: 'Plain Allegro', words: ['Allegro'] },
  { cls: 'cantabile', label: 'Adagio Cantabile', words: ['Adagio cantabile', 'Cantabile', 'Arioso', 'Larghetto', 'Soave', 'Dolce', 'Poco andante', 'Affettuoso', 'Pomposo', 'Maestoso', 'Alla siciliana', 'Adagio spiritoso'] },
  { cls: 'adagio-assai', label: 'Adagio Assai', words: ['Adagio assai', 'Adagio pesante', 'Lento', 'Largo assai', 'Mesto', 'Grave'] },
];
export const CLASS_LABELS: Record<TempoClass, string> = { assai: 'Allegro assai', allegretto: 'Allegretto', allegro: 'Allegro (plain)', cantabile: 'Adagio cantabile', 'adagio-assai': 'Adagio assai' };
export const FASTEST = ['crotchet', 'quaver', 'semiquaver', 'demisemiquaver', 'quaver triplet'] as const;
export type Fastest = (typeof FASTEST)[number];

const BAR_Q: Record<Metre, number> = { C: 8, '¢': 8, '2/4': 4, '3/4': 6, '3/8': 3, '6/8': 6, '9/8': 9, '12/8': 12 };
const UNIT_Q: Record<string, number> = { semibreve: 8, 'dotted minim': 6, minim: 4, 'dotted crotchet': 3, crotchet: 2, quaver: 1 };

export const classOfWord = (word: string): TempoClass => TEMPO_GROUPS.find((g) => g.words.includes(word))?.cls ?? 'allegro';

export interface TempoInput {
  metre: Metre;
  word: string;
  fastest: Fastest;
  pulse?: number;
}
export interface TempoResult {
  cls: TempoClass;
  unit: string;
  mm: number;
  pulse: number;
  spacing: number; // quavers between pulses
  covered: boolean; // false: Quantz gives no rule for this case; the nearest one is applied
  placement: string;
  barQ: number;
  bars: number;
  positions: number[]; // where the pulses fall, in quavers from the start of the first bar
  bodky: { group: string; mm: number };
  note: string;
}

const BODKY: [string, number][] = [['Adagio', 40], ['Andante', 60], ['Moderato', 80], ['Allegro', 100], ['Presto', 120]];

interface Case {
  spacing: number;
  unit: string;
  covered: boolean;
  placement: string;
  bars?: number;
  positions?: number[];
  note?: string;
}

/** The case of Quantz's tables (Reilly, p. 286): where the pulse falls and what the counting unit is. */
function caseOf(metre: Metre, cls: TempoClass, word: string, fastest: Fastest): Case {
  const barQ = BAR_Q[metre];
  const quick = fastest === 'semiquaver' || fastest === 'demisemiquaver' || fastest === 'quaver triplet';
  const bar = (placement: string, covered = true): Case => ({ spacing: barQ, unit: 'bar', covered, placement });
  const per = (unit: string, text: string, covered = true): Case => ({ spacing: UNIT_Q[unit], unit, covered, placement: text });

  if (metre === 'C') {
    if (cls === 'assai') return per('minim', 'one pulse to each minim');
    if (cls === 'allegretto') return per('crotchet', 'one pulse to each crotchet');
    if (cls === 'cantabile') return per('quaver', 'one pulse to each quaver');
    if (cls === 'adagio-assai') return { spacing: 0.5, unit: 'quaver', covered: true, placement: 'two pulses to each quaver (quaver = 40)' };
    return { spacing: 3, unit: 'crotchet', covered: true, placement: 'one pulse to every three quavers', note: 'Plain Allegro: crotchet about 120.' };
  }
  if (metre === '¢') {
    if (cls === 'assai') return per('semibreve', 'one pulse to each semibreve');
    if (cls === 'allegretto') return per('minim', 'one pulse to each minim');
    if (cls === 'cantabile') return per('crotchet', 'one pulse to each crotchet');
    if (cls === 'adagio-assai') return { spacing: 1, unit: 'crotchet', covered: true, placement: 'one pulse to each quaver (crotchet = 40)' };
    return { spacing: 6, unit: 'minim', covered: false, placement: 'one pulse to every three crotchets', note: 'Quantz gives no figure for a plain Allegro in alla breve; this follows the common-time rule (crotchet about 120) by analogy.' };
  }
  const fast = cls === 'assai' || cls === 'allegretto' || cls === 'allegro';
  if (metre === '2/4') {
    if (fast) return bar('one pulse to each bar');
  }
  if (metre === '6/8' && fast) return bar('one pulse to each bar (quick 6/8)');
  if (metre === '12/8') {
    if (word === 'Alla siciliana') {
      return { spacing: 1.5, unit: 'quaver', covered: true, placement: 'on the 1st and 3rd quaver of each group of three (quaver about 120)', positions: [0, 2, 3, 5, 6, 8, 9, 11], note: 'Siciliana in 12/8.' };
    }
    if (fast) {
      return fastest === 'quaver' || fastest === 'crotchet'
        ? { spacing: 6, unit: 'dotted minim', covered: true, placement: 'two pulses to each bar (12/8 without semiquavers)' }
        : { spacing: 3, unit: 'dotted crotchet', covered: false, placement: 'one pulse to each dotted crotchet', note: 'Quantz gives the rule for 12/8 without semiquavers; with them, the pulse is put on each dotted crotchet by analogy.' };
    }
  }
  if (metre === '3/4') {
    if (cls === 'assai') return bar('one pulse to each bar (very fast 3/4: six quick notes to a bar)');
    if (cls === 'allegretto' || cls === 'allegro') {
      if (quick) return { spacing: 4, unit: 'bar', covered: true, placement: 'three pulses to two bars (on beats 1 and 3, then 2)', bars: 2, note: '3/4 Allegro with semiquavers or quaver triplets.' };
      return bar('one pulse to each bar', false);
    }
    if (cls === 'cantabile') return word === 'Arioso' ? per('crotchet', 'one pulse to each crotchet (arioso, bass in crotchets)') : per('quaver', 'one pulse to each quaver (adagio cantabile, bass in quavers)');
  }
  if (metre === '3/8') {
    if (cls === 'assai') return bar('one pulse to each bar (very fast 3/8)');
    if (cls === 'cantabile' && word === 'Arioso') return per('quaver', 'one pulse to each quaver (arioso 3/8)');
  }
  // the rest is not in Quantz's tables: apply the common-time rule of the class
  if (cls === 'adagio-assai') return { spacing: 0.5, unit: 'quaver', covered: false, placement: 'two pulses to each quaver', note: 'Quantz gives no rule for this metre; the common-time rule of the class is used.' };
  if (cls === 'cantabile') return { ...per('quaver', 'one pulse to each quaver', false), note: 'Quantz gives no rule for this metre; the common-time rule of the class is used.' };
  return { ...bar('one pulse to each bar', false), note: 'Quantz gives no rule for this metre and class; one pulse to a bar is the nearest of his cases.' };
}

export function quantzTempo({ metre, word, fastest, pulse = 80 }: TempoInput): TempoResult {
  const cls = classOfWord(word);
  const c = caseOf(metre, cls, word, fastest);
  const barQ = BAR_Q[metre];
  const bars = c.bars ?? 1;
  const unitQ = c.unit === 'bar' ? barQ : UNIT_Q[c.unit];
  const mm = (pulse * c.spacing) / unitQ;
  const total = barQ * bars;
  let positions = c.positions;
  if (!positions) {
    positions = [];
    for (let q = 0; q < total - EPS; q += c.spacing) positions.push(round(q));
  }
  const crotchetMm = (pulse * c.spacing) / 2;
  const bodky = BODKY.reduce((best, g) => (Math.abs(Math.log(g[1] / crotchetMm)) < Math.abs(Math.log(best[1] / crotchetMm)) ? g : best));
  return {
    cls,
    unit: c.unit,
    mm: round(mm, 1),
    pulse,
    spacing: c.spacing,
    covered: c.covered,
    placement: c.placement,
    barQ,
    bars,
    positions,
    bodky: { group: bodky[0], mm: bodky[1] },
    note: c.note ?? '',
  };
}

/** Beats a minute from the times (ms) of taps: the mean of the last few intervals; null with fewer than two taps. */
export function tapTempo(times: number[]): number | null {
  if (times.length < 2) return null;
  const t = times.slice(-7);
  const mean = (t[t.length - 1] - t[0]) / (t.length - 1);
  return mean > 0 ? Math.round(60000 / mean) : null;
}

// ---------- 2. Appoggiatura lab ----------

export type AppCase = 'plain' | 'dotted' | 'tied-compound' | 'before-rest' | 'dissonant-trill' | 'falling-thirds';
export type AppSource = 'Quantz' | 'C. P. E. Bach';
export const APP_CASES: { id: AppCase; label: string; sources: AppSource[] }[] = [
  { id: 'plain', label: 'Plain Note', sources: ['Quantz', 'C. P. E. Bach'] },
  { id: 'dotted', label: 'Dotted Note', sources: ['Quantz', 'C. P. E. Bach'] },
  { id: 'tied-compound', label: 'Dotted Note Tied On (6/8)', sources: ['Quantz'] },
  { id: 'before-rest', label: 'Note Before a Rest', sources: ['Quantz'] },
  { id: 'dissonant-trill', label: 'Before a Trill on a Dissonance', sources: ['Quantz'] },
  { id: 'falling-thirds', label: 'Falling Thirds', sources: ['Quantz', 'C. P. E. Bach'] },
];

export interface AppResult {
  written: { upper: string; bass: string };
  performed: { name: string; upper: string; bass: string }[]; // several when the sources disagree
  app: number; // length of the appoggiatura, in crotchets (first realisation)
  main: number; // what is left of the main note
  rule: string;
  warning: string;
  disagree: boolean;
}

/** `value` is the main note's written value in crotchets; `appLen` is only used before a trill on a dissonance. */
export function appoggiatura(c: AppCase, opts: { value?: number; appLen?: number; source?: AppSource } = {}): AppResult {
  const base = { warning: '', disagree: false };
  if (c === 'plain') {
    const v = opts.value ?? 2;
    const app = v / 2;
    return {
      ...base,
      written: { upper: `G5:1 gF5:0 E5:${num(v)} r:1`, bass: `C3:${num(v + 2)}` },
      performed: [{ name: 'Performed', upper: `G5:1 F5:${num(app)}@0.85_ E5:${num(v - app)}@0.5 r:1`, bass: `C3:${num(v + 2)}` }],
      app,
      main: v - app,
      rule: 'Before a plain note the appoggiatura takes half its value (Q VIII, p. 95; CPE II.2, p. 90).',
    };
  }
  if (c === 'dotted') {
    const v = opts.value ?? 3;
    const app = (2 * v) / 3;
    return {
      ...base,
      written: { upper: `gF5:0 E5:${num(v)}`, bass: `C3:${num(v)}` },
      performed: [{ name: 'Performed', upper: `F5:${num(app)}@0.85_ E5:${num(v - app)}@0.5`, bass: `C3:${num(v)}` }],
      app,
      main: v - app,
      rule: 'Before a dotted note the appoggiatura takes two thirds; the main note keeps only the dot (Q VIII, p. 95; CPE II.2, p. 90).',
    };
  }
  if (c === 'tied-compound') {
    const first = 1.5;
    const tied = opts.value ?? 0.5;
    return {
      ...base,
      written: { upper: `gF5:0 E5:${num(first)}_ E5:${num(tied)}`, bass: `C3:${num(first + tied)}` },
      performed: [{ name: 'Quantz', upper: `F5:${num(first)}@0.85_ E5:${num(tied)}@0.5`, bass: `C3:${num(first + tied)}` }],
      app: first,
      main: tied,
      rule: 'In 6/8 and 6/4, with a dotted note tied to the next, the appoggiatura takes the whole first dotted note (Q VIII, pp. 95–96).',
    };
  }
  if (c === 'before-rest') {
    const v = opts.value ?? 1;
    return {
      ...base,
      written: { upper: `gF5:0 E5:${num(v)} r:${num(v)} G5:2`, bass: `C3:${num(2 * v + 2)}` },
      performed: [{ name: 'Quantz', upper: `F5:${num(v)}@0.85_ E5:${num(v)}@0.5 G5:2`, bass: `C3:${num(2 * v + 2)}` }],
      app: v,
      main: v,
      rule: 'Before a note followed by a rest the appoggiatura takes the note’s value, and the note takes the rest’s, unless you need the rest to breathe (Q VIII, p. 96).',
    };
  }
  if (c === 'dissonant-trill') {
    const v = opts.value ?? 2;
    const a = opts.appLen ?? v / 16;
    const limit = v / 16;
    const u = 0.125;
    const alt = Math.max(0, Math.round((v - a - 2 * u) / u));
    const trill: string[] = [`G5:${num(a)}`];
    for (let i = 0; i < alt; i++) trill.push(`${i % 2 === 0 ? 'F5' : 'G5'}:${num(u)}`);
    trill.push(`E5:${num(u)}`, `F5:${num(u)}`);
    return {
      ...base,
      written: { upper: `gG5:0 F5:${num(v)} E5:${num(v)}`, bass: `B2:${num(v)} C3:${num(v)}` },
      performed: [{ name: 'Quantz', upper: `${trill.join(' ')} E5:${num(v)}`, bass: `B2:${num(v)} C3:${num(v)}` }],
      app: a,
      main: v - a,
      rule: 'Before a trill on a dissonance (augmented fourth, diminished fifth, seventh, second) the appoggiatura is very short, so that the dissonance is not turned into a consonance (Q VIII, p. 96).',
      warning: a > limit + EPS ? `This appoggiatura is longer than 1/16 of the note (${num(limit)} crotchet). Over the B in the bass the trilled F is a diminished fifth; a long G would turn it into a sixth, a consonance.` : '',
    };
  }
  // falling thirds: the sources disagree
  const written = { upper: 'E5:0.5 gD5:0 C5:0.5 gB4:0 A4:1', bass: '' };
  return {
    ...base,
    written,
    performed: [
      { name: 'Quantz', upper: 'E5:0.375 D5:0.125_ C5:0.375 B4:0.125_ A4:1', bass: '' },
      { name: 'C. P. E. Bach', upper: 'E5:0.5 D5:0.125_ C5:0.375 B4:0.125_ A4:0.875', bass: '' },
    ],
    app: 0.125,
    main: 0.375,
    rule: 'Quantz (the French coulé): the small notes are tipped before the beat, in the time of the previous note. C. P. E. Bach rejects this and puts them short on the beat (Q VIII, pp. 93–94; CPE II.2, pp. 97–98).',
    disagree: true,
  };
}

// ---------- 3. Rhythm lab ----------

/** A pair of dotted notes (long, short) filling `total` crotchets, at a ratio such as 3:1. */
export const dottedPair = (ratio: number, total = 1): [number, number] => [(total * ratio) / (ratio + 1), total / (ratio + 1)];

export const DOTTED_WRITTEN = 'D5:0.75 E5:0.25 F#5:0.75 G5:0.25 A5:2';
/** The passage with the dots as the sources play them: pairs (long, short) at the ratio; 7:1 is "as short as the shortest note". */
export function dottedPerformed(ratio: number): string {
  const [l, s] = dottedPair(ratio);
  return `D5:${num(l)} E5:${num(s)} F#5:${num(l)} G5:${num(s)} A5:2`;
}

export const LOMBARD_WRITTEN = 'D5:0.25 E5:0.75 F#5:0.25 G5:0.75';
/** Lombard rhythm: the first note of each pair is shortened to `first` crotchets (as short as possible). */
export function lombardPerformed(first: number): string {
  return `D5:${num(first)} E5:${num(1 - first)} F#5:${num(first)} G5:${num(1 - first)}`;
}

export const INEQUALITY_WRITTEN = 'C5:0.25 D5:0.25 E5:0.25 F5:0.25 G5:0.25 F5:0.25 E5:0.25 D5:0.25 C5:2';
export const INEQUALITY_EXCEPTIONS: { id: string; label: string }[] = [
  { id: 'passagework', label: 'Very fast passage-work' },
  { id: 'coloratura', label: 'Vocal coloratura' },
  { id: 'strokes', label: 'Notes with strokes or dots' },
  { id: 'repeated', label: 'Repeated notes' },
  { id: 'slurs', label: 'Slurs over more than two notes' },
  { id: 'gigue', label: 'Gigue quavers' },
];
export function inequalityState(ticked: string[]): { enabled: boolean; reason: string } {
  const names = INEQUALITY_EXCEPTIONS.filter((e) => ticked.includes(e.id)).map((e) => e.label.toLowerCase());
  return names.length ? { enabled: false, reason: `Quantz leaves these notes even: ${names.join(', ')} (Q XI §12, p. 124).` } : { enabled: true, reason: '' };
}
/** The quickest notes in pairs: the 1st, 3rd, 5th, 7th held a little longer. `longShare` is 0.5 (even) to 0.6 (never as much as dotted). */
export function inequalityPerformed(longShare: number): string {
  const pairs = ['C5', 'D5', 'E5', 'F5', 'G5', 'F5', 'E5', 'D5'];
  const long = 0.5 * longShare;
  const short = 0.5 - long;
  const longVel = [0.75, 0.7, 0.75, 0.7]; // the 3rd and 7th a little less strong than the 1st and 5th
  const body = pairs.map((p, i) => (i % 2 === 0 ? `${p}:${num(long)}@${longVel[i / 2]}` : `${p}:${num(short)}@0.55`));
  return `${body.join(' ')} C5:2`;
}

export type TripletSource = 'Quantz' | 'C. P. E. Bach';
export const TRIPLET_WRITTEN = { upper: 'G5:0.75 A5:0.25 G5:1', lower: 'C5:0.3333 E5:0.3333 G4:0.3334 C5:1' };
export const TRIPLET_PERFORMED: Record<TripletSource, string> = {
  Quantz: 'G5:0.85 A5:0.15 G5:1',
  'C. P. E. Bach': 'G5:0.6667 A5:0.3333 G5:1',
};

// ---------- 4. Trill builder ----------

export type TrillStart = 'upper' | 'appoggiatura-above' | 'appoggiatura-below' | 'main';
export interface TrillOptions {
  start: TrillStart;
  notesPerPulse: number; // Quantz: 8 to a pulse of about 80
  character?: 'gay' | 'normal' | 'sad';
  termination: boolean;
  accelerate?: boolean; // L. Mozart's accelerating trill
  value?: number; // length of the written note, in crotchets
  main?: string;
  upper?: string;
  lower?: string;
  next?: string;
  dissonant?: boolean; // a trill on a dissonance against the bass
  appFraction?: number; // share of the note the appoggiatura is held (Quantz: half)
}
export interface TrillResult {
  upper: string; // mini-notation of the realised notes
  pitches: { p: string; d: number }[];
  perPulse: number; // notes to a crotchet
  warnings: string[];
}

const CHARACTER: Record<string, number> = { gay: 1.25, normal: 1, sad: 0.75 };

export function trill(o: TrillOptions): TrillResult {
  const value = o.value ?? 2;
  const main = o.main ?? 'D5';
  const up = o.upper ?? 'E5';
  const low = o.lower ?? 'C5';
  const next = o.next ?? 'C5';
  const perPulse = o.notesPerPulse * CHARACTER[o.character ?? 'normal'];
  const warnings: string[] = [];
  const out: { p: string; d: number }[] = [];

  let appLen = 0;
  if (o.start === 'appoggiatura-above' || o.start === 'appoggiatura-below') {
    appLen = value * (o.appFraction ?? 0.5);
    out.push({ p: o.start === 'appoggiatura-above' ? up : low, d: appLen });
    if (o.dissonant && appLen > value / 16 + EPS) warnings.push(`A long appoggiatura before a trill on a dissonance turns the dissonance into a consonance. Quantz makes it very short (at most 1/16 of the note, ${num(value / 16)} crotchet here).`);
  }

  // the notes of the shake alternate between the main note and its upper neighbour; their number is even, so that
  // the shake ends on the right one and the termination can follow
  const first = o.start === 'upper' ? up : main;
  const other = first === main ? up : main;
  let remaining = value - appLen - (o.termination ? 2 / perPulse : 0);
  const durs: number[] = [];
  const span = Math.max(value - appLen, EPS);
  for (let guard = 0; guard < 400; guard++) {
    const rate = o.accelerate ? perPulse * (0.5 + Math.min(1, (value - appLen - remaining) / span)) : perPulse;
    const d = 1 / rate;
    if (remaining < d - EPS) break;
    durs.push(d);
    remaining -= d;
  }
  if (durs.length % 2 === 1 && durs.length > 1) remaining += durs.pop()!;
  if (durs.length === 0) durs.push(Math.max(remaining, 0));
  else durs[0] += remaining; // what is left over lengthens the first note
  durs.forEach((d, i) => out.push({ p: i % 2 === 0 ? first : other, d }));
  if (o.termination) {
    const u = 1 / perPulse;
    out.push({ p: low, d: u }, { p: main, d: u });
  }
  const sum = out.reduce((s, n) => s + n.d, 0);
  if (Math.abs(sum - value) > 0.02) out[out.length - 1].d += value - sum;
  out.push({ p: next, d: 2 });
  const upper = out.map((n, i) => `${n.p}:${num(n.d)}${i === 0 && appLen > 0 ? '@0.8' : ''}`).join(' ');
  return { upper, pitches: out, perPulse, warnings };
}

/** The short trill (Pralltriller) is only offered when the next note is a step lower. */
export function pralltrillerAllowed(mainPitch: string, nextPitch: string): boolean {
  const a = Note.get(mainPitch);
  const b = Note.get(nextPitch);
  if (a.empty || b.empty) return false;
  const steps = (a.oct ?? 0) * 7 + a.step - ((b.oct ?? 0) * 7 + b.step);
  return steps === 1;
}
export function pralltriller(value = 0.5, main = 'D5', upper = 'E5', next = 'C5'): string {
  const snap = 0.0625;
  return `${main}:${num(snap)}_ ${upper}:${num(snap)}_ ${main}:${num(value - 2 * snap)} ${next}:1`;
}

export interface TrillPreset {
  id: string;
  label: string;
  options: TrillOptions;
}
export const TRILL_PRESETS: TrillPreset[] = [
  { id: 'quantz', label: 'Quantz, Cadential', options: { start: 'appoggiatura-above', notesPerPulse: 8, termination: true, value: 2 } },
  { id: 'cpe', label: 'C. P. E. Bach, Normal', options: { start: 'upper', notesPerPulse: 8, termination: true, value: 2 } },
  { id: 'cpe-pralltriller', label: 'C. P. E. Bach, Pralltriller', options: { start: 'main', notesPerPulse: 8, termination: false, value: 0.5 } },
  { id: 'lm', label: 'L. Mozart, Accelerating', options: { start: 'upper', notesPerPulse: 8, termination: true, accelerate: true, value: 2 } },
];

// ---------- 5. Breath and articulation planner ----------

export interface PlanNote {
  midi: number;
  d: number;
  t: number;
}
export interface Breath {
  index: number; // the breath comes after this note
  kind: 'main' | 'emergency';
  why: string;
}

const isTripletValue = (d: number) => Math.abs(d * 3 - Math.round(d * 3)) < 0.02 && Math.abs(d - Math.round(d)) > 0.02 && Math.abs(d * 2 - Math.round(d * 2)) > 0.02;
const atBarEnd = (n: PlanNote, bar: number) => {
  const end = n.t + n.d;
  return Math.abs(end / bar - Math.round(end / bar)) < 1e-6;
};

/** Quantz VII: where a flute (or a singer) may breathe, with the reason; indices count the sounding notes. */
export function planBreaths(notes: PlanNote[], barLen = 4): Breath[] {
  const out = new Map<number, Breath>();
  const K = 3;
  const motif = notes.slice(0, K);
  const sameMotif = (at: number) =>
    at > 0 && at + K <= notes.length && motif.length === K && motif.every((m, j) => notes[at + j].midi - notes[at].midi === m.midi - motif[0].midi && Math.abs(notes[at + j].d / notes[at].d - m.d / motif[0].d) < 0.01);
  for (let i = 0; i < notes.length - 1; i++) {
    const cur = notes[i];
    const nxt = notes[i + 1];
    const stepwiseTriplets = [notes[i - 1], cur, nxt].filter(Boolean).every((n) => isTripletValue(n.d)) && Math.abs(nxt.midi - cur.midi) <= 2;
    const barEnd = atBarEnd(cur, barLen);
    if (cur.d >= 2 * nxt.d - EPS && (!barEnd || stepwiseTriplets)) {
      out.set(i, { index: i, kind: 'main', why: 'long → short: the best place to breathe' });
      continue;
    }
    if (sameMotif(i + 1) && !out.has(i)) {
      out.set(i, { index: i, kind: 'main', why: 'before the restated opening motif: separate the ideas' });
      continue;
    }
    const equalRun = i > 0 && Math.abs(notes[i - 1].d - cur.d) < EPS && Math.abs(nxt.d - cur.d) < EPS && cur.d <= 0.5 + EPS;
    const onBeat = Math.abs(cur.t - Math.round(cur.t)) < 1e-6;
    if (equalRun && onBeat && !barEnd && Math.abs(nxt.midi - cur.midi) >= 3) {
      out.set(i, { index: i, kind: 'emergency', why: 'only if needed: after the first note of a group, inside a leap' });
    }
  }
  return [...out.values()].sort((a, b) => a.index - b.index);
}

export type Syllable = 'ti' | 'di' | 'ri' | 'did' | 'll';

/** Quantz's tonguing syllables (VI): ri on the long note after a short one in a dotted pair, ti for leaps and short notes, di for steps and slow notes, did'll for the quickest passage-work. */
export function syllables(notes: PlanNote[]): string[] {
  return notes.map((n, i) => {
    const prev = notes[i - 1];
    const next = notes[i + 1];
    if (prev && prev.d < n.d - EPS && n.d / prev.d >= 3 - 0.01) return 'ri';
    if ((next && n.d >= 3 * next.d - 0.01) || (next && n.d <= next.d / 3 + 0.01)) return 'ti';
    if (n.d <= 0.125 + EPS) {
      // eight or more notes to the pulse: double tonguing, did'll
      const k = (() => {
        let c = 0;
        for (let j = i; j >= 0 && notes[j].d <= 0.125 + EPS; j--) c++;
        return c;
      })();
      return k % 2 === 1 ? 'did' : "'ll";
    }
    const leap = prev ? Math.abs(n.midi - prev.midi) >= 3 : next ? Math.abs(next.midi - n.midi) >= 3 : false;
    if (leap) return 'ti';
    return 'di';
  });
}

/** Strong or weak: the downbeat is strong, and in 4/4 the third beat too; everything else is weak. */
export function metricalWeight(n: PlanNote, barLen: number): 'strong' | 'weak' {
  const pos = ((n.t % barLen) + barLen) % barLen;
  if (Math.abs(pos) < 1e-6) return 'strong';
  if (barLen === 4 && Math.abs(pos - 2) < 1e-6) return 'strong';
  return 'weak';
}

/** L. Mozart's bows, as a cross-reference: the downbeat down, the upbeat up; a dotted pair in one bow; otherwise alternating. */
export function bowing(notes: PlanNote[], barLen: number): ('down' | 'up')[] {
  const out: ('down' | 'up')[] = [];
  notes.forEach((n, i) => {
    const prev = notes[i - 1];
    const pos = ((n.t % barLen) + barLen) % barLen;
    const dottedSecond = prev && prev.d >= 3 * n.d - 0.01 && Math.abs(prev.t + prev.d - n.t) < 1e-6; // the short note of a dotted pair
    if (dottedSecond) out.push(out[i - 1]);
    else if (Math.abs(pos) < 1e-6) out.push('down');
    else if (Math.abs(n.t + n.d - Math.ceil((n.t + 1e-6) / barLen) * barLen) < 1e-6) out.push('up');
    else out.push(out.length ? (out[out.length - 1] === 'down' ? 'up' : 'down') : 'down');
  });
  return out;
}

// ---------- 6. Dissonance dynamics ----------

export type DissClass = 'consonant' | 'mf' | 'f' | 'ff';
export const DISS_ORDER: DissClass[] = ['consonant', 'mf', 'f', 'ff'];
export type GlobalLevel = 'normal' | 'p' | 'pp';

/** The intervals of the upper notes above the bass, as names such as "3m", "5d", "6A", "9M". */
export function intervalsAbove(bass: string, uppers: string[]): string[] {
  return uppers.map((u) => Interval.distance(bass, u));
}
/** An interval name as number and quality; tenths and the like are reduced to thirds, but a ninth stays a ninth. */
const parseIv = (s: string) => {
  const m = /^(-?\d+)([PMmAd]+)$/.exec(s);
  if (!m) return { n: 0, q: '' };
  const n = Math.abs(Number(m[1]));
  return { n: n === 9 ? 9 : n > 8 ? ((n - 1) % 7) + 1 : n, q: m[2] };
};

/** Quantz's class of a chord (XVII.vi, pp. 256–259): by the intervals above the bass, strongest first. */
export function dissonanceClass(bass: string, uppers: string[]): DissClass {
  const ivs = intervalsAbove(bass, uppers).map(parseIv);
  const has = (n: number, q?: string) => ivs.some((i) => i.n === n && (q === undefined || i.q === q));
  const second = has(2, 'M') || has(2, 'm');
  const ninth = ivs.some((i) => i.n === 9);
  if (has(6, 'A') || has(7, 'd') || (has(2, 'A') && has(4, 'A')) || (has(3, 'm') && has(4, 'A')) || (has(5, 'd') && has(6, 'M')) || (second && has(4) && has(7))) return 'ff';
  if ((second && has(4, 'A')) || (has(5, 'd') && has(6, 'm'))) return 'f';
  if (ninth) return 'consonant'; // 9ths, 9/4 and 9/7 need no special emphasis
  if ((second && has(4, 'P')) || (has(5, 'P') && has(6)) || (has(3, 'm') && has(6, 'm')) || (has(7, 'm') && has(3, 'm')) || has(7, 'M')) return 'mf';
  return 'consonant';
}

/** The global level scales the classes down: p by one step, pp by two (pp: the strongest gets only mf). */
export function scaleClass(c: DissClass, level: GlobalLevel): DissClass {
  const down = level === 'p' ? 1 : level === 'pp' ? 2 : 0;
  return DISS_ORDER[Math.max(0, DISS_ORDER.indexOf(c) - down)];
}

export const CLASS_NAMES: Record<DissClass, string> = { consonant: 'mp (no special emphasis)', mf: 'mf', f: 'f', ff: 'ff' };

/** Quantz's harpsichord texture for a class: the notes (MIDI, lowest first) and whether to arpeggiate (ff). */
export function harpsichordTexture(c: DissClass, bass: string, uppers: string[]): { midis: number[]; arpeggio: boolean } {
  const b = Note.midi(bass) ?? 45;
  const tones = uppers.map((u) => Note.midi(u)).filter((m): m is number => m !== null);
  const midis = [b, ...(c === 'consonant' ? tones.slice(0, 3) : tones)];
  if (c !== 'consonant') midis.push(b - 12); // mf and louder: the bass doubled an octave lower
  if (c === 'f' || c === 'ff') midis.push(...tones.slice(0, 2).map((m) => m - 12)); // f: chord tones in the left hand too
  return { midis: [...new Set(midis)].sort((x, y) => x - y), arpeggio: c === 'ff' };
}
/** On a piano the class is loudness. */
export const PIANO_VELOCITY: Record<DissClass, number> = { consonant: 0.4, mf: 0.6, f: 0.8, ff: 1 };

export const DISS_PRESETS: { label: string; bass: string; uppers: string[]; fig: string }[] = [
  { label: '5/3', bass: 'A2', uppers: ['A3', 'C4', 'E4'], fig: '5/3' },
  { label: '6/5 over a Raised Bass', bass: 'G#2', uppers: ['B3', 'D4', 'E4'], fig: '6/5' },
  { label: '♯6/4/3 (Augmented 6th)', bass: 'F2', uppers: ['A3', 'B3', 'D#4'], fig: '♯6/4/3' },
  { label: '4/2', bass: 'D3', uppers: ['E3', 'G3', 'B3'], fig: '4/2' },
  { label: 'Major 7th', bass: 'C3', uppers: ['E3', 'G3', 'B3'], fig: '7 (major)' },
  { label: '9/7', bass: 'G2', uppers: ['A3', 'F3', 'B3'], fig: '9/7' },
];

// ---------- 7. Messa di voce ----------

export interface Envelope {
  id: string;
  label: string;
  source: string;
  points: [number, number][]; // time 0..1, level 0..1
  note: string;
}

const curve = (f: (t: number) => number): [number, number][] => Array.from({ length: 41 }, (_, i) => [i / 40, round(f(i / 40), 4)]);
export const ENVELOPES: Envelope[] = [
  { id: 'quantz', label: 'Quantz: Messa di Voce', source: 'Q XIV, pp. 165–166', points: curve((t) => 0.08 + 0.8 * Math.sin(Math.PI * t)), note: 'Begin pianissimo, swell to the middle, diminish to the end; keep the pitch steady while the sound grows and fades.' },
  { id: 'lm-first', label: 'L. Mozart: First Division of the Bow', source: 'LM V (cross-reference)', points: curve((t) => 0.12 + 0.76 * Math.sin(Math.PI * t) ** 1.3), note: 'Soft, loud, soft: the same shape as the messa di voce, drawn with the bow.' },
];

export interface SubstitutePattern {
  id: string;
  label: string;
  notes: string; // mini-notation of a note of four crotchets
  text: string;
}
export const SUBSTITUTES: SubstitutePattern[] = [
  { id: 'written', label: 'The Long Note', notes: 'C5:4', text: 'A note of four crotchets, as written. A harpsichord cannot swell it.' },
  { id: 'harpsichord-trill', label: 'Harpsichord: Trill Filling', notes: `C5:1 ${Array.from({ length: 12 }, (_, i) => `${i % 2 === 0 ? 'D5' : 'C5'}:0.25`).join(' ')}`, text: 'The note is held for a crotchet, then kept alive with a trill (C. P. E. Bach III §§19–20, p. 156).' },
  { id: 'harpsichord-broken', label: 'Harpsichord: Broken Chord', notes: 'C5:0.5 E5:0.5 G5:0.5 E5:0.5 C5:0.5 E5:0.5 G5:0.5 C5:0.5', text: 'The sustained note is renewed by a broken chord around it (C. P. E. Bach III §7, p. 150).' },
  { id: 'clavichord-bebung', label: 'Clavichord: Bebung', notes: `C5:2 ${Array.from({ length: 8 }, () => 'C5:0.25@0.6').join(' ')}`, text: 'After half the note the finger pulses on the key: the Bebung (C. P. E. Bach III §19, p. 156). Shown here as repeated soft strokes.' },
];
