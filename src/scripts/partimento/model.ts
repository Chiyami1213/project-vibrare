// Pure logic for the partimento Example Player: rhythm layout, figured bass, scale degrees,
// transposition and the notes to play. No DOM, so it is unit-tested.
import { Interval, Note } from 'tonal';

export interface RealizedEvent {
  t: number; // onset in beats
  d: number; // duration in beats
  rest?: true;
  pitch?: string; // scientific pitch, e.g. "F#4"
  midi?: number;
  tie?: true; // tied from the previous event
  fig?: string; // the interval figure that produced the note, e.g. "7", "#6", "4+"
}

export interface ExampleData {
  id: string;
  title: string;
  key: string; // upper case = major, lower case = minor: C a d G F e
  meter: string;
  beatUnit: 'half' | 'quarter';
  parts: number; // voices including the bass
  cross?: boolean;
  realized: { voiceOrder: string; lengthBeats: number; voices: RealizedEvent[][] };
  /** Names of the voices, top to bottom (S, A, T, B); without them the player says Upper voice, Voice 2, Bass. */
  voiceNames?: string[];
  /** Optional analysis of each chord (tonal harmony): a label such as "V6/5" and the figures written under the bass. */
  analysis?: { t: number; label?: string | null; figures?: string | null }[];
}

// ---------- time ----------

export const WHOLE = 64; // ticks in a whole note

export const ticksPerBeat = (u: ExampleData['beatUnit']) => (u === 'half' ? 32 : 16);

export function barTicks(meter: string): number {
  const [n, d] = meter.split('/').map(Number);
  return (n * WHOLE) / d;
}

/** Note values a single notehead can have, longest first: [ticks, VexFlow duration, dotted]. */
const VALUES: [number, string, boolean][] = [
  [64, 'w', false],
  [48, 'h', true],
  [32, 'h', false],
  [24, 'q', true],
  [16, 'q', false],
  [12, '8', true],
  [8, '8', false],
  [6, '16', true],
  [4, '16', false],
  [2, '32', false],
];

export interface NoteSpec {
  start: number; // absolute tick
  ticks: number;
  dur: string; // VexFlow duration without the dot: w h q 8 16 32
  dotted: boolean;
  pitch: string | null; // null = rest
  tieFromPrev: boolean; // joined to the note before it (same pitch)
}

/** Split a duration into single note values. */
export function splitDuration(ticks: number): [number, string, boolean][] {
  const out: [number, string, boolean][] = [];
  let left = ticks;
  while (left > 0) {
    const v = VALUES.find(([t]) => t <= left);
    if (!v) throw new Error(`cannot write a duration of ${left} ticks`);
    out.push(v);
    left -= v[0];
  }
  return out;
}

/**
 * Turn one voice's events into measures of notes: events are cut at bar lines, long values are
 * split into writable note values, and the pieces are tied together.
 */
export function layoutVoice(events: RealizedEvent[], unit: ExampleData['beatUnit'], bar: number, totalBars: number): NoteSpec[][] {
  const tpb = ticksPerBeat(unit);
  const measures: NoteSpec[][] = Array.from({ length: totalBars }, () => []);
  for (const ev of events) {
    const start = Math.round(ev.t * tpb);
    const ticks = Math.round(ev.d * tpb);
    if (Math.abs(ev.t * tpb - start) > 1e-6 || Math.abs(ev.d * tpb - ticks) > 1e-6) {
      throw new Error(`event at beat ${ev.t} is not on the tick grid`);
    }
    let pos = start;
    let left = ticks;
    let first = true;
    while (left > 0) {
      const m = Math.floor(pos / bar);
      const room = (m + 1) * bar - pos;
      const take = Math.min(left, room);
      let p = pos;
      let rem = take;
      for (const [t, dur, dotted] of splitDuration(take)) {
        measures[m].push({
          start: p,
          ticks: t,
          dur,
          dotted,
          pitch: ev.rest ? null : ev.pitch ?? null,
          tieFromPrev: !ev.rest && (!first || ev.tie === true || p !== pos),
        });
        first = false;
        p += t;
        rem -= t;
      }
      pos += take;
      left -= take;
    }
  }
  return measures;
}

export function totalBarsOf(ex: ExampleData): number {
  const total = Math.round(ex.realized.lengthBeats * ticksPerBeat(ex.beatUnit));
  return Math.max(1, Math.ceil(total / barTicks(ex.meter)));
}

// ---------- figured bass ----------

