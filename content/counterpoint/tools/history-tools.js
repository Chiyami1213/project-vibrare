/* Reference implementations of the History-background tools for this tab.
   Port only: modeTool() [modes], gamutTool() [gamut], organumTool() [organum].
   Helpers used: widgetBox, scoreInto, playRaw, parseMelody, pcOf, NAMES, SPELL, mod. Depends on the shared harpsichord (AudioEng/Player) and score renderer (figure) of the Gradus guide.
   The other functions in this file belong to other tabs or to the History page; ignore them. */
(function () {
'use strict';
const Gx = window.Gradus, FE = window.FuxEngine, D = window.CHT;
const { AudioEng, Player, figure, H, btn, seg, select } = Gx;
const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function widgetBox(host, eyebrow, title, sub) {
  const box = H('div', { class: 'widget' });
  box.appendChild(H('div', { class: 'w-head' }, eyebrow ? H('span', { class: 'eyebrow' }, eyebrow) : null, H('strong', null, title), sub ? H('span', { class: 'mini', html: sub }) : null));
  host.appendChild(box); return box;
}
function scoreInto(el, cfg) { el.innerHTML = ''; try { figure(el, Object.assign({ check: false }, cfg)); } catch (e) { console.error(e); el.textContent = 'Could not draw this score.'; } }
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SPELL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const mod = (a, n) => ((a % n) + n) % n;
// play a list of [midiFloat, onBeats, durBeats, gain]
function playRaw(evts, beat) {
  Player.stop(); AudioEng.init();
  const ctx = AudioEng.ctx, t0 = ctx.currentTime + 0.08, b = beat || 0.5;
  evts.forEach(([m, on, du, g]) => { Player.srcs.push(AudioEng.note(m, t0 + on * b, du * b * 0.97, g == null ? 0.75 : g)); });
}
function pcOf(tok) { // "Eb", "F#", "Bb", "c"
  const m = /^([A-Ga-g])(#|♯|b|♭|s)?$/.exec(tok.trim()); if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase()];
  return mod(base + (m[2] === '#' || m[2] === '♯' || m[2] === 's' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0), 12);
}

/* ===================== 1. Tuning lab ===================== */
const P5 = 1200 * Math.log2(1.5), SC = 1200 * Math.log2(81 / 80), PC = 12 * P5 - 7 * 1200;
const CHAIN = { 3: -3, 10: -2, 5: -1, 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: 7, 8: 8 }; // E♭ … G♯
function chainTuning(fifth) { const c = []; for (let pc = 0; pc < 12; pc++) c[pc] = mod(CHAIN[pc] * fifth, 1200); return c; }
const SYSTEMS = {
  pyth: { name: 'Pythagorean (pure fifths, E♭–G♯)', cents: () => chainTuning(P5), note: 'Pure fifths and octaves only. Thirds are ditones (81:64), 21.5 c wide; the leftover Pythagorean comma sits in the G♯–E♭ "fifth".' },
  just: { name: 'Just intonation (C major, 5-limit)', cents: () => [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8].map(r => 1200 * Math.log2(r)), note: 'Pure thirds and fifths on C, F and G. D–A is a comma narrow (680 c), so a fixed keyboard cannot be just in every chord: the syntonic comma problem (Ramis, Fogliano, Salinas).' },
  mt14: { name: '¼-comma meantone', cents: () => chainTuning(P5 - SC / 4), note: 'Each fifth ¼ comma narrow, so four fifths make a pure 5:4 third. Eight pure thirds; the wolf G♯–E♭ is about 738 c (Aron 1523; Salinas 1577).' },
  mt27: { name: '2/7-comma meantone (Zarlino 1558)', cents: () => chainTuning(P5 - SC * 2 / 7), note: 'Zarlino\'s temperament: thirds and minor thirds both slightly impure, fifths more narrow than ¼-comma.' },
  mt16: { name: '⅙-comma meantone', cents: () => chainTuning(P5 - SC / 6), note: 'A milder meantone common in the 18th century; thirds a little wide, wolf smaller.' },
  wm3: { name: 'Werckmeister III (1691)', cents: () => { const t = [P5 - PC / 4, P5 - PC / 4, P5 - PC / 4, P5, P5, P5 - PC / 4, P5, P5, P5, P5, P5, P5]; // fifths starting C-G,G-D,D-A,A-E,E-B,B-F#,F#-C#,…
      const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; const c = []; let acc = 0; order.forEach((pc, i) => { c[pc] = mod(acc, 1200); acc += t[i]; }); return c; }, note: 'A circulating "well" temperament: four fifths (C–G–D–A and B–F♯) narrowed by ¼ Pythagorean comma, the rest pure. Every key usable; each has its own colour.' },
  et: { name: 'Equal temperament', cents: () => Array.from({ length: 12 }, (_, i) => 100 * i), note: 'Every semitone 2^(1/12): 100 c. Known to Stevin and Mersenne; general practice only in the 19th century.' }
};
function tuningLab(host) {
  const box = widgetBox(host, 'Tool · Chapters 4, 6, 7', 'Monochord & tuning lab', 'Choose a system. The table gives every note in cents above C and the size of each fifth and major third. Red = more than 10 c from pure; green = pure. Sounds are the guide\'s harpsichord, retuned.');
  let sys = 'mt14';
  const row1 = H('div', { class: 'tools-row' }); box.appendChild(row1);
  row1.appendChild(select(Object.entries(SYSTEMS).map(([k, v]) => [k, v.name]), sys, v => { sys = v; draw(); }, 'Tuning system'));
  const rootSel = select(NAMES.map((n, i) => [String(i), n]), '0', () => { }, 'Triad / fifth on');
  row1.appendChild(rootSel);
  const note = H('p', { class: 'mini' }); box.appendChild(note);
  const tblWrap = H('div', { class: 'tbl-scroll' }); box.appendChild(tblWrap);
  const ctr = H('div', { class: 'tools-row' }); box.appendChild(ctr);
  const rootOf = () => +rootSel.querySelector('select').value;
  const m = (c, pc, oct) => 60 + (oct || 0) * 12 + c[pc] / 100;
  ctr.append(
    btn('▶ Scale', () => { const c = SYSTEMS[sys].cents(); const sc = [0, 2, 4, 5, 7, 9, 11]; playRaw(sc.map((pc, i) => [m(c, pc), i, 1]).concat([[72, 7, 2]])); }, 'ghost'),
    btn('▶ Major triad', () => { const c = SYSTEMS[sys].cents(), r = rootOf(); const t = [r, mod(r + 4, 12), mod(r + 7, 12)]; const oc = x => (x < r ? 1 : 0); playRaw(t.map((pc, i) => [m(c, pc, oc(pc)), i * 0.5, 1.5]).concat(t.map(pc => [m(c, pc, oc(pc)), 2.2, 3]))); }, 'ghost'),
    btn('▶ Fifth', () => { const c = SYSTEMS[sys].cents(), r = rootOf(), f = mod(r + 7, 12); const mm = [m(c, r), m(c, f, f < r ? 1 : 0)]; playRaw([[mm[0], 0, 3], [mm[1], 0, 3]]); }, 'ghost'),
    btn('▶ The wolf (G♯–E♭)', () => { const c = SYSTEMS[sys].cents(); playRaw([[m(c, 8), 0, 3], [m(c, 3, 1), 0, 3]]); }, 'ghost'));
  function draw() {
    const S0 = SYSTEMS[sys], c = S0.cents(); note.textContent = S0.note;
    const pure5 = P5, pure3 = 1200 * Math.log2(1.25);
    const t = H('table', { class: 'mini-tbl' });
    t.appendChild(H('tr', null, H('th', null, 'Note'), ...NAMES.map(n => H('th', null, n))));
    t.appendChild(H('tr', null, H('th', null, 'Cents above C'), ...c.map(x => H('td', null, x.toFixed(1)))));
    const fifths = c.map((x, i) => mod(c[mod(i + 7, 12)] - x, 1200)), thirds = c.map((x, i) => mod(c[mod(i + 4, 12)] - x, 1200));
    const cell = (v, ref) => { const d = v - ref; return H('td', { class: Math.abs(d) > 10 ? 'bad' : Math.abs(d) < 0.6 ? 'pure' : '', title: (d >= 0 ? '+' : '') + d.toFixed(1) + ' c from pure' }, v.toFixed(1)); };
    t.appendChild(H('tr', null, H('th', null, 'Fifth on it'), ...fifths.map(v => cell(v, pure5))));
    t.appendChild(H('tr', null, H('th', null, 'Major third on it'), ...thirds.map(v => cell(v, pure3))));
    tblWrap.innerHTML = ''; tblWrap.appendChild(t);
  }
  draw();
  // Greek genera
  const g = H('div', { class: 'subtool' }); box.appendChild(g);
  g.appendChild(H('p', { class: 'mini', html: '<b>Aristoxenian genera.</b> The fourth is divided into 30 parts (one part ≈ 16.6 c). Shades after Cleonides. Listed from the lowest note; played downward from the top, as the Greeks named them.' }));
  const GEN = [['Enharmonic', [3, 3, 24]], ['Soft chromatic', [4, 4, 22]], ['Hemiolic chromatic', [4.5, 4.5, 21]], ['Tonic chromatic', [6, 6, 18]], ['Soft diatonic', [6, 9, 15]], ['Intense diatonic', [6, 12, 12]]];
  const gr = H('div', { class: 'tools-row' }); g.appendChild(gr);
  const gout = H('p', { class: 'mini' }); g.appendChild(gout);
  GEN.forEach(([n, parts]) => gr.appendChild(btn(n + ' ' + parts.join('+'), () => {
    const part = 1200 * Math.log2(4 / 3) / 30; let acc = 0; const pts = [0]; parts.forEach(p => { acc += p * part; pts.push(acc); });
    const base = 59; // B3
    playRaw(pts.slice().reverse().map((c, i) => [base + c / 100, i, 1.1]));
    gout.textContent = `${n}: steps of ${parts.map(p => (p * 1200 * Math.log2(4 / 3) / 30).toFixed(0) + ' c').join(', ')} (from the bottom note upward).`;
  }, 'ghost')));
}

/* ===================== 2. Gamut & hexachords ===================== */
const HEX = { nat: { name: 'natural (C)', L: 'CDEFGA', b: null }, hard: { name: 'hard (G)', L: 'GABCDE', b: 'n' }, soft: { name: 'soft (F)', L: 'FGABCD', b: 'b' } };
const SYL = ['ut', 're', 'mi', 'fa', 'sol', 'la'];
function inHex(h, n) { const k = HEX[h].L.indexOf(n.L); if (k < 0) return false; if (n.L === 'B') return HEX[h].b === (n.acc === -1 ? 'b' : 'n'); return n.acc === 0; }
function sylOf(h, n) { return SYL[HEX[h].L.indexOf(n.L)]; }
function solmize(notes) {
  const run = (h, i) => { let k = 0; while (i + k < notes.length && inHex(h, notes[i + k])) k++; return k; };
  const best = (hs, i) => hs.sort((a, b) => run(b, i) - run(a, i) || (a === 'nat' ? -1 : b === 'nat' ? 1 : 0))[0];
  const out = []; let cur = best(Object.keys(HEX).filter(h => inHex(h, notes[0])), 0);
  if (!cur) return null;
  for (let i = 0; i < notes.length; i++) {
    if (!inHex(cur, notes[i])) {
      const both = Object.keys(HEX).filter(h => inHex(h, notes[i]) && i > 0 && inHex(h, notes[i - 1]));
      if (both.length) { const nh = best(both, i - 1); out[i - 1].syl = sylOf(nh, notes[i - 1]) + '/' + out[i - 1].syl; out[i - 1].mut = true; out[i - 1].syl = out[i - 1].syl.split('/').reverse().join('/'); cur = nh; }
      else { const one = Object.keys(HEX).filter(h => inHex(h, notes[i])); if (!one.length) return null; cur = best(one, i); out.push({ n: notes[i], syl: sylOf(cur, notes[i]), hex: cur, leap: true }); continue; }
    }
    out.push({ n: notes[i], syl: sylOf(cur, notes[i]), hex: cur });
  }
  return out;
}
function parseMelody(str, startOct) {
  const toks = str.trim().split(/[\s,]+/).filter(Boolean); const out = []; let prev = null;
  for (const t of toks) {
    const m = /^([A-Ga-g])(#|b|♭|n)?(\d)?$/.exec(t); if (!m) return { err: 'Cannot read "' + t + '"' };
    const L = m[1].toUpperCase(), acc = m[2] === '#' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
    let oct = m[3] != null ? +m[3] : null;
    const li = 'CDEFGAB'.indexOf(L);
    if (oct == null) { if (!prev) oct = startOct || 4; else { let best = null; for (const o of [prev.oct - 1, prev.oct, prev.oct + 1]) { const st = li + 7 * o; if (best == null || Math.abs(st - prev.step) < Math.abs(best - prev.step)) best = st; } oct = Math.floor(best / 7); } }
    const p = L + (acc === 1 ? '#' : acc === -1 ? 'b' : '') + oct; const x = FE.parse(p);
    prev = x; out.push(x);
  }
  return { notes: out };
}
function gamutTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 11, 13', 'Gamut & hexachord solmizer', 'Type a melody in letter names (use <b>Bb</b> for b♭; octave numbers optional). The tool sings it in Guidonian syllables, mutating at the latest shared note. Mutations are shown as <b>old/new</b>.');
  const PRE = [['C D E F G A G F E D C', 'Natural hexachord'], ['G A B C D E F E D C', 'Hard → natural (mutation)'], ['F G A Bb A G F', 'Soft hexachord (cantus mollis)'], ['D F G A Bb A G F E D', 'Mode 1 chant with b♭'], ['C D F D E D', 'Ut queant laxis opening']];
  const inp = H('input', { class: 'txt', value: PRE[1][0], 'aria-label': 'Melody' });
  box.appendChild(H('div', { class: 'tools-row' }, select(PRE.map(p => [p[0], p[1]]), PRE[1][0], v => { inp.value = v; go(); }, 'Examples'), H('label', { class: 'fld wide' }, H('span', null, 'Melody'), inp), btn('Solmize', () => go(), 'primary')));
  const out = H('div'); box.appendChild(out);
  const gam = H('details', { class: 'mini' }, H('summary', null, 'Show the whole gamut (Γ-ut to e-la)')); box.appendChild(gam);
  const rows = []; const hexStarts = [['G2', 'hard'], ['C3', 'nat'], ['F3', 'soft'], ['G3', 'hard'], ['C4', 'nat'], ['F4', 'soft'], ['G4', 'hard']];
  for (let st = FE.parse('G2').step; st <= FE.parse('E5').step; st++) {
    const L = 'CDEFGAB'[mod(st, 7)], oct = Math.floor(st / 7); const syl = [];
    hexStarts.forEach(([s, h]) => { const k = st - FE.parse(s).step; if (k >= 0 && k < 6) syl.push(SYL[k] + (L === 'B' ? (h === 'soft' ? ' (b♭)' : ' (b♮)') : '')); });
    rows.push(H('tr', null, H('td', null, (st === FE.parse('G2').step ? 'Γ ' : '') + L + oct), H('td', null, syl.join(' · '))));
  }
  gam.appendChild(H('table', { class: 'mini-tbl' }, H('tr', null, H('th', null, 'Note'), H('th', null, 'Syllables')), ...rows.reverse()));
  function go() {
    out.innerHTML = '';
    const r = parseMelody(inp.value, 4); if (r.err) { out.appendChild(H('p', { class: 'warn' }, r.err)); return; }
    const s = solmize(r.notes); if (!s) { out.appendChild(H('p', { class: 'warn' }, 'A note lies outside all three hexachords (e.g., F♯ or E♭ is musica ficta).')); return; }
    const flat = r.notes.some(n => n.L === 'B' && n.acc === -1);
    const t = H('table', { class: 'mini-tbl' });
    t.appendChild(H('tr', null, H('th', null, 'Note'), ...s.map(x => H('td', null, x.n.s.replace(/(\d)/, '').replace('b', '♭')))));
    t.appendChild(H('tr', null, H('th', null, 'Syllable'), ...s.map(x => H('td', { class: x.mut ? 'mut' : '' }, x.syl))));
    t.appendChild(H('tr', null, H('th', null, 'Hexachord'), ...s.map(x => H('td', null, HEX[x.hex].name.split(' ')[0]))));
    out.append(H('div', { class: 'tbl-scroll' }, t), H('p', { class: 'mini' }, (flat ? 'Cantus mollis (b♭ present). ' : 'Cantus durus (no b♭). ') + `${s.filter(x => x.mut).length} mutation(s).`));
    scoreInto(out.appendChild(H('div')), { fig: 'Melody', title: 'As entered', voices: [{ role: 'cf', notes: r.notes.map(n => ({ p: n.s, d: 0.5 })) }] });
  }
  go();
}

/* ===================== 3. Modes ===================== */
const MODES12 = [
  { n: 1, name: 'Protus authentic', greek: 'Dorian', fin: 'D4', lo: 'D4', hi: 'D5', ten: 'A4', z: 3 },
  { n: 2, name: 'Protus plagal', greek: 'Hypodorian', fin: 'D4', lo: 'A3', hi: 'A4', ten: 'F4', z: 4 },
  { n: 3, name: 'Deuterus authentic', greek: 'Phrygian', fin: 'E4', lo: 'E4', hi: 'E5', ten: 'C5', z: 5 },
  { n: 4, name: 'Deuterus plagal', greek: 'Hypophrygian', fin: 'E4', lo: 'B3', hi: 'B4', ten: 'A4', z: 6 },
  { n: 5, name: 'Tritus authentic', greek: 'Lydian', fin: 'F4', lo: 'F4', hi: 'F5', ten: 'C5', z: 7 },
  { n: 6, name: 'Tritus plagal', greek: 'Hypolydian', fin: 'F4', lo: 'C4', hi: 'C5', ten: 'A4', z: 8 },
  { n: 7, name: 'Tetrardus authentic', greek: 'Mixolydian', fin: 'G4', lo: 'G4', hi: 'G5', ten: 'D5', z: 9 },
  { n: 8, name: 'Tetrardus plagal', greek: 'Hypomixolydian', fin: 'G4', lo: 'D4', hi: 'D5', ten: 'C5', z: 10 },
  { n: 9, name: 'Glarean', greek: 'Aeolian', fin: 'A4', lo: 'A4', hi: 'A5', ten: 'E5', z: 11 },
  { n: 10, name: 'Glarean', greek: 'Hypoaeolian', fin: 'A4', lo: 'E4', hi: 'E5', ten: 'C5', z: 12 },
  { n: 11, name: 'Glarean', greek: 'Ionian', fin: 'C4', lo: 'C4', hi: 'C5', ten: 'G4', z: 1 },
  { n: 12, name: 'Glarean', greek: 'Hypoionian', fin: 'C4', lo: 'G3', hi: 'G4', ten: 'E4', z: 2 }];
function modeTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 11–13', 'Mode explorer', 'The eight church modes and Glarean\'s four additions (1547). Tenor = reciting tone of the psalm tone (for mode 3 the later C, for mode 4 A). Psalm-tone tenors for Glarean\'s modes are given by analogy.');
  let cur = MODES12[0];
  const row = H('div', { class: 'tools-row' }); box.appendChild(row);
  row.appendChild(select(MODES12.map(m => [String(m.n), `${m.n}. ${m.greek}`]), '1', v => { cur = MODES12[+v - 1]; draw(); }, 'Mode'));
  const info = H('div', { class: 'cols3' }); box.appendChild(info);
  const sc = H('div'); box.appendChild(sc);
  function draw() {
    const m = cur, lo = FE.parse(m.lo).step, hi = FE.parse(m.hi).step, fin = FE.parse(m.fin).step;
    const auth = m.lo === m.fin;
    const fifth = auth ? `${m.fin[0]}–${FE.fromStep(fin + 4, 0)[0]} (lower)` : `${m.fin[0]}–${FE.fromStep(fin + 4, 0)[0]} (upper)`;
    const fourth = auth ? `${FE.fromStep(fin + 4, 0)[0]}–${m.hi[0]} (upper)` : `${m.lo[0]}–${m.fin[0]} (lower)`;
    info.innerHTML = '';
    [['Final', m.fin[0]], ['Ambitus', `${m.lo[0]}–${m.hi[0]} (${auth ? 'authentic' : 'plagal'})`], ['Tenor', m.ten[0]], ['Species', `5th ${fifth} + 4th ${fourth}`], ['Name', `${m.greek}${m.n <= 8 ? ' (Alia musica tradition)' : ' (Glarean 1547)'}`], ['Zarlino 1571', `mode ${m.z}`]].forEach(([k, v]) => info.appendChild(H('div', { class: 'kv' }, H('span', { class: 'mini' }, k), H('b', null, v))));
    const notes = []; for (let s = lo; s <= hi; s++) notes.push({ p: FE.fromStep(s, 0), d: 0.5 });
    for (let s = hi - 1; s >= lo; s--) notes.push({ p: FE.fromStep(s, 0), d: 0.5 });
    notes[notes.length - 1].d = 1;
    scoreInto(sc, { fig: 'Scale', title: `Mode ${m.n}: ${m.lo[0]}–${m.hi[0]}, final ${m.fin[0]}, tenor ${m.ten[0]}`, voices: [{ role: 'cf', notes }], caption: 'Final and tenor are listed above; play the octave up and down.' });
  }
  draw();
}

/* ===================== 4. Organum ===================== */
const GCLASS = { 0: 'perfect concord', 7: 'medial concord', 5: 'medial concord', 4: 'imperfect concord', 3: 'imperfect concord', 9: 'imperfect discord', 10: 'imperfect discord', 2: 'medial discord', 8: 'medial discord', 1: 'perfect discord', 6: 'perfect discord', 11: 'perfect discord' };
function organumTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 15–16', 'Organum & contrapunctus lab', 'Enter a chant. Choose a kind of organum. Each vertical interval is classed after Johannes de Garlandia (c. 1250). "Contrapunctus check" applies the 14th-century rules to the result.');
  const PRE = [['D4 E4 F4 E4 D4 F4 G4 F4 E4 D4', 'Mode 1 phrase'], ['G4 A4 C5 B4 A4 G4', 'Mode 8 phrase'], ['D4 F4 G4 A4 G4 F4 E4 D4', 'Rising and falling']];
  const inp = H('input', { class: 'txt', value: PRE[0][0], 'aria-label': 'Chant' });
  let kind = 'fourth';
  box.appendChild(H('div', { class: 'tools-row' }, select(PRE.map(p => [p[0], p[1]]), PRE[0][0], v => { inp.value = v; go(); }, 'Examples'), H('label', { class: 'fld wide' }, H('span', null, 'Chant (vox principalis)'), inp)));
  box.appendChild(H('div', { class: 'seg-scroll' }, seg([['fourth', 'At the 4th, boundary tone'], ['fifth', 'Parallel 5th'], ['octave', 'Parallel 8ve'], ['free', 'Note-against-note (contrary)']], kind, v => { kind = v; go(); }, 'Kind')));
  const out = H('div'); box.appendChild(out);
  function below(p, semis, steps) { const x = FE.parse(p); const st = x.step - steps; const nat = FE.parse(FE.fromStep(st, 0)).midi; const acc = (x.midi - semis) - nat; return FE.fromStep(st, acc); }
  function go() {
    out.innerHTML = '';
    const r = parseMelody(inp.value, 4); if (r.err) { out.appendChild(H('p', { class: 'warn' }, r.err)); return; }
    const pr = r.notes.map(n => n.s); let org;
    const fin = FE.parse(pr[pr.length - 1]);
    if (kind === 'fifth') org = pr.map(p => below(p, 7, 4));
    else if (kind === 'octave') org = pr.map(p => below(p, 12, 7));
    else if (kind === 'fourth') {
      // boundary: the tritus (C or F) at or below the final; Musica enchiriadis keeps the organal voice from crossing below it
      let bst = fin.step; while (!['C', 'F'].includes(FE.fromStep(bst, 0)[0])) bst--; const bound = FE.fromStep(bst, 0);
      org = pr.map(p => { const c = below(p, 5, 3); return FE.parse(c).step < bst ? (FE.parse(p).step < bst ? p : bound) : c; });
      org[org.length - 1] = pr[pr.length - 1]; // occursus
      out.appendChild(H('p', { class: 'mini' }, `Boundary tone: ${bound.replace(/\d/, '')} (the organal voice holds it rather than descend to a tritone). Final unison = occursus.`));
    } else {
      // simple discant: start octave, contrary motion choosing nearest consonance below
      org = []; pr.forEach((p, i) => {
        const x = FE.parse(p); const cands = [12, 7, 9, 8, 4, 3, 0].map(s => ({ s, q: FE.parse(below(p, s, { 12: 7, 7: 4, 9: 5, 8: 5, 4: 2, 3: 2, 0: 0 }[s])) })).filter(c => c.q.acc === 0 || (c.q.L === 'B' && c.q.acc === -1));
        if (i === 0 || i === pr.length - 1) { org.push(below(p, 12, 7)); return; }
        const prev = FE.parse(org[i - 1]), dir = Math.sign(x.midi - FE.parse(pr[i - 1]).midi);
        let pick = cands.filter(c => dir === 0 || Math.sign(c.q.midi - prev.midi) === -dir).sort((a, b) => Math.abs(a.q.midi - prev.midi) - Math.abs(b.q.midi - prev.midi))[0] || cands[0];
        org.push(pick.q.s);
      });
    }
    const ivs = pr.map((p, i) => mod(FE.parse(p).midi - FE.parse(org[i]).midi, 12));
    const t = H('table', { class: 'mini-tbl' });
    t.appendChild(H('tr', null, H('th', null, 'Principal'), ...pr.map(p => H('td', null, p))));
    t.appendChild(H('tr', null, H('th', null, 'Organal'), ...org.map(p => H('td', null, p))));
    t.appendChild(H('tr', null, H('th', null, 'Garlandia'), ...ivs.map(v => H('td', { class: /discord/.test(GCLASS[v]) ? 'bad' : '' }, GCLASS[v]))));
    out.appendChild(H('div', { class: 'tbl-scroll' }, t));
    // contrapunctus check
    const issues = [];
    for (let i = 1; i < pr.length; i++) {
      const a = ivs[i - 1], b = ivs[i], mu = Math.sign(FE.parse(pr[i]).midi - FE.parse(pr[i - 1]).midi), ml = Math.sign(FE.parse(org[i]).midi - FE.parse(org[i - 1]).midi);
      if ((b === 0 || b === 7) && a === b && mu === ml && mu !== 0) issues.push(`${i}→${i + 1}: parallel ${b === 7 ? 'fifths' : 'octaves/unisons'}`);
      const near = { 4: 7, 9: 0, 3: 0 };
      if (near[a] != null && (b === 0 || b === 7) && b !== near[a]) issues.push(`${i}→${i + 1}: imperfect consonance not to the nearest perfect one`);
    }
    out.appendChild(H('p', { class: issues.length ? 'mini warn' : 'mini okmsg' }, 'Contrapunctus check (14th-c. rules): ' + (issues.length ? issues.join('; ') : 'no parallel perfect consonances; directed progressions OK.') + (kind !== 'free' ? ' (Organum predates these rules; parallels are its essence.)' : '')));
    scoreInto(out.appendChild(H('div')), { fig: 'Result', title: { fourth: 'Organum at the fourth', fifth: 'Parallel organum at the fifth', octave: 'Parallel organum at the octave', free: 'Note-against-note discant' }[kind], voices: [{ role: 'cf', notes: pr.map(p => ({ p, d: 0.5 })) }, { role: 'cpt', notes: org.map(p => ({ p, d: 0.5 })) }] });
  }
  go();
}

