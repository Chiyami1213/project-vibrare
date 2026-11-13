// The interactive tools of the partimento pages. The logic is in tools-pure.ts (tested on the pack's data); this file is
// the page: controls, scores (the shared Example Player) and sound on the instrument chosen in Settings.
import * as T from './tools-pure';
import type { ToolExample, ToolPattern } from './tools-pure';
import { playableNotes, MAJOR_KEYS, MINOR_KEYS, keyLabel } from './model';
import type { ExampleData, PlayNote, RealizedEvent } from './model';
import { sectionOfGroup } from '../../data/partimento/sections';
import { button, choices, h, head, showExample } from '../tool-kit';
import { sampler } from '../sampler';

const BASE = '/theory/partimento';
const patternUrl = (p: { id: string; group: string }) => `${BASE}/${sectionOfGroup(p.group).slug}/${p.id}/`;
const note = (text: string, cls = 'muted-line') => h('p', cls, text);

// ---------- data ----------

let dataPromise: Promise<ToolPattern[]> | null = null;
function loadPatterns(): Promise<ToolPattern[]> {
  dataPromise ??= fetch(`${BASE}/tools-data.json`).then((r) => r.json()).then((j: { patterns: ToolPattern[] }) => j.patterns);
  return dataPromise;
}
const examplesOf = (ps: ToolPattern[]) => ps.flatMap((p) => p.ex.map((e) => ({ p, e })));
const findExample = (ps: ToolPattern[], id: string): ToolExample | undefined => examplesOf(ps).find((x) => x.e.id === id)?.e;
const isMinor = (key: string) => key === key.toLowerCase();

// ---------- sound ----------

const BPM = 64;
async function playNotes(groups: { notes: PlayNote[]; at: number }[], bpm = BPM): Promise<void> {
  sampler.stop();
  try {
    await sampler.activate();
  } catch {
    return;
  }
  const ac = sampler.context;
  const beat = 60 / bpm;
  const t0 = ac.currentTime + 0.1;
  for (const g of groups) for (const n of g.notes) sampler.play(n.midi, t0 + (g.at + n.start) * beat, n.dur * beat * 0.96, n.voice === 0 ? 1 : 0.85);
}
const exampleBeats = (ex: ExampleData) => ex.realized.lengthBeats;
const playExample = (ex: ExampleData) => playNotes([{ notes: playableNotes(ex), at: 0 }]);

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

const link = (p: { id: string; group: string; name: string }) => Object.assign(h('a'), { href: patternUrl(p), textContent: p.name });

/** One voice (the bass) as an example. */
function lineExample(id: string, title: string, pitches: string[]): ExampleData {
  const events: RealizedEvent[] = pitches.map((p, i) => ({ t: i, d: 1, pitch: p }));
  return { id, title, key: 'C', meter: '4/4', beatUnit: 'quarter', parts: 1, realized: { voiceOrder: 'bass', lengthBeats: pitches.length, voices: [events] } };
}

// ---------- 1. bass-motion explorer ----------

const MOVES: [string, string][] = [2, 3, 4, 5, 6].flatMap((n) => [[`${n}u`, `${n}th Up`], [`${n}d`, `${n}th Down`]] as [string, string][]).map(([v, t]) => [v, t.replace('2th', '2nd').replace('3th', '3rd')] as [string, string]);
const toMove = (v: string): T.Move => ({ size: Number(v[0]), dir: v[1] === 'u' ? 1 : -1 });

