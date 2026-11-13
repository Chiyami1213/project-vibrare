// Plays notes from recorded samples, using the instrument chosen in Settings (see instruments.ts).
//
// Loading is kept away from the moment of playing, so there is no lag after switching instrument:
//  - the samples of the chosen instrument are fetched and decoded in the background as soon as a page that makes
//    sound is open, and again whenever the choice changes (preload);
//  - decoding uses an OfflineAudioContext, which needs no click, so it can happen before the visitor presses Play;
//  - only the chosen instrument is kept in memory (decoded samples are large).
import { getAudioSettings, outputGain } from './audio-settings';
import { equalTemperamentRate, getInstrument } from './instruments';
import type { Instrument } from './instruments';

interface SampleMeta {
  file: string;
  midi: number; // measured sounding pitch (a few cents off equal temperament)
}

interface Sample {
  meta: SampleMeta;
  buffer: AudioBuffer;
}

export class Sampler {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private out: DynamicsCompressorNode | null = null;
  private decoder: OfflineAudioContext | null = null;
  private sets = new Map<string, Sample[]>();
  private loading = new Map<string, Promise<void>>();
  private active: GainNode[] = [];

  /** The instrument chosen in Settings right now. */
  get instrument(): Instrument {
    return getInstrument(getAudioSettings().instrument);
  }

  /** The audio context that plays the sound. Created on first use, which is normally inside a click. */
  get context(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.out = this.ctx.createDynamicsCompressor(); // four voices at once must not clip
      this.out.threshold.value = -14;
      this.out.ratio.value = 4;
      this.out.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = outputGain(getAudioSettings());
      this.master.connect(this.out);
      window.addEventListener('audio-settings', () => {
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(outputGain(getAudioSettings()), this.ctx.currentTime, 0.03);
      });
    }
    return this.ctx;
  }

  private decode(data: ArrayBuffer): Promise<AudioBuffer> {
    this.decoder ??= new OfflineAudioContext(1, 1, 44100);
    return this.decoder.decodeAudioData(data);
  }

  /** Download and decode the samples of the chosen instrument (1 to 3 MB, once). Needs no click. */
  load(): Promise<void> {
    const inst = this.instrument;
    let p = this.loading.get(inst.id);
    if (!p) {
      p = (async () => {
        const base = `/audio/${inst.dir}/`;
        const manifest = (await (await fetch(`${base}manifest.json`)).json()) as { samples: SampleMeta[] };
        const samples = await Promise.all(
          manifest.samples.map(async (meta) => {
            const data = await (await fetch(base + meta.file)).arrayBuffer();
            return { meta, buffer: await this.decode(data) };
          }),
        );
        samples.sort((a, b) => a.meta.midi - b.meta.midi);
        this.sets.set(inst.id, samples);
        // decoded samples are large: keep the instrument that is chosen, and let the others go
        const keep = this.instrument.id;
        for (const id of [...this.sets.keys()]) {
          if (id !== keep && id !== inst.id) {
            this.sets.delete(id);
            this.loading.delete(id);
          }
        }
      })().catch((e) => {
        this.loading.delete(inst.id); // allow a retry
        throw e;
      });
      this.loading.set(inst.id, p);
    }
    return p;
  }

  /** Start loading in the background. A failure is silent here; it shows when the visitor presses Play. */
  preload(): void {
    this.load().catch(() => {});
  }

  /** Make everything ready to sound: the samples, and a running audio context. Call it from a click. */
  async activate(): Promise<AudioContext> {
    await this.load();
    const ac = this.context;
    if (ac.state === 'suspended') await ac.resume();
    return ac;
  }

  /** True when the chosen instrument is loaded. */
  get ready(): boolean {
    return this.sets.has(this.instrument.id);
  }

  /** Play one note at an absolute time (seconds on the audio clock). */
  play(midi: number, when: number, dur: number, level = 1): void {
    const inst = this.instrument;
    const samples = this.sets.get(inst.id);
    const ac = this.context;
    if (!samples?.length || !this.master) return;
    let best = samples[0];
    for (const s of samples) if (Math.abs(s.meta.midi - midi) < Math.abs(best.meta.midi - midi)) best = s;
    const src = ac.createBufferSource();
    src.buffer = best.buffer;
    src.playbackRate.value = equalTemperamentRate(best.meta.midi, midi); // 12-TET, whatever the recording's own tuning
    const env = ac.createGain();
    const end = when + Math.max(0.12, dur);
    env.gain.setValueAtTime(level * inst.level, when);
    env.gain.setTargetAtTime(0, end, inst.release); // the key is released: jack falls, damper lands, pipe closes
    src.connect(env).connect(this.master);
    src.start(when);
    src.stop(end + inst.release * 9);
    this.active.push(env);
    src.onended = () => {
      this.active = this.active.filter((g) => g !== env);
    };
  }

  /** Silence everything that is still sounding or scheduled. */
  stop(): void {
    if (!this.ctx) return;
    for (const g of this.active) g.gain.cancelScheduledValues(0), g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    this.active = [];
  }
}

/** One shared instance, so several examples on a page load the samples only once. */
export const sampler = new Sampler();

if (typeof window !== 'undefined') {
  const later = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 2500 }) : window.setTimeout(fn, 600));
  later(() => sampler.preload()); // a page that makes sound: have the chosen instrument ready before Play
  let current = sampler.instrument.id;
  window.addEventListener('audio-settings', () => {
    const next = sampler.instrument.id;
    if (next !== current) {
      current = next;
      sampler.preload(); // the choice changed: load the new instrument now, in the background
    }
  });
}
