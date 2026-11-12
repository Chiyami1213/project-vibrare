// Edit this file to list your arrangements on the Works page.
// Example entry:
//   { title: 'Title of the arrangement', original: 'Original track and game', year: 2026,
//     description: 'A short description.', links: [{ label: 'Listen', href: 'https://...' }] }

export interface Work {
  title: string;
  original?: string;
  year?: number;
  description?: string;
  links?: { label: string; href: string }[];
}

export const WORKS: Work[] = [];
