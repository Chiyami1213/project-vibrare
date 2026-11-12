import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_AUDIO, normalizeAudio, outputGain } from '../src/scripts/audio-settings.ts';

test('missing or broken stored values fall back to the defaults', () => {
  assert.deepEqual(normalizeAudio(null), DEFAULT_AUDIO);
  assert.deepEqual(normalizeAudio('not json'), DEFAULT_AUDIO);
  assert.deepEqual(normalizeAudio('{"volume":"loud"}'), DEFAULT_AUDIO);
  assert.deepEqual(normalizeAudio({}), DEFAULT_AUDIO);
});

test('values are clamped and rounded', () => {
  assert.equal(normalizeAudio({ volume: 150 }).volume, 100);
  assert.equal(normalizeAudio({ volume: -5 }).volume, 0);
  assert.equal(normalizeAudio('{"volume":42.6}').volume, 43);
  assert.equal(normalizeAudio({ volume: 30, muted: true }).muted, true);
  assert.equal(normalizeAudio({ volume: 30, muted: 'yes' }).muted, false); // only a real true mutes
});

test('output gain: silent when muted, curved otherwise, full at 100', () => {
  assert.equal(outputGain({ volume: 100, muted: true }), 0);
  assert.equal(outputGain({ volume: 0, muted: false }), 0);
  assert.equal(outputGain({ volume: 100, muted: false }), 1);
  assert.equal(outputGain({ volume: 50, muted: false }), 0.25);
  assert.ok(outputGain({ volume: 80, muted: false }) < 0.8);
});