function bassMotionExplorer(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Bass-Motion Explorer', 'Choose two moves of the bass, which repeat in turn, and a starting degree. The tool draws the bass line and lists the patterns that move that way. Swapping the two moves (A then B, against B then A) gives another pattern: the metric inversion.');
  let first = '4d';
  let second = '2u';
  let start = 1;
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const pair = (): T.MovePair => [toMove(first), toMove(second)];
  const row = h('div', 'pl-row');
  row.append(
    select(MOVES, first, (v) => { first = v; run(); }, 'First Move').wrap,
    select(MOVES, second, (v) => { second = v; run(); }, 'Then').wrap,
    select([1, 2, 3, 4, 5, 6, 7].map((d) => [String(d), `Degree ${d}`] as [string, string]), '1', (v) => { start = Number(v); run(); }, 'Start').wrap,
  );
  const swap = button('Swap the Moves', () => { [first, second] = [second, first]; sels[0].value = first; sels[1].value = second; run(); }, 'seg-btn');
  row.append(swap);
  const sels = [...row.querySelectorAll('select')];
  box.append(row, out, stage);
  const moti = patterns.filter((p) => p.group.startsWith('moti-'));

  function run() {
    const p = pair();
    const steps = T.bassSteps(start, p, 8);
    out.replaceChildren();
    const chips = h('p', 'deg-strip');
    T.degreesOf(steps).forEach((d, i) => chips.append(Object.assign(h('span', 'degree'), { textContent: '①②③④⑤⑥⑦'[d - 1] }), i < 7 ? ' ' : ''));
    out.append(chips);
    const m = T.matchMoti(p, moti);
    const named = (id: string) => moti.find((x) => x.id === id)!;
    const list = h('ul', 'bg-points');
    const add = (label: string, id: string | string[]) => {
      const li = h('li', '', `${label} `);
      for (const [i, x] of (Array.isArray(id) ? id : [id]).entries()) {
        if (i) li.append(', ');
        li.append(link(named(x)));
      }
      list.append(li);
    };
    if (m.exact) add(`This is the pattern`, m.exact);
    if (m.same.length) add('The same line is made by', m.same);
    if (m.stepwise.length) add('Two steps the same way are the stepwise motions', m.stepwise);
    if (m.inverse) add(`The moves in the other order (${T.pairLabel([p[1], p[0]])}) are another pattern, the metric inversion`, m.inverse);
    if (!list.children.length) list.append(h('li', '', 'No pattern of the pack moves exactly this way. Try swapping the moves or choosing another pair.'));
    out.append(list);
    showExample(stage, lineExample('bass-motion', `Bass: ${T.pairLabel(p)}`, T.bassPitches(steps)));
  }
  run();
}

// ---------- 2. combination builder ----------

function combinationBuilder(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Combination Builder', 'Chain two to four schemata or bass motions into one phrase, in one key, and play it through. Only examples with the same number of parts and the same mode can be joined. It starts with the Romanesca followed by the Prinner.');
  let minor = false;
  let parts = 3;
  let key = 'C';
  const chain: ToolExample[] = [];
  const stage = h('div', 'fux-stage');
  const list = h('ol', 'bg-points');
  const pool = () => examplesOf(patterns.filter((p) => p.kind === 'schema' || p.kind === 'moto' || p.kind === 'combination')).filter(({ e }) => e.parts === parts && isMinor(e.key) === minor);
  const pick = h('select', 'pl-select');
  pick.setAttribute('aria-label', 'Example to add');
  const keySel = h('select', 'pl-select');
  keySel.setAttribute('aria-label', 'Key');
  const row = h('div', 'pl-row');
  row.append(button('Add to the Chain', () => { const e = pool().find((x) => x.e.id === pick.value)?.e; if (e && chain.length < 4) { chain.push(e); draw(); } }, 'seg-btn'));
  const addLabel = h('label', 'pl-inline');
  addLabel.append('Example ', pick);
  const keyLabelEl = h('label', 'pl-inline');
  keyLabelEl.append('Key ', keySel);
  const row0 = h('div', 'pl-row');
  row0.append(
    choices([['major', 'Major'], ['minor', 'Minor']], 'major', (v) => { minor = v === 'minor'; chain.length = 0; setKeys(); fillPick(); draw(); }, 'Mode'),
    choices([['2', '2 Parts'], ['3', '3 Parts'], ['4', '4 Parts']], '3', (v) => { parts = Number(v); chain.length = 0; fillPick(); draw(); }, 'Parts'),
  );
  box.append(row0, addLabel, row, keyLabelEl, list, stage);
  keySel.addEventListener('change', () => { key = keySel.value; draw(); });

  function setKeys() {
    keySel.replaceChildren();
    const keys = minor ? MINOR_KEYS : MAJOR_KEYS;
    key = keys[0];
    for (const k of keys) keySel.append(Object.assign(h('option'), { value: k, textContent: keyLabel(k), selected: k === key }));
  }
  function fillPick() {
    pick.replaceChildren();
    for (const { p, e } of pool()) pick.append(Object.assign(h('option'), { value: e.id, textContent: `${p.name}: ${e.title}` }));
  }
  function draw() {
    list.replaceChildren();
    chain.forEach((e, i) => {
      const li = h('li', '', `${e.title} `);
      li.append(
        button('↑', () => { if (i > 0) { [chain[i - 1], chain[i]] = [chain[i], chain[i - 1]]; draw(); } }, 'tiny'),
        ' ',
        button('↓', () => { if (i < chain.length - 1) { [chain[i + 1], chain[i]] = [chain[i], chain[i + 1]]; draw(); } }, 'tiny'),
        ' ',
        button('Remove', () => { chain.splice(i, 1); draw(); }, 'tiny'),
      );
      list.append(li);
    });
    if (!chain.length) {
      stage.replaceChildren(note('Add an example to start the chain.'));
      return;
    }
    const joined = T.chainExamples(chain, key);
    if (joined) showExample(stage, joined);
  }
  setKeys();
  fillPick();
  const seed = ['rom-3p', 'prin-3p'].map((id) => findExample(patterns, id)).filter((e): e is ToolExample => !!e);
  chain.push(...seed);
  draw();
}