/* ===================== 5. Rhythmic modes & mensuration ===================== */
function mensuralTool(host) {
  const box = widgetBox(host, 'Tool · Chapter 20', 'Rhythmic modes & mensuration', 'Top: Garlandia\'s six rhythmic modes (L = long, B = breve) transcribed in 6/8. Bottom: Ars nova mensuration: tempus × prolation.');
  const RM = [[1, 'L B', [2, 1]], [2, 'B L', [1, 2]], [3, 'L B B', [3, 1, 2]], [4, 'B B L', [1, 2, 3]], [5, 'L L', [3, 3]], [6, 'B B B', [1, 1, 1]]];
  const rm = H('div', { class: 'rm' }); box.appendChild(rm);
  RM.forEach(([n, lab, durs]) => {
    const svg = S('svg', { viewBox: '0 0 240 30', class: 'rm-svg', role: 'img', 'aria-label': `Mode ${n}: ${lab}` });
    let x = 0; const cyc = durs.reduce((a, b) => a + b, 0); const reps = Math.max(1, Math.round(6 / cyc)) * 2;
    for (let r = 0; r < reps; r++) durs.forEach(d => { S('rect', { x: x * 20 + 1, y: 6, width: d * 20 - 3, height: 18, rx: 3, class: d >= 2 ? 'rm-l' : 'rm-b' }, svg); x += d; });
    rm.appendChild(H('div', { class: 'rm-row' }, H('b', null, `Mode ${n}`), H('span', { class: 'mini' }, lab + (n === 1 || n === 2 || n === 6 ? ' · rectus' : '')), svg,
      btn('▶', () => { let t = 0; const ev = []; for (let r = 0; r < reps; r++) durs.forEach((d, i) => { ev.push([60 + [0, 2, 4][i % 3] + (r % 2 ? 7 : 0), t, d, i === 0 ? 0.85 : 0.6]); t += d; }); playRaw(ev, 0.22); }, 'ghost', 'Play mode ' + n)));
  });
  const mz = H('div', { class: 'subtool' }); box.appendChild(mz);
  let tempus = 'perf', prol = 'maj';
  const res = H('div', { class: 'mz-res' });
  mz.append(H('div', { class: 'tools-row' }, seg([['perf', 'Tempus perfectum'], ['imp', 'Tempus imperfectum']], tempus, v => { tempus = v; draw(); }, 'Tempus'), seg([['maj', 'Prolatio maior'], ['min', 'Prolatio minor']], prol, v => { prol = v; draw(); }, 'Prolation')), res);
  function sign() {
    const svg = S('svg', { viewBox: '0 0 40 40', width: 40, height: 40, class: 'msign', role: 'img', 'aria-label': 'mensuration sign' });
    if (tempus === 'perf') S('circle', { cx: 20, cy: 20, r: 14, fill: 'none', 'stroke-width': 3 }, svg);
    else S('path', { d: 'M31 9 A14 14 0 1 0 31 31', fill: 'none', 'stroke-width': 3 }, svg);
    if (prol === 'maj') S('circle', { cx: 20, cy: 20, r: 3 }, svg);
    return svg;
  }
  function draw() {
    const sb = tempus === 'perf' ? 3 : 2, mn = prol === 'maj' ? 3 : 2, total = sb * mn;
    const modern = { 'perf,maj': '9/8', 'perf,min': '3/4', 'imp,maj': '6/8', 'imp,min': '2/4' }[tempus + ',' + prol];
    res.innerHTML = '';
    res.append(sign(), H('div', null, H('p', null, H('b', null, `1 breve = ${sb} semibreves = ${total} minims`), ` · modern equivalent ${modern}`),
      btn('▶ One breve', () => { const ev = []; for (let i = 0; i < total; i++) ev.push([67 + (i % mn === 0 ? 0 : -3), i, 1, i === 0 ? 0.95 : i % mn === 0 ? 0.75 : 0.45]); ev.push([60, 0, total, 0.5]); playRaw(ev, 0.28); }, 'ghost')));
  }
  draw();
}

