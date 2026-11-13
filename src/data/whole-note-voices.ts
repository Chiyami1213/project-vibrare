// Voices written as notes with durations in whole notes (counterpoint and fugue packs), turned into the events of the
// Example Player. One whole note is one bar of 4/4 (4 quarter beats).
import { Note } from 'tonal';
import type { RealizedEvent } from '../scripts/partimento/model';

export const BEATS_PER_WHOLE = 4;

export interface WholeNote {
  p?: string;
  d: number;
  rest?: 1 | boolean;
  tie?: 1 | boolean;
  natural?: boolean;
}

/**
 * Events for one voice. A tie mark sits on the first of two tied notes (Fux), so it moves to the second.
 * `natural` is kept: it asks for an explicit natural sign.
 */
export function eventsFromWholeNotes(notes: WholeNote[]): RealizedEvent[] {
  let t = 0;
  let tieNext = false;
  return notes.map((n) => {
    const ev: RealizedEvent & { natural?: true } = { t: t * BEATS_PER_WHOLE, d: n.d * BEATS_PER_WHOLE };
    if (n.rest || !n.p) ev.rest = true;
    else {
      ev.pitch = n.p;
      ev.midi = Note.midi(n.p) ?? undefined;
      if (tieNext) ev.tie = true;
      if (n.natural) ev.natural = true;
    }
    tieNext = !!n.tie;
    t += n.d;
    return ev;
  });
}

export const lengthOf = (voices: RealizedEvent[][]) => Math.max(...voices.map((v) => v.reduce((a, ev) => Math.max(a, ev.t + ev.d), 0)));
