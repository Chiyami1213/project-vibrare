// Rewrites the players of the delivered analysis pages so that every note is scheduled on the audio clock.
//
// The pages fired each note from a requestAnimationFrame callback, at the moment a frame found the clock past the note. That
// ties the timing to the frame rate: a hidden tab or a covered window gets no frames and the music stops, the first frame after
// coming back plays every missed note at once, and any slow frame is heard as a late note. Here a timer (25 ms) hands the notes
// of the next 0.35 s to the sampler at their exact audio time, the position comes from the audio clock (so a changed tempo goes
// on from the same place), and the highlights follow the same clock. A timer keeps running in a tab that is making sound.
//
// Pure text work, tested on every real page. `scheduleOnAudioClock` returns null when an anchor is missing, so a page that was
// delivered with another player is left alone (and gets the smaller fix in static-pages.ts).

/** How far ahead of the audio clock notes are handed to the sampler, in seconds. */
export const LOOKAHEAD = 0.35;

class Missing extends Error {}

/** A literal piece of the original code as a pattern: spaces and line breaks in it match any white space. */
function flex(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped.replace(/\s+/g, '\\s+'));
}

type Pattern = string | RegExp;
const toRe = (p: Pattern) => (typeof p === 'string' ? flex(p) : p);

/** Replace the first match, or give up on the page. A string replacement is used as it is (no $ patterns) for a string pattern. */
function sub(text: string, pattern: Pattern, rep: string | ((...m: string[]) => string)): string {
  const re = toRe(pattern);
  if (!new RegExp(re.source, re.flags.replace('g', '')).test(text)) throw new Missing(String(re));
  return text.replace(re, typeof rep === 'string' && typeof pattern === 'string' ? () => rep : (rep as string));
}

// ---------- the sampler (PIANO) of the fugue, Quantz concerto, Blavet and Touhou pages ----------