/* ===================== 6. Tonnetz ===================== */
function triName(t) { return t.q === 'maj' ? NAMES[t.r] + ' major' : NAMES[t.r].toLowerCase() + ' minor'; }
function TX(t, op) { const r = t.r, M = t.q === 'maj';
  if (op === 'P') return { r, q: M ? 'min' : 'maj' };
  if (op === 'R') return M ? { r: mod(r + 9, 12), q: 'min' } : { r: mod(r + 3, 12), q: 'maj' };
  if (op === 'L') return M ? { r: mod(r + 4, 12), q: 'min' } : { r: mod(r + 8, 12), q: 'maj' }; return t; }
function triPcs(t) { return t.q === 'maj' ? [t.r, mod(t.r + 4, 12), mod(t.r + 7, 12)] : [t.r, mod(t.r + 3, 12), mod(t.r + 7, 12)]; }
function tonnetzTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 10, 14, 23, 25', 'Tonnetz & Riemann transformations', 'Fifths run left–right, major thirds up-right. Triangles are triads. P, L and R move by one common-tone step. The dualist reading (Riemann) is shown beside the modern name.');
  let cur = { r: 0, q: 'maj' }; const path = [cur];
  const svg = S('svg', { viewBox: '0 0 520 260', class: 'tonnetz', role: 'img', 'aria-label': 'Tonnetz' });
  box.appendChild(H('div', { class: 'mot-wrap' }, svg));
  const name = H('p'); const pth = H('p', { class: 'mini' });
  const ctl = H('div', { class: 'tools-row' });
  ['P', 'L', 'R'].forEach(op => ctl.appendChild(btn(op, () => { cur = TX(cur, op); path.push(cur); draw(); play(); }, 'primary', { P: 'Parallel', L: 'Leading-tone exchange', R: 'Relative' }[op])));
  ctl.append(btn('▶ Path', () => { playRaw(path.flatMap((t, i) => triPcs(t).map(pc => [60 + pc, i * 2, 2, 0.6]))); }, 'ghost'), btn('Reset', () => { cur = { r: 0, q: 'maj' }; path.length = 0; path.push(cur); draw(); }, 'ghost'),
    select(NAMES.map((n, i) => [String(i), n + ' major']), '0', v => { cur = { r: +v, q: 'maj' }; path.length = 0; path.push(cur); draw(); play(); }, 'Start'));
  box.append(ctl, name, pth);
  const dx = 64, dy = 52, X0 = 30, Y0 = 230;
  const pos = (x, y) => [X0 + x * dx + y * dx / 2, Y0 - y * dy];
  const pcAt = (x, y) => mod(7 * x + 4 * y, 12);
  function play() { playRaw(triPcs(cur).map((pc, i) => [60 + pc, i * 0.3, 2.4, 0.6])); }
  function draw() {
    svg.innerHTML = '';
    const set = new Set(triPcs(cur));
    for (let y = 0; y < 5; y++) for (let x = -2; x < 7; x++) {
      const p0 = pos(x, y), p1 = pos(x + 1, y), p2 = pos(x, y + 1), p3 = pos(x + 1, y - 1);
      const maj = [pcAt(x, y), pcAt(x, y + 1), pcAt(x + 1, y)], mn = [pcAt(x, y), pcAt(x + 1, y), pcAt(x + 1, y - 1)];
      const on = (arr, q) => q === cur.q && arr.every(a => set.has(a));
      if (y < 4) S('path', { d: `M${p0} L${p2} L${p1}z`, class: 'tri maj' + (on(maj, 'maj') ? ' on' : '') }, svg);
      if (y > 0) S('path', { d: `M${p0} L${p1} L${p3}z`, class: 'tri min' + (on(mn, 'min') ? ' on' : '') }, svg);
    }
    for (let y = 0; y < 5; y++) for (let x = -2; x < 8; x++) { const [px, py] = pos(x, y); if (px < 10 || px > 510) continue; const pc = pcAt(x, y);
      S('circle', { cx: px, cy: py, r: 13, class: 'tn' + (set.has(pc) ? ' on' : '') }, svg); const t = S('text', { x: px, y: py + 4, class: 'tnl' }, svg); t.textContent = NAMES[pc]; }
    const top = mod(cur.r + 7, 12);
    name.innerHTML = `<b>${triName(cur)}</b> · Riemann: ${cur.q === 'maj' ? `Oberklang of ${NAMES[cur.r]} (generated upward from ${NAMES[cur.r]})` : `Unterklang of ${NAMES[top]}, written °${NAMES[top]} (generated downward from ${NAMES[top]})`}`;
    pth.textContent = 'Path: ' + path.map(triName).join(' → ');
  }
  draw();
}

