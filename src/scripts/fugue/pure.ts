// The logic of the fugue tools, with no page in it, so it is tested against the pack's reference page: the answer
// generator (Marpurg's rules), the stretto finder, invertible counterpoint, the inversion mirror, the entry orders,
// Fux's plan by mode, and the timeline, glossary and quiz data. Ported from tools/guide/main.js.

const LET = 'CDEFGAB';
const NAT = [0, 2, 4, 5, 7, 9, 11];
const mod7 = (n: number) => ((n % 7) + 7) % 7;

export interface Pitch {
  step: number; // octave * 7 + letter (C = 0)
  acc: number;
}
export interface LineNote {
  p?: Pitch;
  d: number; // whole notes
  rest?: 1;
  mut?: boolean;
}

export function parsePitch(s: string): Pitch | null {
  const m = /^([A-Ga-g])(##|#|bb|b|n)?(-?\d)$/.exec(String(s).trim());
  if (!m) return null;
  const acc = ({ '##': 2, '#': 1, bb: -2, b: -1, n: 0 } as Record<string, number>)[m[2] || 'n'] || 0;
  return { step: Number(m[3]) * 7 + LET.indexOf(m[1].toUpperCase()), acc };
}
export const midiOf = (p: Pitch) => 12 * (Math.floor(p.step / 7) + 1) + NAT[mod7(p.step)] + p.acc;
export const nameOf = (p: Pitch) => LET[mod7(p.step)] + (({ 2: '##', 1: '#', 0: '', '-1': 'b', '-2': 'bb' } as Record<string, string>)[p.acc] || '') + Math.floor(p.step / 7);
/** A transposition by letter steps and exact semitones. */
export function trans(p: Pitch, steps: number, semis: number): Pitch {
  const q = { step: p.step + steps, acc: 0 };
  q.acc = midiOf(p) + semis - midiOf(q);
  return q;
}

export interface KeyInfo {
  t: number; // letter of the tonic (C = 0)
  sig: Record<string, number>;
  minor?: boolean;
  modal?: boolean;
}
export const KEYS: Record<string, KeyInfo> = {
  'D mode': { t: 1, sig: {}, minor: false, modal: true },
  'E mode': { t: 2, sig: {}, modal: true },
  'F mode': { t: 3, sig: {}, modal: true },
  'G mode': { t: 4, sig: {}, modal: true },
  'A mode': { t: 5, sig: {}, modal: true },
  'C mode': { t: 0, sig: {}, modal: true },
  'C major': { t: 0, sig: {} },
  'G major': { t: 4, sig: { F: 1 } },
  'F major': { t: 3, sig: { B: -1 } },
  'D major': { t: 1, sig: { F: 1, C: 1 } },
  'A minor': { t: 5, sig: {}, minor: true },
  'D minor': { t: 1, sig: { B: -1 }, minor: true },
  'E minor': { t: 2, sig: { F: 1 }, minor: true },
  'G minor': { t: 4, sig: { B: -1, E: -1 }, minor: true },
};
export const sigAcc = (k: string, step: number) => KEYS[k].sig[LET[mod7(step)]] || 0;
/** Scale degree, 0 = ①. */
export const degOf = (k: string, p: Pitch) => mod7(p.step - KEYS[k].t);
export function diatonicTrans(k: string, p: Pitch, steps: number): Pitch {
  const q = { step: p.step + steps, acc: 0 };
  q.acc = sigAcc(k, q.step) + (p.acc - sigAcc(k, p.step));
  return q;
}

/** "D4/2 A4/2 G4/4 r/4": pitch/duration (1 whole, 2 half, 4 quarter, 8 eighth); "." dotted; r = rest. Null for a bad token. */
export function parseLine(txt: string): (LineNote | null)[] {
  return txt.trim().split(/\s+/).filter(Boolean).map((tok) => {
    const m = /^([^/]+)(?:\/(\d+)(\.?))?$/.exec(tok);
    if (!m) return null;
    let d = m[2] ? 1 / Number(m[2]) : 0.25;
    if (m[3]) d *= 1.5;
    if (/^r$/i.test(m[1])) return { rest: 1, d };
    const p = parsePitch(m[1]);
    return p ? { p, d } : null;
  });
}
export const toNotes = (arr: LineNote[]): { p?: string; d: number; rest?: 1 }[] => arr.map((n) => (n.rest ? { d: n.d, rest: 1 } : { p: nameOf(n.p!), d: n.d }));
export const lineLength = (a: LineNote[]) => a.reduce((s, n) => s + n.d, 0);
export const DEGREE_SIGNS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];

