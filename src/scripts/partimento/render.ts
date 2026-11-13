// Draws an example as a grand staff with figured bass and circled bass degrees (VexFlow).
import { Accidental, Beam, BarlineType, Dot, Formatter, Fraction, Renderer, Stave, StaveConnector, StaveNote, StaveTie, Stem, Voice } from 'vexflow/bravura';
import { barTicks, keySpec, layoutVoice, slicesOf, ticksPerBeat, totalBarsOf } from './model';
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

/** Colours of the noteheads the rule checker marks (the same in light and dark). */
export const MARK_COLOR = { error: '#d1432f', warn: '#d98a1c', info: '#3b82c4' } as const;

function makeNote(spec: NoteSpec, clef: Clef, stem: number | null, mark?: keyof typeof MARK_COLOR): StaveNote {
  const rest = spec.pitch === null;
  const sn = new StaveNote({
    keys: [rest ? (clef === 'treble' ? 'b/4' : 'd/3') : keyOf(spec.pitch!)],
    duration: `${spec.dur}${spec.dotted ? 'd' : ''}${rest ? 'r' : ''}`,
    clef,
    autoStem: stem === null,
    stemDirection: stem ?? undefined,
  });
  if (spec.dotted) Dot.buildAndAttach([sn], { all: true });
  const style = mark ? { fillStyle: MARK_COLOR[mark], strokeStyle: MARK_COLOR[mark] } : STYLE;
  sn.setStyle(style);
  if (mark) sn.setKeyStyle(0, style); // the notehead has a style of its own
  sn.setStemStyle(style);
  sn.setLedgerLineStyle(style);
  sn.setFlagStyle(style);
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
  if (all.length === 1) {
    // a single line (a scale or a melody): one staff, in the clef that fits its range
    const octaves = all[0].filter((e) => e.pitch).map((e) => Number(/(-?\d)$/.exec(e.pitch!)![1]));
    const mean = octaves.reduce((a, b) => a + b, 0) / Math.max(1, octaves.length);
    rows.push({ clef: mean >= 4 ? 'treble' : 'bass', first: 0, voices: [lay(bassVoice)] });
  } else if (opts.showUpper) {
    // each staff takes the clef that fits the range of its voices (a cantus on D4 sits on a treble staff)
    const meanOctave = (vs: ExampleData['realized']['voices']) => {
      const oct = vs.flat().filter((e) => e.pitch).map((e) => Number(/(-?\d)$/.exec(e.pitch!)![1]));
      return oct.reduce((a, b) => a + b, 0) / Math.max(1, oct.length);
    };
    const top = upper.slice(0, 2);
    const bottom = [...upper.slice(2), bassVoice];
    rows.push({ clef: meanOctave(top) < 3 ? 'bass' : 'treble', first: 0, voices: top.map(lay) });
    rows.push({ clef: meanOctave(bottom) >= 4 ? 'treble' : 'bass', first: top.length, voices: bottom.map(lay) });
  } else {
    rows.push({ clef: 'bass', first: all.length - 1, voices: [lay(bassVoice)] });
  }
  const hasTreble = rows.length === 2;
  const slices = slicesOf(ex);
  const figRows = Math.max(1, ...slices.map((s) => s.figures.length));
  const spec = keySpec(ex.key);
  const accidentals = Math.abs(keyAccidentals(spec));

  // a note the checker marked: the mark's onset falls inside the note
  const tpb = ticksPerBeat(ex.beatUnit);
  const markOf = (voice: number, n: NoteSpec) =>
    n.pitch === null ? undefined : ex.marks?.find((k) => k.voice === voice && n.start <= k.t * tpb + 1e-6 && k.t * tpb < n.start + n.ticks - 1e-6)?.level;

  // Build the notes of one bar. Notes must be built fresh for each use: formatting the same note objects
  // twice would apply VexFlow's collision shifts twice and leave stems detached from their heads.
  const buildMeasure = (m: number) => {
    const built: Built[] = [];
    const onsets = new Set<number>();
    const beams: Beam[] = [];
    const voices = rows.map((r, ri) => {
      const two = r.voices.length === 2;
      const vs = r.voices.map((vm, vi) => {
        const stem = two ? (vi === 0 ? Stem.UP : Stem.DOWN) : null;
        const notes = vm[m].map((n) => {
          const note = makeNote(n, r.clef, stem, markOf(r.first + vi, n));
          built.push({ note, spec: n, row: ri, voice: vi });
          onsets.add(n.start);
          return note;
        });
        const total = vm[m].reduce((a, n) => a + n.ticks, 0);
        const v = new Voice({ numBeats: Math.max(1, total), beatValue: 64 });
        v.setMode(Voice.Mode.SOFT);
        v.addTickables(notes);
        // short notes are beamed in groups of one beat (without this each sixteenth would carry its own flags)
        beams.push(...Beam.generateBeams(notes, { groups: [new Fraction(1, 4)], maintainStemDirections: true }));
        return v;
      });
      Accidental.applyAccidentals(vs, spec);
      return vs;
    });
    return { voices, built, beams, onsets: onsets.size };
  };

  // ---- pass 1: ask VexFlow how much room each bar needs (these notes are thrown away)
  const plans: MeasurePlan[] = [];
  // The figures sit in one row under the bass staff. The row is pushed down far enough that the lowest bass
  // notes (ledger lines, or a stem that points down) never touch it.
  const LETTER_STEP: Record<string, number> = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
  const bassRow = rows.length - 1;
  const BASS_BOTTOM_STEP = rows[bassRow].clef === 'treble' ? 4 * 7 + 2 : 2 * 7 + 4; // E4 / G2 sit on the bottom line; 5px per step
  let lowestReach = 0; // px below the bottom bass line
  for (let m = 0; m < bars; m++) {
    const probeBar = buildMeasure(m);
    for (const b of probeBar.built) {
      if (b.row !== bassRow) continue;
      for (const key of b.note.getKeys()) {
        const [letter, octave] = key.split('/');
        const step = Number(octave) * 7 + (LETTER_STEP[letter[0].toLowerCase()] ?? 0);
        const middleStep = rows[bassRow].clef === 'treble' ? 4 * 7 + 6 : 3 * 7 + 1; // B4 / D3: the middle line
        const stemDown = rows[bassRow].voices.length === 2 ? b.voice === 1 : step >= middleStep;
        lowestReach = Math.max(lowestReach, (BASS_BOTTOM_STEP - step) * 5 + (stemDown ? 35 : 5));
      }
    }
    const probe = new Formatter();
    probeBar.voices.forEach((vs) => probe.joinVoices(vs));
    plans.push({ minWidth: probe.preCalculateMinTotalWidth(probeBar.voices.flat()), onsets: probeBar.onsets });
  }

  // ---- widths and the split into systems
  const modifiers = (first: boolean, withTime: boolean) => (first ? 58 + accidentals * 11 + (withTime ? 28 : 0) : 0);
  const needOf = (m: number) => Math.max(54 + plans[m].onsets * 34, plans[m].minWidth + 34); // room the notes need
  const measureWidth = (m: number, first: boolean, withTime: boolean) => needOf(m) + modifiers(first, withTime);
  const usable = Math.max(300, opts.width - 24);
  let systems: number[][] = [];
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

  // Balance the lines: 6 bars that need two lines read better as 3 + 3 than as 5 + 1.
  if (systems.length > 1) {
    const k = systems.length;
    const base = Math.floor(bars / k);
    const extra = bars % k;
    const balanced: number[][] = [];
    let at = 0;
    for (let si = 0; si < k; si++) {
      const size = base + (si < extra ? 1 : 0);
      balanced.push(Array.from({ length: size }, (_, i) => at + i));
      at += size;
    }
    const fits = balanced.every((g, si) => g.length > 0 && g.reduce((a, m, i) => a + measureWidth(m, i === 0, si === 0 && i === 0), 0) <= usable);
    if (fits) systems = balanced;
  }

  /** Split `avail` px between bars: equal shares, except a bar with many notes keeps the room it needs. */
  const shareWidths = (needs: number[], avail: number): number[] => {
    const total = needs.reduce((a, b) => a + b, 0);
    if (total >= avail) return needs.map((n) => (n * avail) / total);
    const fixed = new Set<number>();
    let share = avail / needs.length;
    for (;;) {
      const free = needs.length - fixed.size;
      const left = avail - [...fixed].reduce((a, i) => a + needs[i], 0);
      share = left / free;
      const crowded = needs.findIndex((n, i) => !fixed.has(i) && n > share);
      if (crowded < 0) break;
      fixed.add(crowded);
    }
    return needs.map((n, i) => (fixed.has(i) ? n : share));
  };
  const firstBar = (si: number) => modifiers(true, si === 0);
  const firstLineBar = (usable - firstBar(0)) / systems[0].length; // the width of an ordinary bar on line one

  const hasLabels = slices.some((s) => s.label);
  const labelRow = hasLabels ? 22 : 0; // room for the analysis row under the degrees
  const figDrop = Math.max(0, lowestReach - 12); // extra gap before the figure row
  const sysHeight = SYSTEM_TOP + (hasTreble ? STAVE_GAP : 0) + STAVE_H + 38 + figDrop + figRows * FIG_ROW + 34 + labelRow;
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(opts.width, systems.length * sysHeight + 12);
  const ctx = renderer.getContext();
  ctx.setFillStyle('currentColor');
  ctx.setStrokeStyle('currentColor');

  // ---- pass 2: draw
  const xOf = new Map<number, { x: number; sys: number }>(); // onset tick -> x and system
  const prev: ({ note: StaveNote; sys: number } | null)[][] = rows.map((r) => r.voices.map(() => null));

  systems.forEach((measures, si) => {
    const top = si * sysHeight + SYSTEM_TOP;
    const needs = measures.map(needOf);
    const lastOfMany = systems.length > 1 && si === systems.length - 1;
    let avail = usable - firstBar(si);
    // an unfinished last line keeps the bar width of the lines above instead of stretching its few bars
    if (lastOfMany) avail = Math.max(Math.min(avail, measures.length * firstLineBar), needs.reduce((a, b) => a + b, 0));
    const widths = shareWidths(needs, avail).map((w, i) => w + (i === 0 ? firstBar(si) : 0));
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

      const { voices, built, beams } = buildMeasure(m); // fresh notes for drawing
      const startX = Math.max(...staves.map((s) => s.getNoteStartX()));
      const formatter = new Formatter();
      voices.forEach((vs) => formatter.joinVoices(vs));
      formatter.format(voices.flat(), Math.max(plans[m].minWidth, x + widths[mi] - startX - 16));
      voices.forEach((vs, ri) => vs.forEach((v) => v.draw(ctx, staves[ri])));
      beams.forEach((b) => b.setContext(ctx).draw());

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
              } else if (p && p.sys === si) {
                // across a bar line on the same line: one tie from note to note
                new StaveTie({ firstNote: p.note, lastNote: note, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
              } else if (p) {
                // across a line break: the tie leaves the end of one line and arrives at the start of the next
                new StaveTie({ firstNote: p.note, lastNote: null, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
                new StaveTie({ firstNote: null, lastNote: note, firstIndexes: [0], lastIndexes: [0] }).setContext(ctx).draw();
              }
            }
            prev[ri][vi] = { note, sys: si };
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
  // Interval numbers between the two staves of a two-voice example (counterpoint)
  if (ex.intervals && hasTreble && all.length === 2) {
    const LETTER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    const stepOf = (p: string) => Number(/(-?\d)$/.exec(p)![1]) * 7 + LETTER[p[0]];
    for (const s of slices) {
      const at = xOf.get(s.tick);
      if (!at) continue;
      const [hi, lo] = all.map((v) => v.find((e) => e.pitch && e.t <= s.beat + 1e-9 && s.beat < e.t + e.d - 1e-9));
      if (!hi?.pitch || !lo?.pitch) continue;
      const n = stepOf(hi.pitch) - stepOf(lo.pitch) + 1;
      if (n < 1) continue;
      const perfect = [0, 3, 4].includes((n - 1) % 7);
      text(at.x, at.sys * sysHeight + SYSTEM_TOP + 80 + (STAVE_GAP - 80) / 2 + 5, String(n), perfect ? 'ivl perfect' : 'ivl');
    }
  }

  // In a diminution the upper voice runs in short notes over a slow bass: the figures and degrees then belong to the
  // bass notes only, not to every short note.
  const onlyAtBass = slices.filter((s) => !s.bassStart).length > slices.length / 2;
  for (const s of slices) {
    const at = xOf.get(s.tick);
    if (!at) continue;
    const top = at.sys * sysHeight + SYSTEM_TOP;
    const bassBottom = top + (hasTreble ? STAVE_GAP : 0) + STAVE_H;
    if (!onlyAtBass || s.bassStart) s.figures.forEach((f, i) => text(at.x, bassBottom + 30 + figDrop + i * FIG_ROW, f, 'fig'));
    if (s.label) text(at.x, bassBottom + 30 + figDrop + figRows * FIG_ROW + 38, s.label, 'lab');
    if (s.degree && s.bassStart && !ex.noDegrees) text(at.x, bassBottom + 30 + figDrop + figRows * FIG_ROW + 16, s.degree, 'deg');
    const bottom = bassBottom + 30 + figDrop + figRows * FIG_ROW + 24 + labelRow;
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
