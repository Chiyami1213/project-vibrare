// HIP content (src: content/hip/): historically informed performance for flute and keyboard, after Quantz and
// C. P. E. Bach, checked against Badura-Skoda and Bodky. L. Mozart is a cross-reference only.
import hipJson from '../../../content/hip/data/hip.json';
import type { Example, HipFile, Topic } from '../../../content/hip/schema/types';
import { layersOf, parseVoice, soundingNotes } from '../../scripts/hip/notation';
import type { Layer } from '../../scripts/hip/notation';

export type { Example, Topic };

export const HIP = hipJson as unknown as HipFile;
export const BASE = '/theory/hip';

/** Topics whose rules include a point on which the sources disagree link to the table of disagreements. */
export const DISAGREEMENT_TOPICS = new Set(['appoggiatura', 'trill', 'triplets', 'inequality', 'dissonance-dynamics', 'keyboard-touch', 'keyboard-timekeeper']);

export const sourceById = (id: string) => HIP.sources.find((s) => s.id === id);
export const toolById = (id: string) => HIP.tools.find((t) => t.id === id);

/** What the page script needs to play an example: its layers, or its chords. */
export interface PlayableExample {
  id: string;
  layers: Layer[];
  chords?: { bass: string; notes: string[]; class: string }[];
}

export function playable(e: Example): PlayableExample {
  const chords = (e.written as { chords?: { bass: string; notes: string[]; class: string }[] }).chords;
  return { id: e.id, layers: chords ? [] : layersOf(e.written, e.performed), chords };
}

/** The sounding notes of the upper voice with their annotations, for the strip under an example. */
export function annotationStrip(e: Example): { note: string; syllable?: string; bow?: string; breath?: 'main' | 'emergency'; why?: string }[] {
  const upper = (e.written as { upper?: string }).upper;
  if (!upper) return [];
  const notes = soundingNotes(parseVoice(upper));
  const breaths = new Map((e.breaths ?? []).map((b) => [b.after, b]));
  return notes.map((n, i) => ({
    note: n.pitch!.replace('#', '♯').replace(/^([A-G])b/, '$1♭'),
    syllable: e.syllables?.[i],
    bow: e.bows?.[i],
    breath: breaths.get(i)?.kind,
    why: breaths.get(i)?.why,
  }));
}
