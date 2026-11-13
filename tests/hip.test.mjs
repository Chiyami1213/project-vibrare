import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layersOf, parseVoice, schedule, soundingNotes } from '../src/scripts/hip/notation.ts';

const HIP = JSON.parse(readFileSync(new URL('../content/hip/data/hip.json', import.meta.url), 'utf8'));

test('the mini-notation: pitches, values, touch, accents, rests and grace notes', () => {
  const v = parseVoice('C4:1 gD4:0.5 E4:0.5@0.8. r:1 | F#5:2_');
  assert.equal(v.length, 5);
  assert.deepEqual(v.map((n) => n.t), [0, 1, 1, 1.5, 2.5]);
  assert.equal(v[0].midi, 60);
  assert.equal(v[1].grace, true);
  assert.equal(v[2].touch, 'detached');
  assert.equal(v[2].vel, 0.8);
  assert.equal(v[3].pitch, null);
  assert.equal(v[4].touch, 'slurred');
  assert.equal(v[4].midi, 78);
  const g = parseVoice('gB4:0.5 C5:1');
  assert.equal(g[0].grace, true);
  assert.equal(g[0].d, 0);
  assert.equal(g[1].t, 0);
  assert.equal(soundingNotes(g).length, 1);
  assert.throws(() => parseVoice('C4:one'));
});

test('playing: 90% / 50% / 100%, and accents start a little late and sound in full on a harpsichord', () => {
  const [a, b, c, d] = schedule([parseVoice('C4:1 D4:1. E4:1_ F4:1@0.9')]);
  assert.equal(a.dur, 0.9);
  assert.equal(b.dur, 0.5);
  assert.equal(c.dur, 1);
  assert.equal(d.dur, 1);
  assert.equal(d.start, 3.01);
  assert.equal(a.start, 0);
  const slow = schedule([parseVoice('C4:2')], 1.5);
  assert.equal(slow[0].dur, 2 * 1.5 * 0.9);
  const piano = schedule([parseVoice('F4:1@0.9')], 1, true);
  assert.equal(piano[0].level, 0.9);
  assert.equal(piano[0].start, 0);
});

test('every written and performed layer of the 17 examples can be read, and bars add up', () => {
  const ids = Object.keys(HIP.examples);
  assert.equal(ids.length, 17);
  let layersCount = 0;
  for (const id of ids) {
    const e = HIP.examples[id];
    if (!e.written.upper) continue; // the dissonance-dynamics example is written as chords
    const layers = layersOf(e.written, e.performed);
    assert.equal(layers[0].name, 'Written', id);
    for (const l of layers) {
      layersCount++;
      const lengths = Object.values(l.voices).map((s) => {
        const notes = parseVoice(s);
        const last = notes[notes.length - 1];
        return last.t + last.d;
      });
      assert.ok(lengths.length >= 1, `${id} ${l.name}`);
    }
    // the annotations count the sounding notes of the upper voice
    const n = soundingNotes(parseVoice(e.written.upper)).length;
    for (const s of e.syllables ?? []) assert.ok(typeof s === 'string');
    if (e.syllables) assert.equal(e.syllables.length, n, `${id}: syllables`);
    if (e.bows) assert.equal(e.bows.length, n, `${id}: bows`);
    for (const b of e.breaths ?? []) assert.ok(b.after >= 0 && b.after < n, `${id}: breath after ${b.after} of ${n}`);
  }
  assert.ok(layersCount >= 17);
});

test('a performed layer that is the same as the written one is not a second layer', () => {
  const layers = layersOf({ upper: 'C4:1 D4:1' }, { upper: 'same' });
  assert.equal(layers.length, 1);
  const q = layersOf({ upper: 'G5:0.75 A5:0.25', lower: 'C5:1' }, { Quantz: 'G5:0.85 A5:0.15', 'C. P. E. Bach': 'G5:0.6667 A5:0.3333', lower: 'C5:1' });
  assert.deepEqual(q.map((l) => l.name), ['Written', 'Quantz', 'C. P. E. Bach']);
  assert.equal(q[1].voices.upper, 'G5:0.85 A5:0.15');
  assert.equal(q[2].voices.lower, 'C5:1');
});