const FIG = /^([#bn]?)(\d+)(\+?)$/;

/** One figure for display: "#6" -> "♯6", compound numbers reduced (10 -> 3, 12 -> 5, 13 -> 6). */
export function displayFigure(fig: string): { text: string; num: number } | null {
  const m = FIG.exec(fig);
  if (!m) return null;
  let num = Number(m[2]);
  if (num > 9) num = num === 11 ? 4 : num - 7;
  const acc = m[1] === '#' ? '♯' : m[1] === 'b' ? '♭' : m[1] === 'n' ? '♮' : '';
  return { text: `${acc}${num}${m[3]}`, num };
}

/** The figure stack for the figures sounding together: reduced, deduplicated, highest number first. */
export function figureStack(figs: (string | undefined)[]): string[] {
  const seen = new Map<string, number>();
  for (const f of figs) {
    if (!f) continue;
    const d = displayFigure(f);
    if (d) seen.set(d.text, d.num);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

// ---------- scale degrees ----------

const CIRCLED = '①②③④⑤⑥⑦';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

/** Circled scale degree of a pitch in a key, with ♯/♭ for notes outside the scale, e.g. "⑤" or "♯④". */
export function degreeLabel(pitch: string, key: string): string {
  const tonic = Note.get(key.toUpperCase());
  const n = Note.get(pitch);
  if (n.empty || tonic.empty) return '';
  const scale = key === key.toUpperCase() ? MAJOR : MINOR;
  const deg = (n.step - tonic.step + 7) % 7;
  const expected = (tonic.chroma + scale[deg]) % 12;
  const alt = ((n.chroma - expected + 18) % 12) - 6;
  const acc = alt > 0 ? '♯'.repeat(alt) : alt < 0 ? '♭'.repeat(-alt) : '';
  return acc + CIRCLED[deg];
}

// ---------- slices (one per moment where something starts) ----------

export interface Slice {
  tick: number;
  beat: number;
  figures: string[]; // reduced figure stack, e.g. ["♯6", "3"]
  degree: string; // circled bass degree
  bassStart: boolean; // a new bass note starts here
  label?: string; // analysis label (Roman numeral) when the example has an analysis
}

/** Figures of an analysed chord as a stack: "5/3" and "8/5/3" need none, "6/3" is written "6", the rest as they are. */
export function figuresFromAnalysis(f: string | null | undefined): string[] {
  if (!f || f === '5/3' || f === '8/5/3') return [];
  if (f === '6/3') return ['6'];
  return f.split('/');
}

const covers = (ev: RealizedEvent, t: number) => ev.t <= t + 1e-9 && t < ev.t + ev.d - 1e-9;

export function slicesOf(ex: ExampleData): Slice[] {
  const tpb = ticksPerBeat(ex.beatUnit);
  const voices = ex.realized.voices;
  const bass = voices[voices.length - 1];
  const onsets = [...new Set(voices.flatMap((v) => v.map((e) => e.t)))].sort((a, b) => a - b);
  return onsets.map((t) => {
    const bassEv = bass.find((e) => covers(e, t));
    const figs = voices.slice(0, -1).map((v) => v.find((e) => covers(e, t))).filter((e) => e && !e.rest).map((e) => e!.fig);
    const an = ex.analysis?.find((a) => Math.abs(a.t - t) < 1e-9);
    return {
      tick: Math.round(t * tpb),
      beat: t,
      figures: ex.analysis ? figuresFromAnalysis(an?.figures) : figureStack(figs),
      degree: bassEv?.pitch ? degreeLabel(bassEv.pitch, ex.key) : '',
      bassStart: bass.some((e) => Math.abs(e.t - t) < 1e-9),
      label: an?.label ?? undefined,
    };
  });
}

// ---------- transposition ----------

export const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const MINOR_KEYS = ['a', 'e', 'b', 'f#', 'c#', 'g#', 'eb', 'bb', 'f', 'c', 'g', 'd'];

export const tonicOf = (key: string) => key[0].toUpperCase() + key.slice(1);
export const isMajorKey = (key: string) => key === key.toUpperCase();

/** Key name for display: "F♯ major", "E♭ minor". */
export function keyLabel(key: string): string {
  const t = tonicOf(key).replace('#', '♯').replace(/b$/, '♭');
  return `${t} ${isMajorKey(key) ? 'major' : 'minor'}`;
}

/** Key signature spec for VexFlow: "F#", "Eb", "Ebm". */
export const keySpec = (key: string) => tonicOf(key) + (isMajorKey(key) ? '' : 'm');

export interface Transposed {
  example: ExampleData;
  /** pitches that needed more than a double sharp/flat (VexFlow cannot draw them) */
  overflow: number;
}

/** Move the whole example to another key, keeping the spelling correct (F# major has E#, not F). */
export function transposeExample(ex: ExampleData, target: string): Transposed {
  if (target === ex.key) return { example: ex, overflow: 0 };
  const up = Interval.distance(tonicOf(ex.key), tonicOf(target));
  const semis = Interval.semitones(up) ?? 0;
  const shift = semis > 6 ? `-${Interval.invert(up)}` : up; // take the shorter way, so the range stays put
  let overflow = 0;
  const voices = ex.realized.voices.map((v) =>
    v.map((e) => {
      if (!e.pitch) return e;
      const p = Note.transpose(e.pitch, shift);
      if (Math.abs(Note.get(p).alt) > 2) overflow++;
      return { ...e, pitch: p, midi: Note.midi(p) ?? e.midi };
    }),
  );
  return { example: { ...ex, key: target, realized: { ...ex.realized, voices } }, overflow };
}

// ---------- sound ----------

export interface PlayNote {
  voice: number;
  midi: number;
  start: number; // beats
  dur: number; // beats (tied notes are joined)
}

/** The notes to sound: rests dropped, tied events joined into one long note. */
export function playableNotes(ex: ExampleData): PlayNote[] {
  const out: PlayNote[] = [];
  ex.realized.voices.forEach((events, voice) => {
    let last: PlayNote | null = null;
    for (const e of events) {
      if (e.rest || e.midi === undefined) {
        last = null;
        continue;
      }
      if (e.tie && last && last.midi === e.midi && Math.abs(last.start + last.dur - e.t) < 1e-9) {
        last.dur += e.d;
        continue;
      }
      last = { voice, midi: e.midi, start: e.t, dur: e.d };
      out.push(last);
    }
  });
  return out.sort((a, b) => a.start - b.start || a.voice - b.voice);
}

/** Notes sounding at a beat (for step mode). */
export function soundingAt(ex: ExampleData, beat: number): PlayNote[] {
  return playableNotes(ex).filter((n) => n.start <= beat + 1e-9 && beat < n.start + n.dur - 1e-9);
}
