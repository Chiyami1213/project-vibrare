// The interactive tools of the Music History tab and its "History Background" panels. The logic is in pure.ts (tested);
// this file is the page: inputs, tables, scores and sound. Ported from the packs' tools/history-tools.js.
import {
  GCLASS, GENERA, HEX, MODES12, NAMES, PURE_FIFTH, PURE_THIRD, RHYTHMIC_MODES, SPELL, SYL, SYSTEMS,
  analyseChords, genusCents, intervalsOf, mensuration, mod, modeScale, modeSpecies, organum, parseMelody, parseRow, rootMotion,
  rowMatrix, solmize, transform, triName, triPcs, ursatz,
} from './pure';
import type { OrganumKind, Prolation, Tempus, Triad } from './pure';
import { button, choices, h, head, s, showScore, sound } from '../tool-kit';
import { sampler } from '../sampler';

// ---------- helpers ----------

/** Play [midi (may have cents), start in beats, length in beats, level]. */
function play(events: [number, number, number, number?][], beat = 0.5) {
  sampler.stop();
  void sound(events.map(([midi, on, du, g]) => ({ midi, at: on * beat, dur: du * beat * 0.97, level: g ?? 0.75 })));
}

function select(options: [string, string][], value: string, onchange: (v: string) => void, label: string): HTMLLabelElement {
  const sel = h('select', 'pl-select');
  sel.setAttribute('aria-label', label);
  for (const [v, t] of options) {
    const o = h('option', '', t);
    o.value = v;
    o.selected = v === value;
    sel.append(o);
  }
  sel.addEventListener('change', () => onchange(sel.value));
  const l = h('label', 'pl-inline');
  l.append(`${label} `, sel);
  return l;
}

function textField(label: string, value: string): { wrap: HTMLElement; input: HTMLInputElement } {
  const input = h('input', 'pl-select txt');
  input.type = 'text';
  input.value = value;
  input.setAttribute('aria-label', label);
  input.spellcheck = false;
  const wrap = h('label', 'pl-inline txt-field');
  wrap.append(`${label} `, input);
  return { wrap, input };
}

function table(rows: (string | Node)[][], opts: { head?: boolean; cls?: (r: number, c: number) => string } = {}): HTMLElement {
  const scroll = h('div', 'table-scroll');
  const t = h('table', 'data-table');
  rows.forEach((r, ri) => {
    const tr = h('tr');
    r.forEach((c, ci) => {
      const cell = h(ci === 0 || (opts.head && ri === 0) ? 'th' : 'td');
      if (opts.head && ri === 0) cell.scope = 'col';
      else if (ci === 0) cell.scope = 'row';
      cell.append(c);
      const cls = opts.cls?.(ri, ci);
      if (cls) cell.className = cls;
      tr.append(cell);
    });
    t.append(tr);
  });
  scroll.append(t);
  return scroll;
}

const note = (text: string, cls = 'muted-line') => h('p', cls, text);
const pcName = (pc: number) => NAMES[pc];

// ---------- tuning lab ----------