/* ===================== 7. Fundamental bass ===================== */
const OKSET = new Set([0, 3, 4, 6, 7, 8, 10, 11, 9]);
function rootOfChord(pcs) {
  const cands = [];
  pcs.forEach(r => { const iv = pcs.map(p => mod(p - r, 12)); const hasThirdOrFifth = iv.some(v => v === 3 || v === 4) && iv.some(v => v === 6 || v === 7 || v === 8);
    const bad = iv.filter(v => ![0, 3, 4, 6, 7, 8, 10, 11].includes(v)).length; if (hasThirdOrFifth) cands.push({ r, bad, iv }); });
  cands.sort((a, b) => a.bad - b.bad); return cands;
}
function fbTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 24–25', 'Rameau\'s fundamental bass', 'Enter chords as letters separated by <b>|</b>, lowest note first (that is the sounding bass). The tool finds each chord\'s root by stacking thirds, draws the fundamental bass, and labels the root motion. F–A–C–D shows <i>double emploi</i>.');
  const PRE = [['C E G | F A C D | G B D F | C E G', 'Cadences with added sixth and seventh'], ['E G C | F A D | G B D F | C E G', 'Inversions'], ['C E G | A C E | D F A | G B D | C E G', 'Fifths and thirds'], ['C E G | D F A | E G B | F A C | G B D | C E G', 'Stepwise roots (problem case)']];
  const inp = H('input', { class: 'txt', value: PRE[0][0], 'aria-label': 'Chords' });
  box.appendChild(H('div', { class: 'tools-row' }, select(PRE.map(p => [p[0], p[1]]), PRE[0][0], v => { inp.value = v; go(); }, 'Examples'), H('label', { class: 'fld wide' }, H('span', null, 'Chords'), inp)));
  const out = H('div'); box.appendChild(out);
  function go() {
    out.innerHTML = '';
    const chords = inp.value.split('|').map(s => s.trim().split(/\s+/).map(pcOf));
    if (chords.some(c => c.some(x => x == null) || c.length < 2)) { out.appendChild(H('p', { class: 'warn' }, 'Use letter names such as C E G | F A C.')); return; }
    const rows = chords.map(c => { const u = [...new Set(c)]; const cs = rootOfChord(u); const r = cs.length ? cs[0].r : c[0];
      const add6 = u.length === 4 ? u.find(x => u.map(p => mod(p - x, 12)).sort((a, b) => a - b).join() === '0,4,7,9') : undefined;
      return { u, bass: c[0], root: r, alt: add6 }; });
    const isFifth = d => d === 5 || d === 7;
    rows.forEach((r, i) => { r.rin = r.rout = r.root;
      if (r.alt != null) { const prev = rows[i - 1], next = rows[i + 1];
        if (prev && isFifth(mod(r.alt - prev.rout, 12))) r.rin = r.alt;
        r.rout = next && isFifth(mod((next.alt != null ? next.alt : next.root) - r.root, 12)) ? r.root : (next && isFifth(mod(next.root - r.alt, 12)) ? r.alt : r.root); } });
    const t = H('table', { class: 'mini-tbl' });
    t.appendChild(H('tr', null, H('th', null, 'Chord'), ...rows.map(r => H('td', null, r.u.map(p => NAMES[p]).join('–')))));
    t.appendChild(H('tr', null, H('th', null, 'Bass'), ...rows.map(r => H('td', null, NAMES[r.bass]))));
    t.appendChild(H('tr', null, H('th', null, 'Fundamental'), ...rows.map(r => H('td', { class: r.alt != null ? 'mut' : '' }, r.alt != null ? (r.rin !== r.rout ? `${NAMES[r.rin]} = ${NAMES[r.rout]} (double emploi)` : `${NAMES[r.rin]} (or ${NAMES[r.rin === r.alt ? r.root : r.alt]})`) : NAMES[r.root] + (r.bass !== r.root ? ' · inv.' : '')))));
    const mv = rows.slice(1).map((r, i) => { const d = mod(r.rin - rows[i].rout, 12); return d === 0 ? 'same' : d === 5 || d === 7 ? (d === 5 ? 'up 4th / down 5th ✓' : 'up 5th / down 4th ✓') : [3, 4, 8, 9].includes(d) ? 'third ✓' : 'step ⚠'; });
    t.appendChild(H('tr', null, H('th', null, 'Root motion'), H('td', null, '—'), ...mv.map(m => H('td', { class: /⚠/.test(m) ? 'bad' : '' }, m))));
    out.appendChild(H('div', { class: 'tbl-scroll' }, t));
    if (mv.some(m => /⚠/.test(m))) out.appendChild(H('p', { class: 'mini warn' }, 'Stepwise roots break Rameau\'s ideal of fifths and thirds. He explained them by supposition or double emploi; Sechter by an implied intermediate root.'));
    const sp = pc => SPELL[pc];
    const bassV = rows.map(r => ({ p: sp(r.bass) + '3', d: 1 })), fundV = rows.map(r => r.rin !== r.rout ? [{ p: sp(r.rin) + '2', d: 0.5 }, { p: sp(r.rout) + '2', d: 0.5 }] : [{ p: sp(r.rin) + '2', d: 1 }]).flat();
    const upper = rows.map(r => ({ p: sp(r.u.find(x => x !== r.bass) != null ? r.u.filter(x => x !== r.bass).slice(-1)[0] : r.bass) + '4', d: 1 }));
    scoreInto(out.appendChild(H('div')), { fig: 'Result', title: 'Top voice, actual bass and fundamental bass', voices: [{ role: 'cpt', notes: upper }, { role: 'cpt', notes: bassV }, { role: 'cpt', notes: fundV }], caption: 'Lowest staff: the fundamental bass (roots), drawn an octave down as Rameau prints it.' });
  }
  go();
}

