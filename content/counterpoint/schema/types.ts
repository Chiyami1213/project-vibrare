// Types for data/fux.json (Fux, Gradus ad Parnassum, trans. Mann — counterpoint pages).

export interface FuxFile {
  version: 1;
  source: string;
  intro: { title: string; paragraphs: Rich[] };
  parts: { id: string; title: string; subtitle: string }[];      // part1 (two voices), part2 (three), part3 (four)
  chapters: Chapter[];                                             // in book order; part = 'front' for front/back matter
  examples: Record<string, Example>;                               // keyed by id used in Chapter.blocks
  workbenches: Record<string, WorkbenchSpec>;
  modes: Record<string, { cf: string[]; [k: string]: unknown }>;   // the six cantus firmi (D E F G A C) from the engine
}

export interface Rich { html: string; text: string; refs?: string[] }   // html uses only <b>/<i>; refs = Mann page/figure refs

export interface Chapter {
  id: string;            // intro, foreword, prelim, p1c1…p1c5, p2c1…p2c5, p3c1…p3c5, appendix, cheat
  part: string;
  title: string;
  eyebrow: string;       // "First Part · Chapter One · pp. 27–40"
  pages?: string;
  lede?: Rich;
  prose?: Rich[];
  ruleBoxes?: { kind: 'rules' | 'guidelines'; title: string; items: Rich[]; note?: Rich }[];
  quotes?: string[];
  bookFigures?: ({ fig: string } & Rich)[];   // what each of Fux's figures shows
  assignment?: Rich;                           // "Fux's assignment" box
  table?: { columns: string[]; rows: string[][] };   // species-at-a-glance (cheat)
  notes?: Rich[];
  blocks?: { type: 'example' | 'workbench' | 'tool'; id: string }[];   // render in this order after the text
}

export interface Note { p?: string; d: number; rest?: 1; tie?: 1 }   // d in whole notes (1 = one bar of the cantus)
export interface Voice { role: 'cf' | 'cpt'; species: number; notes: Note[] }   // voices[0] = top

export interface Example {
  fig: string;            // "Fig. 5", "After Fig. 6", "Model"
  title: string;
  voices: Voice[];
  caption: string;        // may contain <i>
  figures?: 'bass';       // show figured-bass numbers under the bass
  check?: false;          // don't run the checker (demonstration)
  autoCheck?: true;       // show checker results immediately
  only?: string[];        // show only these checker rules
  toggle?: { label: string; alt: Voice[]; autoCheck?: true; engineResult?: EngineIssue[] };
  engineResult?: EngineIssue[];   // what engine/fux-engine.js returns — use as the port's test suite
}
export interface EngineIssue { level: 'error' | 'warn' | 'info'; rule: string; v: number; t: number }

export interface WorkbenchSpec { nv: 2 | 3 | 4; species: 1 | 2 | 3 | 4 | 5; cfPos: number; florid?: number; title: string; demo?: true }

/* ---------- data/history-background.json (added from the History page source) ---------- */
// Technical content from The Cambridge History of Western Music Theory (ed. Christensen, 2002) that overlaps this tab.
// The History tab keeps the narrative; this tab now owns the rules, tools and technical quiz items.
export interface HistoryBackgroundFile {
  version: 1; pack: string;
  from: { source: 'cht'; title: string; editor: string; year: number };
  historyTab: 'history';                         // route of the History tab, for "Read the history →" links
  topics: BackgroundTopic[];
  tools: BackgroundTool[];
}
export interface BackgroundTopic {
  id: string; title: string;
  attachTo: { ref: string; note: string };      // an id in THIS pack (chapter / group / topic / tab) where the topic is shown
  historyArticles: string[];                     // History-tab article ids: link "Read the history →"
  points: string[];                              // may contain <i>, <b>
  rules: { text: string; who: string }[];        // Rule badge (precept stated by the named historical writer)
  guidelines: { text: string; who: string }[];   // Guideline badge
  terms: { term: string; def: string }[];
  tools: string[];                               // ids in tools[]
  quiz: { id: string; q: string; options: string[]; answer: number; why: string }[];
  sourceRefs: { source: 'cht'; chapter: number; pages: string; author: string; historyArticle: string }[];
}
export interface BackgroundTool {
  id: string; title: string; spec: string; tests: string[];
  extends: string | null;                        // id of an existing tool in this pack to extend instead of adding a new one
  reference: string;                             // working implementation: tools/history-tools.js → function()
}
