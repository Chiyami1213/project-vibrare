// Tonal harmony content (src: content/tonal-harmony/), built from the owner's notes on Dr. B's lessons and checked
// against Aldwell, Schachter and Cadwallader (5th ed.) and Burstein and Straus (2nd ed.).
import indexJson from '../../../content/tonal-harmony/data/index.json';
import p1 from '../../../content/tonal-harmony/data/part-p1.json';
import p2 from '../../../content/tonal-harmony/data/part-p2.json';
import p3 from '../../../content/tonal-harmony/data/part-p3.json';
import p5 from '../../../content/tonal-harmony/data/part-p5.json';
import p6 from '../../../content/tonal-harmony/data/part-p6.json';
import type { IndexFile, PartFile, Topic, Example, Lesson } from '../../../content/tonal-harmony/schema/types';
import type { ExampleData } from '../../scripts/partimento/model';

export type { Topic, Example, Lesson };

export const BASE = '/theory/tonal-harmony';
export const PLAYLIST = 'https://www.youtube.com/playlist?list=PLw9t0oA3fHkxx1PgYpiXrMUPXaOiwh6KU';

export const INDEX = indexJson as unknown as IndexFile;
const FILES = [p1, p2, p3, p5, p6] as unknown as PartFile[];

/** The five parts, with the page address of each. The notes have no Part IV, so the numbering follows the notes. */
const SLUGS: Record<string, string> = { p1: 'fundamentals', p2: 'voice-leading', p3: 'dominant', p5: 'predominant', p6: 'chromatic' };

export interface PartPage {
  id: string;
  slug: string;
  num: string;
  title: string;
  notesPages: string;
  file: PartFile;
}

export const PARTS: PartPage[] = FILES.map((f) => ({
  id: f.part.id,
  slug: SLUGS[f.part.id],
  num: f.part.num,
  title: f.part.title,
  notesPages: f.part.notesPages,
  file: f,
}));

const TOPIC_PART = new Map<string, PartPage>();
const TOPICS = new Map<string, Topic>();
for (const p of PARTS) {
  for (const t of p.file.topics) {
    TOPIC_PART.set(t.id, p);
    TOPICS.set(t.id, t);
  }
}

export const getTopic = (id: string) => TOPICS.get(id);
export const topicUrl = (id: string) => `${BASE}/${TOPIC_PART.get(id)?.slug ?? ''}/#${id}`;
export const lessonByNum = (n: number): Lesson | undefined => INDEX.lessons.find((l) => l.num === n);
export const toolById = (id: string) => INDEX.tools.find((t) => t.id === id);

export const countTopics = () => PARTS.reduce((n, p) => n + p.file.topics.length, 0);
export const countExamples = () => PARTS.reduce((n, p) => n + p.file.topics.reduce((m, t) => m + (t.examples?.length ?? 0), 0), 0);

const VOICE_NAMES: Record<number, string[]> = { 1: ['Melody'], 2: ['S', 'B'], 3: ['S', 'A', 'B'], 4: ['S', 'A', 'T', 'B'] };

/** An example in the shape of the Example Player: the same voices, plus the analysis of each chord. */
const MARK_LEVEL: Record<string, 'error' | 'warn' | 'info'> = { red: 'error', orange: 'error', yellow: 'warn', green: 'warn', blue: 'info', white: 'info' };

/** The notes the part-writing checker found faulty, for the score: the voice (S A T B) and the beat. */
function marksOf(e: Example): NonNullable<ExampleData['marks']> {
  const names = VOICE_NAMES[e.parts] ?? [];
  return (e.checker ?? []).flatMap((i) => {
    const vs = Array.isArray(i.voices) ? i.voices : i.voices == null ? [] : [i.voices];
    return vs.map((v) => ({ voice: typeof v === 'number' ? v : names.indexOf(String(v)), t: i.beat, level: MARK_LEVEL[i.level] ?? 'info' })).filter((m) => m.voice >= 0);
  });
}

export function exampleData(e: Example): ExampleData {
  return {
    id: e.id,
    title: e.title,
    key: e.key,
    meter: e.meter,
    beatUnit: e.beatUnit,
    parts: e.parts,
    cross: e.intent === 'error',
    realized: e.realized as unknown as ExampleData['realized'],
    voiceNames: VOICE_NAMES[e.parts] ?? undefined,
    analysis: e.realized.slices.map((s) => ({ t: s.t, label: s.label, figures: s.figures })),
    marks: e.intent === 'error' ? marksOf(e) : undefined,
  };
}
