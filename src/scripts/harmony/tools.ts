// The interactive tools of the tonal-harmony pages. The logic is in tools-pure.ts (tested against the pack's tables and
// rules); this file is the page: controls, tables, scores (the shared Example Player) and sound on the chosen instrument.
import { Note } from 'tonal';
import * as T from './tools-pure';
import { buildKeyboard } from '../keyboard';
import { fontsReady } from '../fonts';
import { sampler } from '../sampler';
import { button, choices, h, head, s, showExample } from '../tool-kit';
import type { ExampleData } from '../partimento/model';

// ---------- data ----------

interface ToolData {
  cadences: (ExampleData & { caption: string })[];
  nct: (ExampleData & { caption: string })[];
  errors: (ExampleData & { caption: string; topic: string; checker: { type: string; level: string; beat: number; voices: unknown; detail: string }[]; expect: string[] })[];
  periods: { columns: string[]; rows: string[][] } | null;
  forms: { columns: string[]; rows: string[][] } | null;
  clefs: { columns: string[]; rows: string[][] } | null;
  checks: { type: string; level: string; label: string }[];
}
let dataPromise: Promise<ToolData> | null = null;
const loadData = () => (dataPromise ??= fetch('/theory/tonal-harmony/tools-data.json').then((r) => r.json() as Promise<ToolData>));

// ---------- helpers ----------

const note = (text: string, cls = 'muted-line') => h('p', cls, text);

function select(options: [string, string][], value: string, onchange: (v: string) => void, label: string): { wrap: HTMLLabelElement; sel: HTMLSelectElement } {
  const sel = h('select', 'pl-select');
  sel.setAttribute('aria-label', label);
  for (const [v, t] of options) {
    const o = h('option', '', t);
    o.value = v;
    o.selected = v === value;
    sel.append(o);
  }
  sel.addEventListener('change', () => onchange(sel.value));
  const wrap = h('label', 'pl-inline');
  wrap.append(`${label} `, sel);
  return { wrap, sel };
}
const opts = (xs: string[]): [string, string][] => xs.map((x) => [x, x]);

function table(rows: (string | Node)[][], cls?: (r: number, c: number) => string): HTMLElement {
  const scroll = h('div', 'table-scroll');
  const t = h('table', 'data-table');
  rows.forEach((r, ri) => {
    const tr = h('tr');
    r.forEach((c, ci) => {
      const cell = h(ri === 0 || ci === 0 ? 'th' : 'td');
      cell.scope = ri === 0 ? 'col' : 'row';
      cell.append(c);
      const k = cls?.(ri, ci);
      if (k) cell.className = k;
      tr.append(cell);
    });
    t.append(tr);
  });
  scroll.append(t);
  return scroll;
}

const TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
const tonicOptions = (): [string, string][] => TONICS.map((t) => [t, t.replace('#', '♯').replace(/b$/, '♭')]);
const pretty = (n: string) => n.replace(/##/g, '𝄪').replace(/bb/g, '𝄫').replace(/#/g, '♯').replace(/b/g, '♭');
const prettyAll = (ns: string[]) => ns.map(pretty).join(' ');

/** Play notes at times; each midi may carry cents (a fraction). */
async function play(events: { midi: number; at: number; dur: number; level?: number }[]): Promise<void> {
  sampler.stop();
  try {
    await sampler.activate();
  } catch {
    return;
  }
  const ac = sampler.context;
  const t0 = ac.currentTime + 0.1;
  for (const e of events) sampler.play(e.midi, t0 + e.at, e.dur, e.level ?? 0.9);
}
const chordMidis = (c: T.Chord) => T.stackPitches(c, 3).map(T.midiOf);
const playChord = (midis: number[], arpeggio = false) => play(midis.map((m, i) => ({ midi: m, at: arpeggio ? i * 0.3 : 0, dur: arpeggio ? 1.2 : 1.8 })));
/** A progression of chords (pitch classes, bass first), voiced in four parts with little movement. */
function playProgression(chords: string[][], beat = 1.1) {
  const v = T.voiceLead(chords);
  return play(v.flatMap((voices, i) => voices.map((m, k) => ({ midi: m, at: i * beat, dur: beat * 0.95, level: k === 3 ? 0.95 : 0.8 }))));
}

function keyboardOf(names: string[], bassOctave = 3): SVGSVGElement {
  const midis = names.map((n, i) => (/\d$/.test(n) ? T.midiOf(n) : T.midiOf(`${n}${bassOctave + (i > 0 && (Note.chroma(n) ?? 0) < (Note.chroma(names[0]) ?? 0) ? 1 : 0)}`)));
  return buildKeyboard(midis.map((m, i) => ({ midi: m, name: pretty(Note.pitchClass(names[i])) })));
}
const kbWrap = (svg: SVGSVGElement) => {
  const w = h('div', 'kbd-wrap');
  w.append(svg);
  return w;
};

/** A few notes in a row as an example for the Example Player. */
function lineExample(id: string, title: string, pitches: string[], parts = 1): ExampleData {
  return { id, title, key: 'C', meter: '4/4', beatUnit: 'quarter', parts, noDegrees: true, realized: { voiceOrder: 'melody', lengthBeats: pitches.length, voices: [pitches.map((p, i) => ({ t: i, d: 1, pitch: p, midi: Note.midi(p) ?? undefined }))] } };
}
const ascending = (names: string[], octave = 4): string[] => {
  const out: string[] = [];
  let o = octave;
  let prev = -1;
  for (const n of names) {
    const c = Note.chroma(n) ?? 0;
    if (c <= prev && prev - c > 0) o++;
    out.push(`${Note.pitchClass(n)}${o}`);
    prev = c;
  }
  return out;
};

// ---------- 1. clef reader ----------

async function clefReader(box: HTMLElement) {
  head(box, 'Tool', 'Clef Reader', 'A note appears on a staff with a clef. Name it. Switch clefs on and off to practise the ones you need. Middle C is marked when you ask for it.');
  const on = new Set(['treble', 'bass', 'alto', 'tenor']);
  let showC = true;
  let right = 0;
  let total = 0;
  let cur: { clef: (typeof T.CLEFS)[number]; pos: number; pitch: string } | null = null;
  const stage = h('div', 'clef-stage');
  const opts2 = h('div', 'chip-row');
  const fb = h('p', 'mot-verdict');
  fb.setAttribute('aria-live', 'polite');
  const toggles = h('div', 'chip-row');
  for (const c of T.CLEFS) {
    const b = button(c.label, () => {
      if (on.has(c.id)) on.delete(c.id);
      else on.add(c.id);
      b.setAttribute('aria-pressed', String(on.has(c.id)));
    }, 'seg-btn');
    b.setAttribute('aria-pressed', String(on.has(c.id)));
    toggles.append(b);
  }
  const mc = button('Mark Middle C', () => { showC = !showC; mc.setAttribute('aria-pressed', String(showC)); }, 'seg-btn');
  mc.setAttribute('aria-pressed', 'true');
  box.append(toggles, mc, stage, opts2, fb);
  for (const L of 'CDEFGAB') opts2.append(button(L, () => answer(L), 'seg-btn'));

  const vex = await import('vexflow/bravura');
  await fontsReady();
  function draw() {
    stage.replaceChildren();
    const c = cur!;
    const r = new vex.Renderer(stage as HTMLDivElement, vex.Renderer.Backends.SVG);
    r.resize(300, 190);
    const ctx = r.getContext();
    ctx.setFillStyle('currentColor');
    ctx.setStrokeStyle('currentColor');
    const st = new vex.Stave(10, 40, 270);
    st.addClef(c.clef.vex);
    st.setStyle({ fillStyle: 'currentColor', strokeStyle: 'currentColor' });
    st.setContext(ctx).draw();
    const key = `${c.pitch[0].toLowerCase()}/${c.pitch.slice(1)}`;
    const sn = new vex.StaveNote({ keys: [key], duration: 'w', clef: c.clef.vex });
    sn.setStyle({ fillStyle: 'currentColor', strokeStyle: 'currentColor' });
    sn.setLedgerLineStyle({ fillStyle: 'currentColor', strokeStyle: 'currentColor' });
    const v = new vex.Voice({ numBeats: 4, beatValue: 4 });
    v.addTickables([sn]);
    new vex.Formatter().joinVoices([v]).format([v], 160);
    v.draw(ctx, st);
    const svg = stage.querySelector('svg')!;
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '12');
    label.setAttribute('y', '20');
    label.setAttribute('fill', 'currentColor');
    label.setAttribute('font-size', '12');
    label.textContent = `${c.clef.label} clef${showC && c.pitch === 'C4' ? ' · this is middle C' : ''}`;
    svg.append(label);
  }
  function next() {
    const clefs = T.CLEFS.filter((c) => on.has(c.id));
    if (!clefs.length) return void (fb.textContent = 'Switch at least one clef on.');
    const clef = clefs[Math.floor(Math.random() * clefs.length)];
    const pos = Math.floor(Math.random() * 15) - 3;
    cur = { clef, pos, pitch: T.noteAt(clef, pos) };
    fb.className = 'mot-verdict';
    fb.textContent = 'Which note is it?';
    draw();
  }
  function answer(L: string) {
    if (!cur) return;
    total++;
    const ok = cur.pitch[0] === L;
    if (ok) right++;
    fb.className = `mot-verdict ${ok ? 'ok' : 'no'}`;
    fb.replaceChildren(`${ok ? 'Correct' : 'Not quite'}: ${cur.pitch} (${right}/${total}). `, button('Next', next, 'btn'));
    void play([{ midi: T.midiOf(cur.pitch), at: 0, dur: 1.2 }]);
  }
  next();
}

// ---------- 3. keyboard steps ----------

