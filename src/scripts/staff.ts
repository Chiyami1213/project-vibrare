// Draws notes on a music staff (VexFlow, Bravura font embedded: no network needed).
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura';
import { fontsReady } from './fonts';
import { LETTERS } from './theory';
import type { Note } from './theory';

export type Clef = 'treble' | 'bass';
export type StaffMode = 'melodic' | 'harmonic';

const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const pitch = (n: Note) => n.octave * 12 + NATURAL[n.letter] + n.alter;

/** VexFlow key such as "f#/4" or "bb/3". */
function keyOf(n: Note): string {
  const alter = Math.max(-2, Math.min(2, n.alter)); // VexFlow draws up to a double sharp / flat
  const acc = alter > 0 ? '#'.repeat(alter) : alter < 0 ? 'b'.repeat(-alter) : '';
  return `${LETTERS[n.letter].toLowerCase()}${acc}/${n.octave}`;
}

function accidentalOf(n: Note): string | null {
  const alter = Math.max(-2, Math.min(2, n.alter));
  return alter === 0 ? null : alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
}

function makeNote(notes: Note[], duration: string, clef: Clef): StaveNote {
  const sorted = [...notes].sort((a, b) => pitch(a) - pitch(b)); // VexFlow wants keys low to high
  const sn = new StaveNote({ keys: sorted.map(keyOf), duration, clef });
  sorted.forEach((n, i) => {
    const acc = accidentalOf(n);
    if (acc) sn.addModifier(new Accidental(acc), i);
  });
  // stems, ledger lines and flags default to black; make them follow the page colour too
  const style = { fillStyle: 'currentColor', strokeStyle: 'currentColor' };
  sn.setStyle(style);
  sn.setStemStyle(style);
  sn.setLedgerLineStyle(style);
  sn.setFlagStyle(style);
  return sn;
}

/**
 * Show `notes` on one stave. "melodic" writes them one after another (a scale, or the two notes of an
 * interval); "harmonic" stacks them into a single chord-like note.
 */
let latest = 0;

export async function renderStaff(container: HTMLElement, notes: Note[], opts: { clef: Clef; mode: StaffMode }): Promise<void> {
  const mine = ++latest;
  await fontsReady(); // the music font must be loaded before VexFlow measures any notehead
  if (mine !== latest) return; // a newer request arrived while we waited
  container.replaceChildren();
  if (notes.length === 0) return;
  const harmonic = opts.mode === 'harmonic' && notes.length > 1;

  const width = harmonic ? 200 : 110 + notes.length * 54;
  const height = 200;
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const ctx = renderer.getContext();
  // follow the page colours (the container sets `color`)
  ctx.setFillStyle('currentColor');
  ctx.setStrokeStyle('currentColor');

  const stave = new Stave(6, 48, width - 12);
  stave.addClef(opts.clef);
  stave.setContext(ctx).draw();

  const staveNotes = harmonic
    ? [makeNote(notes, 'w', opts.clef)]
    : notes.map((n) => makeNote([n], 'q', opts.clef));
  const voice = new Voice({ numBeats: harmonic ? 4 : notes.length, beatValue: 4 });
  voice.setMode(Voice.Mode.SOFT);
  voice.addTickables(staveNotes);

  const usable = width - 12 - (stave.getNoteStartX() - 6) - 24;
  new Formatter().joinVoices([voice]).format([voice], Math.max(60, usable));
  voice.draw(ctx, stave);

  const svg = container.querySelector('svg');
  if (svg) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Staff with ${notes.length} note${notes.length > 1 ? 's' : ''}`);
  }
}
