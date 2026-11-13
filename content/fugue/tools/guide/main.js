(function () {
'use strict';
const Gx = window.Gradus;
const { AudioEng, Player, figure, H, btn, seg, select } = Gx;

/* ---------------- pitch helpers (diatonic + chromatic) ---------------- */
const LET = 'CDEFGAB', NAT = [0, 2, 4, 5, 7, 9, 11];
function P(s) { const m = /^([A-Ga-g])(##|#|bb|b|n)?(-?\d)$/.exec(String(s).trim()); if (!m) return null; const L = LET.indexOf(m[1].toUpperCase()); const acc = { '##': 2, '#': 1, b: -1, bb: -2, n: 0 }[m[2] || 'n'] || 0; const oct = +m[3]; return { step: oct * 7 + L, acc }; }
const midi = p => 12 * (Math.floor(p.step / 7) + 1) + NAT[((p.step % 7) + 7) % 7] + p.acc;
const nm = p => LET[((p.step % 7) + 7) % 7] + ({ 2: '##', 1: '#', 0: '', '-1': 'b', '-2': 'bb' }[p.acc] || '') + Math.floor(p.step / 7);
function trans(p, steps, semis) { const q = { step: p.step + steps, acc: 0 }; q.acc = midi(p) + semis - midi(q); return q; }
// keys: tonic letter step + signature
const KEYS = {
  'D mode': { t: 1, sig: {}, minor: false, modal: true }, 'E mode': { t: 2, sig: {}, modal: true }, 'F mode': { t: 3, sig: {}, modal: true },
  'G mode': { t: 4, sig: {}, modal: true }, 'A mode': { t: 5, sig: {}, modal: true }, 'C mode': { t: 0, sig: {}, modal: true },
  'C major': { t: 0, sig: {} }, 'G major': { t: 4, sig: { F: 1 } }, 'F major': { t: 3, sig: { B: -1 } }, 'D major': { t: 1, sig: { F: 1, C: 1 } },
  'A minor': { t: 5, sig: {}, minor: true }, 'D minor': { t: 1, sig: { B: -1 }, minor: true }, 'E minor': { t: 2, sig: { F: 1 }, minor: true }, 'G minor': { t: 4, sig: { B: -1, E: -1 }, minor: true }
};
const sigAcc = (k, step) => KEYS[k].sig[LET[((step % 7) + 7) % 7]] || 0;
const degOf = (k, p) => ((p.step - KEYS[k].t) % 7 + 7) % 7; // 0 = 1^
function diatonicTrans(k, p, steps) { const q = { step: p.step + steps, acc: 0 }; q.acc = sigAcc(k, q.step) + (p.acc - sigAcc(k, p.step)); return q; }
function parseLine(txt) { // "D4/2 A4/2 G4/4 ..." duration denominators: 1 whole, 2 half, 4 quarter, 8 eighth; "." dotted; r = rest
  return txt.trim().split(/\s+/).filter(Boolean).map(tok => {
    const m = /^([^/]+)(?:\/(\d+)(\.?))?$/.exec(tok); if (!m) return null;
    let d = m[2] ? 1 / +m[2] : 0.25; if (m[3]) d *= 1.5;
    if (/^r$/i.test(m[1])) return { rest: 1, d };
    const p = P(m[1]); return p ? { p, d } : null;
  });
}
const toUi = arr => arr.map(n => n.rest ? { d: n.d, rest: 1 } : { p: nm(n.p), d: n.d });
const lineTxt = arr => arr.map(n => (n.rest ? 'r' : nm(n.p)) + '/' + ({ 1: '1', 0.5: '2', 0.25: '4', 0.125: '8', 0.75: '2.', 0.375: '4.', 0.0625: '16' }[n.d] || '4')).join(' ');
const sum = a => a.reduce((s, n) => s + n.d, 0);
const DEG = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];

function widgetBox(host, title, sub) {
  const box = H('div', { class: 'widget' });
  box.appendChild(H('div', { class: 'w-head' }, H('strong', null, title), sub ? H('span', { class: 'mini', html: sub }) : null));
  host.appendChild(box); return box;
}
function scoreInto(el, cfg) { el.innerHTML = ''; try { figure(el, Object.assign({ check: false }, cfg)); } catch (e) { console.error(e); el.textContent = 'Could not draw this score.'; } }

/* ---------------- subjects ---------------- */
const SUBJ = {
  'D minor · D–A–G–F–E–D (tonal head)': { key: 'D minor', line: 'D4/2 A4/2 G4/4 F4/4 E4/4 D4/4' },
  'D mode · Fux-style, diatonic': { key: 'D mode', line: 'D4/2 F4/2 E4/2 D4/2 G4/2 F4/2 E4/2 D4/2' },
  'C major · stays in the tonic (real answer)': { key: 'C major', line: 'C4/4 D4/4 E4/4 F4/4 E4/4 D4/4 C4/2' },
  'C major · opens on ⑤: G–C': { key: 'C major', line: 'G4/2 C5/4 B4/4 A4/4 G4/4 F4/4 E4/4' },
  'C major · rises to the dominant (tail mutation)': { key: 'C major', line: 'C4/4 E4/4 D4/4 F4/4 E4/8 D4/8 C4/8 B3/8 C4/4 G4/4' },
  'C major · modulating with F♯': { key: 'C major', line: 'C4/4 G4/4 A4/4 F#4/4 G4/2' },
  'A minor · chromatic ascent (Marpurg)': { key: 'A minor', line: 'A4/2 C5/4 C#5/4 D5/4 D#5/4 E5/2' },
  'G minor · descending ⑤–①': { key: 'G minor', line: 'D5/4 C5/8 Bb4/8 A4/4 G4/4 F#4/4 G4/4' }
};

/* ---------------- answer generator (Marpurg's rules) ---------------- */
function makeAnswer(line, key, kind) {
  const K = KEYS[key], notes = line.filter(n => !n.rest), idxs = line.map((n, i) => n.rest ? -1 : i).filter(i => i >= 0);
  const deg = notes.map(n => degOf(key, n.p));
  const plan = notes.map(() => 'P5');
  if (kind !== 'real') {
    // head: leading notes that are 1^ or 5^ (Marpurg rule 1 / Fux: 5th <-> 4th)
    for (let i = 0; i < notes.length && (deg[i] === 0 || deg[i] === 4); i++) { if (deg[i] === 4) plan[i] = 'P4'; }
    // skips 5^ <-> 1^ inside the theme
    for (let i = 1; i < notes.length; i++) {
      const leap = Math.abs(notes[i].p.step - notes[i - 1].p.step) >= 3;
      if (leap && ((deg[i] === 4 && deg[i - 1] === 0) || (deg[i] === 0 && deg[i - 1] === 4))) { if (deg[i] === 4) plan[i] = 'P4'; if (deg[i - 1] === 4) plan[i - 1] = 'P4'; }
    }
    // tail: theme ends on 5^ (or reaches it through raised 4^) -> lead the answer back to the tonic
    let j = notes.length - 1;
    if (deg[j] === 4) { plan[j] = 'P4'; j--; while (j >= 0 && ((deg[j] === 3 && notes[j].p.acc > sigAcc(key, notes[j].p.step)) || deg[j] === 4)) { plan[j] = 'P4'; j--; } }
  }
  const out = line.map(n => n.rest ? { rest: 1, d: n.d } : null);
  notes.forEach((n, i) => {
    const four = plan[i] === 'P4';
    let q;
    if (K.modal) q = diatonicTrans(key, n.p, four ? 3 : 4);
    else q = trans(n.p, four ? 3 : 4, four ? 5 : 7);
    out[idxs[i]] = { p: q, d: n.d, mut: four };
  });
  return { answer: out, plan, deg };
}

function answerTool(host, opts) {
  const box = widgetBox(host, 'Answer generator', 'Type a subject, or pick one, and see the answer Marpurg’s rules give: ① ↔ ⑤ at the head, a skip ⑤–① answered by ①–⑤, and a theme ending on the dominant led back to the tonic. Notes answered at the <b>fourth</b> instead of the fifth are marked ✱. Modes (Fux) answer diatonically within the mode; keys (Marpurg) answer with exact intervals in the dominant key.');
  let name = opts && opts.start || Object.keys(SUBJ)[0], kind = 'tonal';
  const ta = H('input', { type: 'text', class: 'txt', 'aria-label': 'Subject (notes/duration)', value: SUBJ[name].line, spellcheck: 'false' });
  const keySel = select(Object.keys(KEYS).map(k => [k, k]), SUBJ[name].key, () => run(), 'Key or mode');
  const pre = select(Object.keys(SUBJ).map(k => [k, k]), name, v => { name = v; ta.value = SUBJ[v].line; keySel.querySelector('select').value = SUBJ[v].key; run(); }, 'Subject');
  const kseg = seg([['tonal', 'Tonal (rules)'], ['real', 'Real (exact)']], kind, v => { kind = v; run(); }, 'Answer type');
  const row = H('div', { class: 'tools-row' }, pre, keySel, kseg);
  const go = btn('Answer it', () => run(), 'primary');
  const help = H('p', { class: 'mini' }, 'Format: pitch/duration, e.g. D4/2 = D half note, F#4/8 = F♯ eighth, r/4 = quarter rest. Durations: 1 2 4 8 16, add “.” for dotted.');
  const info = H('div', { class: 'ans-info' }), sc = H('div');
  box.append(row, H('div', { class: 'tools-row' }, ta, go), help, info, sc);
  ta.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  function run() {
    const key = keySel.querySelector('select').value; const line = parseLine(ta.value);
    if (!line.length || line.some(x => !x)) { info.innerHTML = '<p class="warn">Could not read the subject. Check the format.</p>'; return; }
    const { answer, deg } = makeAnswer(line, key, kind);
    const muts = answer.filter(n => n.mut).length;
    const notes = line.filter(n => !n.rest);
    info.innerHTML = '';
    const tbl = H('table', { class: 'mini-tbl' });
    tbl.appendChild(H('tr', null, H('th', null, 'Subject'), ...notes.map(n => H('td', null, nm(n.p).replace(/\d/, '')))));
    tbl.appendChild(H('tr', null, H('th', null, 'Degree'), ...deg.map(d => H('td', null, DEG[d]))));
    tbl.appendChild(H('tr', null, H('th', null, 'Answer'), ...answer.filter(n => !n.rest).map(n => H('td', { class: n.mut ? 'mut' : '' }, nm(n.p).replace(/\d/, '') + (n.mut ? '✱' : '')))));
    info.appendChild(H('div', { class: 'tbl-wrap' }, tbl));
    const real = !muts;
    info.appendChild(H('p', { class: 'mini' }, real ? 'Real answer: an exact transposition to the dominant (the theme keeps the character of the key).' : `Tonal answer: ${muts} note${muts > 1 ? 's' : ''} answered at the 4th (✱) so the answer stays in the key. Compare: Fux’s exchange of fifth and fourth (p. 80), Marpurg’s adjustment of the melodic line (p. 166).`));
    const len = sum(line), lead = line.map(n => n), rest = [{ rest: 1, d: len }];
    const lower = toUi(lead).concat([{ d: len, rest: 1 }]);
    const upper = [{ d: len, rest: 1 }].concat(toUi(answer));
    // keep answer above subject: if answer is lower overall, it still sits on the upper staff.
    scoreInto(sc, { fig: 'Model', title: 'Subject, then ' + (real ? 'real' : 'tonal') + ' answer', voices: [{ role: 'cpt', notes: upper }, { role: 'cpt', notes: lower }], figures: null, caption: 'Generated by the tool from your subject. The answer enters as the subject ends; in a real fugue the first voice would continue with a counterpart.' });
  }
  run();
}

/* ---------------- stretto finder ---------------- */
const CONS = new Set([0, 3, 4, 7, 8, 9]);
function sounding(line, t) { let s = 0; for (const n of line) { if (t >= s - 1e-9 && t < s + n.d - 1e-9) return { n, on: Math.abs(t - s) < 1e-9 }; s += n.d; } return null; }
function evalPair(up, lo, beat) {
  const onsets = new Set(); let s = 0; for (const n of up) { onsets.add(+s.toFixed(6)); s += n.d; } s = 0; for (const n of lo) { onsets.add(+s.toFixed(6)); s += n.d; }
  const ts = [...onsets].sort((a, b) => a - b);
  let diss = 0, par = 0, prev = null; const marks = [];
  for (const t of ts) {
    const a = sounding(up, t), b = sounding(lo, t);
    if (!a || !b || a.n.rest || b.n.rest) { prev = null; continue; }
    const iv = ((midi(a.n.p) - midi(b.n.p)) % 12 + 12) % 12; const crossed = midi(a.n.p) < midi(b.n.p);
    const strong = Math.abs(t / beat - Math.round(t / beat)) < 1e-6;
    if (!CONS.has(iv) && strong) { diss++; marks.push(t); }
    if (prev && (iv === 7 || iv === 0) && prev.iv === iv && (a.on && b.on) && (midi(a.n.p) !== prev.a || midi(b.n.p) !== prev.b)) { par++; marks.push(t); }
    if (crossed) marks.push(t);
    prev = { iv, a: midi(a.n.p), b: midi(b.n.p) };
  }
  return { diss, par, marks };
}
function strettoTool(host) {
  const box = widgetBox(host, 'Stretto finder', 'Tries the subject against itself at every entry distance and at the usual intervals (octave, fifth above, fourth below, unison), in two voices. It counts dissonances on strong beats and parallel fifths or octaves. Fewer is better; zero is a candidate for a stretto. Marpurg: “test each theme for stretto” before writing (p. 191).');
  let name = 'C major · stays in the tonic (real answer)';
  const ta = H('input', { type: 'text', class: 'txt', 'aria-label': 'Subject', value: SUBJ[name].line, spellcheck: 'false' });
  const keySel = select(Object.keys(KEYS).map(k => [k, k]), SUBJ[name].key, () => run(), 'Key or mode');
  const pre = select(Object.keys(SUBJ).map(k => [k, k]), name, v => { ta.value = SUBJ[v].line; keySel.querySelector('select').value = SUBJ[v].key; run(); }, 'Subject');
  let beat = 0.5; const bs = seg([['0.5', 'beat = 𝅗𝅥'], ['0.25', 'beat = ♩']], '0.5', v => { beat = +v; run(); }, 'Strong beats');
  const out = H('div'), sc = H('div');
  box.append(H('div', { class: 'tools-row' }, pre, keySel, bs), H('div', { class: 'tools-row' }, ta, btn('Find strettos', () => run(), 'primary')), out, sc);
  const IVS = [['8ve above', 7], ['5th above', 4], ['4th below', -3], ['unison', 0], ['8ve below', -7]];
  function run() {
    const key = keySel.querySelector('select').value, line = parseLine(ta.value);
    if (!line.length || line.some(x => !x)) { out.textContent = 'Could not read the subject.'; return; }
    const L = sum(line); const grid = Math.min(...line.map(n => n.d)); const res = [];
    for (let dly = grid; dly <= L * 0.75 + 1e-9; dly += grid) for (const [lab, st] of IVS) {
      const fol = line.map(n => n.rest ? n : { p: KEYS[key].modal || true ? diatonicTrans(key, n.p, st) : n.p, d: n.d });
      const lead = line.concat([{ rest: 1, d: dly }]), follow = [{ rest: 1, d: dly }].concat(fol);
      const upFirst = st >= 0; const up = upFirst ? follow : lead, lo = upFirst ? lead : follow;
      const r = evalPair(up, lo, beat); res.push({ dly, lab, st, score: r.diss * 2 + r.par * 3, ...r, up, lo });
    }
    res.sort((a, b) => a.score - b.score || a.dly - b.dly);
    out.innerHTML = '';
    const t = H('table', { class: 'mini-tbl' }, H('tr', null, H('th', null, 'Entry after'), H('th', null, 'Interval'), H('th', null, 'Strong-beat dissonances'), H('th', null, 'Parallel 5ths/8ves'), H('th', null, '')));
    res.slice(0, 8).forEach(r => {
      const bars = r.dly; const lab = bars >= 1 ? (bars + ' bar' + (bars > 1 ? 's' : '')) : (bars / 0.25 + ' ♩');
      t.appendChild(H('tr', { class: r.score === 0 ? 'good' : '' }, H('td', null, lab), H('td', null, r.lab), H('td', null, String(r.diss)), H('td', null, String(r.par)),
        H('td', null, btn('Show', () => scoreInto(sc, { fig: 'Model', title: `Stretto: ${r.lab}, entry after ${lab}`, voices: [{ role: 'cpt', notes: toUi(r.up) }, { role: 'cpt', notes: toUi(r.lo) }], caption: 'Generated by the stretto finder. Dissonances on weak beats are not counted; listen and judge whether they work as passing notes.' }), 'ghost'))));
    });
    out.appendChild(H('div', { class: 'tbl-wrap' }, t));
    const best = res[0]; if (best) scoreInto(sc, { fig: 'Model', title: `Best candidate: ${best.lab}, entry after ${best.dly >= 1 ? best.dly + ' bar(s)' : best.dly / 0.25 + ' ♩'}`, voices: [{ role: 'cpt', notes: toUi(best.up) }, { role: 'cpt', notes: toUi(best.lo) }], caption: 'Generated by the stretto finder. Follower transposed diatonically in the key.' });
  }
  run();
}

/* ---------------- invertible counterpoint ---------------- */
const DC = {
  8: { name: 'octave', inv: x => 9 - x, lim: 8, steps: 7, rules: ['Avoid the 5th (→ 4th), unless tied.', 'Do not approach the octave by skip (→ unison by skip).', 'Avoid the octave on a strong beat except syncopated (→ unison).', 'Stay within the octave.'] },
  10: { name: 'tenth', inv: x => 11 - x, lim: 10, steps: 9, rules: ['No two 3rds/10ths in direct motion (→ unisons/octaves).', 'No two 6ths in succession (→ 5ths).', 'No tied 4th in the upper part (→ 7th resolving to 8ve).', 'Stay within the tenth.'] },
  12: { name: 'twelfth', inv: x => 13 - x, lim: 12, steps: 11, rules: ['Avoid the 6th (→ 7th) and the 7–6 suspension; a tied 6th is possible.', 'Stay within the twelfth.'] }
};
const DCPRE = {
  'Model at the octave (D minor)': { up: 'F4/1 C5/1 A4/1 E5/1 C5/1 Bb4/1 D5/1 C#5/1 D5/1', lo: 'D4/1 E4/1 F4/1 G4/1 A4/1 G4/1 F4/1 E4/1 D4/1' },
  'Parallel thirds (fails at the tenth)': { up: 'F4/1 G4/1 A4/1 Bb4/1 A4/1 G4/1 F4/1', lo: 'D4/1 E4/1 F4/1 G4/1 F4/1 E4/1 D4/1' },
  'Fifths and octaves in contrary motion, thirds oblique (good at the twelfth)': { up: 'A4/1 A4/1 D5/1 C5/1 A4/1 E5/1 D5/1', lo: 'D4/1 F4/1 D4/1 F4/1 D4/1 A4/1 D4/1' }
};
function dcTool(host) {
  const box = widgetBox(host, 'Invertible counterpoint calculator', 'Enter two parts (upper and lower). The tool lists the intervals, shows what each becomes when the parts are exchanged at the octave, tenth or twelfth (Fux’s tables: 9 − x, 11 − x, 13 − x), flags the rule each species forbids, and plays the inverted version.');
  let sp = 8, name = Object.keys(DCPRE)[0];
  const up = H('input', { type: 'text', class: 'txt', 'aria-label': 'Upper part', value: DCPRE[name].up, spellcheck: 'false' });
  const lo = H('input', { type: 'text', class: 'txt', 'aria-label': 'Lower part', value: DCPRE[name].lo, spellcheck: 'false' });
  const pre = select(Object.keys(DCPRE).map(k => [k, k]), name, v => { up.value = DCPRE[v].up; lo.value = DCPRE[v].lo; run(); }, 'Example');
  const sseg = seg([['8', 'at the octave'], ['10', 'at the tenth'], ['12', 'at the twelfth']], '8', v => { sp = +v; run(); }, 'Species');
  const rules = H('ul', { class: 'mini' }), out = H('div'), sc = H('div');
  box.append(H('div', { class: 'tools-row' }, pre, sseg), H('label', { class: 'fld wide' }, H('span', null, 'Upper part'), up), H('label', { class: 'fld wide' }, H('span', null, 'Lower part'), lo), H('div', { class: 'tools-row' }, btn('Check', () => run(), 'primary')), rules, out, sc);
  function simpleNum(steps, lim) { let n = steps + 1; while (n > lim) n -= 7; return n; }
  function run() {
    const U = parseLine(up.value), Lo = parseLine(lo.value); const S = DC[sp];
    rules.innerHTML = ''; S.rules.forEach(r => rules.appendChild(H('li', null, r)));
    if (U.some(x => !x) || Lo.some(x => !x)) { out.textContent = 'Could not read a part.'; return; }
    const onsets = new Set(); let s = 0; U.forEach(n => { onsets.add(+s.toFixed(6)); s += n.d; }); s = 0; Lo.forEach(n => { onsets.add(+s.toFixed(6)); s += n.d; });
    const rows = []; let prev = null;
    [...onsets].sort((a, b) => a - b).forEach(t => {
      const a = sounding(U, t), b = sounding(Lo, t); if (!a || !b || a.n.rest || b.n.rest) { prev = null; return; }
      const steps = a.n.p.step - b.n.p.step; const tied = !a.on || !b.on; const x = steps + 1;
      const n = x > S.lim ? null : x; const inv = n ? S.inv(n) : null; const flags = [];
      if (!n) flags.push('exceeds the ' + S.name);
      const sm = ((steps % 7) + 7) % 7 + 1;
      if (sp === 8 && sm === 5 && !tied) flags.push('5th → 4th');
      if (sp === 8 && sm === 1 && prev && Math.abs(a.n.p.step - prev.ua) > 1 && Math.abs(b.n.p.step - prev.lb) > 1) flags.push('octave by skip');
      if (sp === 10 && prev && ((sm === 3 && prev.sm === 3) || (sm === 6 && prev.sm === 6)) && a.on && b.on && Math.sign(a.n.p.step - prev.ua) === Math.sign(b.n.p.step - prev.lb) && a.n.p.step !== prev.ua) flags.push(sm === 3 ? 'consecutive 3rds → 8ves' : 'consecutive 6ths → 5ths');
      if (sp === 12 && sm === 6 && !tied) flags.push('6th → 7th');
      rows.push({ t, x, n, inv, flags }); prev = { ua: a.n.p.step, lb: b.n.p.step, sm };
    });
    out.innerHTML = '';
    const tb = H('table', { class: 'mini-tbl' }, H('tr', null, H('th', null, 'Interval'), ...rows.map(r => H('td', { class: r.flags.length ? 'bad' : '' }, String(r.x)))), H('tr', null, H('th', null, 'Inverted'), ...rows.map(r => H('td', { class: r.flags.length ? 'bad' : '' }, r.inv ? String(r.inv) : '—'))));
    out.appendChild(H('div', { class: 'tbl-wrap' }, tb));
    const fl = rows.filter(r => r.flags.length);
    out.appendChild(H('p', { class: fl.length ? 'warn' : 'okmsg' }, fl.length ? 'Problems: ' + fl.map(r => r.flags.join(', ')).join(' · ') : `No problems for double counterpoint at the ${S.name}.`));
    const invU = U.map(n => n.rest ? n : { p: { step: n.p.step - S.steps, acc: n.p.acc }, d: n.d });
    // keep the inverted upper part below the lower part
    scoreInto(sc, { fig: 'Model', title: `Original ↔ inverted at the ${S.name}`, voices: [{ role: 'cpt', notes: toUi(U) }, { role: 'cpt', notes: toUi(Lo) }], toggle: { label: `Exchange the parts (upper down a ${S.name})`, alt: [{ role: 'cpt', notes: toUi(Lo) }, { role: 'cpt', notes: toUi(invU) }] }, caption: 'Toggle to hear the parts exchanged. Accidentals are kept as written; a real inversion at the tenth or twelfth may need a B♭ or a sharp “so that all intervals will correspond” (Fux, p. 123).' });
  }
  run();
}

/* ---------------- strict / free inversion mirror ---------------- */
function mirrorTool(host) {
  const box = widgetBox(host, 'Inversion mirror', 'Free inversion turns every step the other way. Strict inversion keeps the half steps, by mirroring the scale around a fixed axis: Fux’s Dorian d ↔ d, e ↔ c, f ↔ b, g ↔ a (p. 130); Marpurg’s major scale on ① against the descending scale on ③; minor on ① against ⑦ (pp. 146–148).');
  const ta = H('input', { type: 'text', class: 'txt', 'aria-label': 'Line to invert', value: 'D4/2 F4/2 E4/2 D4/2 G4/2 F4/2 E4/2 D4/2', spellcheck: 'false' });
  const keySel = select(Object.keys(KEYS).map(k => [k, k]), 'D mode', () => run(), 'Key or mode');
  let how = 'strict'; const hs = seg([['strict', 'Strict'], ['free', 'Free']], 'strict', v => { how = v; run(); }, 'Inversion');
  const info = H('p', { class: 'mini' }), sc = H('div');
  box.append(H('div', { class: 'tools-row' }, keySel, hs), H('div', { class: 'tools-row' }, ta, btn('Invert', () => run(), 'primary')), info, sc);
  function run() {
    const key = keySel.querySelector('select').value, K = KEYS[key], line = parseLine(ta.value); if (line.some(x => !x)) { info.textContent = 'Could not read the line.'; return; }
    const first = line.find(n => !n.rest).p;
    let axisStep, axisMidi, label;
    if (how === 'strict') {
      const axDeg = K.modal ? (key === 'D mode' ? 0 : (1 - K.t + 7) % 7) : (K.minor ? 3 : 1); // modes: mirror around D (Fux); major 2^, minor 4^
      let s = first.step; while (((s - K.t) % 7 + 7) % 7 !== axDeg) s--; axisStep = s; axisMidi = midi({ step: s, acc: sigAcc(key, s) });
      label = 'Axis: ' + LET[((axisStep % 7) + 7) % 7] + ' (every whole and half step mirrored exactly).';
    } else { axisStep = first.step; label = 'Free inversion around the first note: steps reversed, half steps not kept.'; }
    const inv = line.map(n => {
      if (n.rest) return n; const st = 2 * axisStep - n.p.step;
      if (how === 'strict') { const q = { step: st, acc: 0 }; q.acc = (2 * axisMidi - midi(n.p)) - midi(q); return { p: q, d: n.d }; }
      const q = { step: st + (first.step - axisStep), acc: sigAcc(key, st) }; return { p: { step: st, acc: sigAcc(key, st) }, d: n.d };
    });
    info.textContent = label;
    scoreInto(sc, { fig: 'Model', title: (how === 'strict' ? 'Strict' : 'Free') + ' inversion', voices: [{ role: 'cpt', notes: toUi(line) }, { role: 'cpt', notes: toUi(inv.map(n => n.rest ? n : { p: { step: n.p.step - 7, acc: n.p.acc }, d: n.d })) }], caption: 'Upper staff: original. Lower staff: inversion (an octave lower). Generated by the tool.' });
  }
  run();
}

/* ---------------- entry orders ---------------- */
function ordersTool(host) {
  const box = widgetBox(host, 'Entry orders in four voices', 'Marpurg counts 24 orders (pp. 178–179). In the regular exposition the voices pair inner with outer, soprano with tenor and alto with bass: entries 1 and 3 have the theme, 2 and 4 the answer, so each pair shares a form. Pick an order to see whether it pairs correctly.');
  const V = ['S', 'A', 'T', 'B'], pair = { S: 'T', T: 'S', A: 'B', B: 'A' };
  const perms = []; (function p(a, r) { if (!r.length) return perms.push(a); r.forEach((x, i) => p(a.concat(x), r.filter((_, j) => j !== i))); })([], V);
  const grid = H('div', { class: 'orders' }), view = H('div', { class: 'order-view' });
  perms.forEach(o => {
    const regular = pair[o[0]] === o[2] && pair[o[1]] === o[3];
    const b = H('button', { type: 'button', class: 'chip ' + (regular ? 'ok' : 'no') }, o.join(' '));
    b.addEventListener('click', () => show(o, regular)); grid.appendChild(b);
  });
  box.append(grid, view);
  function show(o, regular) {
    view.innerHTML = '';
    const names = { S: 'Soprano', A: 'Alto', T: 'Tenor', B: 'Bass' };
    V.forEach(v => {
      const i = o.indexOf(v), form = i % 2 === 0 ? 'theme' : 'answer';
      const row = H('div', { class: 'lane' }, H('span', { class: 'lane-l' }, names[v]));
      const bar = H('div', { class: 'lane-bar' }); bar.appendChild(H('span', { class: 'seg-b ' + form, style: `margin-left:${i * 22}%` }, `${i + 1}. ${form}`)); row.appendChild(bar); view.appendChild(row);
    });
    view.appendChild(H('p', { class: 'mini' }, regular ? 'Regular: the theme goes to one pair (' + o[0] + '–' + o[2] + '), the answer to the other (' + o[1] + '–' + o[3] + ').' : 'Irregular for a first exposition: the paired voices do not share the same form. Marpurg keeps such orders for later expositions (“extraordinary cases”).'));
  }
  show(['S', 'A', 'T', 'B'], true);
}

/* ---------------- Fux's two-part plan ---------------- */
function fuxPlan(host) {
  const box = widgetBox(host, 'Fux’s plan for a two-part fugue, mode by mode', 'Pick a mode to see where its cadences fall, following Fux’s rule and his stated exceptions (pp. 82–89).');
  const M = {
    D: ['D', 'A (5th)', 'F (3rd)', 'D', 'The model mode (Ex. 42).'],
    E: ['E', 'C (6th!)', 'G (3rd)', 'E', 'A cadence on B would need a major third clashing mi contra fa with F; Fux puts the first cadence on the 6th (p. 86).'],
    F: ['F', 'C (5th)', 'A (3rd), formed with 7–6', 'F', 'A full cadence on A needs two or three sharps; use the 7–6 cadence instead (p. 88).'],
    G: ['G', 'D (5th)', 'B (3rd)', 'G', 'Regular.'],
    A: ['A', 'E (5th)', 'C (3rd)', 'A', 'After the first cadence the subject may re-enter on B if the lower part holds E (p. 88).'],
    C: ['C', 'G (5th)', 'E (3rd)', 'C', 'Regular.']
  };
  const tb = H('div'); let m = 'D';
  box.append(H('div', { class: 'seg-scroll' }, seg(Object.keys(M).map(k => [k, k + ' mode']), 'D', v => { m = v; draw(); }, 'Mode')), tb);
  function draw() {
    const r = M[m]; tb.innerHTML = '';
    const steps = [['Exposition', 'subject, answer at the 5th above / 4th below'], ['1st cadence', r[1]], ['Re-entry', 'subject in the first part on another tone, after a rest or a large skip'], ['2nd cadence', r[2]], ['Close entries', 'subject, the other part following in the next bar'], ['Final cadence', 'on ' + r[3]]];
    const ol = H('ol', { class: 'plan' }); steps.forEach(([a, b]) => ol.appendChild(H('li', null, H('b', null, a), ' — ' + b))); tb.append(ol, H('p', { class: 'mini' }, r[4]));
  }
  draw();
}

/* ---------------- timeline + terms ---------------- */
const TL = [
  [1330, 'Jacobus of Liège', 'fuga = caccia (hunt canon)', 'terms'], [1475, 'Tinctoris', 'fuga = identity of rhythm and melody between parts', 'terms'],
  [1482, 'Ramos de Pareja', 'entries at 4th, 5th, 8ve; free writing when strictness is difficult', 'answer'], [1496, 'Gafori', 'direct motion acceptable in fugal manner', 'texture'],
  [1523, 'Aron', 'all parts composed together', 'texture'], [1525, 'Buchner', 'organ ars fugandi; entries alternate 4th/5th', 'answer'],
  [1555, 'Vicentino', 'punto; mode limits; first tonal answer; spacing of entries', 'answer'], [1558, 'Zarlino', 'fugue vs imitation vs canon; strict/free; double counterpoint', 'terms'],
  [1565, 'Santa María', 'placing entries; entries vs cadences', 'structure'], [1588, 'Ponzio', 'ricercar on one theme; first statement unaccompanied', 'structure'],
  [1597, 'Morley', 'wider spacing; odd rests; tonal answer described', 'answer'], [1610, 'Coperario', 'double fugue: theme + countertheme', 'double'],
  [1613, 'Cerone / Nucius', 'monothematic tiento; fuga = recurrence of thema', 'structure'], [1619, 'M. Praetorius', 'development (joining, interweaving); canzona restates first fugue', 'structure'],
  [1650, 'Bernhard', 'consociatio (tonal) vs aequatio (real) modorum', 'answer'], [1670, 'Reinken', 'plan of cadences: I, V, relative; stretto as discipline', 'structure'],
  [1673, 'Bononcini', 'stretto later; fuga regolare = tonal fugue; strict inversion', 'stretto'], [1681, 'Berardi', 'fuga reale exceptional; stretto at the end; DC tables', 'stretto'],
  [1694, 'Purcell', 'imitation = “diminutive sort of fugeing”; fugue in sonatas', 'terms'], [1708, 'Walther', 'repercussio = exposition / counter-exposition', 'terms'],
  [1722, 'Rameau', 'harmonic rules for theme and answer; structure beyond rules', 'answer'], [1725, 'Fux', 'fugue in the modes; DC at 8ve/10th/12th', 'double'],
  [1739, 'Mattheson', 'conciliatio modorum (codetta); writes for connoisseurs', 'answer'], [1753, 'Marpurg', 'five elements; regular fugue as form; Bach', 'structure'],
  [1775, 'Martini', 'teaching through annotated masterworks', 'structure'], [1790, 'Albrechtsberger', 'chorale fugue; canon; no codetta', 'double'],
  [1824, 'Fétis / Reicha / Cherubini', 'school fugue at the Conservatoire', 'textbook'], [1888, 'Riemann', 'fugue as tripartite form; 8-bar norm', 'textbook'],
  [1901, 'Gédalge', 'fugue d’école', 'textbook'], [1922, 'Kitson', 'examination fugue', 'textbook']
];
const TAGS = { all: 'All', terms: 'Terms', answer: 'Answer', structure: 'Structure', stretto: 'Stretto', double: 'Several themes', texture: 'Texture', textbook: 'Textbooks' };
function timeline(host) {
  const box = widgetBox(host, 'Timeline of fugal theory', 'Filter by topic to follow one idea through six centuries.');
  const list = H('ol', { class: 'tl' }); let f = 'all';
  box.append(H('div', { class: 'seg-scroll' }, seg(Object.entries(TAGS), 'all', v => { f = v; draw(); }, 'Topic')), list);
  function draw() { list.innerHTML = ''; TL.filter(r => f === 'all' || r[3] === f).forEach(r => list.appendChild(H('li', null, H('span', { class: 'yr' }, String(r[0])), H('b', null, r[1]), ' ', H('span', null, r[2])))); }
  draw();
}
const TERMS = [
  ['fuga', 'canon/round (14th c.) → strict imitation (Zarlino) → exposition within a work → whole work → procedure (Bontempi, Mann)'],
  ['imitation', 'any-interval following (Zarlino) → “diminutive sort of fugeing” (Purcell) → casual imitative manner (Rameau)'],
  ['canon', 'the rule/inscription (Greek κανών) → the opening voice (Picerli 1630) → strict fugue (Albrechtsberger)'],
  ['soggetto / thema', 'a whole pre-existing part (Zarlino) → thema = varied repeated pattern → the fugal theme (Nucius, Cerone)'],
  ['guida / consequente', 'Zarlino’s leading and following voices → dux / comes (Calvisius 1592)'],
  ['punto / point', 'the chosen theme (Vicentino, Morley: “maintaining a point”)'],
  ['repercussio', 'reciting tone → the returning statement → the exposition, counter-exposition (Walther)'],
  ['consociatio / aequatio modorum', 'tonal vs real answer (Bernhard); conciliatio = codetta (Mattheson)'],
  ['fuga regolare / reale', 'regolare = within the octave of the key = tonal (Bononcini); reale = real answer, now exceptional (Berardi)'],
  ['regular fugue', 'tonal fugue (Bononcini) → formal fugue with five elements properly arranged (Marpurg)'],
  ['strict / free fugue', 'legata/sciolta (Zarlino) → obbligata (Bach) vs libera (Handel) (Marpurg)'],
  ['ricercar', 'searching piece (16th c.) → strict fugue rich in artifice, “master fugue” (Marpurg)'],
  ['counterfugue', 'fuga per arsin et thesin (Zarlino) → answer in inversion (Marpurg)'],
  ['stretto', 'ins kurtze imitiren (Reinken) → later in the work (Bononcini) → at the end (Berardi)'],
  ['double fugue', 'theme + countertheme (Coperario) → themes separately then together (Reinken) → methods (a)/(b) (Marpurg)'],
  ['point d’orgue', 'fermata on the last note of a canonic voice (Mersenne) → pedal point under the final statement']
];
function termsTool(host) {
  const box = widgetBox(host, 'How the words changed', 'Search a term to see how its meaning moved.');
  const q = H('input', { type: 'search', class: 'txt', placeholder: 'Search terms…', 'aria-label': 'Search terms' }); const dl = H('dl', { class: 'figs' });
  box.append(q, dl);
  function draw() { dl.innerHTML = ''; const s = q.value.toLowerCase(); TERMS.filter(t => !s || (t[0] + t[1]).toLowerCase().includes(s)).forEach(t => { dl.appendChild(H('dt', null, t[0])); dl.appendChild(H('dd', null, t[1])); }); }
  q.addEventListener('input', draw); draw();
}

/* ---------------- quiz ---------------- */
const QZ = [
  ['For Zarlino, an answer at the 3rd is…', ['a fugue', 'an imitation', 'a canon'], 1, 'Only entries at P1/P4/P5/P8 keeping exact half steps are fugue; any other interval is imitation (p. 22).'],
  ['Bernhard says the tonal answer (consociatio) belongs…', ['in the middle', 'at the beginning', 'only in the stretto'], 1, 'At the harmonically decisive beginning; the real answer suits the middle (p. 38).'],
  ['Fux’s first cadence in a two-part fugue in the E mode falls on…', ['B, the 5th', 'C, the 6th', 'G, the 3rd'], 1, 'B would need a major third clashing with F (p. 86).'],
  ['In double counterpoint at the octave, which interval must be avoided (untied)?', ['the 3rd', 'the 5th', 'the 6th'], 1, 'The 5th inverts to a 4th, a dissonance in two parts (p. 108).'],
  ['In double counterpoint at the tenth, two successive 6ths become…', ['two 5ths', 'two 3rds', 'two octaves'], 0, '11 − 6 = 5 (p. 114).'],
  ['Marpurg: a theme beginning on ⑤ is answered on…', ['⑤', '②', '①'], 2, 'First-note rule (p. 167).'],
  ['How does Marpurg answer a chromatic theme?', ['by exact transposition always', 'strip accidentals, answer diatonically, restore the chromatic steps', 'by inversion'], 1, 'p. 170.'],
  ['In a four-voice exposition the voices that share the same form are…', ['S with A, T with B', 'S with T, A with B', 'S with B, A with T'], 1, 'Inner + outer pairs (Fux p. 102; Marpurg p. 177).'],
  ['Bach called a fugue that never varied its subject…', ['“dry and wooden”', '“a master fugue”', '“irregular”'], 0, 'Reported by Marpurg (p. 140).'],
  ['Martini’s rule after a rest:', ['enter with free counterpoint', 'enter with the theme or part of it', 'enter only at a cadence'], 1, 'Otherwise the fugue becomes a conglomeration of unrelated elements (p. 276).'],
  ['Which theorist first put the stretto at the end of a fugue (“all’s well that ends well”)?', ['Bononcini', 'Berardi', 'Reinken'], 1, 'p. 46.'],
  ['Mann’s own definition of fugue is…', ['a form', 'a texture', 'a sum of procedures'], 2, 'p. 72.']
];
function quiz(host) {
  const box = widgetBox(host, 'Check yourself', 'Twelve questions across the book.');
  let i = 0, score = 0; const area = H('div');
  box.appendChild(area);
  function show() {
    area.innerHTML = '';
    if (i >= QZ.length) { area.append(H('p', null, `Score: ${score} / ${QZ.length}`), btn('Again', () => { i = 0; score = 0; show(); })); return; }
    const [q, opts, ok, ex] = QZ[i];
    area.appendChild(H('p', null, H('b', null, `${i + 1}. `), q));
    const fb = H('p', { class: 'mini' });
    const row = H('div', { class: 'tools-row' }, ...opts.map((o, j) => btn(o, () => { if (fb.textContent) return; const good = j === ok; if (good) score++; fb.textContent = (good ? '✓ Right. ' : '✗ Not quite. ') + ex; fb.className = 'mini ' + (good ? 'okmsg' : 'warn'); area.appendChild(btn('Next →', () => { i++; show(); }, 'primary')); }, 'ghost')));
    area.append(row, fb);
  }
  show();
}

/* ---------------- notated models ---------------- */
const FIG = {
  exD: { fig: 'Model', title: 'Tonal exposition in D minor: subject D–A, answer A–D', voices: [
    { role: 'cpt', notes: [{ d: 1, rest: 1 }, { d: 1, rest: 1 }, { p: 'A4', d: .5 }, { p: 'D5', d: .5 }, { p: 'D5', d: .25 }, { p: 'C5', d: .25 }, { p: 'Bn4', d: .25 }, { p: 'A4', d: .25 }, { p: 'A4', d: 1 }] },
    { role: 'cpt', notes: [{ p: 'D4', d: .5 }, { p: 'A4', d: .5 }, { p: 'G4', d: .25 }, { p: 'F4', d: .25 }, { p: 'E4', d: .25 }, { p: 'D4', d: .25 }, { p: 'F4', d: .5 }, { p: 'D4', d: .5 }, { p: 'G3', d: 1 }, { p: 'A3', d: 1 }] }],
    caption: 'Written for this guide. The subject leaps up a fifth (D–A); the answer leaps up only a fourth (A–D) and then repeats the D. That repetition is Marpurg’s “narrowing” in the smaller half of the octave, and Fux’s exchange of fifth and fourth that keeps the answer inside the octave D–D. After the head the answer is a fifth higher, in A minor (with B♮). The lower voice continues as a counterpart in contrary motion.' },
  exReal: { fig: 'Model', title: 'Real answer in C major', voices: [
    { role: 'cpt', notes: [{ d: 1, rest: 1 }, { p: 'G4', d: .25 }, { p: 'A4', d: .25 }, { p: 'B4', d: .25 }, { p: 'C5', d: .25 }, { p: 'B4', d: .25 }, { p: 'A4', d: .25 }, { p: 'G4', d: .5 }] },
    { role: 'cpt', notes: [{ p: 'C4', d: .25 }, { p: 'D4', d: .25 }, { p: 'E4', d: .25 }, { p: 'F4', d: .25 }, { p: 'E4', d: .5 }, { p: 'D4', d: .5 }, { p: 'G3', d: .5 }, { p: 'C4', d: .5 }] }],
    caption: 'Written for this guide. The subject never leaves C major and does not touch the dominant at its head, so the answer is an exact transposition a fifth higher (Marpurg, Ex. 156 type). The counterpart moves in thirds and sixths with passing dissonances on weak beats.' }
};

document.querySelectorAll('[data-w]').forEach(el => {
  const k = el.dataset.w;
  try {
    if (FIG[k]) figure(el, Object.assign({ check: false }, FIG[k]));
    else if (k === 'answer') answerTool(el, { start: 'D mode · Fux-style, diatonic' });
    else if (k === 'answer2') answerTool(el, { start: 'C major · rises to the dominant (tail mutation)' });
    else if (k === 'stretto') strettoTool(el);
    else if (k === 'dc') dcTool(el);
    else if (k === 'mirror') mirrorTool(el);
    else if (k === 'orders') ordersTool(el);
    else if (k === 'fuxplan') fuxPlan(el);
    else if (k === 'timeline') timeline(el);
    else if (k === 'terms') termsTool(el);
    else if (k === 'quiz') quiz(el);
  } catch (e) { console.error('widget', k, e); el.textContent = 'This tool could not be drawn.'; }
});

const reg = document.getElementById('reg'), tempo = document.getElementById('tempo'), tv = document.getElementById('tempo-v');
reg.addEventListener('change', () => { AudioEng.reg = reg.value; AudioEng.pluckNow('D4', 1); });
tempo.addEventListener('input', () => { AudioEng.halfBpm = +tempo.value; tv.textContent = '𝅗𝅥 = ' + tempo.value; });
document.getElementById('stopall').addEventListener('click', () => Player.stop());
const toc = document.getElementById('toc'), nb = document.getElementById('navbtn');
nb.addEventListener('click', () => { const o = toc.classList.toggle('open'); nb.setAttribute('aria-expanded', String(o)); });
toc.addEventListener('click', e => { if (e.target.closest('a')) { toc.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); } });
const links = [...toc.querySelectorAll('a')];
const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }); }, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('section.chapter').forEach(s => io.observe(s));
if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 50); }
})();
