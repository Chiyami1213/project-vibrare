/* Fux counterpoint engine: pitch utils, data, checker, solver. Ported unchanged from content/counterpoint/engine/fux-engine.js
   (the pack's UMD file) to an ES module; the logic is identical and tests/fux.test.mjs checks it against the stored results. */
const LET = 'CDEFGAB', PCS = [0, 2, 4, 5, 7, 9, 11];
const EPS = 1e-6;
const P = {};
function parse(s) {
  if (P[s]) return P[s];
  const m = /^([A-G])(#|b|n)?(-?\d)$/.exec(s);
  if (!m) throw new Error('bad pitch ' + s);
  const li = LET.indexOf(m[1]), acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, oct = +m[3];
  return (P[s] = { s, L: m[1], li, acc, oct, step: li + 7 * oct, midi: 12 * (oct + 1) + PCS[li] + acc });
}
function fromStep(step, acc) {
  const oct = Math.floor(step / 7), li = ((step % 7) + 7) % 7;
  return LET[li] + (acc === 1 ? '#' : acc === -1 ? 'b' : '') + oct;
}
function midiOf(s) { return parse(s).midi; }
// vertical interval lower->upper
function ivl(a, b) {
  let A = parse(a), B = parse(b);
  if (B.step < A.step || (B.step === A.step && B.midi < A.midi)) { const t = A; A = B; B = t; }
  const gen = B.step - A.step, semis = B.midi - A.midi;
  const g = gen % 7, s = semis - 12 * Math.floor(gen / 7);
  let kind;
  if (g === 0 && s === 0) kind = 'P8';
  else if (g === 4 && s === 7) kind = 'P5';
  else if (g === 2 && (s === 3 || s === 4)) kind = 'imp3';
  else if (g === 5 && (s === 8 || s === 9)) kind = 'imp6';
  else if (g === 3 && s === 5) kind = 'P4';
  else kind = 'diss';
  return { gen, semis, g, s, kind, num: gen + 1, perfect: kind === 'P8' || kind === 'P5', imperfect: kind === 'imp3' || kind === 'imp6' };
}
function isDiss(lo, hi, loIsBass) {
  const i = ivl(lo, hi);
  if (i.kind === 'diss') {
    if (!loIsBass && (i.g === 3 || i.g === 4)) return false; // aug4/dim5 between upper voices
    return true;
  }
  if (i.kind === 'P4') return loIsBass;
  return false;
}
// melodic interval check
function melOK(a, b) {
  const A = parse(a), B = parse(b);
  const gen = Math.abs(B.step - A.step), semis = Math.abs(B.midi - A.midi), up = B.midi > A.midi;
  const ok = (gen === 0 && semis === 0) || (gen === 1 && (semis === 1 || semis === 2)) ||
    (gen === 2 && (semis === 3 || semis === 4)) || (gen === 3 && semis === 5) || (gen === 4 && semis === 7) ||
    (gen === 5 && semis === 8 && up) || (gen === 7 && semis === 12);
  return { ok, gen, semis, up, m6down: gen === 5 && semis === 8 && !up };
}

/* ---------- Fux's data ---------- */
const MODES = {
  D: { name: 'Dorian (D)', final: 'D', cf: ['D4', 'F4', 'E4', 'D4', 'G4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4'], lt: 'C#', flat: true },
  E: { name: 'Phrygian (E)', final: 'E', cf: ['E4', 'C4', 'D4', 'C4', 'A3', 'A4', 'G4', 'E4', 'F4', 'E4'], lt: null, flat: false },
  F: { name: 'Lydian (F)', final: 'F', cf: ['F4', 'G4', 'A4', 'F4', 'D4', 'E4', 'F4', 'C5', 'A4', 'F4', 'G4', 'F4'], lt: null, flat: true },
  G: { name: 'Mixolydian (G)', final: 'G', cf: ['G3', 'C4', 'B3', 'G3', 'C4', 'E4', 'D4', 'G4', 'E4', 'C4', 'D4', 'B3', 'A3', 'G3'], lt: 'F#', flat: false },
  A: { name: 'Aeolian (A)', final: 'A', cf: ['A3', 'C4', 'B3', 'D4', 'C4', 'E4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'], lt: 'G#', flat: false },
  C: { name: 'Ionian (C)', final: 'C', cf: ['C4', 'E4', 'F4', 'G4', 'E4', 'A4', 'G4', 'E4', 'F4', 'E4', 'D4', 'C4'], lt: null, flat: false }
};

/* ---------- rhythm templates ---------- */
// a voice line = array of notes {p, d, tie, rest}; bar length 1 (= whole note)
const FLORID = {
  hh: [{ d: .5 }, { d: .5 }],
  hht: [{ d: .5 }, { d: .5, tie: 1 }],
  qqqq: [{ d: .25 }, { d: .25 }, { d: .25 }, { d: .25 }],
  hqq: [{ d: .5 }, { d: .25 }, { d: .25 }],
  qqh: [{ d: .25 }, { d: .25 }, { d: .5 }],
  qqht: [{ d: .25 }, { d: .25 }, { d: .5, tie: 1 }],
  hqqt: [{ d: .5 }, { d: .25 }, { d: .25, tie: 1 }],
  qeeh: [{ d: .25 }, { d: .125 }, { d: .125 }, { d: .5 }],
  hqee: [{ d: .5 }, { d: .25 }, { d: .125 }, { d: .125 }],
  w: [{ d: 1 }]
};
function barTemplate(species, i, n, opt) {
  opt = opt || {};
  const last = i === n - 1, first = i === 0;
  if (last) return [{ d: 1 }];
  switch (species) {
    case 1: return [{ d: 1 }];
    case 2: return first && opt.rest !== false ? [{ d: .5, rest: 1 }, { d: .5 }] : [{ d: .5 }, { d: .5 }];
    case 3: return first && opt.rest ? [{ d: .25, rest: 1 }, { d: .25 }, { d: .25 }, { d: .25 }] : [{ d: .25 }, { d: .25 }, { d: .25 }, { d: .25 }];
    case 4: return first ? [{ d: .5, rest: 1 }, { d: .5, tie: 1 }] : [{ d: .5 }, { d: .5, tie: i < n - 2 || true ? 1 : 0 }];
    case 5: {
      if (first) return [{ d: .5, rest: 1 }, { d: .5, tie: 1 }];
      const pat = (opt.patterns && opt.patterns[i]) || 'hh';
      return FLORID[pat].map(x => Object.assign({}, x));
    }
  }
}
function makeLine(species, n, opt) {
  const out = [];
  for (let i = 0; i < n; i++) for (const t of barTemplate(species, i, n, opt)) out.push(Object.assign({ p: null }, t));
  // species 4: penultimate bar upbeat must not tie into final bar
  if (species === 4 || species === 5) {
    // find last note before final bar
    const k = out.length - 2;
    if (out[k]) out[k].tie = 0;
  }
  return out;
}
function cfLine(pitches) { return pitches.map(p => ({ p, d: 1 })); }
function transpose(p, octs) { const x = parse(p); return x.L + (x.acc === 1 ? '#' : x.acc === -1 ? 'b' : '') + (x.oct + octs); }

/* ---------- analysis ---------- */
function mergeVoice(notes) {
  const out = []; let on = 0, prevTie = false;
  for (let k = 0; k < notes.length; k++) {
    const n = notes[k];
    if (n.rest) { out.push({ rest: true, on, end: on + n.d, raw: [k] }); prevTie = false; on += n.d; continue; }
    const last = out[out.length - 1];
    if (prevTie && last && !last.rest && n.p && last.p === n.p) { last.end += n.d; last.raw.push(k); last.tied = true; }
    else {
      const m = { p: n.p, unk: !n.p, on, end: on + n.d, raw: [k] };
      if (n.p) { const x = parse(n.p); m.step = x.step; m.midi = x.midi; }
      out.push(m);
    }
    prevTie = !!n.tie; on += n.d;
  }
  out.forEach((m, i) => { m.i = i; m.dur = m.end - m.on; });
  return out;
}
const fr = x => { const f = x - Math.floor(x + EPS); return Math.abs(f) < EPS ? 0 : f; };

function analyze(voices, opts) {
  opts = opts || {};
  const partial = !!opts.partial; const tLo = opts.from || 0;
  const V = voices.map(v => ({ role: v.role, species: v.species || 1, notes: mergeVoice(v.notes) }));
  const nv = V.length, issues = [];
  const add = (level, rule, v, t, msg, extra) => issues.push(Object.assign({ level, rule, v, t, msg }, extra || {}));
  const cfI = V.findIndex(v => v.role === 'cf');
  const total = Math.max(...V.map(v => v.notes.length ? v.notes[v.notes.length - 1].end : 0));
  const nBars = Math.round(total);
  // slices
  const set = new Set();
  V.forEach(v => v.notes.forEach(m => { if (!m.rest) set.add(Math.round(m.on * 1000) / 1000); }));
  const slices = [...set].sort((a, b) => a - b);
  const at = (vi, t) => { const ns = V[vi].notes; let lo = 0, hi = ns.length - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, m = ns[mid]; if (t < m.on - EPS) hi = mid - 1; else if (t >= m.end - EPS) lo = mid + 1; else return m; } return null; };
  const known = m => m && !m.rest && !m.unk;
  const chCache = new Map();
  function chordAt(t) {
    const key = Math.round(t * 1000); if (chCache.has(key)) return chCache.get(key);
    const s = []; chCache.set(key, s);
    for (let vi = 0; vi < nv; vi++) { const m = at(vi, t); if (m && !m.rest) s.push({ vi, m }); }
    return s;
  }
  function bassOf(ch) { let b = null; for (const x of ch) if (known(x.m) && (!b || x.m.midi < b.m.midi)) b = x; return b; }
  function pairDiss(ch, a, b) { // a,b entries
    const bass = bassOf(ch);
    const lo = a.m.midi <= b.m.midi ? a : b, hi = lo === a ? b : a;
    return isDiss(lo.m.p, hi.m.p, nv === 2 || lo.vi === bass.vi);
  }
  // dissAtOnset for each note
  V.forEach((v, vi) => v.notes.forEach(m => {
    if (!known(m) || m.end < tLo - 2.5) { m.dao = null; return; }
    const ch = chordAt(m.on);
    if (ch.some(x => x.m.unk)) { m.dao = null; return; }
    m.dao = ch.some(x => x.vi !== vi && pairDiss(ch, { vi, m }, x));
  }));
  const nextN = (vi, m) => { const ns = V[vi].notes; for (let k = m.i + 1; k < ns.length; k++) if (!ns[k].rest) return ns[k]; return null; };
  const prevN = (vi, m) => { const ns = V[vi].notes; for (let k = m.i - 1; k >= 0; k--) { if (ns[k].rest) return null; return ns[k]; } return null; };

  function passingTest(vi, n) {
    if (fr(n.on) === 0) return 'bad';
    if (n.dur > .5 + EPS) return 'bad';
    const p = prevN(vi, n), q = nextN(vi, n);
    if (!p || p.unk) return p && p.unk ? 'pending' : 'bad';
    const d1 = n.step - p.step;
    if (n.dur <= .125 + EPS) { // eighth
      if (Math.abs(d1) !== 1) return 'bad';
      if (!q || q.unk) return partial ? 'pending' : 'bad';
      return Math.abs(q.step - n.step) === 1 ? 'ok' : 'bad';
    }
    if (Math.abs(d1) !== 1) return 'bad';
    if (!q || q.unk) return partial ? 'pending' : 'bad';
    const d2 = q.step - n.step;
    if (d2 === d1) { if (q.dao === true) return 'bad'; return 'ok'; }
    // cambiata
    if (Math.abs(n.dur - .25) < EPS && Math.abs(fr(n.on * 2) - .5) < EPS && d1 === -1 && d2 === -2 && q.dao !== true) {
      const q2 = nextN(vi, q);
      if (!q2 || q2.unk) return partial ? 'pending' : 'bad';
      return q2.step - q.step === 1 ? 'ok' : 'bad';
    }
    return 'bad';
  }
  function suspTest(vi, n, t, wi) {
    if (fr(t) !== 0) return { r: 'bad' };
    if (n.dao === true) return { r: 'bad' };
    const m = nextN(vi, n);
    if (!m) return { r: partial ? 'pending' : 'bad' };
    if (m.unk) return { r: 'pending' };
    let res = null;
    if (m.step - n.step === -1) res = m;
    else {
      // ornamented resolution: note at t+0.5 a step below, intervening notes short
      const ns = V[vi].notes; let k = m.i, okShort = true;
      for (; k < ns.length && ns[k].on < t + .5 - EPS; k++) if (ns[k].rest || ns[k].dur > .25 + EPS) okShort = false;
      const r = ns[k];
      if (r && r.unk) return { r: 'pending' };
      if (okShort && r && Math.abs(r.on - (t + .5)) < EPS && r.step - n.step === -1) res = r;
    }
    if (!res) return { r: 'bad' };
    if (res.dao === true) return { r: 'bad' };
    const out = { r: 'ok', extra: [] };
    // prep and resolution intervals against voice wi
    const w0 = at(wi, n.on), w1 = at(wi, res.on);
    if (known(w0) && known(w1)) {
      const i0 = ivl(n.p, w0.p), i1 = ivl(res.p, w1.p);
      if (i0.kind === 'P8' && i1.kind === 'P8') out.extra.push(['error', 'susp-perf', 'The retardation does not hide the octaves/unisons: remove the tie and two octaves (or unisons) follow directly (Fig. 65).']);
      const wt = at(wi, t);
      if (known(wt) && n.midi < wt.midi) { const it = ivl(n.p, wt.p); if (it.g === 6 && i1.kind === 'P8') out.extra.push(['warn', 'susp78', 'A seventh in the lower voice resolving into the octave: the masters do not use it (Fig. 70).']); }
    }
    return out;
  }
  function treat(vi, m, t, wi) {
    if (V[vi].role === 'cf') return { r: 'bad' };
    if (Math.abs(m.on - t) < EPS) return { r: passingTest(vi, m) };
    return suspTest(vi, m, t, wi);
  }
  // ---- dissonance check per slice
  for (const t of slices) {
    if (t < tLo - 1e-6) continue;
    const ch = chordAt(t);
    if (ch.some(x => x.m.unk)) continue;
    if (ch.length < 2) continue;
    const reported = new Set();
    for (let a = 0; a < ch.length; a++) for (let b = a + 1; b < ch.length; b++) {
      if (!pairDiss(ch, ch[a], ch[b])) continue;
      const A = ch[a], B = ch[b];
      const ra = treat(A.vi, A.m, t, B.vi), rb = treat(B.vi, B.m, t, A.vi);
      const good = [ra, rb].find(r => r.r === 'ok');
      if (good) { (good.extra || []).forEach(e => add(e[0], e[1], good === ra ? A.vi : B.vi, t, e[2])); continue; }
      if (ra.r === 'pending' || rb.r === 'pending') continue;
      // blame
      let blame = V[A.vi].role === 'cf' ? B : V[B.vi].role === 'cf' ? A : (Math.abs(A.m.on - t) < EPS && A.m.dur <= B.m.dur ? A : B);
      const key = blame.vi + '@' + t;
      if (reported.has(key)) continue; reported.add(key);
      const iv = ivl(A.m.p, B.m.p);
      const name = iv.kind === 'P4' ? 'fourth' : iv.g === 1 ? 'second' : iv.g === 6 ? 'seventh' : iv.g === 3 ? 'augmented fourth' : iv.g === 4 ? 'diminished fifth' : 'dissonance';
      if (fr(t) === 0 && Math.abs(blame.m.on - t) < EPS) add('error', 'acc-diss', blame.vi, t, `Dissonant ${name} on the downbeat. On the downbeat a dissonance is only allowed as a prepared, tied suspension resolving down by step.`);
      else if (Math.abs(blame.m.on - t) > EPS) add('error', 'susp', blame.vi, t, `Badly treated suspension (${name}): it must be prepared by a consonance and resolve down by step to a consonance.`);
      else add('error', 'diss', blame.vi, t, `Dissonant ${name} that is not a passing tone. It must be approached and left by step in the same direction (or be a cambiata).`);
    }
  }
  // ---- motion checks per pair
  const two = nv === 2;
  for (let i = 0; i < nv; i++) for (let j = i + 1; j < nv; j++) {
    let prev = null, run = 0, runKind = null;
    const outer = (() => { // are i,j the outer voices at most times? approximate by voice order (0 top, nv-1 bottom)
      return (i === 0 && j === nv - 1);
    })();
    for (const t of slices) {
      if (t < tLo - 1.01) continue;
      const a = at(i, t), b = at(j, t);
      if (!known(a) || !known(b)) { if ((a && a.unk) || (b && b.unk)) { prev = null; } else prev = null; continue; }
      const cur = { t, a, b, iv: ivl(a.p, b.p) };
      if (prev) {
        const movA = prev.a !== a && prev.a.p !== a.p, movB = prev.b !== b && prev.b.p !== b.p;
        const dA = a.midi - prev.a.midi, dB = b.midi - prev.b.midi;
        const blame = V[i].role === 'cf' ? j : i;
        if (movA && movB) {
          const k1 = prev.iv.kind, k2 = cur.iv.kind;
          if (cur.iv.perfect && k1 === k2) {
            add('error', k2 === 'P5' ? 'par5' : 'par8', blame, t, k2 === 'P5' ? 'Consecutive fifths. From one perfect consonance to another, move by contrary or oblique motion (Rule 1).' : 'Consecutive octaves/unisons. From one perfect consonance to another, move by contrary or oblique motion (Rule 1).');
          } else if (cur.iv.perfect && Math.sign(dA) === Math.sign(dB)) {
            if (two) add('error', 'direct', blame, t, 'Direct (similar) motion into a perfect consonance makes hidden fifths/octaves. Approach it by contrary or oblique motion (Rules 1 & 3; Figs. 7–8).');
            else if (outer) add('warn', 'direct', blame, t, 'Direct motion into a perfect consonance' + (outer ? ' between the outer voices' : '') + '. Fux tolerates this in three or more parts only when there is no better possibility (Fig. 101, bars 7–8).');
          } else if (cur.iv.kind === 'P8' && Math.sign(dA) !== Math.sign(dB)) {
            const skA = Math.abs(a.step - prev.a.step) >= 2, skB = Math.abs(b.step - prev.b.step) >= 2;
            if (skA && skB && (two || outer)) add(two ? 'error' : 'warn', 'skip8', blame, t, 'Octave/unison approached by skips in contrary motion from a more remote consonance (Figs. 19–20).');
            else if (two && fr(t) === 0 && prev.iv.gen === 9 && Math.abs(a.step - prev.a.step) === 1 && Math.abs(b.step - prev.b.step) === 1 && cur.iv.gen === 7)
              add('warn', 'battuta', blame, t, '“Ottava battuta”: a tenth moving to an octave by contrary steps on the downbeat (Fig. 16). Fux leaves its use to your discretion.');
          }
          if (cur.iv.imperfect && prev.iv.imperfect && cur.iv.kind === prev.iv.kind && Math.sign(dA) === Math.sign(dB)) {
            run = runKind === cur.iv.kind ? run + 1 : 2; runKind = cur.iv.kind;
            if (run === 5) add('warn', 'par-imp', blame, t, 'Too many parallel thirds/sixths in a row (3–4 at most, Ch. 1 n.2).');
          } else { run = 0; runKind = null; }
          if (prev.iv.kind === 'P8' && prev.iv.gen === 0 && (Math.abs(dA) > 2 || Math.abs(dB) > 2) && two && fr(prev.t) === 0 && prev.t > 0)
            add('warn', 'leave-uni', blame, t, 'Leaving a unison by skip is bad in itself (Fig. 21, N.B.).');
        } else { run = 0; runKind = null; }
      }
      prev = cur;
    }
    // downbeat-to-downbeat perfects, when one voice has several notes per bar
    for (let bar = Math.max(0, Math.floor(tLo) - 2); bar < nBars - 2; bar++) {
      const a0 = at(i, bar), b0 = at(j, bar), a1 = at(i, bar + 1), b1 = at(j, bar + 1);
      if (![a0, b0, a1, b1].every(known)) continue;
      const fl = [i, j].find(vi => V[vi].notes.filter(m => !m.rest && m.on >= bar - EPS && m.on < bar + 1 - EPS).length > 1);
      if (fl === undefined) continue;
      const k0 = ivl(a0.p, b0.p), k1 = ivl(a1.p, b1.p);
      if (!(k0.perfect && k0.kind === k1.kind)) continue;
      if (a0.p === a1.p || b0.p === b1.p) continue;
      // syncopated voice? (species 4 style) -> handled separately
      const flv = V[fl];
      const inBar = flv.notes.filter(m => !m.rest && m.on >= bar - EPS && m.on < bar + 1 - EPS);
      const tiedIn = at(fl, bar + 1) && at(fl, bar + 1).on < bar + 1 - EPS;
      if (tiedIn) continue;
      let bigSkip = false;
      const seq = [at(fl, bar)].concat(inBar.filter(m => m.on > bar + EPS));
      for (let k = 1; k < seq.length; k++) if (Math.abs(seq[k].step - seq[k - 1].step) >= 3) bigSkip = true;
      if (bigSkip) continue;
      const blame = V[i].role === 'cf' ? j : i;
      const quarters = inBar.length >= 3;
      add(quarters ? 'warn' : 'error', 'dd', blame, bar + 1, (k1.kind === 'P5' ? 'Fifths' : 'Octaves') + ' on successive downbeats. ' + (quarters ? 'With several notes between them this is less obvious, but still weak.' : 'A skip of a third between them does not hide them; only a skip of a fourth or more does (Figs. 27–32).'));
    }
    // syncopation (upbeat) octaves
    for (let bar = Math.max(1, Math.floor(tLo) - 2); bar < nBars - 1; bar++) {
      const t0 = bar + .5 - 1, t1 = bar + .5;
      const ai = at(i, t0), bi = at(j, t0), a2 = at(i, t1), b2 = at(j, t1);
      if (![ai, bi, a2, b2].every(known)) continue;
      const sy = vi => { const m = at(vi, t1), m0 = at(vi, t0); return m.on === t1 && m.end > bar + 1 + EPS && m0.on === t0 && m0.end > bar + EPS; };
      if (!(sy(i) || sy(j))) continue;
      const k0 = ivl(ai.p, bi.p), k1 = ivl(a2.p, b2.p);
      if (k0.kind === 'P8' && k1.kind === 'P8' && ai.p !== a2.p) add('error', 'sync8', V[i].role === 'cf' ? j : i, t1, 'Successive octaves/unisons between the syncopations. The ligature does not make them acceptable (Figs. 65, 139).');
    }
  }
  // ---- melodic checks per non-cf voice
  V.forEach((v, vi) => {
    if (v.role === 'cf') return;
    const ns = v.notes;
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < ns.length; k++) {
      const m = ns[k]; if (!known(m)) continue;
      lo = Math.min(lo, m.step); hi = Math.max(hi, m.step);
      if (m.on < tLo - 2) continue;
      // eighth placement
      if (m.dur <= .125 + EPS) { const pos = fr(m.on); if (Math.abs(pos) < EPS || Math.abs(pos - .5) < EPS) add('error', 'eighth', vi, m.on, 'Eighth notes may be used only in pairs on the 2nd or 4th quarter, never on the 1st or 3rd (Fig. 81).'); }
      const p = ns[k - 1]; if (!known(p)) continue;
      const mo = melOK(p.p, m.p);
      if (!mo.ok) add('error', 'mel', vi, m.on, mo.m6down ? 'The minor sixth may be used only ascending (Ch. 1, n.1).' : (parse(p.p).L === parse(m.p).L ? 'Chromatic step: not allowed in the diatonic style (Ch. 1, n.1).' : 'Forbidden melodic interval (augmented or diminished interval, major sixth, seventh, or larger than an octave). Lines must be easy to sing (Ch. 1, n.1; Figs. 12, 15).'));
      if (p.p === m.p) {
        if (p.dur <= .5 + EPS && m.dur <= .5 + EPS && !(fr(m.on) === 0 && v.species === 4)) add('error', 'rep', vi, m.on, 'Two half notes (or shorter) repeated on the same pitch (II.2).');
        else { const pp = ns[k - 2]; if (known(pp) && pp.p === p.p) add('warn', 'rep', vi, m.on, 'Do not repeat the same tone more than once (Fig. 5, n.3).'); }
      }
      // successive skips same direction
      const pp = ns[k - 2];
      if (known(pp)) {
        const d1 = p.step - pp.step, d2 = m.step - p.step;
        if (Math.abs(d1) >= 2 && Math.abs(d2) >= 2 && Math.sign(d1) === Math.sign(d2) && Math.abs(d1 + d2) >= 5)
          add('warn', 'leaps', vi, m.on, 'Avoid successive skips in the same direction (Ch. 1, n.1).');
        if (Math.abs(d1) >= 4 && (Math.sign(d2) === Math.sign(d1) && d2 !== 0)) add('warn', 'comp', vi, m.on, 'A large skip should be compensated by moving in the opposite direction (Ch. 1, n.1).');
      }
    }
    // tritone outline in stepwise runs
    let runStart = 0;
    const kn = ns.filter(known);
    for (let k = 1; k <= kn.length; k++) {
      const cont = k < kn.length && Math.abs(kn[k].step - kn[k - 1].step) === 1 && (k - runStart < 2 || Math.sign(kn[k].step - kn[k - 1].step) === Math.sign(kn[k - 1].step - kn[k - 2].step));
      if (!cont) {
        if (k - 1 - runStart >= 2) { const a = kn[runStart], b = kn[k - 1]; const s = Math.abs(b.midi - a.midi), g = Math.abs(b.step - a.step); if (s === 6 && (g === 3 || g === 4)) add('warn', 'tritone', vi, b.on, '“Mi contra fa”: this stepwise line outlines a tritone and turns back. Avoid it unless the line continues in the same direction (Ch. 1, n.9).'); }
        runStart = k - 1;
        if (k < kn.length && Math.abs(kn[k].step - kn[k - 1].step) !== 1) runStart = k;
      }
    }
    if (hi - lo >= 10) add('warn', 'range', vi, 0, 'The range is wider than a tenth. Avoid registers that are too high or too low (Ch. 1, n.1).');
    // species-5 lag (two quarters at bar start, then a half without tie)
    if (v.species === 5) for (let k = 0; k + 2 < ns.length; k++) {
      const a = ns[k], b = ns[k + 1], c = ns[k + 2];
      if ([a, b, c].every(x => x && !x.rest) && fr(a.on) === 0 && Math.abs(a.dur - .25) < EPS && Math.abs(b.dur - .25) < EPS && c.dur >= .5 - EPS && !c.tied && Math.abs(c.dur - .5) < EPS)
        add('warn', 'lag', vi, a.on, 'Two quarters at the start of the bar followed by a plain half make the line lag. Tie the half over or continue in quarters (Fig. 89).');
    }
  });
  // ---- beginning / end / cadence
  const firstAttack = vi => V[vi].notes.find(m => !m.rest);
  const lastN = vi => V[vi].notes[V[vi].notes.length - 1];
  const penult = vi => { const ns = V[vi].notes; const l = ns[ns.length - 1]; return ns.slice(0, -1).reverse().find(m => !m.rest && m.end <= l.on + EPS); };
  if (cfI >= 0) {
    const finalL = parse(V[cfI].notes[V[cfI].notes.length - 1].p || V[cfI].notes[0].p).L;
    if (two) {
      const ci = 1 - cfI, f = firstAttack(ci);
      if (known(f)) {
        const c = at(cfI, f.on); const iv = ivl(f.p, c.p);
        if (!iv.perfect) add('error', 'begin', ci, f.on, 'Begin with a perfect consonance: unison, fifth, or octave (Ch. 1).');
        else if (f.midi < c.midi && iv.kind === 'P5') add('error', 'begin-mode', ci, f.on, 'With the counterpoint below, a fifth puts the beginning outside the mode. Use the unison or octave (Fig. 6).');
      }
      const l = lastN(ci), lc = lastN(cfI);
      if (known(l) && known(lc)) {
        if (ivl(l.p, lc.p).kind !== 'P8') add('error', 'end', ci, l.on, 'End on a perfect consonance: unison or octave (Ch. 1).');
        const pn = penult(ci); const pc = pn && at(cfI, pn.on);
        if (known(pn) && known(pc)) {
          const iv = ivl(pn.p, pc.p);
          const cpAbove = pn.midi > pc.midi;
          const ok = cpAbove ? (iv.g === 5 && iv.s === 9) : (iv.g === 2 && iv.s === 3);
          if (!ok) add('error', 'cad', ci, pn.on, cpAbove ? 'Cadence: the next-to-last note must form a major sixth above the cantus firmus (Ch. 1; Fig. 25).' : 'Cadence: with the cantus firmus above, the next-to-last note must form a minor third (or tenth) below it (Ch. 1; Fig. 25).');
        }
      }
      // unisons and perfect/imperfect balance (species 1)
      const sp = V[ci].species;
      let perf = 0, imp = 0;
      for (let bar = 0; bar < nBars; bar++) {
        const a = at(ci, bar), c = at(cfI, bar); if (!known(a) || !known(c)) continue;
        const iv = ivl(a.p, c.p);
        if (bar > 0 && bar < nBars - 1) { if (iv.perfect) perf++; else if (iv.imperfect) imp++; }
        if (iv.gen === 0 && iv.semis === 0 && bar > 0 && bar < nBars - 1 && (sp === 1 || sp === 2) && Math.abs(a.on - bar) < EPS)
          add('error', 'unison', ci, bar, 'Use the unison only at the beginning and the end (Figs. 16–18).');
      }
      if (sp === 1 && !partial && perf > imp) add('warn', 'balance', ci, 0, 'Use more imperfect than perfect consonances (Ch. 1).');
    } else {
      // multi-voice
      const ch0 = chordAt(0), chE = chordAt(nBars - 1);
      [[ch0, 0], [chE, nBars - 1]].forEach(([ch, t]) => {
        if (ch.some(x => x.m.unk) || ch.length < nv) return;
        const b = bassOf(ch);
        if (b.m.L !== undefined) { }
        if (parse(b.m.p).L !== finalL) add('error', 'bass-mode', b.vi, t, 'The lowest voice must begin and end on the final of the mode.');
        if (t === nBars - 1) for (const x of ch) if (x !== b) {
          const iv = ivl(b.m.p, x.m.p);
          if (iv.kind === 'imp3') add(iv.s === 4 ? 'warn' : 'error', 'final3', x.vi, t, iv.s === 4 ? 'Final chord with a major third. Fux usually omits the third and allows a major third only when the fifth would cause consecutive fifths (Figs. 105–107, 124).' : 'A minor third cannot give a sense of conclusion (Fig. 105).');
          else if (!iv.perfect) add('error', 'end', x.vi, t, 'The final chord must consist of perfect consonances.');
        }
      });
      // cadence: someone forms M6 above / m3 below cf penult
      const pc = penult(cfI);
      if (known(pc)) {
        const ch = chordAt(pc.on);
        if (!ch.some(x => x.m.unk)) {
          const ok = ch.some(x => { if (x.vi === cfI || !known(x.m)) return false; const iv = ivl(x.m.p, pc.p); return x.m.midi > pc.midi ? (iv.g === 5 && iv.s === 9) : (iv.g === 2 && iv.s === 3); }) ||
            V.some((v, vi) => vi !== cfI && v.notes.some(m => known(m) && m.on >= pc.on - EPS && m.end <= pc.end + EPS && (() => { const iv = ivl(m.p, pc.p); return m.midi > pc.midi ? (iv.g === 5 && iv.s === 9) : (iv.g === 2 && iv.s === 3); })()));
          if (!ok) add('warn', 'cad', cfI === 0 ? 1 : 0, pc.on, 'Cadence: some voice should form a major sixth above (or a minor third below) the cantus firmus in the next-to-last bar.');
        }
      }
      // triad completeness & unisons on downbeats
      for (let bar = Math.max(1, Math.floor(tLo) - 1); bar < nBars - 1; bar++) {
        const ch = chordAt(bar); if (ch.length < nv || ch.some(x => !known(x.m))) continue;
        const b = bassOf(ch);
        const gs = ch.filter(x => x !== b).map(x => ivl(b.m.p, x.m.p).g);
        if (!gs.includes(2)) add('warn', 'triad', b.vi, bar, 'Incomplete harmony: no third above the bass. Use the harmonic triad in every bar unless there is a special reason (II.1).');
        for (let a = 0; a < ch.length; a++) for (let c = a + 1; c < ch.length; c++) if (ch[a].m.p === ch[c].m.p && Math.abs(ch[a].m.on - bar) < EPS && Math.abs(ch[c].m.on - bar) < EPS)
          add('warn', 'unison-m', ch[c].vi === cfI ? ch[a].vi : ch[c].vi, bar, 'A unison is less harmonious than an octave (Fig. 102 text).');
      }
    }
  }
  issues.sort((a, b) => a.t - b.t || (a.level === 'error' ? -1 : 1));
  return { issues, errors: issues.filter(x => x.level === 'error'), warns: issues.filter(x => x.level === 'warn'), V, nBars };
}

