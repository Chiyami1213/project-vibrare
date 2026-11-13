// The logic of the partimento tools, with no page in it, so it is tested: the bass-motion explorer, the combination
// builder, the recognition and ear quizzes, the nomenclature builder, the P–T–R grid, the clausulae mixer, the
// simple–compound–double morph, the suspension finder, and the Durante and Fenaroli comparison of the Rule of the Octave.
import { degreeLabel, figureStack, playableNotes, slicesOf, transposeExample } from './model.ts';
import type { ExampleData, PlayNote, RealizedEvent } from './model.ts';

export interface ToolExample extends ExampleData {
  title: string;
}
export interface ToolPattern {
  id: string;
  name: string;
  group: string;
  kind: string;
  form?: string;
  modes?: string[];
  ex: ToolExample[];
}

const EPS = 1e-9;
const mod7 = (n: number) => ((n % 7) + 7) % 7;
const LET = 'CDEFGAB';
const bassOf = (ex: ExampleData) => ex.realized.voices[ex.realized.voices.length - 1];
const covers = (e: RealizedEvent, t: number) => e.t <= t + EPS && t < e.t + e.d - EPS;

// ---------- 1. Bass-motion explorer ----------

export interface Move {
  dir: 1 | -1;
  size: number; // interval number: 2 = a second … 7 = a seventh
}
export type MovePair = [Move, Move];
const word = (m: Move) => `${m.size}${m.dir > 0 ? 'up' : 'down'}`;
export const pairId = (p: MovePair) => `dis-${word(p[0])}-${word(p[1])}`;
export const pairLabel = (p: MovePair) => `${p[0].size}${p[0].dir > 0 ? '↑' : '↓'} ${p[1].size}${p[1].dir > 0 ? '↑' : '↓'}`;
const parsePairId = (id: string): MovePair | null => {
  const m = /^dis-(\d)(up|down)-(\d)(up|down)$/.exec(id);
  return m ? [{ size: Number(m[1]), dir: m[2] === 'up' ? 1 : -1 }, { size: Number(m[3]), dir: m[4] === 'up' ? 1 : -1 }] : null;
};

/** The steps of the bass (a letter-step count from the start degree), moving by the pair in turn. */
export function bassSteps(start: number, pair: MovePair, count: number): number[] {
  const out = [start - 1];
  for (let i = 1; i < count; i++) {
    const m = pair[(i - 1) % 2];
    out.push(out[i - 1] + m.dir * (m.size - 1));
  }
  return out;
}
export const degreesOf = (steps: number[]) => steps.map((s) => mod7(s) + 1);
/** Pitches in C major, with the lowest note no lower than C2. */
export function bassPitches(steps: number[]): string[] {
  const lowest = Math.min(...steps);
  const shift = Math.max(0, Math.ceil((14 - lowest) / 7)); // C2 = step 14 when C0 = 0
  return steps.map((s) => `${LET[mod7(s)]}${Math.floor(s / 7) + shift}`);
}

export interface MotiMatch {
  exact: string | null;
  same: string[]; // other patterns that make the same line (6↑5↓ is 3↓4↑)
  inverse: string | null; // the pattern of the same moves in the other order (metric inversion)
  stepwise: string[]; // two steps the same way: the stepwise motions
}

export function matchMoti(pair: MovePair, patterns: { id: string; group: string }[]): MotiMatch {
  const ids = new Set(patterns.map((p) => p.id));
  const exact = ids.has(pairId(pair)) ? pairId(pair) : null;
  const seq = degreesOf(bassSteps(1, pair, 8)).join();
  const same = [...ids].filter((id) => id !== exact && parsePairId(id) !== null && degreesOf(bassSteps(1, parsePairId(id)!, 8)).join() === seq);
  const swapped: MovePair = [pair[1], pair[0]];
  const inverse = ids.has(pairId(swapped)) && pairId(swapped) !== exact ? pairId(swapped) : null;
  const sameStep = pair[0].size === 2 && pair[1].size === 2 && pair[0].dir === pair[1].dir;
  const stepwise = sameStep ? patterns.filter((p) => p.group === (pair[0].dir > 0 ? 'moti-diatonic-rising' : 'moti-diatonic-descending')).map((p) => p.id) : [];
  return { exact, same, inverse, stepwise };
}