function tuningLab(box: HTMLElement) {
  head(box, 'Tool', 'Monochord and Tuning Lab', 'Choose a system. The table gives every note in cents above C and the size of each fifth and major third. Red: more than 10 cents from pure. Green: pure. The sounds are the instrument chosen in Settings, retuned.');
  let sys = 'mt14';
  let root = 0;
  const row = h('div', 'pl-row');
  const nt = note('');
  const tbl = h('div');
  row.append(
    select(Object.entries(SYSTEMS).map(([k, v]) => [k, v.name] as [string, string]), sys, (v) => { sys = v; draw(); }, 'Tuning System'),
    select(NAMES.map((n, i) => [String(i), n] as [string, string]), '0', (v) => { root = Number(v); }, 'Triad or Fifth On'),
  );
  const m = (c: number[], pc: number, oct = 0) => 60 + oct * 12 + c[pc] / 100;
  const buttons = h('div', 'chip-row');
  buttons.append(
    button('▶ Scale', () => {
      const c = SYSTEMS[sys].cents();
      play([...[0, 2, 4, 5, 7, 9, 11].map((pc, i) => [m(c, pc), i, 1] as [number, number, number]), [72, 7, 2]]);
    }, 'seg-btn'),
    button('▶ Major Triad', () => {
      const c = SYSTEMS[sys].cents();
      const t = [root, mod(root + 4, 12), mod(root + 7, 12)];
      const oc = (x: number) => (x < root ? 1 : 0);
      play([...t.map((pc, i) => [m(c, pc, oc(pc)), i * 0.5, 1.5] as [number, number, number]), ...t.map((pc) => [m(c, pc, oc(pc)), 2.2, 3] as [number, number, number])]);
    }, 'seg-btn'),
    button('▶ Fifth', () => {
      const c = SYSTEMS[sys].cents();
      const f = mod(root + 7, 12);
      play([[m(c, root), 0, 3], [m(c, f, f < root ? 1 : 0), 0, 3]]);
    }, 'seg-btn'),
    button('▶ The Wolf (G♯–E♭)', () => {
      const c = SYSTEMS[sys].cents();
      play([[m(c, 8), 0, 3], [m(c, 3, 1), 0, 3]]);
    }, 'seg-btn'),
  );
  function draw() {
    const S0 = SYSTEMS[sys];
    const c = S0.cents();
    nt.textContent = S0.note;
    const { fifths, thirds } = intervalsOf(c);
    const kind = (v: number, ref: number) => (Math.abs(v - ref) > 10 ? 'cell-bad' : Math.abs(v - ref) < 0.6 ? 'cell-pure' : '');
    const cell = (v: number, ref: number) => {
      const d = v - ref;
      const e = h('span', '', v.toFixed(1));
      e.title = `${d >= 0 ? '+' : ''}${d.toFixed(1)} cents from pure`;
      return e;
    };
    const rows: (string | Node)[][] = [
      ['Note', ...NAMES],
      ['Cents Above C', ...c.map((x) => x.toFixed(1))],
      ['Fifth on It', ...fifths.map((v) => cell(v, PURE_FIFTH))],
      ['Major Third on It', ...thirds.map((v) => cell(v, PURE_THIRD))],
    ];
    tbl.replaceChildren(table(rows, { head: true, cls: (r, ci) => (ci === 0 ? '' : r === 2 ? kind(fifths[ci - 1], PURE_FIFTH) : r === 3 ? kind(thirds[ci - 1], PURE_THIRD) : '') }));
  }
  box.append(row, nt, tbl, buttons);
  draw();

  // Greek genera
  const gen = h('div', 'subtool');
  const out = note('');
  gen.append(note('Aristoxenian genera. The fourth is divided into 30 parts (one part is about 16.6 cents). The shades are after Cleonides; played downward from the top, as the Greeks named them.'));
  const gr = h('div', 'chip-row');
  for (const [n, parts] of GENERA) {
    gr.append(button(`${n} ${parts.join('+')}`, () => {
      const steps = genusCents(parts);
      let acc = 0;
      const pts = [0];
      steps.forEach((x) => pts.push((acc += x)));
      play(pts.slice().reverse().map((c, i) => [59 + c / 100, i, 1.1] as [number, number, number]));
      out.textContent = `${n}: steps of ${steps.map((x) => `${x.toFixed(0)} cents`).join(', ')} (from the bottom note upward).`;
    }, 'seg-btn'));
  }
  gen.append(gr, out);
  box.append(gen);
}

// ---------- gamut and hexachords ----------

