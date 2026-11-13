// The fugue tools against the pack's reference page (tools/guide/main.js): tests/fixtures/fugue-reference.json holds what
// the reference code gives for the eight preset subjects (answers, strettos, mirrors) and the invertible-counterpoint
// presets; the port must give exactly the same.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as F from '../src/scripts/fugue/pure.ts';

const fx = JSON.parse(readFileSync(new URL('./fixtures/fugue-reference.json', import.meta.url), 'utf8'));
const note = (n) => (n.rest ? 'r' : F.nameOf(n.p)) + '/' + n.d + (n.mut ? '*' : '');
const line = (txt) => F.parseLine(txt);

test('answers: all eight preset subjects, tonal and real, match the reference page', () => {
  let n = 0;
  for (const [name, s] of Object.entries(F.SUBJECTS)) {
    for (const kind of ['tonal', 'real']) {
      assert.deepEqual(F.makeAnswer(line(s.line), s.key, kind).answer.map(note), fx.answers[`${name} | ${kind}`], `${name} ${kind}`);
      n++;
    }
  }
  assert.equal(n, 16);
});

test('answers: the teaching cases', () => {
  const ans = (txt, key, kind = 'tonal') => F.makeAnswer(line(txt), key, kind).answer.filter((x) => !x.rest).map((x) => F.nameOf(x.p));
  // a theme that opens on ⑤ is answered on ①: the fifth becomes a fourth
  assert.equal(ans('G4/2 C5/4 B4/4 A4/4 G4/4 F4/4 E4/4', 'C major')[0], 'C5');
  // a theme that stays in the key is answered by an exact transposition: nothing is marked
  assert.ok(!F.makeAnswer(line(F.SUBJECTS['C major · stays in the tonic (real answer)'].line), 'C major', 'tonal').answer.some((x) => x.mut));
  // a theme that ends on ⑤ leads the answer back to the tonic
  const rising = F.makeAnswer(line('C4/4 E4/4 D4/4 F4/4 E4/8 D4/8 C4/8 B3/8 C4/4 G4/4'), 'C major', 'tonal').answer;
  assert.equal(F.nameOf(rising[rising.length - 1].p), 'C5');
  // modes answer diatonically, a fifth up: Fux's D mode subject begins on D, its answer on A
  const dmode = ans('D4/2 F4/2 E4/2 D4/2 G4/2 F4/2 E4/2 D4/2', 'D mode');
  assert.equal(dmode[0], 'A4');
  assert.equal(dmode[dmode.length - 1], 'A4');
});

test('stretto finder: the eight best for every preset match the reference page', () => {
  for (const [name, s] of Object.entries(F.SUBJECTS)) {
    const got = F.strettoSearch(line(s.line), s.key, 0.5).slice(0, 8).map((r) => [r.dly, r.lab, r.score, r.diss, r.par]);
    assert.deepEqual(got, fx.strettos[name], name);
  }
});

test('inversion mirror: strict and free, all presets, match the reference page', () => {
  for (const [name, s] of Object.entries(F.SUBJECTS)) {
    for (const how of ['strict', 'free']) {
      assert.deepEqual(F.mirror(line(s.line), s.key, how).inv.map(note), fx.mirror[`${name} | ${how}`], `${name} ${how}`);
    }
  }
  // Fux's Dorian axis: d to d, e to c, f to b, g to a
  const inv = F.mirror(line('D4/1 E4/1 F4/1 G4/1'), 'D mode', 'strict').inv.map((n) => F.nameOf(n.p).replace(/\d/, ''));
  assert.deepEqual(inv, ['D', 'C', 'B', 'A']);
});

test('invertible counterpoint: intervals, inversions and flags match the reference page', () => {
  for (const [name, p] of Object.entries(F.DC_PRESETS)) {
    for (const sp of [8, 10, 12]) {
      const rows = F.dcAnalyse(line(p.up), line(p.lo), sp).map((r) => [r.t, r.x, r.n, r.inv, r.flags]);
      assert.deepEqual(rows, fx.dc[`${name} | ${sp}`], `${name} at ${sp}`);
    }
  }
  // the rules the species give
  const flags = (up, lo, sp) => F.dcAnalyse(line(up), line(lo), sp).flatMap((r) => r.flags);
  assert.ok(flags('A4/1 A4/1', 'D4/1 D4/1', 8).includes('5th → 4th'));
  assert.ok(flags('F4/1 G4/1 A4/1 Bb4/1', 'D4/1 E4/1 F4/1 G4/1', 10).some((f) => /consecutive 3rds/.test(f)));
  assert.deepEqual(flags('F4/1 G4/1', 'D4/1 E4/1', 12), []);
  assert.equal(F.DC[8].inv(3), 6);
  assert.equal(F.DC[10].inv(6), 5);
  assert.equal(F.DC[12].inv(5), 8);
});

test('entry orders: 24 orders, 8 regular (inner and outer voices paired)', () => {
  const o = F.entryOrders();
  assert.equal(o.length, 24);
  assert.equal(o.filter((x) => x.regular).length, 8);
  assert.ok(o.find((x) => x.order.join('') === 'SATB').regular);
  assert.ok(!o.find((x) => x.order.join('') === 'SABT').regular);
});

test("Fux's plan: the exceptions for E, F and A", () => {
  assert.match(F.FUX_PLAN.E[1], /C \(6th/);
  assert.match(F.FUX_PLAN.F[2], /7–6/);
  assert.match(F.FUX_PLAN.A[4], /B/);
  assert.equal(F.fuxPlanSteps('D').length, 6);
});

test('timeline, glossary and quiz keep the sizes the pack gives', () => {
  assert.equal(F.TIMELINE.length, 30);
  assert.equal(F.TERMS_EVOLUTION.length, 16);
  assert.equal(F.QUIZ.length, 12);
  for (const q of F.QUIZ) assert.ok(q.answer >= 0 && q.answer < q.options.length);
});

test('proportions: the demo data of the pack', () => {
  const a = F.proportions([2, 3, 3.5, 5, 8.5]); // BWV 578 digressions
  assert.ok(a.growing && !a.shrinking && !a.palindrome);
  const b = F.proportions([2, 3.5, 3.5, 5, 5, 3.5, 3.5, 2]); // BWV 533 spacing
  assert.ok(b.palindrome);
  assert.ok(F.proportions([2, 1]).ratios[0].name === '2:1');
  assert.equal(F.proportions([3, 2]).ratios[0].name, '3:2');
});

test('worksheet: the demonstration exports to Markdown, and section lengths are read', () => {
  const w = F.worksheetDemo();
  assert.equal(w.entries.map((e) => e.bar).join(','), '1,3,7,11,15,20,26');
  assert.equal(w.properties.length, 6);
  const md = F.worksheetMarkdown({ ...w, lengths: '2, 3, 3.5, 5, 8.5' });
  assert.match(md, /BWV 847/);
  assert.match(md, /\| 26 \|/);
  assert.match(md, /successively longer/);
  assert.match(md, /rhetorical/);
  assert.deepEqual(F.parseLengths('2, 3 4;5'), [2, 3, 4, 5]);
  assert.equal(F.parseLengths('2, x'), null);
  assert.equal(F.parseLengths('2'), null);
});