function keyboardSteps(box: HTMLElement) {
  head(box, 'Tool', 'Half and Whole Steps', 'Select two keys. The tool says whether they are a half step or a whole step, and whether it is diatonic (different letters) or chromatic (the same letter). A black key can be spelled with a sharp or a flat: choose.');
  let flatSpelling = false;
  const out = h('div');
  const W = 700;
  const svg = s('svg', { viewBox: `0 0 ${W} 120`, class: 'kbd' });
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Keyboard');
  const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const nameOf = (m: number) => `${(flatSpelling ? FLATS : SHARPS)[m % 12]}${Math.floor(m / 12) - 1}`;
  const keys: SVGRectElement[] = [];
  let wi = 0;
  const whiteMidis: number[] = [];
  for (let m = 48; m < 72; m++) if ([0, 2, 4, 5, 7, 9, 11].includes(m % 12)) whiteMidis.push(m);
  whiteMidis.forEach((m) => {
    const r = s('rect', { x: wi * 50 + 1, y: 1, width: 48, height: 116, rx: 3, class: 'wk' }, svg);
    r.dataset.m = String(m);
    keys.push(r);
    wi++;
  });
  whiteMidis.forEach((m, i) => {
    if ([0, 2, 5, 7, 9].includes(m % 12)) {
      const r = s('rect', { x: i * 50 + 35, y: 1, width: 30, height: 70, rx: 2, class: 'bk' }, svg);
      r.dataset.m = String(m + 1);
      keys.push(r);
    }
  });
  let first: number | null = null;
  const big = h('p', 'ivx-big', 'Select a key.');
  out.append(big, h('p', 'ivx-sub'));
  box.append(choices([['sharp', 'Sharps'], ['flat', 'Flats']], 'sharp', (v) => { flatSpelling = v === 'flat'; first = null; keys.forEach((k) => k.classList.remove('a', 'b')); big.textContent = 'Select a key.'; }, 'Spelling of the black keys'), kbWrap(svg as SVGSVGElement), out);
  for (const k of keys) k.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const m = Number(k.dataset.m);
    void play([{ midi: m, at: 0, dur: 1 }]);
    if (first === null) {
      keys.forEach((x) => x.classList.remove('a', 'b'));
      first = m;
      k.classList.add('a');
      big.textContent = `${pretty(nameOf(m))} …`;
      return;
    }
    k.classList.add('b');
    const a = nameOf(first);
    const b = nameOf(m);
    const lo = first <= m ? a : b;
    const hi = first <= m ? b : a;
    const r = T.stepKind(lo, hi);
    big.textContent = `${pretty(lo)} to ${pretty(hi)}: ${r.name}`;
    (out.children[1] as HTMLElement).textContent = `That is ${r.text}.`;
    first = null;
  });
}

// ---------- 4. scale builder and 6. mode wheel ----------

function scaleBuilder(box: HTMLElement) {
  head(box, 'Tool', 'Scale Builder', 'Choose a tonic and a scale. The notes are drawn on a staff with the steps between them (W whole, H half, 1½ augmented second), the scale degrees and the solfège, fixed or movable. The melodic minor is played up and down.');
  let tonic = 'C';
  let type = 'major';
  let fixed = false;
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Tonic').wrap, select(T.SCALE_TYPES, type, (v) => { type = v; run(); }, 'Scale').wrap);
  box.append(row, choices([['movable', 'Movable Do'], ['fixed', 'Fixed Do']], 'movable', (v) => { fixed = v === 'fixed'; run(); }, 'Solfège'), out, stage);
  function run() {
    const r = T.scaleReport(tonic, type);
    out.replaceChildren();
    if (!r.notes.length) return void out.append(note('That scale is not available on this tonic.', 'verdict bad'));
    const sol = fixed ? r.notes.map((n) => ['do', 'di', 're', 'ri', 'mi', 'fa', 'fi', 'sol', 'si', 'la', 'li', 'ti'][Note.chroma(n) ?? 0]) : r.solfege;
    out.append(table([['Degree', ...r.degrees], ['Note', ...r.notes.map(pretty)], ['Step to Next', ...r.steps], ['Solfège', ...sol]]));
    const asc = ascending([...r.notes, r.notes[0]], 4);
    const midis = asc.map(T.midiOf);
    const melodic = type === 'melodic minor';
    out.append(button('▶ Play', () => void play(((): { midi: number; at: number; dur: number }[] => {
      const up = midis.map((m, i) => ({ midi: m, at: i * 0.35, dur: 0.4 }));
      if (!melodic) return up;
      const nat = T.scaleReport(tonic, 'minor').notes;
      const dn = ascending([...nat, nat[0]], 4).map(T.midiOf).reverse().map((m, i) => ({ midi: m, at: (midis.length + i) * 0.35, dur: 0.4 }));
      return [...up, ...dn];
    })()), 'btn'));
    showExample(stage, lineExample('scale', `${tonic} ${type}`, asc));
  }
  run();
}

function modeWheel(box: HTMLElement) {
  head(box, 'Tool', 'Mode Wheel', 'Each mode is the major scale started on another degree. They are listed from the brightest (Lydian) to the darkest (Locrian). The characteristic note is the one that sets the mode apart from the nearer of Ionian and Aeolian; it can never be the tonic.');
  let tonic = 'C';
  const out = h('div');
  box.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Tonic').wrap, out);
  function run() {
    out.replaceChildren();
    const rows: (string | Node)[][] = [['Mode', 'Notes', 'Parent Major Scale', 'Characteristic Note', '']];
    for (const m of T.MODE_BRIGHTNESS) {
      const sc = T.scaleReport(tonic, m).notes;
      const ch = T.characteristicNote(tonic, m);
      const parentTonic = ((): string => {
        const idx = T.MODE_BRIGHTNESS.length ? ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].indexOf(m) : 0;
        return Note.transpose(tonic, ['1P', '-2M', '-3M', '-4P', '-5P', '-6M', '-7M'][idx] ?? '1P');
      })();
      rows.push([m[0].toUpperCase() + m.slice(1), prettyAll(sc), `${pretty(parentTonic)} major`, ch ? `${ch.degree} ${pretty(ch.note)} (against ${ch.against})` : '—', button('▶', () => void play(ascending([...sc, sc[0]], 4).map((n, i) => ({ midi: T.midiOf(n), at: i * 0.35, dur: 0.4 }))), 'tiny')]);
    }
    out.append(table(rows));
  }
  run();
}

// ---------- 7. interval lab ----------

