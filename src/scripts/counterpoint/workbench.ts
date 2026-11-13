// The exercise workbench of the counterpoint pages: pick a cantus firmus, write the counterpoint note by note, and the
// rule checker marks every fault on the score as you write. "Complete it for me" and "Show a model" call the solver.
import { MODES, analyze, buildExercise, fromStep, makeLine, midiOf, parse } from './engine.js';
import { showIssues } from './examples';
import { marksOf } from './rules';
import type { Issue } from './rules';
import { scoreData, voiceNamesOf } from './score';
import { solveAsync } from './solve';
import type { EngineVoice } from './solve';
import { mountPlayer } from '../partimento/player';
import { sampler } from '../sampler';
import { titleCase } from '../title-case';

interface Spec {
  nv: 2 | 3 | 4;
  species: 1 | 2 | 3 | 4 | 5;
  cfPos: number;
  florid?: number;
  title: string;
  demo?: true;
}

const RHYTHMS: [string, string][] = [
  ['hh', 'Two Halves'],
  ['hht', 'Two Halves, Tied On'],
  ['qqqq', 'Four Quarters'],
  ['hqq', 'Half, Two Quarters'],
  ['qqh', 'Two Quarters, Half'],
  ['qqht', 'Two Quarters, Half Tied On'],
  ['hqqt', 'Half, Two Quarters Tied On'],
  ['qeeh', 'Quarter, Two Eighths, Half'],
  ['hqee', 'Half, Quarter, Two Eighths'],
];

