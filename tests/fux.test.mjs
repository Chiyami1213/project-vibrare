// The Fux rule engine (a port of the pack's own) against the results the pack stored for every example, and the
// workbench builder: a model can be generated in every mode and the checker accepts it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as FE from '../src/scripts/counterpoint/engine.js';

const fux = JSON.parse(readFileSync(new URL('../content/counterpoint/data/fux.json', import.meta.url), 'utf8'));

const toVoices = (voices) => voices.map((v) => ({ role: v.role || 'cpt', species: v.species || 1, notes: v.notes }));
const only = (ex, issues) => (ex.only ? issues.filter((i) => ex.only.includes(i.rule)) : issues);
const key = (i) => `${i.level}|${i.rule}|${i.v}|${i.t}`;

test('every example gives exactly the issues the pack stored', () => {
  let n = 0;
  for (const [id, ex] of Object.entries(fux.examples)) {
    if (ex.check === false) continue;
    const got = only(ex, FE.analyze(toVoices(ex.voices)).issues).map(key).sort();
    const want = (ex.engineResult ?? []).map(key).sort();
    assert.deepEqual(got, want, `${id} ${ex.fig}`);
    n++;
    if (ex.toggle) {
      const g2 = only(ex, FE.analyze(toVoices(ex.toggle.alt)).issues).map(key).sort();
      assert.deepEqual(g2, (ex.toggle.engineResult ?? []).map(key).sort(), `${id} (toggled)`);
      n++;
    }
  }
  assert.ok(n >= 22, `checked ${n} scores`);
});

test('the six cantus firmi in the engine are the ones in the data file', () => {
  for (const [m, spec] of Object.entries(fux.modes)) assert.deepEqual(FE.MODES[m].cf, spec.cf, m);
});

test('a model can be generated in every mode, in two voices, and the checker accepts it', () => {
  for (const mode of Object.keys(FE.MODES)) {
    for (const cfPos of [0, 1]) {
      const base = FE.buildExercise(mode, 2, cfPos, 1, 1 - cfPos, {});
      const solved = FE.solve(base, mode, { maxNodes: 60000, maxMs: 4000, seed: 7 });
      assert.ok(solved, `${mode} with the cantus in voice ${cfPos}`);
      assert.equal(FE.analyze(solved).errors.length, 0, `${mode} ${cfPos}`);
    }
  }
});

test('every species can be generated in two voices on the Dorian cantus', () => {
  for (const sp of [2, 3, 4, 5]) {
    const base = FE.buildExercise('D', 2, 1, sp, 0, { rest: sp === 2 });
    const solved = FE.solve(base, 'D', { maxNodes: 60000, maxMs: 6000, seed: 11 });
    assert.ok(solved, `species ${sp}`);
    assert.equal(FE.analyze(solved).errors.length, 0, `species ${sp}`);
  }
});
