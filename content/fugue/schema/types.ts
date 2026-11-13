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
