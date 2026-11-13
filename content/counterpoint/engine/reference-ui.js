/* Gradus study guide – UI: audio, score renderer, widgets */
(function () {
'use strict';
const FE = window.FuxEngine, G = window.GLYPHS;
const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function S(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function H(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === 'on') { for (const ev in attrs.on) e.addEventListener(ev, attrs.on[ev]); } else if (k === 'html') e.innerHTML = attrs[k]; else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  return e;
}
const clone = o => JSON.parse(JSON.stringify(o));
let uid = 0; const nid = p => (p || 'id') + (++uid);

/* ================= AUDIO: synthesized harpsichord ================= */
const AudioEng = {
  ctx: null, out: null, cache: new Map(), reg: 'full', halfBpm: 84,
  get whole() { return 120 / this.halfBpm; },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C();
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(ctx.destination);
    this.out = ctx.createGain(); this.out.gain.value = 0.55; this.out.connect(comp);
    // small room reverb
    const len = Math.floor(ctx.sampleRate * 1.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1); }
    const conv = ctx.createConvolver(); conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.16;
    this.out.connect(conv); conv.connect(wet); wet.connect(comp);
  },
  // Karplus–Strong plucked string, several "choirs" (8' + 8' + 4')
  buffer(midi) {
    const key = midi + ':' + this.reg; if (this.cache.has(key)) return this.cache.get(key);
    const ctx = this.ctx, sr = ctx.sampleRate, f0 = 440 * Math.pow(2, (midi - 69) / 12);
    const T60 = Math.max(1.1, Math.min(7, 7 * Math.pow(0.5, (midi - 40) / 15)));
    const len = Math.floor(sr * Math.min(T60 * 0.8, 4.2));
    const buf = ctx.createBuffer(1, len, sr), out = buf.getChannelData(0);
    const choirs = this.reg === 'lute' ? [[1, 1, 0.08, 0.5]] : this.reg === 'single' ? [[1, 1, 0.13, 0.42]] : this.reg === 'double' ? [[1, 1, 0.13, 0.42], [1.0018, 0.8, 0.17, 0.42]] : [[1, 1, 0.13, 0.42], [1.0018, 0.75, 0.17, 0.42], [2.0016, 0.42, 0.21, 0.4]];
    for (const [mul, amp, pos, S] of choirs) {
      const f = f0 * mul, L = sr / f - S; let Li = Math.floor(L), a = L - Li; if (a < 0.15) { a += 1; Li -= 1; }
      const Cc = (1 - a) / (1 + a);
      const ring = new Float32Array(Li);
      for (let i = 0; i < Li; i++) ring[i] = Math.random() * 2 - 1;
      const P = Math.max(1, Math.floor(Li * pos)); const ex = ring.slice();
      let mean = 0; for (let i = 0; i < Li; i++) { ring[i] = ex[i] - 0.92 * ex[(i + P) % Li]; mean += ring[i]; } mean /= Li; for (let i = 0; i < Li; i++) ring[i] -= mean;
      const R = Math.pow(0.001, 1 / (f * T60 * (mul > 1.5 ? 0.6 : 1)));
      let idx = 0, last = 0, apx = 0, apy = 0;
      for (let n = 0; n < len; n++) {
        const x = ring[idx];
        const avg = (1 - S) * x + S * last; last = x;
        const ap = Cc * avg + apx - Cc * apy; apx = avg; apy = ap;
        ring[idx] = ap * R; idx = idx + 1 === Li ? 0 : idx + 1;
        out[n] += x * amp;
      }
    }
    // quill click
    const cl = Math.floor(sr * 0.012); let lp = 0;
    for (let n = 0; n < cl; n++) { const w = Math.random() * 2 - 1; lp = lp * 0.3 + w * 0.7; out[n] += (w - lp) * 0.35 * (1 - n / cl); }
    let pk = 0; for (let n = 0; n < len; n++) pk = Math.max(pk, Math.abs(out[n]));
    const g = 0.5 / (pk || 1); for (let n = 0; n < len; n++) out[n] *= g;
    // fade tail
    const fl = Math.floor(sr * 0.05); for (let n = 0; n < fl; n++) out[len - 1 - n] *= n / fl;
    this.cache.set(key, buf); return buf;
  },
  note(midi, when, dur, gain, pan) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.buffer(midi);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain == null ? 0.8 : gain, when);
    const end = Math.min(when + dur, when + src.buffer.duration - 0.02);
    g.gain.setTargetAtTime(0, end - 0.01, 0.035); // damper falls on release
    let node = g;
    if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    src.connect(g); node.connect(this.out);
    src.start(when); src.stop(end + 0.3);
    return src;
  },
  pluckNow(p, dur) { this.init(); this.note(FE.midiOf(p), this.ctx.currentTime + 0.01, dur || 0.9, 0.8); }
};

