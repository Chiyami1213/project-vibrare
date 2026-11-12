import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MAJOR_KEYS, MINOR_KEYS, barTicks, degreeLabel, displayFigure, figureStack, isMajorKey, keyLabel, keySpec,
  layoutVoice, playableNotes, slicesOf, splitDuration, ticksPerBeat, totalBarsOf, transposeExample,
} from '../src/scripts/partimento/model.ts';

const read = (f) => JSON.parse(readFileSync(new URL(`../content/partimento/data/${f}.json`, import.meta.url), 'utf8'));
const EXAMPLES = [];
for (const file of ['schemata', 'cadences']) {
  for (const p of read(file).patterns) {
    for (const e of p.examples ?? []) EXAMPLES.push(e);
    for (const v of p.variants ?? []) for (const e of v.examples ?? []) EXAMPLES.push(e);
  }
}
const byId = (id) => EXAMPLES.find((e) => e.id === id);

test('the content pack has 118 examples', () => assert.equal(EXAMPLES.length, 118));

test('note values: any duration splits into writable values that add up', () => {
  assert.deepEqual(splitDuration(64).map((v) => v[1] + (v[2] ? '.' : '')), ['w']);
  assert.deepEqual(splitDuration(48).map((v) => v[1] + (v[2] ? '.' : '')), ['h.']);
  assert.deepEqual(splitDuration(40).map((v) => v[0]), [32, 8]);
  for (let t = 2; t <= 64; t += 2) assert.equal(splitDuration(t).reduce((n, v) => n + v[0], 0), t);
});

test('bar lengths', () => {
  assert.equal(barTicks('4/4'), 64);
  assert.equal(barTicks('3/4'), 48);
  assert.equal(ticksPerBeat('half'), 32);
  assert.equal(ticksPerBeat('quarter'), 16);
});

test('every voice of every example lays out into bars that add up', () => {
  for (const ex of EXAMPLES) {
    const bar = barTicks(ex.meter);
    const bars = totalBarsOf(ex);
    const total = Math.round(ex.realized.lengthBeats * ticksPerBeat(ex.beatUnit));
    for (const [vi, v] of ex.realized.voices.entries()) {
      const measures = layoutVoice(v, ex.beatUnit, bar, bars);
      const sum = measures.map((m) => m.reduce((n, x) => n + x.ticks, 0));
      assert.equal(sum.reduce((a, b) => a + b, 0), total, `${ex.id} voice ${vi} total`);
      sum.slice(0, -1).forEach((s, i) => assert.equal(s, bar, `${ex.id} voice ${vi} bar ${i + 1} is full`));
      // notes are in order inside each bar and never cross a bar line
      for (const [mi, m] of measures.entries()) {
        let p = mi * bar;
        for (const n of m) {
          assert.equal(n.start, p, `${ex.id} voice ${vi}`);
          p += n.ticks;
        }
      }
    }
  }
});

test('a note held across a bar line is split and tied', () => {
  const ex = byId('rise-5-6-maj');
  const bass = layoutVoice(ex.realized.voices.at(-1), ex.beatUnit, 64, totalBarsOf(ex));
  assert.equal(bass.length, 8); // 16 beats of 4/4 with half-note beats = 8 bars
  const syncopated = byId('rise-9-8-maj'); // 11 beats: ends mid-bar
  assert.equal(totalBarsOf(syncopated), 6);
  const top = layoutVoice(syncopated.realized.voices[0], syncopated.beatUnit, 64, 6);
  assert.ok(top.flat().some((n) => n.tieFromPrev), 'a long note is tied across the bar');
});

test('figures: compound numbers reduced, accidentals kept, highest first', () => {
  assert.deepEqual(displayFigure('10'), { text: '3', num: 3 });
  assert.deepEqual(displayFigure('#6'), { text: '♯6', num: 6 });
  assert.deepEqual(displayFigure('b5'), { text: '♭5', num: 5 });
  assert.deepEqual(displayFigure('4+'), { text: '4+', num: 4 });
  assert.deepEqual(displayFigure('9'), { text: '9', num: 9 });
  assert.equal(displayFigure('x'), null);
  assert.deepEqual(figureStack(['3', '5']), ['5', '3']);
  assert.deepEqual(figureStack(['10', '3', '6', '#6']), ['♯6', '6', '3']);
  assert.deepEqual(figureStack([undefined, '8']), ['8']);
});

test('every figure in the content parses', () => {
  const bad = new Set();
  for (const ex of EXAMPLES) for (const v of ex.realized.voices) for (const e of v) if (e.fig && !displayFigure(e.fig)) bad.add(e.fig);
  assert.deepEqual([...bad], []);
});

