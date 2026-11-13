// Partimento content (src: content/partimento/, built from the owner's notes and cross-checked sources).
import schemataJson from '../../../content/partimento/data/schemata.json';
import cadencesJson from '../../../content/partimento/data/cadences.json';
import type { ContentFile, Group, Pattern } from '../../../content/partimento/schema/types';

export type { Example, Group, Pattern, Variant } from '../../../content/partimento/schema/types';

export const SCHEMATA = schemataJson as unknown as ContentFile;
export const CADENCES = cadencesJson as unknown as ContentFile;

export const BASE = '/theory/partimento';

export { SECTIONS, SECTION_TOOLS, sectionBySlug, sectionOfGroup } from './sections';
export type { Section } from './sections';
import { SECTIONS, sectionBySlug, sectionOfGroup } from './sections';
import type { Section } from './sections';

const ALL_GROUPS: Group[] = [...SCHEMATA.groups, ...CADENCES.groups];
const ALL_PATTERNS: Pattern[] = [...SCHEMATA.patterns, ...CADENCES.patterns];

export const groupsOf = (section: Section): Group[] => ALL_GROUPS.filter((g) => section.groupIds(g.id));
export const patternsOf = (section: Section): Pattern[] => ALL_PATTERNS.filter((p) => section.groupIds(p.group));

/** Kept for the pages and tests that ask for the two older sections by name. */
export const isMoti = (g: Group | string) => (typeof g === 'string' ? g : g.id).startsWith('moti-');
export const MOTI_GROUPS = groupsOf(sectionBySlug('moti-del-basso'));
export const SCHEMATA_GROUPS = groupsOf(sectionBySlug('schemata'));
export const motiPatterns = patternsOf(sectionBySlug('moti-del-basso'));
export const schemataPatterns = patternsOf(sectionBySlug('schemata'));

export const patternsIn = (groupId: string): Pattern[] => ALL_PATTERNS.filter((p) => p.group === groupId);

const ALL = new Map<string, Pattern>(ALL_PATTERNS.map((p) => [p.id, p]));
export const getPattern = (id: string) => ALL.get(id);

/** Page for a pattern id. */
export function urlFor(id: string): string {
  const p = ALL.get(id);
  if (!p) return BASE + '/';
  return `${BASE}/${sectionOfGroup(p.group).slug}/${id}/`;
}

/**
 * Is a schema galant? Judged against Gjerdingen, Music in the Galant Style (2007), whose catalogue of galant
 * schemata includes the Romanesca, Prinner, Do-Re-Mi, Sol-Fa-Mi, Meyer, Aprile, Pastorella, Jupiter, Fonte, Monte,
 * Ponte, Indugio, Fenaroli and Quiescenza (also listed on Wikipedia, "Galant schemata"). This is a site-side
 * label; the content pack itself is unchanged.
 * - galant:   in that catalogue
 * - variant:  a variant or combination built from galant schemata, with no entry of its own there
 * - pregalant: a bass formula older than the galant style
 */
export type GalantStatus = 'galant' | 'variant' | 'pregalant';

const GALANT: Record<string, GalantStatus> = {
  'romanesca-leaping': 'galant',
  'romanesca-stepwise': 'galant',
  prinner: 'galant',
  'do-re-mi': 'galant',
  'sol-fa-mi': 'galant',
  meyer: 'galant',
  aprile: 'galant',
  pastorella: 'galant',
  jupiter: 'galant',
  fonte: 'galant',
  monte: 'galant',
  ponte: 'galant',
  indugio: 'galant',
  fenaroli: 'galant',
  quiescenza: 'galant',
  'stabat-mater-prinner': 'variant',
  'paired-do-re-mi': 'variant',
  'monte-romanesca': 'variant',
  'romanesca-prinner': 'variant',
  folia: 'pregalant',
};

export const galantOf = (id: string): GalantStatus | undefined => GALANT[id];

export const GALANT_LABEL: Record<GalantStatus, string> = { galant: 'Galant', variant: 'Galant Variant', pregalant: 'Pre-Galant' };

export const GALANT_NOTE: Record<GalantStatus, string> = {
  galant: "A galant schema: it is in the catalogue of Robert Gjerdingen's Music in the Galant Style (2007).",
  variant:
    "A variant or combination built from galant schemata. Gjerdingen's catalogue does not list it as an entry of its own.",
  pregalant: "An older bass formula (from the late 15th century), not one of the galant schemata of Gjerdingen's catalogue.",
};

export const DIRECTION_LABEL: Record<string, string> = {
  ASC: 'Rising',
  DSC: 'Falling',
  'ASC/DSC': 'Rising and Falling',
  static: 'Static',
  mixed: 'Mixed',
  circular: 'Circular',
};

/** Split a degree string like "①–⑤ | ⑥–③" into circled-numeral chips and plain text. */
export function degreeTokens(text: string): { text: string; degree: boolean }[] {
  return (text.match(/[①-⑦]|[^①-⑦]+/g) ?? []).map((t) => ({ text: t, degree: /^[①-⑦]$/.test(t) }));
}
