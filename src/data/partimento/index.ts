// Partimento content (src: content/partimento/, built from the owner's notes and cross-checked sources).
import schemataJson from '../../../content/partimento/data/schemata.json';
import cadencesJson from '../../../content/partimento/data/cadences.json';
import type { ContentFile, Group, Pattern } from '../../../content/partimento/schema/types';

export type { Example, Group, Pattern, Variant } from '../../../content/partimento/schema/types';

export const SCHEMATA = schemataJson as unknown as ContentFile;
export const CADENCES = cadencesJson as unknown as ContentFile;

export const BASE = '/theory/partimento';

/** The five "moti del basso" groups belong to the Moti page; the rest to Schemata. */
export const isMoti = (g: Group | string) => (typeof g === 'string' ? g : g.id).startsWith('moti-');

export const MOTI_GROUPS = SCHEMATA.groups.filter(isMoti);
export const SCHEMATA_GROUPS = SCHEMATA.groups.filter((g) => !isMoti(g));

export const patternsIn = (groupId: string): Pattern[] => SCHEMATA.patterns.filter((p) => p.group === groupId);

const ALL = new Map<string, Pattern>([...SCHEMATA.patterns, ...CADENCES.patterns].map((p) => [p.id, p]));
export const getPattern = (id: string) => ALL.get(id);

/** Page for a pattern id (cadence patterns link into the Cadences page). */
export function urlFor(id: string): string {
  const p = ALL.get(id);
  if (!p) return BASE + '/';
  if (p.tab === 'cadences') return `${BASE}/cadences/#${id}`;
  return `${BASE}/${isMoti(p.group) ? 'moti-del-basso' : 'schemata'}/${id}/`;
}

export const motiPatterns = SCHEMATA.patterns.filter((p) => isMoti(p.group));
export const schemataPatterns = SCHEMATA.patterns.filter((p) => !isMoti(p.group));

export const DIRECTION_LABEL: Record<string, string> = {
  ASC: 'Rising',
  DSC: 'Falling',
  'ASC/DSC': 'Rising and falling',
  static: 'Static',
  mixed: 'Mixed',
  circular: 'Circular',
};

/** Split a degree string like "①–⑤ | ⑥–③" into circled-numeral chips and plain text. */
export function degreeTokens(text: string): { text: string; degree: boolean }[] {
  return (text.match(/[①-⑦]|[^①-⑦]+/g) ?? []).map((t) => ({ text: t, degree: /^[①-⑦]$/.test(t) }));
}