/** PIANO gets a clock, its output latency, and noteAt(when, ...): the same note(), started at an audio time. */
function patchPiano(html: string): string {
  let out = html;
  out = sub(out, /const PIANO = \(\(\) => \{/, 'const PIANO = (() => {\n  let at = null;');
  out = sub(
    out,
    /(\n\s*)(get sound\(\) \{)/,
    (_all: string, nl: string, g: string) =>
      `${nl}get time() { return AC ? AC.currentTime : 0; }, get latency() { return AC ? (AC.outputLatency || AC.baseLatency || 0) : 0; },` +
      `${nl}noteAt(when, ...a) { at = when; try { this.note(...a); } finally { at = null; } },${nl}${g}`,
  );
  out = sub(out, /t = AC\.currentTime \+ 0\.02/, 't = Math.max(AC.currentTime + 0.005, at == null ? AC.currentTime + 0.02 : at)');
  return out;
}

// ---------- the players that step through a list of events (fugue, concerto, Blavet; one excerpt at a time on the Touhou page) ----------

function patchStepPlayer(html: string, tempoExpr: string, family: 'events' | 'excerpt'): string {
  let out = html;
  out = sub(out, 'let cur = null, raf = 0;', `let cur = null, raf = 0, timer = 0;\n  const LOOK = ${LOOKAHEAD};`);
  out = sub(out, /function stop\(\) \{\s*if \(!cur\) return;\s*cancelAnimationFrame\(raf\);/, 'function stop(natural) { if (!cur) return; cancelAnimationFrame(raf); clearInterval(timer); if (!natural) PIANO.mute(() => false);');
  // the position starts at an audio time, and keeps the tempo it was read with
  out = sub(out, 'pos: from - 0.05, last: performance.now(),', `pos: from - 0.05, p0: from - 0.05, a0: PIANO.time + 0.06, tempo: ${tempoExpr}, k: 0,`);
  // the step: the position and the look-ahead come from the audio clock
  out = sub(
    out,
    /const step = now => \{\s*if \(cur !== st\) return;\s*const tempo = [^;]*;\s*st\.pos \+= \(now - st\.last\) \/ 1000 \* tempo \/ 60; st\.last = now;/,
    `const step = () => {
      if (cur !== st) return;
      const tempo = ${tempoExpr}, ac = PIANO.time;
      if (tempo !== st.tempo) { st.p0 += (ac - st.a0) * st.tempo / 60; st.a0 = ac; st.tempo = tempo; }   // a new tempo goes on from where it is
      st.pos = st.p0 + (ac - st.a0 - PIANO.latency) * tempo / 60;                                       // what is sounding now
      const ahead = st.p0 + (ac + LOOK - st.a0) * tempo / 60;                                           // what is handed to the sampler
      const at = t => st.a0 + (t - st.p0) * 60 / tempo;`,
  );
  if (family === 'events') {
    out = sub(out, 'EV[st.i].t <= st.pos &&', 'EV[st.i].t <= ahead &&');
    out = sub(out, 'const e = EV[st.i++];', 'const e = EV[st.i++]; const when = at(e.t); if (when < ac - 0.3) continue;');
    if (/st\.pend/.test(out)) {
      // Blavet: a note that comes late after a dot or in an unequal pair is held back and sounded at its own time
      out = sub(out, 'const fire = (e, x) => PIANO.note(', 'const fire = (e, x, w = when) => PIANO.noteAt(w, ');
      out = sub(out, 'go: () => fire(e, -dly)', 'go: w => fire(e, -dly, w)');
      out = sub(out, 'if (p.t <= st.pos) { p.go(); return false; }', 'if (p.t <= ahead) { if (at(p.t) >= ac - 0.3) p.go(at(p.t)); return false; }');
    } else {
      // the note call inside the step (and not another PIANO.note elsewhere on the page)
      const from = out.indexOf('const step = () => {');
      const to = out.indexOf('if (st.pos > end + 0.2)', from);
      if (from < 0 || to < 0 || !out.slice(from, to).includes('PIANO.note(')) throw new Missing('PIANO.note in step');
      out = out.slice(0, from) + out.slice(from, to).replace('PIANO.note(', 'PIANO.noteAt(when, ') + out.slice(to);
    }
  } else {
    // one excerpt: a note is heard at its time and lit when that time has come
    out = sub(out, /while \(st\.i < notes\.length && notes\[st\.i\]\.on <= st\.pos\) \{\s*const n = notes\[st\.i\+\+\];\s*PIANO\.note\(([^\n]*)\);\s*const els = /, (_all: string, args: string) => `while (st.i < notes.length && notes[st.i].on <= ahead) {
        const n = notes[st.i++], when = at(n.on);
        if (when >= ac - 0.3) PIANO.noteAt(when, ${args});
      }
      while (st.k < notes.length && notes[st.k].on <= st.pos) {
        const n = notes[st.k++];
        const els = `);
    out = sub(out, /(while \(st\.i < notes\.length && notes\[st\.i\]\.on < from - 1e-6\) st\.i\+\+;)/, '$1 st.k = st.i;');
  }
  out = sub(
    out,
    /if \(st\.pos > end \+ 0\.2\) \{ stop\(\); return; \}\s*raf = requestAnimationFrame\(step\);\s*\};\s*raf = requestAnimationFrame\(step\);/,
    `if (st.pos > end + 0.2) { stop(true); return; }
    };
    const frame = () => { if (cur !== st) return; step(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    timer = setInterval(step, 25);`,
  );
  return out;
}

// ---------- the Touhou analysis page: several excerpts, each with a play button ----------

function patchTouhouAnalysis(html: string): string {
  let out = html;
  out = sub(out, 'let raf = 0, last = 0, q = 0, idx = 0, si = 0,', 'let raf = 0, timer = 0, q = 0, idx = 0, si = 0, qa = 0, aa = 0, tp = 0, su = 0,');
  out = sub(out, 'const stop = () => { cancelAnimationFrame(raf);', 'const stop = natural => { cancelAnimationFrame(raf); clearInterval(timer); if (!natural) PIANO.mute(() => false);');
  // everywhere the position is set, the clock is set with it
  out = sub(out, /last = performance\.now\(\);/g, 'qa = q; aa = PIANO.time + 0.05; tp = +sl.value; su = q;');
  // after the score was redrawn while playing: the notes already handed to the sampler are not handed over twice
  out = sub(out, 'si = stAll.findIndex(x => x.t >= q - 1e-6);', 'si = stAll.findIndex(x => x.t >= Math.max(q, su) - 1e-6);');
  out = sub(
    out,
    'const tick = now => { q += (now - last) / 1000 * (+sl.value) / 60; last = now;',
    `const tick = () => {
      const tempo = +sl.value, ac = PIANO.time;
      if (tempo !== tp) { qa += (ac - aa) * tp / 60; aa = ac; tp = tempo; }
      q = qa + (ac - aa - PIANO.latency) * tempo / 60;
      const ahead = qa + (ac + ${LOOKAHEAD} - aa) * tempo / 60;`,
  );
  out = sub(
    out,
    'while (si < stAll.length && stAll[si].t <= q) { const n = stAll[si].n, np = stAll[si].p; si++;',
    'while (si < stAll.length && stAll[si].t <= ahead) { const n = stAll[si].n, np = stAll[si].p, when = aa + (stAll[si].t - qa) * 60 / tempo; si++; su = ahead; if (when < ac - 0.3) continue;',
  );
  out = sub(out, 'PIANO.note(n[0] + trSemis(), len, 0.7, n[3]);', 'PIANO.noteAt(when, n[0] + trSemis(), len, 0.7, n[3]);');
  out = sub(
    out,
    'if (idx >= evAll.length && q > evAll[evAll.length - 1].t + 1) { stop(); return; } raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);',
    `if (idx >= evAll.length && q > evAll[evAll.length - 1].t + 1) { stop(true); return; }
    };
    const frame = () => { if (!isPlaying()) return; tick(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame); timer = setInterval(() => { if (isPlaying()) tick(); }, 25);`,
  );
  return out;
}

// ---------- the Japanese guides: short example sequences, one note per beat ----------

function patchJapanese(html: string): string {
  let out = html;
  out = sub(out, 'function stop() { clearTimeout(timer); timer = null;', 'function stop(natural) { clearInterval(timer); timer = null; if (!natural) silence();');
  // every note keeps its gain node, so that Stop can silence the ones already handed to the audio clock
  out = sub(
    out,
    'function note(midi, len, vel) { if (!bufs) return; vel = vel || 0.7;',
    `const live = [];
  function silence() { if (!AC) return; const n = AC.currentTime; live.splice(0).forEach(v => { try { v.g.gain.cancelScheduledValues(n); v.g.gain.setValueAtTime(v.g.gain.value, n); v.g.gain.linearRampToValueAtTime(0.0001, n + 0.03); } catch (e) {} }); }
  function note(midi, len, vel, when) { if (!bufs) return; vel = vel || 0.7;`,
  );
  out = sub(out, 'const t = AC.currentTime + 0.01, src = AC.createBufferSource();', 'const t = when == null ? AC.currentTime + 0.01 : Math.max(when, AC.currentTime + 0.005), src = AC.createBufferSource();');
  out = sub(out, 'src.start(t); src.stop(t + hold + 0.3); }', 'src.start(t); src.stop(t + hold + 0.3); live.push({ g: out, end: t + hold + 0.3 }); while (live.length && live[0].end < AC.currentTime) live.shift(); }');
  out = sub(
    out,
    'ready().then(() => { let i = 0; const mine = cur; const step = () => { if (cur !== mine) return; if (i >= m.length) { stop(); return; } const d = 60 / +tempo.value; note(m[i], d * 0.95, 0.62); lit(key, i); i++; timer = setTimeout(step, d * 1000); }; step(); });',
    `ready().then(() => {
      if (cur === null) return;
      const mine = cur, queue = []; let i = 0, next = AC.currentTime + 0.06;
      const lat = () => AC.outputLatency || AC.baseLatency || 0;
      const pump = () => {
        if (cur !== mine) return;
        const ac = AC.currentTime;
        while (i < m.length && next < ac + ${LOOKAHEAD}) { const d = 60 / +tempo.value; note(m[i], d * 0.95, 0.62, next); queue.push({ at: next, i }); next += d; i++; }
        while (queue.length && queue[0].at - lat() <= ac) lit(key, queue.shift().i);
        if (i >= m.length && !queue.length && ac >= next) stop(true);
      };
      pump(); timer = setInterval(pump, 25);
    });`,
  );
  return out;
}

/** The page with its players rewritten to schedule on the audio clock, or null if it has no player this module knows. */
export function scheduleOnAudioClock(html: string): string | null {
  try {
    if (/const PLAYER = \(\(\) => \{[\s\S]*?st\.pos \+= \(now - st\.last\)/.test(html)) {
      let out = patchPiano(html);
      // the excerpt player of the Touhou phase 4 pages reads its tempo from the figure; the others from #tempo
      const excerpt = /async function start\(fig, key, from = 0\)/.test(out);
      out = patchStepPlayer(out, excerpt ? "+$('.tmp', fig).value" : "+$('#tempo').value", excerpt ? 'excerpt' : 'events');
      return out;
    }
    if (/q \+= \(now - last\) \/ 1000/.test(html) && /const PIANO = \(\(\) => \{/.test(html)) return patchTouhouAnalysis(patchPiano(html));
    if (/function seq\(key, btn, midis\)/.test(html) && /timer = setTimeout\(step, d \* 1000\)/.test(html)) return patchJapanese(html);
  } catch (e) {
    if (e instanceof Missing) {
      if (typeof process !== 'undefined' && process.env.PLAYBACK_DEBUG) console.warn('playback: anchor missing:', e.message);
      return null;
    }
    throw e;
  }
  return null;
}