/* ===================== 8. Twelve-tone matrix ===================== */
function rowTool(host) {
  const box = widgetBox(host, 'Tool · Chapters 10, 19', 'Twelve-tone matrix', 'Enter a row as pitch names or numbers 0–11 (C = 0). Rows are prime forms (P) read left to right; columns are inversions (I) read top to bottom. R and RI are read backwards. Click a label to hear the form.');
  const PRE = [['G Bb D F# A C E G# B C# Eb F', 'Berg, Violin Concerto'], ['E F G Db Gb Eb Ab D B C A Bb', 'Schoenberg, Suite Op. 25'], ['0 11 7 8 3 1 2 10 6 5 4 9', 'Webern, Symphony Op. 21'], ['C C# D D# E F F# G G# A A# B', 'Chromatic scale']];
  const inp = H('input', { class: 'txt', value: PRE[0][0], 'aria-label': 'Row' });
  box.appendChild(H('div', { class: 'tools-row' }, select(PRE.map(p => [p[0], p[1]]), PRE[0][0], v => { inp.value = v; go(); }, 'Examples'), H('label', { class: 'fld wide' }, H('span', null, 'Row'), inp)));
  const out = H('div'); box.appendChild(out);
  function go() {
    out.innerHTML = '';
    const row = inp.value.trim().split(/[\s,]+/).map(t => /^\d+$/.test(t) ? mod(+t, 12) : pcOf(t.replace('A#', 'Bb')));
    if (row.length !== 12 || row.some(x => x == null) || new Set(row).size !== 12) { out.appendChild(H('p', { class: 'warn' }, 'A row needs all twelve pitch classes exactly once.')); return; }
    const r0 = row[0], inv = row.map(p => mod(2 * r0 - p, 12));
    const M = inv.map(a => row.map(p => mod(p - r0 + a, 12)));
    const lab = n => String(mod(n - r0, 12)); // label by transposition from the first row
    const t = H('table', { class: 'mini-tbl mtx' });
    const playForm = arr => playRaw(arr.map((pc, i) => [60 + pc, i, 1]), 0.32);
    t.appendChild(H('tr', null, H('th', null, ''), ...M[0].map((pc, j) => H('th', null, btn('I' + lab(M[0][j]), () => playForm(M.map(r => r[j])), 'tiny'))), H('th', null, '')));
    M.forEach((r, i) => t.appendChild(H('tr', null, H('th', null, btn('P' + lab(r[0]), () => playForm(r), 'tiny')), ...r.map(pc => H('td', { class: pc === r0 ? 'mut' : '' }, NAMES[pc])), H('th', null, btn('R' + lab(r[0]), () => playForm(r.slice().reverse()), 'tiny')))));
    t.appendChild(H('tr', null, H('th', null, ''), ...M[0].map((pc, j) => H('th', null, btn('RI' + lab(M[0][j]), () => playForm(M.map(r => r[j]).reverse()), 'tiny'))), H('th', null, '')));
    out.appendChild(H('div', { class: 'tbl-scroll' }, t));
    const h1 = new Set(row.slice(0, 6)), comp = [...Array(12).keys()].filter(x => !h1.has(x)).sort((a, b) => a - b).join();
    const pT = [], iT = [];
    for (let n = 0; n < 12; n++) { if (n && [...h1].map(x => mod(x + n, 12)).sort((a, b) => a - b).join() === comp) pT.push(n); if ([...h1].map(x => mod(n - x, 12)).sort((a, b) => a - b).join() === comp) iT.push(n); }
    const iLabels = iT.map(n => 'I' + lab(mod(n - r0, 12))); // I-form whose first pc is n - r0
    out.appendChild(H('p', { class: 'mini' }, `Hexachordal combinatoriality: P at ${pT.length ? pT.map(n => 'P' + n).join(', ') : 'none'}; I at ${iLabels.length ? iLabels.join(', ') : 'none'}. ${pT.length && iT.length ? 'At least semi-combinatorial in both senses.' : iT.length ? 'Inversionally combinatorial (Schoenberg\'s favourite kind).' : ''}`));
  }
  go();
}

