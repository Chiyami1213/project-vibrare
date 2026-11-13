// Counterpoint content (src: content/counterpoint/): Fux's Gradus ad Parnassum in Mann's translation, as a study guide.
import { Note } from 'tonal';
import fuxJson from '../../../content/counterpoint/data/fux.json';
import type { Chapter, Example, FuxFile } from '../../../content/counterpoint/schema/types';
import type { ExampleData, RealizedEvent } from '../../scripts/partimento/model';

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

/** One whole note of the cantus is one bar: 4 quarter beats in 4/4. */
const BEATS_PER_WHOLE = 4;

/**
 * A Fux example in the shape of the Example Player. Durations are in whole notes (1 = one bar), and a tie mark sits
 * on the first of two tied notes, so it moves to the second. The staves take their clefs from the range of the voices.
 */
export function exampleData(id: string, e: Example): ExampleData {
  const voices: RealizedEvent[][] = e.voices.map((v) => {
    let t = 0;
    let tieNext = false;
    return v.notes.map((n) => {
      const ev: RealizedEvent = { t: t * BEATS_PER_WHOLE, d: n.d * BEATS_PER_WHOLE };
      if (n.rest || !n.p) ev.rest = true;
      else {
        ev.pitch = n.p;
        ev.midi = Note.midi(n.p) ?? undefined;
        if (tieNext) ev.tie = true;
      }
      tieNext = !!n.tie;
      t += n.d;
      return ev;
    });
  });
  const length = Math.max(...voices.map((v) => v.reduce((a, ev) => Math.max(a, ev.t + ev.d), 0)));
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
