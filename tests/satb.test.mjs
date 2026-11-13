import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { check, checkExample, realize, figures, analyse, P, toPlayer } from '../src/scripts/harmony/satb.ts';

const read = (f) => JSON.parse(readFileSync(new URL(`../content/tonal-harmony/data/${f}.json`, import.meta.url), 'utf8'));
const EXAMPLES = ['p1', 'p2', 'p3', 'p5', 'p6'].flatMap((p) => read(`part-${p}`).topics.flatMap((t) => (t.examples ?? []).map((e) => ({ ...e, topic: t.id }))));

test('the pack has 154 examples', () => assert.equal(EXAMPLES.length, 154));

test('the ported checker gives, for every example, exactly the issues stored with it', () => {
  let n = 0;
  for (const e of EXAMPLES) {
    const got = checkExample(realize(e.notation), e.intent, e.allow ?? []).map((i) => [i.type, i.level, i.beat, JSON.stringify(i.voices), i.detail]);
    const want = (e.checker ?? []).map((i) => [i.type, i.level, i.beat, JSON.stringify(i.voices), i.detail]);
    assert.deepEqual(got, want, `${e.topic} / ${e.id}`);
    n++;
  }
  assert.equal(n, 154);
});

test('model examples have no issue, and each error example shows the faults it is meant to show', () => {
  for (const e of EXAMPLES) {
    if (e.intent !== 'model' && e.intent !== 'error') continue;
    const types = [...new Set(checkExample(realize(e.notation), e.intent, e.allow ?? []).map((i) => i.type))].sort();
    if (e.intent === 'model') assert.deepEqual(types, [], `${e.id} should be clean`);
    if (e.intent === 'error') assert.deepEqual(types, [...(e.expect ?? [])].sort(), `${e.id} should show exactly ${e.expect}`);
  }
});

test('the realized voices and the analysis rows match what the pack stores', () => {
  for (const e of EXAMPLES) {
    const real = realize(e.notation);
    checkExample(real, e.intent, e.allow ?? []); // the check also works out each chord's figures
    const r = toPlayer(real);
    assert.equal(r.voices.length, e.parts, e.id);
    assert.deepEqual(r.voices.map((v) => v.map((x) => x.midi ?? null)), e.realized.voices.map((v) => v.map((x) => x.midi ?? null)), `${e.id} pitches`);
    assert.deepEqual(r.slices.map((s) => [s.t, s.label, s.figures]), e.realized.slices.map((s) => [s.t, s.label, s.figures]), `${e.id} analysis`);
  }
});

test('small pieces: pitches, figures and chord analysis', () => {
  assert.equal(P.parse('F#4').midi, 66);
  assert.equal(P.parse('Bb3').name(), 'Bb3');
  assert.equal(P.parse('En4').shownat, true);
  assert.equal(figures(['E4', 'G4', 'C5', 'C3'].map((x) => P.parse(x)).reverse().reverse()), '5/3');
  const an = analyse(['G4', 'B4', 'D5', 'G3'].map((x) => P.parse(x)));
  assert.equal(an.root.name(), 'G4'); // the first voice whose letter stacks in thirds, as in the Python
  assert.equal(analyse(['C4', 'D4', 'E4'].map((x) => P.parse(x))), null);
  // the module's own examples
  assert.ok(check(realize('I:G4,E4,C4,C3 ii:A4,F4,D4,D3')).some((i) => i.type === 'parallel'));
});