// ---------- subjects ----------

export const SUBJECTS: Record<string, { key: string; line: string }> = {
  'D minor · D–A–G–F–E–D (tonal head)': { key: 'D minor', line: 'D4/2 A4/2 G4/4 F4/4 E4/4 D4/4' },
  'D mode · Fux-style, diatonic': { key: 'D mode', line: 'D4/2 F4/2 E4/2 D4/2 G4/2 F4/2 E4/2 D4/2' },
  'C major · stays in the tonic (real answer)': { key: 'C major', line: 'C4/4 D4/4 E4/4 F4/4 E4/4 D4/4 C4/2' },
  'C major · opens on ⑤: G–C': { key: 'C major', line: 'G4/2 C5/4 B4/4 A4/4 G4/4 F4/4 E4/4' },
  'C major · rises to the dominant (tail mutation)': { key: 'C major', line: 'C4/4 E4/4 D4/4 F4/4 E4/8 D4/8 C4/8 B3/8 C4/4 G4/4' },
  'C major · modulating with F♯': { key: 'C major', line: 'C4/4 G4/4 A4/4 F#4/4 G4/2' },
  'A minor · chromatic ascent (Marpurg)': { key: 'A minor', line: 'A4/2 C5/4 C#5/4 D5/4 D#5/4 E5/2' },
  'G minor · descending ⑤–①': { key: 'G minor', line: 'D5/4 C5/8 Bb4/8 A4/4 G4/4 F#4/4 G4/4' },
};

// ---------- the answer generator (Marpurg's rules) ----------

export function makeAnswer(line: LineNote[], key: string, kind: 'tonal' | 'real') {
  const K = KEYS[key];
  const notes = line.filter((n) => !n.rest);
  const idxs = line.map((n, i) => (n.rest ? -1 : i)).filter((i) => i >= 0);
  const deg = notes.map((n) => degOf(key, n.p!));
  const plan = notes.map(() => 'P5');
  if (kind !== 'real') {
    // the head: leading notes on ① or ⑤ (a fifth is answered by a fourth)
    for (let i = 0; i < notes.length && (deg[i] === 0 || deg[i] === 4); i++) if (deg[i] === 4) plan[i] = 'P4';
    // a skip between ⑤ and ① inside the theme
    for (let i = 1; i < notes.length; i++) {
      const leap = Math.abs(notes[i].p!.step - notes[i - 1].p!.step) >= 3;
      if (leap && ((deg[i] === 4 && deg[i - 1] === 0) || (deg[i] === 0 && deg[i - 1] === 4))) {
        if (deg[i] === 4) plan[i] = 'P4';
        if (deg[i - 1] === 4) plan[i - 1] = 'P4';
      }
    }
    // the tail: a theme that ends on ⑤ (or reaches it through a raised ④) leads the answer back to the tonic
    let j = notes.length - 1;
    if (deg[j] === 4) {
      plan[j] = 'P4';
      j--;
      while (j >= 0 && ((deg[j] === 3 && notes[j].p!.acc > sigAcc(key, notes[j].p!.step)) || deg[j] === 4)) {
        plan[j] = 'P4';
        j--;
      }
    }
  }
  const out: LineNote[] = line.map((n) => (n.rest ? { rest: 1, d: n.d } : { d: n.d }));
  notes.forEach((n, i) => {
    const four = plan[i] === 'P4';
    const q = K.modal ? diatonicTrans(key, n.p!, four ? 3 : 4) : trans(n.p!, four ? 3 : 4, four ? 5 : 7);
    out[idxs[i]] = { p: q, d: n.d, mut: four };
  });
  return { answer: out, plan, deg };
}

// ---------- the stretto finder ----------

const CONS = new Set([0, 3, 4, 7, 8, 9]);
function sounding(line: LineNote[], t: number) {
  let s = 0;
  for (const n of line) {
    if (t >= s - 1e-9 && t < s + n.d - 1e-9) return { n, on: Math.abs(t - s) < 1e-9 };
    s += n.d;
  }
  return null;
}

