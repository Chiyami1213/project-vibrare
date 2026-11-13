// The interactive tools of the counterpoint pages: motion lab, interval explorer, mode explorer, suspension lab,
// monochord, order of the triad and the spot-the-fault quiz. Ported from the guide's own widgets (reference-ui.js).
import { MODES, analyze, buildExercise, cfLine, fromStep, ivl, midiOf, parse, solve } from './engine.js';
import { RULE_NAMES } from './rules';
import type { Issue, Voice } from './rules';
import { marksOf } from './rules';
import { scoreData, voiceNamesOf } from './score';
import { getAudioSettings, outputGain } from '../audio-settings';
import { mountPlayer } from '../partimento/player';
import { sampler } from '../sampler';
import { titleCase } from '../title-case';

// ---------- small helpers ----------

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
}
function button(label: string, onclick: () => void, cls = 'btn'): HTMLButtonElement {
  const b = h('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onclick);
  return b;
}
/** A row of exclusive choices (segmented control). */
function choices(options: [string, string][], value: string, onpick: (v: string) => void, label: string): HTMLElement {
  const wrap = h('div', 'chip-row');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', label);
  const bs = options.map(([v, t]) => {
    const b = button(t, () => {
      bs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onpick(v);
    }, 'seg-btn');
    b.setAttribute('aria-pressed', String(v === value));
    return b;
  });
  wrap.append(...bs);
  return wrap;
}
const head = (box: HTMLElement, eyebrow: string, title: string, hint: string) => {
  const hd = h('div', 'tool-head');
  hd.append(h('span', 'eyebrow', eyebrow), h('strong', '', title), h('span', 'muted-line', hint));
  box.replaceChildren(hd);
};
const flat = (p: string) => p.replace('b', '♭').replace('#', '♯');

/** Sound a list of notes with the instrument chosen in Settings. */
async function sound(notes: { midi: number; at: number; dur: number; level?: number }[]) {
  const ac = await sampler.activate();
  const t0 = ac.currentTime + 0.05;
  for (const n of notes) sampler.play(n.midi, t0 + n.at, n.dur, n.level ?? 1);
}

/** Put a score (the shared Example Player) into `stage`, replacing the one there. */
function showScore(stage: HTMLElement, voices: Voice[], title: string, marks: Issue[] = []) {
  sampler.stop();
  const fresh = h('div', 'player');
  stage.replaceChildren(fresh);
  void mountPlayer(fresh, { ...scoreData(`tool-${title}`, title, voices, voiceNamesOf(voices)), marks: marksOf(marks) });
}

const whole = (notes: string[], d = 1): Voice['notes'] => notes.map((p) => ({ p, d }));
const pill = (text: string, ok: boolean) => Object.assign(h('span', `pill ${ok ? 'ok' : 'no'}`), { textContent: text });

// ---------- motion lab ----------

function motionLab(box: HTMLElement) {
  head(box, 'Animation', 'The Three Motions and the Four Rules', 'Watch two voices move from one consonance to the next. Fux’s rule decides whether the move is allowed.');
  const W = 520;
  const H = 250;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mot-svg' });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Two voices moving between two intervals');
  const wrap = h('div', 'mot-wrap');
  wrap.append(svg);
  box.append(wrap);
  const lo = parse('C4').step;
  const hi = parse('A5').step;
  const yOf = (st: number) => 228 - (st - lo) * (204 / (hi - lo));
  for (let st = lo; st <= hi; st++) {
    s('line', { x1: 52, x2: W - 10, y1: yOf(st), y2: yOf(st), class: st % 7 === 0 ? 'lad c' : 'lad' }, svg);
    if (st % 2 === 0 || st % 7 === 0) s('text', { x: 44, y: yOf(st) + 3.5, class: 'ladl' }, svg).textContent = fromStep(st, 0);
  }
  const X0 = 150;
  const X1 = 390;
  [X0, X1].forEach((x) => s('line', { x1: x, x2: x, y1: 14, y2: 236, class: 'col' }, svg));
  const pathU = s('line', { class: 'vp u' }, svg);
  const pathL = s('line', { class: 'vp l' }, svg);
  const barA = s('line', { class: 'ivbar' }, svg);
  const barB = s('line', { class: 'ivbar' }, svg);
  const labA = s('text', { class: 'ivlab' }, svg);
  const labB = s('text', { class: 'ivlab' }, svg);
  const dU = s('circle', { r: 9, class: 'dot u' }, svg);
  const dL = s('circle', { r: 9, class: 'dot l' }, svg);
  const verdict = h('p', 'mot-verdict', 'Choose a motion.');
  verdict.setAttribute('aria-live', 'polite');
  box.append(verdict);

  let quiz = false;
  let cur: string[] | null = null;
  let raf = 0;
  const examples: Record<string, string[]> = {
    direct: ['C5', 'E4', 'D5', 'G4'],
    contrary: ['C5', 'E4', 'D5', 'D4'],
    oblique: ['A4', 'D4', 'B4', 'D4'],
  };
  const st = (p: string) => parse(p).step;

  function classify(a1: string, b1: string, a2: string, b2: string) {
    const i1 = ivl(b1, a1);
    const i2 = ivl(b2, a2);
    const dA = midiOf(a2) - midiOf(a1);
    const dB = midiOf(b2) - midiOf(b1);
    const motion = dA === 0 && dB === 0 ? 'none' : dA === 0 || dB === 0 ? 'oblique' : Math.sign(dA) === Math.sign(dB) ? 'direct' : 'contrary';
    const rule = i1.perfect && i2.perfect ? 1 : i1.perfect ? 2 : i2.perfect ? 3 : 4;
    return { i1, i2, motion, rule, ok: !(i2.perfect && motion === 'direct') };
  }
  const ruleText: Record<number, string> = {
    1: 'Rule 1: perfect to perfect only by contrary or oblique motion.',
    2: 'Rule 2: perfect to imperfect by any motion.',
    3: 'Rule 3: imperfect to perfect only by contrary or oblique motion.',
    4: 'Rule 4: imperfect to imperfect by any motion.',
  };
  const ivName = (iv: ReturnType<typeof ivl>) => {
    const n = iv.num;
    const base = iv.kind === 'P8' ? (n === 1 ? 'unison' : n === 8 ? 'octave' : `${n}th`) : `${n}${n === 3 ? 'rd' : 'th'}`;
    return base + (iv.perfect ? ' · perfect' : iv.imperfect ? ' · imperfect' : '');
  };

  function draw(p: string[], t: number) {
    const [a1, b1, a2, b2] = p;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const yU = yOf(st(a1)) + (yOf(st(a2)) - yOf(st(a1))) * e;
    const yL = yOf(st(b1)) + (yOf(st(b2)) - yOf(st(b1))) * e;
    const x = X0 + (X1 - X0) * e;
    dU.setAttribute('cx', String(x));
    dU.setAttribute('cy', String(yU));
    dL.setAttribute('cx', String(x));
    dL.setAttribute('cy', String(yL));
    for (const [line, y0, y1] of [[pathU, yOf(st(a1)), yU], [pathL, yOf(st(b1)), yL]] as const) {
      line.setAttribute('x1', String(X0));
      line.setAttribute('y1', String(y0));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(y1));
    }
    const c = classify(a1, b1, a2, b2);
    barA.setAttribute('x1', String(X0));
    barA.setAttribute('x2', String(X0));
    barA.setAttribute('y1', String(yOf(st(a1))));
    barA.setAttribute('y2', String(yOf(st(b1))));
    barA.setAttribute('class', `ivbar ${c.i1.perfect ? 'p' : 'i'}`);
    labA.setAttribute('x', String(X0 - 8));
    labA.setAttribute('y', String((yOf(st(a1)) + yOf(st(b1))) / 2 + 4));
    labA.setAttribute('text-anchor', 'end');
    labA.textContent = ivName(c.i1);
    if (t >= 1) {
      barB.setAttribute('x1', String(X1));
      barB.setAttribute('x2', String(X1));
      barB.setAttribute('y1', String(yU));
      barB.setAttribute('y2', String(yL));
      barB.setAttribute('class', `ivbar ${c.i2.perfect ? 'p' : 'i'}${quiz ? '' : c.ok ? ' ok' : ' no'}`);
      labB.setAttribute('x', String(X1 + 10));
      labB.setAttribute('y', String((yU + yL) / 2 + 4));
      labB.textContent = ivName(c.i2);
    } else {
      barB.setAttribute('y1', '0');
      barB.setAttribute('y2', '0');
      labB.textContent = '';
    }
  }

  function show(c: ReturnType<typeof classify>, prefix?: string) {
    verdict.className = `mot-verdict ${c.ok ? 'ok' : 'no'}`;
    verdict.replaceChildren();
    if (prefix) verdict.append(prefix);
    verdict.append(
      Object.assign(h('b'), { textContent: `${c.motion[0].toUpperCase()}${c.motion.slice(1)} motion` }),
      ` from ${c.i1.perfect ? 'perfect' : 'imperfect'} to ${c.i2.perfect ? 'perfect' : 'imperfect'}. ${ruleText[c.rule]} `,
      Object.assign(h('b'), { textContent: c.ok ? 'Allowed.' : 'Forbidden: this produces open or hidden fifths or octaves.' }),
    );
  }

  let right = 0;
  let tries = 0;
  function answer(yes: boolean) {
    const p = cur!;
    const c = classify(p[0], p[1], p[2], p[3]);
    tries++;
    if (yes === c.ok) right++;
    draw(p, 1);
    barB.setAttribute('class', `ivbar ${c.i2.perfect ? 'p' : 'i'}${c.ok ? ' ok' : ' no'}`);
    show(c, `${yes === c.ok ? 'Correct' : 'Not quite'} (${right}/${tries}). `);
    verdict.append(' ', button('Next', randomProg, 'btn'));
  }

  function done() {
    const p = cur!;
    const c = classify(p[0], p[1], p[2], p[3]);
    if (quiz) {
      verdict.className = 'mot-verdict q';
      verdict.replaceChildren('Is this progression allowed? ', button('Allowed', () => answer(true)), ' ', button('Forbidden', () => answer(false)));
      return;
    }
    show(c);
  }

  function run(p: string[], silent = false) {
    cancelAnimationFrame(raf);
    cur = p;
    if (silent) {
      draw(p, 1);
      done();
      return;
    }
    void sound([
      { midi: midiOf(p[0]), at: 0, dur: 0.9 },
      { midi: midiOf(p[1]), at: 0, dur: 0.9 },
      { midi: midiOf(p[2]), at: 0.9, dur: 1.3 },
      { midi: midiOf(p[3]), at: 0.9, dur: 1.3 },
    ]);
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - start - 500) / 700);
      draw(p, Math.max(0, t));
      if (t < 1) raf = requestAnimationFrame(step);
      else done();
    };
    raf = requestAnimationFrame(step);
    verdict.className = 'mot-verdict';
    verdict.textContent = '…';
  }

  function randomProg() {
    const cons = [2, 4, 5, 7, 9, 11];
    for (let n = 0; n < 300; n++) {
      const b1 = lo + Math.floor(Math.random() * 6);
      const g1 = cons[Math.floor(Math.random() * cons.length)];
      const b2 = b1 + [-2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 6)];
      const g2 = cons[Math.floor(Math.random() * cons.length)];
      const a1 = b1 + g1;
      const a2 = b2 + g2;
      if (a2 > hi || a1 > hi || b2 < lo) continue;
      const p = [fromStep(a1, 0), fromStep(b1, 0), fromStep(a2, 0), fromStep(b2, 0)];
      const i1 = ivl(p[1], p[0]);
      const i2 = ivl(p[3], p[2]);
      if (i1.kind === 'diss' || i2.kind === 'diss' || i1.kind === 'P4' || i2.kind === 'P4') continue;
      if (Math.abs(a2 - a1) > 4 || (a1 === a2 && b1 === b2)) continue;
      if (Math.random() < 0.45 && !i2.perfect) continue; // lean towards the interesting cases
      run(p);
      return;
    }
  }

  const row = h('div', 'chip-row');
  row.append(
    button('Direct', () => { quiz = false; run(examples.direct); }, 'seg-btn'),
    button('Contrary', () => { quiz = false; run(examples.contrary); }, 'seg-btn'),
    button('Oblique', () => { quiz = false; run(examples.oblique); }, 'seg-btn'),
    button('Random Progression', () => { quiz = false; randomProg(); }, 'seg-btn'),
    button('Test Me', () => { quiz = true; randomProg(); }),
  );
  box.append(row);

  // the four rules as a table of examples: tap one to see and hear it
  const table = h('table', 'rules-mx');
  const thead = h('thead');
  const hr = h('tr');
  ['From ↓ To →', 'Perfect (1, 5, 8)', 'Imperfect (3, 6)'].forEach((t) => hr.append(h('th', '', t)));
  thead.append(hr);
  const cell = (rule: number, cases: [string, boolean, string[]][]) => {
    const td = h('td');
    td.append(h('div', 'rule-n', `Rule ${rule}`));
    for (const [m, ok, p] of cases) {
      td.append(button(`${ok ? '✓' : '✕'} ${m}`, () => { quiz = false; run(p); }, `chip ${ok ? 'ok' : 'no'}`));
    }
    return td;
  };
  const tbody = h('tbody');
  const r1 = h('tr');
  r1.append(h('th', '', 'Perfect'),
    cell(1, [['direct', false, ['A4', 'D4', 'B4', 'E4']], ['contrary', true, ['A4', 'D4', 'C5', 'C4']], ['oblique', true, ['G4', 'C4', 'G4', 'G3']]]),
    cell(2, [['direct', true, ['A4', 'D4', 'B4', 'G4']], ['contrary', true, ['A4', 'D4', 'G4', 'E4']], ['oblique', true, ['A4', 'D4', 'B4', 'D4']]]));
  const r2 = h('tr');
  r2.append(h('th', '', 'Imperfect'),
    cell(3, [['direct', false, ['C5', 'E4', 'D5', 'G4']], ['contrary', true, ['C5', 'E4', 'D5', 'D4']], ['oblique', true, ['B4', 'D4', 'A4', 'D4']]]),
    cell(4, [['direct', true, ['F4', 'D4', 'G4', 'E4']], ['contrary', true, ['F4', 'D4', 'A4', 'C4']], ['oblique', true, ['B4', 'D4', 'B4', 'G4']]]));
  tbody.append(r1, r2);
  table.append(thead, tbody);
  const mx = h('div', 'mx-wrap');
  mx.append(table);
  box.append(mx);
  run(['A4', 'D4', 'G4', 'E4'], true);
}