// ---------- 3 and 8. quizzes ----------

function quiz(box: HTMLElement, patterns: ToolPattern[], kind: 'recognition' | 'ear', scope: string) {
  const isEar = kind === 'ear';
  head(box, 'Self-Test', isEar ? 'Ear-Training Quiz: Cadence Types' : 'Recognition Quiz', isEar ? 'Listen to a cadence, then name its type.' : 'Listen to the bass and the top voice, then name the pattern. Four choices, all from the same group.');
  const pool = isEar ? patterns.filter((p) => p.group.startsWith('cad-') && p.kind === 'cadence') : patterns.filter((p) => (scope === 'moti' ? p.group.startsWith('moti-') : p.group.startsWith('schemata-')) && p.kind !== 'combination');
  const r = T.rng(Math.floor(Math.random() * 1e9));
  let right = 0;
  let total = 0;
  let q: T.Question | null = null;
  const stage = h('div', 'fux-stage');
  const opts = h('div', 'chip-row');
  const fb = h('p', 'mot-verdict');
  fb.setAttribute('aria-live', 'polite');
  const listen = h('div', 'chip-row');
  box.append(listen, opts, fb, stage);
  function next() {
    stage.replaceChildren();
    fb.className = 'mot-verdict';
    fb.textContent = '';
    q = isEar ? T.earQuestion(pool, r) : T.recognitionQuestion(pool, r);
    if (!q) return void (fb.textContent = 'No question could be made.');
    const question = q;
    const ex = isEar ? question.example : T.reduceExample(question.example);
    listen.replaceChildren(button('▶ Listen', () => void playExample(ex), 'btn'), button('New Question', next, 'seg-btn'));
    opts.replaceChildren(...question.options.map((o) => button(o.name, () => answer(o.id), 'seg-btn')));
  }
  function answer(id: string) {
    if (!q || fb.dataset.done === q.example.id) return;
    const question = q;
    fb.dataset.done = question.example.id;
    total++;
    const ok = id === question.answer;
    if (ok) right++;
    fb.className = `mot-verdict ${ok ? 'ok' : 'no'}`;
    const right_ = question.options.find((o) => o.id === question.answer)!;
    fb.replaceChildren(`${ok ? 'Correct' : 'Not quite'} (${right}/${total}). It was `, ...(isEar ? [Object.assign(h('b'), { textContent: right_.name })] : [(() => { const p = patterns.find((x) => x.id === question.answer)!; return link(p); })()]), '. ', button('Next', next, 'btn'));
    showExample(stage, question.example);
  }
  next();
}

// ---------- 4. nomenclature builder ----------

const DEFS: Record<string, string> = {
  perfect: 'soprano and bass both on ①',
  imperfect: 'soprano (or bass) on ③',
  simple: 'all consonances',
  compound: 'a dissonance (a suspension) and then a consonance on ⑤',
  double: 'simple and compound on a sustained ⑤ (5/3, 6/4, 5/4, 5/3)',
};