/* ---------- solver ---------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
function candidates(mode, lo, hi, opts) {
  const out = [];
  const M = MODES[mode];
  for (let st = parse(lo).step; st <= parse(hi).step; st++) {
    const L = LET[((st % 7) + 7) % 7];
    out.push(fromStep(st, 0));
    if (L === 'B' && M.flat && opts.flat) out.push(fromStep(st, -1));
  }
  return out;
}
function leadingFor(mode, p) { // raise if pitch letter matches mode's leading tone
  const M = MODES[mode]; if (!M.lt) return null;
  const x = parse(p); if (x.L === M.lt[0] && x.acc === 0) return M.lt[0] + '#' + x.oct; return null;
}
/* voices: [{role,species,notes(with p null for free), lo, hi}] ; returns filled voices or null */
function solve(voices, mode, opts) {
  opts = opts || {};
  const R = rng(opts.seed || (Math.random() * 1e9));
  const maxNodes = opts.maxNodes || 40000;
  const V = voices.map(v => ({ role: v.role, species: v.species, notes: v.notes.map(n => Object.assign({}, n)), lo: v.lo, hi: v.hi }));
  // slots
  const slots = [];
  V.forEach((v, vi) => { let on = 0; v.notes.forEach((n, k) => { if (!n.rest && !n.p) slots.push({ vi, k, on, d: n.d }); on += n.d; }); });
  const order = V.map((v, vi) => vi).sort((a, b) => (V[a].lo ? parse(V[a].lo).midi : 0) - (V[b].lo ? parse(V[b].lo).midi : 0));
  const total = V[0].notes.reduce((s, n) => s + n.d, 0);
  const endRank = s => (s.on >= total - 1 - 1e-6 ? 0 : (s.on + s.d >= total - 1 - 1e-6 ? 1 : 2));
  slots.sort((a, b) => endRank(a) - endRank(b) || a.on - b.on || order.indexOf(a.vi) - order.indexOf(b.vi));
  const cands = V.map(v => v.role === 'cf' ? [] : candidates(mode, v.lo, v.hi, { flat: opts.flat !== false }));
  const cfV = V.find(v => v.role === 'cf');
  let nodes = 0, best = null; const maxNodesRef = { v: maxNodes }; const T0 = Date.now(), maxMs = opts.maxMs || 1e9; let deadline = Infinity;
  function prevPitch(vi, k) { for (let q = k - 1; q >= 0; q--) { const n = V[vi].notes[q]; if (n.rest) return null; return n.p; } return null; }
  function order1(s) {
    const v = V[s.vi]; const n = v.notes[s.k];
    const pp = prevPitch(s.vi, s.k);
    const prevTie = s.k > 0 && v.notes[s.k - 1].tie && !v.notes[s.k - 1].rest;
    const isPen = s.on + s.d >= total - 1 - 1e-6 && s.on + s.d <= total - 1 + 1e-6;
    let list = cands[s.vi].slice();
    if (isPen) list = list.map(p => leadingFor(mode, p) || p);
    const sounding = V.map((w, wi) => { if (wi === s.vi) return null; let on = 0; for (const x of w.notes) { if (on <= s.on + 1e-6 && s.on < on + x.d - 1e-6) return x.rest ? null : x.p; on += x.d; } return null; }).filter(Boolean);
    const scored = list.map(p => {
      let sc = R() * 2.2;
      if (pp) { const d = Math.abs(parse(p).step - parse(pp).step); sc += d === 1 ? 0 : d === 2 ? .6 : d === 0 ? 2.5 : d === 3 ? 1.6 : d === 4 ? 2.2 : 3; }
      for (const q of sounding) { const iv = ivl(p, q); if (iv.imperfect) sc -= .4; if (iv.perfect && fr(s.on) === 0) sc += .3; }
      return { p, sc };
    }).sort((a, b) => a.sc - b.sc).map(x => x.p);
    if (prevTie && pp) { // syncopation: prefer holding the note
      const i = scored.indexOf(pp); if (i >= 0) scored.splice(i, 1);
      if (v.species === 5) return [pp];
      scored.unshift(pp);
    }
    return scored;
  }
  function soundingP(wi, t) { let on = 0; for (const x of V[wi].notes) { if (on <= t + 1e-6 && t < on + x.d - 1e-6) return x.rest ? null : x.p; on += x.d; } return null; }
  function crosses(s) {
    const m = parse(V[s.vi].notes[s.k].p).midi;
    for (let wi = 0; wi < V.length; wi++) { if (wi === s.vi) continue; const q = soundingP(wi, s.on); if (!q) continue; const qm = parse(q).midi;
      if (wi < s.vi && qm < m) return true; if (wi > s.vi && qm > m) return true; }
    return false;
  }
  function rec(si) {
    if (nodes++ > maxNodesRef.v) return true; // abort
    if ((nodes & 7) === 0 && Date.now() > deadline) { maxNodesRef.v = -1; return true; }
    if (si === slots.length) {
      const res = analyze(V, {});
      if (!isBad(res)) {
        const score = res.warns.length;
        if (!best || score < best.score) best = { score, V: V.map(v => ({ role: v.role, species: v.species, notes: v.notes.map(n => Object.assign({}, n)) })) };
        return true;
      }
      return false;
    }
    const s = slots[si];
    for (const p of order1(s)) {
      V[s.vi].notes[s.k].p = p;
      if (opts.noCross && crosses(s)) continue;
      const res = analyze(V, { partial: true, from: s.on - 1.5 });
      if (!isBad(res)) {
        if (rec(si + 1)) return true;
      }
      if (nodes > maxNodesRef.v || maxNodesRef.v < 0) break;
    }
    V[s.vi].notes[s.k].p = null;
    return false;
  }
  const restarts = opts.restarts || 8, per = Math.floor(maxNodes / restarts);
  const STRICT = new Set(['unison-m', 'cad', 'direct', 'leaps', 'comp', 'skip8', 'tritone', 'par-imp', 'leave-uni', 'rep', 'range', 'lag', 'susp78', 'battuta', 'triad', 'final3', 'balance', 'dd']);
  let strictLevel = opts.strict === false ? 0 : 2;
  const MID = new Set(['unison-m', 'cad', 'skip8', 'tritone', 'leave-uni', 'rep', 'lag', 'susp78', 'leaps', 'comp']);
  function isBad(res) { if (res.errors.length) return true; if (strictLevel === 2) return res.warns.some(w => STRICT.has(w.rule)); if (strictLevel === 1) return res.warns.some(w => MID.has(w.rule)); return false; }
  for (let r = 0; r < restarts && !best && Date.now() - T0 < maxMs; r++) {
    strictLevel = opts.strict === false ? 0 : (r < restarts * 0.4 ? 2 : r < restarts * 0.75 ? 1 : 0);
    deadline = maxMs >= 1e9 ? Infinity : T0 + (r + 1) * maxMs / restarts;
    maxNodesRef.v = nodes + per;
    rec(0);
    slots.forEach(s => { V[s.vi].notes[s.k].p = null; });
  }
  return best ? best.V : null;
}

