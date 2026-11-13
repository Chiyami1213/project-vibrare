// Parser, analyser and part-writing checker for the tonal-harmony example notation: a port of tools/satb.py in
// content/tonal-harmony/. The ported checker must give, for every example of the pack, exactly the issues stored with
// it (tests/satb.test.mjs runs all 154).
//
// Notation (one string per example)
//   slices are separated by whitespace; '|' marks a barline (a token on its own).
//   slice  = [LABEL ':'] VOICE (',' VOICE)* ['@' BEATS]
//   VOICE  = voices listed top to bottom (S, A, T, B for four parts; any count 1-4):
//            PITCH (C5, F#4, Bb3, F##4, En4)   ~PITCH tied from the previous note   - hold   _ rest
//            P1.P2[.P3] the slice is split equally inside this voice   !P1.P2 first sub-note is an accented NCT

const LET = 'CDEFGAB';
const NAT = [0, 2, 4, 5, 7, 9, 11];
const PITCH = /^([A-G])(##|#|bb|b|n)?(-?\d)$/;
const ACC: Record<string, number> = { '##': 2, '#': 1, '': 0, n: 0, b: -1, bb: -2 };

const mod = (n: number, m: number) => ((n % m) + m) % m;

export class P {
  step: number;
  acc: number;
  shownat: boolean;

  constructor(step: number, acc: number, shownat = false) {
    this.step = step;
    this.acc = acc;
    this.shownat = shownat;
  }

  static parse(s: string): P {
    const m = PITCH.exec(s);
    if (!m) throw new Error(`bad pitch ${JSON.stringify(s)}`);
    const [, l, a, o] = m;
    return new P(Number(o) * 7 + LET.indexOf(l), ACC[a ?? ''], a === 'n');
  }

  get midi() {
    return 12 * (Math.floor(this.step / 7) + 1) + NAT[mod(this.step, 7)] + this.acc;
  }

  get pc() {
    return mod(this.midi, 12);
  }

  name() {
    const sign: Record<number, string> = { 2: '##', 1: '#', 0: '', '-1': 'b', '-2': 'bb' };
    return LET[mod(this.step, 7)] + sign[this.acc] + Math.floor(this.step / 7);
  }

  eq(o: P | null | undefined) {
    return !!o && this.step === o.step && this.acc === o.acc;
  }
}

export interface Slice {
  label: string | null;
  voices: string[];
  dur: number;
  bar: number;
  t: number;
  nct: Map<number, true | P>;
  analysis?: Analysis | null;
  figures?: string;
}

export interface Event {
  t: number;
  d: number;
  p: P | null;
  tie?: boolean;
  tieError?: boolean;
}

export interface Realized {
  voices: Event[][];
  slices: Slice[];
  length: number;
  nv: number;
}

export function parse(text: string): Slice[] {
  const slices: Slice[] = [];
  let bar = 0;
  for (let tok of text.split(/\s+/)) {
    if (!tok) continue;
    if (tok === '|') {
      bar++;
      continue;
    }
    let dur = 1;
    const at = tok.lastIndexOf('@');
    if (at >= 0) {
      dur = parseFloat(tok.slice(at + 1));
      tok = tok.slice(0, at);
    }
    let label: string | null = null;
    const colon = tok.indexOf(':');
    if (colon >= 0) {
      label = tok.slice(0, colon);
      tok = tok.slice(colon + 1);
    }
    slices.push({ label: label || null, voices: tok.split(','), dur, bar, t: 0, nct: new Map() });
  }
  return slices;
}

export function realize(text: string): Realized {
  const sl = parse(text);
  const nv = Math.max(...sl.map((s) => s.voices.length));
  const voices: Event[][] = Array.from({ length: nv }, () => []);
  let t = 0;
  for (const s of sl) {
    if (s.voices.length !== nv) throw new Error(`slice ${JSON.stringify(s.voices)} has ${s.voices.length} voices, expected ${nv}`);
    s.t = t;
    s.nct = new Map();
    s.voices.forEach((tok0, vi) => {
      let tok = tok0;
      if (tok.startsWith('!')) {
        tok = tok.slice(1);
        s.nct.set(vi, true);
      }
      const parts = tok.split('.');
      const sub = s.dur / parts.length;
      parts.forEach((pt, k) => {
        const st = t + k * sub;
        if (pt === '-') {
          if (voices[vi].length === 0) throw new Error('hold with nothing to hold');
          voices[vi][voices[vi].length - 1].d += sub;
          return;
        }
        if (pt === '_') {
          voices[vi].push({ t: st, d: sub, p: null });
          return;
        }
        const tie = pt.startsWith('~');
        const p = P.parse(pt.replace(/^~+/, ''));
        const ev: Event = { t: st, d: sub, p, tie };
        if (tie) {
          const prev = voices[vi].length ? voices[vi][voices[vi].length - 1].p : null;
          if (prev === null || !prev.eq(p)) ev.tieError = true;
        }
        voices[vi].push(ev);
      });
      if (s.nct.get(vi) && parts.length > 1) s.nct.set(vi, P.parse(parts[1].replace(/^~+/, '')));
    });
    t += s.dur;
  }
  return { voices, slices: sl, length: t, nv };
}

export function sounding(voice: Event[], t: number): Event | null {
  for (const e of voice) if (e.t <= t + 1e-9 && t + 1e-9 < e.t + e.d) return e;
  return null;
}

// ---------------------------------------------------------------- chord analysis
export interface Analysis {
  root: P;
  members: Record<string, number>;
  q3?: number;
  q5?: number;
  q7?: number;
}

/** Root and members from a list of pitches (bass last). Null when the set is not built in thirds. */
export function analyse(pitches: (P | null)[]): Analysis | null {
  const ps = pitches.filter((p): p is P => p !== null);
  if (ps.length === 0) return null;
  const letters = new Set(ps.map((p) => mod(p.step, 7)));
  for (const cand of ps) {
    const r = mod(cand.step, 7);
    const offs = new Set([...letters].map((l) => mod(l - r, 7)));
    if ([...offs].every((o) => [0, 2, 4, 6].includes(o)) && offs.has(0)) {
      const members: Record<string, number> = {};
      for (const p of ps) {
        const g = mod(p.step - cand.step, 7);
        const semis = mod(p.pc - cand.pc, 12);
        const key = ({ 0: 'R', 2: '3', 4: '5', 6: '7' } as Record<number, string>)[g];
        if (!(key in members)) members[key] = semis;
      }
      return { root: cand, members, q3: members['3'], q5: members['5'], q7: members['7'] };
    }
  }
  return null;
}

export function figures(pitches: (P | null)[]): string {
  const ps = pitches.filter((p): p is P => p !== null);
  if (ps.length < 2) return '';
  const b = ps[ps.length - 1];
  const set = new Set<number>();
  for (const p of ps.slice(0, -1)) {
    const g = mod(p.step - b.step, 7) + 1;
    set.add(g !== 1 ? g : 8);
  }
  set.delete(8);
  const nums = [...set].sort((x, y) => y - x);
  if (nums.length === 0) return '8';
  const is = (...opts: number[][]) => opts.some((o) => o.length === nums.length && o.every((v, i) => v === nums[i]));
  if (is([5, 3], [5], [3])) return '5/3';
  if (is([6, 3], [6])) return '6/3';
  if (is([6, 4])) return '6/4';
  if (is([7, 5, 3], [7, 3], [7, 5], [7])) return '7';
  if (is([6, 5, 3], [6, 5])) return '6/5';
  if (is([6, 4, 3], [4, 3])) return '4/3';
  if (is([6, 4, 2], [4, 2], [2], [6, 2])) return '4/2';
  return nums.join('/');
}

// ---------------------------------------------------------------- checker
export type CheckType =
  | 'range' | 'leap' | 'doubling' | 'contrary' | 'hidden' | 'augLeap' | 'overlap' | 'crossing' | 'viiRoot' | 'sixFour'
  | 'doubledLT' | 'spacing' | 'seventh' | 'seventhLeap' | 'leadingTone' | 'unequal5' | 'aug6' | 'parallel' | 'bigLeap' | 'tie';
export type CheckLevel = 'white' | 'blue' | 'green' | 'yellow' | 'orange' | 'red';

/** Ranges of the notes p.15: voice, normal low and high, extended low and high. */
const RANGES: [string, string, string, string, string][] = [
  ['S', 'C4', 'G5', 'B3', 'A5'],
  ['A', 'G3', 'C5', 'G3', 'D5'],
  ['T', 'C3', 'G4', 'C3', 'A4'],
  ['B', 'E2', 'C4', 'D2', 'D4'],
];

/** The colour of each check in the checklist of the notes p.20, least to most serious. */
export const LEVEL: Record<CheckType, CheckLevel> = {
  range: 'white', leap: 'white',
  doubling: 'blue', contrary: 'blue', hidden: 'blue',
  augLeap: 'green', overlap: 'green', crossing: 'green',
  viiRoot: 'yellow', sixFour: 'yellow',
  doubledLT: 'orange', spacing: 'orange', seventh: 'orange', seventhLeap: 'orange', leadingTone: 'orange', unequal5: 'orange', aug6: 'orange',
  parallel: 'red', tie: 'red', bigLeap: 'red',
};

export interface Issue {
  type: CheckType;
  level: CheckLevel;
  beat: number;
  voices: string | string[] | null;
  detail: string;
}

/** Which chord member is a leading tone, judged from the analysis label (V... has it in the 3rd, vii... in the root). */
export function ltMember(label: string | null): 'R' | '3' | null {
  if (!label) return null;
  const head = label.split('/')[0].replace(/^\(/, '').replace(/♭/g, 'b');
  if (head.startsWith('vii')) return 'R';
  if (/^V(?!I)/.test(head)) return '3';
  return null;
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

type Pending = { vi: number; p0: P; kind: 'seventh' | 'lt'; t0: number; root0: number | null };

export function check(real: Realized, allow: readonly string[] = []): Issue[] {
  const vs = real.voices;
  const sl = real.slices;
  const nv = real.nv;
  const issues: Issue[] = [];
  const add = (kind: CheckType, t: number, voices: string | string[] | null, detail: string) => {
    if (allow.includes(kind)) return;
    issues.push({ type: kind, level: LEVEL[kind], beat: round3(t), voices, detail });
  };

  vs.forEach((v, vi) => {
    for (const e of v) if (e.tieError) add('tie', e.t, String(vi) as unknown as string, 'tie marked but pitch differs');
  });
  const onsets = [...new Set(vs.flatMap((v) => v.map((e) => round6(e.t))))].sort((a, b) => a - b);
  const snap = new Map<number, (P | null)[]>(onsets.map((t) => [t, vs.map((v) => sounding(v, t)?.p ?? null)]));
  const names = nv === 4 ? ['S', 'A', 'T', 'B'] : nv === 3 ? ['S', 'A', 'B'] : nv === 2 ? ['U', 'B'] : ['M'];

  // ---- pairwise motion
  for (let i = 0; i < nv; i++) {
    for (let j = i + 1; j < nv; j++) {
      let prev: [P, P] | null = null;
      for (const t of onsets) {
        const a = snap.get(t)![i];
        const b = snap.get(t)![j];
        if (a === null || b === null) {
          prev = null;
          continue;
        }
        if (prev) {
          const [pa, pb] = prev;
          const ma = !pa.eq(a);
          const mb = !pb.eq(b);
          if (ma && mb) {
            const i1 = Math.abs(pa.midi - pb.midi);
            const i2 = Math.abs(a.midi - b.midi);
            const g1 = Math.abs(pa.step - pb.step) % 7;
            const g2 = Math.abs(a.step - b.step) % 7;
            const da = a.midi - pa.midi;
            const db = b.midi - pb.midi;
            const sameDir = da > 0 === db > 0;
            for (const [semi, gen, nm] of [[7, 4, 'P5'], [0, 0, 'P8/P1']] as const) {
              if (i1 % 12 === semi && i2 % 12 === semi && g1 === gen && g2 === gen) {
                const kind: CheckType = sameDir ? 'parallel' : 'contrary';
                add(kind, t, [names[i], names[j]], `${sameDir ? 'parallel' : 'contrary'} ${nm}: ${pa.name()}-${pb.name()} -> ${a.name()}-${b.name()}`);
              }
            }
            if (j === nv - 1 && nv >= 3 && i1 % 12 === 6 && i2 % 12 === 7 && g1 === 4 && g2 === 4) {
              add('unequal5', t, [names[i], names[j]], `d5 -> P5 against the bass: ${pa.name()}-${pb.name()} -> ${a.name()}-${b.name()}`);
            }
            // hidden 5/8 in outer voices, soprano leaps
            if (i === 0 && j === nv - 1 && nv >= 3 && sameDir && Math.abs(a.step - pa.step) > 1) {
              if ((i2 % 12 === 7 && g2 === 4 && !(i1 % 12 === 7 && g1 === 4)) || (i2 % 12 === 0 && g2 === 0 && !(i1 % 12 === 0 && g1 === 0))) {
                add('hidden', t, [names[i], names[j]], `hidden ${i2 % 12 === 7 ? 'P5' : 'P8'} in outer voices with a soprano leap`);
              }
            }
          }
        }
        prev = [a, b];
      }
    }
  }

  // ---- vertical checks per onset
  if (nv === 4) {
    for (const t of onsets) {
      const ps = snap.get(t)!;
      RANGES.forEach(([nm, , , elo, ehi], k) => {
        const p = ps[k];
        if (p === null) return;
        if (p.midi < P.parse(elo).midi || p.midi > P.parse(ehi).midi) add('range', t, nm, `${p.name()} outside ${elo}-${ehi}`);
      });
      for (let k = 0; k < 3; k++) {
        const a = ps[k];
        const b = ps[k + 1];
        if (a === null || b === null) continue;
        if (a.midi < b.midi) add('crossing', t, [names[k], names[k + 1]], `${a.name()} below ${b.name()}`);
        const lim = k === 2 ? 19 : 12;
        if (a.midi - b.midi > lim) add('spacing', t, [names[k], names[k + 1]], `${a.name()}-${b.name()} wider than ${k === 2 ? 'P12' : 'P8'}`);
      }
    }
  }
  // overlap
  if (nv >= 3) {
    for (let k = 0; k < nv - 1; k++) {
      for (let n = 0; n + 1 < onsets.length; n++) {
        const x = onsets[n];
        const y = onsets[n + 1];
        const a0 = snap.get(x)![k];
        const b0 = snap.get(x)![k + 1];
        const a1 = snap.get(y)![k];
        const b1 = snap.get(y)![k + 1];
        if (!a0 || !b0 || !a1 || !b1) continue;
        if ((a1.midi < b0.midi && !a1.eq(a0)) || (b1.midi > a0.midi && !b1.eq(b0))) add('overlap', y, [names[k], names[k + 1]], 'voices overlap');
      }
    }
  }
  // melodic
  vs.forEach((v, vi) => {
    let prev: P | null = null;
    for (const e of v) {
      const p = e.p;
      if (p === null) {
        prev = null;
        continue;
      }
      if (prev !== null && !prev.eq(p)) {
        const st = Math.abs(p.midi - prev.midi);
        const gen = Math.abs(p.step - prev.step);
        if (st > 12) add('bigLeap', e.t, names[vi], `leap larger than an octave: ${prev.name()} -> ${p.name()}`);
        else if (vi < nv - 1 && nv >= 3 && st > 9 && st !== 12) add('leap', e.t, names[vi], `leap larger than M6: ${prev.name()} -> ${p.name()}`);
        const g = gen % 7;
        const natural = [0, 2, 4, 5, 7, 9, 11][g];
        const limit: Record<number, number> = { 1: 2, 3: 5, 4: 7 };
        if (gen < 7 && st - natural >= 1 && [1, 3, 4].includes(g) && st > limit[g]) add('augLeap', e.t, names[vi], `augmented melodic interval: ${prev.name()} -> ${p.name()}`);
      }
      prev = p;
    }
  });

  // ---- harmonic obligations (slice level, using the first sub-note of each voice)
  const sliceSnaps: (P | null)[][] = [];
  for (const s of sl) {
    const ps = [...snap.get(round6(s.t))!];
    s.nct.forEach((alt, vi) => {
      if (alt instanceof P) ps[vi] = alt;
    });
    sliceSnaps.push(ps);
    s.analysis = analyse(ps);
    s.figures = figures(ps);
  }
  let pending: Pending[] = [];
  sl.forEach((s, si) => {
    const ps = sliceSnaps[si];
    const an = s.analysis ?? null;
    // resolve pending obligations
    const still: Pending[] = [];
    for (const { vi, p0, kind, t0, root0 } of pending) {
      const cur = ps[vi];
      if (cur === null) continue;
      if (cur.eq(p0)) {
        still.push({ vi, p0, kind, t0, root0 });
        continue;
      }
      if (an && root0 !== null && an.root.pc === root0 && kind !== 'seventh') {
        // same harmony re-voiced: the obligation moves with the pitch class if it is still in this voice
        if (cur.pc === p0.pc) still.push({ vi, p0: cur, kind, t0, root0 });
        continue;
      }
      const diff = cur.midi - p0.midi;
      const step = cur.step - p0.step;
      if (kind === 'seventh' && step === 0 && diff === 1) {
        // delayed resolution: a flat 7th raised chromatically (A♭ -> A♮) keeps the obligation (notes p.40)
        still.push({ vi, p0: cur, kind, t0, root0 });
        continue;
      }
      if (kind === 'seventh' && !(step === -1 && (diff === -1 || diff === -2))) {
        if (!(an && root0 !== null && an.root.pc === root0)) add('seventh', s.t, names[vi], `chordal 7th ${p0.name()} does not step down (goes to ${cur.name()})`);
        else if (cur.pc === p0.pc) still.push({ vi, p0: cur, kind, t0, root0 });
      }
      if (kind === 'lt' && !(step === 1 && diff === 1) && !(step === 0 && diff === -1)) {
        // (a chromatic inflection 7 -> b7 is accepted: the leading tone becomes the 7th of a secondary dominant, notes p.38)
        add('leadingTone', s.t, names[vi], `leading tone ${p0.name()} in an outer voice does not rise to the tonic (goes to ${cur.name()})`);
      }
    }
    pending = still;
    if (!an || nv < 3) return;
    const label = s.label ?? '';
    const mem = an.members;
    const root = an.root;
    // leading tone
    const ltm = ltMember(label);
    if (ltm && ltm in mem) {
      const ltpc = mod(root.pc + (ltm === 'R' ? 0 : mem['3']), 12);
      const idx = ps.map((p, k) => (p !== null && p.pc === ltpc ? k : -1)).filter((k) => k >= 0);
      if (idx.length >= 2 && nv >= 4) add('doubledLT', s.t, idx.map((k) => names[k]), 'leading tone doubled');
      const nxt = si + 1 < sl.length ? sl[si + 1] : null;
      if (nxt !== null) {
        for (const k of idx) {
          if ((k === 0 || k === nv - 1) && !pending.some((x) => x.vi === k)) pending.push({ vi: k, p0: ps[k]!, kind: 'lt', t0: s.t, root0: root.pc });
        }
      }
    }
    const isAug6 = /^(It|Fr|Ger)/.test(label);
    if (isAug6 && si + 1 < sl.length) {
      const b = ps[ps.length - 1]!;
      const nxt = sliceSnaps[si + 1];
      ps.slice(0, -1).forEach((p, k) => {
        if (p !== null && mod(p.midi - b.midi, 12) === 10 && mod(p.step - b.step, 7) === 5) {
          const q = nxt[k];
          const nb = nxt[nxt.length - 1];
          if (q === null || nb === null) return;
          if (!(q.midi - p.midi === 1 && nb.midi - b.midi === -1) && !(q.eq(p) && nb.eq(b))) {
            add('aug6', sl[si + 1].t, [names[k], names[names.length - 1]], `augmented 6th ${b.name()}–${p.name()} does not expand to an octave (goes to ${nb.name()}–${q.name()})`);
          }
        }
      });
    }
    // chordal seventh
    if ('7' in mem && si > 0 && !isAug6) {
      ps.forEach((p, k) => {
        const q = sliceSnaps[si - 1][k];
        if (p === null || q === null || mod(p.step - root.step, 7) !== 6) return;
        if (q.step - p.step > 1) add('seventhLeap', s.t, names[k], `chordal 7th ${p.name()} approached by descending leap from ${q.name()}`);
      });
    }
    if ('7' in mem && !isAug6) {
      ps.forEach((p, k) => {
        if (p === null) return;
        if (mod(p.step - root.step, 7) === 6 && !pending.some((x) => x.vi === k && x.kind === 'seventh')) pending.push({ vi: k, p0: p, kind: 'seventh', t0: s.t, root0: root.pc });
      });
      const n7 = ps.filter((p) => p !== null && mod(p.step - root.step, 7) === 6).length;
      if (n7 >= 2 && nv >= 4) add('doubling', s.t, null, 'chordal 7th doubled');
    }
    // doubling of root-position triads (root preferred), except V-vi
    if (nv === 4 && !('7' in mem) && s.figures === '5/3' && ps.every((p) => p !== null)) {
      const cnt = new Map<string, number>(); // insertion order, as in the Python dict the stored text comes from
      for (const p of ps as P[]) {
        const g = ({ 0: 'R', 2: '3', 4: '5' } as Record<number, string>)[mod(p.step - root.step, 7)];
        cnt.set(g, (cnt.get(g) ?? 0) + 1);
      }
      if ((cnt.get('R') ?? 0) < 2 && !/^(vi|VI)/.test(label)) {
        add('doubling', s.t, null, `root-position triad without a doubled root (${pyDict(cnt)})`);
      }
    }
    if (nv === 4 && s.figures === '6/4' && !('7' in mem) && ps.every((p) => p !== null)) {
      const b = ps[ps.length - 1]!;
      const nb = ps.filter((p) => p!.pc === b.pc).length;
      if (nb < 2) add('doubling', s.t, null, '6/4 chord without a doubled bass');
    }
    if (label.startsWith('vii') && s.figures === '5/3' && !('7' in mem)) add('viiRoot', s.t, null, 'vii° in root position');
    // 6/4 approach / resolution in the bass
    if (s.figures === '6/4' && !('7' in mem) && nv >= 3) {
      const b = ps[ps.length - 1]!;
      const cad = /^[Ii]6\/4$/.test(label) && (si + 1 === sl.length || (sl[si + 1].label ?? '').startsWith('V'));
      for (const nbI of [si - 1, si + 1]) {
        if (nbI >= 0 && nbI < sl.length) {
          const q = sliceSnaps[nbI][sliceSnaps[nbI].length - 1];
          if (q !== null && Math.abs(q.step - b.step) > 1 && !(cad && nbI === si - 1)) add('sixFour', s.t, 'B', `6/4 bass ${nbI < si ? 'approached' : 'left'} by leap (${q.name()})`);
        }
      }
    }
  });
  return issues;
}

/** Lines and demonstrations are not held to every rule: these checks are switched off for them (as in the pack's build). */
export const LOOSE_ALLOW: readonly string[] = ['range', 'spacing', 'doubling', 'crossing', 'overlap', 'leap', 'augLeap', 'sixFour'];

/** Check an example the way the pack's build does: models and error examples with their own `allow`, the rest loosely. */
export function checkExample(real: Realized, intent: string, allow: readonly string[] = []): Issue[] {
  return check(real, intent === 'model' || intent === 'error' ? allow : LOOSE_ALLOW);
}

/** Python writes a dict as {'R': 1, '3': 2}; the detail text of the stored issues uses that form. */
function pyDict(o: Map<string, number>): string {
  return '{' + [...o].map(([k, v]) => `'${k}': ${v}`).join(', ') + '}';
}

// ---------------------------------------------------------------- for the Example Player
export interface PlayerVoiceEvent {
  t: number;
  d: number;
  rest?: true;
  pitch?: string;
  midi?: number;
  tie?: true;
  natural?: true;
}

/** The realized voices and the analysis rows, in the shape the pack stores and the Example Player draws. */
export function toPlayer(real: Realized): { voices: PlayerVoiceEvent[][]; slices: { t: number; d: number; bar: number; label: string | null; figures: string }[] } {
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
  const voices = real.voices.map((v) =>
    v.map((e) => {
      const o: PlayerVoiceEvent = { t: r4(e.t), d: r4(e.d) };
      if (e.p === null) o.rest = true;
      else {
        o.pitch = e.p.name();
        o.midi = e.p.midi;
        if (e.tie) o.tie = true;
        if (e.p.shownat) o.natural = true;
      }
      return o;
    }),
  );
  return { voices, slices: real.slices.map((s) => ({ t: r4(s.t), d: s.dur, bar: s.bar, label: s.label, figures: s.figures ?? '' })) };
}