/** Strong-beat dissonances and parallel fifths or octaves between two lines. */
export function evalPair(up: LineNote[], lo: LineNote[], beat: number) {
  const onsets = new Set<number>();
  let s = 0;
  for (const n of up) {
    onsets.add(+s.toFixed(6));
    s += n.d;
  }
  s = 0;
  for (const n of lo) {
    onsets.add(+s.toFixed(6));
    s += n.d;
  }
  const ts = [...onsets].sort((a, b) => a - b);
  let diss = 0;
  let par = 0;
  let prev: { iv: number; a: number; b: number } | null = null;
  const marks: number[] = [];
  for (const t of ts) {
    const a = sounding(up, t);
    const b = sounding(lo, t);
    if (!a || !b || a.n.rest || b.n.rest) {
      prev = null;
      continue;
    }
    const ma = midiOf(a.n.p!);
    const mb = midiOf(b.n.p!);
    const iv = (((ma - mb) % 12) + 12) % 12;
    const crossed = ma < mb;
    const strong = Math.abs(t / beat - Math.round(t / beat)) < 1e-6;
    if (!CONS.has(iv) && strong) {
      diss++;
      marks.push(t);
    }
    if (prev && (iv === 7 || iv === 0) && prev.iv === iv && a.on && b.on && (ma !== prev.a || mb !== prev.b)) {
      par++;
      marks.push(t);
    }
    if (crossed) marks.push(t);
    prev = { iv, a: ma, b: mb };
  }
  return { diss, par, marks };
}

export const STRETTO_INTERVALS: [string, number][] = [['8ve above', 7], ['5th above', 4], ['4th below', -3], ['unison', 0], ['8ve below', -7]];

export interface StrettoResult {
  dly: number;
  lab: string;
  st: number;
  score: number;
  diss: number;
  par: number;
  up: LineNote[];
  lo: LineNote[];
}

/** The subject against itself at every entry distance up to ¾ of its length, at the usual intervals; best first. */
export function strettoSearch(line: LineNote[], key: string, beat: number): StrettoResult[] {
  const L = lineLength(line);
  const grid = Math.min(...line.map((n) => n.d));
  const res: StrettoResult[] = [];
  for (let dly = grid; dly <= L * 0.75 + 1e-9; dly += grid) {
    for (const [lab, st] of STRETTO_INTERVALS) {
      const fol: LineNote[] = line.map((n) => (n.rest ? n : { p: diatonicTrans(key, n.p!, st), d: n.d }));
      const lead = line.concat([{ rest: 1, d: dly }]);
      const follow: LineNote[] = ([{ rest: 1, d: dly }] as LineNote[]).concat(fol);
      const upFirst = st >= 0;
      const up = upFirst ? follow : lead;
      const lo = upFirst ? lead : follow;
      const r = evalPair(up, lo, beat);
      res.push({ dly, lab, st, score: r.diss * 2 + r.par * 3, diss: r.diss, par: r.par, up, lo });
    }
  }
  return res.sort((a, b) => a.score - b.score || a.dly - b.dly);
}

/** "2 bars" or "3 ♩": the entry distance for display. */
export const delayLabel = (dly: number) => (dly >= 1 ? `${dly} bar${dly > 1 ? 's' : ''}` : `${dly / 0.25} ♩`);

// ---------- invertible counterpoint ----------