/* A single global player so only one thing sounds at a time */
const Player = {
  srcs: [], raf: 0, owner: null, t0: 0, total: 0, onTick: null, onEnd: null,
  stop() {
    this.srcs.forEach(s => { try { s.stop(); } catch (e) { } }); this.srcs = [];
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.onTick) this.onTick(-1);
    const o = this.owner; this.owner = null; if (this.onEnd) { const f = this.onEnd; this.onEnd = null; f(); }
    if (o && o.onStop) o.onStop();
  },
  /* voices: [{notes:[{p,d,tie,rest}], mute}] ; events in whole-note units */
  play(owner, voices, opt) {
    this.stop(); AudioEng.init();
    opt = opt || {};
    const ctx = AudioEng.ctx, W = (opt.whole || AudioEng.whole), start = ctx.currentTime + 0.12;
    const nv = voices.length; let total = 0;
    // pre-generate buffers
    voices.forEach(v => v.notes.forEach(n => { if (n.p) AudioEng.buffer(FE.midiOf(n.p)); }));
    voices.forEach((v, vi) => {
      if (v.mute) return;
      const ms = FE.mergeVoice(v.notes);
      const pan = nv > 1 ? (vi / (nv - 1) - 0.5) * -0.5 : 0;
      ms.forEach(m => { total = Math.max(total, m.end); if (m.rest || !m.p) return; this.srcs.push(AudioEng.note(m.midi, start + m.on * W, m.dur * W * 0.97, (v.gain || 0.75) * (nv > 2 ? 0.8 : 1), pan)); });
    });
    this.owner = owner; this.t0 = start; this.total = total; this.onTick = opt.onTick || null; this.onEnd = opt.onEnd || null;
    const tick = () => {
      const pos = (ctx.currentTime - start) / W;
      if (pos > total + 0.15) { this.stop(); return; }
      if (this.onTick) this.onTick(pos);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
};

/* ================= SCORE RENDERER ================= */
const SP = 8; // staff space px
const CLEF = { treble: { top: 38 }, treble8: { top: 31 }, bass: { top: 26 } };
function glyph(parent, name, x, y, h, anchor, cls) {
  // fit glyph height h (px) ; anchor: 'top' -> y is top of bbox ; 'center' -> y is vertical center; 'bottom'
  const g = G[name], [x0, y0, x1, y1] = g.bbox, s = h / (y1 - y0);
  let ty;
  if (anchor === 'top') ty = y + s * y1; else if (anchor === 'bottom') ty = y + s * y0; else if (anchor === 'gline') ty = y; else ty = y + s * (y1 + y0) / 2;
  return S('path', { d: g.d, transform: `translate(${x - s * x0},${ty}) scale(${s},${-s})`, class: cls || 'glyph' }, parent);
}
function pickClef(notes, lo, hi) {
  const ms = notes.filter(n => n.p).map(n => FE.midiOf(n.p));
  let avg = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : (FE.midiOf(lo || 'C4') + FE.midiOf(hi || 'C5')) / 2;
  if (!ms.length && lo && hi) avg = (FE.midiOf(lo) + FE.midiOf(hi)) / 2;
  return avg >= 60 ? 'treble' : avg >= 52 ? 'treble8' : 'bass';
}
const ACC = { '#': 'sharp', 'b': 'flat', 'n': 'natural' };

class Score {
  /* opts: voices [{name, role, notes, lo, hi, clef}], editable: [vi], figures: 'pair'|'bass'|null,
     onEdit(vi,k,p), compact, labels: true, maxWidth */
  constructor(host, opts) {
    this.host = host; this.o = opts; this.sel = null; this.issues = [];
    this.wrap = H('div', { class: 'score', tabindex: opts.editable && opts.editable.length ? '0' : null, role: 'img', 'aria-label': opts.aria || 'Music notation' });
    host.appendChild(this.wrap);
    this.noteEls = [];
    if (opts.editable && opts.editable.length) this.wrap.addEventListener('keydown', e => this.key(e));
    this.ro = new ResizeObserver(() => { const w = this.wrap.clientWidth; if (Math.abs(w - (this._w || 0)) > 4) this.render(); });
    this.ro.observe(this.wrap);
  }
  set(voices) { this.o.voices = voices; this.render(); }
  key(e) {
    if (!this.sel) return; const { vi, k } = this.sel; const v = this.o.voices[vi], n = v.notes[k];
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const cur = n.p ? FE.parse(n.p) : FE.parse(v.lo || 'C4');
      const st = cur.step + (e.key === 'ArrowUp' ? 1 : -1);
      const p = FE.fromStep(st, 0); this.o.onEdit && this.o.onEdit(vi, k, p); AudioEng.pluckNow(p, 0.5);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); let kk = k;
      do { kk += e.key === 'ArrowRight' ? 1 : -1; } while (v.notes[kk] && v.notes[kk].rest);
      if (v.notes[kk]) { this.sel = { vi, k: kk }; this.render(); this.o.onSelect && this.o.onSelect(this.sel); }
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.o.onEdit && this.o.onEdit(vi, k, null); }
    else if (e.key === '#' || e.key === 's') { if (n.p) { const x = FE.parse(n.p); this.o.onEdit(vi, k, FE.fromStep(x.step, x.acc === 1 ? 0 : 1)); } }
    else if (e.key === 'b' || e.key === 'f') { if (n.p) { const x = FE.parse(n.p); this.o.onEdit(vi, k, FE.fromStep(x.step, x.acc === -1 ? 0 : -1)); } }
  }
  render() {
    const o = this.o, voices = o.voices || [], nv = voices.length;
    if (!nv) { this.wrap.innerHTML = ''; this.noteEls = []; return; }
    const W = Math.max(300, Math.min(o.maxWidth || 4000, this.wrap.clientWidth || 640)); this._w = this.wrap.clientWidth;
    this.wrap.innerHTML = ''; this.noteEls = [];
    const merged = voices.map(v => FE.mergeVoice(v.notes));
    const total = Math.max(...merged.map(m => m.length ? m[m.length - 1].end : 0));
    const nBars = Math.max(1, Math.round(total));
    const clefs = voices.map(v => v.clef || pickClef(v.notes, v.lo, v.hi));
    // raw onsets
    const raw = voices.map(v => { let on = 0; return v.notes.map(n => { const r = { n, on }; on += n.d; return r; }); });
    const editable = new Set(o.editable || []);
    // bar widths
    const bw = [];
    for (let b = 0; b < nBars; b++) {
      let units = 1; let hasEighth = false;
      raw.forEach(rv => { const c = rv.filter(r => r.on >= b - 1e-6 && r.on < b + 1 - 1e-6); units = Math.max(units, c.length); if (c.some(r => r.n.d <= .125)) hasEighth = true; });
      let w = 28 + 25 * units; if (hasEighth) w = Math.max(w, 30 + 26 * 8 * 0.75);
      if (editable.size) w = Math.max(w, 64);
      w = Math.max(w, o.compact ? 46 : 56);
      bw.push(w);
    }
    // vertical extents per voice (in half-spaces relative to top line)
    const ext = voices.map((v, vi) => {
      let up = 0, dn = 0; const top = CLEF[clefs[vi]].top;
      v.notes.forEach(n => { if (!n.p) return; const st = FE.parse(n.p).step; const off = (top - st) * SP / 2; up = Math.max(up, -off); dn = Math.max(dn, off - 4 * SP); });
      if (editable.has(vi)) { up = Math.max(up, 3 * SP); dn = Math.max(dn, 3 * SP); }
      return { up: up + (up > 0 ? SP * 1.2 : 0), dn: dn + (dn > 0 ? SP * 1.2 : 0) };
    });
    const figPair = o.figures === 'pair' && nv === 2, figBass = o.figures === 'bass' && nv > 2;
    const gaps = []; for (let i = 0; i < nv - 1; i++) gaps.push(Math.max(o.compact ? 30 : 38, ext[i].dn + ext[i + 1].up + 14) + (figPair ? 16 : 0));
    const topPad = Math.max(18, ext[0].up + 14), botPad = Math.max(14, ext[nv - 1].dn + 10) + (figBass ? 44 : 0);
    const staffY = [topPad]; for (let i = 1; i < nv; i++) staffY.push(staffY[i - 1] + 4 * SP + gaps[i - 1]);
    const height = staffY[nv - 1] + 4 * SP + botPad;
    // systems
    const clefW = 38, labelW = o.labels === false ? 0 : 0;
    const systems = []; let cur = [], used = clefW + labelW + 8;
    for (let b = 0; b < nBars; b++) { if (cur.length && used + bw[b] > W - 4) { systems.push(cur); cur = []; used = clefW + labelW + 8; } cur.push(b); used += bw[b]; }
    if (cur.length) systems.push(cur);
    const issueAt = new Map(); // "vi:k" -> [issue indices]
    (this.issues || []).forEach((is, ii) => {
      const ms = merged[is.v]; if (!ms) return;
      const m = ms.find(m => m.on <= is.t + 1e-6 && is.t < m.end - 1e-6) || ms[0];
      if (!m) return; const k = m.raw[0]; const key = is.v + ':' + k;
      if (!issueAt.has(key)) issueAt.set(key, []); issueAt.get(key).push(ii);
    });
    const headPos = new Map();
    systems.forEach((bars, si) => {
      const sysW = Math.min(W, clefW + labelW + 8 + bars.reduce((s, b) => s + bw[b], 0) + 2);
      const svg = S('svg', { width: sysW, height, viewBox: `0 0 ${sysW} ${height}`, class: 'sys' });
      this.wrap.appendChild(svg);
      const bx = {}; let x = clefW + labelW + 8; bars.forEach(b => { bx[b] = x; x += bw[b]; });
      const xEnd = x;
      const tx = (on) => { const b = Math.min(nBars - 1, Math.floor(on + 1e-6)); const fr = on - b; return bx[b] + 16 + fr * (bw[b] - 28); };
      // staves
      voices.forEach((v, vi) => {
        const y0 = staffY[vi];
        const gStaff = S('g', { class: 'staff' + (editable.has(vi) ? ' editable' : '') + (v.role === 'cf' ? ' cf' : '') }, svg);
        for (let l = 0; l < 5; l++) S('line', { x1: 4, x2: xEnd, y1: y0 + l * SP, y2: y0 + l * SP, class: 'sl' }, gStaff);
        // clef
        const c = clefs[vi];
        if (c === 'bass') glyph(gStaff, 'fclef', 8, y0 - 0.15, 3.35 * SP, 'top');
        else { glyph(gStaff, 'gclef', 7, y0 + 3 * SP, 7.1 * SP, 'gline'); if (c === 'treble8') S('text', { x: 15, y: y0 + 4 * SP + 21, class: 'clef8' }, gStaff).textContent = '8'; }
        // barlines
        bars.forEach(b => { if (b > bars[0]) S('line', { x1: bx[b], x2: bx[b], y1: y0, y2: y0 + 4 * SP, class: 'bl' }, gStaff); });
        const last = bars[bars.length - 1] === nBars - 1;
        if (last) { S('line', { x1: xEnd - 5, x2: xEnd - 5, y1: y0, y2: y0 + 4 * SP, class: 'bl' }, gStaff); S('rect', { x: xEnd - 3, y: y0, width: 3, height: 4 * SP, class: 'blk' }, gStaff); }
        else S('line', { x1: xEnd - .5, x2: xEnd - .5, y1: y0, y2: y0 + 4 * SP, class: 'bl' }, gStaff);
        if (o.names !== false && v.name && si === 0 && !o.compact) { }
      });
      // system bracket
      if (nv > 1) S('line', { x1: 4, x2: 4, y1: staffY[0], y2: staffY[nv - 1] + 4 * SP, class: 'bracket' }, svg);
      // measure numbers
      if (!o.compact) bars.forEach(b => { const t = S('text', { x: bx[b] + 4, y: staffY[0] - Math.max(8, ext[0].up + 2), class: 'mnum' }, svg); t.textContent = b + 1; });
      // notes
      voices.forEach((v, vi) => {
        const y0 = staffY[vi], top = CLEF[clefs[vi]].top, mid = top - 4;
        const gN = S('g', { class: 'notes' }, svg);
        raw[vi].forEach((r, k) => {
          const b = Math.floor(r.on + 1e-6); if (!bars.includes(b)) return;
          const n = r.n, x = tx(r.on);
          if (n.rest) {
            const g = S('g', { class: 'rest' }, gN);
            if (n.d >= .5 - 1e-6 && n.d < 1) S('rect', { x: x - 5, y: y0 + 2 * SP - 4, width: 10, height: 4, class: 'ink' }, g);
            else if (n.d >= 1) S('rect', { x: x - 5, y: y0 + SP, width: 10, height: 4, class: 'ink' }, g);
            else glyph(g, 'qrest', x - 4, y0 + 2 * SP, 3 * SP, 'center', 'ink');
            return;
          }
          const sel = this.sel && this.sel.vi === vi && this.sel.k === k;
          const g = S('g', { class: 'note' + (sel ? ' sel' : '') + (v.role === 'cf' ? ' cfn' : '') }, gN);
          const mi = merged[vi].find(m => m.raw.includes(k));
          if (mi) { g.dataset.on = mi.on; g.dataset.end = mi.end; }
          this.noteEls.push(g);
          const iss = issueAt.get(vi + ':' + k);
          if (!n.p) { // empty slot placeholder
            S('circle', { cx: x, cy: y0 + 2 * SP, r: 4, class: 'empty' }, g); return;
          }
          const P = FE.parse(n.p), st = P.step, y = y0 + (top - st) * SP / 2;
          if (iss) {
            const lvl = iss.some(i => this.issues[i].level === 'error') ? 'err' : 'warn';
            g.classList.add(lvl);
            S('circle', { cx: x, cy: y, r: 9, class: 'halo ' + lvl }, g);
            const badge = S('g', { class: 'badge ' + lvl }, g);
            const by = Math.min(y0 - 10, y - 14);
            S('circle', { cx: x + 9, cy: by, r: 6.5 }, badge);
            S('text', { x: x + 9, y: by + 3.2 }, badge).textContent = iss.map(i => i + 1).slice(0, 1).join('');
          }
          // ledger lines
          for (let ls = top - 4 * 2 - 2; ls >= st - (st % 2 === (top % 2) ? 0 : 1) && ls >= st - 1; ls -= 2) { }
          const bottom = top - 8;
          if (st <= bottom - 2) for (let ls = bottom - 2; ls >= st; ls -= 2) { const ly = y0 + (top - ls) * SP / 2; S('line', { x1: x - 8, x2: x + 8, y1: ly, y2: ly, class: 'ledger' }, g); }
          if (st >= top + 2) for (let ls = top + 2; ls <= st; ls += 2) { const ly = y0 + (top - ls) * SP / 2; S('line', { x1: x - 8, x2: x + 8, y1: ly, y2: ly, class: 'ledger' }, g); }
          // accidental
          if (P.acc) { const nm = P.acc === 1 ? 'sharp' : 'flat'; if (nm === 'sharp') glyph(g, 'sharp', x - 17, y, 2.6 * SP, 'center', 'ink'); else glyph(g, 'flat', x - 15, y + 0.62 * SP, 2.3 * SP, 'bottom', 'ink'); }
          // head
          const d = n.d, md = mi ? mi.dur : d;
          const whole = d >= 1 - 1e-6, filled = d <= .25 + 1e-6;
          if (whole) {
            S('ellipse', { cx: x, cy: y, rx: 6.3, ry: 4.1, class: 'ink' }, g);
            S('ellipse', { cx: x, cy: y, rx: 2.6, ry: 3.4, transform: `rotate(-50 ${x} ${y})`, class: 'paper' }, g);
          } else {
            S('ellipse', { cx: x, cy: y, rx: 5.1, ry: 3.7, transform: `rotate(-22 ${x} ${y})`, class: 'ink' }, g);
            if (!filled) S('ellipse', { cx: x, cy: y, rx: 3.6, ry: 1.7, transform: `rotate(-22 ${x} ${y})`, class: 'paper' }, g);
            const up = st < mid + (vi === 0 && nv > 1 ? 0 : 0) || (st === mid && false);
            const sx = up ? x + 4.6 : x - 4.6, sy2 = up ? y - 3.4 * SP : y + 3.4 * SP;
            S('line', { x1: sx, x2: sx, y1: y + (up ? -1 : 1), y2: sy2, class: 'stem' }, g);
            if (d <= .125 + 1e-6) S('path', { d: up ? `M${sx},${sy2} c1,6 9,7 8,15 c2,-8 -5,-10 -8,-12z` : `M${sx},${sy2} c1,-6 9,-7 8,-15 c2,8 -5,10 -8,12z`, class: 'ink' }, g);
          }
          headPos.set(vi + ':' + k, { x, y, si, svg, up: st < mid });
          // hit target for play-on-click (non-editable)
          if (!editable.has(vi)) { g.addEventListener('click', () => AudioEng.pluckNow(n.p, 0.8)); g.style.cursor = 'pointer'; }
        });
        // ties
        raw[vi].forEach((r, k) => {
          if (!r.n.tie || !r.n.p) return; const nx = raw[vi][k + 1]; if (!nx || nx.n.p !== r.n.p) return;
          const a = headPos.get(vi + ':' + k), bb = headPos.get(vi + ':' + (k + 1));
          if (!a || a.si !== si) return;
          const dir = a.up ? 1 : -1; const x1 = a.x + 5, x2 = bb && bb.si === si ? bb.x - 5 : xEnd - 2, yy = a.y + dir * 5;
          S('path', { d: `M${x1},${yy} Q${(x1 + x2) / 2},${yy + dir * 8} ${x2},${yy} Q${(x1 + x2) / 2},${yy + dir * 6} ${x1},${yy}z`, class: 'tie' }, svg);
        });
        // editable overlay
        if (editable.has(vi)) {
          const gE = S('g', { class: 'edit-layer' }, svg);
          const ghost = S('g', { class: 'ghost', visibility: 'hidden' }, svg);
          const gh = S('ellipse', { rx: 5.2, ry: 3.8, class: 'ghost-head' }, ghost);
          const ghL = S('g', {}, ghost);
          raw[vi].forEach((r, k) => {
            const b = Math.floor(r.on + 1e-6); if (!bars.includes(b) || r.n.rest) return;
            const x = tx(r.on); const span = Math.max(14, r.n.d * (bw[b] - 28));
            const rc = S('rect', { x: x - 11, y: y0 - 3.5 * SP, width: Math.min(span, 40) + 4, height: 11 * SP, class: 'hit' }, gE);
            rc.addEventListener('pointermove', ev => {
              const st = this.stepAt(ev, svg, y0, top, v);
              const y = y0 + (top - st) * SP / 2; ghost.setAttribute('visibility', 'visible'); gh.setAttribute('cx', x); gh.setAttribute('cy', y);
              ghL.innerHTML = ''; const bottom = top - 8;
              if (st <= bottom - 2) for (let ls = bottom - 2; ls >= st; ls -= 2) S('line', { x1: x - 8, x2: x + 8, y1: y0 + (top - ls) * SP / 2, y2: y0 + (top - ls) * SP / 2, class: 'ledger ghost-l' }, ghL);
              if (st >= top + 2) for (let ls = top + 2; ls <= st; ls += 2) S('line', { x1: x - 8, x2: x + 8, y1: y0 + (top - ls) * SP / 2, y2: y0 + (top - ls) * SP / 2, class: 'ledger ghost-l' }, ghL);
            });
            rc.addEventListener('pointerleave', () => ghost.setAttribute('visibility', 'hidden'));
            rc.addEventListener('pointerdown', ev => {
              ev.preventDefault(); this.wrap.focus({ preventScroll: true });
              const st = this.stepAt(ev, svg, y0, top, v);
              const acc = (o.accMode && o.accMode()) || 0;
              const p = FE.fromStep(st, acc);
              this.sel = { vi, k };
              o.onSelect && o.onSelect(this.sel);
              AudioEng.pluckNow(p, 0.6);
              o.onEdit && o.onEdit(vi, k, p);
            });
          });
        }
      });
      // figures
      if (figPair) {
        const yF = staffY[0] + 4 * SP + gaps[0] / 2 + 4;
        const times = new Set(); merged.forEach(ms => ms.forEach(m => { if (!m.rest) times.add(Math.round(m.on * 1000) / 1000); }));
        [...times].sort((a, b) => a - b).forEach(t => {
          const b = Math.floor(t + 1e-6); if (!bars.includes(b)) return;
          const a = merged[0].find(m => m.on <= t + 1e-6 && t < m.end - 1e-6), c = merged[1].find(m => m.on <= t + 1e-6 && t < m.end - 1e-6);
          if (!a || !c || a.rest || c.rest || !a.p || !c.p) return;
          const iv = FE.ivl(a.p, c.p); let num = iv.num; while (num > 13) num -= 7;
          const lo = a.midi <= c.midi ? a : c, hi = lo === a ? c : a;
          const diss = FE.isDiss(lo.p, hi.p, true);
          const tt = S('text', { x: tx(t), y: yF, class: 'fig' + (diss ? ' fd' : iv.perfect ? ' fp' : '') }, svg); tt.textContent = num;
        });
      }
      if (figBass) {
        bars.forEach(b => {
          const ch = merged.map(ms => ms.find(m => m.on <= b + 1e-6 && b < m.end - 1e-6)).filter(m => m && !m.rest && m.p);
          if (ch.length < 2) return; const bass = ch.reduce((a, c) => c.midi < a.midi ? c : a);
          const nums = ch.filter(m => m !== bass).map(m => { const iv = FE.ivl(bass.p, m.p); let n = iv.num; while (n > 8) n -= 7; return n; }).sort((a, c) => c - a);
          nums.forEach((n, i) => { const t = S('text', { x: tx(b), y: staffY[nv - 1] + 4 * SP + Math.max(14, ext[nv - 1].dn + 6) + 12 + i * 12, class: 'fig small' }, svg); t.textContent = n; });
        });
      }
    });
  }
  stepAt(ev, svg, y0, top, v) {
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let st = top - Math.round((p.y - y0) / (SP / 2));
    if (v.lo) st = Math.max(st, FE.parse(v.lo).step - 2); if (v.hi) st = Math.min(st, FE.parse(v.hi).step + 2);
    return st;
  }
  highlight(pos) {
    this.noteEls.forEach(g => { const on = +g.dataset.on, end = +g.dataset.end; g.classList.toggle('playing', pos >= on && pos < end); });
  }
}

