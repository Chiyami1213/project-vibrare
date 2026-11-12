// Edit this file to change the Resources page. One entry per item.
// `href` is optional; external links open in a new tab.

export interface ResourceItem {
  title: string;
  by?: string;
  note?: string;
  href?: string;
}

export interface ResourceSection {
  id: string;
  title: string;
  items: ResourceItem[];
}

export const RESOURCES: ResourceSection[] = [
  {
    id: 'literature',
    title: 'Literature',
    items: [
      {
        title: 'Gradus ad Parnassum (1725)',
        by: 'Johann Joseph Fux',
        note: 'The classic treatise on species counterpoint.',
      },
      {
        title: 'Music in the Galant Style (Oxford University Press, 2007)',
        by: 'Robert O. Gjerdingen',
        note: 'Stock melodic and bass patterns (schemata) in eighteenth-century music.',
      },
      {
        title: 'The Art of Partimento: History, Theory, and Practice (Oxford University Press, 2012)',
        by: 'Giorgio Sanguinetti',
        note: 'A history and practical guide to partimento.',
      },
      {
        title: 'Tonal Harmony',
        by: 'Stefan Kostka and Dorothy Payne',
        note: 'A standard university textbook on tonal harmony (several editions).',
      },
    ],
  },
  {
    id: 'web',
    title: 'Web Sources',
    items: [
      {
        title: 'musictheory.net',
        note: 'Lessons, exercises, ear trainers and calculators.',
        href: 'https://www.musictheory.net/',
      },
      {
        title: 'IMSLP',
        note: 'A large free library of public-domain sheet music.',
        href: 'https://imslp.org/',
      },
      {
        title: 'Partimenti.org',
        note: 'Lessons and exercises from the historical conservatories.',
        href: 'https://partimenti.org/',
      },
    ],
  },
  {
    id: 'youtube',
    title: 'YouTube',
    items: [],
  },
  {
    id: 'software',
    title: 'Software',
    items: [
      {
        title: 'MuseScore',
        note: 'Free music notation software for Windows, Mac and Linux.',
        href: 'https://musescore.org/',
      },
    ],
  },
];