// ---------- 2. Combination builder ----------

/** Examples of the same number of parts and the same mode, in the chosen key, one after the other. */
export function chainExamples(examples: ToolExample[], target: string): ExampleData | null {
  if (examples.length === 0) return null;
  const parts = examples[0].parts;
  if (examples.some((e) => e.parts !== parts)) return null;
  const voices: RealizedEvent[][] = Array.from({ length: parts }, () => []);
  let offset = 0;
  for (const e of examples) {
    const t = transposeExample(e, target).example;
    // durations are in beats of the example's own beat unit; the chain counts in quarter beats
    const scale = e.beatUnit === 'half' ? 2 : 1;
    t.realized.voices.forEach((v, i) => {
      for (const ev of v) voices[i].push({ ...ev, t: offset + ev.t * scale, d: ev.d * scale });
    });
    offset += t.realized.lengthBeats * scale;
  }
  const first = examples[0];
  return {
    id: `chain-${examples.map((e) => e.id).join('+')}`,
    title: examples.map((e) => e.title).join(' → '),
    key: target,
    meter: first.meter,
    beatUnit: 'quarter',
    parts,
    realized: { voiceOrder: first.realized.voiceOrder, lengthBeats: offset, voices },
  };
}

// ---------- 3. Recognition quiz and 8. ear quiz ----------

/** A seeded random number generator, so that a question can be repeated in a test. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const shuffle = <T>(xs: T[], r: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Only the bass and the top voice, as in the recognition quiz. */
export function reduceExample(ex: ToolExample): ExampleData {
  const v = ex.realized.voices;
  return { ...ex, parts: 2, realized: { ...ex.realized, voices: [v[0], v[v.length - 1]] }, voiceNames: undefined, analysis: undefined };
}

export interface Question {
  answer: string; // pattern id
  options: { id: string; name: string }[];
  example: ToolExample;
}

/** A random example, and four names, from the same group where it has enough. */
export function recognitionQuestion(patterns: ToolPattern[], r: () => number, label = (p: ToolPattern) => p.name): Question | null {
  const withEx = patterns.filter((p) => p.ex.length > 0);
  if (withEx.length === 0) return null;
  const pick = withEx[Math.floor(r() * withEx.length)];
  // the other names come from the same group; a group too small to give three is filled up from the others
  const rest = patterns.filter((p) => p.id !== pick.id && label(p) !== label(pick));
  const ordered = [...shuffle(rest.filter((p) => p.group === pick.group), r), ...shuffle(rest.filter((p) => p.group !== pick.group), r)];
  const names = new Set([label(pick)]);
  const others = ordered.filter((p) => (names.has(label(p)) ? false : (names.add(label(p)), true))).slice(0, 3);
  const options = shuffle([pick, ...others], r).map((p) => ({ id: p.id, name: label(p) }));
  return { answer: pick.id, options, example: pick.ex[Math.floor(r() * pick.ex.length)] };
}