export interface DcSpecies {
  name: string;
  inv: (x: number) => number;
  lim: number;
  steps: number;
  rules: string[];
}
export const DC: Record<number, DcSpecies> = {
  8: { name: 'octave', inv: (x) => 9 - x, lim: 8, steps: 7, rules: ['Avoid the 5th (→ 4th), unless tied.', 'Do not approach the octave by skip (→ unison by skip).', 'Avoid the octave on a strong beat except syncopated (→ unison).', 'Stay within the octave.'] },
  10: { name: 'tenth', inv: (x) => 11 - x, lim: 10, steps: 9, rules: ['No two 3rds/10ths in direct motion (→ unisons/octaves).', 'No two 6ths in succession (→ 5ths).', 'No tied 4th in the upper part (→ 7th resolving to 8ve).', 'Stay within the tenth.'] },
  12: { name: 'twelfth', inv: (x) => 13 - x, lim: 12, steps: 11, rules: ['Avoid the 6th (→ 7th) and the 7–6 suspension; a tied 6th is possible.', 'Stay within the twelfth.'] },
};
export const DC_PRESETS: Record<string, { up: string; lo: string }> = {
  'Model at the octave (D minor)': { up: 'F4/1 C5/1 A4/1 E5/1 C5/1 Bb4/1 D5/1 C#5/1 D5/1', lo: 'D4/1 E4/1 F4/1 G4/1 A4/1 G4/1 F4/1 E4/1 D4/1' },
  'Parallel thirds (fails at the tenth)': { up: 'F4/1 G4/1 A4/1 Bb4/1 A4/1 G4/1 F4/1', lo: 'D4/1 E4/1 F4/1 G4/1 F4/1 E4/1 D4/1' },
  'Fifths and octaves in contrary motion, thirds oblique (good at the twelfth)': { up: 'A4/1 A4/1 D5/1 C5/1 A4/1 E5/1 D5/1', lo: 'D4/1 F4/1 D4/1 F4/1 D4/1 A4/1 D4/1' },
};

export interface DcRow {
  t: number;
  x: number;
  n: number | null;
  inv: number | null;
  flags: string[];
}

export function dcAnalyse(U: LineNote[], Lo: LineNote[], sp: 8 | 10 | 12): DcRow[] {
  const S = DC[sp];
  const onsets = new Set<number>();
  let s = 0;
  U.forEach((n) => {
    onsets.add(+s.toFixed(6));
    s += n.d;
  });
  s = 0;
  Lo.forEach((n) => {
    onsets.add(+s.toFixed(6));
    s += n.d;
  });
  const rows: DcRow[] = [];
  let prev: { ua: number; lb: number; sm: number } | null = null;
  [...onsets].sort((a, b) => a - b).forEach((t) => {
    const a = sounding(U, t);
    const b = sounding(Lo, t);
    if (!a || !b || a.n.rest || b.n.rest) {
      prev = null;
      return;
    }
    const steps = a.n.p!.step - b.n.p!.step;
    const tied = !a.on || !b.on;
    const x = steps + 1;
    const n = x > S.lim ? null : x;
    const inv = n ? S.inv(n) : null;
    const flags: string[] = [];
    if (!n) flags.push(`exceeds the ${S.name}`);
    const sm = mod7(steps) + 1;
    if (sp === 8 && sm === 5 && !tied) flags.push('5th → 4th');
    if (sp === 8 && sm === 1 && prev && Math.abs(a.n.p!.step - prev.ua) > 1 && Math.abs(b.n.p!.step - prev.lb) > 1) flags.push('octave by skip');
    if (sp === 10 && prev && ((sm === 3 && prev.sm === 3) || (sm === 6 && prev.sm === 6)) && a.on && b.on && Math.sign(a.n.p!.step - prev.ua) === Math.sign(b.n.p!.step - prev.lb) && a.n.p!.step !== prev.ua) flags.push(sm === 3 ? 'consecutive 3rds → 8ves' : 'consecutive 6ths → 5ths');
    if (sp === 12 && sm === 6 && !tied) flags.push('6th → 7th');
    rows.push({ t, x, n, inv, flags });
    prev = { ua: a.n.p!.step, lb: b.n.p!.step, sm };
  });
  return rows;
}

/** The upper part moved down by the interval of the invertible counterpoint (to exchange the parts). */
export const invertedUpper = (U: LineNote[], sp: 8 | 10 | 12): LineNote[] => U.map((n) => (n.rest ? n : { p: { step: n.p!.step - DC[sp].steps, acc: n.p!.acc }, d: n.d }));

// ---------- the inversion mirror ----------