// ---------- interval explorer ----------

function intervalName(iv: ReturnType<typeof ivl>): string {
  const { g, s: semis } = iv;
  const base = ['unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][g];
  let q: string;
  if (g === 0) q = semis === 0 ? 'perfect' : semis > 0 ? 'augmented' : 'diminished';
  else if (g === 3) q = semis === 5 ? 'perfect' : semis === 6 ? 'augmented' : 'diminished';
  else if (g === 4) q = semis === 7 ? 'perfect' : semis === 6 ? 'diminished' : 'augmented';
  else {
    const major = ({ 1: 2, 2: 4, 5: 9, 6: 11 } as Record<number, number>)[g];
    q = semis === major ? 'major' : semis === major - 1 ? 'minor' : semis > major ? 'augmented' : 'diminished';
  }
  if (iv.gen === 7 && semis === 0) return 'octave';
  if (iv.gen > 7) return `${q} compound ${base} (${iv.num}th)`;
  return `${q} ${base}`;
}

function intervalExplorer(box: HTMLElement) {
  head(box, 'Interactive', 'Interval Explorer', 'Tap two keys. The second key sounds against the first.');
  const kb = s('svg', { viewBox: '0 0 700 120', class: 'kbd' });
  kb.setAttribute('role', 'group');
  kb.setAttribute('aria-label', 'Keyboard');
  const keys: SVGRectElement[] = [];
  const white = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackOf: Record<string, string> = { C: 'C#', D: 'Eb', F: 'F#', G: 'G#', A: 'Bb' };
  let wi = 0;
  for (let oct = 3; oct <= 4; oct++) {
    for (const L of white) {
      const r = s('rect', { x: wi * 50 + 1, y: 1, width: 48, height: 116, rx: 3, class: 'wk' }, kb);
      r.dataset.p = L + oct;
      keys.push(r);
      s('text', { x: wi * 50 + 25, y: 108, class: 'kl' }, kb).textContent = L === 'C' ? L + oct : L;
      wi++;
    }
  }
  wi = 0;
  for (let oct = 3; oct <= 4; oct++) {
    for (const L of white) {
      if (blackOf[L]) {
        const r = s('rect', { x: wi * 50 + 35, y: 1, width: 30, height: 70, rx: 2, class: 'bk' }, kb);
        r.dataset.p = blackOf[L] + oct;
        keys.push(r);
      }
      wi++;
    }
  }
  const kwrap = h('div', 'kbd-wrap');
  kwrap.append(kb);
  const big = h('div', 'ivx-big', '—');
  const sub = h('div', 'ivx-sub', 'Choose a lower note, then an upper note.');
  sub.setAttribute('aria-live', 'polite');
  box.append(kwrap, big, sub);
  let first: { p: string; done: boolean } | null = null;
  for (const k of keys) {
    const pick = (e: Event) => {
      e.preventDefault();
      const p = k.dataset.p!;
      void sound([{ midi: midiOf(p), at: 0, dur: 1.2 }]);
      if (!first || first.done) {
        keys.forEach((x) => x.classList.remove('a', 'b'));
        first = { p, done: false };
        k.classList.add('a');
        big.textContent = `${flat(p)} …`;
        sub.textContent = 'Now choose the second note.';
        return;
      }
      k.classList.add('b');
      first.done = true;
      const a = first.p;
      const lowest = midiOf(a) <= midiOf(p) ? a : p;
      const highest = lowest === a ? p : a;
      const iv = ivl(lowest, highest);
      void sound([{ midi: midiOf(lowest), at: 0.5, dur: 1.6 }, { midi: midiOf(highest), at: 0.5, dur: 1.6 }]);
      const cat = iv.kind === 'P8' || iv.kind === 'P5' ? 'perfect consonance' : iv.imperfect ? 'imperfect consonance' : iv.kind === 'P4' ? 'dissonance against the bass (a fourth)' : 'dissonance';
      big.textContent = `${intervalName(iv)} · ${cat}`;
      const extra = iv.kind === 'P4'
        ? ' Fux calls the fourth a dissonance in two-part writing and against the bass. Between upper voices it behaves like an imperfect consonance (pp. 20, 112, 131).'
        : iv.g === 3 || iv.g === 4 ? ' The tritone and the diminished fifth are “mi contra fa”, the devil in music.' : '';
      sub.textContent = `${flat(lowest)} to ${flat(highest)}: ${iv.semis} semitones.${extra}`;
    };
    k.addEventListener('pointerdown', pick);
  }
}

// ---------- mode explorer ----------

const MODE_NOTES: Record<string, string> = {
  D: 'E–F and B–C fall on degrees 2–3 and 6–7',
  E: 'E–F and B–C fall on degrees 1–2 and 5–6. This is the only mode with no perfect fifth above the second degree (B–F), which makes its cadences unusual (pp. 81, 124)',
  F: 'E–F and B–C fall on degrees 7–8 and 4–5. The fourth degree B forms a tritone with the final',
  G: 'E–F and B–C fall on degrees 6–7 and 3–4. The seventh is raised (F♯) at cadences',
  A: 'E–F and B–C fall on degrees 5–6 and 2–3. The seventh is raised (G♯) at cadences',
  C: 'E–F and B–C fall on degrees 3–4 and 7–8',
};

function modeExplorer(box: HTMLElement) {
  head(box, 'Listen', 'Fux’s Six Cantus Firmi', 'One melody for each mode on D, E, F, G, A, C. B has no perfect fifth, so it cannot be a final (Fig. 9).');
  const stage = h('div', 'fux-stage');
  const cap = h('p', 'caption');
  const set = (m: string) => {
    showScore(stage, [{ role: 'cf', notes: cfLine(MODES[m].cf).map((n: { p: string; d: number }) => n) }], `${MODES[m].name}`);
    cap.replaceChildren();
    cap.append(Object.assign(h('b'), { textContent: titleCase(MODES[m].name) }), `. Semitones (mi–fa): ${MODE_NOTES[m]}. Figs. 4, 11, 13, 15, 22–23.`);
  };
  box.append(choices(Object.keys(MODES).map((k) => [k, k] as [string, string]), 'D', set, 'Mode'), stage, cap);
  set('D');
}

// ---------- suspension lab ----------

interface Susp { up: boolean; cf: string[]; a: string; b: string; c: string; note: string }
const SUSP: Record<string, Susp> = {
  '7-6': { up: true, cf: ['E4', 'D4', 'C4'], a: 'C5', b: 'B4', c: 'C5', note: 'Cantus below: the seventh resolves down to the sixth. This is the standard cadence of the fourth species (Fig. 73, next-to-last bar).' },
  '4-3': { up: true, cf: ['A3', 'G3', 'F3'], a: 'C4', b: 'B3', c: 'A3', note: 'Cantus below: the fourth resolves down to the third.' },
  '9-8': { up: true, cf: ['A3', 'B3', 'D4'], a: 'C5', b: 'B4', c: 'A4', note: 'Cantus below: the ninth resolves to the octave. Prepare it with a tenth (10–9–8) or a third (3–2–1), never with the octave (Fig. 67).' },
  '2-1 bad': { up: true, cf: ['C4', 'B3', 'A3'], a: 'C4', b: 'B3', c: 'C4', note: 'Unison, second, unison: remove the tie and two unisons stand side by side, so this is forbidden (Fig. 65). The same holds for 8–9–8.' },
  '2-3': { up: false, cf: ['E4', 'D4', 'E4'], a: 'C4', b: 'B3', c: 'C4', note: 'Cantus above: the second resolves down to the third (Fig. 69).' },
  '4-5': { up: false, cf: ['F4', 'G4', 'F4'], a: 'D4', b: 'C4', c: 'A3', note: 'Cantus above: the fourth resolves down to the fifth (Fig. 69).' },
  '9-10': { up: false, cf: ['F4', 'E4', 'F4'], a: 'D3', b: 'C3', c: 'D3', note: 'Cantus above: the ninth resolves to the tenth (Fig. 69). A seventh resolving into the octave is not used by the masters (Fig. 70).' },
};

function suspensionLab(box: HTMLElement) {
  head(box, 'Animation', 'Suspension Lab', 'A ligature is a delayed note. Remove the tie and you see the plain first-species progression underneath (Figs. 63–64).');
  const stage = h('div', 'fux-stage');
  const note = h('p', 'caption');
  note.setAttribute('aria-live', 'polite');
  let cur = '7-6';
  let plain = false;
  const voicesOf = (key: string, flatten: boolean): Voice[] => {
    const t = SUSP[key];
    const cf: Voice = { role: 'cf', species: 0, notes: whole(t.cf) };
    const cp: Voice = flatten
      ? { role: 'cpt', species: 1, notes: whole([t.a, t.b, t.c]) }
      : { role: 'cpt', species: 4, notes: [{ d: 0.5, rest: 1 }, { p: t.a, d: 0.5, tie: 1 }, { p: t.a, d: 0.5 }, { p: t.b, d: 0.5 }, { p: t.c, d: 1 }] };
    return t.up ? [cp, cf] : [cf, cp];
  };
  const tog = button('Remove the Ligature', () => {
    plain = !plain;
    tog.setAttribute('aria-pressed', String(plain));
    refresh();
  }, 'seg-btn');
  tog.setAttribute('aria-pressed', 'false');
  function refresh() {
    const t = SUSP[cur];
    showScore(stage, voicesOf(cur, plain), `Suspension ${cur}`);
    const only = new Set(['susp', 'susp-perf', 'acc-diss', 'diss', 'par5', 'par8', 'direct', 'sync8', 'susp78']);
    const errs = (analyze(voicesOf(cur, false)).errors as Issue[]).filter((e) => only.has(e.rule));
    const num = (x: string, y: string) => ivl(x, y).num;
    const nums = `${num(t.a, t.cf[0])} – ${num(t.a, t.cf[1])} – ${num(t.b, t.cf[1])}`;
    note.replaceChildren(Object.assign(h('b'), { textContent: nums }), `: ${t.note} `);
    if (plain) note.append(Object.assign(h('i'), { textContent: 'Without the tie the dissonance disappears; this is the progression the ear checks. ' }));
    note.append(errs.length ? pill(`The checker flags it: ${errs.map((e) => RULE_NAMES[e.rule] ?? e.rule).join(', ')}`, false) : pill('Checker: correct', true));
  }
  box.append(choices(Object.keys(SUSP).map((k) => [k, k] as [string, string]), cur, (v) => {
    cur = v;
    plain = false;
    tog.setAttribute('aria-pressed', 'false');
    refresh();
  }, 'Suspension type'), h('div', 'chip-row'), stage, note);
  box.querySelectorAll('.chip-row')[1].append(tog);
  refresh();
}

// ---------- monochord ----------

function monochord(box: HTMLElement) {
  head(box, 'Animation', 'Monochord: Dividing the String', 'Fux derives the intervals by dividing a string. A shorter string sounds higher. Tap a ratio to move the bridge and hear both segments.');
  const W = 560;
  const svg = s('svg', { viewBox: `0 0 ${W} 150`, class: 'mono-svg' });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'A string divided by a movable bridge');
  const wrap = h('div', 'mot-wrap');
  wrap.append(svg);
  const X0 = 30;
  const X1 = W - 30;
  const Y = 70;
  s('rect', { x: X0 - 14, y: Y + 14, width: X1 - X0 + 28, height: 26, rx: 4, class: 'mono-box' }, svg);
  s('rect', { x: X0 - 6, y: Y - 8, width: 6, height: 22, class: 'mono-nut' }, svg);
  s('rect', { x: X1, y: Y - 8, width: 6, height: 22, class: 'mono-nut' }, svg);
  const s1 = s('path', { class: 'str a' }, svg);
  const s2 = s('path', { class: 'str b' }, svg);
  const bridge = s('path', { class: 'bridge' }, svg);
  const lab1 = s('text', { class: 'mlab', y: Y - 26 }, svg);
  const lab2 = s('text', { class: 'mlab', y: Y - 26 }, svg);
  const info = h('p', 'mot-verdict');
  info.setAttribute('aria-live', 'polite');
  const ratios: [string, number, string, string][] = [
    ['2:1', 1 / 2, 'octave', 'perfect consonance'],
    ['3:2', 2 / 3, 'fifth', 'perfect consonance'],
    ['4:3', 3 / 4, 'fourth', 'perfect or dissonant (see p. 20)'],
    ['5:4', 4 / 5, 'major third', 'imperfect consonance'],
    ['6:5', 5 / 6, 'minor third', 'imperfect consonance'],
    ['5:3', 3 / 5, 'major sixth', 'imperfect consonance'],
    ['8:5', 5 / 8, 'minor sixth', 'imperfect consonance'],
    ['9:8', 8 / 9, 'whole tone', 'dissonance'],
  ];
  let frac = 0.5;
  let target = 0.5;
  let amp1 = 0;
  let amp2 = 0;
  let ph = 0;
  let raf = 0;
  function draw() {
    frac += (target - frac) * 0.18;
    ph += 0.9;
    amp1 *= 0.975;
    amp2 *= 0.975;
    const xb = X0 + (X1 - X0) * frac;
    const wave = (xa: number, xz: number, A: number, k: number) => {
      let d = `M${xa},${Y}`;
      for (let i = 1; i <= 40; i++) d += ` L${(xa + ((xz - xa) * i) / 40).toFixed(1)},${(Y + Math.sin((Math.PI * i) / 40) * A * Math.sin(ph * k)).toFixed(1)}`;
      return d;
    };
    s1.setAttribute('d', wave(X0, xb, amp1, 0.55 / Math.max(0.2, frac)));
    s2.setAttribute('d', wave(xb, X1, amp2, 0.55 / Math.max(0.2, 1 - frac)));
    bridge.setAttribute('d', `M${xb - 7},${Y + 14} L${xb},${Y - 2} L${xb + 7},${Y + 14}z`);
    lab1.setAttribute('x', String((X0 + xb) / 2));
    lab2.setAttribute('x', String((xb + X1) / 2));
    raf = Math.abs(target - frac) > 0.001 || amp1 > 0.05 || amp2 > 0.05 ? requestAnimationFrame(draw) : 0;
  }
  /** A plucked tone at an exact frequency, so the ratio is heard as the string makes it (not as 12-tone tempering). */
  async function tone(f: number, at: number, dur: number) {
    const ac = await sampler.activate();
    const when = ac.currentTime + 0.05 + at;
    const out = ac.createGain();
    out.gain.value = 0.35 * outputGain(getAudioSettings());
    out.connect(ac.destination);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(1, when + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    env.connect(out);
    for (const [mul, type, level] of [[1, 'triangle', 1], [2, 'sine', 0.25]] as const) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = f * mul;
      const g = ac.createGain();
      g.gain.value = level;
      o.connect(g).connect(env);
      o.start(when);
      o.stop(when + dur + 0.05);
    }
  }
  function pick(r: (typeof ratios)[number]) {
    target = r[1];
    const base = 196; // an open G string
    void tone(base, 0, 1.4);
    void tone(base / r[1], 0.7, 1.4);
    void tone(base, 1.5, 1.8);
    void tone(base / r[1], 1.5, 1.8);
    const [n, d] = r[0].split(':').map(Number);
    lab1.textContent = `${d} parts`;
    lab2.textContent = `${n - d} part${n - d > 1 ? 's' : ''}`;
    amp1 = 0;
    amp2 = 0;
    setTimeout(() => { amp1 = 7; if (!raf) raf = requestAnimationFrame(draw); }, 700);
    setTimeout(() => { amp1 = 7; amp2 = 5; if (!raf) raf = requestAnimationFrame(draw); }, 1500);
    info.className = 'mot-verdict ok';
    info.replaceChildren(Object.assign(h('b'), { textContent: `${r[0]}: ${r[2]}` }), `. The whole string (${n} parts) against ${d} of its parts. ${r[3][0].toUpperCase()}${r[3].slice(1)}.`);
    if (!raf) raf = requestAnimationFrame(draw);
  }
  const row = h('div', 'chip-row');
  for (const r of ratios) row.append(button(`${r[0]} ${titleCase(r[2])}`, () => pick(r), 'seg-btn'));
  const divs = h('dl', 'def-list');
  const dv = (t: string, d: string) => {
    divs.append(h('dt', '', t), h('dd', '', d));
  };
  dv('Arithmetical Division of the Octave', '4 : 3 : 2 = a fourth (4:3) below and a fifth (3:2) above');
  dv('Harmonic Division of the Octave', '6 : 4 : 3 = a fifth (3:2) below and a fourth (4:3) above');
  dv('Harmonic Division of the Fifth', '15 : 12 : 10 = a major third (5:4) below and a minor third (6:5) above');
  box.append(wrap, info, row, divs);
  lab1.textContent = '1 part';
  lab2.textContent = '1 part';
  draw();
}

