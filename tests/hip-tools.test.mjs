// The seven HIP tools against the acceptance tests of the pack (BUILD_BRIEF.md §6) and the pack's own stored examples.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../src/scripts/hip/tools-pure.ts';
import { parseVoice, soundingNotes } from '../src/scripts/hip/notation.ts';

const hip = JSON.parse(readFileSync(new URL('../content/hip/data/hip.json', import.meta.url), 'utf8'));
const ex = hip.examples;
const tempo = (metre, word, fastest = 'quaver', pulse = 80) => T.quantzTempo({ metre, word, fastest, pulse });

test('Quantz tempo: the five acceptance cases', () => {
  let r = tempo('C', 'Allegro assai');
  assert.deepEqual([r.unit, r.mm], ['minim', 80]);
  r = tempo('¢', 'Allegretto');
  assert.deepEqual([r.unit, r.mm], ['minim', 80]);
  r = tempo('C', 'Allegro');
  assert.deepEqual([r.unit, r.mm], ['crotchet', 120]); // one pulse to every three quavers
  assert.equal(r.spacing, 3);
  r = tempo('12/8', 'Alla siciliana');
  assert.deepEqual([r.unit, r.mm], ['quaver', 120]);
  r = tempo('C', 'Adagio assai');
  assert.deepEqual([r.unit, r.mm], ['quaver', 40]);
});

test('Quantz tempo: a pulse of 70 scales every result by 70/80', () => {
  for (const [m, w] of [['C', 'Allegro assai'], ['¢', 'Allegretto'], ['C', 'Allegro'], ['12/8', 'Alla siciliana'], ['C', 'Adagio assai'], ['3/4', 'Allegro']]) {
    const a = tempo(m, w, 'semiquaver', 80).mm;
    const b = tempo(m, w, 'semiquaver', 70).mm;
    assert.ok(Math.abs(b - (a * 70) / 80) < 0.1, `${m} ${w}: ${a} -> ${b}`);
  }
});

test('Quantz tempo: the other cases of the tables, the pulse diagram and Bodky', () => {
  assert.equal(tempo('2/4', 'Allegro').unit, 'bar');
  assert.deepEqual(tempo('12/8', 'Allegro', 'quaver').positions, [0, 6]); // two pulses to the bar
  const waltz = tempo('3/4', 'Allegro', 'semiquaver'); // three pulses to two bars
  assert.deepEqual([waltz.bars, waltz.positions], [2, [0, 4, 8]]);
  assert.deepEqual(tempo('3/4', 'Adagio cantabile').positions, [0, 1, 2, 3, 4, 5]); // each quaver
  assert.deepEqual(tempo('3/4', 'Arioso').positions, [0, 2, 4]); // each crotchet
  assert.deepEqual(tempo('12/8', 'Alla siciliana').positions, [0, 2, 3, 5, 6, 8, 9, 11]);
  assert.equal(tempo('C', 'Allegretto').bodky.group, 'Moderato'); // crotchet 80
  assert.equal(tempo('C', 'Adagio assai').bodky.group, 'Adagio');
  assert.equal(tempo('9/8', 'Allegro').covered, false);
});

test('Quantz tempo: tapping gives the mean tempo', () => {
  assert.equal(T.tapTempo([0, 750, 1500, 2250]), 80);
  assert.equal(T.tapTempo([0]), null);
});

test('appoggiatura: a plain minim gives a crotchet appoggiatura; a dotted minim gives a minim and a crotchet', () => {
  const p = T.appoggiatura('plain', { value: 2 });
  assert.deepEqual([p.app, p.main], [1, 1]);
  const d = T.appoggiatura('dotted', { value: 3 });
  assert.deepEqual([d.app, d.main], [2, 1]);
});

test('appoggiatura: before a rest the appoggiatura takes the note, the note takes the rest', () => {
  const r = T.appoggiatura('before-rest', { value: 1 });
  assert.deepEqual([r.app, r.main], [1, 1]);
  assert.equal(r.performed[0].upper, 'F5:1@0.85_ E5:1@0.5 G5:2');
});