function gamutTool(box: HTMLElement) {
  head(box, 'Tool', 'Gamut and Hexachord Solmizer', 'Type a melody in letter names (Bb for b♭; octave numbers optional). The tool sings it in Guidonian syllables, mutating at the latest shared note. A mutation is shown as old/new.');
  const PRE: [string, string][] = [
    ['C D E F G A G F E D C', 'Natural Hexachord'],
    ['G A B C D E F E D C', 'Hard to Natural (Mutation)'],
    ['F G A Bb A G F', 'Soft Hexachord (Cantus Mollis)'],
    ['D F G A Bb A G F E D', 'Mode 1 Chant With B♭'],
    ['C D F D E D', 'Ut Queant Laxis Opening'],
  ];
  const { wrap, input } = textField('Melody', PRE[1][0]);
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(PRE, PRE[1][0], (v) => { input.value = v; go(); }, 'Examples'), wrap, button('Solmize', () => go()));
  const det = h('details', 'bg-more');
  det.append(h('summary', '', 'Show the Whole Gamut (Γ-ut to e-la)'));
  const hexStarts: [string, keyof typeof HEX][] = [['G2', 'hard'], ['C3', 'nat'], ['F3', 'soft'], ['G3', 'hard'], ['C4', 'nat'], ['F4', 'soft'], ['G4', 'hard']];
  const LET = 'CDEFGAB';
  const stepOf = (p: string) => Number(p.slice(1)) * 7 + LET.indexOf(p[0]);
  const rows: string[][] = [['Note', 'Syllables']];
  for (let st = stepOf('E5'); st >= stepOf('G2'); st--) {
    const L = LET[mod(st, 7)];
    const syl: string[] = [];
    for (const [start, hx] of hexStarts) {
      const k = st - stepOf(start);
      if (k >= 0 && k < 6) syl.push(SYL[k] + (L === 'B' ? (hx === 'soft' ? ' (b♭)' : ' (b♮)') : ''));
    }
    rows.push([(st === stepOf('G2') ? 'Γ ' : '') + L + Math.floor(st / 7), syl.join(' · ')]);
  }
  det.append(table(rows, { head: true }));
  box.append(row, out, det);

  function go() {
    out.replaceChildren();
    const r = parseMelody(input.value, 4);
    if ('err' in r) return out.append(note(r.err, 'verdict bad'));
    const sol = solmize(r.notes);
    if (!sol) return out.append(note('A note lies outside all three hexachords (F♯ or E♭, for example, is musica ficta).', 'verdict bad'));
    const flat = r.notes.some((n) => n.L === 'B' && n.acc === -1);
    out.append(
      table([
        ['Note', ...sol.map((x) => x.n.s.replace(/\d/, '').replace('b', '♭'))],
        ['Syllable', ...sol.map((x) => x.syl)],
        ['Hexachord', ...sol.map((x) => HEX[x.hex].name.split(' ')[0])],
      ], { cls: (ri, ci) => (ri === 1 && ci > 0 && sol[ci - 1].mut ? 'cell-pure' : '') }),
      note(`${flat ? 'Cantus mollis (b♭ present). ' : 'Cantus durus (no b♭). '}${sol.filter((x) => x.mut).length} mutation(s).`),
    );
    const stage = h('div', 'fux-stage');
    out.append(stage);
    showScore(stage, [{ role: 'cf', notes: r.notes.map((n) => ({ p: n.s, d: 0.5 })) }], 'Melody as entered');
  }
  go();
}

// ---------- the twelve modes ----------

function modeTool(box: HTMLElement) {
  head(box, 'Tool', 'Mode Explorer: Eight and Twelve Modes', 'The eight church modes and Glarean’s four additions (1547). The tenor is the reciting tone of the psalm tone (for mode 3 the later C, for mode 4 A); the tenors of Glarean’s modes are given by analogy.');
  let cur = MODES12[0];
  const info = h('div', 'mode-info');
  const stage = h('div', 'fux-stage');
  function draw() {
    const m = cur;
    const sp = modeSpecies(m);
    info.replaceChildren();
    const kv: [string, string][] = [
      ['Final', m.fin[0]],
      ['Ambitus', `${m.lo[0]}–${m.hi[0]} (${sp.authentic ? 'authentic' : 'plagal'})`],
      ['Tenor', m.ten[0]],
      ['Species', `fifth ${sp.fifth} + fourth ${sp.fourth}`],
      ['Name', `${m.greek}${m.n <= 8 ? ' (Alia Musica tradition)' : ' (Glarean 1547)'}`],
      ['Zarlino 1571', `mode ${m.z}`],
    ];
    for (const [k, v] of kv) {
      const d = h('div', 'kv');
      d.append(h('span', 'muted-line', k), Object.assign(h('b'), { textContent: v }));
      info.append(d);
    }
    showScore(stage, [{ role: 'cf', notes: modeScale(m) }], `Mode ${m.n}`);
  }
  box.append(select(MODES12.map((m) => [String(m.n), `${m.n}. ${m.greek}`] as [string, string]), '1', (v) => { cur = MODES12[Number(v) - 1]; draw(); }, 'Mode'), info, stage, note('Final and tenor are listed above; play the octave up and down.'));
  draw();
}

