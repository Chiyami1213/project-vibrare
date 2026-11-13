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
