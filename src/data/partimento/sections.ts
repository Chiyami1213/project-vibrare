// The pattern pages of Partimento and which groups of the content files each one shows (pure data, no JSON).

export interface Section {
  slug: string; // the page address: /theory/partimento/<slug>/
  title: string;
  lead: string;
  groupIds: (id: string) => boolean;
}

/** The six pattern pages of Partimento, in menu order. Each takes some groups of the two data files. */
export const SECTIONS: Section[] = [
  {
    slug: 'moti-del-basso',
    title: 'Moti del Basso',
    lead: 'The typical motions of the bass in partimento, from stepwise lines to sequences. Choose a pattern to see how it is harmonized, with scores you can play.',
    groupIds: (id) => id.startsWith('moti-'),
  },
  {
    slug: 'schemata',
    title: 'Schemata',
    lead: 'Stock musical patterns of the galant style and before: each pairs a bass with its upper voices. Choose one to see its rules and playable examples.',
    groupIds: (id) => id.startsWith('schemata-'),
  },
  {
    slug: 'cadences',
    title: 'Cadences',
    lead: 'The cadence types and the clausulae behind them, in two, three and four parts, with their names and playable examples.',
    groupIds: (id) => id.startsWith('cad-'),
  },
  {
    slug: 'rule-of-the-octave',
    title: 'Rule of the Octave',
    lead: 'The standard harmonization of each step of the scale in the bass, in the versions of Fenaroli and Durante, with the interval rules.',
    groupIds: (id) => id === 'rule-of-octave',
  },
  {
    slug: 'suspension',
    title: 'Suspension',
    lead: 'How a dissonance is prepared, held over and resolved, one card for each: the 4th, the 7th, the 9th and the bass 2nd.',
    groupIds: (id) => id === 'suspensions',
  },
  {
    slug: 'diminution',
    title: 'Diminution',
    lead: 'Breaking long notes into shorter ones: two-part examples with the upper voice in sixteenths over a slow bass, some by Durante himself.',
    groupIds: (id) => id === 'diminution',
  },
];

export const sectionOfGroup = (groupId: string): Section => SECTIONS.find((s) => s.groupIds(groupId)) ?? SECTIONS[1];
export const sectionBySlug = (slug: string): Section => SECTIONS.find((s) => s.slug === slug)!;