// ---------- organum ----------

function organumTool(box: HTMLElement) {
  head(box, 'Tool', 'Organum and Contrapunctus Lab', 'Enter a chant and choose a kind of organum. Each vertical interval is classed after Johannes de Garlandia (about 1250). The contrapunctus check applies the 14th-century rules to the result.');
  const PRE: [string, string][] = [
    ['D4 E4 F4 E4 D4 F4 G4 F4 E4 D4', 'Mode 1 Phrase'],
    ['G4 A4 C5 B4 A4 G4', 'Mode 8 Phrase'],
    ['D4 F4 G4 A4 G4 F4 E4 D4', 'Rising and Falling'],
  ];
  let kind: OrganumKind = 'fourth';
  const { wrap, input } = textField('Chant (Vox Principalis)', PRE[0][0]);
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(PRE, PRE[0][0], (v) => { input.value = v; go(); }, 'Examples'), wrap);
  const kinds: [string, string][] = [['fourth', 'At the Fourth, Boundary Tone'], ['fifth', 'Parallel Fifth'], ['octave', 'Parallel Octave'], ['free', 'Note Against Note (Contrary)']];
  box.append(row, choices(kinds, kind, (v) => { kind = v as OrganumKind; go(); }, 'Kind of organum'), out);
  const TITLES: Record<OrganumKind, string> = { fourth: 'Organum at the Fourth', fifth: 'Parallel Organum at the Fifth', octave: 'Parallel Organum at the Octave', free: 'Note-Against-Note Discant' };

  function go() {
    out.replaceChildren();
    const r = parseMelody(input.value, 4);
    if ('err' in r) return out.append(note(r.err, 'verdict bad'));
    const res = organum(r.notes.map((n) => n.s), kind);
    if (res.boundary) out.append(note(`Boundary tone: ${res.boundary.replace(/\d/, '')}. The organal voice holds it rather than descend to a tritone; the final unison is the occursus.`));
    out.append(
      table([
        ['Principal', ...res.principal],
        ['Organal', ...res.organal],
        ['Garlandia', ...res.intervals.map((v) => GCLASS[v])],
      ], { cls: (ri, ci) => (ri === 2 && ci > 0 && /discord/.test(GCLASS[res.intervals[ci - 1]]) ? 'cell-bad' : '') }),
      note(`Contrapunctus check (14th-century rules): ${res.issues.length ? res.issues.join('; ') : 'no parallel perfect consonances, and the progressions are directed.'}${kind !== 'free' ? ' Organum is older than these rules, and its parallels are its essence.' : ''}`, res.issues.length ? 'verdict meh' : 'muted-line'),
    );
    const stage = h('div', 'fux-stage');
    out.append(stage);
    showScore(stage, [
      { role: 'cf', notes: res.principal.map((p) => ({ p, d: 0.5 })) },
      { role: 'cpt', notes: res.organal.map((p) => ({ p, d: 0.5 })) },
    ], TITLES[kind]);
  }
  go();
}

// ---------- rhythmic modes and mensuration ----------