const RANGES = {
  2: null,
  3: [['C4', 'G5'], ['G3', 'C5'], ['C3', 'F4']],
  4: [['C4', 'G5'], ['G3', 'D5'], ['C3', 'G4'], ['F2', 'C4']]
};
function placeCf(cf, lo, hi) {
  let best = 0, bs = Infinity;
  for (let k = -2; k <= 1; k++) {
    const ms = cf.map(p => parse(transpose(p, k)).midi);
    const out = ms.filter(m => m < parse(lo).midi || m > parse(hi).midi).length;
    const ctr = Math.abs((Math.min(...ms) + Math.max(...ms)) / 2 - (parse(lo).midi + parse(hi).midi) / 2);
    const sc = out * 100 + ctr; if (sc < bs) { bs = sc; best = k; }
  }
  return cf.map(p => transpose(p, best));
}
function twoPartRange(cf, pos) {
  const st = cf.map(p => parse(p).step), lo = Math.min(...st), hi = Math.max(...st);
  return pos === 'above' ? [fromStep(lo + 2, 0), fromStep(Math.max(hi + 5, lo + 12), 0)] : [fromStep(Math.min(lo - 6, hi - 12), 0), fromStep(hi - 2, 0)];
}
/* build an exercise: nv voices, cf at index cfPos, florid voice index fl with species sp */
function buildExercise(mode, nv, cfPos, sp, fl, opt) {
  opt = opt || {};
  const cf0 = MODES[mode].cf, n = cf0.length, voices = [];
  if (nv === 2) {
    const pos = cfPos === 1 ? 'above' : 'below';
    const [lo, hi] = twoPartRange(cf0, pos);
    for (let vi = 0; vi < 2; vi++) {
      if (vi === cfPos) voices.push({ role: 'cf', species: 0, notes: cfLine(cf0), lo: cf0[0], hi: cf0[0] });
      else voices.push({ role: 'cpt', species: sp, notes: makeLine(sp, n, opt), lo, hi });
    }
    return voices;
  }
  const R = RANGES[nv];
  for (let vi = 0; vi < nv; vi++) {
    if (vi === cfPos) { const c = placeCf(cf0, R[vi][0], R[vi][1]); voices.push({ role: 'cf', species: 0, notes: cfLine(c), lo: R[vi][0], hi: R[vi][1] }); }
    else { const s = vi === fl ? sp : 1; voices.push({ role: 'cpt', species: s, notes: makeLine(s, n, opt), lo: R[vi][0], hi: R[vi][1] }); }
  }
  return voices;
}
/* multi-voice: first a note-against-note skeleton, then the florid voice over fixed voices */
function solveSmart(voices, mode, opts) {
  opts = opts || {};
  const florid = voices.map((v, i) => v.role !== 'cf' && v.species > 1 ? i : -1).filter(i => i >= 0);
  const anyFixed = voices.some(v => v.role !== 'cf' && v.notes.some(n => n.p));
  if (voices.length <= 2 || !florid.length || anyFixed) return solve(voices, mode, opts);
  const T0 = Date.now(), budget = opts.maxMs || 8000; let seed = opts.seed || 1;
  const n = voices.find(v => v.role === 'cf').notes.length;
  while (Date.now() - T0 < budget) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const skel = voices.map(v => v.role === 'cf' ? v : Object.assign({}, v, { species: 1, notes: makeLine(1, n) }));
    const s1 = solve(skel, mode, Object.assign({}, opts, { seed, maxMs: Math.min(1500, budget - (Date.now() - T0)), maxNodes: 20000 }));
    if (!s1) continue;
    const v2 = voices.map((v, i) => florid.includes(i) ? Object.assign({}, v, { notes: v.notes.map(x => Object.assign({}, x, { p: null })) }) : Object.assign({}, v, { notes: s1[i].notes }));
    const s2 = solve(v2, mode, Object.assign({}, opts, { seed: seed + 7, maxMs: Math.min(2000, budget - (Date.now() - T0)), maxNodes: 40000 }));
    if (s2) return s2;
  }
  return null;
}
const API = { solveSmart, RANGES, placeCf, twoPartRange, buildExercise, parse, fromStep, midiOf, ivl, isDiss, melOK, MODES, FLORID, barTemplate, makeLine, cfLine, transpose, mergeVoice, analyze, solve, leadingFor };
export { solveSmart, RANGES, placeCf, twoPartRange, buildExercise, parse, fromStep, midiOf, ivl, isDiss, melOK, MODES, FLORID, barTemplate, makeLine, cfLine, transpose, mergeVoice, analyze, solve, leadingFor };
export default API;
