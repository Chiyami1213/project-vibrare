// Chord preview. It plays with the instrument chosen in Settings (recorded samples). If those cannot be loaded, a
// small Web Audio synth steps in, so a chord always sounds.
import { getAudioSettings, outputGain } from './audio-settings';
import { sampler } from './sampler';

export type PlayMode = 'harmonic' | 'up' | 'down';

let ctx: AudioContext | null = null;
let current: GainNode | null = null;

// the volume and mute settings apply straight away, even to a chord that is already sounding
if (typeof window !== 'undefined') {
  window.addEventListener('audio-settings', () => {
    if (ctx && current) current.gain.setTargetAtTime(outputGain(getAudioSettings()), ctx.currentTime, 0.03);
  });
}

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function note(ac: AudioContext, out: AudioNode, midi: number, start: number, dur: number, peak: number) {
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0008, start + dur);
  env.connect(out);

  // a soft, slightly bright tone: a triangle plus a quiet octave sine
  const a = ac.createOscillator();
  a.type = 'triangle';
  a.frequency.value = freq(midi);
  const b = ac.createOscillator();
  b.type = 'sine';
  b.frequency.value = freq(midi) * 2;
  const bGain = ac.createGain();
  bGain.gain.value = 0.25;
  a.connect(env);
  b.connect(bGain).connect(env);
  for (const o of [a, b]) {
    o.start(start);
    o.stop(start + dur + 0.05);
  }
}

/** Play the pitches (ascending MIDI numbers). Returns how long the sound lasts, in seconds. */
export async function playChord(midis: number[], mode: PlayMode): Promise<number> {
  try {
    await sampler.load();
  } catch {
    return playSynthChord(midis, mode); // samples unavailable (offline?)
  }
  const ac = sampler.context;
  sampler.stop();
  const order = mode === 'down' ? [...midis].reverse() : midis;
  const step = mode === 'harmonic' ? 0 : 0.28;
  const dur = mode === 'harmonic' ? 2.4 : 1.8;
  const t0 = ac.currentTime + 0.05;
  const level = 0.9 / Math.sqrt(Math.max(1, midis.length) / 2);
  order.forEach((m, i) => sampler.play(m, t0 + i * step, dur, level));
  return 0.05 + (order.length - 1) * step + dur;
}

async function playSynthChord(midis: number[], mode: PlayMode): Promise<number> {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') await ctx.resume();
  const ac = ctx;

  // stop whatever is still sounding
  if (current) {
    current.gain.setTargetAtTime(0, ac.currentTime, 0.04);
    current = null;
  }
  const master = ac.createGain();
  master.gain.value = outputGain(getAudioSettings());
  master.connect(ac.destination);
  current = master;

  const order = mode === 'down' ? [...midis].reverse() : midis;
  const step = mode === 'harmonic' ? 0 : 0.28;
  const dur = mode === 'harmonic' ? 2.4 : 1.8;
  const peak = 0.34 / Math.sqrt(midis.length);
  const t0 = ac.currentTime + 0.05;
  order.forEach((m, i) => note(ac, master, m, t0 + i * step, dur, peak));
  return 0.05 + (order.length - 1) * step + dur;
}
