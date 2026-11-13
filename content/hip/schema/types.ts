// Types for data/hip.json — Historically Informed Performance tab (flute + keyboard).

export type Instrument = 'flute' | 'keyboard' | 'both';
export interface Item { text: string; refs: string[] }   // text may contain <b>, <i>; refs like "Q XI §12, p. 123", "CPE III §23, p. 157", "LM IX (cross-ref)"

export interface HipFile {
  version: 1; tab: 'hip'; title: string; scope: string;
  sources: Source[];
  groups: { id: string; title: string; blurb: string }[];
  topics: Topic[];
  examples: Record<string, Example>;
  tools: ToolSpec[];
}
export interface Source {
  id: 'Q' | 'CPE' | 'BS' | 'BO' | 'LM'; short: string; title: string; edition: string;
  role: 'primary' | 'secondary' | 'cross-reference';   // LM is cross-reference only: style it differently
  instruments: string[]; note: string;
}
export interface Topic {
  id: string; group: string; title: string;
  instruments: Instrument[];            // filter chips: Flute / Keyboard / Both
  summary: string;
  rules: Item[];                        // red "Rule" badge: a source states it as a requirement
  guidelines: Item[];                   // amber "Guideline" badge: advice, taste, or a modern author's view
  steps?: string[];                     // numbered procedure / checklist
  terms?: { term: string; def: string }[];
  tables?: { id: string; title: string; columns: string[]; rows: string[][]; note?: string }[];
  crossRefs?: { source: 'LM'; point: string; analogue: string; ref: string }[];   // bowing ↔ breath ↔ touch cards
  examples?: string[];                  // keys into examples
  tools?: string[];                     // ids into tools
  sources: string[];
  verification: { status: 'verified' | 'partly' | 'flagged'; checks: string[]; flags?: string[] };
}

/* Mini-notation, one string per voice, tokens separated by spaces ("|" = barline, display only):
 *   [g]PITCH:DUR[@VEL][.|_]
 *   PITCH  scientific pitch (C4 = middle C, sharps "#", flats "b") or "r" for a rest
 *   DUR    in crotchets (quarter notes); ignored for "g" (grace/small note) in the written layer
 *   @VEL   0..1 loudness (see BUILD_BRIEF §4 for how to play it on a harpsichord)
 *   "."    detached (sound ~50%);  "_" slurred into the next note (sound 100%); otherwise sound ~90%
 * A performed value of "same" means: play the written layer; the example's annotations are the point. */
export interface Example {
  id: string; title: string; key: string; meter: string; caption: string;
  written: Record<string, string | Record<string, string> | ChordStep[]> & { marks?: Record<string, string>; chords?: ChordStep[] };
  // marks: note index (in the upper voice) → ornament sign to draw ("tr", "short tr")
  performed: Record<string, string>;   // voice keys as in written; or realisation names ("Quantz", "C. P. E. Bach") for the upper voice; "rule" = text
  refs: string[];
  note?: string;                        // pack author's assumption (show in small print)
  syllables?: string[];                 // flute tonguing, one per sounding upper-voice note
  bows?: string[];                      // L. Mozart bowing (⊓ down, ∨ up), one per sounding upper-voice note — cross-ref layer
  breaths?: { after: number; why: string; kind: 'main' | 'emergency' }[];  // index of the upper-voice note after which to breathe
}
export interface ChordStep { bass: string; fig: string; notes: string[]; class: 'consonant' | 'mf' | 'f' | 'ff' }
export interface ToolSpec { id: string; title: string; priority: number; instruments: Instrument[]; spec: string; reference: string }