/* ===================== 9. Ursatz ===================== */
function ursatzTool(host) {
  const box = widgetBox(host, 'Tool · Chapter 26', 'Ursatz viewer', 'Schenker\'s fundamental structure: the Urlinie descends to ① over the bass arpeggiation I–V–I. Choose the line, the mode, and whether to interrupt.');
  let line = '3', mode = 'maj', intr = false;
  const row = H('div', { class: 'tools-row' }); box.appendChild(row);
  row.append(seg([['3', '③-line'], ['5', '⑤-line'], ['8', '⑧-line']], line, v => { line = v; draw(); }, 'Line'), seg([['maj', 'C major'], ['min', 'C minor']], mode, v => { mode = v; draw(); }, 'Mode'), seg([['no', 'Plain'], ['yes', 'Interruption']], 'no', v => { intr = v === 'yes'; draw(); }, 'Interruption'));
  const out = H('div'); box.appendChild(out);
  function draw() {
    const deg = { 1: 'C', 2: 'D', 3: mode === 'maj' ? 'E' : 'Eb', 4: 'F', 5: 'G', 6: mode === 'maj' ? 'A' : 'Ab', 7: mode === 'maj' ? 'B' : 'Bb', 8: 'C' };
    const oct = d => (line === '8' ? (d === 8 ? 5 : 4) : 5) + (line !== '8' && d > 5 ? 0 : 0);
    const seq = Array.from({ length: +line }, (_, i) => +line - i);
    const one = (s, withEnd) => s.map(d => ({ p: deg[d] + (d === 8 ? '5' : line === '8' ? '4' : '5'), d: 1 }));
    let sop, bass;
    if (!intr) { sop = one(seq); bass = seq.map((d, i) => ({ p: i === seq.length - 2 ? 'G2' : 'C3', d: 1 })); }
    else { const first = seq.slice(0, -1); sop = one(first).concat(one(seq)); bass = first.map((d, i) => ({ p: i === first.length - 1 ? 'G2' : 'C3', d: 1 })).concat(seq.map((d, i) => ({ p: i === seq.length - 2 ? 'G2' : 'C3', d: 1 }))); }
    const label = (intr ? seq.slice(0, -1).map(d => '①②③④⑤⑥⑦⑧'[d - 1]).join('–') + ' ‖ ' : '') + seq.map(d => '①②③④⑤⑥⑦⑧'[d - 1]).join('–');
    scoreInto(out, { fig: 'Ursatz', title: `${label} over I–V–I${intr ? ' (interrupted)' : ''}`, voices: [{ role: 'cf', notes: sop }, { role: 'cpt', notes: bass }],
      caption: intr ? 'Interruption: the first descent stops on ② over V; the structure starts again and completes the descent.' : 'Background level. ② is supported by V; every other tone of the Urlinie by I (in an actual piece, prolonged by the middleground).' });
  }
  draw();
}

