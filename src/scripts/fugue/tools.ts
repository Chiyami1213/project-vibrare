// The interactive tools of the fugue pages: answer generator, stretto finder, invertible counterpoint calculator,
// inversion mirror, entry orders, Fux's plan, timeline, terms, quiz (theory), and the analysis worksheet and proportion
// calculator (analysis). The logic is in pure.ts (tested against the pack's reference page); this is the page.
import {
  DC, DC_PRESETS, DEGREE_SIGNS, FUX_PLAN, KEYS, PROPORTION_DEMOS, QUIZ, SUBJECTS, TERMS_EVOLUTION, TIMELINE, TIMELINE_TAGS, VOICES,
  dcAnalyse, delayLabel, entryOrders, fuxPlanSteps, invertedUpper, lineLength, makeAnswer, mirror, nameOf, parseLengths, parseLine, proportions,
  strettoSearch, toNotes, worksheetDemo, worksheetMarkdown,
} from './pure';
import type { LineNote, Worksheet } from './pure';
import { button, choices, h, head, showScore } from '../tool-kit';

// ---------- helpers ----------

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

function field(label: string, value = '', wide = true): { wrap: HTMLElement; input: HTMLInputElement } {
  const input = h('input', 'pl-select txt');
  input.type = 'text';
  input.value = value;
  input.spellcheck = false;
  input.setAttribute('aria-label', label);
  const wrap = h('label', wide ? 'pl-inline txt-field' : 'pl-inline');
  wrap.append(`${label} `, input);
  return { wrap, input };
}

const note = (text: string, cls = 'muted-line') => h('p', cls, text);
const bad = (text: string) => note(text, 'verdict bad');

