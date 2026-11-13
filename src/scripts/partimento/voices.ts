// Voice-identity colouring (content/*/VOICE_COLORS.md): which colour a voice has, where voices cross or overlap, and, for
// the tonal examples, which notes are the chordal 7th and the leading tone. No DOM, so it is tested.
import type { ExampleData, RealizedEvent } from './model.ts';

const EPS = 1e-9;

/**
 * The colour slot (1 to 5) of each voice. The lowest voice is always slot 4 (ink) when there are four or fewer voices,
 * so that the bass keeps its colour whatever the number of parts; a five-voice score uses slots 1 to 5 in order.
 */
export function voiceSlots(parts: number): number[] {
  if (parts >= 5) return Array.from({ length: parts }, (_, i) => Math.min(5, i + 1));
  if (parts <= 1) return [1];
  return Array.from({ length: parts }, (_, i) => (i === parts - 1 ? 4 : i + 1));
}

export interface Span {
  kind: 'crossing' | 'overlap' | 'unison';
  upper: number; // index of the upper voice
  lower: number;
  from: number; // beats
  to: number;
}

const sounding = (v: RealizedEvent[], t: number) => v.find((e) => !e.rest && e.midi !== undefined && e.t <= t + EPS && t < e.t + e.d - EPS);

/** Crossings (the upper voice below the lower, while both sound), overlaps (a voice moves past the other's previous note) and unisons. */
export function voiceSpans(voices: RealizedEvent[][]): Span[] {
  const out: Span[] = [];
  for (let i = 0; i < voices.length - 1; i++) {
    const hi = voices[i];
    const lo = voices[i + 1];
    const times = [...new Set([...hi, ...lo].flatMap((e) => [e.t, e.t + e.d]))].sort((a, b) => a - b);
    // crossing and unison: while both sound
    let open: Span | null = null;
    for (let k = 0; k < times.length - 1; k++) {
      const t = times[k];
      const a = sounding(hi, t);
      const b = sounding(lo, t);
      const kind: Span['kind'] | null = a && b ? (a.midi! < b.midi! ? 'crossing' : a.midi === b.midi ? 'unison' : null) : null;
      if (kind && open && open.kind === kind && Math.abs(open.to - t) < EPS) open.to = times[k + 1];
      else {
        if (open) out.push(open);
        open = kind ? { kind, upper: i, lower: i + 1, from: t, to: times[k + 1] } : null;
      }
    }
    if (open) out.push(open);
    // overlap: on an attack, a voice goes past the previous note of the other voice
    const attacks = (v: RealizedEvent[]) => v.filter((e) => !e.rest && e.midi !== undefined && !e.tie);
    const prevOf = (v: RealizedEvent[], t: number) => [...v].reverse().find((e) => !e.rest && e.midi !== undefined && e.t < t - EPS);
    for (const e of attacks(lo)) {
      const p = prevOf(hi, e.t);
      if (p && e.midi! > p.midi! && !out.some((s) => s.kind === 'crossing' && s.upper === i && s.from <= e.t + EPS && e.t < s.to - EPS)) {
        out.push({ kind: 'overlap', upper: i, lower: i + 1, from: e.t, to: e.t + Math.min(e.d, 1) });
      }
    }
    for (const e of attacks(hi)) {
      const p = prevOf(lo, e.t);
      if (p && e.midi! < p.midi! && !out.some((s) => s.kind === 'crossing' && s.upper === i && s.from <= e.t + EPS && e.t < s.to - EPS)) {
        out.push({ kind: 'overlap', upper: i, lower: i + 1, from: e.t, to: e.t + Math.min(e.d, 1) });
      }
    }
  }
  return out.sort((a, b) => a.from - b.from || a.upper - b.upper);
}

/** Just the spans that mean something is out of order: crossings and overlaps. */
export const problems = (voices: RealizedEvent[][]) => voiceSpans(voices).filter((s) => s.kind !== 'unison');

// ---------- the chordal 7th and the leading tone (tonal colour mode) ----------

export type Role = 'seventh' | 'lt';
export interface RoleMark {
  voice: number;
  t: number;
  role: Role;
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pcOfName = (n: string) => {
  const m = /^([A-G])(#*|b*)/.exec(n);
  return m ? mod12(LETTER[m[1]] + (m[2].startsWith('#') ? m[2].length : -m[2].length)) : null;
};
const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** A dominant-type chord (V, V7, V6/5, also of another chord: V7/V): its 3rd is the leading tone. A vii chord: its root. */
export function chordKind(label: string | null | undefined): { dominant: boolean; leadingRoot: boolean; seventh: boolean } {
  const head = (label ?? '').replace(/s/g, '').split('/')[0];
  return {
    dominant: /^V(?!I)/.test(head),
    leadingRoot: /^vii/.test(head),
    seventh: /(7|65|43|42|ø)/.test(head) && !/^(It|Fr|Ger)/.test(head),
  };
}

/**
 * The notes to colour in the tonal examples: the chordal 7th (green) and the leading tone (red). They come from each
 * slice's label and root: a V-type chord has its 3rd as leading tone, a vii-type chord its root.
 */
export function roleMarks(ex: ExampleData & { analysis?: { t: number; label?: string | null; figures?: string | null; root?: string | null }[] }): RoleMark[] {
  const out: RoleMark[] = [];
  for (const a of ex.analysis ?? []) {
    const root = a.root ? pcOfName(a.root) : null;
    if (root === null) continue;
    const kind = chordKind(a.label);
    ex.realized.voices.forEach((v, voice) => {
      for (const e of v) {
        if (e.rest || e.midi === undefined || e.tie || Math.abs(e.t - a.t) > EPS) continue; // the notes that start with the chord
        const iv = mod12(e.midi - root);
        if (kind.seventh && (iv === 10 || iv === 11 || (iv === 9 && kind.leadingRoot))) out.push({ voice, t: e.t, role: 'seventh' });
        else if ((kind.dominant && iv === 4) || (kind.leadingRoot && iv === 0)) out.push({ voice, t: e.t, role: 'lt' });
      }
    });
  }
  return out;
}
