// Edit this file to list your arrangements on the Works pages.
// Each work belongs to one category (use the `id` of a category below).
// Example entry:
//   { category: 'anime', title: 'Title of the arrangement', original: 'Original piece and source', year: 2026,
//     description: 'A short description.', links: [{ label: 'Listen', href: 'https://...' }] }

export interface Work {
  category: string;
  title: string;
  original?: string;
  year?: number;
  description?: string;
  links?: { label: string; href: string }[];
}

export interface WorkCategory {
  id: string;
  label: string;
  icon: string; // a key of ICONS in components/MenuItem.astro
}

// Alphabetical, with Miscellaneous always last.
export const CATEGORIES: WorkCategory[] = [
  { id: 'anime', label: 'Anime', icon: 'star' },
  { id: 'commissions', label: 'Commissions', icon: 'briefcase' },
  { id: 'concert-band', label: 'Concert Band', icon: 'group' },
  { id: 'flute', label: 'Flute', icon: 'wind' },
  { id: 'ghibli', label: 'Ghibli', icon: 'cloud' },
  { id: 'touhou-project', label: 'Touhou Project', icon: 'moon' },
  { id: 'vocaloid', label: 'Vocaloid', icon: 'mic' },
  { id: 'vtubers', label: 'VTubers', icon: 'monitor' },
  { id: 'miscellaneous', label: 'Miscellaneous', icon: 'dots' },
];

export const WORKS: Work[] = [];