function intervalLab(box: HTMLElement) {
  head(box, 'Tool', 'Interval Lab', 'Choose two notes: the tool names the interval, counts the half steps, gives the inversion (the sizes add up to 9) and the simple form of a compound interval. In the quiz, name an interval or build one.');
  const LETTERS = 'CDEFGAB'.split('');
  const mkNote = (init: string): { wrap: HTMLElement; get: () => string } => {
    const L = select(opts(LETTERS), init[0], () => run(), 'Letter');
    const A = select([['', '♮'], ['#', '♯'], ['b', '♭']], '', () => run(), 'Accidental');
    const O = select(opts(['2', '3', '4', '5', '6']), init.slice(-1), () => run(), 'Octave');
    const wrap = h('div', 'pl-row');
    wrap.append(L.wrap, A.wrap, O.wrap);
    return { wrap, get: () => `${L.sel.value}${A.sel.value}${O.sel.value}` };
  };
  const a = mkNote('C4');
  const b = mkNote('E4');
  const out = h('div');
  const stage = h('div', 'fux-stage');
  box.append(a.wrap, b.wrap, out, stage);
  function run() {
    const r = T.intervalReport(a.get(), b.get());
    out.replaceChildren(
      Object.assign(h('p', 'ivx-big'), { textContent: `${pretty(a.get())} to ${pretty(b.get())}: ${r.name} (${r.semitones} half steps)` }),
      note(`Quality ${r.quality}, size ${r.number}${r.compound ? `; compound, simple form ${r.simple}` : ''}. Inversion ${r.inversion}: ${r.simpleNumber} + ${r.sum - r.simpleNumber} = ${r.sum}.`),
    );
    const lo = T.midiOf(a.get()) <= T.midiOf(b.get()) ? a.get() : b.get();
    const hi = lo === a.get() ? b.get() : a.get();
    out.append(button('▶ Melodic', () => void play([{ midi: T.midiOf(lo), at: 0, dur: 0.8 }, { midi: T.midiOf(hi), at: 0.8, dur: 1.2 }]), 'seg-btn'), button('▶ Harmonic', () => void play([{ midi: T.midiOf(lo), at: 0, dur: 1.8 }, { midi: T.midiOf(hi), at: 0, dur: 1.8 }]), 'seg-btn'));
    showExample(stage, lineExample('iv', 'The two notes', [lo, hi]));
  }
  run();

  // the quiz
  const quiz = h('div', 'subtool');
  quiz.append(h('h4', 'mini-title', 'Quiz'));
  const qOut = h('div');
  const NAMES = ['2m', '2M', '3m', '3M', '4P', '5d', '5P', '6m', '6M', '7m', '7M'];
  const PRETTY: Record<string, string> = { m: 'minor', M: 'major', P: 'perfect', d: 'diminished', A: 'augmented' };
  const words = (n: string) => `${PRETTY[n[1]]} ${n[0]}${['', 'st', 'nd', 'rd'][Number(n[0])] ?? 'th'}`;
  let right = 0;
  let total = 0;
  function ask() {
    qOut.replaceChildren();
    const lowN = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb3', 'F#4', 'Eb4'][Math.floor(Math.random() * 9)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const hi = Note.transpose(lowN, name);
    const choicesList = [name, ...NAMES.filter((n) => n !== name).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    qOut.append(note(`Name the interval from ${pretty(lowN)} up to ${pretty(hi)}.`));
    const row = h('div', 'chip-row');
    const fb = h('p', 'mot-verdict');
    for (const c of choicesList) row.append(button(words(c), () => {
      const ok = c === name;
      total++;
      if (ok) right++;
      fb.className = `mot-verdict ${ok ? 'ok' : 'no'}`;
      fb.replaceChildren(`${ok ? 'Correct' : 'Not quite'}: ${words(name)} (${right}/${total}). `, button('Next', ask, 'btn'));
    }, 'seg-btn'));
    row.append(button('▶ Hear it', () => void play([{ midi: T.midiOf(lowN), at: 0, dur: 1.4 }, { midi: T.midiOf(hi), at: 0, dur: 1.4 }]), 'btn'));
    qOut.append(row, fb);
  }
  quiz.append(qOut);
  box.append(quiz);
  ask();
}

// ---------- 5. overtone player ----------

function overtonePlayer(box: HTMLElement) {
  head(box, 'Tool', 'Overtone Series', 'The first sixteen partials of a fundamental, with the ratio and the nearest note. Play them one after the other, adding each to those before, or play the major triad 4:5:6. The last column shows how far each partial lies from the equal-tempered note.');
  let f0 = 36;
  let exact = true;
  const out = h('div');
  const fun = select([['36', 'C2'], ['43', 'G2'], ['38', 'D2'], ['41', 'F2'], ['33', 'A1']], '36', (v) => { f0 = Number(v); run(); }, 'Fundamental');
  box.append(fun.wrap, choices([['exact', 'True Pitches'], ['tempered', 'Equal Temperament']], 'exact', (v) => { exact = v === 'exact'; }, 'Tuning'), out);
  const midiOf = (n: number) => (exact ? f0 + 12 * Math.log2(n) : Math.round(f0 + 12 * Math.log2(n)));
  function run() {
    out.replaceChildren();
    const rows: (string | Node)[][] = [['Partial', 'Note', 'Ratio to the Previous', 'Interval Above the Previous', 'Cents From Tempered']];
    for (let n = 1; n <= 16; n++) {
      const p = T.partial(f0, n);
      const prev = n > 1 ? T.partial(f0, n - 1) : null;
      const iv = prev ? Note.fromMidi(Math.round(f0 + 12 * Math.log2(n))) && ['', 'P8', 'P5', 'P4', 'M3', 'm3', 'm3', 'M2', 'M2', 'M2', 'm2', 'm2', 'm2', 'm2', 'm2', 'm2'][n - 1] : '—';
      rows.push([String(n), pretty(p.name), n === 1 ? '—' : `${n}:${n - 1}`, iv ?? '—', `${p.cents > 0 ? '+' : ''}${p.cents}`]);
    }
    out.append(table(rows, (ri, c) => (ri >= 5 && ri <= 7 && c === 0 ? 'cell-pure' : '')));
    out.append(
      button('▶ Add One at a Time', () => void play(Array.from({ length: 16 }, (_, i) => ({ midi: midiOf(i + 1), at: i * 0.6, dur: 16 * 0.6 - i * 0.6 + 0.6, level: 0.5 }))), 'btn'),
      ' ',
      button('▶ One After the Other', () => void play(Array.from({ length: 16 }, (_, i) => ({ midi: midiOf(i + 1), at: i * 0.45, dur: 0.5 }))), 'seg-btn'),
      ' ',
      button('▶ The Triad 4:5:6', () => void play([4, 5, 6].map((n) => ({ midi: midiOf(n), at: 0, dur: 2.5 }))), 'seg-btn'),
    );
  }
  run();
}

// ---------- 8. consonance ladder ----------

function consonanceLadder(box: HTMLElement) {
  head(box, 'Tool', 'Consonance Ladder', 'The intervals from the most stable to the least. Play each one. The perfect fourth is the odd one: dissonant above the bass, where it wants to fall to a third, but stable between two upper voices over a fifth.');
  const LAD: [string, [string, number][]][] = [
    ['1 · Most Stable', [['P1', 0], ['P8', 12]]],
    ['2', [['P5', 7]]],
    ['3', [['M3', 4], ['m3', 3], ['M6', 9], ['m6', 8]]],
    ['4 · Least Stable', [['M2', 2], ['m2', 1], ['M7', 11], ['m7', 10], ['A4', 6], ['d5', 6]]],
  ];
  const rows = h('div');
  for (const [rank, ivs] of LAD) {
    const r = h('div', 'pl-row');
    r.append(Object.assign(h('b'), { textContent: rank }));
    for (const [name, semis] of ivs) r.append(button(`▶ ${name}`, () => void play([{ midi: 60, at: 0, dur: 1.8 }, { midi: 60 + semis, at: 0, dur: 1.8 }]), 'seg-btn'));
    rows.append(r);
  }
  const p4 = h('div', 'subtool');
  p4.append(h('h4', 'mini-title', 'The Perfect Fourth in Two Places'), button('▶ Above the Bass: C–F, Then C–E', () => void play([{ midi: 48, at: 0, dur: 2.6 }, { midi: 53, at: 0, dur: 1.3 }, { midi: 52, at: 1.4, dur: 1.2 }]), 'btn'), ' ', button('▶ Between Upper Voices: G–C Over C', () => void play([{ midi: 36, at: 0, dur: 2.2 }, { midi: 55, at: 0, dur: 2.2 }, { midi: 60, at: 0, dur: 2.2 }]), 'btn'));
  p4.append(note('Above the bass the fourth is a dissonance that resolves to the third (F over C → E over C). Between upper voices it is the inversion of a fifth and sounds at rest.'));
  box.append(rows, p4);
}

// ---------- 9. meter lab ----------

function meterLab(box: HTMLElement) {
  head(box, 'Tool', 'Meter and Rhythm Lab', 'Choose a time signature. The grid shows the beat and its division, with the strong and weak accents. Play four bars with a click, turn the beats into triplets or duplets, shift the accents off the beat (syncopation), or hear the hemiola: two bars of 3/4 felt as one bar of 3/2.');
  let sig = '4/4';
  let bpm = 90;
  let alt: 'none' | 'triplet' | 'duplet' | 'sync' = 'none';
  const grid = h('div');
  const pre = select(opts(T.METERS), sig, (v) => { sig = v; draw(); }, 'Time Signature');
  const tempo = h('input', 'pl-range');
  tempo.type = 'range';
  tempo.min = '50';
  tempo.max = '160';
  tempo.value = String(bpm);
  const tempoOut = h('output', 'muted-line', `${bpm} bpm`);
  tempo.addEventListener('input', () => { bpm = Number(tempo.value); tempoOut.textContent = `${bpm} bpm`; });
  const tl = h('label', 'pl-inline');
  tl.append('Tempo ', tempo, ' ', tempoOut);
  const row = h('div', 'pl-row');
  row.append(pre.wrap, tl);
  box.append(row, choices([['none', 'As Written'], ['triplet', 'Triplets'], ['duplet', 'Duplets'], ['sync', 'Syncopation']], 'none', (v) => { alt = v as typeof alt; }, 'Rhythm'), grid, button('▶ Play Four Bars', () => void clicks(), 'btn'), ' ', button('▶ Hemiola', () => void hemiola(), 'seg-btn'));
  function draw() {
    const m = T.meterInfo(sig);
    grid.replaceChildren(note(`${m.type}: ${m.beats} beats to a bar, each beat divided into ${m.division}. Accents: ${m.pattern}.`));
    const strip = h('div', 'plan-strip');
    for (const b of T.meterGrid(sig)) {
      const cell = h('div', 'plan-cell');
      cell.append(h('span', 'plan-note', `${b.beat}`), h('span', b.strength === 'w' ? 'muted-line' : 'weight strong', b.strength === 'S' ? 'strong' : b.strength === 'M' ? 'medium' : 'weak'), h('span', 'muted-line', '·'.repeat(b.divisions)));
      strip.append(cell);
    }
    grid.append(strip);
  }
  async function clicks() {
    const m = T.meterInfo(sig);
    const beat = 60 / bpm;
    const pat = T.meterGrid(sig);
    const ev: { midi: number; at: number; dur: number; level: number }[] = [];
    const div = alt === 'triplet' ? 3 : alt === 'duplet' ? 2 : m.division;
    for (let bar = 0; bar < 4; bar++) {
      pat.forEach((b, i) => {
        const t0 = (bar * m.beats + i) * beat;
        for (let d = 0; d < div; d++) {
          const strong = d === 0;
          const shifted = alt === 'sync' && d === 0 ? false : alt === 'sync' && d === div - 1;
          if (alt === 'sync' && d === 0) continue;
          ev.push({ midi: strong && b.strength === 'S' ? 84 : strong && b.strength === 'M' ? 79 : shifted ? 81 : strong ? 76 : 72, at: t0 + (d * beat) / div, dur: 0.08, level: strong || shifted ? 0.9 : 0.4 });
        }
      });
    }
    await play(ev);
  }
  async function hemiola() {
    const beat = 60 / bpm;
    await play([...T.HEMIOLA.written, ...T.HEMIOLA.felt].map((a, i) => ({ midi: i < 6 ? (a ? 84 : 72) : a ? 84 : 72, at: (i < 6 ? i : i - 6 + 6.5) * beat * 0.5, dur: 0.1, level: a ? 0.95 : 0.4 })));
  }
  draw();
}

// ---------- 10. chord builder ----------

function chordBuilder(box: HTMLElement) {
  head(box, 'Tool', 'Chord Builder', 'Pick a root, a quality and an inversion. The tool shows the notes on the keyboard, the lead-sheet symbol, the figured-bass figures and, in a key you choose, the Roman numeral.');
  let root = 'C';
  let quality: T.ChordType = 'M';
  let inversion = 0;
  let key = 'C';
  let major = true;
  const out = h('div');
  const QUALITIES: [string, string][] = [['M', 'Major Triad'], ['m', 'Minor Triad'], ['dim', 'Diminished Triad'], ['aug', 'Augmented Triad'], ['dom7', 'Major-Minor 7th'], ['M7', 'Major 7th'], ['m7', 'Minor 7th'], ['m7b5', 'Half-Diminished 7th'], ['dim7', 'Fully Diminished 7th']];
  const row = h('div', 'pl-row');
  row.append(
    select(tonicOptions(), root, (v) => { root = v; run(); }, 'Root').wrap,
    select(QUALITIES, quality, (v) => { quality = v as T.ChordType; inversion = 0; run(); }, 'Quality').wrap,
    select([['0', 'Root Position'], ['1', 'First Inversion'], ['2', 'Second Inversion'], ['3', 'Third Inversion']], '0', (v) => { inversion = Number(v); run(); }, 'Inversion').wrap,
  );
  const row2 = h('div', 'pl-row');
  row2.append(select(tonicOptions(), key, (v) => { key = v; run(); }, 'Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { major = v === 'major'; run(); }, 'Mode'));
  box.append(row, row2, out);
  function numeralFor(c: T.Chord): string {
    const table = major ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'IΔ7', 'ii7', 'iii7', 'IVΔ7', 'V7', 'vi7', 'viiø7'] : ['i', 'ii°', 'III', 'iv', 'V', 'v', 'VI', 'VII', 'vii°', 'iΔ7', 'iiø7', 'IIIΔ7', 'iv7', 'V7', 'v7', 'VIΔ7', 'VII7', 'vii°7'];
    for (const n of table) {
      const x = T.chordFromNumeral(key, major, n);
      if (x && x.root === c.root && x.type === c.type) return `${n}${c.inversion ? c.figures.replace('/', '') : ''}`.replace(/(7)(65|43|42)$/, '$2');
    }
    return 'not diatonic in this key';
  }
  function run() {
    const types = quality;
    const steps = ({ M: ['3M', '5P'], m: ['3m', '5P'], dim: ['3m', '5d'], aug: ['3M', '5A'], dom7: ['3M', '5P', '7m'], M7: ['3M', '5P', '7M'], m7: ['3m', '5P', '7m'], m7b5: ['3m', '5d', '7m'], dim7: ['3m', '5d', '7d'] } as Record<string, string[]>)[types];
    const seventh = steps.length === 3;
    const inv = Math.min(inversion, steps.length);
    const chord: T.Chord = { numeral: '', root, type: quality, notes: [root, ...steps.map((s2) => Note.transpose(root, s2))], inversion: inv, bass: '', symbol: '', figures: T.figuresFor(seventh, inv) };
    chord.bass = chord.notes[inv];
    const sym = { M: '', m: 'm', dim: '°', aug: '+', dom7: '7', M7: 'maj7', m7: 'm7', m7b5: 'ø7', dim7: '°7' } as Record<string, string>;
    chord.symbol = `${root}${sym[types]}${inv ? `/${chord.bass}` : ''}`;
    const pitches = T.stackPitches(chord, 3);
    out.replaceChildren(
      Object.assign(h('p', 'tempo-big'), { textContent: `${pretty(chord.symbol)} · ${prettyAll(pitches.map((p) => p.replace(/\d/, '')))}` }),
      note(`Figures: ${chord.figures || (seventh ? '7' : '5/3 (none)')} · Roman numeral in ${pretty(key)} ${major ? 'major' : 'minor'}: ${numeralFor(chord)}`),
      kbWrap(buildKeyboard(pitches.map((p) => ({ midi: T.midiOf(p), name: pretty(p.replace(/\d/, '')) })))),
      button('▶ Block', () => void playChord(pitches.map(T.midiOf)), 'seg-btn'),
      ' ',
      button('▶ Arpeggio', () => void playChord(pitches.map(T.midiOf), true), 'seg-btn'),
    );
  }
  run();
}

// ---------- 11. diatonic table ----------

const SEVENTH_ROWS: Record<string, string[]> = {
  major: ['IΔ7', 'ii7', 'iii7', 'IVΔ7', 'V7', 'vi7', 'viiø7'],
  'natural minor': ['i7', 'iiø7', 'IIIΔ7', 'iv7', 'v7', 'VIΔ7', 'VII7'],
  'harmonic minor': ['iΔ7', 'iiø7', 'III+Δ7', 'iv7', 'V7', 'VIΔ7', 'vii°7'],
  'melodic minor': ['iΔ7', 'ii7', 'III+Δ7', 'IV7', 'V7', 'viø7', 'viiø7'],
};
const TRIAD_ROWS: Record<string, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  'natural minor': ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  'harmonic minor': ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
  'melodic minor': ['i', 'ii', 'III+', 'IV', 'V', 'vi°', 'vii°'],
};
const RARE = new Set(['v7', 'III+Δ7', 'v']);

function diatonicTable(box: HTMLElement) {
  head(box, 'Tool', 'Diatonic Chord Table', 'The triads or seventh chords of a major or minor key. Rare chords are dimmed. Select a chord to hear it. The mode-mixture view adds the chords a major key borrows from its parallel minor.');
  let tonic = 'C';
  let form = 'major';
  let sev = false;
  let mixture = false;
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Tonic').wrap, select([['major', 'Major'], ['natural minor', 'Natural Minor'], ['harmonic minor', 'Harmonic Minor'], ['melodic minor', 'Melodic Minor']], form, (v) => { form = v; run(); }, 'Scale').wrap);
  box.append(row, choices([['triads', 'Triads'], ['sevenths', 'Seventh Chords']], 'triads', (v) => { sev = v === 'sevenths'; run(); }, 'Chords'), choices([['off', 'Plain'], ['on', 'Mode Mixture']], 'off', (v) => { mixture = v === 'on'; run(); }, 'View'), out);
  const chip = (numeral: string, major: boolean, extra = '') => {
    const c = T.chordFromNumeral(tonic, major, numeral);
    if (!c) return h('span', 'muted-line', numeral);
    const b = h('button', `chip${RARE.has(numeral.replace('IΔ7', '')) ? ' dim' : ''}${extra}`);
    b.type = 'button';
    b.title = prettyAll(c.notes);
    b.append(Object.assign(h('b'), { textContent: numeral }), h('span', 'muted-line', ` ${pretty(c.symbol)}`));
    b.addEventListener('click', () => void playChord(chordMidis(c)));
    return b;
  };
  function run() {
    out.replaceChildren();
    const major = form === 'major';
    const rows = (sev ? SEVENTH_ROWS : TRIAD_ROWS)[form];
    const strip = h('div', 'chip-row');
    for (const n of rows) strip.append(chip(n, major));
    out.append(strip);
    if (mixture && major) {
      out.append(note('Borrowed from the parallel minor:'));
      const b = h('div', 'chip-row');
      for (const x of T.borrowedChords(tonic)) b.append(chip(x.numeral, true, ' borrowed'));
      out.append(b);
    }
    if (mixture && !major) out.append(note('The mixture view is for major keys.'));
    out.append(note('Chords marked with a faint outline are rare in practice.'));
  }
  run();
}

// ---------- 12. progression chart ----------

function progressionChart(box: HTMLElement) {
  head(box, 'Tool', 'Harmonic Progression Chart', 'Build a progression by selecting chords. An arrow that goes the way the chart flows is green; an arrow against it is red. The tonic can go anywhere. Turn on the secondary dominants to put V7 before its target.');
  let mode: 'major' | 'minor' = 'major';
  let secondary = false;
  let tonic = 'C';
  const prog: string[] = [];
  const chart = h('div');
  const out = h('div');
  box.append(
    choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { mode = v as typeof mode; prog.length = 0; drawChart(); drawProg(); }, 'Mode'),
    choices([['off', 'Diatonic Only'], ['on', 'With Secondary Dominants']], 'off', (v) => { secondary = v === 'on'; }, 'Chords'),
    chart,
    out,
  );
  function drawChart() {
    chart.replaceChildren();
    const flow = h('div', 'chart-flow');
    T.CHART[mode].forEach((group, gi) => {
      const col = h('div', 'chart-col');
      for (const c of group) col.append(button(c, () => add(c), 'seg-btn'));
      flow.append(col);
      if (gi < T.CHART[mode].length - 1) flow.append(h('span', 'chart-arrow', '→'));
    });
    chart.append(flow);
  }
  function add(c: string) {
    const tonicNum = mode === 'major' ? 'I' : 'i';
    if (secondary && c !== tonicNum) prog.push(`V7/${c}`);
    prog.push(c);
    drawProg();
  }
  function drawProg() {
    out.replaceChildren();
    if (!prog.length) return void out.append(note('Select a chord to begin.'));
    const base = prog.map((c) => (c.startsWith('V7/') ? '' : c));
    const arrows = T.progressionArrows(mode, prog.map((c, i) => (c.startsWith('V7/') ? (base.slice(i + 1).find((x) => x) ?? prog[i + 1]) : c)).filter(Boolean));
    const strip = h('div', 'chip-row');
    let ai = 0;
    prog.forEach((c, i) => {
      strip.append(Object.assign(h('span', 'chip'), { textContent: c }));
      if (i < prog.length - 1) {
        const secondaryStep = c.startsWith('V7/');
        const kind = secondaryStep ? 'ok' : (arrows[ai] ?? 'ok');
        if (!secondaryStep) ai++;
        else if (i + 1 < prog.length) void 0;
        strip.append(Object.assign(h('span', kind === 'ok' ? 'arrow-ok' : 'arrow-back'), { textContent: kind === 'ok' ? '→' : '⇢ against the chart' }));
      }
    });
    out.append(strip);
    const chords = prog.map((c) => T.chordFromNumeral(tonic, mode === 'major', c)?.notes ?? []).filter((n) => n.length);
    out.append(button('▶ Play', () => void playProgression(chords), 'btn'), ' ', button('Clear', () => { prog.length = 0; drawProg(); }, 'seg-btn'));
  }
  drawChart();
  drawProg();
}

