// Voice colouring: the colour slots, the detector of crossings and overlaps, and the 7th / leading-tone marks, on the
// examples of every pack (the acceptance tests of VOICE_COLORS.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as V from '../src/scripts/partimento/voices.ts';
import { eventsFromWholeNotes } from '../src/data/whole-note-voices.ts';

const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}`, import.meta.url), 'utf8'));
const tonal = ['p1', 'p2', 'p3', 'p5', 'p6'].flatMap((p) => read(`tonal-harmony/data/part-${p}.json`).topics.flatMap((t) => (t.examples ?? []).map((e) => ({ ...e, topic: t.id }))));
const partimento = [...read('partimento/data/schemata.json').patterns, ...read('partimento/data/cadences.json').patterns].flatMap((p) => [...(p.examples ?? []), ...(p.variants ?? []).flatMap((v) => v.examples ?? [])]);
const fux = Object.entries(read('counterpoint/data/fux.json').examples);
const fugue = Object.entries(read('fugue/data/fugue-theory.json').examples);
const crossings = (voices) => V.problems(voices);

test('colour slots: the lowest voice keeps the ink colour whatever the number of parts', () => {
  assert.deepEqual(V.voiceSlots(1), [1]);
  assert.deepEqual(V.voiceSlots(2), [1, 4]);
  assert.deepEqual(V.voiceSlots(3), [1, 2, 4]);
  assert.deepEqual(V.voiceSlots(4), [1, 2, 3, 4]);
  assert.deepEqual(V.voiceSlots(5), [1, 2, 3, 4, 5]);
});

test('the detector: a crossing, an overlap and a unison, in small cases', () => {
  const ev = (pitches) => pitches.map((m, i) => ({ t: i, d: 1, midi: m, pitch: 'X' }));
  assert.deepEqual(V.voiceSpans([ev([72, 72]), ev([60, 60])]), []);
  const cross = V.voiceSpans([ev([60, 60]), ev([67, 67])]);
  assert.equal(cross.length, 1);
  assert.deepEqual([cross[0].kind, cross[0].from, cross[0].to], ['crossing', 0, 2]);
  const uni = V.voiceSpans([ev([65, 65]), ev([65, 60])]);
  assert.equal(uni[0].kind, 'unison');
  // the lower voice moves above the upper voice's previous note
  const ov = V.voiceSpans([ev([72, 80]), ev([60, 74])]);
  assert.ok(ov.some((s) => s.kind === 'overlap'), JSON.stringify(ov));
  // a crossing is one span however many notes it lasts
  assert.equal(V.voiceSpans([ev([60, 62, 64]), ev([67, 69, 71])]).filter((s) => s.kind === 'crossing').length, 1);
  assert.deepEqual(V.voiceSpans([[{ t: 0, d: 1, rest: true }], ev([60])]), []);
});

test('tonal: the example tagged crossing is found, the model examples have none', () => {
  const errors = tonal.filter((e) => e.intent === 'error');
  const crossing = errors.filter((e) => (e.expect ?? []).includes('crossing'));
  assert.ok(crossing.length > 0, 'the pack has a crossing example');
  for (const e of crossing) assert.ok(crossings(e.realized.voices).some((s) => s.kind === 'crossing'), e.id);
  const overlap = errors.filter((e) => (e.expect ?? []).includes('overlap'));
  for (const e of overlap) assert.ok(crossings(e.realized.voices).length > 0, `${e.id} (overlap)`);
  const models = tonal.filter((e) => e.intent === 'model' && !(e.allow ?? []).some((a) => a === 'crossing' || a === 'overlap'));
  const noisy = models.filter((e) => crossings(e.realized.voices).length > 0).map((e) => `${e.id}: ${crossings(e.realized.voices).map((s) => `${s.kind} ${s.upper}/${s.lower}@${s.from}`).join(', ')}`);
  assert.deepEqual(noisy, [], 'model examples report no crossing or overlap');
});

test('partimento: a crossing is only found where the pack allows it (cross: true)', () => {
  const marked = partimento.filter((e) => e.cross);
  assert.ok(marked.length > 0);
  // cross: true means crossing is allowed, not that it happens: some of the five do not cross in their realization
  assert.ok(marked.some((e) => crossings(e.realized.voices).length > 0), 'at least one marked example crosses');
  for (const e of partimento.filter((x) => !x.cross)) assert.deepEqual(V.voiceSpans(e.realized.voices).filter((s) => s.kind === 'crossing'), [], `${e.id} crosses without being marked`);
});

// Fux Fig. 55 is the one example where the counterpoint, written above the cantus, dips below it (beats 33 to 35);
// the rule engine does not report it, the detector does (logged in CONTENT_ISSUES.md)
const KNOWN_FUX_CROSSINGS = new Set(['fig55']);

test('counterpoint and fugue: crossings only where the data really crosses', () => {
  for (const [id, e] of fux) {
    const voices = e.voices.map((v) => eventsFromWholeNotes(v.notes));
    for (const alt of [voices, ...(e.toggle ? [e.toggle.alt.map((v) => eventsFromWholeNotes(v.notes))] : [])]) {
      const bad = V.voiceSpans(alt).filter((s) => s.kind === 'crossing');
      if (KNOWN_FUX_CROSSINGS.has(id)) continue;
      assert.deepEqual(bad.map((s) => `${s.upper}/${s.lower}@${s.from}`), [], `Fux ${id} (${e.fig}): the engine does not report a crossing, so neither may the detector`);
    }
  }
  for (const [id, e] of fugue) {
    const voices = e.voices.map((v) => eventsFromWholeNotes(v.notes));
    assert.deepEqual(V.voiceSpans(voices).filter((s) => s.kind === 'crossing').length, 0, `fugue ${id}`);
  }
});

test('7th and leading tone: V7 marks its 7th and 3rd, vii° its root', () => {
  const mk = (label, root, pitches) => ({ analysis: [{ t: 0, label, root }], realized: { voices: pitches.map((m) => [{ t: 0, d: 1, midi: m, pitch: 'X' }]) } });
  const v7 = V.roleMarks(mk('V7', 'G', [74, 71, 67, 55, 65].slice(0, 4)));
  assert.deepEqual(v7.map((m) => m.role).sort(), ['lt']);
  const g7 = V.roleMarks(mk('V7', 'G', [77, 71, 62, 55]));
  assert.deepEqual(g7.map((m) => [m.voice, m.role]).sort(), [[0, 'seventh'], [1, 'lt']]);
  const vii = V.roleMarks(mk('vii°6', 'B', [74, 71, 65, 62]));
  assert.deepEqual(vii.map((m) => [m.voice, m.role]), [[1, 'lt']]);
  assert.deepEqual(V.roleMarks(mk('I', 'C', [76, 72, 67, 48])), []);
  assert.deepEqual(V.roleMarks(mk('V7/V', 'D', [81, 78, 72, 62])).map((m) => m.role).sort(), ['lt', 'seventh']);
  // the pack's own examples: the tonal slices carry a root
  const withRoot = tonal.filter((e) => e.intent === 'model').flatMap((e) => e.realized.slices).filter((s) => s.root);
  assert.ok(withRoot.length > 100);
});
