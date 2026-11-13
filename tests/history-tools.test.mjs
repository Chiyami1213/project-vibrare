// The tests the packs give for the nine History tools (tools[].tests in the history packs).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/scripts/history-tools/pure.ts';

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const melody = (s) => T.parseMelody(s).notes;

test('quarter-comma meantone: C–E 386.3, every fifth 696.6 except the wolf G♯–E♭ near 737.6', () => {
  const c = T.SYSTEMS.mt14.cents();
  near(c[4] - c[0], 386.3, 0.1, 'C–E');
  const { fifths } = T.intervalsOf(c);
  for (let pc = 0; pc < 12; pc++) if (pc !== 8) near(fifths[pc], 696.6, 0.1, `fifth on ${T.NAMES[pc]}`);
  near(fifths[8], 737.6, 0.2, 'wolf');
});

test('Pythagorean: C–E 407.8, the G♯–E♭ fifth near 678.5', () => {
  const c = T.SYSTEMS.pyth.cents();
  near(c[4] - c[0], 407.8, 0.1, 'C–E');
  near(T.intervalsOf(c).fifths[8], 678.5, 0.1, 'G♯–E♭');
});

test('equal temperament: every interval a multiple of 100 cents', () => {
  const c = T.SYSTEMS.et.cents();
  const { fifths, thirds } = T.intervalsOf(c);
  for (const v of [...fifths, ...thirds]) assert.equal(v % 100, 0);
});

test('every tuning system gives twelve notes starting on C', () => {
  for (const [k, s] of Object.entries(T.SYSTEMS)) {
    const c = s.cents();
    assert.equal(c.length, 12, k);
    near(c[0], 0, 1e-9, k);
  }
});

test('gamut: C D E F G A is ut re mi fa sol la in the natural hexachord', () => {
  const r = T.solmize(melody('C D E F G A'));
  assert.deepEqual(r.map((x) => x.syl), ['ut', 're', 'mi', 'fa', 'sol', 'la']);
  assert.ok(r.every((x) => x.hex === 'nat'));
});

test('gamut: G A B C D E F with B natural begins in the hard hexachord and mutates to the natural one', () => {
  const r = T.solmize(melody('G A B C D E F'));
  assert.deepEqual(r.slice(0, 4).map((x) => x.syl), ['ut', 're', 'mi', 'fa']);
  assert.equal(r[0].hex, 'hard');
  assert.ok(r.some((x) => x.mut), 'a mutation is marked');
  assert.equal(r[r.length - 1].hex, 'nat');
});

test('gamut: F G A Bb is ut re mi fa in the soft hexachord', () => {
  const r = T.solmize(melody('F G A Bb'));
  assert.deepEqual(r.map((x) => x.syl), ['ut', 're', 'mi', 'fa']);
  assert.ok(r.every((x) => x.hex === 'soft'));
});

test('gamut: a note outside every hexachord (F♯) cannot be solmized', () => {
  assert.equal(T.solmize(melody('F# G A')), null);
});

test('modes: finals, ambitus and tenors', () => {
  const m = (n) => T.MODES12[n - 1];
  assert.deepEqual([m(1).fin, m(1).lo, m(1).hi, m(1).ten], ['D4', 'D4', 'D5', 'A4']);
  assert.deepEqual([m(2).fin, m(2).lo, m(2).hi, m(2).ten], ['D4', 'A3', 'A4', 'F4']);
  assert.equal(m(3).ten[0], 'C');
  assert.deepEqual([m(8).fin[0], m(8).ten[0]], ['G', 'C'].map((x, i) => (i === 0 ? 'G' : 'C')));
  assert.equal(T.MODES12.length, 12);
});

test('organum at the fourth never goes below the boundary tone, and the last vertical is a unison', () => {
  for (const chant of ['D4 E4 F4 E4 D4 F4 G4 F4 E4 D4', 'G4 A4 C5 B4 A4 G4', 'D4 F4 G4 A4 G4 F4 E4 D4']) {
    const r = T.organum(chant.split(' '), 'fourth');
    assert.ok(r.boundary, 'has a boundary tone');
    const midi = (p) => T.parseMelody(p).notes[0].midi;
    for (const o of r.organal) assert.ok(midi(o) >= midi(r.boundary), `${o} against ${r.boundary}`);
    assert.equal(r.intervals[r.intervals.length - 1], 0, 'unison at the end');
  }
});

