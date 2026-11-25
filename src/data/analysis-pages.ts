// The analysis pages that are kept as delivered, in public/analysis/…: each is one self-contained page with its own score,
// tables and playback. This file only lists them, so that the hub pages can link to them.
import wtc from './bach/wtc.json';

export interface StaticPage {
  href: string;
  title: string;
  note: string;
}

const FUGUE = '/analysis/baroque/bach/fugue-analysis';

export const WTC_FUGUES = (wtc as { book: number; no: number; bwv: number; fugueKey: string; voices: number }[]).map((p) => ({
  ...p,
  href: `${FUGUE}/wtc-${p.book}/bwv${p.bwv}-fugue-analysis.html`,
}));

export const WTC_INDEX = [
  { book: 1, href: `${FUGUE}/wtc-1/`, range: 'BWV 846–869', note: 'Checked by hand for BWV 846 and 847; an automatic first reading for the rest.' },
  { book: 2, href: `${FUGUE}/wtc-2/`, range: 'BWV 870–893', note: 'An automatic first reading of all 24 fugues.' },
];

export const ROBERTS: StaticPage[] = [
  { href: `${FUGUE}/roberts/`, title: 'Roberts’s Fugue Analysis Method', note: 'A study guide to Scott Roberts’s method (2004), with the worked examples below.' },
  { href: `${FUGUE}/wtc-1/bwv847-fugue-analysis.html`, title: 'Fugue in C Minor, BWV 847', note: 'The demonstration piece of the six steps; a rhetorical fugue.' },
  { href: `${FUGUE}/roberts/bwv533.html`, title: 'Fugue in E Minor, BWV 533', note: 'Organ fugue, literal (Roberts, chapter 5).' },
  { href: `${FUGUE}/roberts/bwv545.html`, title: 'Fugue in C Major, BWV 545', note: 'Organ fugue, rhetorical (Roberts, chapter 6).' },
  { href: `${FUGUE}/roberts/bwv547.html`, title: 'Fugue in C Major, BWV 547', note: 'Organ fugue, rhetorical (Roberts, chapter 7).' },
  { href: `${FUGUE}/roberts/bwv578.html`, title: 'Fugue in G Minor, BWV 578', note: 'The “Little” G minor organ fugue, worked through the six steps.' },
];

export const FIRST_LESSONS: StaticPage = {
  href: '/analysis/baroque/bach/first-lessons/',
  title: 'First Lessons in Bach (Carroll)',
  note: 'An interactive edition of the easy pieces from the Notebook for Anna Magdalena and related collections, with the marks explained.',
};

export const QUANTZ: StaticPage[] = [
  { href: '/analysis/baroque/quantz/exercises/', title: 'Quantz · 100 Daily Exercises', note: 'An interactive edition of the exercises in Das Flötenbuch Friedrichs des Großen, annotated by Quantz’s rules.' },
  { href: '/analysis/baroque/quantz/articulation-guide/', title: 'Quantz on Articulation, Phrasing, and Breath', note: 'What he tells a flute player about tonguing, slurs, strokes, dots and breathing, with a page reference for every rule.' },
  { href: '/analysis/baroque/quantz/concerto-qv5-174/qv5-174-i-analysis.html', title: 'Flute Concerto in G, QV 5:174 · I. Allegro Assai', note: 'Form, sections, cadences, partimento patterns and the flute part.' },
  { href: '/analysis/baroque/quantz/concerto-qv5-174/qv5-174-ii-analysis.html', title: 'Flute Concerto in G, QV 5:174 · II. Arioso e Mesto', note: 'The slow movement.' },
  { href: '/analysis/baroque/quantz/concerto-qv5-174/qv5-174-iii-analysis.html', title: 'Flute Concerto in G, QV 5:174 · III. Presto', note: 'The finale.' },
];

export const BLAVET: StaticPage[] = [
  { href: '/analysis/baroque/blavet/la-vibray/i-andante.html', title: 'Sonata II “La Vibray”, Op. 2 No. 2 · I. Andante', note: 'Form, sections, cadences, partimento patterns, performing the flute part.' },
  { href: '/analysis/baroque/blavet/la-vibray/ii-allemanda.html', title: 'II. Allemanda', note: '' },
  { href: '/analysis/baroque/blavet/la-vibray/iii-gavotta.html', title: 'III. Gavotta “Les Caquets”', note: '' },
  { href: '/analysis/baroque/blavet/la-vibray/iv-sarabanda.html', title: 'IV. Sarabanda', note: '' },
  { href: '/analysis/baroque/blavet/la-vibray/v-allegro.html', title: 'V. Allegro', note: '' },
];

const JP = '/analysis/japanese-music';
export const JAPANESE: StaticPage[] = [
  ['Foundations', 'Scales, rhythm, notation and the instruments of Japan.'],
  ['Gagaku and Shōmyō', 'Court music and Buddhist chant.'],
  ['Biwa Narrative', 'Storytelling with the biwa.'],
  ['Nō and Kyōgen', 'Noh theatre and its comic interludes.'],
  ['Shakuhachi', 'The bamboo flute.'],
  ['Koto', 'The zither, its tunings and its music.'],
  ['Shamisen and Gidayū', 'The three-string lute and the narrative singing of the puppet theatre.'],
  ['Kabuki', 'Music of the kabuki stage.'],
  ['Folk and Popular Song', 'Min’yō, enka and the folk scales.'],
  ['Ryukyu and Ainu', 'The music of Okinawa and of the Ainu.'],
  ['Modern Japan', 'Composers and styles from the Meiji era on.'],
].map(([name, note], i) => ({ href: `${JP}/chapter-${i + 1}.html`, title: `Chapter ${i + 1}: ${name}`, note }));

export const JAPANESE_RESOURCES: StaticPage = {
  href: `${JP}/resources-and-licenses.html`,
  title: 'Resources and Licenses',
  note: 'The books, sounds and software behind the guides, with how each is used and its license.',
};

/** Touhou tracks with analysis pages: game id, then track number (as the site's track list has it). */
const TH = '/analysis/touhou/analysis';
export const TOUHOU_ANALYSIS: Record<string, Record<number, { label: string; href: string }[]>> = {
  th11: {
    9: [
      { label: 'Structure, Themes, Patterns', href: `${TH}/th11-09-satori-analysis.html` },
      { label: 'Counterpoint and Fugue Subjects', href: `${TH}/th11-09-satori-phase4.html` },
    ],
    15: [
      { label: 'Structure, Themes, Patterns', href: `${TH}/th11-10-hartmann-analysis.html` },
      { label: 'Counterpoint and Fugue Subjects', href: `${TH}/th11-10-hartmann-phase4.html` },
    ],
  },
};
