// The "What's new" list on the home page, newest first. Add a line at the top when something is added.
export interface News {
  date: string; // YYYY-MM-DD
  title: string;
  text: string;
  href: string;
}

export const WHATS_NEW: News[] = [
  { date: '2026-11-24', title: 'Japanese Music guides', text: 'Eleven chapters on traditional Japanese music, from gagaku and biwa to koto, kabuki and modern Japan, with resources and licenses.', href: '/analysis/japanese-music/' },
  { date: '2026-11-24', title: 'Bach fugue analysis', text: 'Each of the 48 fugues of the Well-Tempered Clavier on its own page, and Roberts’s method with four organ fugues.', href: '/analysis/baroque/bach/fugue-analysis/' },
  { date: '2026-11-24', title: 'Quantz and Blavet', text: 'The 100 daily exercises, a guide to articulation and breath, the Flute Concerto QV 5:174, and Blavet’s sonata “La Vibray”.', href: '/analysis/baroque/quantz/' },
  { date: '2026-11-24', title: 'Touhou Th11 analyses', text: 'Structure, themes and fugue subjects of Satori’s and Hartmann’s themes, and the references and licenses for the Touhou pages.', href: '/analysis/touhou/th11/' },
  { date: '2026-11-12', title: 'Voice colouring in every score', text: 'Colour each voice, see where voices cross, and hear one voice alone from the legend.', href: '/theory/counterpoint/' },
  { date: '2026-11-12', title: 'Interactive tools for every subject', text: 'Counterpoint workbenches, history tools, fugue tools, partimento tools and 27 tonal harmony tools.', href: '/theory/' },
  { date: '2026-11-12', title: 'Music History', text: 'An era map, 32 articles, a timeline, people, a glossary and a quiz.', href: '/theory/music-history/' },
];
