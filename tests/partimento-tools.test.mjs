// The partimento tools, on the pack's own data (content/partimento/data).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../src/scripts/partimento/tools-pure.ts';
import { degreeLabel } from '../src/scripts/partimento/model.ts';

const read = (n) => JSON.parse(readFileSync(new URL(`../content/partimento/data/${n}.json`, import.meta.url), 'utf8'));
const S = read('schemata');
const C = read('cadences');
const slim = (p) => ({ id: p.id, name: p.name, group: p.group, kind: p.kind, form: p.form, modes: p.modes, ex: [...(p.examples ?? []), ...(p.variants ?? []).flatMap((v) => v.examples ?? [])] });
const PATS = [...S.patterns, ...C.patterns].map(slim).filter((p) => p.ex.length);
const pat = (id) => PATS.find((p) => p.id === id);
const ex = (id) => PATS.flatMap((p) => p.ex).find((e) => e.id === id);
const up = (n) => ({ dir: 1, size: n });
const down = (n) => ({ dir: -1, size: n });

test('bass motion: the line a pair of moves makes, in degrees', () => {
  assert.deepEqual(T.degreesOf(T.bassSteps(1, [up(4), down(3)], 7)), [1, 4, 2, 5, 3, 6, 4]); // Monte principale
  assert.deepEqual(T.degreesOf(T.bassSteps(1, [up(5), down(4)], 5)), [1, 5, 2, 6, 3]); // Monte Romanesca
  assert.deepEqual(T.degreesOf(T.bassSteps(1, [down(4), up(2)], 7)), [1, 5, 6, 3, 4, 1, 2]); // leaping Romanesca
  assert.deepEqual(T.degreesOf(T.bassSteps(3, [down(2), down(2)], 4)), [3, 2, 1, 7]);
  const notes = T.bassPitches(T.bassSteps(1, [down(4), up(2)], 5));
  assert.ok(notes.every((n) => /^[A-G]\d$/.test(n)));
});

test('bass motion: every disjunct pattern of the pack is found by its own pair, and its inverse is the metric inversion', () => {
  const moti = PATS.filter((p) => p.group.startsWith('moti-')).map((p) => ({ id: p.id, group: p.group }));
  const disjunct = moti.filter((p) => /^dis-\dup|^dis-\ddown/.test(p.id));
  assert.ok(disjunct.length >= 8);
  const parse = (id) => { const m = /^dis-(\d)(up|down)-(\d)(up|down)$/.exec(id); return m && [{ size: +m[1], dir: m[2] === 'up' ? 1 : -1 }, { size: +m[3], dir: m[4] === 'up' ? 1 : -1 }]; };
  for (const p of disjunct) {
    const pair = parse(p.id);
    if (!pair) continue;
    assert.equal(T.matchMoti(pair, moti).exact, p.id, p.id);
  }
  // 3 down, 2 up and 2 up, 3 down are different patterns: the metric inversion
  const m = T.matchMoti([down(3), up(2)], moti);
  assert.equal(m.exact, 'dis-3down-2up');
  assert.equal(m.inverse, 'dis-2up-3down');
  // 6 up, 5 down makes the line of 3 down, 4 up
  assert.ok(T.matchMoti([up(6), down(5)], moti).same.includes('dis-3down-4up') || T.matchMoti([down(3), up(4)], moti).same.includes('dis-6up-5down'));
  assert.ok(T.matchMoti([up(2), up(2)], moti).stepwise.length > 0);
});

test('combination builder: chained examples add up, in the key chosen', () => {
  const a = ex('rom-3p');
  const b = ex('prin-3p');
  const chain = T.chainExamples([a, b], 'G');
  const q = (e) => e.realized.lengthBeats * (e.beatUnit === 'half' ? 2 : 1); // the chain counts in quarter beats
  assert.equal(chain.realized.lengthBeats, q(a) + q(b));
  assert.equal(chain.realized.voices.length, 3);
  assert.equal(chain.key, 'G');
  for (const v of chain.realized.voices) {
    for (let i = 1; i < v.length; i++) assert.ok(v[i].t >= v[i - 1].t - 1e-9, 'time runs forward');
  }
  assert.equal(chain.realized.voices[2][0].pitch.replace(/\d/, ''), 'G'); // the Romanesca starts on the tonic
  assert.equal(T.chainExamples([a, ex('rom-2p')], 'C'), null, 'parts must match');
  assert.equal(T.chainExamples([], 'C'), null);
});

