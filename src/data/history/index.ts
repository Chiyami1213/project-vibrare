// History content (src: content/history/): the Music History tab. Its first source is Christensen (ed.), The Cambridge
// History of Western Music Theory (2002). The other tabs carry the technique that overlaps (history-background.json in
// each pack); this tab keeps the narrative and links to them.
import historyJson from '../../../content/history/data/history.json';
import fuxBg from '../../../content/counterpoint/data/history-background.json';
import tonalBg from '../../../content/tonal-harmony/data/history-background.json';
import partimentoBg from '../../../content/partimento/data/history-background.json';
import fugueBg from '../../../content/fugue/data/history-background.json';
import hipBg from '../../../content/hip/data/history-background.json';
import type { Article, Era, HistoryFile, Person, QuizItem, TabId, Term, Thread, Work } from '../../../content/history/schema/types';
import type { BackgroundTopic, HistoryBackgroundFile } from '../../../content/counterpoint/schema/types';
import { PARTS as FUX_PARTS } from '../counterpoint';
import { PARTS as TONAL_PARTS } from '../tonal-harmony';

export type { Article, Era, Person, QuizItem, TabId, Term, Thread, Work, BackgroundTopic };

export const H = historyJson as unknown as HistoryFile;
export const BASE = '/theory/music-history';

const BG: Record<TabId, HistoryBackgroundFile> = {
  fux: fuxBg as unknown as HistoryBackgroundFile,
  tonal: tonalBg as unknown as HistoryBackgroundFile,
  partimento: partimentoBg as unknown as HistoryBackgroundFile,
  fugue: fugueBg as unknown as HistoryBackgroundFile,
  hip: hipBg as unknown as HistoryBackgroundFile,
};

export const TAB_NAMES: Record<TabId, string> = {
  fux: 'Counterpoint',
  tonal: 'Tonal Harmony',
  partimento: 'Partimento',
  fugue: 'Fugue',
  hip: 'Historically Informed Performance',
};

export const articleUrl = (id: string) => `${BASE}/${id}/`;
export const ARTICLES = new Map(H.articles.map((a) => [a.id, a]));
export const PEOPLE = new Map(H.people.map((p) => [p.id, p]));
export const WORKS = new Map(H.works.map((w) => [w.id, w]));
export const TERMS = new Map(H.terms.map((t) => [t.id, t]));
export const THREADS = new Map(H.threads.map((t) => [t.id, t]));
export const ERAS = new Map(H.eras.map((e) => [e.id, e]));

/** The background panels that sit at `ref` of a tab (a chapter, group or section id of that tab). */
export const panelsAt = (tab: TabId, ref: string): BackgroundTopic[] => BG[tab].topics.filter((t) => t.attachTo.ref === ref);
export const backgroundTopic = (tab: TabId, id: string): BackgroundTopic | undefined => BG[tab].topics.find((t) => t.id === id);

/** The page that shows a tab's background topic, with the panel as anchor. */
export function topicUrl(tab: TabId, topicId: string): string {
  const t = backgroundTopic(tab, topicId);
  const anchor = `#${topicId}`;
  if (!t) return '/theory/';
  const ref = t.attachTo.ref;
  switch (tab) {
    case 'fux': {
      const part = FUX_PARTS.find((p) => p.chapters.some((c) => c.id === ref));
      return (part ? `/theory/counterpoint/${part.slug}/` : '/theory/counterpoint/') + anchor;
    }
    case 'tonal': {
      const part = TONAL_PARTS.find((p) => p.file.chapters.some((c) => c.id === ref));
      return `/theory/tonal-harmony/${part?.slug ?? ''}/${anchor}`;
    }
    case 'partimento':
      return `/theory/partimento/rule-of-the-octave/${anchor}`;
    case 'fugue':
      return `/theory/partimento/fugue/${anchor}`;
    case 'hip':
      return `/theory/hip/${anchor}`;
  }
}

/** Every pack topic in the tabs, for the links from the articles ("Technique on other tabs"). */
export const seeAlsoLabel = (s: { tab: TabId; topic: string; label: string }) => s.label || backgroundTopic(s.tab, s.topic)?.title || s.topic;

// ---------- the era map ----------

export interface MapBar {
  id: string;
  label: string;
  x1: number;
  x2: number;
  lane: number;
  thread: number;
}
export interface MapRow {
  thread: Thread;
  y: number;
  lanes: number;
  bars: MapBar[];
}

export const MAP = { W: 1000, ROW: 22 };

/** The layout of the era map: every era gets the same width; a bar starts where its span starts. */
export function layoutEraMap(): { rows: MapRow[]; height: number } {
  const { W, ROW } = MAP;
  const eras = H.eras;
  const ew = W / eras.length;
  const xOf = (y: number) => {
    let i = eras.findIndex((e) => y >= e.from && y < e.to);
    if (i < 0) i = y < eras[0].from ? 0 : eras.length - 1;
    const e = eras[i];
    const yy = Math.min(Math.max(y, e.from), e.to);
    return (i + (yy - e.from) / (e.to - e.from)) * ew;
  };
  let units = 0;
  const rows: MapRow[] = H.threads.map((thread, ti) => {
    const lanes: number[] = [];
    const bars: MapBar[] = H.articles
      .filter((a) => a.thread === thread.id)
      .map((a) => {
        const lw = a.short.length * 6.4 + 10;
        const start = xOf(a.span.from);
        let lane = lanes.findIndex((end) => end <= start - 4);
        if (lane < 0) {
          lane = lanes.length;
          lanes.push(0);
        }
        let x1 = start;
        let x2 = Math.max(start + lw, xOf(Math.min(a.span.to, 1999)));
        lanes[lane] = x2;
        if (x2 > W) {
          x1 -= x2 - W;
          x2 = W;
        }
        return { id: a.id, label: a.short, x1, x2, lane, thread: ti };
      });
    const row = { thread, y: 30 + units * ROW, lanes: Math.max(1, lanes.length), bars };
    units += row.lanes + 0.6;
    return row;
  });
  return { rows, height: 30 + units * ROW };
}

export const eraLabel = (e: Era) => e.title.replace('Middle Ages', 'MA').replace('Nineteenth century', '19th c.').replace('Twentieth century', '20th c.');

/** A year for display: negative = BCE. */
export const yearLabel = (y: number) => (y < 0 ? `${-y} BCE` : String(y));
export const spanLabel = (s: { from: number; to: number }) => `${yearLabel(s.from)} – ${yearLabel(s.to)}`;
