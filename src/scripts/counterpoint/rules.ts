// Names of the rules the Fux engine checks, and the helpers that turn its issues into marks and sentences.

export const RULE_NAMES: Record<string, string> = {
  par5: 'Parallel Fifths',
  par8: 'Parallel Octaves or Unisons',
  direct: 'Hidden Fifth or Octave (Direct Motion)',
  dd: 'Fifths or Octaves on Successive Downbeats',
  sync8: 'Octaves Between Syncopations',
  'acc-diss': 'Dissonance on the Downbeat',
  diss: 'Untreated Dissonance',
  susp: 'Badly Treated Suspension',
  'susp-perf': 'Retardation Hides Octaves',
  susp78: '7 to 8 in the Lower Voice',
  mel: 'Unsingable Melodic Interval',
  rep: 'Repeated Note',
  leaps: 'Successive Skips',
  comp: 'Uncompensated Skip',
  tritone: 'Outlined Tritone',
  range: 'Range Too Wide',
  begin: 'Beginning Not Perfect',
  'begin-mode': 'Beginning Outside the Mode',
  end: 'Ending Not Perfect',
  cad: 'Cadence Formula',
  unison: 'Unison in the Middle',
  balance: 'Too Many Perfect Consonances',
  'par-imp': 'Too Many Parallel Thirds or Sixths',
  skip8: 'Skips Into an Octave',
  battuta: 'Ottava Battuta',
  'leave-uni': 'Unison Left by a Skip',
  eighth: 'Eighth-Note Placement',
  lag: 'Lagging Quarters',
  triad: 'Incomplete Triad',
  'bass-mode': 'Bass Not on the Final',
  final3: 'Third in the Final Chord',
  'unison-m': 'Unison (Several Voices)',
};

export interface Issue {
  level: 'error' | 'warn' | 'info';
  rule: string;
  v: number;
  t: number;
  msg?: string;
}

export interface Voice {
  role?: 'cf' | 'cpt';
  species?: number;
  notes: { p?: string | null; d: number; rest?: 1 | boolean; tie?: 1 | boolean }[];
}

/** Rule or guideline: an error of the engine is a rule of Fux, a warning is a guideline. */
export const kindOf = (level: Issue['level']) => (level === 'error' ? 'Rule' : level === 'warn' ? 'Guideline' : 'Note');

/** Marks for the score: the notes at which the issues fall (t in whole notes becomes beats). */
export function marksOf(issues: Issue[]) {
  return issues.map((i) => ({ voice: i.v, t: i.t * 4, level: i.level }));
}

/** The one-line verdict above the list of issues. */
export function verdict(issues: Issue[]): { text: string; tone: 'good' | 'meh' | 'bad' } {
  const e = issues.filter((i) => i.level === 'error').length;
  const w = issues.filter((i) => i.level === 'warn').length;
  const text = `${e ? `${e} rule${e > 1 ? 's' : ''} broken` : 'No rule broken'}${w ? `, ${w} guideline note${w > 1 ? 's' : ''}` : e ? '' : ', nothing to note'}`;
  return { text, tone: e ? 'bad' : w ? 'meh' : 'good' };
}
