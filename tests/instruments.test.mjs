import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INSTRUMENTS, INSTRUMENT_GROUPS, DEFAULT_INSTRUMENT, getInstrument, isInstrumentId } from '../src/scripts/instruments.ts';
import { DEFAULT_AUDIO, normalizeAudio } from '../src/scripts/audio-settings.ts';

test('instruments: unique ids, known groups, two harpsichords and two pianos', () => {
  assert.equal(new Set(INSTRUMENTS.map((i) => i.id)).size, INSTRUMENTS.length);
  for (const i of INSTRUMENTS) assert.ok(INSTRUMENT_GROUPS.includes(i.group), i.id);
  assert.equal(INSTRUMENTS.filter((i) => i.group === 'Historic harpsichord').length, 2);
  assert.equal(INSTRUMENTS.filter((i) => i.group === 'Modern piano').length, 2);
  assert.ok(isInstrumentId(DEFAULT_INSTRUMENT));
  assert.equal(getInstrument('nonsense').id, INSTRUMENTS[0].id);
});

test('every instrument has samples that exist, are in tune and cover the bass and treble', () => {
  for (const i of INSTRUMENTS) {
    const dir = new URL(`../public/audio/${i.dir}/`, import.meta.url);
    const { samples } = JSON.parse(fs.readFileSync(new URL('manifest.json', dir), 'utf8'));
    assert.ok(samples.length >= 20, `${i.id} has ${samples.length} samples`);
    for (const s of samples) {
      assert.ok(fs.existsSync(new URL(s.file, dir)), `${i.id}: missing ${s.file}`);
      assert.ok(Math.abs(s.midi - s.labelMidi) < 0.45, `${i.id}: ${s.file} is ${Math.round((s.midi - s.labelMidi) * 100)} cents off`);
    }
    const midis = samples.map((s) => s.midi);
    assert.ok(Math.min(...midis) <= 36 && Math.max(...midis) >= 80, `${i.id} range ${Math.min(...midis)}-${Math.max(...midis)}`);
    const sorted = [...midis].sort((a, b) => a - b);
    for (let k = 1; k < sorted.length; k++) assert.ok(sorted[k] - sorted[k - 1] <= 4, `${i.id}: gap after ${sorted[k - 1]}`);
  }
});

test('the instrument setting is validated like the other audio settings', () => {
  assert.equal(DEFAULT_AUDIO.instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio('{"instrument":"piano-steinway"}').instrument, 'piano-steinway');
  assert.equal(normalizeAudio('{"instrument":"kazoo"}').instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio('{"volume":50}').instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio(null).instrument, DEFAULT_INSTRUMENT);
});