export function mirror(line: LineNote[], key: string, how: 'strict' | 'free'): { inv: LineNote[]; label: string } {
  const K = KEYS[key];
  const first = line.find((n) => !n.rest)!.p!;
  let axisStep: number;
  let axisMidi = 0;
  let label: string;
  if (how === 'strict') {
    const axDeg = K.modal ? (key === 'D mode' ? 0 : (1 - K.t + 7) % 7) : K.minor ? 3 : 1; // the modes mirror around D (Fux); major around ②, minor around ④
    let st = first.step;
    while (mod7(st - K.t) !== axDeg) st--;
    axisStep = st;
    axisMidi = midiOf({ step: st, acc: sigAcc(key, st) });
    label = `Axis: ${LET[mod7(axisStep)]} (every whole and half step mirrored exactly).`;
  } else {
    axisStep = first.step;
    label = 'Free inversion around the first note: steps reversed, half steps not kept.';
  }
  const inv = line.map((n): LineNote => {
    if (n.rest) return n;
    const st = 2 * axisStep - n.p!.step;
    if (how === 'strict') {
      const q = { step: st, acc: 0 };
      q.acc = 2 * axisMidi - midiOf(n.p!) - midiOf(q);
      return { p: q, d: n.d };
    }
    return { p: { step: st, acc: sigAcc(key, st) }, d: n.d };
  });
  return { inv, label };
}

// ---------- entry orders ----------

export const VOICES = ['S', 'A', 'T', 'B'];
const PAIR: Record<string, string> = { S: 'T', T: 'S', A: 'B', B: 'A' };

export function entryOrders(): { order: string[]; regular: boolean }[] {
  const out: { order: string[]; regular: boolean }[] = [];
  const rec = (a: string[], r: string[]) => {
    if (!r.length) {
      out.push({ order: a, regular: PAIR[a[0]] === a[2] && PAIR[a[1]] === a[3] });
      return;
    }
    r.forEach((x, i) => rec(a.concat(x), r.filter((_, j) => j !== i)));
  };
  rec([], VOICES);
  return out;
}

// ---------- Fux's two-part plan ----------

export const FUX_PLAN: Record<string, string[]> = {
  D: ['D', 'A (5th)', 'F (3rd)', 'D', 'The model mode (Ex. 42).'],
  E: ['E', 'C (6th!)', 'G (3rd)', 'E', 'A cadence on B would need a major third clashing with F (mi contra fa); Fux puts the first cadence on the 6th (p. 86).'],
  F: ['F', 'C (5th)', 'A (3rd), formed with 7–6', 'F', 'A full cadence on A needs two or three sharps; use the 7–6 cadence instead (p. 88).'],
  G: ['G', 'D (5th)', 'B (3rd)', 'G', 'Regular.'],
  A: ['A', 'E (5th)', 'C (3rd)', 'A', 'After the first cadence the subject may re-enter on B if the lower part holds E (p. 88).'],
  C: ['C', 'G (5th)', 'E (3rd)', 'C', 'Regular.'],
};
export function fuxPlanSteps(mode: string): [string, string][] {
  const r = FUX_PLAN[mode];
  return [
    ['Exposition', 'subject, answer at the 5th above or the 4th below'],
    ['1st cadence', r[1]],
    ['Re-entry', 'subject in the first part on another tone, after a rest or a large skip'],
    ['2nd cadence', r[2]],
    ['Close entries', 'subject, the other part following in the next bar'],
    ['Final cadence', `on ${r[3]}`],
  ];
}

// ---------- timeline, glossary, quiz ----------