/* ===================== Indexes: era map, timeline, people, glossary, quiz ===================== */
const ART = Object.fromEntries((D.articles || []).map(a => [a.id, a]));
const PPL = Object.fromEntries((D.people || []).map(p => [p.id, p]));
function artShort(id) { const a = ART[id]; return a ? (a.short || a.title.replace(/<[^>]+>/g, '')) : id; }
function artChip(id) { return H('a', { href: '#' + id, class: 'chip' }, artShort(id)); }
function eraOf(y) { return D.eras.find(e => y >= e.from && y < e.to) || D.eras[D.eras.length - 1]; }
function eraMap(host) {
  const box = widgetBox(host, 'Overview', 'Map of the page', 'Each bar is an article, placed under the eras it covers (every era gets equal width). Bars are grouped by thread. Tap a bar to open the article.');
  const W = 1000, rowH = 22, threads = D.threads, eras = D.eras, ew = W / eras.length;
  const xOf = y => { const i = Math.max(0, eras.findIndex(e => y >= e.from && y < e.to)); const e = eras[i < 0 ? eras.length - 1 : i]; const yy = Math.min(Math.max(y, e.from), e.to); return (eras.indexOf(e) + (yy - e.from) / (e.to - e.from)) * ew; };
  let rows = 0; const lay = threads.map(t => { const arts = D.articles.filter(a => a.thread === t.id); const lanes = []; arts.forEach(a => { const lw = artShort(a.id).length * 6.4 + 10; let l = lanes.findIndex(end => end <= xOf(a.span.from) - 4); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = Math.max(xOf(Math.min(a.span.to, 1999)), xOf(a.span.from) + lw); a._lane = l; }); const r0 = rows; rows += Math.max(1, lanes.length) + 0.6; return { t, arts, r0 }; });
  const Hh = 30 + rows * rowH;
  const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'eramap', role: 'img', 'aria-label': 'Map of articles by era and thread' });
  eras.forEach((e, i) => { S('rect', { x: i * ew, y: 0, width: ew, height: Hh, class: 'era-bg' + (i % 2 ? ' alt' : '') }, svg); const t = S('text', { x: i * ew + ew / 2, y: 16, class: 'era-l' }, svg); t.textContent = e.title.replace('Middle Ages', 'MA').replace('Nineteenth century', '19th c.').replace('Twentieth century', '20th c.'); });
  lay.forEach(({ t, arts, r0 }, ti) => {
    const ty = 30 + r0 * rowH; const tl = S('text', { x: 4, y: ty + 9, class: 'thr-l' }, svg); tl.textContent = t.title;
    arts.forEach(a => { const lw = artShort(a.id).length * 6.4 + 10; let x1 = xOf(a.span.from), x2 = Math.max(x1 + lw, xOf(Math.min(a.span.to, 1999))); if (x2 > W) { x1 -= x2 - W; x2 = W; } const y = ty + 12 + a._lane * rowH;
      const g = S('a', { href: '#' + a.id }, svg); S('rect', { x: x1, y, width: x2 - x1, height: rowH - 6, rx: 4, class: 'bar t' + (ti % 5) }, g); const lb = S('text', { x: x1 + 4, y: y + 12, class: 'bar-l' }, g); lb.textContent = artShort(a.id); });
  });
  box.appendChild(H('div', { class: 'tbl-scroll' }, svg));
}
function timelineTool(host) {
  const box = widgetBox(host, 'Index', 'Timeline of treatises', `${D.works.length} dated works, oldest first. Filter by era or search.`);
  let f = 'all'; const q = H('input', { type: 'search', class: 'txt', placeholder: 'Search author or title…', 'aria-label': 'Search timeline' });
  const list = H('ol', { class: 'tl' });
  box.append(H('div', { class: 'seg-scroll' }, seg([['all', 'All']].concat(D.eras.map(e => [e.id, e.title])), 'all', v => { f = v; draw(); }, 'Era')), q, list);
  function draw() { list.innerHTML = ''; const s = q.value.toLowerCase();
    D.works.filter(w => (f === 'all' || eraOf(w.sort).id === f)).forEach(w => { const who = w.author ? PPL[w.author].name : 'anon.'; if (s && !(who + w.title).toLowerCase().includes(s)) return;
      list.appendChild(H('li', null, H('span', { class: 'yr' }, w.year), H('b', null, who), ' ', H('i', null, w.title), ' ', ...w.articles.map(artChip))); }); }
  q.addEventListener('input', draw); draw();
}
function theoristTool(host) {
  const box = widgetBox(host, 'Index', 'People', `${D.people.length} people, with dates, works and what each is remembered for. Search by name or idea.`);
  const q = H('input', { type: 'search', class: 'txt', placeholder: 'Search…', 'aria-label': 'Search people' }); const dl = H('dl', { class: 'figs th' }); box.append(q, dl);
  const worksBy = {}; D.works.forEach(w => { if (w.author) (worksBy[w.author] = worksBy[w.author] || []).push(w); });
  function draw() { dl.innerHTML = ''; const s = q.value.toLowerCase();
    D.people.filter(t => !s || (t.name + t.ideas.join(' ') + (worksBy[t.id] || []).map(w => w.title).join(' ')).toLowerCase().includes(s)).forEach(t => {
      const ws = worksBy[t.id] || [];
      dl.appendChild(H('dt', null, H('b', null, t.name), t.dates ? H('span', { class: 'mini' }, ' (' + t.dates + ')') : null));
      dl.appendChild(H('dd', null, t.ideas.join(' '), ws.length ? H('span', { class: 'mini' }, ' · ' + ws.map(w => `${w.title} (${w.year})`).join('; ')) : null, ' ', ...t.articles.map(artChip))); }); }
  q.addEventListener('input', draw); draw();
}
function glossaryTool(host) {
  const box = widgetBox(host, 'Index', 'Glossary', `${D.terms.length} terms. Green chips point to the tab where the technique is taught.`);
  const q = H('input', { type: 'search', class: 'txt', placeholder: 'Search terms…', 'aria-label': 'Search glossary' }); const dl = H('dl', { class: 'figs' }); box.append(q, dl);
  function draw() { dl.innerHTML = ''; const s = q.value.toLowerCase(); D.terms.filter(g => !s || (g.term + g.def).toLowerCase().includes(s)).forEach(g => { dl.appendChild(H('dt', null, g.term)); dl.appendChild(H('dd', null, g.def, ' ', ...g.articles.map(artChip), ...g.taughtIn.map(t => H('span', { class: 'chip site' }, D.tabs[t.tab])))); }); }
  q.addEventListener('input', draw); draw();
}
function quizTool(host, artId) {
  const pool = artId ? D.quiz.filter(q => q.article === artId) : D.quiz;
  const box = widgetBox(host, artId ? 'Check yourself' : 'Review', artId ? 'Quick check' : 'Quiz across the page', artId ? '' : `${D.quiz.length} questions. Choose a thread, or shuffle everything.`);
  let qs = pool.slice(), i = 0, score = 0; const area = H('div');
  if (!artId) box.appendChild(H('div', { class: 'seg-scroll' }, seg([['all', 'All']].concat(D.threads.map(t => [t.id, t.title])), 'all', v => { qs = D.quiz.filter(q => v === 'all' || ART[q.article].thread === v); shuffle(); }, 'Thread')));
  box.appendChild(area);
  function shuffle() { for (let k = qs.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [qs[k], qs[j]] = [qs[j], qs[k]]; } i = 0; score = 0; show(); }
  function show() {
    area.innerHTML = '';
    if (!qs.length) { area.appendChild(H('p', { class: 'mini' }, 'No questions here yet.')); return; }
    if (i >= qs.length) { area.append(H('p', null, `Score: ${score} / ${qs.length}`), btn('Again', shuffle, 'primary')); return; }
    const q = qs[i];
    area.appendChild(H('p', null, H('b', null, `${i + 1}/${qs.length}. `), q.q, artId ? null : artChip(q.article)));
    const fb = H('p', { class: 'mini' });
    area.append(H('div', { class: 'tools-row' }, ...q.options.map((o, j) => btn(o, () => { if (fb.textContent) return; const ok = j === q.answer; if (ok) score++; fb.textContent = (ok ? '✓ Right. ' : '✗ Not quite: ' + q.options[q.answer] + '. ') + q.why; fb.className = 'mini ' + (ok ? 'okmsg' : 'warn'); area.appendChild(btn('Next →', () => { i++; show(); }, 'primary')); }, 'ghost'))), fb);
  }
  if (artId) show(); else shuffle();
}

