// APA-style title case for headings, labels, buttons and names (never for explanatory sentences).
//  - The first word, and the first word after a colon, a dash or an opening bracket, is capitalized.
//  - Articles, short conjunctions and short prepositions stay lower case (a, an, the, and, or, of, in, by, to ...).
//  - Every other word is capitalized, including the parts of hyphenated words ("Pre-Galant").
//  - Words with digits or symbols (6/4+/2, sus4, 3rd, §2.5), acronyms (HCP, II) and words with internal capitals are
//    left as they are.

const MINOR = new Set([
  'a', 'an', 'the',
  'and', 'but', 'for', 'nor', 'or', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'via',
  // Italian and French particles in titles such as "Moti del Basso"
  'del', 'della', 'dell', 'di', 'da', 'de', 'la', 'le', 'il',
]);

function cap(word: string, force: boolean): string {
  if (!word) return word;
  if (/[0-9§♯♭♮°ø+'’=]/.test(word)) return word; // figures, symbols, apostrophes: leave alone
  if (/^[A-Z]{2,}$/.test(word)) return word; // acronym or Roman numeral
  if (/[A-Z]/.test(word.slice(1))) return word; // internal capital
  if (!force && MINOR.has(word.toLowerCase())) return word.toLowerCase();
  return word[0].toUpperCase() + word.slice(1);
}

export function titleCase(text: string): string {
  let force = true; // the next word starts a title or a part after a colon
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token;
      const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(token)!;
      const [, lead, core, trail] = m;
      const startsPart = force || /[([—–]/.test(lead);
      const words = core.split('-').map((w, i) => cap(w, i === 0 ? startsPart : false));
      const out = lead + words.join('-') + trail;
      force = /[:—]$/.test(trail);
      return out;
    })
    .join('');
}