/* ============ Small helpers for UI ============ */
function btn(label, onclick, cls, title) { return H('button', { class: 'btn ' + (cls || ''), type: 'button', title: title || null, on: { click: onclick } }, label); }
function playBtn(getVoices, score, extra) {
  const b = btn('▶ Play', () => {
    if (Player.owner === b) { Player.stop(); return; }
    const vs = getVoices();
    Player.play(b, vs, { onTick: pos => score && score.highlight(pos), onEnd: () => { b.textContent = '▶ Play'; b.classList.remove('on'); } });
    b.textContent = '■ Stop'; b.classList.add('on');
  }, 'play');
  b.onStop = () => { b.textContent = '▶ Play'; b.classList.remove('on'); score && score.highlight(-1); };
  return b;
}
function seg(options, value, onchange, label) { // segmented control
  const id = nid('seg');
  const wrap = H('div', { class: 'seg', role: 'radiogroup', 'aria-label': label || '' });
  options.forEach(([v, t]) => {
    const b = H('button', { type: 'button', role: 'radio', 'aria-checked': String(v === value), class: v === value ? 'on' : '' }, t);
    b.addEventListener('click', () => { $$('button', wrap).forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); }); b.classList.add('on'); b.setAttribute('aria-checked', 'true'); onchange(v); });
    wrap.appendChild(b);
  });
  return wrap;
}
function select(options, value, onchange, label) {
  const id = nid('sel');
  const s = H('select', { id, 'aria-label': label || '' }, options.map(([v, t]) => H('option', { value: v, selected: v === value ? 'selected' : null }, t)));
  s.addEventListener('change', () => onchange(s.value));
  return label ? H('label', { class: 'fld', for: id }, H('span', null, label), s) : s;
}
const RULE_NAMES = {
  par5: 'Parallel fifths', par8: 'Parallel octaves / unisons', direct: 'Hidden fifth/octave (direct motion)', dd: 'Fifths/octaves on successive downbeats',
  sync8: 'Octaves between syncopations', 'acc-diss': 'Dissonance on the downbeat', diss: 'Untreated dissonance', susp: 'Badly treated suspension', 'susp-perf': 'Retardation hides octaves',
  susp78: '7 → 8 in the lower voice', mel: 'Unsingable melodic interval', rep: 'Repeated note', leaps: 'Successive skips', comp: 'Uncompensated skip', tritone: 'Outlined tritone',
  range: 'Range too wide', begin: 'Beginning not perfect', 'begin-mode': 'Beginning outside the mode', end: 'Ending not perfect', cad: 'Cadence formula', unison: 'Unison in the middle',
  balance: 'Too many perfect consonances', 'par-imp': 'Too many parallel 3rds/6ths', skip8: 'Skips into an octave', battuta: 'Ottava battuta', 'leave-uni': 'Unison left by skip',
  eighth: 'Eighth-note placement', lag: 'Lagging quarters', triad: 'Incomplete triad', 'bass-mode': 'Bass not on the final', final3: 'Third in final chord', 'unison-m': 'Unison (multi-voice)'
};
function issueList(host, res, onPick) {
  host.innerHTML = '';
  if (!res) return;
  const e = res.errors.length, w = res.warns.length;
  const head = H('div', { class: 'verdict ' + (e ? 'bad' : w ? 'meh' : 'good') },
    e ? `${e} rule${e > 1 ? 's' : ''} broken` : 'No rule broken', w ? ` · ${w} guideline note${w > 1 ? 's' : ''}` : (e ? '' : ' · nothing to note'));
  host.appendChild(head);
  if (!res.issues.length) return;
  const ol = H('ol', { class: 'issues' });
  res.issues.forEach((is, i) => {
    const li = H('li', { class: is.level }, H('span', { class: 'tag' }, is.level === 'error' ? 'Rule' : 'Guideline'), H('b', null, ` Bar ${Math.floor(is.t + 1e-6) + 1}: `), RULE_NAMES[is.rule] ? H('span', { class: 'rn' }, RULE_NAMES[is.rule] + '. ') : '', is.msg);
    li.addEventListener('click', () => onPick && onPick(is, i));
    ol.appendChild(li);
  });
  host.appendChild(ol);
}

