// Plays notes from recorded samples, using the instrument chosen in Settings (see instruments.ts).
import { getAudioSettings, outputGain } from './audio-settings';
import { getInstrument } from './instruments';
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
  private sets = new Map<string, Sample[]>();
  private loading = new Map<string, Promise<void>>();
  private active: GainNode[] = [];

  /** The instrument chosen in Settings right now. */
  get instrument(): Instrument {
    return getInstrument(getAudioSettings().instrument);
  }

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

  /** Download and decode the samples of the chosen instrument (1 to 3 MB, once). Call from a click so audio may start. */
  load(): Promise<void> {
    const inst = this.instrument;
    let p = this.loading.get(inst.id);
    if (!p) {
      p = (async () => {
        const ac = this.context;
        if (ac.state === 'suspended') await ac.resume();
        const base = `/audio/${inst.dir}/`;
        const manifest = (await (await fetch(`${base}manifest.json`)).json()) as { samples: SampleMeta[] };
        const samples = await Promise.all(
          manifest.samples.map(async (meta) => {
            const data = await (await fetch(base + meta.file)).arrayBuffer();
            return { meta, buffer: await ac.decodeAudioData(data) };
          }),
        );
        samples.sort((a, b) => a.meta.midi - b.meta.midi);
        this.sets.set(inst.id, samples);
      })().catch((e) => {
        this.loading.delete(inst.id); // allow a retry
        throw e;
      });
      this.loading.set(inst.id, p);
    }
    return p;
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
    src.playbackRate.value = Math.pow(2, (midi - best.meta.midi) / 12); // exact equal temperament
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