// ---------- 13. harmonization helper ----------

function harmonizationHelper(box: HTMLElement) {
  head(box, 'Tool', 'Melody Harmonizer', 'Enter a short soprano as scale degrees (3 2 1) or note names. Work through five steps: fix the key and the cadence, list the candidate chords under each note, choose a path through the chart, play it, then check the part writing in the SATB checker.');
  let tonic = 'C';
  let major = true;
  const input = h('input', 'pl-select txt');
  input.type = 'text';
  input.value = '3 2 1';
  input.setAttribute('aria-label', 'Soprano');
  const out = h('div');
  const choice: (string | null)[] = [];
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { major = v === 'major'; run(); }, 'Mode'));
  const lab = h('label', 'pl-inline txt-field');
  lab.append('Soprano ', input);
  input.addEventListener('input', run);
  const steps = h('ol', 'bg-points');
  for (const t of ['Find the key, and mark the cadence at the end.', 'Write the soprano as scale degrees.', 'Under each note list the chords that contain it.', 'Choose one chord for each note, following the arrows of the chart.', 'Write the bass and inner voices, then check them in the SATB checker.']) steps.append(h('li', '', t));
  box.append(steps, row, lab, out);
  function run() {
    out.replaceChildren();
    const scale = T.scaleReport(tonic, major ? 'major' : 'harmonic minor').notes;
    const toks = input.value.trim().split(/\s+/).filter(Boolean);
    const degs = toks.map((t) => (/^[1-7]$/.test(t) ? Number(t) : scale.findIndex((n) => n[0] === t[0].toUpperCase()) + 1));
    if (!degs.length || degs.some((d) => !d)) return void out.append(note('Enter scale degrees 1–7 or note names in the key.', 'verdict bad'));
    const triads = T.diatonicTriads(tonic, major);
    while (choice.length < degs.length) choice.push(null);
    choice.length = degs.length;
    const grid = h('div', 'harm-grid');
    degs.forEach((d, i) => {
      const col = h('div', 'harm-col');
      col.append(h('b', '', `${d}̂ ${pretty(scale[d - 1])}`));
      const note1 = scale[d - 1];
      triads.filter((c) => c.notes.some((n) => Note.chroma(n) === Note.chroma(note1))).forEach((c) => {
        const b = button(c.numeral, () => { choice[i] = choice[i] === c.numeral ? null : c.numeral; run(); }, 'seg-btn');
        b.setAttribute('aria-pressed', String(choice[i] === c.numeral));
        col.append(b);
      });
      grid.append(col);
    });
    out.append(grid);
    if (choice.every(Boolean)) {
      const prog = choice as string[];
      const arrows = T.progressionArrows(major ? 'major' : 'minor', prog);
      const strip = h('div', 'chip-row');
      prog.forEach((c, i) => {
        strip.append(Object.assign(h('span', 'chip'), { textContent: c }));
        if (i < prog.length - 1) strip.append(Object.assign(h('span', arrows[i] === 'ok' ? 'arrow-ok' : 'arrow-back'), { textContent: arrows[i] === 'ok' ? '→' : '⇢ against the chart' }));
      });
      out.append(strip, button('▶ Play', () => void playProgression(prog.map((c) => T.chordFromNumeral(tonic, major, c)!.notes)), 'btn'), ' ', Object.assign(h('a', 'btn'), { href: '/tools/satb/', textContent: 'Open the SATB Checker' }));
      if (arrows.some((a) => a === 'back')) out.append(note('Some arrows go against the chart. They are not forbidden, but they are less usual.', 'verdict meh'));
    } else out.append(note('Choose a chord under each note to see the path.'));
  }
  run();
}