type El<K extends keyof HTMLElementTagNameMap> = HTMLElementTagNameMap[K];
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): El<K> {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function field(label: string, control: HTMLElement): HTMLElement {
  const l = el('label', 'pl-inline');
  l.append(`${label} `, control);
  return l;
}

function select(options: [string, string][], value: string, onchange: (v: string) => void, label: string): HTMLSelectElement {
  const s = el('select', 'pl-select');
  s.setAttribute('aria-label', label);
  for (const [v, t] of options) {
    const o = el('option', '', t);
    o.value = v;
    o.selected = v === value;
    s.append(o);
  }
  s.addEventListener('change', () => onchange(s.value));
  return s;
}

const ACC_SIGN: Record<number, string> = { 0: '♮', 1: '♯', [-1]: '♭' };

export function mountWorkbench(root: HTMLElement, spec: Spec): void {
  const nv = spec.nv;
  const sp = spec.species;
  let mode = 'D';
  let cfPos = spec.cfPos;
  let fl = spec.florid ?? (cfPos === 0 ? 1 : 0);
  let patterns: string[] | null = null;
  let voices: EngineVoice[] = [];
  let busy = 0;
  let timer = 0;

  // ---------- markup ----------
  const controls = el('div', 'pl-row wb-controls');
  const actions = el('div', 'pl-row wb-actions');
  const rhythmBox = el('div', 'wb-rhythm');
  const grid = el('div', 'wb-grid');
  const stage = el('div', 'fux-stage');
  const status = el('div', 'fux-result');
  status.setAttribute('aria-live', 'polite');
  const hint = el('p', 'muted-line table-note', 'Pick a pitch for each empty note, or press Complete It for Me. A note can be raised or lowered with the sign button next to it. The rule checker marks faulty notes on the score in red (a rule) or amber (a guideline).');
  root.append(controls, actions, rhythmBox, grid, stage, status, hint);

  const modeSel = select(Object.keys(MODES).map((k) => [k, titleCase(MODES[k].name)]), mode, (v) => {
    mode = v;
    patterns = null;
    reset();
  }, 'Cantus firmus');
  controls.append(field('Cantus Firmus', modeSel));

  const posOpts: [string, string][] =
    nv === 2
      ? [['1', 'Cantus Firmus Below'], ['0', 'Cantus Firmus Above']]
      : nv === 3
        ? [['0', 'Cantus Firmus on Top'], ['1', 'Cantus Firmus in the Middle'], ['2', 'Cantus Firmus in the Bass']]
        : [['0', 'Cantus Firmus in the Soprano'], ['1', 'Cantus Firmus in the Alto'], ['2', 'Cantus Firmus in the Tenor'], ['3', 'Cantus Firmus in the Bass']];
  const flWrap = el('span');
  const posSel = select(posOpts, String(cfPos), (v) => {
    cfPos = Number(v);
    if (fl === cfPos) fl = cfPos === 0 ? 1 : 0;
    syncFlorid();
    reset();
  }, 'Position of the cantus firmus');
  controls.append(field('Position', posSel), flWrap);

  function syncFlorid() {
    flWrap.replaceChildren();
    if (nv < 3 || sp < 2) return;
    const names = nv === 3 ? ['Top', 'Middle', 'Bass'] : ['Soprano', 'Alto', 'Tenor', 'Bass'];
    const opts = names.map((n, i) => [String(i), n] as [string, string]).filter(([i]) => Number(i) !== cfPos);
    if (fl === cfPos) fl = Number(opts[0][0]);
    flWrap.append(field('Florid Voice', select(opts, String(fl), (v) => {
      fl = Number(v);
      reset();
    }, 'Voice that moves in the species')));
  }
  syncFlorid();

  const btn = (label: string, onclick: () => void, title?: string) => {
    const b = el('button', 'btn', label);
    b.type = 'button';
    if (title) b.title = title;
    b.addEventListener('click', onclick);
    return b;
  };
  actions.append(
    btn('Complete It for Me', () => solve(true), 'fill the empty notes, keeping yours'),
    btn('Show a Model Solution', () => solve(false), 'clear and generate a new correct counterpoint'),
    btn('Clear', () => reset()),
  );

  // ---------- building ----------
  function build(): EngineVoice[] {
    const n = MODES[mode].cf.length;
    if (sp === 5 && (!patterns || patterns.length !== n)) {
      const pool = ['hht', 'qqqq', 'hqq', 'hht', 'qqht', 'hh', 'hqqt', 'qeeh', 'hht'];
      patterns = Array.from({ length: n }, (_, i) => pool[(i * 4 + 1) % pool.length]);
    }
    return buildExercise(mode, nv, cfPos, sp, fl, { patterns, rest: sp === 2 }) as EngineVoice[];
  }

  function reset() {
    sampler.stop();
    voices = build();
    refresh();
  }

  // ---------- the grid of notes ----------
  const hasEmpty = () => voices.some((v) => v.notes.some((n) => !n.rest && !n.p));

  function pitchOptions(v: EngineVoice, current?: string | null): string[] {
    const lo = parse(v.lo ?? 'C3').step;
    const hi = parse(v.hi ?? 'C6').step;
    let a = lo;
    let b = hi;
    if (current) {
      const s = parse(current).step;
      a = Math.min(a, s);
      b = Math.max(b, s);
    }
    const out: string[] = [];
    for (let s = b; s >= a; s--) out.push(fromStep(s, 0));
    return out;
  }

  function setNote(vi: number, k: number, p: string | null) {
    const v = voices[vi];
    const old = v.notes[k].p;
    v.notes[k].p = p;
    const nx = v.notes[k + 1];
    if (v.notes[k].tie && nx && (nx.p == null || nx.p === old)) nx.p = p; // a ligature: the tied note follows
    refresh();
  }

  function playOne(p: string) {
    void sampler.activate().then((ac) => sampler.play(midiOf(p), ac.currentTime + 0.02, 0.8));
  }

  function cell(vi: number, k: number, bar: number, mark: 'error' | 'warn' | 'info' | undefined): HTMLElement {
    const v = voices[vi];
    const n = v.notes[k];
    const c = el('div', `wb-cell${mark ? ` mark-${mark}` : ''}`);
    c.append(el('span', 'wb-bar', String(bar)));
    const natural = n.p ? fromStep(parse(n.p).step, 0) : '';
    const s = el('select', 'pl-select');
    s.setAttribute('aria-label', `Bar ${bar}, note ${k + 1}`);
    const none = el('option', '', '—');
    none.value = '';
    s.append(none);
    for (const p of pitchOptions(v, n.p)) {
      const o = el('option', '', p);
      o.value = p;
      o.selected = p === natural;
      s.append(o);
    }
    s.addEventListener('change', () => {
      const acc = n.p ? parse(n.p).acc : 0;
      const p = s.value ? fromStep(parse(s.value).step, acc) : null;
      if (p) playOne(p);
      setNote(vi, k, p);
    });
    c.append(s);
    if (n.p) {
      const a = el('button', 'wb-acc', ACC_SIGN[parse(n.p).acc]);
      a.type = 'button';
      a.title = 'natural, sharp or flat';
      a.setAttribute('aria-label', 'Change the accidental');
      a.addEventListener('click', () => {
        const cur = parse(n.p!);
        const next = cur.acc === 0 ? 1 : cur.acc === 1 ? -1 : 0;
        const p = fromStep(cur.step, next);
        playOne(p);
        setNote(vi, k, p);
      });
      c.append(a);
    }
    return c;
  }

  function drawGrid(issues: Issue[]) {
    grid.replaceChildren();
    const names = voiceNamesOf(voices);
    voices.forEach((v, vi) => {
      if (v.role === 'cf') return;
      const row = el('div', 'wb-row');
      row.append(el('span', 'wb-voice', names[vi]));
      const cells = el('div', 'wb-cells');
      let on = 0;
      v.notes.forEach((n, k) => {
        const start = on;
        on += n.d;
        if (n.rest) return;
        const at = issues.filter((i) => i.v === vi && i.t >= start - 1e-6 && i.t < on - 1e-6);
        const mark = at.some((i) => i.level === 'error') ? 'error' : at.length ? 'warn' : undefined;
        cells.append(cell(vi, k, Math.floor(start + 1e-6) + 1, mark));
      });
      row.append(cells);
      grid.append(row);
    });
  }

  // ---------- rhythm (fifth species) ----------
  function drawRhythm() {
    rhythmBox.replaceChildren();
    if (sp !== 5 || !patterns) return;
    const n = MODES[mode].cf.length;
    const head = el('p', 'muted-line table-note', 'Rhythm of each bar of the florid voice:');
    const wrap = el('div', 'wb-cells');
    for (let bar = 1; bar < n - 1; bar++) {
      const holder = el('div', 'wb-cell');
      holder.append(el('span', 'wb-bar', String(bar + 1)));
      holder.append(select(RHYTHMS, patterns[bar], (val) => changeRhythm(bar, val), `Rhythm of bar ${bar + 1}`));
      wrap.append(holder);
    }
    rhythmBox.append(head, wrap);
  }

  function changeRhythm(bar: number, pat: string) {
    patterns![bar] = pat;
    const fv = voices.findIndex((v) => v.species === 5);
    if (fv < 0) return;
    const old = voices[fv];
    const fresh = makeLine(5, MODES[mode].cf.length, { patterns }) as EngineVoice['notes'];
    // keep the pitches that sit at the same moment
    const had = new Map<number, string>();
    let on = 0;
    for (const x of old.notes) {
      if (x.p) had.set(Math.round(on * 1000), x.p);
      on += x.d;
    }
    on = 0;
    for (const x of fresh) {
      const kept = had.get(Math.round(on * 1000));
      if (!x.rest && kept) x.p = kept;
      on += x.d;
    }
    old.notes = fresh;
    refresh();
  }

  // ---------- score and checker ----------
  function refresh() {
    drawRhythm();
    const partial = hasEmpty();
    const res = analyze(voices.map((v) => ({ role: v.role, species: v.species, notes: v.notes })), { partial });
    const issues = res.issues as Issue[];
    drawGrid(issues);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => drawScore(issues), 250);
    showIssues(status, issues, voiceNamesOf(voices));
    if (partial) status.querySelector('.verdict')?.append(' · unfinished (empty notes are skipped)');
  }

  function drawScore(issues: Issue[]) {
    sampler.stop();
    const fresh = el('div', 'player');
    stage.replaceChildren(fresh);
    void mountPlayer(fresh, { ...scoreData(`wb-${spec.title}`, spec.title, voices, voiceNamesOf(voices)), marks: marksOf(issues) });
  }

  // ---------- the solver ----------
  function solve(keep: boolean, quiet = false) {
    const ticket = ++busy;
    if (!quiet) status.replaceChildren(Object.assign(el('p', 'verdict meh'), { textContent: 'Searching for a counterpoint that obeys every rule…' }));
    const base: EngineVoice[] = keep ? JSON.parse(JSON.stringify(voices)) : build();
    void solveAsync(base, mode, { maxNodes: 60000, maxMs: 7000, noCross: nv > 2, seed: (Math.random() * 1e9) | 0 }).then((res) => {
      if (ticket !== busy) return; // a newer request replaced this one
      if (!res) {
        status.replaceChildren(Object.assign(el('p', 'verdict bad'), { textContent: keep ? 'Your notes cannot be completed without breaking a rule. Fix the marked notes, or ask for a model solution.' : 'No solution found this time. Try again.' }));
        return;
      }
      res.forEach((v, i) => {
        v.lo = base[i].lo;
        v.hi = base[i].hi;
      });
      voices = res;
      refresh();
    });
  }

  reset();
  if (spec.demo) {
    // start with a model filled in, once the workbench is on screen (not if the student has begun)
    solve(false, true);
  }
}
