// Piano keyboard drawn as SVG, with chord notes highlighted and labelled.
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const W = 26; // white key width
const H = 120; // white key height
const BW = 16; // black key width
const BH = 74; // black key height

const NS = 'http://www.w3.org/2000/svg';
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export interface KeyNote {
  midi: number;
  name: string; // spelled name to print on the key
}

/** Draw the smallest run of whole octaves (at least two) that contains the notes. */
export function buildKeyboard(notes: KeyNote[]): SVGSVGElement {
  const lo = Math.floor(Math.min(...notes.map((n) => n.midi)) / 12) * 12;
  let hi = Math.floor(Math.max(...notes.map((n) => n.midi)) / 12) * 12 + 11;
  if (hi - lo < 23) hi = lo + 23;
  const byMidi = new Map(notes.map((n) => [n.midi, n.name]));

  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (WHITE_PCS.includes(m % 12)) whites.push(m);
  const width = whites.length * W;

  const svg = el('svg', { viewBox: `0 0 ${width} ${H + 2}`, class: 'keyboard', role: 'img' }) as SVGSVGElement;
  svg.setAttribute('aria-label', `Piano keyboard with ${notes.map((n) => n.name).join(', ')} highlighted`);

  const label = (x: number, y: number, text: string, cls: string) => {
    const t = el('text', { x, y, class: cls });
    t.textContent = text;
    return t;
  };

  whites.forEach((m, i) => {
    const on = byMidi.has(m);
    svg.append(el('rect', { x: i * W, y: 1, width: W, height: H, rx: 3, class: `key white${on ? ' on' : ''}` }));
    if (on) svg.append(label(i * W + W / 2, H - 10, byMidi.get(m)!, 'key-label'));
  });

  // black keys sit on the boundary after a white key
  whites.forEach((m, i) => {
    const next = m + 1;
    if (next > hi || WHITE_PCS.includes(next % 12)) return;
    const on = byMidi.has(next);
    const x = (i + 1) * W - BW / 2;
    svg.append(el('rect', { x, y: 1, width: BW, height: BH, rx: 2, class: `key black${on ? ' on' : ''}` }));
    if (on) svg.append(label(x + BW / 2, BH - 9, byMidi.get(next)!, 'key-label black-label'));
  });
  return svg;
}