// ---------- 14. figured bass explainer ----------

function figuredBassExplainer(box: HTMLElement) {
  head(box, 'Tool', 'Figured Bass Explainer', 'Enter a bass note and its figures, separated by spaces (6 4, 6 5, 4 3, 4 2, 7, or # alone). The chord is spelled in the key. An accidental alone alters the 3rd; a slash or + raises the note it belongs to.');
  let tonic = 'C';
  let major = true;
  const bass = h('input', 'pl-select txt');
  bass.type = 'text';
  bass.size = 6;
  bass.value = 'B2';
  bass.setAttribute('aria-label', 'Bass note');
  const figs = h('input', 'pl-select txt');
  figs.type = 'text';
  figs.size = 12;
  figs.value = '6 5';
  figs.setAttribute('aria-label', 'Figures');
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { major = v === 'major'; run(); }, 'Mode'));
  const r2 = h('div', 'pl-row');
  const l1 = h('label', 'pl-inline');
  l1.append('Bass ', bass);
  const l2 = h('label', 'pl-inline');
  l2.append('Figures ', figs);
  r2.append(l1, l2);
  bass.addEventListener('input', run);
  figs.addEventListener('input', run);
  box.append(row, r2, out);
  function run() {
    out.replaceChildren();
    const r = T.explainFigures(tonic, major, bass.value.trim(), figs.value);
    if (!r) return void out.append(note('The bass or the figures cannot be read in this key. The bass is a note name such as B2; figures such as 6 5 or #.', 'verdict bad'));
    out.append(
      Object.assign(h('p', 'tempo-big'), { textContent: `${prettyAll(r.notes)}` }),
      note(`${r.chord}. Abbreviation: ${r.abbreviation}.`),
      table([['Bass', ...r.notes.slice(1).map((_, i) => `Note ${i + 1}`)], [pretty(r.notes[0]), ...r.notes.slice(1).map(pretty)]]),
    );
    const ul = h('ul', 'bg-points');
    r.steps.forEach((t) => ul.append(h('li', '', t)));
    out.append(ul);
    const oct = Number(bass.value.slice(-1)) || 3;
    const midis = [T.midiOf(bass.value.trim()), ...r.notes.slice(1).map((n, i) => {
      let m = T.midiOf(`${Note.pitchClass(n)}${oct}`);
      while (m <= T.midiOf(bass.value.trim()) + i * 2) m += 12;
      return m;
    })];
    out.append(button('▶ Play', () => void playChord(midis), 'btn'));
  }
  run();
}

// ---------- 15. voicing explorer ----------

function voicingExplorer(box: HTMLElement) {
  head(box, 'Tool', 'Voicing and Spacing Explorer', 'Choose a chord, then a note for each of the four voices. The tool checks each voice against its range, the spacing between neighbours (S–A and A–T no more than an octave, T–B no more than a twelfth), the position and the doubling.');
  let tonic = 'C';
  let numeral = 'I';
  const sels: HTMLSelectElement[] = [];
  const out = h('div');
  const chordSel = select(opts(['I', 'ii', 'iii', 'IV', 'V', 'V7', 'vi', 'vii°6', 'ii7']), numeral, (v) => { numeral = v; run(); }, 'Chord');
  const keySel = select(tonicOptions(), tonic, (v) => { tonic = v; fill(); run(); }, 'Key');
  const row = h('div', 'pl-row');
  row.append(keySel.wrap, chordSel.wrap);
  const voices = h('div', 'pl-row');
  for (const [i, v] of (['S', 'A', 'T', 'B'] as const).entries()) {
    const sel = h('select', 'pl-select');
    sel.setAttribute('aria-label', `${v} note`);
    sel.addEventListener('change', run);
    sels.push(sel);
    const l = h('label', 'pl-inline');
    l.append(`${['Soprano', 'Alto', 'Tenor', 'Bass'][i]} `, sel);
    voices.append(l);
  }
  box.append(row, voices, out);
  function chord() {
    return T.chordFromNumeral(tonic, true, numeral)!;
  }
  function fill() {
    const c = chord();
    const defaults = T.voiceLead([c.notes]).at(0) ?? [72, 67, 64, 48];
    ['S', 'A', 'T', 'B'].forEach((v, i) => {
      const r = T.VOICE_RANGES[v as 'S'];
      const lo = T.midiOf(('extLow' in r ? r.extLow : r.low) as string);
      const hi = T.midiOf(r.extHigh);
      sels[i].replaceChildren();
      for (let m = lo; m <= hi; m++) {
        const n = Note.fromMidi(m);
        const name = c.notes.find((x) => Note.chroma(x) === Note.chroma(n));
        if (name) sels[i].append(Object.assign(h('option'), { value: `${name}${Math.floor(m / 12) - 1}`, textContent: pretty(`${name}${Math.floor(m / 12) - 1}`) }));
      }
      const want = `${c.notes.find((x) => Note.chroma(x) === defaults[i] % 12)}${Math.floor(defaults[i] / 12) - 1}`;
      if ([...sels[i].options].some((o) => o.value === want)) sels[i].value = want;
    });
  }
  function run() {
    const c = chord();
    const vs = sels.map((s2) => s2.value) as [string, string, string, string];
    if (vs.some((x) => !x)) return;
    const r = T.voicingReport(c.notes, vs);
    const rows: [string, string, boolean][] = [
      ...r.ranges.map((x): [string, string, boolean] => [`${x.voice} range`, x.ok ? 'in range' : x.extended ? 'extended range' : 'out of range', !x.ok && !x.extended]),
      ...r.spacing.map((x): [string, string, boolean] => [`${x.pair} spacing`, `${x.ok ? 'ok' : 'too wide'} (${x.semitones} half steps, at most ${x.limit})`, !x.ok]),
      ['Position', r.position, false],
      ['Doubling', Object.entries(r.doubling).map(([k, n]) => `${pretty(k)} ×${n}`).join(', ') || '—', false],
      ['Missing', r.missing.length ? prettyAll(r.missing) : 'none', r.missing.length > 0],
    ];
    out.replaceChildren(
      note(`${pretty(c.symbol)}: ${prettyAll(c.notes)}`),
      table([['Check', 'Result'], ...rows.map((x) => [x[0], x[1]])], (ri, ci) => (ci === 1 && ri > 0 && rows[ri - 1][2] ? 'cell-bad' : '')),
      kbWrap(buildKeyboard(vs.map((v) => ({ midi: T.midiOf(v), name: pretty(v.replace(/\d/, '')) })))),
      button('▶ Play', () => void playChord(vs.map(T.midiOf)), 'btn'),
    );
  }
  fill();
  run();
}

// ---------- 16. motion classifier ----------