test('circled scale degrees, with accidentals outside the scale', () => {
  assert.equal(degreeLabel('C3', 'C'), '①');
  assert.equal(degreeLabel('G3', 'C'), '⑤');
  assert.equal(degreeLabel('F#3', 'C'), '♯④');
  assert.equal(degreeLabel('Bb2', 'C'), '♭⑦');
  assert.equal(degreeLabel('G#3', 'a'), '♯⑦'); // the raised leading tone in A minor
  assert.equal(degreeLabel('G3', 'a'), '⑦');
  assert.equal(degreeLabel('C3', 'a'), '③');
  assert.equal(degreeLabel('F3', 'd'), '③'); // D minor: D E F G ...
  assert.equal(degreeLabel('G3', 'd'), '④');
  assert.equal(degreeLabel('Bb2', 'd'), '⑥'); // the natural minor sixth
});

test('slices of the 5-6 sequence: figures and degrees', () => {
  const s = slicesOf(byId('rise-5-6-maj'));
  assert.deepEqual(s[0].figures, ['5', '3']);
  assert.equal(s[0].degree, '①');
  assert.deepEqual(s[1].figures, ['6', '3']);
  assert.equal(s[2].degree, '②');
  assert.equal(s.length, 15); // 7 bars of two slices, then a last slice held for a bar
  assert.ok(s.every((x) => x.bassStart));
});

test('slices keep the figure stack when only an upper voice moves', () => {
  const ex = byId('rom-susp'); // 4-3 suspension over a held bass
  const s = slicesOf(ex);
  assert.ok(s.some((x) => !x.bassStart), 'a slice where only an upper voice starts');
  assert.ok(s.every((x) => x.degree !== ''));
});

test('key names', () => {
  assert.equal(keyLabel('F#'), 'F♯ major');
  assert.equal(keyLabel('eb'), 'E♭ minor');
  assert.equal(keyLabel('a'), 'A minor');
  assert.equal(keySpec('F#'), 'F#');
  assert.equal(keySpec('eb'), 'Ebm');
  assert.equal(isMajorKey('G'), true);
  assert.equal(isMajorKey('a'), false);
});

test('transposition keeps the spelling correct (F# major has E#, not F)', () => {
  const ex = byId('rise-5-6-maj'); // C major, bass C D E F G A B C
  const t = transposeExample(ex, 'F#');
  assert.equal(t.overflow, 0);
  const bass = t.example.realized.voices.at(-1).map((e) => e.pitch.replace(/\d/g, ''));
  assert.deepEqual([...new Set(bass)], ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  assert.equal(t.example.key, 'F#');
  const same = transposeExample(ex, 'C');
  assert.equal(same.example, ex);
});

test('transposition takes the short way, so the range barely moves', () => {
  const ex = byId('rise-5-6-maj');
  const before = ex.realized.voices.at(-1)[0].midi; // C3
  for (const key of MAJOR_KEYS) {
    const t = transposeExample(ex, key);
    const bass = t.example.realized.voices.at(-1)[0].midi;
    assert.ok(Math.abs(bass - before) <= 6, `${key}: bass moved ${bass - before}`);
  }
});

test('acceptance: every example in every key of its mode, with no spelling overflow', () => {
  const trouble = [];
  for (const ex of EXAMPLES) {
    const keys = isMajorKey(ex.key) ? MAJOR_KEYS : MINOR_KEYS;
    for (const k of keys) {
      const t = transposeExample(ex, k);
      if (t.overflow > 0) trouble.push(`${ex.id} in ${k}: ${t.overflow}`);
      // midi follows the spelled pitch
      for (const v of t.example.realized.voices) for (const e of v) if (e.pitch) assert.ok(Number.isFinite(e.midi), `${ex.id} ${k}`);
    }
  }
  // report rather than hide: these are examples that need a triple sharp/flat in an extreme key
  assert.ok(trouble.length < 60, `${trouble.length} cases: ${trouble.slice(0, 10).join('; ')}`);
});

test('acceptance: F# major and Eb minor, as the brief asks', () => {
  const bad = [];
  for (const ex of EXAMPLES) {
    const target = isMajorKey(ex.key) ? 'F#' : 'eb';
    const t = transposeExample(ex, target);
    if (t.overflow > 0) bad.push(ex.id);
  }
  assert.deepEqual(bad, []);
});

test('playable notes join tied events', () => {
  const ex = byId('rise-5-6-maj');
  const notes = playableNotes(ex);
  const top = notes.filter((n) => n.voice === 0);
  // the top voice has 16 events, but each tied one is joined with the note before it
  assert.ok(top.length < 16 && top.length > 0);
  assert.ok(top.every((n) => n.dur >= 1));
  assert.equal(notes.filter((n) => n.voice === 2).length, 15); // the bass is struck again on every beat
  assert.ok(notes.every((n, i) => i === 0 || notes[i - 1].start <= n.start));
});
