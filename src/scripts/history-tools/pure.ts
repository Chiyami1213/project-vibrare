// The logic of the History tools, with no page in it, so it is tested: tuning systems, the gamut and hexachords, the
// twelve modes, organum, rhythmic modes and mensuration, the Tonnetz, the fundamental bass, the twelve-tone matrix and
// the Ursatz. Ported from the packs' reference implementations (tools/history-tools.js).
import { fromStep, parse } from '../counterpoint/engine.js';

export const mod = (a: number, n: number) => ((a % n) + n) % n;
export const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const SPELL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** A pitch class from a letter name ("Eb", "F#", "c"), or null. */
export function pcOf(tok: string): number | null {
  const m = /^([A-Ga-g])(#|♯|b|♭|s)?$/.exec(tok.trim());
  if (!m) return null;
  const base = ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[m[1].toUpperCase()];
  return mod(base + (m[2] === '#' || m[2] === '♯' || m[2] === 's' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0), 12);
}

// ---------- tuning ----------

export const P5 = 1200 * Math.log2(1.5);
export const SYNTONIC = 1200 * Math.log2(81 / 80);
export const PYTH_COMMA = 12 * P5 - 7 * 1200;
const CHAIN: Record<number, number> = { 3: -3, 10: -2, 5: -1, 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: 7, 8: 8 }; // E♭ … G♯
const chainTuning = (fifth: number) => Array.from({ length: 12 }, (_, pc) => mod(CHAIN[pc] * fifth, 1200));

export interface TuningSystem {
  name: string;
  cents: () => number[];
  note: string;
}

export const SYSTEMS: Record<string, TuningSystem> = {
  pyth: { name: 'Pythagorean (Pure Fifths, E♭–G♯)', cents: () => chainTuning(P5), note: 'Pure fifths and octaves only. Thirds are ditones (81:64), 21.5 cents wide; the leftover Pythagorean comma sits in the G♯–E♭ “fifth”.' },
  just: { name: 'Just Intonation (C Major, 5-Limit)', cents: () => [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8].map((r) => 1200 * Math.log2(r)), note: 'Pure thirds and fifths on C, F and G. D–A is a comma narrow (680 cents), so a fixed keyboard cannot be just in every chord: the syntonic comma problem (Ramis, Fogliano, Salinas).' },
  mt14: { name: '¼-Comma Meantone', cents: () => chainTuning(P5 - SYNTONIC / 4), note: 'Each fifth ¼ comma narrow, so four fifths make a pure 5:4 third. Eight pure thirds; the wolf G♯–E♭ is about 738 cents (Aron 1523; Salinas 1577).' },
  mt27: { name: '2/7-Comma Meantone (Zarlino 1558)', cents: () => chainTuning(P5 - (SYNTONIC * 2) / 7), note: 'Zarlino’s temperament: thirds and minor thirds both slightly impure, fifths narrower than in ¼-comma.' },
  mt16: { name: '⅙-Comma Meantone', cents: () => chainTuning(P5 - SYNTONIC / 6), note: 'A milder meantone common in the 18th century; thirds a little wide, the wolf smaller.' },
  wm3: {
    name: 'Werckmeister III (1691)',
    cents: () => {
      const t = [P5 - PYTH_COMMA / 4, P5 - PYTH_COMMA / 4, P5 - PYTH_COMMA / 4, P5, P5, P5 - PYTH_COMMA / 4, P5, P5, P5, P5, P5, P5];
      const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
      const c: number[] = [];
      let acc = 0;
      order.forEach((pc, i) => {
        c[pc] = mod(acc, 1200);
        acc += t[i];
      });
      return c;
    },
    note: 'A circulating “well” temperament: four fifths (C–G–D–A and B–F♯) narrowed by ¼ Pythagorean comma, the rest pure. Every key is usable; each has its own colour.',
  },
  et: { name: 'Equal Temperament', cents: () => Array.from({ length: 12 }, (_, i) => 100 * i), note: 'Every semitone 2^(1/12): 100 cents. Known to Stevin and Mersenne; general practice only in the 19th century.' },
};

/** The size in cents of the fifth and of the major third on each pitch class. */
export function intervalsOf(c: number[]) {
  return {
    fifths: c.map((x, i) => mod(c[mod(i + 7, 12)] - x, 1200)),
    thirds: c.map((x, i) => mod(c[mod(i + 4, 12)] - x, 1200)),
  };
}
export const PURE_FIFTH = P5;
export const PURE_THIRD = 1200 * Math.log2(1.25);

/** Aristoxenian genera: a fourth divided into 30 parts. */
export const GENERA: [string, number[]][] = [
  ['Enharmonic', [3, 3, 24]],
  ['Soft Chromatic', [4, 4, 22]],
  ['Hemiolic Chromatic', [4.5, 4.5, 21]],
  ['Tonic Chromatic', [6, 6, 18]],
  ['Soft Diatonic', [6, 9, 15]],
  ['Intense Diatonic', [6, 12, 12]],
];
export const genusCents = (parts: number[]) => parts.map((p) => (p * 1200 * Math.log2(4 / 3)) / 30);

// ---------- the gamut and the hexachords ----------

export interface PitchInfo {
  s: string;
  L: string;
  acc: number;
  oct: number;
  step: number;
  midi: number;
}
type HexName = 'nat' | 'hard' | 'soft';
export const HEX: Record<HexName, { name: string; L: string; b: 'n' | 'b' | null }> = {
  nat: { name: 'natural (C)', L: 'CDEFGA', b: null },
  hard: { name: 'hard (G)', L: 'GABCDE', b: 'n' },
  soft: { name: 'soft (F)', L: 'FGABCD', b: 'b' },
};
export const SYL = ['ut', 're', 'mi', 'fa', 'sol', 'la'];
const inHex = (h: HexName, n: PitchInfo) => {
  if (HEX[h].L.indexOf(n.L) < 0) return false;
  if (n.L === 'B') return HEX[h].b === (n.acc === -1 ? 'b' : 'n');
  return n.acc === 0;
};
const sylOf = (h: HexName, n: PitchInfo) => SYL[HEX[h].L.indexOf(n.L)];

export interface Solmized {
  n: PitchInfo;
  syl: string;
  hex: HexName;
  mut?: boolean;
  leap?: boolean;
}

/** Guidonian solmization: stay in the hexachord while it lasts; mutate at the latest shared note. */
export function solmize(notes: PitchInfo[]): Solmized[] | null {
  const names = Object.keys(HEX) as HexName[];
  const run = (h: HexName, i: number) => {
    let k = 0;
    while (i + k < notes.length && inHex(h, notes[i + k])) k++;
    return k;
  };
  const best = (hs: HexName[], i: number) => [...hs].sort((a, b) => run(b, i) - run(a, i) || (a === 'nat' ? -1 : b === 'nat' ? 1 : 0))[0];
  const out: Solmized[] = [];
  let cur = best(names.filter((h) => inHex(h, notes[0])), 0);
  if (!cur) return null;
  for (let i = 0; i < notes.length; i++) {
    if (!inHex(cur, notes[i])) {
      const both = names.filter((h) => inHex(h, notes[i]) && i > 0 && inHex(h, notes[i - 1]));
      if (both.length) {
        const nh = best(both, i - 1);
        out[i - 1].syl = `${out[i - 1].syl}/${sylOf(nh, notes[i - 1])}`; // old/new
        out[i - 1].mut = true;
        cur = nh;
      } else {
        const one = names.filter((h) => inHex(h, notes[i]));
        if (!one.length) return null;
        cur = best(one, i);
        out.push({ n: notes[i], syl: sylOf(cur, notes[i]), hex: cur, leap: true });
        continue;
      }
    }
    out.push({ n: notes[i], syl: sylOf(cur, notes[i]), hex: cur });
  }
  return out;
}

/** A melody typed in letter names ("D F G Bb"), octave numbers optional. */
export function parseMelody(str: string, startOct = 4): { notes: PitchInfo[] } | { err: string } {
  const toks = str.trim().split(/[\s,]+/).filter(Boolean);
  const out: PitchInfo[] = [];
  let prev: PitchInfo | null = null;
  for (const t of toks) {
    const m = /^([A-Ga-g])(#|b|♭|n)?(\d)?$/.exec(t);
    if (!m) return { err: `Cannot read “${t}”.` };
    const L = m[1].toUpperCase();
    const acc = m[2] === '#' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
    let oct: number | null = m[3] != null ? Number(m[3]) : null;
    const li = 'CDEFGAB'.indexOf(L);
    if (oct == null) {
      if (!prev) oct = startOct;
      else {
        let bestStep: number | null = null;
        for (const o of [prev.oct - 1, prev.oct, prev.oct + 1]) {
          const st = li + 7 * o;
          if (bestStep == null || Math.abs(st - prev.step) < Math.abs(bestStep - prev.step)) bestStep = st;
        }
        oct = Math.floor(bestStep! / 7);
      }
    }
    const x = parse(L + (acc === 1 ? '#' : acc === -1 ? 'b' : '') + oct) as PitchInfo;
    prev = x;
    out.push(x);
  }
  return { notes: out };
}

// ---------- the twelve modes ----------

export interface ModeInfo {
  n: number;
  name: string;
  greek: string;
  fin: string;
  lo: string;
  hi: string;
  ten: string;
  z: number;
}
export const MODES12: ModeInfo[] = [
  { n: 1, name: 'Protus authentic', greek: 'Dorian', fin: 'D4', lo: 'D4', hi: 'D5', ten: 'A4', z: 3 },
  { n: 2, name: 'Protus plagal', greek: 'Hypodorian', fin: 'D4', lo: 'A3', hi: 'A4', ten: 'F4', z: 4 },
  { n: 3, name: 'Deuterus authentic', greek: 'Phrygian', fin: 'E4', lo: 'E4', hi: 'E5', ten: 'C5', z: 5 },
  { n: 4, name: 'Deuterus plagal', greek: 'Hypophrygian', fin: 'E4', lo: 'B3', hi: 'B4', ten: 'A4', z: 6 },
  { n: 5, name: 'Tritus authentic', greek: 'Lydian', fin: 'F4', lo: 'F4', hi: 'F5', ten: 'C5', z: 7 },
  { n: 6, name: 'Tritus plagal', greek: 'Hypolydian', fin: 'F4', lo: 'C4', hi: 'C5', ten: 'A4', z: 8 },
  { n: 7, name: 'Tetrardus authentic', greek: 'Mixolydian', fin: 'G4', lo: 'G4', hi: 'G5', ten: 'D5', z: 9 },
  { n: 8, name: 'Tetrardus plagal', greek: 'Hypomixolydian', fin: 'G4', lo: 'D4', hi: 'D5', ten: 'C5', z: 10 },
  { n: 9, name: 'Glarean', greek: 'Aeolian', fin: 'A4', lo: 'A4', hi: 'A5', ten: 'E5', z: 11 },
  { n: 10, name: 'Glarean', greek: 'Hypoaeolian', fin: 'A4', lo: 'E4', hi: 'E5', ten: 'C5', z: 12 },
  { n: 11, name: 'Glarean', greek: 'Ionian', fin: 'C4', lo: 'C4', hi: 'C5', ten: 'G4', z: 1 },
  { n: 12, name: 'Glarean', greek: 'Hypoionian', fin: 'C4', lo: 'G3', hi: 'G4', ten: 'E4', z: 2 },
];

/** The species of fifth and fourth that make up a mode. */
export function modeSpecies(m: ModeInfo) {
  const fin = parse(m.fin).step;
  const auth = m.lo === m.fin;
  const top = fromStep(fin + 4, 0)[0];
  return {
    authentic: auth,
    fifth: auth ? `${m.fin[0]}–${top} (lower)` : `${m.fin[0]}–${top} (upper)`,
    fourth: auth ? `${top}–${m.hi[0]} (upper)` : `${m.lo[0]}–${m.fin[0]} (lower)`,
  };
}

/** The octave of a mode, up and down, as notes of one voice (whole-note durations). */
export function modeScale(m: ModeInfo): { p: string; d: number }[] {
  const lo = parse(m.lo).step;
  const hi = parse(m.hi).step;
  const notes: { p: string; d: number }[] = [];
  for (let s = lo; s <= hi; s++) notes.push({ p: fromStep(s, 0), d: 0.5 });
  for (let s = hi - 1; s >= lo; s--) notes.push({ p: fromStep(s, 0), d: 0.5 });
  notes[notes.length - 1].d = 1;
  return notes;
}

// ---------- organum ----------

export const GCLASS: Record<number, string> = { 0: 'perfect concord', 7: 'medial concord', 5: 'medial concord', 4: 'imperfect concord', 3: 'imperfect concord', 9: 'imperfect discord', 10: 'imperfect discord', 2: 'medial discord', 8: 'medial discord', 1: 'perfect discord', 6: 'perfect discord', 11: 'perfect discord' };
export type OrganumKind = 'fourth' | 'fifth' | 'octave' | 'free';

/** The pitch `semis` semitones and `steps` letter-steps below `p`. */
function below(p: string, semis: number, steps: number): string {
  const x = parse(p);
  const st = x.step - steps;
  const nat = parse(fromStep(st, 0)).midi;
  return fromStep(st, x.midi - semis - nat);
}

export interface OrganumResult {
  principal: string[];
  organal: string[];
  intervals: number[]; // semitones mod 12
  boundary?: string;
  issues: string[];
}

export function organum(principal: string[], kind: OrganumKind): OrganumResult {
  const pr = principal;
  let org: string[];
  let boundary: string | undefined;
  if (kind === 'fifth') org = pr.map((p) => below(p, 7, 4));
  else if (kind === 'octave') org = pr.map((p) => below(p, 12, 7));
  else if (kind === 'fourth') {
    // the boundary tone is the tritus (C or F) at or below the final: the organal voice holds it rather than go lower
    let bst = parse(pr[pr.length - 1]).step;
    while (!['C', 'F'].includes(fromStep(bst, 0)[0])) bst--;
    boundary = fromStep(bst, 0);
    org = pr.map((p) => {
      const c = below(p, 5, 3);
      return parse(c).step < bst ? (parse(p).step < bst ? p : boundary!) : c;
    });
    org[org.length - 1] = pr[pr.length - 1]; // occursus: the voices meet on the final
  } else {
    // note against note: start on the octave, then the nearest consonance below, moving against the chant
    org = [];
    const choices: [number, number][] = [[12, 7], [7, 4], [9, 5], [8, 5], [4, 2], [3, 2], [0, 0]];
    pr.forEach((p, i) => {
      if (i === 0 || i === pr.length - 1) {
        org.push(below(p, 12, 7));
        return;
      }
      const cands = choices
        .map(([s, st]) => ({ s, q: parse(below(p, s, st)) }))
        .filter((c) => c.q.acc === 0 || (c.q.L === 'B' && c.q.acc === -1));
      const prev = parse(org[i - 1]);
      const dir = Math.sign(parse(p).midi - parse(pr[i - 1]).midi);
      const pick = cands.filter((c) => dir === 0 || Math.sign(c.q.midi - prev.midi) === -dir).sort((a, b) => Math.abs(a.q.midi - prev.midi) - Math.abs(b.q.midi - prev.midi))[0] ?? cands[0];
      org.push(pick.q.s);
    });
  }
  const intervals = pr.map((p, i) => mod(parse(p).midi - parse(org[i]).midi, 12));
  // the contrapunctus check of the 14th century: no parallel perfect consonances; imperfect to perfect by the nearest
  const issues: string[] = [];
  for (let i = 1; i < pr.length; i++) {
    const a = intervals[i - 1];
    const b = intervals[i];
    const mu = Math.sign(parse(pr[i]).midi - parse(pr[i - 1]).midi);
    const ml = Math.sign(parse(org[i]).midi - parse(org[i - 1]).midi);
    if ((b === 0 || b === 7) && a === b && mu === ml && mu !== 0) issues.push(`${i}→${i + 1}: parallel ${b === 7 ? 'fifths' : 'octaves or unisons'}`);
    const near: Record<number, number> = { 4: 7, 9: 0, 3: 0 };
    if (near[a] != null && (b === 0 || b === 7) && b !== near[a]) issues.push(`${i}→${i + 1}: imperfect consonance not to the nearest perfect one`);
  }
  return { principal: pr, organal: org, intervals, boundary, issues };
}

// ---------- rhythmic modes and mensuration ----------

export const RHYTHMIC_MODES: { n: number; label: string; durs: number[] }[] = [
  { n: 1, label: 'L B', durs: [2, 1] },
  { n: 2, label: 'B L', durs: [1, 2] },
  { n: 3, label: 'L B B', durs: [3, 1, 2] },
  { n: 4, label: 'B B L', durs: [1, 2, 3] },
  { n: 5, label: 'L L', durs: [3, 3] },
  { n: 6, label: 'B B B', durs: [1, 1, 1] },
];

export type Tempus = 'perf' | 'imp';
export type Prolation = 'maj' | 'min';

export function mensuration(tempus: Tempus, prolation: Prolation) {
  const semibreves = tempus === 'perf' ? 3 : 2;
  const minims = prolation === 'maj' ? 3 : 2;
  const modern = ({ 'perf,maj': '9/8', 'perf,min': '3/4', 'imp,maj': '6/8', 'imp,min': '2/4' } as Record<string, string>)[`${tempus},${prolation}`];
  return { semibreves, minims, total: semibreves * minims, modern, sign: tempus === 'perf' ? (prolation === 'maj' ? '⊙' : '○') : prolation === 'maj' ? 'Ͼ·' : 'C' };
}

// ---------- the Tonnetz ----------

export interface Triad {
  r: number;
  q: 'maj' | 'min';
}
export const triName = (t: Triad) => (t.q === 'maj' ? `${NAMES[t.r]} major` : `${NAMES[t.r].toLowerCase()} minor`);
export const triPcs = (t: Triad) => (t.q === 'maj' ? [t.r, mod(t.r + 4, 12), mod(t.r + 7, 12)] : [t.r, mod(t.r + 3, 12), mod(t.r + 7, 12)]);

/** Riemann's three transformations: P (parallel), R (relative), L (leading-tone exchange). */
export function transform(t: Triad, op: 'P' | 'L' | 'R'): Triad {
  const major = t.q === 'maj';
  if (op === 'P') return { r: t.r, q: major ? 'min' : 'maj' };
  if (op === 'R') return major ? { r: mod(t.r + 9, 12), q: 'min' } : { r: mod(t.r + 3, 12), q: 'maj' };
  return major ? { r: mod(t.r + 4, 12), q: 'min' } : { r: mod(t.r + 8, 12), q: 'maj' };
}

// ---------- the fundamental bass ----------

/**
 * The possible roots of a set of pitch classes, the best first: a root needs a third and a fifth above it; a perfect
 * fifth counts for more than a diminished one, and an augmented fifth (E–G–C read from E) for least, so that an
 * inversion is read from its true root.
 */
export function rootCandidates(pcs: number[]): { r: number; bad: number }[] {
  const out: { r: number; bad: number }[] = [];
  for (const r of pcs) {
    const iv = pcs.map((p) => mod(p - r, 12));
    const hasThird = iv.some((v) => v === 3 || v === 4);
    const fifth = iv.includes(7) ? 0 : iv.includes(6) ? 0.5 : iv.includes(8) ? 2 : -1;
    if (hasThird && fifth >= 0) out.push({ r, bad: iv.filter((v) => ![0, 3, 4, 6, 7, 8, 10, 11].includes(v)).length + fifth });
  }
  return out.sort((a, b) => a.bad - b.bad);
}

export interface FbRow {
  chord: number[]; // distinct pitch classes
  bass: number;
  root: number;
  alt?: number; // the second reading of an added-sixth chord (F–A–C–D: F or D)
  rin: number;
  rout: number;
}

export function analyseChords(text: string): FbRow[] | null {
  const chords = text.split('|').map((s) => s.trim().split(/\s+/).map(pcOf));
  if (chords.some((c) => c.some((x) => x == null) || c.length < 2)) return null;
  const rows: FbRow[] = (chords as number[][]).map((c) => {
    const u = [...new Set(c)];
    const cs = rootCandidates(u);
    const root = cs.length ? cs[0].r : c[0];
    const alt = u.length === 4 ? u.find((x) => u.map((p) => mod(p - x, 12)).sort((a, b) => a - b).join() === '0,4,7,9') : undefined;
    return { chord: u, bass: c[0], root, alt, rin: root, rout: root };
  });
  const isFifth = (d: number) => d === 5 || d === 7;
  rows.forEach((r, i) => {
    if (r.alt == null) return;
    const prev = rows[i - 1];
    const next = rows[i + 1];
    if (prev && isFifth(mod(r.alt - prev.rout, 12))) r.rin = r.alt;
    r.rout = next && isFifth(mod((next.alt != null ? next.alt : next.root) - r.root, 12)) ? r.root : next && isFifth(mod(next.root - r.alt, 12)) ? r.alt : r.root;
  });
  return rows;
}

/** How the root moves from one chord to the next. */
export function rootMotion(rows: FbRow[]): string[] {
  return rows.slice(1).map((r, i) => {
    const d = mod(r.rin - rows[i].rout, 12);
    if (d === 0) return 'same';
    if (d === 5) return 'up 4th / down 5th ✓';
    if (d === 7) return 'up 5th / down 4th ✓';
    return [3, 4, 8, 9].includes(d) ? 'third ✓' : 'step ⚠';
  });
}

// ---------- the twelve-tone matrix ----------

export function parseRow(text: string): number[] | null {
  const row = text.trim().split(/[\s,]+/).map((t) => (/^\d+$/.test(t) ? mod(Number(t), 12) : pcOf(t.replace('A#', 'Bb'))));
  if (row.length !== 12 || row.some((x) => x == null) || new Set(row).size !== 12) return null;
  return row as number[];
}

export function rowMatrix(row: number[]) {
  const r0 = row[0];
  const inv = row.map((p) => mod(2 * r0 - p, 12));
  const M = inv.map((a) => row.map((p) => mod(p - r0 + a, 12)));
  const label = (n: number) => String(mod(n - r0, 12));
  // hexachordal combinatoriality: a form whose first hexachord is the complement of the original's first hexachord
  const h1 = new Set(row.slice(0, 6));
  const comp = [...Array(12).keys()].filter((x) => !h1.has(x)).sort((a, b) => a - b).join();
  const pT: number[] = [];
  const iT: number[] = [];
  for (let n = 0; n < 12; n++) {
    if (n && [...h1].map((x) => mod(x + n, 12)).sort((a, b) => a - b).join() === comp) pT.push(n);
    if ([...h1].map((x) => mod(n - x, 12)).sort((a, b) => a - b).join() === comp) iT.push(n);
  }
  return { M, label, pT, iT: iT.map((n) => mod(n - r0, 12)) };
}

// ---------- the Ursatz ----------

export function ursatz(line: 3 | 5 | 8, mode: 'maj' | 'min', interruption: boolean) {
  const deg: Record<number, string> = { 1: 'C', 2: 'D', 3: mode === 'maj' ? 'E' : 'Eb', 4: 'F', 5: 'G', 6: mode === 'maj' ? 'A' : 'Ab', 7: mode === 'maj' ? 'B' : 'Bb', 8: 'C' };
  const seq = Array.from({ length: line }, (_, i) => line - i);
  const upper = (s: number[]) => s.map((d) => ({ p: deg[d] + (d === 8 ? '5' : line === 8 ? '4' : '5'), d: 1 }));
  const lower = (s: number[]) => s.map((_, i) => ({ p: i === s.length - 2 ? 'G2' : 'C3', d: 1 }));
  const first = seq.slice(0, -1);
  const sop = interruption ? upper(first).concat(upper(seq)) : upper(seq);
  const firstBass = first.map((_, i) => ({ p: i === first.length - 1 ? 'G2' : 'C3', d: 1 }));
  const bass = interruption ? firstBass.concat(lower(seq)) : lower(seq);
  const numerals = (s: number[]) => s.map((d) => '①②③④⑤⑥⑦⑧'[d - 1]).join('–');
  return { sop, bass, label: (interruption ? `${numerals(first)} ‖ ` : '') + numerals(seq) };
}
