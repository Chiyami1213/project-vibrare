// The interactive tools of the HIP page. The logic is in tools-pure.ts (tested against the pack's acceptance lists);
// this file is the page: controls, a piano roll of the notes, and sound on the instrument chosen in Settings.
import { Note } from 'tonal';
import { parseVoice, schedule, soundingNotes } from './notation';
import type { HipNote } from './notation';
import * as T from './tools-pure';
import { button, choices, h, head, s } from '../tool-kit';
import { sampler } from '../sampler';

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

function slider(label: string, min: number, max: number, step: number, value: number, unit: string, oninput: (v: number) => void): { wrap: HTMLLabelElement; input: HTMLInputElement; out: HTMLOutputElement } {
  const input = h('input', 'pl-range');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.setAttribute('aria-label', label);
  const out = h('output', 'muted-line', `${value}${unit}`);
  input.addEventListener('input', () => {
    out.textContent = `${input.value}${unit}`;
    oninput(Number(input.value));
  });
  const wrap = h('label', 'pl-inline');
  wrap.append(`${label} `, input, ' ', out);
  return { wrap, input, out };
}

function checkbox(label: string, checked: boolean, onchange: (v: boolean) => void): { wrap: HTMLLabelElement; input: HTMLInputElement } {
  const input = h('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onchange(input.checked));
  const wrap = h('label', 'pl-inline');
  wrap.append(input, ` ${label}`);
  return { wrap, input };
}

const voice = (src: string): HipNote[] => parseVoice(src.replace(/\|/g, ' '));
const lengthOf = (v: HipNote[]) => v.reduce((a, n) => Math.max(a, n.t + n.d), 0);

/** Play layers one after the other (a crotchet apart); each layer is a list of voices in mini-notation. */
async function playLayers(layers: string[][], bpm = 60, accent = true): Promise<void> {
  sampler.stop();
  try {
    await sampler.activate();
  } catch {
    return;
  }
  const ac = sampler.context;
  const beat = 60 / bpm;
  const piano = sampler.instrument.group === 'Piano';
  let offset = 0;
  const t0 = ac.currentTime + 0.1;
  for (const voices of layers) {
    const parsed = voices.map(voice);
    for (const n of schedule(parsed, beat, piano || !accent)) sampler.play(n.midi, t0 + offset + n.start, n.dur, n.level);
    offset += Math.max(0, ...parsed.map(lengthOf)) * beat + beat;
  }
}

/** A piano roll of one or more layers, each a block with a label: the notes as bars along the time axis. */
function roll(layers: { label: string; voices: string[] }[]): SVGSVGElement {
  const W = 640;
  const rowH = 4;
  const gap = 18;
  const parsed = layers.map((l) => l.voices.map((v) => soundingNotes(voice(v))));
  const midis = parsed.flat(2).map((n) => n.midi!);
  const lo = Math.min(...midis) - 1;
  const hi = Math.max(...midis) + 1;
  const span = hi - lo;
  const total = Math.max(1, ...layers.flatMap((l) => l.voices.map((v) => lengthOf(voice(v)))));
  const layerH = span * rowH + 8;
  const svg = s('svg', { viewBox: `0 0 ${W} ${layers.length * (layerH + gap)}`, class: 'hip-roll' });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'The notes as bars: time across, pitch up');
  layers.forEach((l, li) => {
    const y0 = li * (layerH + gap);
    s('text', { x: 2, y: y0 + 10, class: 'roll-label' }, svg).textContent = l.label;
    s('rect', { x: 0, y: y0 + 14, width: W, height: layerH - 8, class: 'roll-bg' }, svg);
    for (let b = 0; b <= total + 1e-9; b += 1) s('line', { x1: (b / total) * W, x2: (b / total) * W, y1: y0 + 14, y2: y0 + layerH + 6, class: 'roll-beat' }, svg);
    parsed[li].forEach((notes, vi) => {
      for (const n of notes) {
        const x = (n.t / total) * W;
        const w = Math.max(1.5, (n.d / total) * W - 0.6);
        const y = y0 + 14 + (hi - n.midi!) * rowH;
        s('rect', { x, y, width: w, height: rowH - 0.8, rx: 1, class: `roll-note v${vi}${n.vel !== null && n.vel >= 0.8 ? ' accent' : ''}` }, svg);
      }
    });
  });
  return svg;
}

const code = (text: string) => h('code', 'hip-notation', text);
const pretty = (src: string) => src.replace(/\s+/g, ' ');

// ---------- 1. Quantz tempo calculator ----------

