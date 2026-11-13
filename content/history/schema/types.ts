// Types for data/history.json: the History tab. Version 2 (entity model, built to grow).
// First source: Christensen (ed.), The Cambridge History of Western Music Theory (CUP 2002). All prose is paraphrase.

export interface HistoryFile {
  version: 2; tab: 'history'; scope: string;
  sources: Source[];            // every book/article/site the page draws on
  eras: Era[];                  // chronological bands (equal width on the era map)
  threads: Thread[];            // thematic strands that group the articles
  tabs: Record<TabId, string>;  // the site's other tabs, for "technique on other tabs" links
  articles: Article[];          // the page's main unit; ordered by thread, then span.from
  people: Person[];
  works: Work[];                // treatises, compositions, editions … (timeline = works + events)
  events: HEvent[];             // non-work happenings (foundations of institutions, premieres, deaths …); empty for now
  terms: Term[];
  quiz: QuizItem[];
  tools: ToolSpec[];            // tools that belong to the History tab itself
}
export type TabId = 'fux' | 'tonal' | 'partimento' | 'fugue' | 'hip';
export interface Source { id: string; short: string; title: string; editor?: string; author?: string; publisher?: string; year: number; note?: string }
export interface Era { id: string; title: string; from: number; to: number }   // years; negative = BCE; `to` exclusive
export interface Thread { id: string; title: string; blurb: string }
export interface Article {
  id: string;                   // stable, kebab-case; used as #anchor and in links from other tabs
  title: string; short: string; // short = label for the era map and the table of contents
  thread: string;               // Thread.id
  span: { from: number; to: number };  // years covered; drives era placement
  eras: string[];               // Era ids (derived from span; keep in sync; validate.py checks)
  summary: string; points: string[];   // may contain <i>, <b>
  rules: { text: string; who: string }[];        // only where no other tab owns the technique
  guidelines: { text: string; who: string }[];
  people: string[]; works: string[]; terms: string[];     // ids
  tools: string[];              // ToolSpec ids
  seeAlso: { tab: TabId; topic: string; label: string }[]; // where the technique is taught (topic = id in that tab's history-background.json)
  sourceRefs: { source: string; chapter?: number; author?: string; pages?: string; part?: string; section?: string | null }[];
  status: 'survey' | 'full' | 'stub';  // survey = summarized from a survey reading; full = read in full; stub = placeholder
}
export interface Person { id: string; name: string; dates: string; ideas: string[]; articles: string[] }
export interface Work { id: string; title: string; year: string; sort: number; author: string | null; articles: string[] } // year = display ("c. 1250"); sort = integer
export interface HEvent { id: string; year: string; sort: number; title: string; articles: string[]; people?: string[] }
export interface Term { id: string; term: string; def: string; articles: string[]; taughtIn: { tab: TabId; topic: string }[] }
export interface QuizItem { id: string; article: string; q: string; options: string[]; answer: number; why: string }
export interface ToolSpec { id: string; title: string; chapters: string[]; spec: string; tests: string[]; reference: string }