function motionClassifier(box: HTMLElement) {
  head(box, 'Tool', 'Motion Classifier', 'Two voices, two chords. Choose the notes of each. The tool names the motion (parallel, similar, oblique or contrary), and flags parallel, contrary, hidden and unequal fifths and octaves.');
  const NAMES: string[] = [];
  for (let m = 40; m <= 84; m++) NAMES.push(Note.fromMidi(m));
  const sel = (v: string, label: string) => select(NAMES.map((n) => [n, pretty(n)] as [string, string]), v, () => run(), label);
  const a1 = sel('E4', 'Upper Voice, First Chord');
  const b1 = sel('C4', 'Lower Voice, First Chord');
  const a2 = sel('G4', 'Upper Voice, Second Chord');
  const b2 = sel('D4', 'Lower Voice, Second Chord');
  const r1 = h('div', 'pl-row');
  r1.append(a1.wrap, b1.wrap);
  const r2 = h('div', 'pl-row');
  r2.append(a2.wrap, b2.wrap);
  const out = h('div');
  const W = 360;
  const svg = s('svg', { viewBox: `0 0 ${W} 150`, class: 'mot-svg' });
  box.append(r1, r2, out, svg);
  function run() {
    const m = T.classifyMotion(a1.sel.value, b1.sel.value, a2.sel.value, b2.sel.value);
    out.replaceChildren(
      Object.assign(h('p', 'tempo-big'), { textContent: `${m.kind[0].toUpperCase()}${m.kind.slice(1)} motion · ${m.intervals[0]} to ${m.intervals[1]}` }),
    );
    if (m.flags.length) m.flags.forEach((f) => out.append(note(f, 'verdict bad')));
    else out.append(note('No fault found in these two chords.', 'verdict good'));
    out.append(button('▶ Play', () => void play([
      { midi: T.midiOf(a1.sel.value), at: 0, dur: 1 }, { midi: T.midiOf(b1.sel.value), at: 0, dur: 1 },
      { midi: T.midiOf(a2.sel.value), at: 1.1, dur: 1.4 }, { midi: T.midiOf(b2.sel.value), at: 1.1, dur: 1.4 },
    ]), 'btn'));
    svg.replaceChildren();
    const ys = (n: string) => 130 - (T.midiOf(n) - 40) * 2.4;
    const line = (x1: number, y1: number, x2: number, y2: number, cls: string) => s('line', { x1, y1, x2, y2, class: cls }, svg);
    line(70, ys(a1.sel.value), 290, ys(a2.sel.value), 'vp u');
    line(70, ys(b1.sel.value), 290, ys(b2.sel.value), 'vp l');
    for (const [x, u, l] of [[70, a1.sel.value, b1.sel.value], [290, a2.sel.value, b2.sel.value]] as [number, string, string][]) {
      line(x, ys(u), x, ys(l), 'ivbar p');
      s('circle', { cx: x, cy: ys(u), r: 8, class: 'dot u' }, svg);
      s('circle', { cx: x, cy: ys(l), r: 8, class: 'dot l' }, svg);
    }
  }
  run();
}

// ---------- 17. error gallery ----------

async function errorGallery(box: HTMLElement) {
  head(box, 'Gallery', 'Error Gallery', 'Every example that is faulty on purpose, grouped by the level of the checklist. Select an example to see and hear it, with the faulty notes marked in colour.');
  const data = await loadData();
  const stage = h('div', 'fux-stage');
  const LEVELS = ['white', 'blue', 'green', 'yellow', 'orange', 'red'];
  const label = (t: string) => data.checks.find((c) => c.type === t)?.label ?? t;
  for (const level of LEVELS) {
    const items = data.errors.filter((e) => e.checker.some((c) => c.level === level) && e.checker.every((c) => LEVELS.indexOf(c.level) <= LEVELS.indexOf(level)));
    if (!items.length) continue;
    box.append(Object.assign(h('h4', `mini-title level level-${level}`), { textContent: `${level[0].toUpperCase()}${level.slice(1)} Level` }));
    const row = h('div', 'chip-row');
    for (const e of items) row.append(button(e.title, () => {
      showExample(stage, e);
      info.replaceChildren(note(e.caption), ...e.checker.map((c) => h('p', 'muted-line', `${label(c.type)}: ${c.detail}`)));
    }, 'seg-btn'));
    box.append(row);
  }
  const info = h('div');
  box.append(info, stage);
}

// ---------- 18. cadence player ----------

async function cadencePlayer(box: HTMLElement) {
  head(box, 'Tool', 'Cadence Player and Quiz', 'Move the slider from the weak cadences to the strong ones and hear each. The half and imperfect cadences are weak, the perfect authentic cadence is strong; the order of the ones between is the tool’s suggestion. Then take the quiz.');
  const data = await loadData();
  const byId = new Map(data.cadences.map((c) => [c.id, c]));
  const order = T.CADENCE_ORDER.filter((id) => byId.has(id));
  const stage = h('div', 'fux-stage');
  const label = h('p', 'tempo-big');
  const slider = h('input', 'pl-range');
  slider.type = 'range';
  slider.min = '0';
  slider.max = String(order.length - 1);
  slider.value = String(order.length - 1);
  slider.setAttribute('aria-label', 'Conclusiveness');
  const sl = h('label', 'pl-inline');
  sl.append('Weaker ', slider, ' Stronger');
  function show() {
    const id = order[Number(slider.value)];
    const c = byId.get(id)!;
    label.textContent = T.CADENCE_LABELS[id] ?? c.title;
    showExample(stage, c);
  }
  slider.addEventListener('input', show);
  box.append(sl, label, stage);
  show();

  const quiz = h('div', 'subtool');
  quiz.append(h('h4', 'mini-title', 'Name the Cadence'));
  const NAMES = ['PAC', 'IAC', 'HC', 'PHC', 'DC', 'PC', 'Evaded'];
  const opts2 = h('div', 'chip-row');
  const fb = h('p', 'mot-verdict');
  const stage2 = h('div', 'fux-stage');
  let right = 0;
  let total = 0;
  let cur = '';
  function next() {
    cur = order[Math.floor(Math.random() * order.length)];
    stage2.replaceChildren();
    fb.className = 'mot-verdict';
    fb.textContent = 'Listen, then choose.';
    opts2.replaceChildren(button('▶ Listen', () => {
      const ex = byId.get(cur)!;
      void play(ex.realized.voices.flatMap((v) => v.filter((e) => e.midi !== undefined && !e.rest).map((e) => ({ midi: e.midi!, at: e.t * (ex.beatUnit === 'half' ? 1.2 : 0.8), dur: e.d * (ex.beatUnit === 'half' ? 1.2 : 0.8) }))));
    }, 'btn'), ...NAMES.map((n) => button(n, () => {
      const ok = n === T.CADENCE_QUIZ_NAMES[cur];
      total++;
      if (ok) right++;
      fb.className = `mot-verdict ${ok ? 'ok' : 'no'}`;
      fb.replaceChildren(`${ok ? 'Correct' : 'Not quite'}: ${T.CADENCE_LABELS[cur]} (${right}/${total}). `, button('Next', next, 'btn'));
      showExample(stage2, byId.get(cur)!);
    }, 'seg-btn')));
  }
  quiz.append(opts2, fb, stage2);
  box.append(quiz);
  next();
}

// ---------- 19. form diagrams ----------

async function formDiagrams(box: HTMLElement) {
  head(box, 'Tool', 'Period and Form Diagrams', 'The periods and forms of the notes drawn as boxes: each phrase is a box, with its cadence under it. A cadence marked W is weak, S is strong.');
  const data = await loadData();
  const boxes = (plan: string) => {
    const wrap = h('div', 'form-boxes');
    for (const tok of plan.replace(/‖:|:‖/g, ' $& ').split(/\s+/).filter(Boolean)) {
      if (/^[A-Za-z]′?$/.test(tok)) wrap.append(h('span', `form-box fb-${tok[0].toLowerCase()}`, tok));
      else wrap.append(h('span', 'form-sep', tok));
    }
    return wrap;
  };
  const section = (title: string, tb: ToolData['periods'], planCol: number, noteCol: number) => {
    if (!tb) return;
    box.append(h('h4', 'mini-title', title));
    for (const row of tb.rows) {
      const card = h('div', 'form-card');
      card.append(Object.assign(h('b'), { textContent: row[0] }), boxes(row[planCol]), note(row[noteCol] ?? ''));
      box.append(card);
    }
  };
  section('Periods', data.periods, 1, 2);
  section('Forms', data.forms, 1, 2);
}

// ---------- 20. NCT identifier ----------

async function nctIdentifier(box: HTMLElement) {
  head(box, 'Tool', 'Non-Chord-Tone Identifier', 'Answer three questions about a non-chord tone: how it is approached, how it is left, and whether it falls on a strong or a weak beat. The tool names it with the table of the notes and shows an example.');
  const data = await loadData();
  const st = { prep: 'step', res: 'step in the same', metric: 'weak' };
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const IDS: Record<string, string[]> = { P: ['nct-p'], N: ['nct-n'], S: ['nct-sus43', 'nct-sus98', 'nct-sus65'], R: ['nct-ret'], App: ['nct-app'], ET: ['nct-et'], Ant: ['nct-ant'], Ped: ['nct-ped'], NG: ['nct-ngr'] };
  box.append(
    choices([['step', 'By Step'], ['leap', 'By Leap'], ['common tone', 'From a Common Tone']], st.prep, (v) => { st.prep = v; run(); }, 'Preparation'),
    choices([['step in the same', 'Step, Same Direction'], ['step in the opposite', 'Step, Opposite Direction'], ['step down', 'Step Down'], ['step up', 'Step Up'], ['step', 'Step'], ['leap', 'Leap, Opposite Direction'], ['common tone', 'Common Tone']], st.res, (v) => { st.res = v; run(); }, 'Resolution'),
    choices([['weak', 'Weak Beat'], ['strong', 'Strong Beat']], st.metric, (v) => { st.metric = v; run(); }, 'Metric position'),
    out,
    stage,
  );
  function run() {
    out.replaceChildren();
    const rows = T.nctFor(st.prep, st.res, st.metric);
    if (!rows.length) return void out.append(note('No non-chord tone of the table is approached and left this way. Try another answer.', 'verdict meh'));
    for (const r of rows) {
      out.append(Object.assign(h('p', 'tempo-big'), { textContent: `${r.type} (${r.abbr})` }), note(`Prepared by ${r.preparation}, left by ${r.resolution}, on a ${r.metric} beat. Look for: ${r.look}.`));
      const ex = data.nct.find((e) => (IDS[r.abbr] ?? []).includes(e.id));
      if (ex) out.append(button('Show an Example', () => showExample(stage, ex), 'seg-btn'));
    }
  }
  run();
}

