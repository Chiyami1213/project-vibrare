// The mini-notation of the HIP pack: one string per voice, tokens separated by spaces.
//   [g]PITCH:DUR[@VEL][.|_]      PITCH = C4, F#5, Bb3 or "r" (rest); DUR in crotchets; "|" is a barline (ignored)
//   @VEL  loudness 0..1      "."  detached (about half the value)      "_"  slurred into the next note
//   g     a grace (small) note: it is written, but it does not sound in the written layer
import { Note } from 'tonal';

export interface HipNote {
  pitch: string | null; // null = rest
  midi: number | null;
  t: number; // onset, in crotchets
  d: number; // value, in crotchets
  vel: number | null;
  grace: boolean;
  touch: 'normal' | 'detached' | 'slurred';
}

const TOKEN = /^(g)?([A-G][#b]?-?\d|r):(\d+(?:\.\d+)?)(?:@(\d(?:\.\d+)?))?([._])?$/;

export class NotationError extends Error {}

/** Parse one voice. Grace notes keep their place but take no time. */
export function parseVoice(src: string): HipNote[] {
  const out: HipNote[] = [];
  let t = 0;
  for (const raw of src.split(/\s+/)) {
    if (!raw || raw === '|') continue;
    const m = TOKEN.exec(raw);
    if (!m) throw new NotationError(`Cannot read "${raw}" in "${src}"`);
    const [, g, p, dur, vel, mark] = m;
    const grace = g === 'g';
    const d = Number(dur);
    const rest = p === 'r';
    out.push({
      pitch: rest ? null : p,
      midi: rest ? null : (Note.midi(p) ?? null),
      t,
      d: grace ? 0 : d,
      vel: vel === undefined ? null : Number(vel),
      grace,
      touch: mark === '.' ? 'detached' : mark === '_' ? 'slurred' : 'normal',
    });
    if (!grace) t += d;
  }
  return out;
}

/** Notes that sound in the upper voice, in order: no rests, no grace notes. Annotations count these. */
export const soundingNotes = (voice: HipNote[]): HipNote[] => voice.filter((n) => n.pitch !== null && !n.grace);

export interface ScheduledNote {
  midi: number;
  start: number; // seconds from the start
  dur: number; // seconds
  level: number; // 0..1
}

/**
 * The notes to play for some voices, at `crotchetSeconds` per crotchet (60 beats a minute = 1).
 * A plain note sounds for 90% of its value, a detached one for 50% and a slurred one for 100%. A harpsichord cannot
 * play louder by touch, so a note marked @0.8 or more is accented the way the sources say it is done: it starts about
 * 10 ms late and sounds for its full value. On a piano `useVelocity` turns the marking into loudness instead.
 */
export function schedule(voices: HipNote[][], crotchetSeconds = 1, useVelocity = false): ScheduledNote[] {
  const out: ScheduledNote[] = [];
  for (const voice of voices) {
    for (const n of voice) {
      if (n.pitch === null || n.midi === null || n.grace) continue;
      const accent = n.vel !== null && n.vel >= 0.8;
      let share = n.touch === 'detached' ? 0.5 : n.touch === 'slurred' ? 1 : 0.9;
      if (accent && !useVelocity) share = 1;
      out.push({
        midi: n.midi,
        start: n.t * crotchetSeconds + (accent && !useVelocity ? 0.01 : 0),
        dur: n.d * crotchetSeconds * share,
        level: useVelocity && n.vel !== null ? Math.max(0.2, n.vel) : 1,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start || b.midi - a.midi);
}

export interface Layer {
  name: string; // "Written", "Quantz", "C. P. E. Bach", "Performed"
  voices: Record<string, string>; // voice key -> mini-notation
}

const isNotation = (v: unknown): v is string => typeof v === 'string';

/**
 * The layers of an example. "Written" is always first. In `performed`, a key that is a voice of the written layer
 * (upper, lower, bass) replaces that voice; any other key is the name of a realization of the upper voice
 * (Quantz, C. P. E. Bach). A value of "same" means the example is about its annotations, not about rhythm.
 */
export function layersOf(written: Record<string, unknown>, performed: Record<string, string>): Layer[] {
  const voices: Record<string, string> = {};
  for (const [k, v] of Object.entries(written)) if (isNotation(v) && ['upper', 'lower', 'bass'].includes(k)) voices[k] = v;
  const layers: Layer[] = [{ name: 'Written', voices }];
  const named: Layer[] = [];
  const replaced: Record<string, string> = {};
  for (const [k, v] of Object.entries(performed)) {
    if (v === 'same' || k === 'rule' || !isNotation(v)) continue;
    if (k in voices || ['upper', 'lower', 'bass'].includes(k)) replaced[k] = v;
    else named.push({ name: k, voices: { ...voices, upper: v } });
  }
  if (named.length > 0) {
    for (const l of named) layers.push({ name: l.name, voices: { ...l.voices, ...replaced, upper: l.voices.upper } });
  } else if (Object.keys(replaced).length > 0) {
    layers.push({ name: 'Performed', voices: { ...voices, ...replaced } });
  }
  return layers;
}
