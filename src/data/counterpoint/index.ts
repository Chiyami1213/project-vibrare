// Counterpoint content (src: content/counterpoint/): Fux's Gradus ad Parnassum in Mann's translation, as a study guide.
import fuxJson from '../../../content/counterpoint/data/fux.json';
import type { Chapter, Example, FuxFile } from '../../../content/counterpoint/schema/types';
import type { ExampleData } from '../../scripts/partimento/model';
import { eventsFromWholeNotes, lengthOf } from '../whole-note-voices';

export type { Chapter, Example };

export const FUX = fuxJson as unknown as FuxFile;
export const BASE = '/theory/counterpoint';

export interface PartPage {
  slug: string;
  id: string;
  title: string;
  subtitle: string;
  chapters: Chapter[];
}

const SLUG: Record<string, string> = { part1: 'first-part', part2: 'second-part', part3: 'third-part' };

/** The three parts, each a page. The appendix and the quick-reference table close the third part. */
export const PARTS: PartPage[] = FUX.parts.map((p) => ({
  slug: SLUG[p.id],
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  chapters: FUX.chapters.filter((c) => c.part === p.id),
}));

export const FRONT: Chapter[] = FUX.chapters.filter((c) => c.part === 'front');

/**
 * A Fux example in the shape of the Example Player. Durations are in whole notes (1 = one bar of the cantus). The
 * staves take their clefs from the range of the voices.
 */
export function exampleData(id: string, e: Example): ExampleData {
  const voices = e.voices.map((v) => eventsFromWholeNotes(v.notes));
  const length = lengthOf(voices);
  return {
    id,
    title: e.title,
    key: 'C', // modal music: no key signature; accidentals are written where they occur
    meter: '4/4',
    beatUnit: 'quarter',
    parts: voices.length,
    realized: { voiceOrder: 'top→bottom', lengthBeats: length, voices },
    voiceNames: e.voices.map((v) => (v.role === 'cf' ? 'Cantus Firmus' : e.voices.length === 2 ? 'Counterpoint' : 'Counterpoint ' + (e.voices.filter((x) => x.role === 'cpt').indexOf(v) + 1))),
    noDegrees: true,
    intervals: voices.length === 2,
  };
}