/* ================= Figure card (book example) ================= */
function figure(host, cfg) {
  // cfg: {title, fig, caption, voices, figures, check, toggle:{label, alt:voices}, note}
  const card = H('figure', { class: 'ex' });
  const head = H('figcaption', null, H('span', { class: 'fignum' }, cfg.fig || ''), H('span', { class: 'figtitle' }, cfg.title || ''));
  card.appendChild(head);
  const sc = H('div'); card.appendChild(sc);
  let voices = cfg.voices, showingAlt = false;
  const score = new Score(sc, { voices: clone(voices), figures: cfg.figures === undefined ? (voices.length === 2 ? 'pair' : null) : cfg.figures, compact: cfg.compact });
  const bar = H('div', { class: 'ex-bar' });
  bar.appendChild(playBtn(() => clone(showingAlt ? cfg.toggle.alt : voices), score));
  const res = H('div', { class: 'ex-res' });
  function runCheck() {
    const vs = showingAlt ? cfg.toggle.alt : voices;
    let r = FE.analyze(vs.map(v => ({ role: v.role || 'cpt', species: v.species || 1, notes: v.notes })));
    if (cfg.only) { const on = new Set(cfg.only); const is = r.issues.filter(i => on.has(i.rule)); r = { issues: is, errors: is.filter(i => i.level === 'error'), warns: is.filter(i => i.level === 'warn') }; }
    score.issues = r.issues; score.render(); issueList(res, r, () => { });
  }
  if (cfg.toggle) {
    const tb = btn(cfg.toggle.label, () => {
      showingAlt = !showingAlt; tb.classList.toggle('on', showingAlt); tb.setAttribute('aria-pressed', String(showingAlt));
      score.issues = []; score.o.voices = clone(showingAlt ? cfg.toggle.alt : voices); score.render(); res.innerHTML = '';
      if (cfg.toggle.autoCheck) runCheck();
      if (cfg.toggle.onToggle) cfg.toggle.onToggle(showingAlt, card);
    }, 'toggle'); tb.setAttribute('aria-pressed', 'false');
    bar.appendChild(tb);
  }
  if (cfg.check !== false) bar.appendChild(btn('Check against the rules', runCheck, 'ghost'));
  card.appendChild(bar);
  if (cfg.caption) card.appendChild(H('p', { class: 'cap', html: cfg.caption }));
  card.appendChild(res);
  host.appendChild(card);
  if (cfg.autoCheck) runCheck();
  return { card, score };
}

/* ================= Solver in a Web Worker ================= */
let worker = null, wq = new Map(), wid = 0;
function solveAsync(voices, mode, opts) {
  try {
    if (!worker) {
      const src = document.getElementById('engine-src').textContent + '\n;self.onmessage=function(e){var d=e.data;var r=null;try{r=FuxEngine.solveSmart(d.voices,d.mode,d.opts);}catch(err){r=null;}self.postMessage({id:d.id,res:r});};';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = e => { const f = wq.get(e.data.id); if (f) { wq.delete(e.data.id); f(e.data.res); } };
    }
    const id = ++wid;
    return new Promise(res => { wq.set(id, res); worker.postMessage({ id, voices, mode, opts }); });
  } catch (e) {
    return new Promise(res => setTimeout(() => res(FE.solveSmart(voices, mode, opts)), 20));
  }
}

/* ================= Workbench ================= */
class Workbench {
  constructor(host, cfg) {
    this.cfg = cfg; this.host = host;
    this.mode = cfg.mode || 'D'; this.nv = cfg.nv || 2; this.sp = cfg.species || 1;
    this.cfPos = cfg.cfPos != null ? cfg.cfPos : (this.nv === 2 ? 1 : 0);
    this.fl = cfg.florid != null ? cfg.florid : (this.cfPos === 0 ? 1 : 0);
    this.acc = 0; this.patterns = null;
    const box = H('div', { class: 'wb' }); host.appendChild(box);
    const top = H('div', { class: 'wb-top' });
    top.appendChild(H('div', { class: 'wb-title' }, H('span', { class: 'eyebrow' }, 'Exercise workbench'), H('strong', null, cfg.title || '')));
    box.appendChild(top);
    const ctr = H('div', { class: 'wb-ctr' });
    ctr.appendChild(select(Object.keys(FE.MODES).map(k => [k, FE.MODES[k].name]), this.mode, v => { this.mode = v; this.reset(); }, 'Cantus firmus'));
    const posOpts = this.nv === 2 ? [['1', 'C.f. below (cpt above)'], ['0', 'C.f. above (cpt below)']] : this.nv === 3 ? [['0', 'C.f. on top'], ['1', 'C.f. in the middle'], ['2', 'C.f. in the bass']] : [['0', 'C.f. soprano'], ['1', 'C.f. alto'], ['2', 'C.f. tenor'], ['3', 'C.f. bass']];
    ctr.appendChild(select(posOpts, String(this.cfPos), v => { this.cfPos = +v; if (this.fl === this.cfPos) this.fl = this.cfPos === 0 ? 1 : 0; this.syncFl(); this.reset(); }, 'Position'));
    if (cfg.speciesSelect) ctr.appendChild(select([[1, '1st: note against note'], [2, '2nd: half notes'], [3, '3rd: quarters'], [4, '4th: ligatures'], [5, '5th: florid']].map(([a, b]) => [String(a), b]), String(this.sp), v => { this.sp = +v; this.reset(); }, 'Species'));
    if (this.nv > 2 && this.sp > 1) { this.flWrap = H('span'); ctr.appendChild(this.flWrap); this.syncFl(); }
    box.appendChild(ctr);
    const tools = H('div', { class: 'wb-tools' });
    this.playB = playBtn(() => this.voices, null);
    tools.appendChild(this.playB);
    tools.appendChild(btn('Complete it for me', () => this.solve(true), 'ghost', 'Fill the empty notes, keeping yours'));
    tools.appendChild(btn('Show a model solution', () => this.solve(false), 'ghost', 'Clear and generate a new correct counterpoint'));
    tools.appendChild(btn('Clear', () => this.reset(), 'ghost'));
    const accSeg = seg([[0, '♮'], [1, '♯'], [-1, '♭']], 0, v => { this.acc = v; }, 'Accidental for new notes');
    tools.appendChild(H('span', { class: 'acc-wrap' }, H('span', { class: 'mini' }, 'New notes:'), accSeg));
    box.appendChild(tools);
    this.rhythmBar = H('div', { class: 'wb-rhythm', hidden: 'hidden' }); box.appendChild(this.rhythmBar);
    this.scoreHost = H('div', { class: 'wb-score' }); box.appendChild(this.scoreHost);
    box.appendChild(H('p', { class: 'hint' }, 'Click or tap on the highlighted staff to place a note. Arrow keys move the selected note; # and b add accidentals; Delete clears it. The checker runs as you write.'));
    this.status = H('div', { class: 'wb-status' }); box.appendChild(this.status);
    this.score = new Score(this.scoreHost, { voices: [], editable: [], figures: this.nv === 2 ? 'pair' : 'bass', onEdit: (vi, k, p) => this.edit(vi, k, p), accMode: () => this.acc, onSelect: s => this.onSel(s), aria: 'Exercise score' });
    this.playB.onStop = () => { this.playB.textContent = '▶ Play'; this.playB.classList.remove('on'); this.score.highlight(-1); };
    const pb = this.playB; const self = this;
    pb.replaceWith(this.playB = btn('▶ Play', () => {
      if (Player.owner === self.playB) { Player.stop(); return; }
      Player.play(self.playB, self.voices, { onTick: p => self.score.highlight(p) }); self.playB.textContent = '■ Stop'; self.playB.classList.add('on');
    }, 'play'));
    this.playB.onStop = () => { this.playB.textContent = '▶ Play'; this.playB.classList.remove('on'); this.score.highlight(-1); };
    this.reset(false);
    if (cfg.demo) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); if (!this.touched) this.solve(false, true); } }, { rootMargin: '300px' }); io.observe(box); }
  }
  syncFl() {
    if (!this.flWrap) return; this.flWrap.innerHTML = '';
    const names = this.nv === 3 ? ['Top', 'Middle', 'Bass'] : ['Soprano', 'Alto', 'Tenor', 'Bass'];
    const opts = names.map((n, i) => [String(i), n]).filter(([i]) => +i !== this.cfPos);
    if (this.fl === this.cfPos) this.fl = +opts[0][0];
    this.flWrap.appendChild(select(opts, String(this.fl), v => { this.fl = +v; this.reset(); }, 'Florid voice'));
  }
  build() {
    const n = FE.MODES[this.mode].cf.length;
    if (this.sp === 5 && (!this.patterns || this.patterns.length !== n)) {
      const pool = ['hht', 'qqqq', 'hqq', 'hht', 'qqht', 'hh', 'hqqt', 'qeeh', 'hht'];
      this.patterns = []; for (let i = 0; i < n; i++) this.patterns.push(pool[(i * 4 + 1) % pool.length]);
    }
    const vs = FE.buildExercise(this.mode, this.nv, this.cfPos, this.sp, this.fl, { patterns: this.patterns, rest: this.sp === 2 });
    const names = this.nv === 2 ? (this.cfPos === 1 ? ['Counterpoint', 'Cantus firmus'] : ['Cantus firmus', 'Counterpoint']) : null;
    vs.forEach((v, i) => { v.name = names ? names[i] : (v.role === 'cf' ? 'Cantus firmus' : 'Voice ' + (i + 1)); });
    return vs;
  }
  reset(prefillDemo) {
    Player.stop();
    this.voices = this.build();
    this.score.o.voices = this.voices;
    this.score.o.editable = this.voices.map((v, i) => v.role === 'cf' ? -1 : i).filter(i => i >= 0);
    this.score.sel = null; this.score.issues = [];
    if (prefillDemo && this.cfg.demo) { this.solve(false, true); return; }
    this.update();
    this.onSel(null);
  }
  edit(vi, k, p) {
    this.touched = true;
    const v = this.voices[vi], old = v.notes[k].p; v.notes[k].p = p;
    const nx = v.notes[k + 1];
    if (v.notes[k].tie && nx && (nx.p == null || nx.p === old)) nx.p = p; // ligature: the tied note follows
    this.update();
  }
  onSel(s) {
    const rb = this.rhythmBar; rb.innerHTML = ''; rb.hidden = true;
    const fv = this.voices.findIndex(v => v.species === 5);
    if (fv < 0) return;
    rb.hidden = false;
    const n = FE.MODES[this.mode].cf.length;
    let bar = 1;
    if (s && s.vi === fv) { const on = this.voices[fv].notes.slice(0, s.k).reduce((a, x) => a + x.d, 0); bar = Math.floor(on + 1e-6); }
    if (bar < 1 || bar >= n - 1) bar = Math.min(Math.max(bar, 1), n - 2);
    const labels = { hh: '𝅗𝅥 𝅗𝅥', hht: '𝅗𝅥 𝅗𝅥⁀', qqqq: '♩♩♩♩', hqq: '𝅗𝅥 ♩♩', qqh: '♩♩ 𝅗𝅥', qqht: '♩♩ 𝅗𝅥⁀', hqqt: '𝅗𝅥 ♩♩⁀', qeeh: '♩♪♪ 𝅗𝅥', hqee: '𝅗𝅥 ♩♪♪' };
    rb.appendChild(H('span', { class: 'mini' }, `Rhythm of bar ${bar + 1}:`));
    rb.appendChild(seg(Object.keys(labels).map(k => [k, labels[k]]), this.patterns[bar], v => {
      this.patterns[bar] = v; // rebuild florid voice keeping pitches where possible
      const old = this.voices[fv];
      const fresh = FE.makeLine(5, n, { patterns: this.patterns });
      // copy pitches by onset
      let on = 0; const map = new Map(); old.notes.forEach(x => { if (x.p) map.set(Math.round(on * 1000), x.p); on += x.d; });
      on = 0; fresh.forEach(x => { if (!x.rest && map.has(Math.round(on * 1000))) x.p = map.get(Math.round(on * 1000)); on += x.d; });
      old.notes = fresh; this.update();
    }, 'Bar rhythm'));
    rb.appendChild(H('span', { class: 'mini' }, ' ⁀ = tied into the next bar. Select a note to change its bar.'));
  }
  update() {
    const res = FE.analyze(this.voices.map(v => ({ role: v.role, species: v.species, notes: v.notes })), { partial: this.voices.some(v => v.notes.some(n => !n.rest && !n.p)) });
    const empty = this.voices.some(v => v.notes.some(n => !n.rest && !n.p));
    this.score.issues = res.issues; this.score.render();
    issueList(this.status, res, (is) => { });
    if (empty) { const v = this.status.querySelector('.verdict'); if (v) v.insertAdjacentText('beforeend', ' · unfinished (empty notes are skipped)'); }
  }
  solve(keep, quiet) {
    const st = this.status; if (!quiet) st.innerHTML = '<div class="verdict meh">Searching for a counterpoint that obeys every rule…</div>';
    const base = keep ? clone(this.voices) : this.build();
    solveAsync(base, this.mode, { maxNodes: 60000, maxMs: 7000, noCross: this.nv > 2, seed: (Math.random() * 1e9) | 0 }).then(res => {
      if (!res) { st.innerHTML = '<div class="verdict bad">' + (keep ? 'Your notes cannot be completed without breaking a rule. Fix the marked notes, or ask for a model solution.' : 'No solution found this time. Try again.') + '</div>'; return; }
      res.forEach((v, i) => { v.lo = base[i].lo; v.hi = base[i].hi; v.name = base[i].name; });
      this.voices = res; this.score.o.voices = res; this.score.sel = null; this.update();
    });
  }
}