function table(rows: (string | Node)[][], cls?: (r: number, c: number) => string): HTMLElement {
  const scroll = h('div', 'table-scroll');
  const t = h('table', 'data-table');
  rows.forEach((r, ri) => {
    const tr = h('tr');
    r.forEach((c, ci) => {
      const cell = h(ci === 0 ? 'th' : 'td');
      if (ci === 0) cell.scope = 'row';
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

const subjectOptions = Object.keys(SUBJECTS).map((k) => [k, k] as [string, string]);
const keyOptions = Object.keys(KEYS).map((k) => [k, k] as [string, string]);
const rest = (d: number): LineNote => ({ rest: 1, d });
const clean = (arr: (LineNote | null)[]): LineNote[] | null => (arr.length && !arr.some((x) => !x) ? (arr as LineNote[]) : null);

// ---------- answer generator ----------

function answerGenerator(box: HTMLElement, preset?: string) {
  head(box, 'Tool', 'Answer Generator', 'Type a subject, or pick one, and see the answer Marpurg’s rules give: ① and ⑤ exchanged at the head, a skip between ⑤ and ① answered by the skip between ① and ⑤, and a theme that ends on the dominant led back to the tonic. Notes answered at the fourth instead of the fifth are marked ✱. Modes (Fux) answer diatonically within the mode; keys (Marpurg) answer with exact intervals in the dominant key.');
  const start = preset === 'answer2' ? 'C major · rises to the dominant (tail mutation)' : 'D mode · Fux-style, diatonic';
  let kind: 'tonal' | 'real' = 'tonal';
  const txt = field('Subject (Notes and Durations)', SUBJECTS[start].line);
  const key = select(keyOptions, SUBJECTS[start].key, () => run(), 'Key or Mode');
  const pre = select(subjectOptions, start, (v) => {
    txt.input.value = SUBJECTS[v].line;
    key.sel.value = SUBJECTS[v].key;
    run();
  }, 'Subject');
  const info = h('div');
  const stage = h('div', 'fux-stage');
  const row = h('div', 'pl-row');
  row.append(pre.wrap, key.wrap);
  box.append(
    row,
    choices([['tonal', 'Tonal (Rules)'], ['real', 'Real (Exact)']], kind, (v) => { kind = v as 'tonal' | 'real'; run(); }, 'Answer type'),
    txt.wrap,
    button('Answer It', () => run()),
    note('Format: pitch/duration, for example D4/2 is a D half note, F#4/8 an F♯ eighth, r/4 a quarter rest. Durations 1 2 4 8 16; add a dot for dotted.'),
    info,
    stage,
  );
  txt.input.addEventListener('keydown', (e) => e.key === 'Enter' && run());

  function run() {
    info.replaceChildren();
    const line = clean(parseLine(txt.input.value));
    if (!line) return info.append(bad('Could not read the subject. Check the format.'));
    const { answer, deg } = makeAnswer(line, key.sel.value, kind);
    const notes = line.filter((n) => !n.rest);
    const muts = answer.filter((n) => n.mut).length;
    const strip = (n: LineNote) => nameOf(n.p!).replace(/\d/, '');
    info.append(
      table([
        ['Subject', ...notes.map(strip)],
        ['Degree', ...deg.map((d) => DEGREE_SIGNS[d])],
        ['Answer', ...answer.filter((n) => !n.rest).map((n) => strip(n) + (n.mut ? '✱' : ''))],
      ], (r, c) => (r === 2 && c > 0 && answer.filter((n) => !n.rest)[c - 1].mut ? 'cell-pure' : '')),
      note(muts === 0
        ? 'Real answer: an exact transposition to the dominant (the theme keeps the character of the key).'
        : `Tonal answer: ${muts} note${muts > 1 ? 's' : ''} answered at the 4th (✱), so that the answer stays in the key. Compare Fux’s exchange of fifth and fourth (p. 80) and Marpurg’s adjustment of the melodic line (p. 166).`),
    );
    const len = lineLength(line);
    showScore(stage, [
      { role: 'cpt', notes: toNotes([rest(len), ...answer]) },
      { role: 'cpt', notes: toNotes([...line, rest(len)]) },
    ], `Subject, then ${muts ? 'tonal' : 'real'} answer`);
  }
  run();
}

// ---------- stretto finder ----------

function strettoFinder(box: HTMLElement) {
  head(box, 'Tool', 'Stretto Finder', 'Tries the subject against itself at every entry distance and at the usual intervals (octave, fifth above, fourth below, unison), in two voices. It counts dissonances on strong beats and parallel fifths or octaves. Fewer is better; zero is a candidate for a stretto. Marpurg: “test each theme for stretto” before writing (p. 191).');
  const start = 'C major · stays in the tonic (real answer)';
  let beat = 0.5;
  const txt = field('Subject', SUBJECTS[start].line);
  const key = select(keyOptions, SUBJECTS[start].key, () => run(), 'Key or Mode');
  const pre = select(subjectOptions, start, (v) => { txt.input.value = SUBJECTS[v].line; key.sel.value = SUBJECTS[v].key; run(); }, 'Subject');
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const row = h('div', 'pl-row');
  row.append(pre.wrap, key.wrap);
  box.append(row, choices([['0.5', 'Strong Beat = Half Note'], ['0.25', 'Strong Beat = Quarter Note']], '0.5', (v) => { beat = Number(v); run(); }, 'Strong beats'), txt.wrap, button('Find Strettos', () => run()), out, stage);

  function run() {
    out.replaceChildren();
    const line = clean(parseLine(txt.input.value));
    if (!line) return out.append(bad('Could not read the subject.'));
    const res = strettoSearch(line, key.sel.value, beat);
    const rows: (string | Node)[][] = [['Entry After', 'Interval', 'Strong-Beat Dissonances', 'Parallel 5ths or 8ves', '']];
    const top = res.slice(0, 8);
    const show = (r: (typeof top)[number], title: string) => showScore(stage, [{ role: 'cpt', notes: toNotes(r.up) }, { role: 'cpt', notes: toNotes(r.lo) }], title);
    for (const r of top) {
      rows.push([delayLabel(r.dly), r.lab, String(r.diss), String(r.par), button('Show', () => show(r, `Stretto: ${r.lab}, entry after ${delayLabel(r.dly)}`), 'tiny')]);
    }
    const t = table(rows, (ri, c) => (ri > 0 && top[ri - 1].score === 0 ? 'cell-pure' : ''));
    out.append(t, note('Dissonances on weak beats are not counted: listen, and judge whether they work as passing notes. The follower is transposed diatonically in the key.'));
    if (res[0]) show(res[0], `Best candidate: ${res[0].lab}, entry after ${delayLabel(res[0].dly)}`);
  }
  run();
}

// ---------- invertible counterpoint ----------

function dcCalculator(box: HTMLElement) {
  head(box, 'Tool', 'Invertible Counterpoint Calculator', 'Enter two parts (upper and lower). The tool lists the intervals, shows what each becomes when the parts are exchanged at the octave, tenth or twelfth (Fux’s tables: 9 − x, 11 − x, 13 − x), flags the rule each species forbids, and plays the inverted version.');
  let sp: 8 | 10 | 12 = 8;
  const first = Object.keys(DC_PRESETS)[0];
  const up = field('Upper Part', DC_PRESETS[first].up);
  const lo = field('Lower Part', DC_PRESETS[first].lo);
  const pre = select(Object.keys(DC_PRESETS).map((k) => [k, k] as [string, string]), first, (v) => { up.input.value = DC_PRESETS[v].up; lo.input.value = DC_PRESETS[v].lo; run(); }, 'Example');
  const rules = h('ul', 'bg-points');
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const cap = note('');
  let swapped = false;
  const swap = button('Exchange the Parts', () => { swapped = !swapped; swap.setAttribute('aria-pressed', String(swapped)); draw(); }, 'seg-btn');
  swap.setAttribute('aria-pressed', 'false');
  box.append(pre.wrap, choices([['8', 'At the Octave'], ['10', 'At the Tenth'], ['12', 'At the Twelfth']], '8', (v) => { sp = Number(v) as 8 | 10 | 12; run(); }, 'Species'), up.wrap, lo.wrap, button('Check', () => run()), rules, out, swap, stage, cap);
  let U: LineNote[] = [];
  let Lo: LineNote[] = [];

  function draw() {
    const S = DC[sp];
    const title = `Original and inverted at the ${S.name}`;
    if (!swapped) showScore(stage, [{ role: 'cpt', notes: toNotes(U) }, { role: 'cpt', notes: toNotes(Lo) }], title);
    else showScore(stage, [{ role: 'cpt', notes: toNotes(Lo) }, { role: 'cpt', notes: toNotes(invertedUpper(U, sp)) }], `${title}: parts exchanged`);
    cap.textContent = `The second version has the lower part on top and the upper part moved down a ${S.name}. Accidentals are kept as written; a real inversion at the tenth or twelfth may need a B♭ or a sharp “so that all intervals will correspond” (Fux, p. 123).`;
  }

  function run() {
    const u = clean(parseLine(up.input.value));
    const l = clean(parseLine(lo.input.value));
    rules.replaceChildren(...DC[sp].rules.map((r) => h('li', '', r)));
    out.replaceChildren();
    if (!u || !l) return out.append(bad('Could not read a part.'));
    U = u;
    Lo = l;
    const rows = dcAnalyse(u, l, sp);
    out.append(
      table([
        ['Interval', ...rows.map((r) => String(r.x))],
        ['Inverted', ...rows.map((r) => (r.inv ? String(r.inv) : '—'))],
      ], (ri, c) => (c > 0 && rows[c - 1].flags.length ? 'cell-bad' : '')),
      note(rows.some((r) => r.flags.length) ? `Problems: ${rows.filter((r) => r.flags.length).map((r) => r.flags.join(', ')).join(' · ')}` : `No problems for double counterpoint at the ${DC[sp].name}.`, rows.some((r) => r.flags.length) ? 'verdict bad' : 'verdict good'),
    );
    swapped = false;
    swap.setAttribute('aria-pressed', 'false');
    draw();
  }
  run();
}

// ---------- inversion mirror ----------

function inversionMirror(box: HTMLElement) {
  head(box, 'Tool', 'Inversion Mirror', 'Free inversion turns every step the other way. Strict inversion keeps the half steps by mirroring the scale around a fixed axis: Fux’s Dorian d ↔ d, e ↔ c, f ↔ b, g ↔ a (p. 130); Marpurg’s major scale on ① against the descending scale on ③; minor on ① against ⑦ (pp. 146–148).');
  let how: 'strict' | 'free' = 'strict';
  const txt = field('Line to Invert', 'D4/2 F4/2 E4/2 D4/2 G4/2 F4/2 E4/2 D4/2');
  const key = select(keyOptions, 'D mode', () => run(), 'Key or Mode');
  const info = note('');
  const stage = h('div', 'fux-stage');
  box.append(key.wrap, choices([['strict', 'Strict'], ['free', 'Free']], how, (v) => { how = v as 'strict' | 'free'; run(); }, 'Inversion'), txt.wrap, button('Invert', () => run()), info, stage);
  function run() {
    const line = clean(parseLine(txt.input.value));
    if (!line || !line.some((n) => !n.rest)) return void (info.textContent = 'Could not read the line.');
    const { inv, label } = mirror(line, key.sel.value, how);
    info.textContent = label;
    const lower = inv.map((n): LineNote => (n.rest ? n : { p: { step: n.p!.step - 7, acc: n.p!.acc }, d: n.d }));
    showScore(stage, [{ role: 'cpt', notes: toNotes(line) }, { role: 'cpt', notes: toNotes(lower) }], `${how === 'strict' ? 'Strict' : 'Free'} inversion`);
  }
  run();
}

// ---------- entry orders ----------

function entryOrderTool(box: HTMLElement) {
  head(box, 'Tool', 'Entry Orders in Four Voices', 'Marpurg counts 24 orders (pp. 178–179). In the regular exposition the voices pair inner with outer, soprano with tenor and alto with bass: entries 1 and 3 have the theme, 2 and 4 the answer, so each pair shares a form. Pick an order to see whether it pairs correctly.');
  const grid = h('div', 'chip-row');
  const view = h('div', 'order-view');
  const NAMES: Record<string, string> = { S: 'Soprano', A: 'Alto', T: 'Tenor', B: 'Bass' };
  function show(o: string[], regular: boolean) {
    view.replaceChildren();
    for (const v of VOICES) {
      const i = o.indexOf(v);
      const form = i % 2 === 0 ? 'theme' : 'answer';
      const lane = h('div', 'lane');
      const bar = h('div', 'lane-bar');
      const seg = h('span', `seg-b ${form}`, `${i + 1}. ${form}`);
      seg.style.marginLeft = `${i * 22}%`;
      bar.append(seg);
      lane.append(h('span', 'lane-l', NAMES[v]), bar);
      view.append(lane);
    }
    view.append(note(regular
      ? `Regular: the theme goes to one pair (${o[0]}–${o[2]}), the answer to the other (${o[1]}–${o[3]}).`
      : 'Irregular for a first exposition: the paired voices do not share the same form. Marpurg keeps such orders for later expositions (“extraordinary cases”).'));
  }
  const chips: HTMLButtonElement[] = [];
  for (const { order, regular } of entryOrders()) {
    const b = button(order.join(' '), () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      show(order, regular);
    }, `chip ${regular ? 'ok' : 'no'}`);
    b.setAttribute('aria-pressed', 'false');
    chips.push(b);
    grid.append(b);
  }
  box.append(note('Green: regular. Red: irregular.'), grid, view);
  chips[0].setAttribute('aria-pressed', 'true');
  show(['S', 'A', 'T', 'B'], true);
}

// ---------- Fux's plan ----------

function fuxPlan(box: HTMLElement) {
  head(box, 'Tool', 'Fux’s Plan for a Two-Part Fugue, Mode by Mode', 'Pick a mode to see where its cadences fall, following Fux’s rule and his stated exceptions (pp. 82–89).');
  const out = h('div');
  function draw(m: string) {
    const ol = h('ol', 'plan');
    for (const [a, b] of fuxPlanSteps(m)) {
      const li = h('li');
      li.append(Object.assign(h('b'), { textContent: a }), ` — ${b}`);
      ol.append(li);
    }
    out.replaceChildren(ol, note(FUX_PLAN[m][4]));
  }
  box.append(choices(Object.keys(FUX_PLAN).map((k) => [k, `${k} Mode`] as [string, string]), 'D', draw, 'Mode'), out);
  draw('D');
}

// ---------- timeline and terms ----------

function timelineTool(box: HTMLElement) {
  head(box, 'Tool', 'Timeline of Fugal Theory', 'Filter by topic to follow one idea through six centuries.');
  const list = h('ol', 'timeline-list');
  function draw(f: string) {
    list.replaceChildren();
    for (const [year, who, idea, tag] of TIMELINE) {
      if (f !== 'all' && tag !== f) continue;
      const li = h('li');
      li.append(h('span', 'tl-year', String(year)));
      const main = h('span', 'tl-main');
      main.append(Object.assign(h('b'), { textContent: who }), ` ${idea}`);
      li.append(main);
      list.append(li);
    }
  }
  box.append(choices(TIMELINE_TAGS, 'all', draw, 'Topic'), list);
  draw('all');
}

function termsTool(box: HTMLElement) {
  head(box, 'Tool', 'How the Words Changed', 'Search a term to see how its meaning moved.');
  const q = h('input', 'pl-select txt');
  q.type = 'search';
  q.placeholder = 'search terms';
  q.setAttribute('aria-label', 'Search terms');
  const dl = h('dl', 'def-list');
  function draw() {
    dl.replaceChildren();
    const s = q.value.toLowerCase();
    for (const [t, d] of TERMS_EVOLUTION) {
      if (s && !(t + d).toLowerCase().includes(s)) continue;
      dl.append(h('dt', '', t), h('dd', '', d));
    }
  }
  q.addEventListener('input', draw);
  box.append(q, dl);
  draw();
}

// ---------- quiz ----------

function quizTool(box: HTMLElement) {
  head(box, 'Self-Test', 'Check Yourself', 'Twelve questions across the book.');
  const area = h('div');
  let i = 0;
  let score = 0;
  function show() {
    area.replaceChildren();
    if (i >= QUIZ.length) {
      area.append(note(`Score: ${score} of ${QUIZ.length}`, 'verdict meh'), button('Again', () => { i = 0; score = 0; show(); }));
      return;
    }
    const { q, options, answer, why } = QUIZ[i];
    const p = h('p');
    p.append(Object.assign(h('b'), { textContent: `${i + 1}. ` }), q);
    const fb = h('p', 'muted-line');
    fb.setAttribute('aria-live', 'polite');
    const row = h('div', 'chip-row');
    let done = false;
    options.forEach((o, j) => row.append(button(o, () => {
      if (done) return;
      done = true;
      const good = j === answer;
      if (good) score++;
      fb.textContent = `${good ? '✓ Right. ' : '✗ Not quite. '}${why}`;
      fb.className = good ? 'verdict good' : 'verdict bad';
      area.append(button('Next →', () => { i++; show(); }));
    }, 'seg-btn')));
    area.append(p, row, fb);
  }
  box.append(area);
  show();
}

// ---------- analysis worksheet ----------

function analysisWorksheet(box: HTMLElement) {
  head(box, 'Tool', 'Fugue Analysis Worksheet', 'A form to fill in for any fugue: the element map, the counterpoint and episodes, the notable properties after Roberts’ six kinds, the lengths of the integrants and digressions, and a verdict with reasons. Export it as Markdown or JSON. It starts with the C minor fugue of the case study.');
  const w: Worksheet = worksheetDemo();
  const text = (label: string, get: () => string, set: (v: string) => void, wide = true) => {
    const f = field(label, get(), wide);
    f.input.addEventListener('input', () => { set(f.input.value); sync(); });
    return f.wrap;
  };
  const area = (label: string, get: () => string, set: (v: string) => void) => {
    const t = h('textarea', 'pl-select txt');
    t.rows = 3;
    t.value = get();
    t.setAttribute('aria-label', label);
    t.addEventListener('input', () => { set(t.value); sync(); });
    const l = h('label', 'pl-inline txt-field');
    l.append(`${label} `, t);
    return l;
  };
  const top = h('div', 'pl-row');
  top.append(text('Work', () => w.work, (v) => (w.work = v)), text('Key', () => w.key, (v) => (w.key = v), false), text('Voices', () => w.voices, (v) => (w.voices = v), false));

  const entries = h('div', 'ws-entries');
  function drawEntries() {
    entries.replaceChildren();
    w.entries.forEach((e, i) => {
      const r = h('div', 'pl-row ws-entry');
      for (const [k, label] of [['bar', 'Bar'], ['voice', 'Voice'], ['key', 'Key'], ['device', 'Device']] as const) {
        const f = field(label, e[k], false);
        f.input.size = k === 'device' ? 16 : 6;
        f.input.addEventListener('input', () => { e[k] = f.input.value; sync(); });
        r.append(f.wrap);
      }
      r.append(button('Remove', () => { w.entries.splice(i, 1); drawEntries(); sync(); }, 'tiny'));
      entries.append(r);
    });
  }
  drawEntries();

  const props = h('div', 'ws-props');
  w.properties.forEach((p) => {
    const row = h('div', 'pl-row');
    const cb = h('input');
    cb.type = 'checkbox';
    cb.checked = p.checked;
    cb.addEventListener('change', () => { p.checked = cb.checked; sync(); });
    const lab = h('label', 'pl-inline');
    lab.append(cb, ` ${p.type}`);
    row.append(lab, text('Note', () => p.note, (v) => (p.note = v)));
    props.append(row);
  });

  const verdict = select([['rhetorical', 'Rhetorical'], ['literal', 'Literal'], ['not stated', 'Not Stated']], w.verdict, (v) => { w.verdict = v as Worksheet['verdict']; sync(); }, 'Verdict');
  const outBox = h('pre', 'ws-out');
  outBox.setAttribute('aria-label', 'The worksheet as Markdown');
  const status = note('');
  function sync() {
    outBox.textContent = worksheetMarkdown(w);
  }
  const save = (name: string, body: string, type: string) => {
    const a = h('a');
    a.href = URL.createObjectURL(new Blob([body], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copy = async (body: string, what: string) => {
    try {
      await navigator.clipboard.writeText(body);
      status.textContent = `${what} copied.`;
    } catch {
      status.textContent = 'Copying is not allowed here. Use Download.';
    }
  };
  const bar = h('div', 'chip-row');
  bar.append(
    button('Copy as Markdown', () => void copy(worksheetMarkdown(w), 'Markdown'), 'seg-btn'),
    button('Copy as JSON', () => void copy(JSON.stringify(w, null, 2), 'JSON'), 'seg-btn'),
    button('Download Markdown', () => save('fugue-analysis.md', worksheetMarkdown(w), 'text/markdown'), 'seg-btn'),
    button('Download JSON', () => save('fugue-analysis.json', JSON.stringify(w, null, 2), 'application/json'), 'seg-btn'),
  );
  const h3 = (t: string) => h('h4', 'mini-title', t);
  box.append(
    top,
    h3('Entries (Subject and Answer)'), entries, button('Add an Entry', () => { w.entries.push({ bar: '', voice: '', key: '', device: '' }); drawEntries(); sync(); }, 'seg-btn'),
    h3('Countersubject and Episodes'), area('Notes', () => w.episodes, (v) => (w.episodes = v)),
    h3('Notable Properties'), props,
    h3('Integrants and Digressions'), text('Lengths in Bars (Comma-Separated)', () => w.lengths, (v) => (w.lengths = v)),
    h3('Verdict'), verdict.wrap, area('Reasons', () => w.reasons, (v) => (w.reasons = v)),
    h3('Export'), bar, status, outBox,
  );
  sync();
}

// ---------- proportion calculator ----------

function proportionCalculator(box: HTMLElement) {
  head(box, 'Tool', 'Proportion Calculator', 'Enter section lengths (in bars or beats). They are drawn as a bar chart, with successive growth or shrinking, palindromes, and ratios close to 1:1, 2:1, 3:2, 4:3 and 5:4 (within 10 per cent) flagged.');
  const txt = field('Lengths', PROPORTION_DEMOS[0][1]);
  const pre = select(PROPORTION_DEMOS.map(([n, v]) => [v, n] as [string, string]), PROPORTION_DEMOS[0][1], (v) => { txt.input.value = v; run(); }, 'Example');
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(pre.wrap);
  box.append(row, txt.wrap, button('Calculate', () => run()), out);
  txt.input.addEventListener('input', run);
  function run() {
    out.replaceChildren();
    const lengths = parseLengths(txt.input.value);
    if (!lengths) return out.append(note('Enter at least two positive numbers, such as 2, 3, 3.5, 5.', 'verdict bad'));
    const pr = proportions(lengths);
    const max = Math.max(...lengths);
    const chart = h('div', 'prop-chart');
    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', `Bar chart of the lengths ${lengths.join(', ')}`);
    lengths.forEach((v, i) => {
      const col = h('div', 'prop-col');
      const bar = h('div', 'prop-bar');
      bar.style.height = `${Math.max(6, (v / max) * 120)}px`;
      col.append(h('span', 'prop-v', String(v)), bar, h('span', 'prop-i', String(i + 1)));
      chart.append(col);
    });
    const flags: string[] = [];
    if (pr.growing) flags.push('Each section is longer than the one before (successive growth).');
    if (pr.shrinking) flags.push('Each section is shorter than the one before.');
    if (pr.palindrome) flags.push('The lengths read the same backwards: a palindrome.');
    const rt = pr.ratios.filter((r) => r.name).map((r) => `${r.from} to ${r.to} is about ${r.name}`);
    out.append(chart, note(flags.length ? flags.join(' ') : 'No growth, shrinking or palindrome.'), note(rt.length ? `Simple ratios between neighbours: ${rt.join('; ')}.` : 'No neighbouring sections are close to a simple ratio.'));
  }
  run();
}

// ---------- entry ----------

const TOOLS: Record<string, (box: HTMLElement, preset?: string) => void> = {
  'answer-generator': answerGenerator,
  'stretto-finder': strettoFinder,
  'dc-calculator': dcCalculator,
  'inversion-mirror': inversionMirror,
  'entry-orders': entryOrderTool,
  'fux-plan': fuxPlan,
  timeline: timelineTool,
  'terms-evolution': termsTool,
  quiz: quizTool,
  'analysis-worksheet': analysisWorksheet,
  'proportion-calculator': proportionCalculator,
};

export function mountFugueTool(box: HTMLElement, id: string, preset?: string): void {
  TOOLS[id]?.(box, preset);
}