// ---------- natural order of the triad ----------

function triadOrder(box: HTMLElement) {
  head(box, 'Compare', 'Natural Order Versus Keyboard Order', 'Fux puts the fifth low and the third high, the order the harmonic division produces (Figs. 161–162).');
  const stage = h('div', 'fux-stage');
  const voices: Voice[] = [
    { role: 'cpt', species: 1, notes: whole(['E5', 'C5']) },
    { role: 'cpt', species: 1, notes: whole(['C5', 'G4']) },
    { role: 'cpt', species: 1, notes: whole(['G4', 'E4']) },
    { role: 'cf', species: 1, notes: whole(['C3', 'C3']) },
  ];
  showScore(stage, voices, 'Natural and keyboard order');
  const cap = h('p', 'caption', 'Bar 1: the natural order, with the fifth low, the octave in the middle and the third (tenth) on top. Bar 2: the keyboard order, with the third crowded low near the bass. Fux: “the third placed in the low register and so close to the bass results in a dull and indistinct sound.” The larger the ratio numbers of an interval (5:4 for the third against 3:2 for the fifth), the higher the register it needs.');
  const play = (ps: string[]) => void sound(ps.map((p) => ({ midi: midiOf(p), at: 0, dur: 1.6, level: 0.85 })));
  const row = h('div', 'chip-row');
  row.append(
    button('▶ Natural Order (10, 8, 5)', () => play(['E5', 'C5', 'G4', 'C3']), 'seg-btn'),
    button('▶ Keyboard Order (8, 5, 3)', () => play(['C5', 'G4', 'E4', 'C3']), 'seg-btn'),
  );
  box.append(stage, row, cap);
}

