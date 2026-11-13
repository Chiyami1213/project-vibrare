// Counterpoint voices (notes with durations in whole notes) as an example for the shared Example Player.
import { eventsFromWholeNotes, lengthOf } from '../../data/whole-note-voices';
import type { ExampleData } from '../partimento/model';
import type { Voice } from './rules';

export function scoreData(id: string, title: string, voices: Voice[], names?: string[]): ExampleData {
  const events = voices.map((v) => eventsFromWholeNotes(v.notes.map((n) => ({ ...n, p: n.p ?? undefined }))));
  return {
    id,
    title,
    key: 'C', // modal music: no key signature
    meter: '4/4',
    beatUnit: 'quarter',
    parts: voices.length,
    realized: { voiceOrder: 'top→bottom', lengthBeats: lengthOf(events), voices: events },
    voiceNames: names,
    noDegrees: true,
    intervals: voices.length === 2,
  };
}

/** The names of the voices of a counterpoint score. */
export const voiceNamesOf = (voices: Voice[]): string[] =>
  voices.map((v, i) => (v.role === 'cf' ? 'Cantus Firmus' : voices.length === 2 ? 'Counterpoint' : `Voice ${i + 1}`));
