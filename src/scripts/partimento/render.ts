// Draws an example as a grand staff with figured bass and circled bass degrees (VexFlow).
import { Accidental, BarlineType, Dot, Formatter, Renderer, Stave, StaveConnector, StaveNote, StaveTie, Stem, Voice } from 'vexflow/bravura';
import { barTicks, keySpec, layoutVoice, slicesOf, totalBarsOf } from './model';
import type { ExampleData, NoteSpec } from './model';

export interface SliceBox {
  tick: number;
  beat: number;
  x: number; // centre of the sonority
  top: number;
  bottom: number;
}

export interface Drawn {
  slices: SliceBox[];
  svg: SVGSVGElement;
  highlight(index: number | null): void;
}

const STAVE_GAP = 100; // from the top of the treble stave to the top of the bass stave
const SYSTEM_TOP = 10;
const FIG_ROW = 15;
const STAVE_H = 80;
const STYLE = { fillStyle: 'currentColor', strokeStyle: 'currentColor' };

type Clef = 'treble' | 'bass';

function keyOf(pitch: string): string {
  const m = /^([A-G])(#{0,3}|b{0,3})(-?\d)$/.exec(pitch)!;
  const acc = m[2].length > 2 ? m[2].slice(0, 2) : m[2]; // VexFlow draws up to a double sharp/flat
  return `${m[1].toLowerCase()}${acc}/${m[3]}`;
}

function makeNote(spec: NoteSpec, clef: Clef, stem: number | null): StaveNote {
  const rest = spec.pitch === null;
  const sn = new StaveNote({
    keys: [rest ? (clef === 'treble' ? 'b/4' : 'd/3') : keyOf(spec.pitch!)],
    duration: `${spec.dur}${spec.dotted ? 'd' : ''}${rest ? 'r' : ''}`,
    clef,
    autoStem: stem === null,
    stemDirection: stem ?? undefined,
  });
  if (spec.dotted) Dot.buildAndAttach([sn], { all: true });
  sn.setStyle(STYLE);
  sn.setStemStyle(STYLE);
  sn.setLedgerLineStyle(STYLE);
  sn.setFlagStyle(STYLE);
  return sn;
}

interface Row {
  clef: Clef;
  voices: NoteSpec[][][]; // per voice, the notes of every measure
}

interface Built {
  note: StaveNote;
  spec: NoteSpec;
  row: number;
  voice: number;
}

interface MeasurePlan {
  minWidth: number; // what VexFlow needs for the notes of this bar
  onsets: number;
}

/** Number of sharps (positive) or flats (negative) in a key signature spec. */
function keyAccidentals(spec: string): number {
  const SHARP = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const FLAT = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  const MIN_SHARP = ['Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m'];
  const MIN_FLAT = ['Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm'];
  for (const [list, sign] of [[SHARP, 1], [FLAT, -1], [MIN_SHARP, 1], [MIN_FLAT, -1]] as const) {
    const i = list.indexOf(spec);
    if (i >= 0) return sign * (i + 1);
  }
  return 0;
}

/** Draw `ex` into `container`. Returns where every sonority sits, for highlighting. */
export function drawExample(container: HTMLElement, ex: ExampleData, opts: { width: number; showUpper: boolean }): Drawn {
  container.replaceChildren();
  const bar = barTicks(ex.meter);
  const bars = totalBarsOf(ex);
  const all = ex.realized.voices;
  const upper = all.slice(0, -1);
  const bassVoice = all[all.length - 1];
  const lay = (v: ExampleData['realized']['voices'][number]) => layoutVoice(v, ex.beatUnit, bar, bars);

  const rows: Row[] = [];
  if (opts.showUpper) {
    rows.push({ clef: 'treble', voices: upper.slice(0, 2).map(lay) });
    rows.push({ clef: 'bass', voices: [...upper.slice(2).map(lay), lay(bassVoice)] });
  } else {
    rows.push({ clef: 'bass', voices: [lay(bassVoice)] });
  }
  const hasTreble = rows.length === 2;
  const slices = slicesOf(ex);
  const figRows = Math.max(1, ...slices.map((s) => s.figures.length));
  const spec = keySpec(ex.key);
  const accidentals = Math.abs(keyAccidentals(spec));

  // Build the notes of one bar. Notes must be built fresh for each use: formatting the same note objects
  // twice would apply VexFlow's collision shifts twice and leave stems detached from their heads.
  const buildMeasure = (m: number) => {
    const built: Built[] = [];
    const onsets = new Set<number>();
    const voices = rows.map((r, ri) => {
      const two = r.voices.length === 2;
      const vs = r.voices.map((vm, vi) => {
        const stem = two ? (vi === 0 ? Stem.UP : Stem.DOWN) : null;
        const notes = vm[m].map((n) => {
          const note = makeNote(n, r.clef, stem);
          built.push({ note, spec: n, row: ri, voice: vi });
          onsets.add(n.start);
          return note;
        });
        const total = vm[m].reduce((a, n) => a + n.ticks, 0);
        const v = new Voice({ numBeats: Math.max(1, total), beatValue: 64 });
        v.setMode(Voice.Mode.SOFT);
        v.addTickables(notes);
        return v;
      });
      Accidental.applyAccidentals(vs, spec);
      return vs;
    });
    return { voices, built, onsets: onsets.size };
  };

  // ---- pass 1: ask VexFlow how much room each bar needs (these notes are thrown away)
  const plans: MeasurePlan[] = [];
  for (let m = 0; m < bars; m++) {
    const probeBar = buildMeasure(m);
    const probe = new Formatter();
    probeBar.voices.forEach((vs) => probe.joinVoices(vs));
    plans.push({ minWidth: probe.preCalculateMinTotalWidth(probeBar.voices.flat()), onsets: probeBar.onsets });
  }

  // ---- widths and the split into systems
  const modifiers = (first: boolean, withTime: boolean) => (first ? 58 + accidentals * 11 + (withTime ? 28 : 0) : 0);
  const measureWidth = (m: number, first: boolean, withTime: boolean) =>
    Math.max(54 + plans[m].onsets * 34, plans[m].minWidth + 34) + modifiers(first, withTime);
  const usable = Math.max(300, opts.width - 24);
  const systems: number[][] = [];
  let line: number[] = [];
  let used = 0;
  for (let m = 0; m < bars; m++) {
    const first = line.length === 0;
    const w = measureWidth(m, first, systems.length === 0 && first);
    if (!first && used + w > usable) {
      systems.push(line);
      line = [];
      used = 0;
    }
    const isFirst = line.length === 0;
    used += measureWidth(m, isFirst, systems.length === 0 && isFirst);
    line.push(m);
  }
  if (line.length) systems.push(line);

  const sysHeight = SYSTEM_TOP + (hasTreble ? STAVE_GAP : 0) + STAVE_H + 38 + figRows * FIG_ROW + 34;
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(opts.width, systems.length * sysHeight + 12);
  const ctx = renderer.getContext();
  ctx.setFillStyle('currentColor');
  ctx.setStrokeStyle('currentColor');

  // ---- pass 2: draw
  const xOf = new Map<number, { x: number; sys: number }>(); // onset tick -> x and system
  const prev: ({ note: StaveNote } | null)[][] = rows.map((r) => r.voices.map(() => null));

  systems.forEach((measures, si) => {
    const top = si * sysHeight + SYSTEM_TOP;
    const natural = measures.map((m, i) => measureWidth(m, i === 0, si === 0 && i === 0));
    const scale = usable / natural.reduce((a, b) => a + b, 0);
    // fill the line; only the unfinished last line of a longer score keeps its natural spacing
    const lastOfMany = systems.length > 1 && si === systems.length - 1;
    const factor = scale < 1 ? scale : Math.min(scale, lastOfMany ? 1.5 : 4);
    const widths = natural.map((w) => w * factor);
    let x = 12;

    measures.forEach((m, mi) => {
      const first = mi === 0;
      const staves = rows.map((r, ri) => {
        const s = new Stave(x, top + (hasTreble && ri === 1 ? STAVE_GAP : 0), widths[mi]);
        if (first) {
          s.addClef(r.clef);
          s.addKeySignature(spec);
          if (si === 0) s.addTimeSignature(ex.meter);
        }
        if (m === bars - 1) s.setEndBarType(BarlineType.END);
        s.setStyle(STYLE);
        s.setContext(ctx).draw();
        return s;
      });
      if (hasTreble) {
        if (first) {
          new StaveConnector(staves[0], staves[1]).setType('brace').setContext(ctx).draw();
          new StaveConnector(staves[0], staves[1]).setType('singleLeft').setContext(ctx).draw();
        }
        new StaveConnector(staves[0], staves[1]).setType(m === bars - 1 ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();
      }

      const { voices, built } = buildMeasure(m); // fresh notes for drawing
      const startX = Math.max(...staves.map((s) => s.getNoteStartX()));
      const formatter = new Formatter();
      voices.forEach((vs) => formatter.joinVoices(vs));
      formatter.format(voices.flat(), Math.max(plans[m].minWidth, x + widths[mi] - startX - 16));
      voices.forEach((vs, ri) => vs.forEach((v) => v.draw(ctx, staves[ri])));

      // where the sonorities are
      built.forEach(({ note, spec: n }) => {
        const nx = note.getAbsoluteX() + note.getGlyphWidth() / 2;
        const cur = xOf.get(n.start);
        if (!cur || nx < cur.x) xOf.set(n.start, { x: nx, sys: si });
      });

      // ties (a tie that crosses a bar line is drawn as two halves)
      const byKey = new Map<string, StaveNote>();
      built.forEach(({ note, spec: n, row, voice }) => byKey.set(`${row}:${voice}:${n.start}`, note));
      rows.forEach((r, ri) =>
        r.voices.forEach((vm, vi) => {
          vm[m].forEach((n, k) => {
            const note = byKey.get(`${ri}:${vi}:${n.start}`)!;
            if (n.tieFromPrev) {
              const before = k > 0 ? byKey.get(`${ri}:${vi}:${vm[m][k - 1].start}`) : null;
              const p = prev[ri][vi];
              if (before) {
                new StaveTie({ firstNote: before, lastNote: note, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
              } else if (p) {
                new StaveTie({ firstNote: p.note, lastNote: null, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
                new StaveTie({ firstNote: null, lastNote: note, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
              }
            }
            prev[ri][vi] = { note };
          });
        }),
      );
      x += widths[mi];
    });
  });

  const svg = container.querySelector('svg') as SVGSVGElement;

  // ---- figured bass and circled degrees under the bass staff
  svg.setAttribute('class', 'score');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Score of ${ex.title}`);
  const NS = 'http://www.w3.org/2000/svg';
  const boxes: SliceBox[] = [];
  const hl: SVGRectElement[] = [];
  const text = (tx: number, ty: number, s: string, cls: string) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', tx.toFixed(1));
    t.setAttribute('y', ty.toFixed(1));
    t.setAttribute('class', cls);
    t.textContent = s;
    svg.append(t);
  };
  for (const s of slices) {
    const at = xOf.get(s.tick);
    if (!at) continue;
    const top = at.sys * sysHeight + SYSTEM_TOP;
    const bassBottom = top + (hasTreble ? STAVE_GAP : 0) + STAVE_H;
    s.figures.forEach((f, i) => text(at.x, bassBottom + 30 + i * FIG_ROW, f, 'fig'));
    if (s.degree) text(at.x, bassBottom + 30 + figRows * FIG_ROW + 16, s.degree, 'deg');
    const bottom = bassBottom + 30 + figRows * FIG_ROW + 24;
    boxes.push({ tick: s.tick, beat: s.beat, x: at.x, top: top - 4, bottom });
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', (at.x - 17).toFixed(1));
    r.setAttribute('y', (top - 4).toFixed(1));
    r.setAttribute('width', '34');
    r.setAttribute('height', (bottom - top + 4).toFixed(1));
    r.setAttribute('rx', '6');
    r.setAttribute('class', 'hl');
    svg.insertBefore(r, svg.firstChild); // behind the notes
    hl.push(r);
  }

  return {
    slices: boxes,
    svg,
    highlight(index) {
      hl.forEach((r, i) => r.classList.toggle('on', i === index)); // hl[i] belongs to slices[i]
    },
  };
}