function nomenclatureBuilder(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Nomenclature Builder', 'Name a cadence from its parts. The grammar of the notes: deceptive, perfect or imperfect, simple, compound or double, then Galant, Neapolitan, discant, alto or tenor, then half or Phrygian half, then “cadence”.');
  const c: T.NameChoice = { family: 'authentic', strength: 'perfect', form: 'compound', variety: 'none', phrygian: false };
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const rows = h('div');
  box.append(rows, out, stage);
  function controls() {
    rows.replaceChildren();
    const fam = select([['authentic', 'Authentic (⑤→①)'], ['half', 'Half (…→⑤)'], ['deceptive', 'Deceptive (⑤→⑥ or ⑤→♯④)'], ['discant', 'Discant (⑦→①)'], ['alto', 'Alto (④→③)'], ['tenor', 'Tenor (②→①)']], c.family, (v) => { c.family = v as T.Family; controls(); run(); }, 'Bass Motion');
    const r = h('div', 'pl-row');
    r.append(fam.wrap);
    if (c.family === 'authentic') r.append(select([['perfect', 'Perfect'], ['imperfect', 'Imperfect']], c.strength!, (v) => { c.strength = v as 'perfect' | 'imperfect'; run(); }, 'Strength').wrap);
    if (c.family !== 'half') r.append(select([['simple', 'Simple'], ['compound', 'Compound'], ['double', 'Double']], c.form, (v) => { c.form = v as T.NameChoice['form']; run(); }, 'Form').wrap);
    if (c.family === 'authentic' || c.family === 'deceptive' || c.family === 'half') {
      const opts: [string, string][] = c.family === 'half' ? [['none', 'None'], ['galant', 'Galant']] : [['none', 'None'], ['galant', 'Galant'], ['neapolitan', 'Neapolitan']];
      r.append(select(opts, c.variety ?? 'none', (v) => { c.variety = v as T.NameChoice['variety']; run(); }, 'Variety').wrap);
    }
    if (c.family === 'half') r.append(select([['no', 'Half'], ['yes', 'Phrygian Half (⑥→⑤)']], c.phrygian ? 'yes' : 'no', (v) => { c.phrygian = v === 'yes'; run(); }, 'Kind').wrap);
    rows.append(r);
  }
  function run() {
    const n = T.buildName(c);
    out.replaceChildren();
    const big = h('p', 'tempo-big');
    big.append(Object.assign(h('b'), { textContent: n.name }), ` · ${n.abbr}`);
    out.append(big);
    const defs: string[] = [];
    if (c.family === 'authentic') defs.push(`${c.strength}: ${DEFS[c.strength!]}`);
    if (c.family !== 'half') defs.push(`${c.form}: ${DEFS[c.form]}`);
    if (defs.length) out.append(note(defs.join(' · ')));
    const ids = T.cadenceIds(c, patterns);
    const withEx = ids.map((id) => patterns.find((p) => p.id === id)).filter((p): p is ToolPattern => !!p && p.ex.length > 0);
    if (!withEx.length) {
      stage.replaceChildren();
      return void out.append(note('The pack has no example of this one yet.'));
    }
    const ul = h('p', 'chip-row');
    for (const p of withEx) ul.append(button(`Show: ${p.name}`, () => showExample(stage, p.ex[0]), 'seg-btn'), link(p));
    out.append(ul);
    showExample(stage, withEx[0].ex[0]);
  }
  controls();
  run();
}

// ---------- 5. P–T–R grid ----------