function mensuralTool(box: HTMLElement) {
  head(box, 'Tool', 'Rhythmic Modes and Mensuration', 'Top: Garlandia’s six rhythmic modes (L = long, B = breve) transcribed in 6/8. Bottom: Ars nova mensuration, tempus times prolation.');
  const rm = h('div', 'rm');
  for (const { n, label, durs } of RHYTHMIC_MODES) {
    const svg = s('svg', { viewBox: '0 0 240 30', class: 'rm-svg' });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Mode ${n}: ${label}`);
    const cycle = durs.reduce((a, b) => a + b, 0);
    const reps = Math.max(1, Math.round(6 / cycle)) * 2;
    let x = 0;
    for (let r = 0; r < reps; r++) {
      for (const d of durs) {
        s('rect', { x: x * 20 + 1, y: 6, width: d * 20 - 3, height: 18, rx: 3, class: d >= 2 ? 'rm-l' : 'rm-b' }, svg);
        x += d;
      }
    }
    const rowEl = h('div', 'rm-row');
    rowEl.append(
      Object.assign(h('b'), { textContent: `Mode ${n}` }),
      h('span', 'muted-line', `${label}${n === 1 || n === 2 || n === 6 ? ' · rectus' : ''}`),
      svg,
      Object.assign(button('▶', () => {
        let t = 0;
        const ev: [number, number, number, number][] = [];
        for (let r = 0; r < reps; r++) {
          durs.forEach((d, i) => {
            ev.push([60 + [0, 2, 4][i % 3] + (r % 2 ? 7 : 0), t, d, i === 0 ? 0.85 : 0.6]);
            t += d;
          });
        }
        play(ev, 0.22);
      }, 'btn'), { title: `play mode ${n}` }),
    );
    rm.append(rowEl);
  }

  let tempus: Tempus = 'perf';
  let prol: Prolation = 'maj';
  const res = h('div', 'mz-res');
  function draw() {
    const m = mensuration(tempus, prol);
    const svg = s('svg', { viewBox: '0 0 40 40', width: 40, height: 40, class: 'msign' });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'mensuration sign');
    if (tempus === 'perf') s('circle', { cx: 20, cy: 20, r: 14, fill: 'none', 'stroke-width': 3 }, svg);
    else s('path', { d: 'M31 9 A14 14 0 1 0 31 31', fill: 'none', 'stroke-width': 3 }, svg);
    if (prol === 'maj') s('circle', { cx: 20, cy: 20, r: 3 }, svg);
    const txt = h('div');
    const p = h('p');
    p.append(Object.assign(h('b'), { textContent: `1 breve = ${m.semibreves} semibreves = ${m.total} minims` }), ` · modern equivalent ${m.modern}`);
    txt.append(p, button('▶ One Breve', () => {
      const ev: [number, number, number, number][] = [];
      for (let i = 0; i < m.total; i++) ev.push([67 + (i % m.minims === 0 ? 0 : -3), i, 1, i === 0 ? 0.95 : i % m.minims === 0 ? 0.75 : 0.45]);
      ev.push([60, 0, m.total, 0.5]);
      play(ev, 0.28);
    }, 'seg-btn'));
    res.replaceChildren(svg, txt);
  }
  const sub = h('div', 'subtool');
  sub.append(
    choices([['perf', 'Tempus Perfectum'], ['imp', 'Tempus Imperfectum']], tempus, (v) => { tempus = v as Tempus; draw(); }, 'Tempus'),
    choices([['maj', 'Prolatio Maior'], ['min', 'Prolatio Minor']], prol, (v) => { prol = v as Prolation; draw(); }, 'Prolation'),
    res,
  );
  box.append(rm, sub);
  draw();
}

// ---------- the Tonnetz ----------

function tonnetzTool(box: HTMLElement) {
  head(box, 'Tool', 'Tonnetz and Riemann Transformations', 'Fifths run left to right, major thirds up and to the right. Triangles are triads. P, L and R each move by one common-tone step. The dualist reading (Riemann) is shown beside the modern name.');
  let cur: Triad = { r: 0, q: 'maj' };
  const path: Triad[] = [cur];
  const svg = s('svg', { viewBox: '0 0 520 260', class: 'tonnetz' });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Tonnetz');
  const wrap = h('div', 'mot-wrap');
  wrap.append(svg);
  const name = h('p');
  const pth = note('');
  const sound1 = () => play(triPcs(cur).map((pc, i) => [60 + pc, i * 0.3, 2.4, 0.6] as [number, number, number, number]));
  const ctl = h('div', 'chip-row');
  const TITLES = { P: 'parallel', L: 'leading-tone exchange', R: 'relative' };
  for (const op of ['P', 'L', 'R'] as const) {
    ctl.append(Object.assign(button(op, () => { cur = transform(cur, op); path.push(cur); draw(); sound1(); }), { title: TITLES[op] }));
  }
  ctl.append(
    button('▶ Path', () => play(path.flatMap((t, i) => triPcs(t).map((pc) => [60 + pc, i * 2, 2, 0.6] as [number, number, number, number]))), 'seg-btn'),
    button('Reset', () => { cur = { r: 0, q: 'maj' }; path.length = 0; path.push(cur); draw(); }, 'seg-btn'),
    select(NAMES.map((n, i) => [String(i), `${n} Major`] as [string, string]), '0', (v) => { cur = { r: Number(v), q: 'maj' }; path.length = 0; path.push(cur); draw(); sound1(); }, 'Start'),
  );
  box.append(wrap, ctl, name, pth);
  const dx = 64;
  const dy = 52;
  const X0 = 30;
  const Y0 = 230;
  const pos = (x: number, y: number): [number, number] => [X0 + x * dx + (y * dx) / 2, Y0 - y * dy];
  const pcAt = (x: number, y: number) => mod(7 * x + 4 * y, 12);
  function draw() {
    svg.replaceChildren();
    const set = new Set(triPcs(cur));
    for (let y = 0; y < 5; y++) {
      for (let x = -2; x < 7; x++) {
        const p0 = pos(x, y);
        const p1 = pos(x + 1, y);
        const p2 = pos(x, y + 1);
        const p3 = pos(x + 1, y - 1);
        const maj = [pcAt(x, y), pcAt(x, y + 1), pcAt(x + 1, y)];
        const mn = [pcAt(x, y), pcAt(x + 1, y), pcAt(x + 1, y - 1)];
        const on = (arr: number[], q: string) => q === cur.q && arr.every((a) => set.has(a));
        if (y < 4) s('path', { d: `M${p0} L${p2} L${p1}z`, class: `tri maj${on(maj, 'maj') ? ' on' : ''}` }, svg);
        if (y > 0) s('path', { d: `M${p0} L${p1} L${p3}z`, class: `tri min${on(mn, 'min') ? ' on' : ''}` }, svg);
      }
    }
    for (let y = 0; y < 5; y++) {
      for (let x = -2; x < 8; x++) {
        const [px, py] = pos(x, y);
        if (px < 10 || px > 510) continue;
        const pc = pcAt(x, y);
        s('circle', { cx: px, cy: py, r: 13, class: `tn${set.has(pc) ? ' on' : ''}` }, svg);
        s('text', { x: px, y: py + 4, class: 'tnl' }, svg).textContent = NAMES[pc];
      }
    }
    const top = mod(cur.r + 7, 12);
    name.replaceChildren(
      Object.assign(h('b'), { textContent: triName(cur) }),
      ` · Riemann: ${cur.q === 'maj' ? `Oberklang of ${NAMES[cur.r]} (generated upward from ${NAMES[cur.r]})` : `Unterklang of ${NAMES[top]}, written °${NAMES[top]} (generated downward from ${NAMES[top]})`}`,
    );
    pth.textContent = `Path: ${path.map(triName).join(' → ')}`;
  }
  draw();
}

// ---------- the fundamental bass ----------

function fundamentalBassTool(box: HTMLElement) {
  head(box, 'Tool', 'Rameau’s Fundamental Bass', 'Enter chords as letters separated by |, lowest note first (that is the sounding bass). The tool finds each chord’s root by stacking thirds, draws the fundamental bass and labels the root motion. F–A–C–D shows double emploi.');
  const PRE: [string, string][] = [
    ['C E G | F A C D | G B D F | C E G', 'Cadences With Added Sixth and Seventh'],
    ['E G C | F A D | G B D F | C E G', 'Inversions'],
    ['C E G | A C E | D F A | G B D | C E G', 'Fifths and Thirds'],
    ['C E G | D F A | E G B | F A C | G B D | C E G', 'Stepwise Roots (Problem Case)'],
  ];
  const { wrap, input } = textField('Chords', PRE[0][0]);
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(PRE, PRE[0][0], (v) => { input.value = v; go(); }, 'Examples'), wrap);
  box.append(row, out);

  function go() {
    out.replaceChildren();
    const rows = analyseChords(input.value);
    if (!rows) return out.append(note('Use letter names such as C E G | F A C.', 'verdict bad'));
    const mv = rootMotion(rows);
    out.append(
      table([
        ['Chord', ...rows.map((r) => r.chord.map(pcName).join('–'))],
        ['Bass', ...rows.map((r) => pcName(r.bass))],
        ['Fundamental', ...rows.map((r) => (r.alt != null ? (r.rin !== r.rout ? `${pcName(r.rin)} = ${pcName(r.rout)} (double emploi)` : `${pcName(r.rin)} (or ${pcName(r.rin === r.alt ? r.root : r.alt)})`) : pcName(r.root) + (r.bass !== r.root ? ' · inv.' : '')))],
        ['Root Motion', '—', ...mv],
      ], { cls: (ri, ci) => (ri === 3 && ci > 0 && /⚠/.test(mv[ci - 1] ?? '') ? 'cell-bad' : ri === 2 && ci > 0 && rows[ci - 1].alt != null ? 'cell-pure' : '') }),
    );
    if (mv.some((m) => /⚠/.test(m))) out.append(note('Stepwise roots break Rameau’s ideal of fifths and thirds. He explained them by supposition or double emploi; Sechter by an implied intermediate root.', 'verdict meh'));
    const sp = (pc: number) => SPELL[pc];
    const bass = rows.map((r) => ({ p: `${sp(r.bass)}3`, d: 1 }));
    const fund = rows.flatMap((r) => (r.rin !== r.rout ? [{ p: `${sp(r.rin)}2`, d: 0.5 }, { p: `${sp(r.rout)}2`, d: 0.5 }] : [{ p: `${sp(r.rin)}2`, d: 1 }]));
    const upper = rows.map((r) => {
      const others = r.chord.filter((x) => x !== r.bass);
      return { p: `${sp(others.length ? others[others.length - 1] : r.bass)}4`, d: 1 };
    });
    const stage = h('div', 'fux-stage');
    out.append(stage, note('Lowest staff: the fundamental bass (the roots), written an octave down as Rameau prints it.'));
    showScore(stage, [{ role: 'cpt', notes: upper }, { role: 'cpt', notes: bass }, { role: 'cpt', notes: fund }], 'Top voice, actual bass and fundamental bass');
  }
  go();
}

// ---------- the twelve-tone matrix ----------

function rowTool(box: HTMLElement) {
  head(box, 'Tool', 'Twelve-Tone Matrix', 'Enter a row as pitch names or numbers 0–11 (C = 0). Rows are prime forms (P) read left to right; columns are inversions (I) read top to bottom. R and RI are read backwards. Select a label to hear the form.');
  const PRE: [string, string][] = [
    ['G Bb D F# A C E G# B C# Eb F', 'Berg, Violin Concerto'],
    ['E F G Db Gb Eb Ab D B C A Bb', 'Schoenberg, Suite Op. 25'],
    ['0 11 7 8 3 1 2 10 6 5 4 9', 'Webern, Symphony Op. 21'],
    ['C C# D D# E F F# G G# A A# B', 'Chromatic Scale'],
  ];
  const { wrap, input } = textField('Row', PRE[0][0]);
  const out = h('div');
  const row = h('div', 'pl-row');
  row.append(select(PRE, PRE[0][0], (v) => { input.value = v; go(); }, 'Examples'), wrap);
  box.append(row, out);
  const playForm = (arr: number[]) => play(arr.map((pc, i) => [60 + pc, i, 1] as [number, number, number]), 0.32);
  const tiny = (label: string, arr: number[]) => button(label, () => playForm(arr), 'tiny');

  function go() {
    out.replaceChildren();
    const r = parseRow(input.value);
    if (!r) return out.append(note('A row needs all twelve pitch classes exactly once.', 'verdict bad'));
    const { M, label, pT, iT } = rowMatrix(r);
    const r0 = r[0];
    const rows: (string | Node)[][] = [];
    rows.push(['', ...M[0].map((_, j) => tiny(`I${label(M[0][j])}`, M.map((rw) => rw[j]))), '']);
    M.forEach((rw) => rows.push([tiny(`P${label(rw[0])}`, rw), ...rw.map((pc) => pcName(pc)), tiny(`R${label(rw[0])}`, rw.slice().reverse())]));
    rows.push(['', ...M[0].map((_, j) => tiny(`RI${label(M[0][j])}`, M.map((rw) => rw[j]).reverse())), '']);
    const t = table(rows, { cls: (ri, ci) => (ri >= 1 && ri <= 12 && ci >= 1 && ci <= 12 && M[ri - 1][ci - 1] === r0 ? 'cell-pure' : '') });
    t.classList.add('mtx');
    out.append(t, note(`Hexachordal combinatoriality: P at ${pT.length ? pT.map((n) => `P${n}`).join(', ') : 'none'}; I at ${iT.length ? iT.map((n) => `I${n}`).join(', ') : 'none'}. ${pT.length && iT.length ? 'At least semi-combinatorial in both senses.' : iT.length ? 'Inversionally combinatorial (Schoenberg’s favourite kind).' : ''}`));
  }
  go();
}

// ---------- the Ursatz ----------

function ursatzTool(box: HTMLElement) {
  head(box, 'Tool', 'Ursatz Viewer', 'Schenker’s fundamental structure: the Urlinie descends to ① over the bass arpeggiation I–V–I. Choose the line, the mode, and whether to interrupt.');
  let line: 3 | 5 | 8 = 3;
  let mode: 'maj' | 'min' = 'maj';
  let intr = false;
  const stage = h('div', 'fux-stage');
  const cap = note('');
  box.append(
    choices([['3', '③-Line'], ['5', '⑤-Line'], ['8', '⑧-Line']], '3', (v) => { line = Number(v) as 3 | 5 | 8; draw(); }, 'Line'),
    choices([['maj', 'C Major'], ['min', 'C Minor']], 'maj', (v) => { mode = v as 'maj' | 'min'; draw(); }, 'Mode'),
    choices([['no', 'Plain'], ['yes', 'Interruption']], 'no', (v) => { intr = v === 'yes'; draw(); }, 'Interruption'),
    stage,
    cap,
  );
  function draw() {
    const u = ursatz(line, mode, intr);
    showScore(stage, [{ role: 'cf', notes: u.sop }, { role: 'cpt', notes: u.bass }], `${u.label} over I–V–I`);
    cap.textContent = intr
      ? 'Interruption: the first descent stops on ② over V; the structure begins again and completes the descent.'
      : 'Background level. The second degree is supported by V; every other tone of the Urlinie by I (in a real piece the middleground prolongs them).';
  }
  draw();
}

// ---------- entry ----------

const TOOLS: Record<string, (box: HTMLElement) => void> = {
  'tuning-lab': tuningLab,
  gamut: gamutTool,
  modes: modeTool,
  organum: organumTool,
  mensural: mensuralTool,
  tonnetz: tonnetzTool,
  'fundamental-bass': fundamentalBassTool,
  'row-matrix': rowTool,
  ursatz: ursatzTool,
};

export const HISTORY_TOOL_IDS = Object.keys(TOOLS);

export function mountHistoryTool(box: HTMLElement, id: string): void {
  TOOLS[id]?.(box);
}