/* ================= Widget: interval explorer ================= */
function intervalExplorer(host) {
  const box = H('div', { class: 'widget ivx' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Interactive'), H('strong', null, 'Interval explorer'), H('span', { class: 'mini' }, 'Tap two keys. The second key sounds against the first.')));
  const kb = S('svg', { viewBox: '0 0 700 120', class: 'kbd', role: 'group', 'aria-label': 'Keyboard' });
  const keys = []; const white = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  let wi = 0; const blackOf = { C: 'C#', D: 'Eb', F: 'F#', G: 'G#', A: 'Bb' };
  for (let oct = 3; oct <= 4; oct++) for (const L of white) {
    const p = L + oct, x = wi * 50;
    const r = S('rect', { x: x + 1, y: 1, width: 48, height: 116, rx: 3, class: 'wk' }, kb); r.dataset.p = p; keys.push(r);
    const t = S('text', { x: x + 25, y: 108, class: 'kl' }, kb); t.textContent = L === 'C' ? p : L;
    wi++;
  }
  wi = 0;
  for (let oct = 3; oct <= 4; oct++) for (const L of white) {
    if (blackOf[L]) { const p = blackOf[L].replace(/(.)(.)/, '$1$2') + oct; const x = wi * 50 + 35; const r = S('rect', { x, y: 1, width: 30, height: 70, rx: 2, class: 'bk' }, kb); r.dataset.p = p; keys.push(r); }
    wi++;
  }
  const kwrap = H('div', { class: 'kbd-wrap' }); kwrap.appendChild(kb); box.appendChild(kwrap);
  const out = H('div', { class: 'ivx-out' }, H('div', { class: 'ivx-big' }, '—'), H('div', { class: 'ivx-sub' }, 'Choose a lower note, then an upper note.'));
  box.appendChild(out);
  let first = null;
  function name(iv) {
    const g = iv.g, s = iv.s; const base = ['unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][g];
    let q = '';
    if (g === 0) q = s === 0 ? 'perfect' : s > 0 ? 'augmented' : 'diminished';
    else if (g === 3) q = s === 5 ? 'perfect' : s === 6 ? 'augmented' : 'diminished';
    else if (g === 4) q = s === 7 ? 'perfect' : s === 6 ? 'diminished' : 'augmented';
    else { const maj = { 1: 2, 2: 4, 5: 9, 6: 11 }[g]; q = s === maj ? 'major' : s === maj - 1 ? 'minor' : s > maj ? 'augmented' : 'diminished'; }
    const comp = iv.gen >= 7 ? (iv.gen === 7 ? 'octave' : `compound ${base} (${iv.num}th)`) : null;
    return (iv.gen === 7 && s === 0) ? 'octave' : (iv.gen > 7 ? q + ' ' + (comp) : q + ' ' + base);
  }
  keys.forEach(k => k.addEventListener('pointerdown', e => {
    e.preventDefault(); const p = k.dataset.p.replace('Eb', 'Eb').replace('Bb', 'Bb');
    AudioEng.pluckNow(p, 1.2);
    if (!first || first.done) { keys.forEach(x => x.classList.remove('a', 'b')); first = { p, done: false }; k.classList.add('a'); out.children[0].textContent = p.replace('b', '♭').replace('#', '♯') + ' …'; out.children[1].textContent = 'Now choose the second note.'; return; }
    k.classList.add('b'); first.done = true;
    const a = first.p, b = p; const lo = FE.midiOf(a) <= FE.midiOf(b) ? a : b, hi = lo === a ? b : a;
    const iv = FE.ivl(lo, hi);
    AudioEng.init(); const t = AudioEng.ctx.currentTime + 0.05; AudioEng.note(FE.midiOf(lo), t + 0.5, 1.6, 0.7); AudioEng.note(FE.midiOf(hi), t + 0.5, 1.6, 0.7);
    const cat = iv.kind === 'P8' || iv.kind === 'P5' ? ['perfect consonance', 'pc'] : iv.imperfect ? ['imperfect consonance', 'ic'] : iv.kind === 'P4' ? ['dissonance against the bass (a fourth)', 'ds'] : ['dissonance', 'ds'];
    out.children[0].innerHTML = `${name(iv)} <span class="pill ${cat[1]}">${cat[0]}</span>`;
    const extra = iv.kind === 'P4' ? ' Fux calls the fourth a dissonance in two-part writing and against the bass. Between upper voices it behaves like an imperfect consonance (pp. 20, 112, 131).' : iv.g === 3 || iv.g === 4 ? ' The tritone and diminished fifth are “mi contra fa”, the devil in music.' : '';
    out.children[1].textContent = `${lo.replace('b', '♭').replace('#', '♯')} → ${hi.replace('b', '♭').replace('#', '♯')}: ${iv.semis} semitones.` + extra;
  }));
  host.appendChild(box);
}

/* ================= Widget: motion lab (animated) ================= */
function motionLab(host) {
  const box = H('div', { class: 'widget motion' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Animation'), H('strong', null, 'The three motions and the four rules'), H('span', { class: 'mini' }, 'Watch two voices move from one consonance to the next. Fux’s rule decides whether the move is allowed.')));
  const W = 520, Hh = 250;
  const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'mot-svg' });
  const sw = H('div', { class: 'mot-wrap' }); sw.appendChild(svg); box.appendChild(sw);
  // pitch ladder C4..A5
  const lo = FE.parse('C4').step, hi = FE.parse('A5').step;
  const yOf = st => 228 - (st - lo) * (204 / (hi - lo));
  for (let st = lo; st <= hi; st++) {
    const y = yOf(st), nm = FE.fromStep(st, 0);
    S('line', { x1: 52, x2: W - 10, y1: y, y2: y, class: st % 7 === 0 ? 'lad c' : 'lad' }, svg);
    if (st % 2 === 0 || st % 7 === 0) { const t = S('text', { x: 44, y: y + 3.5, class: 'ladl' }, svg); t.textContent = nm; }
  }
  const X0 = 150, X1 = 390;
  [X0, X1].forEach(x => S('line', { x1: x, x2: x, y1: 14, y2: 236, class: 'col' }, svg));
  const pathU = S('line', { class: 'vp u' }, svg), pathL = S('line', { class: 'vp l' }, svg);
  const barA = S('line', { class: 'ivbar' }, svg), barB = S('line', { class: 'ivbar' }, svg);
  const labA = S('text', { class: 'ivlab' }, svg), labB = S('text', { class: 'ivlab' }, svg);
  const dU = S('circle', { r: 9, class: 'dot u' }, svg), dL = S('circle', { r: 9, class: 'dot l' }, svg);
  const ghostU = S('circle', { r: 7, class: 'dot ghost u' }, svg), ghostL = S('circle', { r: 7, class: 'dot ghost l' }, svg);
  const verdict = H('div', { class: 'mot-verdict' }, 'Choose a motion.'); box.appendChild(verdict);
  const ctr = H('div', { class: 'mot-ctr' });
  let quiz = false, cur = null, raf = 0;
  const examples = {
    direct: [['C5', 'E4'], ['D5', 'G4']], contrary: [['C5', 'E4'], ['D5', 'D4']], oblique: [['A4', 'D4'], ['B4', 'D4']]
  };
  function classify(a1, b1, a2, b2) {
    const i1 = FE.ivl(b1, a1), i2 = FE.ivl(b2, a2);
    const dA = FE.midiOf(a2) - FE.midiOf(a1), dB = FE.midiOf(b2) - FE.midiOf(b1);
    const motion = dA === 0 && dB === 0 ? 'none' : dA === 0 || dB === 0 ? 'oblique' : Math.sign(dA) === Math.sign(dB) ? 'direct' : 'contrary';
    const P1 = i1.perfect, P2 = i2.perfect;
    const rule = P1 && P2 ? 1 : P1 && !P2 ? 2 : !P1 && P2 ? 3 : 4;
    const ok = !(P2 && motion === 'direct');
    return { i1, i2, motion, rule, ok };
  }
  const ruleText = { 1: 'Rule 1: perfect → perfect only by contrary or oblique motion.', 2: 'Rule 2: perfect → imperfect by any motion.', 3: 'Rule 3: imperfect → perfect only by contrary or oblique motion.', 4: 'Rule 4: imperfect → imperfect by any motion.' };
  const ivName = iv => { let n = iv.num; return (iv.kind === 'P8' ? (n === 1 ? 'unison' : n === 8 ? 'octave' : n + 'th (octave)') : n === 3 ? '3rd' : n === 5 ? '5th' : n === 6 ? '6th' : n === 10 ? '10th' : n === 12 ? '12th' : n + 'th') + (iv.perfect ? ' ·P' : iv.imperfect ? ' ·I' : ''); };
  function draw(a1, b1, a2, b2, t) {
    const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const yU = yOf(FE.parse(a1).step) + (yOf(FE.parse(a2).step) - yOf(FE.parse(a1).step)) * e;
    const yL = yOf(FE.parse(b1).step) + (yOf(FE.parse(b2).step) - yOf(FE.parse(b1).step)) * e;
    const x = X0 + (X1 - X0) * e;
    dU.setAttribute('cx', x); dU.setAttribute('cy', yU); dL.setAttribute('cx', x); dL.setAttribute('cy', yL);
    pathU.setAttribute('x1', X0); pathU.setAttribute('y1', yOf(FE.parse(a1).step)); pathU.setAttribute('x2', x); pathU.setAttribute('y2', yU);
    pathL.setAttribute('x1', X0); pathL.setAttribute('y1', yOf(FE.parse(b1).step)); pathL.setAttribute('x2', x); pathL.setAttribute('y2', yL);
    ghostU.setAttribute('cx', X0); ghostU.setAttribute('cy', yOf(FE.parse(a1).step)); ghostL.setAttribute('cx', X0); ghostL.setAttribute('cy', yOf(FE.parse(b1).step));
    const c = classify(a1, b1, a2, b2);
    barA.setAttribute('x1', X0); barA.setAttribute('x2', X0); barA.setAttribute('y1', yOf(FE.parse(a1).step)); barA.setAttribute('y2', yOf(FE.parse(b1).step)); barA.setAttribute('class', 'ivbar ' + (c.i1.perfect ? 'p' : 'i'));
    labA.setAttribute('x', X0 - 8); labA.setAttribute('y', (yOf(FE.parse(a1).step) + yOf(FE.parse(b1).step)) / 2 + 4); labA.setAttribute('text-anchor', 'end'); labA.textContent = ivName(c.i1);
    if (t >= 1) { barB.setAttribute('x1', X1); barB.setAttribute('x2', X1); barB.setAttribute('y1', yU); barB.setAttribute('y2', yL); barB.setAttribute('class', 'ivbar ' + (c.i2.perfect ? 'p' : 'i') + (quiz ? '' : c.ok ? ' ok' : ' no')); labB.setAttribute('x', X1 + 10); labB.setAttribute('y', (yU + yL) / 2 + 4); labB.textContent = ivName(c.i2); }
    else { barB.setAttribute('y1', 0); barB.setAttribute('y2', 0); labB.textContent = ''; }
  }
  function run(a1, b1, a2, b2, silent) {
    cancelAnimationFrame(raf); cur = [a1, b1, a2, b2];
    if (silent) { draw(a1, b1, a2, b2, 1); done(); return; }
    AudioEng.init(); const t0 = AudioEng.ctx.currentTime + 0.05, W1 = 0.9;
    AudioEng.note(FE.midiOf(a1), t0, W1, .7, -.2); AudioEng.note(FE.midiOf(b1), t0, W1, .7, .2);
    AudioEng.note(FE.midiOf(a2), t0 + W1, W1 * 1.4, .7, -.2); AudioEng.note(FE.midiOf(b2), t0 + W1, W1 * 1.4, .7, .2);
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = now => { const t = reduce ? 1 : Math.min(1, (now - start - 500) / 700); draw(a1, b1, a2, b2, Math.max(0, t)); if (t < 1) raf = requestAnimationFrame(step); else done(); };
    raf = requestAnimationFrame(step);
    verdict.className = 'mot-verdict'; verdict.textContent = '…';
  }
  function done() {
    const [a1, b1, a2, b2] = cur, c = classify(a1, b1, a2, b2);
    if (quiz) { verdict.className = 'mot-verdict q'; verdict.innerHTML = ''; verdict.append('Is this progression allowed? ', btn('Allowed', () => answer(true), 'ghost'), ' ', btn('Forbidden', () => answer(false), 'ghost')); return; }
    show(c);
  }
  function show(c, prefix) {
    verdict.className = 'mot-verdict ' + (c.ok ? 'ok' : 'no');
    verdict.innerHTML = `${prefix || ''}<b>${c.motion[0].toUpperCase() + c.motion.slice(1)} motion</b> from ${c.i1.perfect ? 'perfect' : 'imperfect'} to ${c.i2.perfect ? 'perfect' : 'imperfect'}. ${ruleText[c.rule]} <b>${c.ok ? 'Allowed.' : 'Forbidden: this produces open or hidden fifths/octaves.'}</b>`;
  }
  let score = 0, tries = 0;
  function answer(yes) {
    const c = classify(...cur); tries++; if (yes === c.ok) score++;
    draw(...cur, 1); barB.setAttribute('class', 'ivbar ' + (c.i2.perfect ? 'p' : 'i') + (c.ok ? ' ok' : ' no'));
    show(c, `<span class="pill ${yes === c.ok ? 'ic' : 'ds'}">${yes === c.ok ? 'Correct' : 'Not quite'}</span> ${score}/${tries} · `);
    verdict.appendChild(H('span', null, ' ')); verdict.appendChild(btn('Next', randomProg, 'ghost'));
  }
  function randomProg() {
    const cons = [2, 4, 5, 7, 9, 11]; // gen intervals: 3,5,6,8,10,12
    for (let tries = 0; tries < 200; tries++) {
      const b1 = lo + Math.floor(Math.random() * 6), g1 = cons[Math.floor(Math.random() * cons.length)];
      const mvL = [-2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 6)], b2 = b1 + mvL;
      const g2 = cons[Math.floor(Math.random() * cons.length)];
      const a1 = b1 + g1, a2 = b2 + g2;
      if (a2 > hi || a1 > hi || b2 < lo) continue;
      const P = [FE.fromStep(a1, 0), FE.fromStep(b1, 0), FE.fromStep(a2, 0), FE.fromStep(b2, 0)];
      const i1 = FE.ivl(P[1], P[0]), i2 = FE.ivl(P[3], P[2]);
      if (i1.kind === 'diss' || i2.kind === 'diss' || i1.kind === 'P4' || i2.kind === 'P4') continue;
      if (Math.abs(a2 - a1) > 4 || (a1 === a2 && b1 === b2)) continue;
      if (Math.random() < 0.45 && !(i2.perfect)) continue; // bias toward interesting cases
      run(...P); return;
    }
  }
  ctr.appendChild(btn('Direct', () => { quiz = false; run(...examples.direct[0], ...examples.direct[1]); }, 'ghost'));
  ctr.appendChild(btn('Contrary', () => { quiz = false; run(...examples.contrary[0], ...examples.contrary[1]); }, 'ghost'));
  ctr.appendChild(btn('Oblique', () => { quiz = false; run(...examples.oblique[0], ...examples.oblique[1]); }, 'ghost'));
  ctr.appendChild(btn('Random progression', () => { quiz = false; randomProg(); }, 'ghost'));
  ctr.appendChild(btn('Test me', () => { quiz = true; randomProg(); }, 'accent'));
  box.appendChild(ctr);
  // rules matrix
  const mat = H('table', { class: 'rules-mx' });
  mat.appendChild(H('thead', null, H('tr', null, H('th', null, 'From ↓  To →'), H('th', null, 'Perfect (1, 5, 8)'), H('th', null, 'Imperfect (3, 6)'))));
  const cell = (rule, cases) => { const td = H('td', null, H('div', { class: 'rn' }, 'Rule ' + rule)); cases.forEach(([m, ok, prog]) => { const b = H('button', { type: 'button', class: 'chip ' + (ok ? 'ok' : 'no') }, (ok ? '✓ ' : '✕ ') + m); b.addEventListener('click', () => { quiz = false; run(...prog); }); td.appendChild(b); }); return td; };
  mat.appendChild(H('tbody', null,
    H('tr', null, H('th', null, 'Perfect'),
      cell(1, [['direct', false, ['A4', 'D4', 'B4', 'E4']], ['contrary', true, ['A4', 'D4', 'C5', 'C4']], ['oblique', true, ['G4', 'C4', 'G4', 'G3']]]),
      cell(2, [['direct', true, ['A4', 'D4', 'B4', 'G4']], ['contrary', true, ['A4', 'D4', 'G4', 'E4']], ['oblique', true, ['A4', 'D4', 'B4', 'D4']]])),
    H('tr', null, H('th', null, 'Imperfect'),
      cell(3, [['direct', false, ['C5', 'E4', 'D5', 'G4']], ['contrary', true, ['C5', 'E4', 'D5', 'D4']], ['oblique', true, ['B4', 'D4', 'A4', 'D4']]]),
      cell(4, [['direct', true, ['F4', 'D4', 'G4', 'E4']], ['contrary', true, ['F4', 'D4', 'A4', 'C4']], ['oblique', true, ['B4', 'D4', 'B4', 'G4']]]))
  ));
  box.appendChild(H('div', { class: 'mx-wrap' }, mat));
  host.appendChild(box);
  run('A4', 'D4', 'G4', 'E4', true);
}

/* ================= Widget: suspension lab (4th species) ================= */
function suspensionLab(host) {
  const box = H('div', { class: 'widget susp' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Animation'), H('strong', null, 'Suspension lab'), H('span', { class: 'mini' }, 'A ligature is a delayed note. Remove the tie and you see the plain first-species progression underneath (Figs. 63–64).')));
  const S2 = { // verified: prep (upbeat) – dissonance (downbeat) – resolution (upbeat)
    '7-6': { up: true, cf: ['E4', 'D4', 'C4'], a: 'C5', b: 'B4', c: 'C5', note: 'Cantus below: the seventh resolves down to the sixth. This is the standard cadence of the fourth species (Fig. 73, next-to-last bar).' },
    '4-3': { up: true, cf: ['A3', 'G3', 'F3'], a: 'C4', b: 'B3', c: 'A3', note: 'Cantus below: the fourth resolves down to the third.' },
    '9-8': { up: true, cf: ['A3', 'B3', 'D4'], a: 'C5', b: 'B4', c: 'A4', note: 'Cantus below: the ninth resolves to the octave. Prepare it with a tenth (10–9–8) or a third (3–2–1), never with the octave (Fig. 67).' },
    '2-1 bad': { up: true, cf: ['C4', 'B3', 'A3'], a: 'C4', b: 'B3', c: 'C4', note: 'Unison → second → unison: remove the tie and two unisons stand side by side, so this is forbidden (Fig. 65). The same holds for 8–9–8.' },
    '2-3': { up: false, cf: ['E4', 'D4', 'E4'], a: 'C4', b: 'B3', c: 'C4', note: 'Cantus above: the second resolves down to the third (Fig. 69).' },
    '4-5': { up: false, cf: ['F4', 'G4', 'F4'], a: 'D4', b: 'C4', c: 'A3', note: 'Cantus above: the fourth resolves down to the fifth (Fig. 69).' },
    '9-10': { up: false, cf: ['F4', 'E4', 'F4'], a: 'D3', b: 'C3', c: 'D3', note: 'Cantus above: the ninth resolves to the tenth (Fig. 69). A seventh resolving into the octave is not used by the masters (Fig. 70).' }
  };
  function build(key, flat) {
    const t = S2[key];
    const cf = { role: 'cf', notes: t.cf.map(p => ({ p, d: 1 })) };
    const cp = flat ? { role: 'cpt', species: 1, notes: [{ p: t.a, d: 1 }, { p: t.b, d: 1 }, { p: t.c, d: 1 }] }
      : { role: 'cpt', species: 4, notes: [{ d: .5, rest: 1 }, { p: t.a, d: .5, tie: 1 }, { p: t.a, d: .5 }, { p: t.b, d: .5 }, { p: t.c, d: 1 }] };
    return t.up ? [cp, cf] : [cf, cp];
  }
  const sc = H('div'); const note = H('p', { class: 'cap' });
  let cur = '7-6', plain = false;
  const score = new Score(sc, { voices: build(cur, false), figures: 'pair', compact: true, maxWidth: 420 });
  const segs = seg(Object.keys(S2).map(k => [k, k]), cur, v => { cur = v; plain = false; tb.classList.remove('on'); refresh(); }, 'Suspension type');
  const tb = btn('Remove the ligature', () => { plain = !plain; tb.classList.toggle('on', plain); refresh(true); }, 'toggle');
  function refresh(anim) {
    const vs = build(cur, plain);
    score.o.voices = vs; score.render();
    if (anim && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { sc.classList.remove('slide'); void sc.offsetWidth; sc.classList.add('slide'); }
    const t = S2[cur];
    const only = new Set(['susp', 'susp-perf', 'acc-diss', 'diss', 'par5', 'par8', 'direct', 'sync8', 'susp78']);
    const r0 = FE.analyze(build(cur, false)); const r = { errors: r0.errors.filter(e => only.has(e.rule)) };
    const iv = (x, y) => { const i = FE.ivl(x, y); let n = i.num; return n; };
    const nums = `${iv(t.a, t.cf[0])} – ${iv(t.a, t.cf[1])} – ${iv(t.b, t.cf[1])}`;
    note.innerHTML = `<b>${nums}</b>: ${t.note} ${plain ? '<br><i>Without the tie the dissonance disappears; this is the progression the ear checks.</i>' : ''} ${r.errors.length ? '<br><span class="pill ds">The checker flags it</span> ' + r.errors.map(e => RULE_NAMES[e.rule]).join(', ') : '<br><span class="pill ic">Checker: correct</span>'}`;
  }
  const bar = H('div', { class: 'ex-bar' }, playBtn(() => build(cur, plain), score), tb);
  box.appendChild(H('div', { class: 'seg-scroll' }, segs)); box.appendChild(sc); box.appendChild(bar); box.appendChild(note);
  host.appendChild(box); refresh();
}

/* ================= Widget: monochord (appendix) ================= */
function monochord(host) {
  const box = H('div', { class: 'widget mono' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Animation'), H('strong', null, 'Monochord: dividing the string'), H('span', { class: 'mini' }, 'Fux derives the intervals by dividing a string. Shorter string = higher pitch. Tap a ratio to move the bridge and hear both segments.')));
  const W = 560, Hh = 150;
  const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'mono-svg' }); const wrap = H('div', { class: 'mot-wrap' }, svg); box.appendChild(wrap);
  const X0 = 30, X1 = W - 30, Y = 70;
  S('rect', { x: X0 - 14, y: Y + 14, width: X1 - X0 + 28, height: 26, rx: 4, class: 'mono-box' }, svg);
  S('rect', { x: X0 - 6, y: Y - 8, width: 6, height: 22, class: 'mono-nut' }, svg); S('rect', { x: X1, y: Y - 8, width: 6, height: 22, class: 'mono-nut' }, svg);
  const s1 = S('path', { class: 'str a' }, svg), s2 = S('path', { class: 'str b' }, svg);
  const bridge = S('path', { class: 'bridge' }, svg);
  const lab1 = S('text', { class: 'mlab', y: Y - 26 }, svg), lab2 = S('text', { class: 'mlab', y: Y - 26 }, svg);
  const ticks = S('g', {}, svg);
  for (let i = 1; i < 12; i++) { const x = X0 + (X1 - X0) * i / 12; S('line', { x1: x, x2: x, y1: Y + 14, y2: Y + 20, class: 'tick' }, ticks); }
  const info = H('div', { class: 'mot-verdict' }); box.appendChild(info);
  let frac = 0.5, target = 0.5, amp1 = 0, amp2 = 0, raf = 0, ph = 0;
  const ratios = [['2:1', 1 / 2, 'octave', 'perfect consonance'], ['3:2', 2 / 3, 'fifth', 'perfect consonance'], ['4:3', 3 / 4, 'fourth', 'perfect / dissonant (see p. 20)'], ['5:4', 4 / 5, 'major third', 'imperfect consonance'], ['6:5', 5 / 6, 'minor third', 'imperfect consonance'], ['5:3', 3 / 5, 'major sixth', 'imperfect consonance'], ['8:5', 5 / 8, 'minor sixth', 'imperfect consonance'], ['9:8', 8 / 9, 'whole tone', 'dissonance']];
  function draw() {
    frac += (target - frac) * 0.18; ph += 0.9; amp1 *= 0.975; amp2 *= 0.975;
    const xb = X0 + (X1 - X0) * frac;
    const wave = (xa, xz, A, k) => { let d = `M${xa},${Y}`; const n = 40; for (let i = 1; i <= n; i++) { const x = xa + (xz - xa) * i / n; const y = Y + Math.sin(Math.PI * i / n) * A * Math.sin(ph * k); d += ` L${x.toFixed(1)},${y.toFixed(1)}`; } return d; };
    s1.setAttribute('d', wave(X0, xb, amp1, 0.55 / Math.max(.2, frac)));
    s2.setAttribute('d', wave(xb, X1, amp2, 0.55 / Math.max(.2, 1 - frac)));
    bridge.setAttribute('d', `M${xb - 7},${Y + 14} L${xb},${Y - 2} L${xb + 7},${Y + 14}z`);
    lab1.setAttribute('x', (X0 + xb) / 2); lab2.setAttribute('x', (xb + X1) / 2);
    if (Math.abs(target - frac) > 0.001 || amp1 > 0.05 || amp2 > 0.05) raf = requestAnimationFrame(draw); else raf = 0;
  }
  function pick(r) {
    target = r[1];
    AudioEng.init(); const ctx = AudioEng.ctx, t = ctx.currentTime + 0.05, base = 196; // G3 open string
    const tone = (f, when, dur) => { // plucked sine-rich tone with exact ratio
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o2.type = 'sine';
      o.frequency.value = f; o2.frequency.value = f * 2; const g2 = ctx.createGain(); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.35, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(AudioEng.out); o.start(when); o2.start(when); o.stop(when + dur); o2.stop(when + dur);
    };
    // whole string frequency = base; segment of length L has frequency base / L
    tone(base, t, 1.4); tone(base / r[1], t + 0.7, 1.4); tone(base, t + 1.5, 1.8); tone(base / r[1], t + 1.5, 1.8);
    lab1.textContent = `${r[0].split(':')[1]} parts`; lab2.textContent = `${r[0].split(':')[0] - r[0].split(':')[1]} part${r[0].split(':')[0] - r[0].split(':')[1] > 1 ? 's' : ''}`;
    amp1 = 0; amp2 = 0; setTimeout(() => { amp1 = 7; if (!raf) raf = requestAnimationFrame(draw); }, 700); setTimeout(() => { amp1 = 7; amp2 = 5; if (!raf) raf = requestAnimationFrame(draw); }, 1500);
    info.className = 'mot-verdict ok';
    info.innerHTML = `<b>${r[0]}: ${r[2]}</b>. The whole string (${r[0].split(':')[0]} parts) against ${r[0].split(':')[1]} of its parts. ${r[3][0].toUpperCase() + r[3].slice(1)}.`;
    if (!raf) raf = requestAnimationFrame(draw);
  }
  const ctr = H('div', { class: 'mot-ctr' }); ratios.forEach(r => ctr.appendChild(btn(r[0] + ' ' + r[2], () => pick(r), 'ghost')));
  box.appendChild(ctr);
  // divisions diagram
  const dv = H('div', { class: 'divs' });
  dv.innerHTML = `<div class="div-row"><span class="dl">Arithmetical division of the octave</span><span class="dr"><b>4 : 3 : 2</b> = fourth (4:3) below + fifth (3:2) above</span></div>
  <div class="div-row"><span class="dl">Harmonic division of the octave</span><span class="dr"><b>6 : 4 : 3</b> = fifth (3:2) below + fourth (4:3) above</span></div>
  <div class="div-row"><span class="dl">Harmonic division of the fifth</span><span class="dr"><b>15 : 12 : 10</b> = major third (5:4) below + minor third (6:5) above</span></div>`;
  box.appendChild(dv);
  host.appendChild(box);
  lab1.textContent = '1 part'; lab2.textContent = '1 part'; draw();
}

/* ================= Widget: natural order of the triad ================= */
function triadOrder(host) {
  const box = H('div', { class: 'widget' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Compare'), H('strong', null, 'Natural order versus keyboard order'), H('span', { class: 'mini' }, 'Fux puts the fifth low and the third high, the order the harmonic division produces (Figs. 161–162).')));
  const sc = H('div'); box.appendChild(sc);
  const natural = [{ notes: [{ p: 'E5', d: 1 }] }, { notes: [{ p: 'G4', d: 1 }] }, { notes: [{ p: 'C4', d: 1 }] }, { notes: [{ p: 'C3', d: 1 }] }];
  const kbd = [{ notes: [{ p: 'C5', d: 1 }] }, { notes: [{ p: 'G4', d: 1 }] }, { notes: [{ p: 'E4', d: 1 }] }, { notes: [{ p: 'C3', d: 1 }] }];
  const both = [{ notes: [{ p: 'E5', d: 1 }, { p: 'C5', d: 1 }] }, { notes: [{ p: 'C5', d: 1 }, { p: 'G4', d: 1 }] }, { notes: [{ p: 'G4', d: 1 }, { p: 'E4', d: 1 }] }, { notes: [{ p: 'C3', d: 1 }, { p: 'C3', d: 1 }] }];
  const score = new Score(sc, { voices: both, figures: 'bass', compact: true, maxWidth: 300 });
  const bar = H('div', { class: 'ex-bar' },
    btn('▶ Natural order (10, 8, 5)', () => Player.play(null, [{ notes: [{ p: 'E5', d: 1.5 }] }, { notes: [{ p: 'C5', d: 1.5 }] }, { notes: [{ p: 'G4', d: 1.5 }] }, { notes: [{ p: 'C3', d: 1.5 }] }]), 'ghost'),
    btn('▶ Keyboard order (8, 5, 3)', () => Player.play(null, [{ notes: [{ p: 'C5', d: 1.5 }] }, { notes: [{ p: 'G4', d: 1.5 }] }, { notes: [{ p: 'E4', d: 1.5 }] }, { notes: [{ p: 'C3', d: 1.5 }] }]), 'ghost'));
  box.appendChild(bar);
  box.appendChild(H('p', { class: 'cap', html: 'Bar 1: the natural order, with the fifth low, the octave in the middle and the third (tenth) on top. Bar 2: the keyboard order, with the third crowded low near the bass. Fux: “the third placed in the low register and so close to the bass results in a dull and indistinct sound.” The larger the ratio numbers of an interval (5:4 for the third versus 3:2 for the fifth), the higher the register it needs.' }));
  host.appendChild(box);
}

/* ================= Widget: spot the fault quiz ================= */
function faultQuiz(host) {
  const box = H('div', { class: 'widget quiz' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Self-test'), H('strong', null, 'Spot the fault'), H('span', { class: 'mini' }, 'A correct first-species counterpoint with exactly one note changed. Which rule does it break?')));
  const sc = H('div'); box.appendChild(sc);
  const opts = H('div', { class: 'mot-ctr' }); box.appendChild(opts);
  const fb = H('div', { class: 'mot-verdict' }, ''); box.appendChild(fb);
  const score = new Score(sc, { voices: [], figures: 'pair' });
  let state = null, right = 0, total = 0;
  const groups = { par5: 'Parallel fifths', par8: 'Parallel octaves / unisons', direct: 'Hidden fifth/octave (direct motion)', mel: 'Unsingable melodic interval', 'acc-diss': 'Dissonance', begin: 'Bad beginning', 'begin-mode': 'Bad beginning', end: 'Bad ending', cad: 'Wrong cadence', unison: 'Unison in the middle', skip8: 'Skips into an octave' };
  const pool = ['Parallel fifths', 'Parallel octaves / unisons', 'Hidden fifth/octave (direct motion)', 'Unsingable melodic interval', 'Dissonance', 'Wrong cadence', 'Unison in the middle', 'Bad beginning'];
  function make() {
    const modes = Object.keys(FE.MODES);
    for (let attempt = 0; attempt < 40; attempt++) {
      const m = modes[Math.floor(Math.random() * modes.length)], pos = Math.random() < .5 ? 1 : 0;
      const ex = FE.buildExercise(m, 2, pos, 1, 0, {});
      const sol = FE.solve(ex, m, { maxNodes: 6000, seed: (Math.random() * 1e9) | 0 });
      if (!sol) continue;
      const ci = 1 - pos, notes = sol[ci].notes;
      for (let t = 0; t < 30; t++) {
        const k = Math.floor(Math.random() * notes.length);
        const orig = notes[k].p, st = FE.parse(orig).step + [-3, -2, -1, 1, 2, 3, 4][Math.floor(Math.random() * 7)];
        notes[k].p = FE.fromStep(st, 0);
        const r = FE.analyze(sol);
        const rules = [...new Set(r.errors.map(e => groups[e.rule]).filter(Boolean))];
        if (r.errors.length >= 1 && rules.length === 1 && r.errors.every(e => groups[e.rule])) {
          sol.forEach((v, i) => { v.lo = ex[i].lo; v.hi = ex[i].hi; });
          state = { sol, answer: rules[0], issues: r.issues.filter(i => i.level === 'error'), k, ci, orig, mode: m };
          return true;
        }
        notes[k].p = orig;
      }
    }
    return false;
  }
  function show() {
    fb.className = 'mot-verdict'; fb.textContent = 'Listen, look, and choose.';
    if (!make()) { fb.textContent = 'Could not build a puzzle. Try again.'; return; }
    score.issues = []; score.o.voices = state.sol; score.render();
    opts.innerHTML = '';
    const choices = [state.answer]; const others = pool.filter(p => p !== state.answer).sort(() => Math.random() - .5); while (choices.length < 4) choices.push(others.pop());
    choices.sort(() => Math.random() - .5).forEach(c => opts.appendChild(btn(c, () => answer(c), 'ghost')));
    opts.appendChild(playBtn(() => state.sol, score));
  }
  function answer(c) {
    total++; const ok = c === state.answer; if (ok) right++;
    score.issues = state.issues; score.render();
    fb.className = 'mot-verdict ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<span class="pill ${ok ? 'ic' : 'ds'}">${ok ? 'Correct' : 'Not quite'}</span> It was <b>${state.answer}</b>. ${state.issues[0].msg} <span class="mini">(${right}/${total})</span> `;
    fb.appendChild(btn('Next puzzle', show, 'accent'));
  }
  box.appendChild(H('div', { class: 'ex-bar' }, btn('New puzzle', show, 'accent')));
  host.appendChild(box);
  setTimeout(show, 50);
}

/* ================= Mode explorer ================= */
function modeExplorer(host) {
  const box = H('div', { class: 'widget' });
  box.appendChild(H('div', { class: 'w-head' }, H('span', { class: 'eyebrow' }, 'Listen'), H('strong', null, 'Fux’s six cantus firmi'), H('span', { class: 'mini' }, 'One melody for each mode on D, E, F, G, A, C. B has no perfect fifth, so it cannot be a final (Fig. 9).')));
  const sc = H('div'); const cap = H('p', { class: 'cap' });
  let m = 'D';
  const score = new Score(sc, { voices: [{ role: 'cf', notes: FE.cfLine(FE.MODES[m].cf) }], compact: false });
  function set(k) {
    m = k; score.o.voices = [{ role: 'cf', notes: FE.cfLine(FE.MODES[k].cf) }]; score.render();
    const fin = FE.MODES[k].final; const semis = { D: 'E–F and B–C fall on degrees 2–3 and 6–7', E: 'E–F and B–C fall on degrees 1–2 and 5–6. This is the only mode with no perfect fifth above the second degree (B–F), which makes its cadences unusual (pp. 81, 124)', F: 'E–F and B–C fall on degrees 7–8 and 4–5. The fourth degree B forms a tritone with the final', G: 'E–F and B–C fall on degrees 6–7 and 3–4. The seventh is raised (F♯) at cadences', A: 'E–F and B–C fall on degrees 5–6 and 2–3. The seventh is raised (G♯) at cadences', C: 'E–F and B–C fall on degrees 3–4 and 7–8' }[k];
    cap.innerHTML = `<b>${FE.MODES[k].name}</b>. Semitones (mi–fa): ${semis}. Figs. 4, 11, 13, 15, 22–23.`;
  }
  box.appendChild(H('div', { class: 'seg-scroll' }, seg(Object.keys(FE.MODES).map(k => [k, k]), m, set, 'Mode')));
  box.appendChild(sc);
  box.appendChild(H('div', { class: 'ex-bar' }, playBtn(() => [{ notes: FE.cfLine(FE.MODES[m].cf) }], score)));
  box.appendChild(cap); host.appendChild(box); set('D');
}

/* ================= public ================= */
window.Gradus = { solveAsync, AudioEng, Player, Score, figure, Workbench, intervalExplorer, motionLab, suspensionLab, monochord, triadOrder, faultQuiz, modeExplorer, H, btn, playBtn, seg, select, clone };
})();