export const TIMELINE: [number, string, string, string][] = [
  [1330, 'Jacobus of Liège', 'fuga = caccia (hunt canon)', 'terms'], [1475, 'Tinctoris', 'fuga = identity of rhythm and melody between parts', 'terms'],
  [1482, 'Ramos de Pareja', 'entries at 4th, 5th, 8ve; free writing when strictness is difficult', 'answer'], [1496, 'Gafori', 'direct motion acceptable in fugal manner', 'texture'],
  [1523, 'Aron', 'all parts composed together', 'texture'], [1525, 'Buchner', 'organ ars fugandi; entries alternate 4th/5th', 'answer'],
  [1555, 'Vicentino', 'punto; mode limits; first tonal answer; spacing of entries', 'answer'], [1558, 'Zarlino', 'fugue vs imitation vs canon; strict/free; double counterpoint', 'terms'],
  [1565, 'Santa María', 'placing entries; entries vs cadences', 'structure'], [1588, 'Ponzio', 'ricercar on one theme; first statement unaccompanied', 'structure'],
  [1597, 'Morley', 'wider spacing; odd rests; tonal answer described', 'answer'], [1610, 'Coperario', 'double fugue: theme + countertheme', 'double'],
  [1613, 'Cerone / Nucius', 'monothematic tiento; fuga = recurrence of thema', 'structure'], [1619, 'M. Praetorius', 'development (joining, interweaving); canzona restates first fugue', 'structure'],
  [1650, 'Bernhard', 'consociatio (tonal) vs aequatio (real) modorum', 'answer'], [1670, 'Reinken', 'plan of cadences: I, V, relative; stretto as discipline', 'structure'],
  [1673, 'Bononcini', 'stretto later; fuga regolare = tonal fugue; strict inversion', 'stretto'], [1681, 'Berardi', 'fuga reale exceptional; stretto at the end; DC tables', 'stretto'],
  [1694, 'Purcell', 'imitation = “diminutive sort of fugeing”; fugue in sonatas', 'terms'], [1708, 'Walther', 'repercussio = exposition / counter-exposition', 'terms'],
  [1722, 'Rameau', 'harmonic rules for theme and answer; structure beyond rules', 'answer'], [1725, 'Fux', 'fugue in the modes; DC at 8ve/10th/12th', 'double'],
  [1739, 'Mattheson', 'conciliatio modorum (codetta); writes for connoisseurs', 'answer'], [1753, 'Marpurg', 'five elements; regular fugue as form; Bach', 'structure'],
  [1775, 'Martini', 'teaching through annotated masterworks', 'structure'], [1790, 'Albrechtsberger', 'chorale fugue; canon; no codetta', 'double'],
  [1824, 'Fétis / Reicha / Cherubini', 'school fugue at the Conservatoire', 'textbook'], [1888, 'Riemann', 'fugue as tripartite form; 8-bar norm', 'textbook'],
  [1901, 'Gédalge', 'fugue d’école', 'textbook'], [1922, 'Kitson', 'examination fugue', 'textbook'],
];
export const TIMELINE_TAGS: [string, string][] = [['all', 'All'], ['terms', 'Terms'], ['answer', 'Answer'], ['structure', 'Structure'], ['stretto', 'Stretto'], ['double', 'Several Themes'], ['texture', 'Texture'], ['textbook', 'Textbooks']];

export const TERMS_EVOLUTION: [string, string][] = [
  ['fuga', 'canon/round (14th c.) → strict imitation (Zarlino) → exposition within a work → whole work → procedure (Bontempi, Mann)'],
  ['imitation', 'any-interval following (Zarlino) → “diminutive sort of fugeing” (Purcell) → casual imitative manner (Rameau)'],
  ['canon', 'the rule/inscription (Greek κανών) → the opening voice (Picerli 1630) → strict fugue (Albrechtsberger)'],
  ['soggetto / thema', 'a whole pre-existing part (Zarlino) → thema = varied repeated pattern → the fugal theme (Nucius, Cerone)'],
  ['guida / consequente', 'Zarlino’s leading and following voices → dux / comes (Calvisius 1592)'],
  ['punto / point', 'the chosen theme (Vicentino, Morley: “maintaining a point”)'],
  ['repercussio', 'reciting tone → the returning statement → the exposition, counter-exposition (Walther)'],
  ['consociatio / aequatio modorum', 'tonal vs real answer (Bernhard); conciliatio = codetta (Mattheson)'],
  ['fuga regolare / reale', 'regolare = within the octave of the key = tonal (Bononcini); reale = real answer, now exceptional (Berardi)'],
  ['regular fugue', 'tonal fugue (Bononcini) → formal fugue with five elements properly arranged (Marpurg)'],
  ['strict / free fugue', 'legata/sciolta (Zarlino) → obbligata (Bach) vs libera (Handel) (Marpurg)'],
  ['ricercar', 'searching piece (16th c.) → strict fugue rich in artifice, “master fugue” (Marpurg)'],
  ['counterfugue', 'fuga per arsin et thesin (Zarlino) → answer in inversion (Marpurg)'],
  ['stretto', 'ins kurtze imitiren (Reinken) → later in the work (Bononcini) → at the end (Berardi)'],
  ['double fugue', 'theme + countertheme (Coperario) → themes separately then together (Reinken) → methods (a)/(b) (Marpurg)'],
  ['point d’orgue', 'fermata on the last note of a canonic voice (Mersenne) → pedal point under the final statement'],
];

