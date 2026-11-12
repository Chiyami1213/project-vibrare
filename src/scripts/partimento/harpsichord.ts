// Harpsichord playback from recorded samples.
// Samples: Versilian Community Sample Library (CC0), Italian harpsichord. See public/audio/harpsichord/README.txt.
import { getAudioSettings, outputGain } from '../audio-settings';

interface SampleMeta {
  file: string;
  midi: number; // measured sounding pitch (a few cents sharp of equal temperament)
}

const BASE = '/audio/harpsichord/';

export class Harpsichord {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private out: DynamicsCompressorNode | null = null;
  private samples: { meta: SampleMeta; buffer: AudioBuffer }[] = [];
  private loading: Promise<void> | null = null;
  private active: GainNode[] = [];

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

  /** Download and decode the samples (about 1 MB, once). Call from a click so audio is allowed to start. */
  load(): Promise<void> {
    this.loading ??= (async () => {
      const ac = this.context;
      if (ac.state === 'suspended') await ac.resume();
      const manifest = (await (await fetch(`${BASE}manifest.json`)).json()) as { samples: SampleMeta[] };
      this.samples = await Promise.all(
        manifest.samples.map(async (meta) => {
          const data = await (await fetch(BASE + meta.file)).arrayBuffer();
          return { meta, buffer: await ac.decodeAudioData(data) };
        }),
      );
      this.samples.sort((a, b) => a.meta.midi - b.meta.midi);
    })().catch((e) => {
      this.loading = null; // allow a retry
      throw e;
    });
    return this.loading;
  }

  get ready(): boolean {
    return this.samples.length > 0;
  }

  /** Play one note at an absolute time (seconds on the audio clock). */
  play(midi: number, when: number, dur: number, level = 1): void {
    const ac = this.context;
    if (!this.samples.length || !this.master) return;
    let best = this.samples[0];
    for (const s of this.samples) if (Math.abs(s.meta.midi - midi) < Math.abs(best.meta.midi - midi)) best = s;
    const src = ac.createBufferSource();
    src.buffer = best.buffer;
    src.playbackRate.value = Math.pow(2, (midi - best.meta.midi) / 12); // exact equal temperament
    const env = ac.createGain();
    const end = when + Math.max(0.12, dur);
    env.gain.setValueAtTime(level, when);
    env.gain.setTargetAtTime(0, end, 0.07); // the jack falls back and the string is damped
    src.connect(env).connect(this.master);
    src.start(when);
    src.stop(end + 0.6);
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
export const harpsichord = new Harpsichord();