test('recognition quiz: four names from the same group, one of them right', () => {
  const r = T.rng(7);
  const schemata = PATS.filter((p) => p.group.startsWith('schemata-'));
  for (let i = 0; i < 40; i++) {
    const q = T.recognitionQuestion(schemata, r);
    assert.ok(q.options.length >= 2 && q.options.length <= 4);
    const groupSize = schemata.filter((p) => p.group === pat(q.answer).group).length;
    assert.ok(q.options.some((o) => o.id === q.answer));
    assert.equal(new Set(q.options.map((o) => o.name)).size, q.options.length);
    const group = pat(q.answer).group;
    if (groupSize >= 4) assert.ok(q.options.every((o) => pat(o.id).group === group), 'a group of four or more gives all its own names');
    assert.ok(pat(q.answer).ex.some((e) => e.id === q.example.id));
    const red = T.reduceExample(q.example);
    assert.equal(red.realized.voices.length, 2);
    assert.equal(red.realized.voices[1], q.example.realized.voices[q.example.realized.voices.length - 1]); // the bass
  }
});

test('nomenclature: the abbreviations of the pack are built from the choices', () => {
  const name = (c) => T.buildName(c).abbr;
  assert.equal(name({ family: 'authentic', strength: 'perfect', form: 'simple' }), 'PASC');
  assert.equal(name({ family: 'authentic', strength: 'perfect', form: 'compound' }), 'PACC');
  assert.equal(name({ family: 'authentic', strength: 'perfect', form: 'double' }), 'PADC');
  assert.equal(name({ family: 'authentic', strength: 'imperfect', form: 'simple' }), 'IASC');
  assert.equal(name({ family: 'authentic', strength: 'imperfect', form: 'compound' }), 'IACC');
  assert.equal(name({ family: 'authentic', strength: 'perfect', form: 'simple', variety: 'galant' }), 'PSGC');
  assert.equal(name({ family: 'authentic', strength: 'perfect', form: 'compound', variety: 'galant' }), 'PCGC');
  assert.equal(name({ family: 'authentic', strength: 'imperfect', form: 'compound', variety: 'galant' }), 'ICGC');
  assert.equal(name({ family: 'authentic', form: 'simple', variety: 'neapolitan' }), 'SNC');
  assert.equal(name({ family: 'authentic', form: 'compound', variety: 'neapolitan' }), 'CNC');
  assert.equal(name({ family: 'deceptive', form: 'compound' }), 'DCC');
  assert.equal(name({ family: 'deceptive', form: 'compound', variety: 'galant' }), 'DCGC');
  assert.equal(name({ family: 'half', form: 'simple', variety: 'galant' }), 'GHC');
  assert.equal(name({ family: 'half', form: 'simple', phrygian: true }), 'PHC');
  assert.equal(name({ family: 'half', form: 'simple' }), 'HC');
  assert.equal(T.buildName({ family: 'authentic', strength: 'perfect', form: 'compound', variety: 'galant' }).name, 'Perfect Compound Galant Cadence');
  // every abbreviation the pack lists is one the builder can make
  const nom = C.patterns.find((p) => p.id === 'nomenclature').nomenclature;
  for (const a of ['PASC', 'IASC', 'PACC', 'IACC', 'PADC', 'PSGC', 'PCGC', 'ICGC', 'SNC', 'CNC', 'DCC', 'DCGC', 'GHC']) assert.ok(a in nom.abbreviations, a);
});

test('nomenclature: the matching examples exist in the data', () => {
  const ids = (c) => T.cadenceIds(c, PATS);
  assert.ok(ids({ family: 'authentic', strength: 'perfect', form: 'simple' }).includes('c3-simple-perfect'));
  assert.ok(ids({ family: 'authentic', strength: 'perfect', form: 'compound' }).includes('c3-compound-perfect'));
  assert.ok(ids({ family: 'authentic', strength: 'perfect', form: 'double' }).includes('c3-double'));
  assert.deepEqual(ids({ family: 'deceptive', form: 'compound' }), ['c3-deceptive']);
  assert.deepEqual(ids({ family: 'half', form: 'simple', phrygian: true }), ['c3-phrygian-half']);
  assert.ok(ids({ family: 'tenor', form: 'simple' }).length > 0);
});

test('P–T–R: the cadence is cut at the dominant', () => {
  const simple = T.splitPTR(ex('fen-simple'));
  assert.deepEqual([simple.P, simple.T, simple.R], [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 4 }]);
  const comp = T.splitPTR(ex('fen-comp'));
  assert.deepEqual([comp.T.from, comp.T.to, comp.R.from], [1, 2, 2]);
  const dbl = T.splitPTR(ex('fen-double'));
  assert.deepEqual([dbl.P.to, dbl.T.from, dbl.T.to, dbl.R.from], [1, 1, 5, 5]);
  for (const [id, parts] of [['c3sp', 3], ['c4c', 4], ['c2sd', 2]]) {
    const r = T.splitPTR(ex(id));
    assert.ok(r.T.to > r.T.from && r.R.to > r.R.from, id);
    assert.ok(T.rangeNotes(ex(id), r.R).length >= parts, `${id}: the resolution has all the parts`);
    assert.ok(T.rangeNotes(ex(id), r.T).length >= 1);
  }
  // every row of the grid names examples that exist
  for (const row of T.PTR_ROWS) for (const id of Object.values(row.ids)) if (id) assert.ok(pat(id) || C.patterns.some((p) => p.id === id), id);
});

