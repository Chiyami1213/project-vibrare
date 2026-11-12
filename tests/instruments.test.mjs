import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INSTRUMENTS, INSTRUMENT_GROUPS, DEFAULT_INSTRUMENT, equalTemperamentRate, getInstrument, isInstrumentId } from '../src/scripts/instruments.ts';
import { DEFAULT_AUDIO, normalizeAudio } from '../src/scripts/audio-settings.ts';

test('instruments: unique ids, known groups, three sources in each group', () => {
  assert.equal(new Set(INSTRUMENTS.map((i) => i.id)).size, INSTRUMENTS.length);
  for (const i of INSTRUMENTS) assert.ok(INSTRUMENT_GROUPS.includes(i.group), i.id);
  for (const g of INSTRUMENT_GROUPS) assert.equal(INSTRUMENTS.filter((i) => i.group === g).length, 3, `${g} has three sources`);
  assert.ok(isInstrumentId(DEFAULT_INSTRUMENT));
  assert.equal(getInstrument('nonsense').id, INSTRUMENTS[0].id);
});

test('every instrument has samples that exist, are in tune and cover the bass and treble', () => {
  for (const i of INSTRUMENTS) {
    const dir = new URL(`../public/audio/${i.dir}/`, import.meta.url);
    const { samples } = JSON.parse(fs.readFileSync(new URL('manifest.json', dir), 'utf8'));
    assert.ok(samples.length >= 12, `${i.id} has ${samples.length} samples`);
    for (const s of samples) {
      assert.ok(fs.existsSync(new URL(s.file, dir)), `${i.id}: missing ${s.file}`);
      assert.ok(Math.abs(s.midi - s.labelMidi) < 0.45, `${i.id}: ${s.file} is ${Math.round((s.midi - s.labelMidi) * 100)} cents off`);
    }
    const midis = samples.map((s) => s.midi);
    assert.ok(Math.min(...midis) <= 36.5 && Math.max(...midis) >= 80, `${i.id} range ${Math.min(...midis)}-${Math.max(...midis)}`);
    const sorted = [...midis].sort((a, b) => a - b);
    const playable = sorted.filter((m) => m >= 34); // below A#1 a sparse set is fine: no bass line goes there
    for (let k = 1; k < playable.length; k++) assert.ok(playable[k] - playable[k - 1] <= 7.2, `${i.id}: gap after ${playable[k - 1]}`); // the Yamaha upright was recorded on C and G only
  }
});

test('the instrument setting is validated like the other audio settings', () => {
  assert.equal(DEFAULT_AUDIO.instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio('{"instrument":"piano-steinway"}').instrument, 'piano-steinway');
  assert.equal(normalizeAudio('{"instrument":"kazoo"}').instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio('{"volume":50}').instrument, DEFAULT_INSTRUMENT);
  assert.equal(normalizeAudio(null).instrument, DEFAULT_INSTRUMENT);
});

test('every note is played in 12-TET (A = 440 Hz), whatever the tuning of its recording', () => {
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  for (const i of INSTRUMENTS) {
    const { samples } = JSON.parse(fs.readFileSync(new URL(`../public/audio/${i.dir}/manifest.json`, import.meta.url), 'utf8'));
    for (let target = 24; target <= 96; target++) {
      const nearest = samples.reduce((a, s) => (Math.abs(s.midi - target) < Math.abs(a.midi - target) ? s : a));
      const sounding = hz(nearest.midi) * equalTemperamentRate(nearest.midi, target);
      assert.ok(Math.abs(1200 * Math.log2(sounding / hz(target))) < 1e-6, `${i.id} midi ${target}`);
    }
  }
  assert.equal(equalTemperamentRate(60, 72), 2);
  assert.equal(equalTemperamentRate(60.2, 60.2), 1);
});