// ---------- 21. V7 resolution lab ----------

function v7Lab(box: HTMLElement) {
  head(box, 'Tool', 'V7 → I Resolution Lab', 'In C major, V7 (G B D F) goes to I (C E G). Choose whether each chord is complete. The tool tries every voicing within the ranges and counts those that resolve the 7th down and the leading tone up without parallel or hidden fifths and octaves.');
  let c7 = true;
  let cI = false;
  const out = h('div');
  box.append(
    choices([['complete', 'V7 Complete'], ['incomplete', 'V7 Incomplete (No 5th)']], 'complete', (v) => { c7 = v === 'complete'; run(); }, 'V7'),
    choices([['incomplete', 'I Incomplete (Root Tripled)'], ['complete', 'I Complete']], 'incomplete', (v) => { cI = v === 'complete'; run(); }, 'I'),
    out,
  );
  function run() {
    const r = T.v7Lab(c7, cI);
    out.replaceChildren();
    const matrix = table([
      ['', 'I Incomplete', 'I Complete'],
      ['V7 Complete', ...[false, true].map((ci) => `${T.v7Lab(true, ci).works} of ${T.v7Lab(true, ci).total}`)],
      ['V7 Incomplete', ...[false, true].map((ci) => `${T.v7Lab(false, ci).works} of ${T.v7Lab(false, ci).total}`)],
    ], (ri, ci) => (ri > 0 && ci > 0 ? 'cell-pure' : ''));
    out.append(note(`${c7 ? 'Complete' : 'Incomplete'} V7 to ${cI ? 'complete' : 'incomplete'} I: ${r.works} of ${r.total} voicing pairs follow the rules.`, r.works ? 'verdict good' : 'verdict bad'));
    if (r.example) {
      out.append(table([['', 'S', 'A', 'T', 'B'], ['V7', ...r.example.v7.map(pretty)], ['I', ...r.example.one.map(pretty)]]), button('▶ Play the Smoothest', () => void play([...r.example!.v7.map((n) => ({ midi: T.midiOf(n), at: 0, dur: 1.2 })), ...r.example!.one.map((n) => ({ midi: T.midiOf(n), at: 1.3, dur: 1.8 }))]), 'btn'));
    } else out.append(note(`No voicing works: ${r.reason}.`, 'verdict bad'));
    out.append(note('All four combinations:'), matrix);
  }
  run();
}

// ---------- 22. inversion table ----------

function inversionTable(box: HTMLElement) {
  head(box, 'Tool', 'Seventh-Chord Inversions', 'V7, viiø7, vii°7 and ii7 in all four positions, in the key of C major. The chordal 7th is green and the leading tone red. Each row plays the chord and then its resolution.');
  const FAMILIES: [string, string, string][] = [['V7', 'V', 'I'], ['viiø7', 'viiø', 'I'], ['vii°7', 'vii°', 'I'], ['ii7', 'ii', 'V7']];
  let family = 'V7';
  const out = h('div');
  box.append(choices(FAMILIES.map(([k]) => [k, k]), family, (v) => { family = v; run(); }, 'Chord'), out);
  const FIGS = ['7', '65', '43', '42'];
  function run() {
    out.replaceChildren();
    const [, base, resolveTo] = FAMILIES.find(([k]) => k === family)!;
    const rows: (string | Node)[][] = [['Position', 'Symbol', 'Notes', '']];
    const names = ['Root', '1st inversion', '2nd inversion', '3rd inversion'];
    FIGS.forEach((f, i) => {
      const c = T.chordFromNumeral('C', true, `${base}${f}`)!;
      const seventh = c.notes[3];
      const lt = family === 'V7' ? c.notes[1] : family.startsWith('vii') ? c.notes[0] : null;
      const pitches = T.stackPitches(c, 3);
      const spans = h('span');
      pitches.forEach((p) => {
        const pc = p.replace(/\d/, '');
        const sp = h('span', pc === seventh ? 'note-7th' : lt && pc === lt ? 'note-lt' : '', `${pretty(pc)} `);
        spans.append(sp);
      });
      const target = T.chordFromNumeral('C', true, resolveTo + (i === 3 || (family !== 'V7' && i > 0) ? '6' : ''))!;
      rows.push([names[i], `${family}${i ? ` (${c.figures})` : ''}`, spans, button('▶', () => void playProgression([c.notes.slice(c.inversion).concat(c.notes.slice(0, c.inversion)), target.notes.slice(target.inversion).concat(target.notes.slice(0, target.inversion))]), 'tiny')]);
    });
    out.append(table(rows), note('Green: the chordal 7th, which resolves down by step. Red: the leading tone, which resolves up to the tonic.'));
  }
  run();
}

// ---------- 23. secondary calculator ----------

function secondaryCalculator(box: HTMLElement) {
  head(box, 'Tool', 'Secondary Function Calculator', 'Choose a key and a target chord. The tool spells V, V7, vii°, vii°7 and viiø7 of the target with the steps of the procedure. Reverse mode analyses a chromatic chord that you type.');
  let tonic = 'C';
  let major = true;
  let target = 'V';
  const out = h('div');
  const targets = () => (major ? ['ii', 'iii', 'IV', 'V', 'vi'] : ['III', 'iv', 'V', 'VI', 'VII']);
  const row = h('div', 'pl-row');
  const tsel = select(opts(targets()), target, (v) => { target = v; run(); }, 'Target');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { major = v === 'major'; target = targets()[3]; tsel.sel.replaceChildren(...targets().map((t) => Object.assign(h('option'), { value: t, textContent: t, selected: t === target }))); run(); }, 'Mode'), tsel.wrap);
  box.append(row, out);
  function run() {
    out.replaceChildren();
    const secs = T.secondaryChords(tonic, major, target);
    if (!secs) return;
    const rows: (string | Node)[][] = [['Chord', 'Notes', '']];
    for (const x of secs) rows.push([x.numeral, prettyAll(x.chord.notes), button('▶', () => void playChord(chordMidis(x.chord)), 'tiny')]);
    out.append(table(rows));
    const det = h('details', 'bg-more');
    det.append(h('summary', '', 'Show the Steps of the Spelling'));
    for (const x of secs) {
      det.append(Object.assign(h('b'), { textContent: x.numeral }));
      const ul = h('ul', 'bg-points');
      x.steps.forEach((t) => ul.append(h('li', '', pretty(t))));
      det.append(ul);
    }
    out.append(det);
    // reverse mode
    const rev = h('div', 'subtool');
    rev.append(h('h4', 'mini-title', 'Reverse: Analyse a Chord'));
    const input = h('input', 'pl-select txt');
    input.type = 'text';
    input.value = 'D F# A C';
    input.setAttribute('aria-label', 'Notes of the chord');
    const res = h('div');
    const go = () => {
      const notes = input.value.trim().split(/[\s,]+/).filter(Boolean);
      const r = T.analyseSecondary(tonic, major, notes);
      res.replaceChildren(note(r.text, r.numeral ? 'verdict good' : 'verdict meh'));
      const ul = h('ul', 'bg-points');
      r.steps.forEach((t) => ul.append(h('li', '', pretty(t))));
      res.append(ul);
    };
    input.addEventListener('input', go);
    const l = h('label', 'pl-inline txt-field');
    l.append('Notes ', input);
    rev.append(l, res);
    out.append(rev);
    go();
  }
  run();
}

// ---------- 24. fifths substitution ----------

function fifthsSubstitution(box: HTMLElement) {
  head(box, 'Tool', 'Circle-of-Fifths Substitution Matrix', 'In C major the chain iii7 – vi7 – ii7 – V7 – I falls by fifths. Each of the first three chords can be diatonic, a secondary dominant of the chord after it, or a secondary leading-tone chord of it: 3 × 3 × 3 = 27 progressions. Choose one and play it.');
  const choice: [T.Slot, T.Slot, T.Slot] = ['diatonic', 'diatonic', 'diatonic'];
  const out = h('div');
  const grid = h('div', 'harm-grid');
  ['iii7', 'vi7', 'ii7'].forEach((name, i) => {
    const col = h('div', 'harm-col');
    col.append(h('b', '', name));
    col.append(choices(T.ALL_SLOTS.map((sl) => [sl, T.SLOT_LABELS[sl]] as [string, string]), 'diatonic', (v) => { choice[i] = v as T.Slot; run(); }, `Slot ${i + 1}`));
    grid.append(col);
  });
  box.append(grid, out);
  function run() {
    const p = T.substitutionPath('C', choice);
    out.replaceChildren(
      Object.assign(h('p', 'tempo-big'), { textContent: `${p.labels.join(' – ')}` }),
      note(`${p.chords.map((c) => pretty(c.symbol)).join(' – ')}`),
      button('▶ Play', () => void playProgression(p.chords.map((c) => c.notes), 1.3), 'btn'),
    );
    const det = h('details', 'bg-more');
    det.append(h('summary', '', 'Show All 27 Progressions'));
    det.append(table([['Progression', 'Chords'], ...T.allSubstitutionPaths().map((c) => { const x = T.substitutionPath('C', c); return [x.labels.slice(0, 3).join(' '), x.chords.map((y) => pretty(y.symbol)).join(' – ')]; })]));
    out.append(det);
  }
  run();
}

// ---------- 25. pivot finder ----------