/** The type of a cadence for the ear quiz: Phrygian half, deceptive, Neapolitan, Galant, or its form. */
export function cadenceType(p: { id: string; name: string; form?: string }): string {
  const n = `${p.id} ${p.name}`.toLowerCase();
  if (n.includes('phrygian')) return 'Phrygian Half';
  if (n.includes('deceptive')) return 'Deceptive';
  if (n.includes('neapolitan')) return 'Neapolitan';
  if (n.includes('galant')) return 'Galant';
  const f = (p.form ?? '').split(' ')[0];
  return f === 'Simple' || f === 'Compound' || f === 'Double' ? f : '';
}
export function earQuestion(patterns: ToolPattern[], r: () => number): Question | null {
  const ok = patterns.filter((p) => p.ex.length > 0 && cadenceType(p) !== '');
  const q = recognitionQuestion(ok, r, (p) => cadenceType(p));
  if (!q) return null;
  // the other choices are types, not patterns: take them from all the types there are
  const types = [...new Set(ok.map(cadenceType))];
  const answerType = cadenceType(ok.find((p) => p.id === q.answer)!);
  const options = shuffle([answerType, ...shuffle(types.filter((t) => t !== answerType), r).slice(0, 3)], r).map((t) => ({ id: t, name: t }));
  return { ...q, answer: answerType, options };
}

// ---------- 4. Nomenclature builder ----------