export const QUIZ: { q: string; options: string[]; answer: number; why: string }[] = (
  [
    ['For Zarlino, an answer at the 3rd is…', ['a fugue', 'an imitation', 'a canon'], 1, 'Only entries at P1/P4/P5/P8 keeping exact half steps are fugue; any other interval is imitation (p. 22).'],
    ['Bernhard says the tonal answer (consociatio) belongs…', ['in the middle', 'at the beginning', 'only in the stretto'], 1, 'At the harmonically decisive beginning; the real answer suits the middle (p. 38).'],
    ['Fux’s first cadence in a two-part fugue in the E mode falls on…', ['B, the 5th', 'C, the 6th', 'G, the 3rd'], 1, 'B would need a major third clashing with F (p. 86).'],
    ['In double counterpoint at the octave, which interval must be avoided (untied)?', ['the 3rd', 'the 5th', 'the 6th'], 1, 'The 5th inverts to a 4th, a dissonance in two parts (p. 108).'],
    ['In double counterpoint at the tenth, two successive 6ths become…', ['two 5ths', 'two 3rds', 'two octaves'], 0, '11 − 6 = 5 (p. 114).'],
    ['Marpurg: a theme beginning on ⑤ is answered on…', ['⑤', '②', '①'], 2, 'First-note rule (p. 167).'],
    ['How does Marpurg answer a chromatic theme?', ['by exact transposition always', 'strip accidentals, answer diatonically, restore the chromatic steps', 'by inversion'], 1, 'p. 170.'],
    ['In a four-voice exposition the voices that share the same form are…', ['S with A, T with B', 'S with T, A with B', 'S with B, A with T'], 1, 'Inner + outer pairs (Fux p. 102; Marpurg p. 177).'],
    ['Bach called a fugue that never varied its subject…', ['“dry and wooden”', '“a master fugue”', '“irregular”'], 0, 'Reported by Marpurg (p. 140).'],
    ['Martini’s rule after a rest:', ['enter with free counterpoint', 'enter with the theme or part of it', 'enter only at a cadence'], 1, 'Otherwise the fugue becomes a conglomeration of unrelated elements (p. 276).'],
    ['Which theorist first put the stretto at the end of a fugue (“all’s well that ends well”)?', ['Bononcini', 'Berardi', 'Reinken'], 1, 'p. 46.'],
    ['Mann’s own definition of fugue is…', ['a form', 'a texture', 'a sum of procedures'], 2, 'p. 72.'],
  ] as [string, string[], number, string][]
).map(([q, options, answer, why]) => ({ q, options, answer, why }));

// ---------- analysis tools: proportions ----------

const RATIOS: [number, number][] = [[1, 1], [2, 1], [3, 2], [4, 3], [5, 4]];

/** Section lengths: growth or shrinking in succession, palindromes, and ratios near 1:1, 2:1, 3:2, 4:3, 5:4 (±10%). */
export function proportions(lengths: number[]) {
  const steps = lengths.slice(1).map((v, i) => (v > lengths[i] ? 'grows' : v < lengths[i] ? 'shrinks' : 'same'));
  let growing = lengths.length > 2;
  let shrinking = lengths.length > 2;
  for (let i = 1; i < lengths.length; i++) {
    if (!(lengths[i] > lengths[i - 1])) growing = false;
    if (!(lengths[i] < lengths[i - 1])) shrinking = false;
  }
  const palindrome = lengths.length > 2 && lengths.every((v, i) => v === lengths[lengths.length - 1 - i]);
  const ratios = lengths.slice(1).map((v, i) => {
    const a = Math.max(v, lengths[i]);
    const b = Math.min(v, lengths[i]);
    const r = a / b;
    const hit = RATIOS.find(([x, y]) => Math.abs(r - x / y) / (x / y) <= 0.1);
    return { from: lengths[i], to: v, ratio: r, name: hit ? `${hit[0]}:${hit[1]}` : null };
  });
  return { steps, growing, shrinking, palindrome, ratios };
}

