// Helpers shared by the content pages (tonal harmony, counterpoint, fugue, HIP). Pure functions, no DOM.
//
// The packs write rules and guidelines in three shapes: a plain string, an object with `text` and `refs` (HIP), or a
// "Rich" object with `html`, `text` and `refs` (counterpoint, fugue). `toItem` turns any of them into one shape.

export interface RichLike {
  html?: string;
  text?: string;
  refs?: string[];
}

export type ItemInput = string | RichLike;

export interface Item {
  html: string; // safe HTML: only <b> and <i> survive
  refs: string[]; // page or figure references, shown as small tags
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escape everything, then give back the two tags the content is allowed to use. */
export function safeHtml(s: string): string {
  return escapeHtml(s).replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>');
}

export function toItem(x: ItemInput): Item {
  if (typeof x === 'string') return { html: safeHtml(x), refs: [] };
  return { html: safeHtml(x.html ?? x.text ?? ''), refs: x.refs ?? [] };
}

export const toItems = (xs: ItemInput[] | undefined): Item[] => (xs ?? []).map(toItem);

/** The first letter of a reference tells the source it points to (HIP: Q, CPE, BS, BO, LM). */
export function refSource(ref: string): string {
  const m = /^(Q|CPE|BS|BO|LM)\b/.exec(ref);
  return m ? m[1] : '';
}

/** "p1c2" -> "first-part": slug of a part for the page addresses. */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
