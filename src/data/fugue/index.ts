// Fugue content (src: content/fugue/): theory after Alfred Mann's The Study of Fugue, and an analysis guide compiled
// from Roberts, Badura-Skoda, Bodky, Gedalge, C. P. E. Bach and Mann.
import theoryJson from '../../../content/fugue/data/fugue-theory.json';
import analysisJson from '../../../content/fugue/data/fugue-analysis.json';
import type { AnalysisFile, Chapter, TheoryFile, Topic, TheoryExample } from '../../../content/fugue/schema/types';
import type { ExampleData } from '../../scripts/partimento/model';
import { eventsFromWholeNotes, lengthOf } from '../whole-note-voices';

export type { Chapter, Topic, TheoryExample };

export const THEORY = theoryJson as unknown as TheoryFile;
export const ANALYSIS = analysisJson as unknown as AnalysisFile;
export const BASE = '/theory/partimento/fugue';

export interface GroupPage {
  slug: string;
  id: string;
  title: string; // short, for the tabs
  heading: string;
  subtitle: string;
  chapters: Chapter[];
}

const SLUG: Record<string, string> = { part1: 'part-one', part2: 'fux', part3: 'marpurg', part4: 'albrechtsberger', part5: 'martini' };
const SHORT: Record<string, string> = { part1: 'Part One', part2: 'Fux', part3: 'Marpurg', part4: 'Albrechtsberger', part5: 'Martini' };

/** The five parts of Mann's book, each a page (the thesis, in the front matter, is on the overview). */
export const GROUPS: GroupPage[] = THEORY.parts.map((p) => ({
  slug: SLUG[p.id],
  id: p.id,
  title: SHORT[p.id],
  heading: p.title,
  subtitle: p.subtitle,
  chapters: THEORY.chapters.filter((c) => c.part === p.id),
}));

export const FRONT: Chapter[] = THEORY.chapters.filter((c) => c.part === 'front');

const CHAPTER_URL = new Map<string, string>();
for (const g of GROUPS) for (const c of g.chapters) CHAPTER_URL.set(c.id, `${BASE}/${g.slug}/#${c.id}`);
for (const c of FRONT) CHAPTER_URL.set(c.id, `${BASE}/#${c.id}`);
const TOPIC_TITLE = new Map(ANALYSIS.topics.map((t) => [t.id, t.title]));

/** Where a `seeAlso` id leads: a chapter of the theory or a topic of the analysis. */
export function linkFor(id: string): { href: string; label: string } | null {
  const chapter = THEORY.chapters.find((c) => c.id === id);
  if (chapter) return { href: CHAPTER_URL.get(id)!, label: chapter.title };
  const title = TOPIC_TITLE.get(id);
  return title ? { href: `${BASE}/analysis/#${id}`, label: title } : null;
}

export function exampleData(e: TheoryExample): ExampleData {
  const voices = e.voices.map((v) => eventsFromWholeNotes(v.notes));
  return {
    id: e.id,
    title: e.title,
    key: e.key,
    meter: '4/4',
    beatUnit: 'quarter',
    parts: voices.length,
    realized: { voiceOrder: 'top→bottom', lengthBeats: lengthOf(voices), voices },
    voiceNames: voices.map((_, i) => `Voice ${i + 1}`),
    noDegrees: false,
    colourDefault: 'voices',
  };
}