function ptrGrid(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Preparation, Tension, Resolution', 'Each cadence as a row, cut into its three moments by the bass: the resolution is the last chord, the tension is what stands over the dominant, the preparation is what comes before. Select a cell to hear it.');
  let parts: 2 | 3 | 4 = 3;
  const out = h('div');
  const stage = h('div', 'fux-stage');
  box.append(choices([['2', '2 Parts'], ['3', '3 Parts'], ['4', '4 Parts']], '3', (v) => { parts = Number(v) as 2 | 3 | 4; draw(); }, 'Texture'), out, stage);
  function draw() {
    out.replaceChildren();
    const rows: (string | Node)[][] = [['Cadence', 'Preparation', 'Tension', 'Resolution', 'Whole']];
    for (const row of T.PTR_ROWS) {
      const id = row.ids[parts];
      const p = id ? patterns.find((x) => x.id === id) : undefined;
      const ex = p?.ex[0];
      if (!ex) {
        rows.push([row.label, '—', '—', '—', '—']);
        continue;
      }
      const ptr = T.splitPTR(ex);
      const cell = (r: T.Range, label: string) => (r.to - r.from < 1e-9 ? '—' : button(`▶ ${label}`, () => void playNotes([{ notes: T.rangeNotes(ex, r), at: 0 }]), 'tiny'));
      rows.push([row.label, cell(ptr.P, 'P'), cell(ptr.T, 'T'), cell(ptr.R, 'R'), button('▶ All', () => { void playExample(ex); showExample(stage, ex); }, 'tiny')]);
    }
    out.append(table(rows), note('A dash: the pack has no example of this cadence in this texture, or nothing comes before the tension.'));
  }
  draw();
}

// ---------- 6. clausulae mixer ----------

function clausulaeMixer(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Clausulae Mixer', 'Four voices carry four clausulae: cantizans, altizans, tenorizans and basizans. Whichever one is in the bass names the cadence. Choose it to see and hear the four-part example.');
  const out = h('div');
  const stage = h('div', 'fux-stage');
  box.append(choices(T.CLAUSULA_ORDER.map((c) => [c, c[0].toUpperCase() + c.slice(1)] as [string, string]), 'basizans', (v) => draw(v as T.Clausula), 'Clausula in the bass'), out, stage);
  const VOICES = ['Soprano', 'Alto', 'Tenor', 'Bass'];
  function draw(c: T.Clausula) {
    const info = T.CLAUSULAE[c];
    out.replaceChildren();
    const big = h('p', 'tempo-big');
    big.append(Object.assign(h('b'), { textContent: `${c[0].toUpperCase()}${c.slice(1)} in the bass: ${info.cadence}` }), ` · ${info.degrees}`);
    out.append(big);
    const rank = h('ol', 'bg-points');
    for (const n of T.CLAUSULA_ORDER) {
      const li = h('li', n === c ? 'rank-on' : '', `${n}: ${T.CLAUSULAE[n].cadence}`);
      if (n === c) li.style.fontWeight = '700';
      rank.append(li);
    }
    out.append(note('Conclusiveness, weakest to strongest:'), rank);
    const ex = findExample(patterns, info.example);
    if (!ex) return;
    const sung = T.voiceClausulae(ex).map((v, i) => `${VOICES[i]}: ${v ?? '—'}`);
    out.append(note(`In the example, the voices sing: ${sung.join('; ')}.`), button('▶ Play', () => void playExample(ex), 'btn'));
    showExample(stage, ex);
  }
  draw('basizans');
}

// ---------- 7. simple, compound, double ----------

function morphTool(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Simple, Compound, Double', 'Fenaroli’s three cadences on one bass, ①–⑤–①. The compound cadence puts a 4th over ⑤, the double lengthens ⑤ to four sonorities. Step from one to the next and watch the extra sonorities appear.');
  const ORDER = ['fen-simple', 'fen-comp', 'fen-double'];
  const NAMES = ['Simple', 'Compound', 'Double'];
  const stage = h('div', 'fux-stage');
  const chips = h('div', 'chip-row morph-chips');
  let timer = 0;
  const tabs = choices(NAMES.map((n, i) => [String(i), n] as [string, string]), '0', (v) => show(Number(v)), 'Cadence');
  box.append(tabs, button('Animate: Simple → Compound → Double', () => {
    window.clearTimeout(timer);
    const go = (i: number) => {
      show(i);
      tabs.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      if (i < 2) timer = window.setTimeout(() => go(i + 1), 2600);
    };
    go(0);
  }, 'seg-btn'), note('Over ⑤:'), chips, stage);
  function show(i: number) {
    const ex = findExample(patterns, ORDER[i]);
    if (!ex) return;
    chips.replaceChildren();
    const son = T.dominantSonorities(ex);
    son.forEach((s, k) => {
      const c = h('span', 'morph-chip', s);
      c.style.animationDelay = `${k * 0.35}s`;
      chips.append(c);
    });
    showExample(stage, ex);
  }
  show(0);
}