function pivotFinder(box: HTMLElement) {
  head(box, 'Tool', 'Pivot-Chord Finder', 'Choose two keys. The tool lists the diatonic triads of each (a minor key uses the harmonic minor, as in the notes) and the chords they share, with both Roman numerals.');
  const A = { tonic: 'C', major: true };
  const B = { tonic: 'G', major: true };
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(
    select(tonicOptions(), A.tonic, (v) => { A.tonic = v; run(); }, 'First Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { A.major = v === 'major'; run(); }, 'First mode'),
    select(tonicOptions(), B.tonic, (v) => { B.tonic = v; run(); }, 'Second Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { B.major = v === 'major'; run(); }, 'Second mode'),
  );
  box.append(row, out);
  function run() {
    const p = T.pivotChords(A, B);
    out.replaceChildren();
    for (const [k, label] of [[A, 'First'], [B, 'Second']] as const) {
      out.append(note(`${label} key, ${pretty(k.tonic)} ${k.major ? 'major' : 'minor'}: ${T.diatonicTriads(k.tonic, k.major).map((c) => `${c.numeral} ${pretty(c.symbol)}`).join(' · ')}`));
    }
    if (!p.length) return void out.append(note('These keys share no triad. A modulation between them needs another way.', 'verdict meh'));
    out.append(table([['Chord', 'In the First Key', 'In the Second Key', ''], ...p.map((x) => [pretty(x.chord), x.inA, x.inB, button('▶', () => { const c = T.diatonicTriads(A.tonic, A.major).find((y) => y.symbol === x.chord); if (c) void playChord(chordMidis(c)); }, 'tiny')])], (ri, ci) => (ri > 0 && ci > 0 && ci < 3 ? 'cell-pure' : '')));
    out.append(note(`${p.length} pivot chord${p.length > 1 ? 's' : ''}. Written ${p.map((x) => `${x.inA}=${x.inB}`).join(', ')}.`));
  }
  run();
}

// ---------- 26. mixture palette ----------

function mixturePalette(box: HTMLElement) {
  head(box, 'Tool', 'Mode-Mixture Palette', 'The chords a major key borrows from its parallel minor, marked with the borrowed degree they use (♭3̂, ♭6̂ or ♭7̂), most common first.');
  let tonic = 'C';
  const out = h('div');
  box.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, out);
  function run() {
    out.replaceChildren();
    const d = T.diatonicTriads(tonic, true);
    out.append(note(`Major key chords: ${d.map((c) => `${c.numeral} ${pretty(c.symbol)}`).join(' · ')}`));
    out.append(table([['Borrowed Chord', 'Notes', 'Borrowed Degree', ''], ...T.borrowedChords(tonic).map((b) => [b.numeral, prettyAll(b.chord.notes), b.degrees.join(' '), button('▶', () => void playChord(chordMidis(b.chord)), 'tiny')])]));
    out.append(note('The notes say ♭6̂ is the most common borrowed degree, then ♭3̂, then ♭7̂ (p. 46).'));
  }
  run();
}

// ---------- 27. chromatic builder ----------

function chromaticBuilder(box: HTMLElement) {
  head(box, 'Tool', 'Neapolitan and Augmented-Sixth Builder', 'Spell the chord in five steps and hear it resolve. The augmented sixth (bass ♭6̂ or 6̂ with ♯4̂) expands outward to an octave on 5̂; the Neapolitan has ♭2̂ falling to the leading tone.');
  let tonic = 'C';
  let major = true;
  let kind: 'It' | 'Fr' | 'Ger' | 'N' = 'Ger';
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { major = v === 'major'; run(); }, 'Mode'));
  box.append(row, choices([['It', 'Italian'], ['Fr', 'French'], ['Ger', 'German'], ['N', 'Neapolitan']], kind, (v) => { kind = v as typeof kind; run(); }, 'Chord'), out);
  function run() {
    const c = kind === 'N' ? T.neapolitan(tonic) : T.augmentedSixth(tonic, major, kind);
    out.replaceChildren(Object.assign(h('p', 'tempo-big'), { textContent: `${c.name}: ${prettyAll(c.notes)}` }));
    const ul = h('ol', 'bg-points');
    c.steps.forEach((t) => ul.append(h('li', '', pretty(t))));
    out.append(ul);
    const pcs = c.notes.map((n) => Note.pitchClass(n));
    const dom = [Note.transpose(tonic, '5P'), Note.transpose(tonic, '7M'), Note.transpose(tonic, '2M')];
    const chords = [pcs, [dom[0], dom[1], dom[2], dom[0]]];
    out.append(kbWrap(buildKeyboard(pcs.map((n, i) => ({ midi: T.midiOf(`${n}${3 + (i > 0 && (Note.chroma(n) ?? 0) < (Note.chroma(pcs[0]) ?? 0) ? 1 : 0)}`), name: pretty(n) })))));
    out.append(button('▶ Chord, Then Resolution to V', () => void playProgression(chords, 1.5), 'btn'));
    if (kind !== 'N') {
      const W = 300;
      const svg = s('svg', { viewBox: `0 0 ${W} 80`, class: 'a6-svg' });
      s('line', { x1: 40, x2: 250, y1: 60, y2: 60, class: 'roll-beat' }, svg);
      const lo = s('circle', { cx: 40, cy: 60, r: 8, class: 'dot l a6-lo' }, svg);
      const hi = s('circle', { cx: 40, cy: 20, r: 8, class: 'dot u a6-hi' }, svg);
      s('text', { x: 40, y: 78, class: 'roll-label' }, svg).textContent = 'augmented sixth';
      s('text', { x: 250, y: 78, class: 'roll-label' }, svg).textContent = 'octave';
      lo.style.transition = hi.style.transition = 'transform 1.2s ease';
      out.append(svg, button('Animate the Expansion', () => { lo.style.transform = 'translate(210px, 0)'; hi.style.transform = 'translate(210px, 40px)'; setTimeout(() => { lo.style.transform = hi.style.transform = ''; }, 2600); }, 'seg-btn'));
    }
  }
  run();
}

// ---------- 28. tendency tones ----------

function tendencyTones(box: HTMLElement) {
  head(box, 'Tool', 'Tendency-Tone Map', 'Choose a chord in a key. The tool marks the notes that pull: the leading tone up to the tonic, ♭6̂ down to 5̂, the chordal 7th down, and the tritone, whose diminished fifth contracts and augmented fourth expands.');
  let tonic = 'C';
  let numeral = 'V7';
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(tonicOptions(), tonic, (v) => { tonic = v; run(); }, 'Key').wrap, select(opts(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'V7', 'viiø7', 'vii°7', 'ii7', 'iv', 'bVI']), numeral, (v) => { numeral = v; run(); }, 'Chord').wrap);
  box.append(row, out);
  function run() {
    const c = T.chordFromNumeral(tonic, true, numeral)!;
    const t = T.tendencies(tonic, true, c.notes, T.isSeventh(c.type));
    out.replaceChildren(note(`${numeral}: ${prettyAll(c.notes)}`));
    const pitches = T.stackPitches(c, 3);
    out.append(kbWrap(buildKeyboard(pitches.map((p) => ({ midi: T.midiOf(p), name: pretty(p.replace(/\d/, '')) })))));
    if (!t.length) out.append(note('No tendency tone in this chord: it is at rest.'));
    else out.append(table([['Note', 'Tendency', 'Resolves'], ...t.map((x) => [pretty(x.note), x.kind, pretty(x.to)])]));
    out.append(button('▶ Play', () => void playChord(pitches.map(T.midiOf)), 'btn'));
  }
  run();
}

// ---------- entry ----------

const link = (box: HTMLElement, title: string, href: string, text: string) => {
  head(box, 'Tool', title, text);
  box.append(Object.assign(h('a', 'btn'), { href, textContent: `Open the ${title}` }));
};

type Builder = (box: HTMLElement) => void | Promise<void>;
const TOOLS: Record<string, Builder> = {
  'clef-reader': clefReader,
  'keyboard-steps': keyboardSteps,
  'scale-builder': scaleBuilder,
  'mode-wheel': modeWheel,
  'interval-lab': intervalLab,
  'overtone-player': overtonePlayer,
  'consonance-ladder': consonanceLadder,
  'meter-lab': meterLab,
  'chord-builder': chordBuilder,
  'diatonic-table': diatonicTable,
  'progression-chart': progressionChart,
  'harmonization-helper': harmonizationHelper,
  'figured-bass-explainer': figuredBassExplainer,
  'voicing-explorer': voicingExplorer,
  'motion-classifier': motionClassifier,
  'error-gallery': errorGallery,
  'cadence-player': cadencePlayer,
  'form-diagrams': formDiagrams,
  'nct-identifier': nctIdentifier,
  'v7-resolution-lab': v7Lab,
  'inversion-table': inversionTable,
  'secondary-calculator': secondaryCalculator,
  'fifths-substitution': fifthsSubstitution,
  'pivot-finder': pivotFinder,
  'mixture-palette': mixturePalette,
  'chromatic-builder': chromaticBuilder,
  'tendency-tones': tendencyTones,
  'circle-of-fifths': (b) => link(b, 'Circle of Fifths', '/tools/circle-of-fifths/', 'An interactive circle of fifths with the key signatures, the relative minors and the closely related keys.'),
  'satb-checker': (b) => link(b, 'SATB Checker', '/tools/satb/', 'Write a four-part progression and the checker marks every break of the rules of part writing, by level.'),
  'tuning-lab': (b) => link(b, 'Tuning Lab', '#bg-tuning', 'Hear a scale and a triad in the Pythagorean, just, meantone, well-tempered and equal tunings. It sits in the History Background panel of this chapter.'),
};

export async function mountTonalTool(box: HTMLElement, id: string): Promise<void> {
  try {
    await TOOLS[id]?.(box);
  } catch (e) {
    console.error(e);
    box.append(note('This tool could not be loaded.', 'verdict bad'));
  }
}