function quantzTempoTool(box: HTMLElement) {
  head(box, 'Tool', 'Quantz Tempo Calculator', 'Quantz ties every tempo word to the pulse of a healthy person, about 80 a minute. Choose the metre, the tempo word and the fastest note value to see where the pulse falls, and what that is in beats a minute.');
  const st = { metre: 'C' as T.Metre, word: 'Allegro assai', fastest: 'quaver' as T.Fastest, pulse: 80 };
  const out = h('div');
  const metre = select(T.METRES.map((m) => [m, m] as [string, string]), st.metre, (v) => { st.metre = v as T.Metre; run(); }, 'Metre');
  const word = h('label', 'pl-inline');
  const wsel = h('select', 'pl-select');
  wsel.setAttribute('aria-label', 'Tempo word');
  for (const g of T.TEMPO_GROUPS) {
    const og = h('optgroup');
    og.label = g.label;
    for (const w of g.words) {
      const o = h('option', '', w);
      o.value = w;
      o.selected = w === st.word;
      og.append(o);
    }
    wsel.append(og);
  }
  wsel.addEventListener('change', () => { st.word = wsel.value; run(); });
  word.append('Tempo Word ', wsel);
  const fastest = select(T.FASTEST.map((f) => [f, f] as [string, string]), st.fastest, (v) => { st.fastest = v as T.Fastest; run(); }, 'Fastest Note Value');
  const pulse = slider('Pulse', 60, 100, 1, st.pulse, ' a minute', (v) => { st.pulse = v; run(); });
  const taps: number[] = [];
  const tapOut = note('');
  const tap = button('Tap Pulse', () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2500) taps.length = 0;
    taps.push(now);
    const bpm = T.tapTempo(taps);
    if (bpm === null) return void (tapOut.textContent = 'Keep tapping…');
    tapOut.textContent = `Your pulse: ${bpm} a minute${bpm < 60 || bpm > 100 ? ' (outside the range of the slider)' : ''}.`;
    st.pulse = Math.max(60, Math.min(100, bpm));
    pulse.input.value = String(st.pulse);
    pulse.out.textContent = `${st.pulse} a minute`;
    run();
  }, 'seg-btn');
  const row1 = h('div', 'pl-row');
  row1.append(metre.wrap, word, fastest.wrap);
  const row2 = h('div', 'pl-row');
  row2.append(pulse.wrap, tap, tapOut);
  box.append(row1, row2, out);

  function run() {
    const r = T.quantzTempo(st);
    out.replaceChildren();
    const big = h('p', 'tempo-big');
    big.append(Object.assign(h('b'), { textContent: `${r.unit === 'bar' ? 'bar' : r.unit} = ${r.mm}` }), ` a minute · ${T.CLASS_LABELS[r.cls]}`);
    out.append(big, note(`Pulse placement: ${r.placement}.`));
    if (!r.covered) out.append(note(r.note, 'verdict meh'));
    else if (r.note) out.append(note(r.note));
    out.append(note(`Bodky’s nearest group, compared by the crotchet (${Math.round((r.pulse * r.spacing) / 2)} a minute): ${r.bodky.group} (about ${r.bodky.mm}).`));
    // the bar, with dots where the pulses fall
    const W = 560;
    const total = r.barQ * r.bars;
    const svg = s('svg', { viewBox: `0 0 ${W} 46`, class: 'pulse-bar' });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Pulses at ${r.positions.join(', ')} quavers`);
    s('rect', { x: 0, y: 10, width: W, height: 14, rx: 3, class: 'roll-bg' }, svg);
    for (let q = 0; q <= total + 1e-9; q += 1) s('line', { x1: (q / total) * W, x2: (q / total) * W, y1: 10, y2: q % r.barQ === 0 ? 32 : 24, class: q % r.barQ === 0 ? 'bar-line' : 'roll-beat' }, svg);
    for (const q of r.positions) s('circle', { cx: (q / total) * W, cy: 17, r: 5, class: 'pulse-dot' }, svg);
    s('text', { x: 0, y: 44, class: 'roll-label' }, svg).textContent = `${r.bars} bar${r.bars > 1 ? 's' : ''}, one tick = one quaver, dots = pulses`;
    out.append(svg);
    out.append(button('▶ Play Two Bars', () => void playPulse(r), 'seg-btn'));
  }

  async function playPulse(r: T.TempoResult) {
    sampler.stop();
    try {
      await sampler.activate();
    } catch {
      return;
    }
    const ac = sampler.context;
    const qSec = 60 / (r.pulse * r.spacing);
    const bars = Math.max(2, r.bars);
    const t0 = ac.currentTime + 0.1;
    const total = r.barQ * bars;
    const reps = Math.ceil(bars / r.bars);
    for (let rep = 0; rep < reps; rep++) {
      for (const q of r.positions) {
        const at = (rep * r.barQ * r.bars + q) * qSec;
        if (at < total * qSec - 1e-6) sampler.play(84, t0 + at, 0.08, 0.9);
      }
    }
    for (let b = 0; b < bars; b++) sampler.play(72, t0 + b * r.barQ * qSec, 0.15, 0.45); // a soft tick on the counting unit
  }
  run();
}

// ---------- 2. Appoggiatura lab ----------

function appoggiaturaLab(box: HTMLElement) {
  head(box, 'Tool', 'Appoggiatura Length Lab', 'Pick a case and a source. The tool shows the notes as written and as performed, and plays both. Where the sources disagree you get both realisations.');
  let cas: T.AppCase = 'plain';
  let value = 2;
  let appLen = 0.125;
  let which = 0;
  const out = h('div');
  const caseSel = select(T.APP_CASES.map((c) => [c.id, c.label] as [string, string]), cas, (v) => { cas = v as T.AppCase; which = 0; run(); }, 'Case');
  const valueSel = select([['1', 'Crotchet'], ['2', 'Minim'], ['4', 'Semibreve']], '2', (v) => { value = Number(v); run(); }, 'Written Value');
  const lenSl = slider('Appoggiatura Length', 0.0625, 0.5, 0.0625, appLen, ' crotchet', (v) => { appLen = v; run(); });
  const source = h('div', 'pl-row');
  const row = h('div', 'pl-row');
  row.append(caseSel.wrap, valueSel.wrap, lenSl.wrap);
  box.append(row, source, out);

  function run() {
    valueSel.wrap.hidden = cas !== 'plain';
    lenSl.wrap.hidden = cas !== 'dissonant-trill';
    const info = T.APP_CASES.find((c) => c.id === cas)!;
    const r = T.appoggiatura(cas, { value: cas === 'plain' ? value : undefined, appLen: cas === 'dissonant-trill' ? appLen : undefined });
    source.replaceChildren();
    if (info.sources.length > 1 && r.performed.length === 1) source.append(note(`Sources: ${info.sources.join(' and ')} agree here.`));
    else if (r.performed.length === 1) source.append(note(`Source: ${info.sources.join(', ')} only; the others give no rule for this case.`));
    if (r.performed.length > 1) {
      source.append(choices(r.performed.map((p, i) => [String(i), p.name] as [string, string]), String(which), (v) => { which = Number(v); draw(r); }, 'Source'));
    }
    draw(r);
  }
  function draw(r: T.AppResult) {
    out.replaceChildren();
    const shown = r.performed[Math.min(which, r.performed.length - 1)];
    const bassOf = (b: string) => (b ? [b] : []);
    const layers = [
      { label: 'Written', voices: [r.written.upper.replace(/g[A-G][#b]?\d:0/g, ''), ...bassOf(r.written.bass)] },
      { label: shown.name, voices: [shown.upper, ...bassOf(shown.bass)] },
    ];
    out.append(note(r.rule), roll(layers));
    out.append(h('p', 'muted-line', 'Written: '), code(pretty(r.written.upper)), h('p', 'muted-line', `${shown.name}: `), code(pretty(shown.upper)));
    out.append(note(`The appoggiatura takes ${Math.round(r.app * 1000) / 1000} crotchet${r.app === 1 ? '' : 's'}; the main note keeps ${Math.round(r.main * 1000) / 1000}.`));
    if (cas === 'plain' || cas === 'dotted') {
      const above = Note.get('F5');
      const bass = Note.get('C3');
      out.append(note(`The small note (${above.name}) is a fourth over the bass (${bass.name}): the dissonance is on the beat, and it resolves to the main note, a third.`));
    }
    if (r.warning) out.append(note(r.warning, 'verdict bad'));
    out.append(button('▶ Play Written, Then Performed', () => void playLayers([[...[r.written.upper.replace(/g[A-G][#b]?\d:0/g, ''), ...bassOf(r.written.bass)], [shown.upper, ...bassOf(shown.bass)]]]), 'seg-btn'));
  }
  run();
}

// ---------- 3. Rhythm lab ----------

function rhythmLab(box: HTMLElement) {
  head(box, 'Tool', 'Rhythm Lab: Dots, Lombard, Inequality, Triplets', 'One short passage for each mode. The written version and the altered one are played back to back.');
  type Mode = 'dotted' | 'lombard' | 'inequality' | 'triplets';
  let mode: Mode = 'dotted';
  const panel = h('div');
  box.append(choices([['dotted', 'Dotted Notes'], ['lombard', 'Lombard Rhythm'], ['inequality', 'Inequality'], ['triplets', 'Dotted Against Triplets']], mode, (v) => { mode = v as Mode; draw(); }, 'Mode'), panel);

  function show(written: string[], performed: string[], label: string, extra: Node[]) {
    panel.append(...extra, roll([{ label: 'Written', voices: written }, { label, voices: performed }]), h('p', 'muted-line', 'Written: '), code(pretty(written[0])), h('p', 'muted-line', `${label}: `), code(pretty(performed[0])), button('▶ Play Written, Then Altered', () => void playLayers([written, performed]), 'seg-btn'));
  }

  function draw() {
    panel.replaceChildren();
    if (mode === 'dotted') {
      let ratio = 7;
      const inner = h('div');
      const sl = slider('Dot', 3, 7, 0.5, ratio, ':1', (v) => { ratio = v; redo(); });
      const quick = button('As Short as the Shortest Note (7:1)', () => { ratio = 7; sl.input.value = '7'; sl.out.textContent = '7:1'; redo(); }, 'seg-btn');
      const row = h('div', 'pl-row');
      row.append(sl.wrap, quick);
      panel.append(note('Quantz: the note after the dot is as short as the shortest note of the piece, whatever the tempo, and the dot is held longer. The slider runs from the written 3:1 to the sharp 7:1.'), row, inner);
      const redo = () => {
        inner.replaceChildren();
        const written = [T.DOTTED_WRITTEN];
        const performed = [T.dottedPerformed(ratio)];
        inner.append(roll([{ label: 'Written (3:1)', voices: written }, { label: `Performed (${ratio}:1)`, voices: performed }]), h('p', 'muted-line', `Performed at ${ratio}:1: `), code(pretty(performed[0])), button('▶ Play Written, Then Altered', () => void playLayers([written, performed]), 'seg-btn'));
      };
      redo();
      return;
    }
    if (mode === 'lombard') {
      let first = 0.125;
      const inner = h('div');
      const sl = slider('First Note', 0.0625, 0.25, 0.0625, first, ' crotchet', (v) => { first = v; redo(); });
      panel.append(note('The short note before the long one is played faster than written, and the shorter it is, the bolder the effect (CPE III §23, p. 158; Q V §23, p. 68).'), sl.wrap, inner);
      const redo = () => {
        inner.replaceChildren();
        const performed = [T.lombardPerformed(first)];
        inner.append(roll([{ label: 'Written', voices: [T.LOMBARD_WRITTEN] }, { label: 'Performed', voices: performed }]), code(pretty(performed[0])), button('▶ Play Written, Then Altered', () => void playLayers([[T.LOMBARD_WRITTEN], performed]), 'seg-btn'));
      };
      redo();
      return;
    }
    if (mode === 'inequality') {
      let share = 58;
      const ticked = new Set<string>();
      const inner = h('div');
      const sl = slider('Long Note Share', 50, 60, 1, share, ' per cent', (v) => { share = v; redo(); });
      const boxes = h('div', 'ws-props');
      for (const e of T.INEQUALITY_EXCEPTIONS) {
        const c = checkbox(e.label, false, (on) => { if (on) ticked.add(e.id); else ticked.delete(e.id); redo(); });
        boxes.append(c.wrap);
      }
      panel.append(note('Quantz: in moderate and slow pieces the quickest notes are held a little unequally, the 1st, 3rd, 5th and 7th longer and stronger, but never as much as dotted. Tick any exception that applies: the inequality is then switched off.'), sl.wrap, h('p', 'muted-line', 'Exceptions (Q XI §12, p. 124):'), boxes, inner);
      const redo = () => {
        inner.replaceChildren();
        const st = T.inequalityState([...ticked]);
        sl.input.disabled = !st.enabled;
        if (!st.enabled) {
          inner.append(note(st.reason, 'verdict meh'), roll([{ label: 'Written (played evenly)', voices: [T.INEQUALITY_WRITTEN] }]), button('▶ Play Even', () => void playLayers([[T.INEQUALITY_WRITTEN]]), 'seg-btn'));
          return;
        }
        const performed = [T.inequalityPerformed(share / 100)];
        inner.append(note('The split is an illustration of “slightly”: Quantz gives no ratio.'), roll([{ label: 'Written', voices: [T.INEQUALITY_WRITTEN] }, { label: `Performed (${share}:${100 - share})`, voices: performed }]), code(pretty(performed[0])), button('▶ Play Written, Then Altered', () => void playLayers([[T.INEQUALITY_WRITTEN], performed]), 'seg-btn'));
      };
      redo();
      return;
    }
    // triplets
    let src: T.TripletSource = 'Quantz';
    const inner = h('div');
    panel.append(note('Quantz: the short note comes after the third triplet note, so it does not sound like 6/8. C. P. E. Bach: dotted figures against triplets are assimilated to the triplet. The sources disagree; decide by the style of the piece.'), choices([['Quantz', 'Quantz'], ['C. P. E. Bach', 'C. P. E. Bach']], src, (v) => { src = v as T.TripletSource; redo(); }, 'Source'), inner);
    const redo = () => {
      inner.replaceChildren();
      const lower = T.TRIPLET_WRITTEN.lower;
      const written = [T.TRIPLET_WRITTEN.upper, lower];
      const performed = [T.TRIPLET_PERFORMED[src], lower];
      inner.append(roll([{ label: 'Written', voices: written }, { label: src, voices: performed }]), code(pretty(performed[0])), button('▶ Play Written, Then Altered', () => void playLayers([written, performed]), 'seg-btn'));
    };
    redo();
  }
  draw();
}

// ---------- 4. Trill builder ----------

function trillBuilder(box: HTMLElement) {
  head(box, 'Tool', 'Trill Builder', 'Choose how the trill starts, how fast it is and how it ends. Quantz: eight notes to a pulse of about 80, beginning with an appoggiatura and ending with a two-note termination. C. P. E. Bach: the normal trill starts on the upper note.');
  let o: T.TrillOptions = { ...T.TRILL_PRESETS[0].options };
  let short = false;
  let nextKind: 'lower' | 'higher' | 'same' = 'lower';
  let presetId = 'quantz';
  const out = h('div');
  const controls = h('div');
  const NEXT: Record<string, string> = { lower: 'C5', higher: 'E5', same: 'D5' };

  function drawControls() {
    controls.replaceChildren();
    const row = h('div', 'pl-row');
    const start = select([['upper', 'On the Upper Note'], ['appoggiatura-above', 'Appoggiatura From Above'], ['appoggiatura-below', 'Appoggiatura From Below'], ['main', 'On the Main Note']], o.start, (v) => { o.start = v as T.TrillStart; presetId = ''; run(); }, 'Start');
    const speed = slider('Speed', 4, 12, 1, o.notesPerPulse, ' notes to a pulse', (v) => { o.notesPerPulse = v; presetId = ''; run(); });
    const character = select([['gay', 'Gay (Quicker)'], ['normal', 'Normal'], ['sad', 'Sad or Low (Slower)']], o.character ?? 'normal', (v) => { o.character = v as 'gay' | 'normal' | 'sad'; run(); }, 'Character');
    const term = checkbox('Termination', o.termination, (v) => { o.termination = v; run(); });
    const acc = checkbox('Accelerating (L. Mozart)', !!o.accelerate, (v) => { o.accelerate = v; presetId = ''; run(); });
    const diss = checkbox('Trill on a dissonance against the bass', !!o.dissonant, (v) => { o.dissonant = v; run(); });
    const next = select([['lower', 'Next Note a Step Lower'], ['higher', 'Next Note a Step Higher'], ['same', 'Next Note the Same']], nextKind, (v) => { nextKind = v as typeof nextKind; if (nextKind !== 'lower') short = false; run(); }, 'Context');
    const allowed = T.pralltrillerAllowed('D5', NEXT[nextKind]);
    const sh = checkbox('Short Trill (Pralltriller)', short && allowed, (v) => { short = v; run(); });
    sh.input.disabled = !allowed;
    if (!allowed) sh.wrap.title = 'only offered when the next note is a step lower';
    row.append(start.wrap, speed.wrap, character.wrap);
    const row2 = h('div', 'pl-row');
    row2.append(term.wrap, acc.wrap, diss.wrap, next.wrap, sh.wrap);
    controls.append(choices(T.TRILL_PRESETS.map((p) => [p.id, p.label] as [string, string]), presetId, (id) => {
      const p = T.TRILL_PRESETS.find((x) => x.id === id)!;
      o = { ...p.options };
      short = id === 'cpe-pralltriller';
      nextKind = 'lower';
      presetId = id;
      drawControls();
      run();
    }, 'Presets'), row, row2);
    if (!allowed) controls.append(note('The short trill is offered only when the next note is a step lower (C. P. E. Bach II.3, pp. 110–112).'));
  }

  function run() {
    out.replaceChildren();
    const nextPitch = NEXT[nextKind];
    let upper: string;
    let warnings: string[] = [];
    let perPulse = 0;
    if (short && T.pralltrillerAllowed('D5', nextPitch)) {
      upper = `E5:0.5_ ${T.pralltriller(0.5, 'D5', 'E5', nextPitch)}`;
    } else {
      const r = T.trill({ ...o, next: nextPitch, value: o.value ?? 2 });
      upper = r.upper;
      warnings = r.warnings;
      perPulse = r.perPulse;
    }
    const written = short ? 'E5:0.5 D5:0.5 C5:1' : `D5:2 ${nextPitch}:2`;
    out.append(
      roll([{ label: 'Written', voices: [written.replace('D5:2', 'D5:2')] }, { label: 'Realised', voices: [upper] }]),
      h('p', 'muted-line', 'Realised: '),
      code(pretty(upper)),
      note(perPulse ? `${Math.round(perPulse * 10) / 10} notes to a crotchet (the crotchet is the pulse).` : 'A short trill: the upper note is snapped at the end of the main note.'),
    );
    for (const w of warnings) out.append(note(w, 'verdict bad'));
    out.append(button('▶ Play Written, Then Realised', () => void playLayers([[written], [upper]]), 'seg-btn'));
  }
  box.append(controls, out);
  drawControls();
  run();
}

// ---------- 5. Breath and articulation planner ----------

function breathPlanner(box: HTMLElement) {
  head(box, 'Tool', 'Breath and Articulation Planner', 'Enter a melody in the mini-notation (pitch:length in crotchets, for example B4:2 D5:0.25), or pick one of the examples. The marks are suggestions after Quantz VII and VI: select the gaps between notes to add or remove a breath, and a syllable to change it.');
  const EXAMPLES: [string, string][] = [['breath-q', 'Breathing in a Semiquaver Passage'], ['tongue-q', 'Tonguing Syllables'], ['bow-map', 'One Passage, Three Instruments']];
  const SRC: Record<string, { text: string; bar: number }> = {
    'breath-q': { text: 'B4:2 D5:0.25 C5:0.25 B4:0.25 A4:0.25 G4:0.25 B4:0.25 D5:0.25 G5:0.25 | F#5:2 E5:0.25 D5:0.25 C5:0.25 B4:0.25 A4:0.25 C5:0.25 E5:0.25 C5:0.25 | B4:4', bar: 4 },
    'tongue-q': { text: 'D5:0.5 A4:0.5 F#5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5:0.5 A5:0.5 | A5:0.75 G5:0.25 F#5:0.75 E5:0.25 D5:2', bar: 4 },
    'bow-map': { text: 'D5:1 G5:1 B5:1 | A5:0.75 G5:0.25 F#5:1 r:1', bar: 3 },
  };
  let mode: 'flute' | 'keyboard' = 'flute';
  let bowView = false;
  let bar = 4;
  const area = h('textarea', 'pl-select txt');
  area.rows = 3;
  area.value = SRC['breath-q'].text;
  area.setAttribute('aria-label', 'Melody');
  area.spellcheck = false;
  const barSel = select([['4', '4/4'], ['3', '3/4'], ['2', '2/4']], '4', (v) => { bar = Number(v); run(true); }, 'Metre');
  const pre = select(EXAMPLES, 'breath-q', (v) => { area.value = SRC[v].text; bar = SRC[v].bar; barSel.sel.value = String(bar); run(true); }, 'Example');
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(pre.wrap, barSel.wrap);
  const bowToggle = checkbox('Bowing View (L. Mozart, Cross-Reference)', false, (v) => { bowView = v; draw(); });
  box.append(row, choices([['flute', 'Flute'], ['keyboard', 'Keyboard']], mode, (v) => { mode = v as typeof mode; draw(); }, 'Instrument'), area, button('Plan', () => run(true)), bowToggle.wrap, out);
  area.addEventListener('input', () => run(true));

  let notes: T.PlanNote[] = [];
  let pitches: string[] = [];
  let marks = new Set<number>();
  let syl: string[] = [];
  let reasons = new Map<number, T.Breath>();

  function run(reset: boolean) {
    out.replaceChildren();
    let parsed: HipNote[];
    try {
      parsed = soundingNotes(voice(area.value));
    } catch (e) {
      return void out.append(note((e as Error).message, 'verdict bad'));
    }
    if (parsed.length === 0) return void out.append(note('Enter at least one note.', 'verdict bad'));
    notes = parsed.map((n) => ({ midi: n.midi!, d: n.d, t: n.t }));
    pitches = parsed.map((n) => n.pitch!);
    if (reset) {
      const plan = T.planBreaths(notes, bar);
      reasons = new Map(plan.map((b) => [b.index, b]));
      marks = new Set(plan.map((b) => b.index));
      syl = T.syllables(notes);
    }
    draw();
  }

  const CYCLE = ['ti', 'di', 'ri', 'did', "'ll"];
  function draw() {
    out.replaceChildren();
    if (notes.length === 0) return;
    const strip = h('div', 'plan-strip');
    const bows = T.bowing(notes, bar);
    notes.forEach((n, i) => {
      const cell = h('div', 'plan-cell');
      const w = T.metricalWeight(n, bar);
      if (mode === 'keyboard') cell.append(h('span', `weight ${w}`, w === 'strong' ? '●' : '○'));
      if (bowView) cell.append(h('span', 'bow', bows[i] === 'down' ? '∨' : '⊓'));
      cell.append(h('span', 'plan-note', pitches[i]));
      if (mode === 'flute') {
        const b = button(syl[i], () => { syl[i] = CYCLE[(CYCLE.indexOf(syl[i]) + 1) % CYCLE.length]; draw(); }, 'syl');
        b.title = 'change the syllable';
        cell.append(b);
      }
      strip.append(cell);
      if (i < notes.length - 1) {
        const gap = h('button', `plan-gap${marks.has(i) ? ' on' : ''}`, marks.has(i) ? (mode === 'flute' ? '✓' : ',') : '·');
        gap.type = 'button';
        gap.setAttribute('aria-pressed', String(marks.has(i)));
        gap.title = marks.has(i) ? `${reasons.get(i)?.why ?? 'your own mark'}: select to remove` : 'select to add a breath here';
        gap.addEventListener('click', () => { if (marks.has(i)) marks.delete(i); else marks.add(i); draw(); });
        if (reasons.get(i)?.kind === 'emergency') gap.classList.add('emergency');
        strip.append(gap);
      }
    });
    out.append(strip);
    out.append(note(mode === 'flute'
      ? 'A tick ✓ is a breath; an amber one is an emergency breath. Syllables: ti for short lively notes and leaps; di for slow and stepwise notes; tiri for dotted notes (ri on the strong note); did’ll for the quickest passages.'
      : 'The same points as lifts (commas) between the pillars of a steady beat. ● is a strong beat, ○ a weak one. On the harpsichord unstressed notes can only be made shorter (BS ch. 2, p. 20).'));
    const list = h('ul', 'bg-points');
    for (const m of [...marks].sort((a, b) => a - b)) {
      const r = reasons.get(m);
      list.append(h('li', '', `After note ${m + 1} (${pitches[m]}): ${r ? `${r.kind === 'main' ? 'main' : 'emergency'} breath, ${r.why}` : 'your own mark'}.`));
    }
    if (!list.children.length) list.append(h('li', '', 'No breath marked.'));
    out.append(list, note('These marks are suggestions from Quantz’s rules; a performer decides.'));
    // what you hear: the melody with a short gap at each breath (flute: breath; keyboard: lift)
    out.append(button('▶ Play With the Breaths', () => void playPhrases(), 'seg-btn'));
  }

  async function playPhrases() {
    sampler.stop();
    try {
      await sampler.activate();
    } catch {
      return;
    }
    const ac = sampler.context;
    const t0 = ac.currentTime + 0.1;
    const beat = 0.5;
    let shift = 0;
    notes.forEach((n, i) => {
      const last = marks.has(i);
      const dur = Math.max(0.05, n.d * beat * (last ? 0.6 : 0.95));
      sampler.play(n.midi, t0 + n.t * beat + shift, dur, T.metricalWeight(n, bar) === 'strong' ? 1 : 0.8);
      if (last) shift += 0.12;
    });
  }
  run(true);
}

// ---------- 6. Dissonance dynamics ----------

function dissonanceDynamics(box: HTMLElement) {
  head(box, 'Tool', 'Dissonance Dynamics', 'Quantz: the more dissonant the chord, the louder it is played. A harpsichord cannot change its loudness by touch, so the class is shown by texture: more parts, the bass in octaves, and a quick arpeggio. A piano uses velocity.');
  interface Row {
    bass: string;
    uppers: string;
  }
  const rows: Row[] = [
    { bass: 'A2', uppers: 'A3 C4 E4' },
    { bass: 'G#2', uppers: 'B3 D4 E4' },
    { bass: 'A2', uppers: 'A3 C4 E4' },
    { bass: 'F2', uppers: 'A3 B3 D#4' },
    { bass: 'E2', uppers: 'G#3 B3 E4' },
    { bass: 'C3', uppers: 'E3 G3 B3' },
    { bass: 'D2', uppers: 'F3 G#3 B3' },
    { bass: 'E2', uppers: 'G#3 B3 E4' },
  ];
  let level: T.GlobalLevel = 'normal';
  const list = h('div', 'diss-rows');
  const summary = h('div');
  const pre = h('div', 'chip-row');
  for (const p of T.DISS_PRESETS) pre.append(button(p.label, () => { rows.push({ bass: p.bass, uppers: p.uppers.join(' ') }); draw(); }, 'seg-btn'));
  box.append(choices([['normal', 'Level: Normal'], ['p', 'Piano'], ['pp', 'Pianissimo']], level, (v) => { level = v as T.GlobalLevel; draw(); }, 'Global level'), note('Add a chord from the list, or edit the bass and the notes above it.'), pre, list, summary, button('▶ Play the Progression', () => void play(), 'seg-btn'));

  const parse = (r: Row) => {
    const uppers = r.uppers.split(/[\s,]+/).filter(Boolean);
    const ok = !Note.get(r.bass).empty && uppers.length > 0 && uppers.every((u) => !Note.get(u).empty);
    return { ok, uppers };
  };

  function draw() {
    list.replaceChildren();
    rows.forEach((r, i) => {
      const line = h('div', 'pl-row diss-row');
      const bass = h('input', 'pl-select txt');
      bass.type = 'text';
      bass.size = 5;
      bass.value = r.bass;
      bass.setAttribute('aria-label', `Bass of chord ${i + 1}`);
      const up = h('input', 'pl-select txt');
      up.type = 'text';
      up.size = 16;
      up.value = r.uppers;
      up.setAttribute('aria-label', `Notes above the bass, chord ${i + 1}`);
      const cls = h('span', 'diss-class');
      const upd = () => {
        r.bass = bass.value.trim();
        r.uppers = up.value;
        const p = parse(r);
        if (!p.ok) {
          cls.textContent = 'cannot read';
          cls.className = 'diss-class bad';
          return;
        }
        const c = T.dissonanceClass(r.bass, p.uppers);
        const sc = T.scaleClass(c, level);
        cls.textContent = c === sc ? T.CLASS_NAMES[c] : `${T.CLASS_NAMES[c]} → ${T.CLASS_NAMES[sc]}`;
        cls.className = `diss-class c-${sc}`;
        cls.title = `intervals above the bass: ${T.intervalsAbove(r.bass, p.uppers).join(' ')}`;
      };
      bass.addEventListener('input', upd);
      up.addEventListener('input', upd);
      const figs = h('span', 'muted-line');
      line.append(Object.assign(h('span', 'muted-line'), { textContent: `${i + 1}.` }), bass, up, cls, figs, button('Remove', () => { rows.splice(i, 1); draw(); }, 'tiny'));
      list.append(line);
      upd();
    });
    summary.replaceChildren(note(`Harpsichord texture: consonant, three upper parts, light touch; mf, the bass doubled at the lower octave; f, also chord tones in the left hand; ff, as f with a quick arpeggio from below (Q XVII.vi, p. 259). ${sampler.instrument.group === 'Piano' ? 'The piano is set in Settings: the class is played as velocity.' : ''}`));
  }

  async function play() {
    sampler.stop();
    try {
      await sampler.activate();
    } catch {
      return;
    }
    const ac = sampler.context;
    const piano = sampler.instrument.group === 'Piano';
    const t0 = ac.currentTime + 0.1;
    let at = 0;
    for (const r of rows) {
      const p = parse(r);
      if (!p.ok) continue;
      const c = T.scaleClass(T.dissonanceClass(r.bass, p.uppers), level);
      if (piano) {
        const vel = T.PIANO_VELOCITY[c];
        [r.bass, ...p.uppers].forEach((n) => sampler.play(Note.midi(n)!, t0 + at, 1.7, vel));
      } else {
        const tex = T.harpsichordTexture(c, r.bass, p.uppers);
        tex.midis.forEach((m, k) => sampler.play(m, t0 + at + (tex.arpeggio ? k * 0.03 : 0), 1.7, 1));
      }
      at += 2;
    }
  }
  draw();
}

// ---------- 7. Messa di voce ----------

function messaDiVoce(box: HTMLElement) {
  head(box, 'Tool', 'Messa di Voce and Bow Divisions', 'A long note drawn as a loudness envelope. This is a picture, not a sound: a harpsichord cannot swell. The keyboard substitutes below can be played.');
  const stage = h('div');
  const cap = note('');
  function draw(id: string) {
    const e = T.ENVELOPES.find((x) => x.id === id)!;
    const W = 560;
    const H = 150;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'envelope' });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${e.label}: soft, loud in the middle, soft again`);
    s('line', { x1: 30, x2: W - 10, y1: H - 24, y2: H - 24, class: 'roll-beat' }, svg);
    const pts = e.points.map(([t, l]) => `${30 + t * (W - 40)},${H - 24 - l * (H - 50)}`);
    s('polygon', { points: `30,${H - 24} ${pts.join(' ')} ${W - 10},${H - 24}`, class: 'env-fill' }, svg);
    s('polyline', { points: pts.join(' '), class: 'env-line' }, svg);
    for (const [x, t] of [[30, 'pp'], [30 + (W - 40) / 2, 'loudest'], [W - 10, 'pp']] as [number, string][]) s('text', { x, y: H - 6, class: 'roll-label', 'text-anchor': x === 30 ? 'start' : x === W - 10 ? 'end' : 'middle' }, svg).textContent = t;
    stage.replaceChildren(svg);
    cap.textContent = `${e.note} (${e.source})`;
  }
  box.append(choices(T.ENVELOPES.map((e) => [e.id, e.label] as [string, string]), 'quantz', draw, 'Envelope'), stage, cap);
  draw('quantz');

  const sub = h('div', 'subtool');
  sub.append(h('h4', 'mini-title', 'Keyboard Substitutes'), note('A keyboard cannot swell a long note, so the player fills it. Each pattern lasts four crotchets.'));
  for (const p of T.SUBSTITUTES) {
    const r = h('div', 'pl-row');
    r.append(button(`▶ ${p.label}`, () => void playLayers([[p.notes]], 60, false), 'seg-btn'), note(p.text));
    sub.append(r);
  }
  box.append(sub);
}

// ---------- entry ----------

const TOOLS: Record<string, (box: HTMLElement) => void> = {
  'quantz-tempo': quantzTempoTool,
  'appoggiatura-lab': appoggiaturaLab,
  'rhythm-lab': rhythmLab,
  'trill-builder': trillBuilder,
  'breath-planner': breathPlanner,
  'dissonance-dynamics': dissonanceDynamics,
  'messa-di-voce': messaDiVoce,
};

export function mountHipTool(box: HTMLElement, id: string): void {
  TOOLS[id]?.(box);
}