// ---------- spot the fault ----------

function faultQuiz(box: HTMLElement) {
  head(box, 'Self-Test', 'Spot the Fault', 'A correct first-species counterpoint with exactly one note changed. Which rule does it break?');
  const stage = h('div', 'fux-stage');
  const opts = h('div', 'chip-row');
  const fb = h('p', 'mot-verdict');
  fb.setAttribute('aria-live', 'polite');
  const groups: Record<string, string> = {
    par5: 'Parallel fifths', par8: 'Parallel octaves or unisons', direct: 'Hidden fifth or octave (direct motion)', mel: 'Unsingable melodic interval',
    'acc-diss': 'Dissonance', begin: 'Bad beginning', 'begin-mode': 'Bad beginning', end: 'Bad ending', cad: 'Wrong cadence', unison: 'Unison in the middle', skip8: 'Skips into an octave',
  };
  const pool = ['Parallel fifths', 'Parallel octaves or unisons', 'Hidden fifth or octave (direct motion)', 'Unsingable melodic interval', 'Dissonance', 'Wrong cadence', 'Unison in the middle', 'Bad beginning'];
  let state: { sol: Voice[]; answer: string; issues: Issue[] } | null = null;
  let right = 0;
  let total = 0;

  function make(): boolean {
    const modes = Object.keys(MODES);
    for (let attempt = 0; attempt < 40; attempt++) {
      const m = modes[Math.floor(Math.random() * modes.length)];
      const pos = Math.random() < 0.5 ? 1 : 0;
      const ex = buildExercise(m, 2, pos, 1, 0, {});
      const sol = solve(ex, m, { maxNodes: 6000, seed: (Math.random() * 1e9) | 0 }) as Voice[] | null;
      if (!sol) continue;
      const notes = sol[1 - pos].notes;
      for (let t = 0; t < 30; t++) {
        const k = Math.floor(Math.random() * notes.length);
        const orig = notes[k].p!;
        notes[k].p = fromStep(parse(orig).step + [-3, -2, -1, 1, 2, 3, 4][Math.floor(Math.random() * 7)], 0);
        const r = analyze(sol);
        const rules = [...new Set((r.errors as Issue[]).map((e) => groups[e.rule]).filter(Boolean))];
        if (r.errors.length >= 1 && rules.length === 1 && (r.errors as Issue[]).every((e) => groups[e.rule])) {
          state = { sol, answer: rules[0], issues: r.issues.filter((i: Issue) => i.level === 'error') };
          return true;
        }
        notes[k].p = orig;
      }
    }
    return false;
  }

  function next() {
    fb.className = 'mot-verdict';
    fb.textContent = 'Listen, look, and choose.';
    if (!make() || !state) {
      fb.textContent = 'Could not build a puzzle. Try again.';
      return;
    }
    showScore(stage, state.sol, 'Spot the fault');
    opts.replaceChildren();
    const picks = [state.answer];
    const others = pool.filter((p) => p !== state!.answer).sort(() => Math.random() - 0.5);
    while (picks.length < 4) picks.push(others.pop()!);
    picks.sort(() => Math.random() - 0.5).forEach((c) => opts.append(button(titleCase(c), () => answer(c), 'seg-btn')));
  }

  function answer(c: string) {
    const st = state!;
    total++;
    const ok = c === st.answer;
    if (ok) right++;
    showScore(stage, st.sol, 'Spot the fault', st.issues);
    fb.className = `mot-verdict ${ok ? 'ok' : 'no'}`;
    fb.replaceChildren(pill(ok ? 'Correct' : 'Not quite', ok), ' It was ', Object.assign(h('b'), { textContent: st.answer.toLowerCase() }), `. ${st.issues[0]?.msg ?? ''} (${right}/${total}) `, button('Next Puzzle', next));
  }

  box.append(stage, opts, fb);
  const bar = h('div', 'chip-row');
  bar.append(button('New Puzzle', next));
  box.append(bar);
  next();
}

// ---------- entry ----------

const TOOLS: Record<string, (box: HTMLElement) => void> = {
  'motion-lab': motionLab,
  'interval-explorer': intervalExplorer,
  'mode-explorer': modeExplorer,
  'suspension-lab': suspensionLab,
  monochord,
  'triad-order': triadOrder,
  'fault-quiz': faultQuiz,
};

export function mountTool(box: HTMLElement, id: string): void {
  TOOLS[id]?.(box);
}