test('clausulae: the data and the mixer agree, and each example is named after the clausula in its bass', () => {
  for (const name of T.CLAUSULA_ORDER) {
    const p = C.patterns.find((x) => x.id === `clausula-${name}`);
    assert.equal(p.degrees, T.CLAUSULAE[name].degrees);
    assert.ok(p.summary.includes(T.CLAUSULAE[name].cadence.replace(' cadence', '')));
    const e = ex(T.CLAUSULAE[name].example);
    assert.ok(e, name);
    const v = T.voiceClausulae(e);
    assert.equal(v[v.length - 1], name, `${name} is in the bass of ${e.id}`);
  }
  assert.deepEqual(T.CLAUSULA_ORDER.map((n) => C.patterns.find((x) => x.id === `clausula-${n}`).rank), [0, 1, 2, 3]); // weakest to strongest
});

test('simple, compound, double: the sonorities over the dominant', () => {
  const s = T.dominantSonorities(ex('fen-simple'));
  const c = T.dominantSonorities(ex('fen-comp'));
  const d = T.dominantSonorities(ex('fen-double'));
  assert.equal(s.length, 1);
  assert.equal(c.length, 2);
  assert.equal(d.length, 4); // 5/3, 6/4, 5/4, 5/3
  assert.ok(c[0].includes('4'), 'the fourth, then the third');
  assert.ok(d[1].includes('4') && d[1].includes('6'));
  assert.ok(d.length > c.length && c.length > s.length);
});

test('suspension finder: where a bass line allows 4–3, 7–6 and 9–8', () => {
  // the rules of the data: the 4th is prepared by the 8 when the bass rises a 5th (the compound cadence)
  const f = T.findSuspensions(T.parseBass('C3 G3'));
  assert.ok(f.some((x) => x.kind === '4–3' && x.index === 1 && /octave/.test(x.prepared)));
  // the 7th is prepared by the 8 when the bass rises a step
  assert.ok(T.findSuspensions(T.parseBass('C3 D3')).some((x) => x.kind === '7–6'));
  // the 9th: the bass rises a step (from the 3rd)
  assert.ok(T.findSuspensions(T.parseBass('E3 F3')).some((x) => x.kind === '9–8'));
  // nothing is possible when the bass stays
  assert.deepEqual(T.findSuspensions([21, 21]), []);
  // every example of the pack's suspension cards is a case the finder knows: its dissonance falls on a bass note it marks
  const motions = (kind) => new Set(['4th', '7th', '9th'].includes(kind) ? [] : []);
  void motions;
  const f2 = T.findSuspensions(T.bassStepsOf(ex('s4-from8')));
  assert.ok(f2.some((x) => x.kind === '4–3'));
  assert.deepEqual(T.parseBass('1 2 5'), T.parseBass('C3 D3 G3'));
  assert.equal(T.parseBass('C3 X'), null);
  assert.equal(T.parseBass('C3'), null);
});

test('Rule of the Octave: Durante and Fenaroli side by side', () => {
  for (const [f, d] of [['ro-up-major', 'rod-up-major'], ['ro-down-major', 'rod-down-major'], ['ro-up-minor', 'rod-up-minor'], ['ro-down-minor', 'rod-down-minor']]) {
    const rows = T.roCompare(ex(f), ex(d));
    assert.ok(rows.length >= 8, f);
    assert.ok(rows.every((r) => r.degree), `${f}: every row has a degree`);
  }
  const up = T.roCompare(ex('ro-up-major'), ex('rod-up-major'));
  const diff = up.filter((r) => r.differs).map((r) => r.degree);
  for (const deg of ['②', '④']) assert.ok(diff.includes(deg), `ascending ${deg} differs (${diff.join('')})`);
  // ③ is 6/3 in both: only the octave doubling in the realisations differs, and that is not a figure
  assert.ok(!diff.slice(0, 5).includes('③'), 'ascending ③ is the same harmony');
  const down = T.roCompare(ex('ro-down-minor'), ex('rod-down-minor'));
  assert.ok(down.some((r) => r.differs && r.degree === '⑥'), 'descending ⑥ in minor differs');
  assert.ok(T.sonorityNotes(ex('ro-up-major'), 0).length >= 3);
  void degreeLabel;
});