// ---------- 9. suspension finder ----------

function suspensionFinder(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Suspension Finder', 'Give a bass line, as note names (C3 D3 G2) or scale degrees (1 2 5), or pick an example. The tool marks each bass step where a 4–3, a 7–6 or a 9–8 can be prepared, after the bass-motion rules of the masters. That is how an unfigured bass was read.');
  const pool = examplesOf(patterns.filter((p) => p.group === 'suspensions' || p.group.startsWith('moti-') || p.group === 'rule-of-octave')).filter(({ e }) => e.parts >= 2);
  const input = h('input', 'pl-select txt');
  input.type = 'text';
  input.value = 'C3 G3 C3 F3 G3 C3';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Bass line');
  const pre = h('select', 'pl-select');
  pre.setAttribute('aria-label', 'Example');
  pre.append(Object.assign(h('option'), { value: '', textContent: 'Your own line' }));
  for (const { p, e } of pool) pre.append(Object.assign(h('option'), { value: e.id, textContent: `${p.name}: ${e.title}` }));
  pre.addEventListener('change', () => {
    const e = pool.find((x) => x.e.id === pre.value)?.e;
    if (!e) return;
    input.value = T.bassStepsOf(e).map((s) => `${'CDEFGAB'[((s % 7) + 7) % 7]}${Math.floor(s / 7)}`).join(' ');
    run();
  });
  input.addEventListener('input', run);
  const out = h('div');
  const stage = h('div', 'fux-stage');
  const r1 = h('label', 'pl-inline');
  r1.append('Example ', pre);
  const r2 = h('label', 'pl-inline txt-field');
  r2.append('Bass ', input);
  box.append(r1, r2, out, stage);

  function run() {
    out.replaceChildren();
    const steps = T.parseBass(input.value);
    if (!steps) return void out.append(note('Enter at least two notes, such as C3 G3 C3, or degrees such as 1 5 1.', 'verdict bad'));
    const found = T.findSuspensions(steps);
    const strip = h('div', 'plan-strip');
    steps.forEach((s, i) => {
      const cell = h('div', 'plan-cell');
      cell.append(h('span', 'plan-note', `${'CDEFGAB'[((s % 7) + 7) % 7]}${Math.floor(s / 7)}`));
      const here = found.filter((f) => f.index === i);
      for (const f of here) {
        const b = h('span', `susp susp-${f.kind[0]}`, f.kind);
        b.title = f.prepared;
        cell.append(b);
      }
      strip.append(cell);
    });
    out.append(strip);
    const list = h('ul', 'bg-points');
    for (const f of found) list.append(h('li', '', `Bass note ${f.index + 1}: ${f.kind}, prepared ${f.prepared}.`));
    if (!found.length) list.append(h('li', '', 'No suspension can be prepared on this line.'));
    out.append(list, note('Which of these you choose is a matter of taste and of the harmony; the rules say only what can be prepared. The 4th is always accompanied by the 5th, the 7th by the 3rd, the 9th by the 10th.'));
    showExample(stage, lineExample('susp-bass', 'The bass line', steps.map((s) => `${'CDEFGAB'[((s % 7) + 7) % 7]}${Math.floor(s / 7)}`)));
  }
  run();
}

// ---------- 10. Durante and Fenaroli ----------