test('appoggiatura: before a trill on a dissonance it is at most 1/16, with a warning if longer', () => {
  const ok = T.appoggiatura('dissonant-trill', { value: 2 });
  assert.ok(ok.app <= 2 / 16 + 1e-9);
  assert.equal(ok.warning, '');
  const long = T.appoggiatura('dissonant-trill', { value: 2, appLen: 0.5 });
  assert.match(long.warning, /1\/16/);
  assert.ok(Math.abs(long.performed[0].upper.split(' ').reduce((s, t) => s + Number(t.split(':')[1].split(/[@_]/)[0]), 0) - 4) < 0.02, 'the realisation fills the bar');
});

test('appoggiatura: the stored examples are reproduced', () => {
  assert.equal(T.appoggiatura('plain', { value: 2 }).written.upper, ex['app-plain'].written.upper);
  assert.equal(T.appoggiatura('plain', { value: 2 }).performed[0].upper, ex['app-plain'].performed.upper);
  assert.equal(T.appoggiatura('dotted', { value: 3 }).performed[0].upper, ex['app-dotted'].performed.upper);
  assert.equal(T.appoggiatura('before-rest', { value: 1 }).written.upper, ex['app-rest'].written.upper);
  const f = T.appoggiatura('falling-thirds');
  assert.equal(f.disagree, true);
  assert.equal(f.performed[0].upper, ex['app-passing'].performed.Quantz);
  assert.equal(f.performed[1].upper, ex['app-passing'].performed['C. P. E. Bach']);
});

test('rhythm lab: the stored examples are reproduced', () => {
  assert.equal(T.DOTTED_WRITTEN, ex.overdot.written.upper);
  assert.equal(T.dottedPerformed(7), ex.overdot.performed.upper);
  assert.equal(T.dottedPerformed(3), T.DOTTED_WRITTEN);
  assert.equal(T.LOMBARD_WRITTEN, ex.lombard.written.upper);
  assert.equal(T.lombardPerformed(0.125), ex.lombard.performed.upper);
  assert.equal(T.INEQUALITY_WRITTEN, ex.inequality.written.upper);
  assert.equal(T.inequalityPerformed(0.58), ex.inequality.performed.upper);
  assert.equal(T.TRIPLET_WRITTEN.upper, ex['dot-vs-triplet'].written.upper);
  assert.equal(T.TRIPLET_PERFORMED.Quantz, ex['dot-vs-triplet'].performed.Quantz);
  assert.equal(T.TRIPLET_PERFORMED['C. P. E. Bach'], ex['dot-vs-triplet'].performed['C. P. E. Bach']);
});

test('rhythm lab: any Quantz exception disables the inequality, with a reason', () => {
  assert.equal(T.inequalityState([]).enabled, true);
  for (const e of T.INEQUALITY_EXCEPTIONS) {
    const s = T.inequalityState([e.id]);
    assert.equal(s.enabled, false, e.id);
    assert.match(s.reason, /Quantz/);
  }
});

test('trill builder: Quantz at pulse 80 plays 8 notes to a crotchet; the stored trills are reproduced', () => {
  const q = T.trill(T.TRILL_PRESETS[0].options);
  assert.equal(q.perPulse, 8);
  assert.ok(q.pitches.slice(1, -3).every((n) => Math.abs(n.d - 0.125) < 1e-9));
  assert.equal(q.upper, ex['trill-cadential-q'].performed.upper.replace(/ C5:2$/, ' C5:2'));
  const c = T.trill(T.TRILL_PRESETS[1].options);
  assert.equal(c.pitches[0].p, 'E5'); // the normal trill starts on the upper note
  assert.equal(c.upper, ex['trill-cpe'].performed.upper);
  assert.equal(T.pralltriller(), ex.pralltriller.performed.upper.replace('E5:0.5_ ', ''));
});