/** Section lengths typed as "2, 3, 3.5, 5, 8.5" (or separated by spaces); null if anything is not a positive number. */
export function parseLengths(text: string): number[] | null {
  const parts = text.trim().split(/[\s,;]+/).filter(Boolean);
  const nums = parts.map(Number);
  if (nums.length < 2 || nums.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return nums;
}

export const PROPORTION_DEMOS: [string, string][] = [
  ['BWV 578 digressions', '2, 3, 3.5, 5, 8.5'],
  ['BWV 533 spacing of entries', '2, 3.5, 3.5, 5, 5, 3.5, 3.5, 2'],
];

// ---------- analysis tools: the worksheet ----------

/** The six kinds of notable property in the exposition (Roberts, step 2). */
export const ROBERTS_TYPES = [
  'Linear ascents or descents',
  'Blocked ascents or descents',
  'Rhythmic and melodic patterns (cells)',
  'Suspended scale degrees',
  'Contrasting material (active against static)',
  'Structural units (a subject that is a period)',
];

export interface Worksheet {
  work: string;
  key: string;
  voices: string;
  entries: { bar: string; voice: string; key: string; device: string }[];
  episodes: string;
  properties: { type: string; checked: boolean; note: string }[];
  lengths: string;
  verdict: 'rhetorical' | 'literal' | 'not stated';
  reasons: string;
}

/** The demonstration of the pack: WTC I, Fugue in C minor (Roberts' case study). Voices and keys of the entries are left blank: the case study gives bars only. */
export function worksheetDemo(): Worksheet {
  return {
    work: 'WTC I/2, Fugue in C minor, BWV 847',
    key: 'C minor',
    voices: '3',
    entries: [1, 3, 7, 11, 15, 20, 26].map((bar) => ({ bar: String(bar), voice: '', key: '', device: '' })),
    episodes: 'Episodes between the entries; episode 4 is an inversion of episode 1; coda with a final subject statement. Roberts calls the codetta in bars 5–6 “Episode 1”.',
    properties: [
      { type: ROBERTS_TYPES[0], checked: true, note: 'Episode 1 (bars 5–6): an ascent 5̂→1̂ through every half step of the combined minor-scale forms' },
      { type: ROBERTS_TYPES[1], checked: true, note: 'Prominent descent 6̂–5̂–4̂–3̂ in the subject that never reaches 1̂' },
      { type: ROBERTS_TYPES[2], checked: true, note: 'Rhythmic cells 4+4+3+3+2 eighth notes (repeated, interrupted, then mirrored)' },
      { type: ROBERTS_TYPES[3], checked: false, note: '' },
      { type: ROBERTS_TYPES[4], checked: false, note: '' },
      { type: ROBERTS_TYPES[5], checked: false, note: '' },
    ],
    lengths: '',
    verdict: 'rhetorical',
    reasons: 'Bars 27–29: the descent reaches 1̂ (soprano and bass), the 5̂→1̂ ascent goes straight up the melodic minor, and the cells shrink to 4+4+3+3+3+3+2+1, all at once, and then the fugue ends.',
  };
}

export function worksheetMarkdown(w: Worksheet): string {
  const out: string[] = [`# Fugue analysis: ${w.work || 'untitled'}`, '', `- Key: ${w.key || '—'}`, `- Voices: ${w.voices || '—'}`, '', '## Entries', '', '| Bar | Voice | Key | Device |', '|---|---|---|---|'];
  for (const e of w.entries) out.push(`| ${e.bar || ''} | ${e.voice || ''} | ${e.key || ''} | ${e.device || ''} |`);
  out.push('', '## Countersubject and episodes', '', w.episodes || '—', '', '## Notable properties', '');
  for (const p of w.properties) out.push(`- [${p.checked ? 'x' : ' '}] ${p.type}${p.note ? `: ${p.note}` : ''}`);
  out.push('', '## Integrants and digressions', '', w.lengths || '—');
  const nums = parseLengths(w.lengths);
  if (nums) {
    const pr = proportions(nums);
    const notes = [pr.growing ? 'successively longer' : '', pr.shrinking ? 'successively shorter' : '', pr.palindrome ? 'palindromic' : '', ...pr.ratios.filter((r) => r.name).map((r) => `${r.from} to ${r.to} is about ${r.name}`)].filter(Boolean);
    if (notes.length) out.push('', `Patterns: ${notes.join('; ')}.`);
  }
  out.push('', '## Verdict', '', `${w.verdict}${w.reasons ? `: ${w.reasons}` : ''}`, '');
  return out.join('\n');
}