const TOOLS = { 'tuning-lab': tuningLab, gamut: gamutTool, modes: modeTool, organum: organumTool, mensural: mensuralTool, tonnetz: tonnetzTool, 'fundamental-bass': fbTool, 'row-matrix': rowTool, ursatz: ursatzTool, eramap: eraMap, timeline: timelineTool, theorists: theoristTool, glossary: glossaryTool, quiz: el => quizTool(el, null) };
// lazy mount: build a widget when its placeholder approaches the viewport
const mount = el => { if (el.dataset.done) return; el.dataset.done = '1'; const k = el.dataset.w;
  try { if (k.startsWith('quiz:')) quizTool(el, k.slice(5)); else if (TOOLS[k]) TOOLS[k](el); }
  catch (e) { console.error('widget', k, e); el.textContent = 'This tool could not be drawn.'; } };
const lazy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { lazy.unobserve(e.target); mount(e.target); } }), { rootMargin: '600px 0px' });
document.querySelectorAll('[data-w]').forEach(el => lazy.observe(el));
document.querySelectorAll('details.tool-open').forEach(d => d.addEventListener('toggle', () => { if (d.open) d.querySelectorAll('[data-w]').forEach(mount); }));

const reg = document.getElementById('reg'), tempo = document.getElementById('tempo'), tv = document.getElementById('tempo-v');
reg.addEventListener('change', () => { AudioEng.reg = reg.value; AudioEng.cache.clear(); AudioEng.pluckNow('D4', 1); });
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