test('trill builder: speed, character, acceleration, and the warning for a long appoggiatura on a dissonance', () => {
  assert.equal(T.trill({ start: 'upper', notesPerPulse: 8, character: 'sad', termination: true }).perPulse, 6);
  assert.equal(T.trill({ start: 'upper', notesPerPulse: 8, character: 'gay', termination: true }).perPulse, 10);
  const acc = T.trill({ start: 'upper', notesPerPulse: 8, termination: true, accelerate: true });
  const ds = acc.pitches.slice(0, -3).map((n) => n.d);
  assert.ok(ds[ds.length - 1] < ds[1], 'the notes get shorter');
  const w = T.trill({ start: 'appoggiatura-above', notesPerPulse: 8, termination: true, dissonant: true });
  assert.equal(w.warnings.length, 1);
  assert.equal(T.trill({ start: 'upper', notesPerPulse: 8, termination: true, dissonant: true }).warnings.length, 0);
  for (const st of ['upper', 'main', 'appoggiatura-above', 'appoggiatura-below']) {
    const r = T.trill({ start: st, notesPerPulse: 8, termination: true });
    const total = r.pitches.slice(0, -1).reduce((s, n) => s + n.d, 0);
    assert.ok(Math.abs(total - 2) < 0.02, `${st}: ${total}`);
  }
});

test('trill builder: the Pralltriller is only offered when the next note is a step lower', () => {
  assert.equal(T.pralltrillerAllowed('D5', 'C5'), true);
  assert.equal(T.pralltrillerAllowed('D5', 'E5'), false);
  assert.equal(T.pralltrillerAllowed('D5', 'D5'), false);
  assert.equal(T.pralltrillerAllowed('D5', 'B4'), false);
});

const planNotes = (id) => soundingNotes(parseVoice(ex[id].written.upper.replace(/\|/g, ' '))).map((n) => ({ midi: n.midi, d: n.d, t: n.t }));

test('breath planner: breath-q gives main breaths after notes 0 and 9, and an emergency one after 5', () => {
  const plan = T.planBreaths(planNotes('breath-q'), 4);
  const main = plan.filter((b) => b.kind === 'main').map((b) => b.index);
  assert.deepEqual(main, ex['breath-q'].breaths.filter((b) => b.kind === 'main').map((b) => b.after));
  assert.deepEqual(main, [0, 9]);
  const emergency = plan.filter((b) => b.kind === 'emergency').map((b) => b.index);
  assert.ok(emergency.includes(5), 'a breath inside the leap G4 to B4');
  for (const b of plan) assert.ok(b.why.length > 5);
});

test('breath planner: never after the last note of a bar, except in quick stepwise triplets', () => {
  // a long note that ends the bar, followed by a short one: no breath
  const notes = [{ midi: 60, d: 1, t: 0 }, { midi: 62, d: 1, t: 1 }, { midi: 64, d: 1, t: 2 }, { midi: 65, d: 1, t: 3 }, { midi: 67, d: 0.25, t: 4 }, { midi: 65, d: 0.25, t: 4.25 }];
  assert.ok(!T.planBreaths(notes, 4).some((b) => b.index === 3));
  // a long triplet note that ends the bar, followed by quick triplets, stepwise: the breath is allowed
  const triplets = [{ midi: 72, d: 1 / 3, t: 0 }, { midi: 69, d: 2 / 3, t: 1 / 3 }, { midi: 68, d: 1 / 3, t: 1 }, { midi: 69, d: 1 / 3, t: 4 / 3 }];
  assert.ok(T.planBreaths(triplets, 1).some((b) => b.index === 1), 'stepwise triplets may breathe at the bar line');
  assert.ok(!T.planBreaths(triplets.map((n) => (n.midi === 68 ? { ...n, midi: 60 } : n)), 1).some((b) => b.index === 1), 'but not across a leap');
});

