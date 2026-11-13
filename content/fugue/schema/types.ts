// Types for data/fugue-theory.json (Mann study guide) and data/fugue-analysis.json (analysis tab).

/* ---------- shared ---------- */
export interface Rich { html: string; text: string; refs?: string[] } // html uses only <b>, <i>; refs = Mann page numbers ("p. 80")

/* ---------- fugue-theory.json ---------- */
export interface TheoryFile {
  version: 1; tab: 'theory'; source: string;
  intro: { title: string; paragraphs: Rich[] };
  parts: { id: string; title: string; subtitle: string }[];
  chapters: Chapter[];
  examples: Record<string, TheoryExample>;
  tools: ToolSpec[];
}
export interface Chapter {
  id: string;               // deep link #id
  part: string;             // Part id or 'front'
  title: string; eyebrow: string; pages?: string;
  lede?: Rich;
  ruleBoxes?: { kind: 'rules' | 'guidelines'; title: string; items: Rich[] }[];   // red Rule / amber Guideline
  prose?: Rich[]; quotes?: string[];
  theorists?: { who: Rich; idea: Rich }[];   // history chapters: theorist + contribution
  assignment?: Rich;        // Fux's assignment
  table?: { columns: string[]; rows: string[][] }; // quick-reference chapter
  notes?: Rich[];
  blocks?: ({ type: 'example'; id: string } | { type: 'tool'; id: string; preset: string })[];
}
export interface TheoryExample {
  id: string; title: string; source: string; key: string; caption: string;
  voices: { notes: { p?: string; d: number; rest?: 1; natural?: boolean }[] }[]; // voices[0] = top; d in whole notes; p = scientific pitch
}
export interface ToolSpec { id: string; title: string; spec: string; reference: string }

/* ---------- fugue-analysis.json ---------- */
export interface AnalysisFile { version: 1; tab: 'analysis'; groups: { id: string; title: string; blurb: string }[]; topics: Topic[]; tools: { id: string; title: string; spec: string }[] }
export interface Topic {
  id: string; group: string; title: string;
  kind: 'concept' | 'table' | 'procedure' | 'case';
  summary: string;
  steps?: string[];          // procedures: numbered steps
  rules?: string[];          // Rule badge
  guidelines?: string[];     // Guideline badge
  terms?: { term: string; def: string }[];
  tables?: { id: string; title: string; columns: string[]; rows: string[][]; note?: string }[];
  cases?: { work: string; verdict: string; properties: string[]; structure: string; resolution: string }[];
  tools?: string[]; seeAlso?: string[];
  sources: string[];
  verification: { status: 'verified' | 'partly' | 'flagged'; checks: string[]; flags?: string[] };
}

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