function roTable(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Durante and Fenaroli: the Rule of the Octave', 'The two scales side by side, one row to each step of the bass. A row is marked where Durante’s version differs from Fenaroli’s. Select a figure to hear the sonority.');
  const PAIRS: Record<string, { label: string; fen: string; dur: string }> = {
    'up-major': { label: 'Ascending, Major', fen: 'ro-up-major', dur: 'rod-up-major' },
    'down-major': { label: 'Descending, Major', fen: 'ro-down-major', dur: 'rod-down-major' },
    'up-minor': { label: 'Ascending, Minor', fen: 'ro-up-minor', dur: 'rod-up-minor' },
    'down-minor': { label: 'Descending, Minor', fen: 'ro-down-minor', dur: 'rod-down-minor' },
  };
  const out = h('div');
  box.append(choices(Object.entries(PAIRS).map(([k, v]) => [k, v.label] as [string, string]), 'up-major', draw, 'Scale'), out);
  function draw(k: string) {
    out.replaceChildren();
    const fen = findExample(patterns, PAIRS[k].fen);
    const dur = findExample(patterns, PAIRS[k].dur);
    if (!fen || !dur) return;
    const rows = T.roCompare(fen, dur);
    const cell = (ex: ToolExample, c: { figures: string; beat: number } | null) =>
      c ? button(`▶ ${c.figures}`, () => void playNotes([{ notes: T.sonorityNotes(ex, c.beat).map((n) => ({ ...n, start: 0, dur: 1.6 })), at: 0 }]), 'tiny') : '—';
    const body: (string | Node)[][] = [['Degree', 'Fenaroli', 'Durante', '']];
    for (const r of rows) body.push([r.degree, cell(fen, r.fenaroli), cell(dur, r.durante), r.differs ? 'differs' : '']);
    out.append(
      table(body, (ri, c) => (ri > 0 && c === 3 && rows[ri - 1].differs ? 'cell-bad' : '')),
      (() => { const r = h('div', 'chip-row'); r.append(button('▶ Fenaroli’s Scale', () => void playExample(fen), 'seg-btn'), button('▶ Durante’s Scale', () => void playExample(dur), 'seg-btn')); return r; })(),
      note('Fenaroli’s version has one sonority to each step; Durante repeats ⑤ going up, so the ascent pauses on the dominant. The key of these scales is C major or A minor.'),
    );
  }
  draw('up-major');
}

// ---------- 11. plain and diminished ----------

function plainDiminished(box: HTMLElement, patterns: ToolPattern[]) {
  head(box, 'Tool', 'Plain and Diminished', 'The same bass, ⑦→①, played plain, then with Durante’s first manner of diminution, then with his second. The outer frame does not change: the line lands on the 3rd of ①.');
  const ITEMS = [['dim-plain', 'Plain'], ['dd1-s1', 'Style 1: Arpeggio, Then Scale'], ['dd1-s2', 'Style 2: Descending Scale']];
  const stages = ITEMS.map(([id, label]) => {
    const wrap = h('div', 'example');
    wrap.append(h('h4', 'mini-title', label));
    const st = h('div', 'fux-stage');
    wrap.append(st);
    box.append(wrap);
    const ex = findExample(patterns, id);
    if (ex) showExample(st, ex);
    return ex;
  });
  box.insertBefore(button('▶ Play Plain, Then Style 1, Then Style 2', () => {
    let at = 0;
    const groups = stages.filter((e): e is ToolExample => !!e).map((e) => {
      const g = { notes: playableNotes(e), at };
      at += exampleBeats(e) + 1;
      return g;
    });
    void playNotes(groups);
  }, 'btn'), box.children[1]);
}

// ---------- entry ----------

type Builder = (box: HTMLElement, patterns: ToolPattern[], arg?: string) => void;
const TOOLS: Record<string, Builder> = {
  'bass-motion': bassMotionExplorer,
  combination: combinationBuilder,
  'recognition-quiz': (b, p, a) => quiz(b, p, 'recognition', a ?? 'schemata'),
  nomenclature: nomenclatureBuilder,
  'ptr-grid': ptrGrid,
  clausulae: clausulaeMixer,
  morph: morphTool,
  'ear-quiz': (b, p) => quiz(b, p, 'ear', ''),
  'suspension-finder': suspensionFinder,
  'ro-table': roTable,
  'plain-diminished': plainDiminished,
};

export async function mountPartimentoTool(box: HTMLElement, id: string, arg?: string): Promise<void> {
  const build = TOOLS[id];
  if (!build) return;
  try {
    build(box, await loadPatterns(), arg);
  } catch (e) {
    console.error(e);
    box.append(note('This tool could not be loaded.', 'verdict bad'));
  }
}