test('breath planner: a restated opening motif gets a main breath before it', () => {
  const m = [[60, 1], [64, 0.5], [62, 0.5], [67, 1], [60, 1], [64, 0.5], [62, 0.5], [67, 1]];
  let t = 0;
  const notes = m.map(([midi, d]) => ({ midi, d, t: (t += d) - d }));
  assert.ok(T.planBreaths(notes, 8).some((b) => b.index === 3 && b.kind === 'main'));
});

test('breath planner: the syllables of tongue-q are reproduced', () => {
  assert.deepEqual(T.syllables(planNotes('tongue-q')), ex['tongue-q'].syllables);
});

test('breath planner: double tonguing for the quickest notes, weights and bows', () => {
  const quick = [0, 1, 2, 3].map((i) => ({ midi: 60 + i, d: 0.125, t: i * 0.125 }));
  assert.deepEqual(T.syllables(quick), ['did', "'ll", 'did', "'ll"]);
  assert.equal(T.metricalWeight({ midi: 60, d: 1, t: 0 }, 4), 'strong');
  assert.equal(T.metricalWeight({ midi: 60, d: 1, t: 1 }, 4), 'weak');
  assert.equal(T.metricalWeight({ midi: 60, d: 1, t: 2 }, 4), 'strong');
  const bows = T.bowing(planNotes('bow-map'), 3);
  assert.equal(bows[0], 'down'); // the downbeat
  assert.equal(bows[3], 'down'); // first note of the second bar
  assert.equal(bows[4], bows[3]); // a dotted pair in one bow
});

test('dissonance dynamics: the four acceptance cases', () => {
  assert.equal(T.dissonanceClass('G#2', ['B3', 'D4', 'E4']), 'f'); // 6/5 over a raised bass
  assert.equal(T.dissonanceClass('F2', ['A3', 'B3', 'D#4']), 'ff'); // augmented 6th
  assert.equal(T.dissonanceClass('F2', ['D#3']), 'ff');
  assert.equal(T.dissonanceClass('D3', ['E3', 'G3', 'B3']), 'mf'); // 4/2
  assert.equal(T.dissonanceClass('G2', ['A3', 'F3', 'B3']), 'consonant'); // 9/7: no special emphasis
});

test('dissonance dynamics: the stored progression is reproduced', () => {
  for (const c of ex['diss-dyn'].written.chords) assert.equal(T.dissonanceClass(c.bass, c.notes), c.class, `${c.bass} ${c.fig}`);
});

test('dissonance dynamics: p and pp scale the classes down by one and two steps', () => {
  assert.equal(T.scaleClass('ff', 'normal'), 'ff');
  assert.equal(T.scaleClass('ff', 'p'), 'f');
  assert.equal(T.scaleClass('ff', 'pp'), 'mf'); // the strongest gets only mf
  assert.equal(T.scaleClass('f', 'pp'), 'consonant');
  assert.equal(T.scaleClass('consonant', 'pp'), 'consonant');
  const tex = (c) => T.harpsichordTexture(c, 'A2', ['A3', 'C4', 'E4']);
  assert.ok(tex('mf').midis.length > tex('consonant').midis.length);
  assert.ok(tex('mf').midis.includes(45 - 12)); // the bass doubled an octave lower
  assert.equal(tex('ff').arpeggio, true);
  assert.equal(tex('f').arpeggio, false);
});

test('messa di voce: the envelopes swell and fade, and the substitutes are playable notation', () => {
  for (const e of T.ENVELOPES) {
    const lv = e.points.map((p) => p[1]);
    const peak = Math.max(...lv);
    assert.ok(lv[0] < 0.2 && lv[lv.length - 1] < 0.2, `${e.id} starts and ends soft`);
    assert.ok(Math.abs(e.points[lv.indexOf(peak)][0] - 0.5) < 0.1, `${e.id} peaks in the middle`);
  }
  for (const s of T.SUBSTITUTES) {
    const total = soundingNotes(parseVoice(s.notes)).reduce((a, n) => a + n.d, 0);
    assert.ok(Math.abs(total - 4) < 1e-6, `${s.id} fills four crotchets (${total})`);
  }
});