export type Family = 'authentic' | 'half' | 'deceptive' | 'discant' | 'alto' | 'tenor';
export interface NameChoice {
  family: Family;
  strength?: 'perfect' | 'imperfect'; // authentic
  form: 'simple' | 'compound' | 'double';
  variety?: 'none' | 'galant' | 'neapolitan';
  phrygian?: boolean; // half
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The name and abbreviation after the grammar of the notes: [Deceptive] [Perfect|Imperfect] [Authentic] form [Galant|Neapolitan|Discant|Alto|Tenor] Cadence. */
export function buildName(c: NameChoice): { words: string[]; name: string; abbr: string } {
  const w: string[] = [];
  const variety = c.variety && c.variety !== 'none' ? c.variety : '';
  if (c.family === 'half') {
    if (variety === 'galant') w.push('Galant');
    if (c.phrygian) w.push('Phrygian');
    w.push('Half');
  } else {
    if (c.family === 'deceptive') w.push('Deceptive');
    // perfect or imperfect belongs to the authentic cadences; the Neapolitan ones are named by form only (SNC, CNC)
    if (c.family === 'authentic' && variety !== 'neapolitan') w.push(cap(c.strength ?? 'perfect'));
    // plain authentic cadences say so (PASC, PACC, PADC); the Galant ones do not (PSGC, PCGC)
    if (c.family === 'authentic' && !variety) w.push('Authentic');
    w.push(cap(c.form));
    if (variety) w.push(cap(variety));
    if (c.family === 'discant' || c.family === 'alto' || c.family === 'tenor') w.push(cap(c.family));
  }
  w.push('Cadence');
  const abbr = c.family === 'half' && !c.phrygian && !variety ? 'HC' : w.map((x) => x[0]).join(''); // the initials: PASC, PCGC, SNC, DCC, GHC, PHC
  return { words: w, name: w.join(' '), abbr };
}

/** The cadence patterns that match a choice, by id (the pack's own pattern ids). */
export function cadenceIds(c: NameChoice, patterns: { id: string; form?: string }[]): string[] {
  const ids = new Set(patterns.map((p) => p.id));
  const formOf = (id: string) => (patterns.find((p) => p.id === id)?.form ?? '').toLowerCase();
  const formMatch = (id: string) => formOf(id).includes(c.form);
  let cand: string[] = [];
  const variety = c.variety && c.variety !== 'none' ? c.variety : '';
  if (c.family === 'half') cand = c.phrygian ? ['c3-phrygian-half'] : variety === 'galant' ? ['c3-galant', 'c4-galant'] : ['converging-cadence'];
  else if (c.family === 'deceptive') cand = ['c3-deceptive'];
  else if (variety === 'galant') cand = ['c3-galant', 'c4-galant'];
  else if (variety === 'neapolitan') cand = ['c3-neapolitan', 'c4-neapolitan'];
  else if (c.family === 'authentic') cand = ['c3-simple-perfect', 'c3-compound-perfect', 'c3-compound-65', 'c3-double', 'c4-simple', 'c4-compound', 'c4-compound-65', 'c4-double'].filter(formMatch);
  else if (c.family === 'discant') cand = ['c2-simple-discant', 'c2-compound-discant', 'c2-double-discant', 'c4-discant'].filter(formMatch);
  else if (c.family === 'tenor') cand = ['c2-simple-tenor', 'c2-compound-tenor', 'c2-double-tenor', 'c3-simple-tenor', 'c3-compound-tenor', 'c4-simple-tenor'].filter(formMatch);
  else if (c.family === 'alto') cand = ['c4-alto'];
  return cand.filter((id) => ids.has(id));
}

// ---------- 5. P–T–R grid ----------

export interface Range {
  from: number;
  to: number; // beats; from === to: nothing
}
export interface PTR {
  P: Range;
  T: Range;
  R: Range;
}

/**
 * Preparation, tension, resolution, cut by the bass: the resolution is the last chord; the tension is the chords over
 * the note the bass stands on before it (the dominant); the preparation is whatever comes before.
 */
export function splitPTR(ex: ExampleData): PTR {
  const voices = ex.realized.voices;
  const bass = bassOf(ex);
  const onsets = [...new Set(voices.flatMap((v) => v.filter((e) => !e.rest).map((e) => e.t)))].sort((a, b) => a - b);
  const pitchAt = (t: number) => bass.find((e) => covers(e, t))?.pitch;
  const n = onsets.length;
  const end = ex.realized.lengthBeats;
  if (n < 2) return { P: { from: 0, to: 0 }, T: { from: 0, to: 0 }, R: { from: 0, to: end } };
  const r0 = onsets[n - 1];
  const dom = pitchAt(onsets[n - 2]);
  let i = n - 2;
  while (i > 0 && pitchAt(onsets[i - 1]) === dom) i--;
  const t0 = onsets[i];
  return { P: { from: 0, to: t0 }, T: { from: t0, to: r0 }, R: { from: r0, to: end } };
}

/** The notes that sound within a range, moved to start at 0 and cut at the end of the range. */
export function rangeNotes(ex: ExampleData, r: Range): PlayNote[] {
  return playableNotes(ex)
    .filter((n) => n.start >= r.from - EPS && n.start < r.to - EPS)
    .map((n) => ({ ...n, start: n.start - r.from, dur: Math.min(n.dur, r.to - n.start) }));
}

export const PTR_ROWS: { label: string; ids: Record<2 | 3 | 4, string | null> }[] = [
  { label: 'Simple', ids: { 2: 'c2-simple-discant', 3: 'c3-simple-perfect', 4: 'c4-simple' } },
  { label: 'Compound', ids: { 2: 'c2-compound-tenor', 3: 'c3-compound-perfect', 4: 'c4-compound' } },
  { label: 'Double', ids: { 2: 'c2-double-discant', 3: 'c3-double', 4: 'c4-double' } },
  { label: 'Galant', ids: { 2: null, 3: 'c3-galant', 4: 'c4-galant' } },
  { label: 'Neapolitan', ids: { 2: null, 3: 'c3-neapolitan', 4: 'c4-neapolitan' } },
  { label: 'Deceptive', ids: { 2: null, 3: 'c3-deceptive', 4: null } },
  { label: 'Phrygian Half', ids: { 2: null, 3: 'c3-phrygian-half', 4: null } },
];

// ---------- 6. Clausulae mixer ----------

export type Clausula = 'cantizans' | 'altizans' | 'tenorizans' | 'basizans';
export const CLAUSULA_ORDER: Clausula[] = ['cantizans', 'altizans', 'tenorizans', 'basizans']; // weakest to strongest
export const CLAUSULAE: Record<Clausula, { degrees: string; cadence: string; example: string; from: [number, number][] }> = {
  cantizans: { degrees: '(①–)⑦–①', cadence: 'discant cadence', example: 'cl-discant', from: [[7, 1]] },
  altizans: { degrees: '(③–)⑤–③ or (⑤–)④–③', cadence: 'alto cadence', example: 'cl-alto', from: [[5, 3], [4, 3]] },
  tenorizans: { degrees: '(③–)②–①', cadence: 'tenor cadence', example: 'cl-tenor', from: [[2, 1]] },
  basizans: { degrees: '(①–)⑤–①', cadence: 'perfect cadence', example: 'cl-perfect', from: [[5, 1]] },
};

/** Which clausula a voice sings in the last two sonorities of an example, by its degrees. */
export function voiceClausulae(ex: ExampleData): (Clausula | null)[] {
  const slices = slicesOf(ex);
  const last = slices[slices.length - 1];
  const prev = slices[slices.length - 2];
  const circled = '①②③④⑤⑥⑦';
  const deg = (v: RealizedEvent[], t: number) => {
    const e = v.find((x) => covers(x, t) && x.pitch);
    return e?.pitch ? circled.indexOf(degreeLabel(e.pitch, ex.key).replace(/[♯♭]/g, '')) + 1 : 0;
  };
  return ex.realized.voices.map((v) => {
    if (!prev || !last) return null;
    const a = deg(v, prev.beat);
    const b = deg(v, last.beat);
    return CLAUSULA_ORDER.find((c) => CLAUSULAE[c].from.some(([x, y]) => x === a && y === b)) ?? null;
  });
}

// ---------- 7. Simple, compound, double ----------

/** The sonorities over the dominant (the fifth degree of the bass), as figure strings: "5/3", "6/4", "5/4". */
export function dominantSonorities(ex: ExampleData): string[] {
  const bass = bassOf(ex);
  return slicesOf(ex)
    .filter((s) => {
      const e = bass.find((x) => covers(x, s.beat) && x.pitch);
      return e?.pitch && degreeLabel(e.pitch, ex.key) === '⑤';
    })
    .map((s) => {
      const nums = [...new Set(ex.realized.voices.slice(0, -1).map((v) => v.find((e) => covers(e, s.beat) && e.fig)?.fig).filter(Boolean) as string[])];
      const stack = figureStack(nums).map((x) => x.replace(/[♯♭♮+]/g, ''));
      return stack.join('/') || '5/3';
    });
}

// ---------- 9. Suspension finder ----------

export type SuspKind = '4–3' | '7–6' | '9–8';
// the bass motions (in letter steps: +1 a second up, −3 a fourth down) after which a suspension can be prepared
export const SUSP_MOTIONS: Record<SuspKind, { steps: number; prepared: string }[]> = {
  '4–3': [
    { steps: 4, prepared: 'from the octave (up a 5th)' },
    { steps: -3, prepared: 'from the octave (down a 4th)' },
    { steps: -1, prepared: 'from the 3rd (down a step)' },
    { steps: 1, prepared: 'from the 5th (up a step)' },
    { steps: 2, prepared: 'from the 6th (up a 3rd)' },
    { steps: 3, prepared: 'from the minor 7th (up a 4th)' },
  ],
  '7–6': [
    { steps: 1, prepared: 'from the octave (up a step)' },
    { steps: 3, prepared: 'from the 3rd (up a 4th)' },
    { steps: -4, prepared: 'from the 3rd (down a 5th)' },
    { steps: 5, prepared: 'from the 5th (up a 6th)' },
    { steps: -2, prepared: 'from the 5th (down a 3rd)' },
    { steps: -1, prepared: 'from the 6th (down a step)' },
  ],
  '9–8': [
    { steps: 1, prepared: 'from the 3rd (up a step)' },
    { steps: 3, prepared: 'from the 5th (up a 4th)' },
    { steps: -4, prepared: 'from the 5th (down a 5th)' },
  ],
};

export interface SuspFinding {
  index: number; // the bass note that carries the suspension
  kind: SuspKind;
  prepared: string;
}

/** Bass notes (a letter-step number each; repeated notes are skipped by the caller) → where each suspension is possible. */
export function findSuspensions(steps: number[]): SuspFinding[] {
  const out: SuspFinding[] = [];
  for (let i = 1; i < steps.length; i++) {
    const move = steps[i] - steps[i - 1];
    for (const kind of Object.keys(SUSP_MOTIONS) as SuspKind[]) {
      for (const m of SUSP_MOTIONS[kind]) if (m.steps === move) out.push({ index: i, kind, prepared: m.prepared });
    }
  }
  return out;
}

/** Letter steps of note names or degrees such as "C3 D3 G2", "1 2 5"; null if anything cannot be read. */
export function parseBass(text: string): number[] | null {
  const toks = text.trim().split(/[\s,–-]+/).filter(Boolean);
  if (toks.length < 2) return null;
  const circled = '①②③④⑤⑥⑦';
  const out: number[] = [];
  let prev: number | null = null;
  for (const t of toks) {
    const m = /^([A-Ga-g])(#|b|♯|♭)?(\d)$/.exec(t);
    if (m) {
      out.push(Number(m[3]) * 7 + LET.indexOf(m[1].toUpperCase()));
    } else {
      const d = /^[1-7]$/.test(t) ? Number(t) : circled.indexOf(t) + 1;
      if (!d) return null;
      // a scale degree: the nearest octave to the note before
      const base = prev === null ? 3 * 7 + (d - 1) : prev - mod7(prev) + (d - 1);
      const cands = [base - 7, base, base + 7];
      out.push(prev === null ? base : cands.reduce((a, b) => (Math.abs(b - prev!) < Math.abs(a - prev!) ? b : a)));
    }
    prev = out[out.length - 1];
  }
  return out;
}

/** The bass of an example as letter steps, one per bass note (a tied or repeated note counts once). */
export function bassStepsOf(ex: ExampleData): number[] {
  const steps: number[] = [];
  for (const e of bassOf(ex)) {
    if (!e.pitch || e.tie) continue;
    const m = /^([A-G])[#b]*(-?\d)$/.exec(e.pitch);
    if (m) steps.push(Number(m[2]) * 7 + LET.indexOf(m[1]));
  }
  return steps.filter((s, i) => i === 0 || s !== steps[i - 1]);
}

// ---------- 10. Durante and Fenaroli ----------

export interface RoRow {
  degree: string;
  fenaroli: { figures: string; beat: number } | null;
  durante: { figures: string; beat: number } | null;
  differs: boolean;
}

const sonority = (ex: ExampleData) =>
  slicesOf(ex).map((s) => {
    const e = bassOf(ex).find((x) => covers(x, s.beat) && x.pitch);
    // the octave is a doubling, not a figure: 8/6/3 and 6/3 are the same harmony
    return { beat: s.beat, degree: e?.pitch ? degreeLabel(e.pitch, ex.key) : '', figures: s.figures.filter((f) => f !== '8').join('/') || '5/3' };
  });

/** The two scales side by side, one row to a step of the bass; Durante repeats the fifth going up. */
export function roCompare(fen: ExampleData, dur: ExampleData): RoRow[] {
  const a = sonority(fen);
  const b = sonority(dur);
  const used = new Set<number>();
  const rows: RoRow[] = a.map((x) => {
    const j = b.findIndex((y, k) => !used.has(k) && y.degree === x.degree);
    if (j >= 0) used.add(j);
    const y = j >= 0 ? b[j] : null;
    return { degree: x.degree, fenaroli: { figures: x.figures, beat: x.beat }, durante: y ? { figures: y.figures, beat: y.beat } : null, differs: !y || y.figures !== x.figures };
  });
  b.forEach((y, k) => {
    if (!used.has(k)) rows.splice(Math.min(rows.length, k), 0, { degree: y.degree, fenaroli: null, durante: { figures: y.figures, beat: y.beat }, differs: true });
  });
  return rows;
}

/** The notes of one sonority of an example, for a play button. */
export function sonorityNotes(ex: ExampleData, beat: number): PlayNote[] {
  return playableNotes(ex).filter((n) => n.start <= beat + EPS && beat < n.start + n.dur - EPS);
}