test('organum: parallel fifths are flagged by the contrapunctus check', () => {
  const r = T.organum('D4 E4 F4 E4 D4'.split(' '), 'fifth');
  assert.ok(r.issues.some((i) => /parallel fifths/.test(i)), r.issues.join('; '));
});

test('rhythmic modes and mensuration', () => {
  assert.deepEqual(T.RHYTHMIC_MODES[0].durs, [2, 1]); // mode 1: long, breve = quarter, eighth in 6/8
  const a = T.mensuration('perf', 'maj');
  assert.deepEqual([a.total, a.modern, a.sign], [9, '9/8', '⊙']);
  const b = T.mensuration('imp', 'min');
  assert.deepEqual([b.total, b.modern, b.sign], [4, '2/4', 'C']);
  assert.equal(T.mensuration('perf', 'min').modern, '3/4');
  assert.equal(T.mensuration('imp', 'maj').modern, '6/8');
});

test('Tonnetz: R, L and P from C major, and the hexatonic cycle', () => {
  const C = { r: 0, q: 'maj' };
  assert.equal(T.triName(T.transform(C, 'R')), 'a minor');
  assert.equal(T.triName(T.transform(C, 'L')), 'e minor');
  assert.equal(T.triName(T.transform(C, 'P')), 'c minor');
  assert.equal(T.triName(T.transform(T.transform(C, 'R'), 'L')), 'F major');
  let t = C;
  for (let i = 0; i < 6; i++) t = T.transform(t, i % 2 === 0 ? 'P' : 'L');
  assert.deepEqual(t, C);
  for (const op of ['P', 'L', 'R']) assert.deepEqual(T.transform(T.transform(C, op), op), C, `${op} undoes itself`);
});

test('fundamental bass: roots, inversions, the seventh chord and double emploi', () => {
  const rows = (s) => T.analyseChords(s);
  assert.equal(rows('C E G')[0].root, 0);
  assert.equal(rows('E G C')[0].root, 0); // an inversion
  assert.equal(rows('G B D F')[0].root, 7);
  const fa = rows('C E G | F A C D | G B D F | C E G');
  assert.notEqual(fa[1].alt, undefined, 'F–A–C–D has a second reading');
  assert.notEqual(fa[1].rin, fa[1].rout, 'F in, D out: double emploi');
  assert.deepEqual([fa[1].rin, fa[1].rout], [5, 2]);
  assert.deepEqual(T.rootMotion(fa), ['up 4th / down 5th ✓', 'up 4th / down 5th ✓', 'up 4th / down 5th ✓']);
  assert.equal(T.analyseChords('C X G'), null);
});

test('twelve-tone matrix: rows validate, the matrix is a Latin square, the chromatic scale is combinatorial', () => {
  const berg = T.parseRow('G Bb D F# A C E G# B C# Eb F');
  assert.ok(berg, 'Berg row validates');
  assert.equal(T.parseRow('C D E'), null);
  assert.equal(T.parseRow('C C D E F G A B Db Eb Gb Ab'), null);
  const { M } = T.rowMatrix(berg);
  assert.deepEqual(M[0], berg);
  for (const r of M) assert.equal(new Set(r).size, 12);
  for (let j = 0; j < 12; j++) assert.equal(new Set(M.map((r) => r[j])).size, 12);
  const chrom = T.rowMatrix(T.parseRow('0 1 2 3 4 5 6 7 8 9 10 11'));
  assert.ok(chrom.pT.includes(6), 'P6 has the complementary hexachord');
  assert.ok(chrom.iT.length > 0, 'an inversion has it too');
});

test('Ursatz: three-line, five-line and interruption', () => {
  const u3 = T.ursatz(3, 'maj', false);
  assert.deepEqual(u3.sop.map((n) => n.p), ['E5', 'D5', 'C5']);
  assert.deepEqual(u3.bass.map((n) => n.p), ['C3', 'G2', 'C3']);
  const u5 = T.ursatz(5, 'maj', false);
  assert.deepEqual(u5.sop.map((n) => n.p), ['G5', 'F5', 'E5', 'D5', 'C5']);
  assert.equal(u5.bass[3].p, 'G2'); // V under the second degree
  const ui = T.ursatz(3, 'maj', true);
  assert.deepEqual(ui.sop.map((n) => n.p), ['E5', 'D5', 'E5', 'D5', 'C5']);
  assert.deepEqual(ui.bass.map((n) => n.p), ['C3', 'G2', 'C3', 'G2', 'C3']);
  assert.match(ui.label, /‖/);
  assert.equal(T.ursatz(3, 'min', false).sop[0].p, 'Eb5');
});
