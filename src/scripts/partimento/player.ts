// The Example Player: score with figured bass, sampled playback (the instrument is chosen in Settings), step mode, transpose,
// mute / solo per voice, and an exercise mode that hides the upper voices.
import { MAJOR_KEYS, MINOR_KEYS, isMajorKey, keyLabel, playableNotes, soundingAt, transposeExample } from './model';
import type { ExampleData } from './model';
import { drawExample } from './render';
import type { Drawn } from './render';
import { sampler } from '../sampler';
import { fontsReady } from '../fonts';
import { titleCase } from '../title-case';

type Attrs = Record<string, string | number | boolean | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  e.append(...kids);
  return e;
}

const DEGREES_KEY = 'partimento-degrees';
const degreesWanted = (): boolean => {
  try {
    return localStorage.getItem(DEGREES_KEY) !== 'off';
  } catch {
    return true;
  }
};

const button = (label: string, cls = 'btn', attrs: Attrs = {}) => h('button', { type: 'button', class: cls, ...attrs }, label);

export async function mountPlayer(root: HTMLElement, original: ExampleData): Promise<void> {
  const upperCount = original.parts - 1;
  const voiceName = (i: number) => original.voiceNames?.[i] ?? (i === upperCount ? 'Bass' : upperCount === 1 ? 'Upper Voice' : `Voice ${i + 1}`);

  const state = {
    key: original.key,
    showUpper: true,
    bpm: 64,
    loop: false,
    muted: new Set<number>(),
    solo: null as number | null,
    step: null as number | null,
  };
  let current = original;
  let drawn: Drawn | null = null;
  let playing = false;
  let raf = 0;
  let t0 = 0;

  // ---------- markup ----------
  const score = h('div', { class: 'score-box' });
  const status = h('p', { class: 'pl-status muted-line', role: 'status' });
  const note = h('p', { class: 'pl-note muted-line' });

  const playBtn = button('▶ Play', 'btn pl-play');
  const stopBtn = button('■ Stop', 'btn');
  const loopBtn = button('Loop', 'seg-btn', { 'aria-pressed': 'false' });
  const bpmIn = h('input', { type: 'range', min: 30, max: 140, step: 1, value: state.bpm, class: 'pl-range', 'aria-label': 'Tempo' });
  const bpmOut = h('output', {}, `${state.bpm} bpm`);

  const prevBtn = button('◀', 'btn', { 'aria-label': 'Previous chord' });
  const nextBtn = button('▶', 'btn', { 'aria-label': 'Next chord' });
  const stepOut = h('span', { class: 'muted-line' }, 'Step through the sonorities with the arrow keys or these buttons');

  const keySel = h('select', { class: 'pl-select', 'aria-label': 'Key' });
  const exerciseBtn = button('Hide Upper Voices (Exercise)', 'seg-btn', { 'aria-pressed': 'false' });
  const degreesBtn = button('Scale Degrees', 'seg-btn', { 'aria-pressed': String(degreesWanted()) });

  const voiceBox = h('div', { class: 'pl-voices' });

  root.classList.add('pl-ready');
  root.setAttribute('tabindex', '0');
  root.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Space');
  root.replaceChildren(
    score,
    h('div', { class: 'pl-row' }, playBtn, stopBtn, loopBtn, h('label', { class: 'pl-inline' }, 'Tempo ', bpmIn, ' ', bpmOut)),
    h('div', { class: 'pl-row' }, h('span', { class: 'pl-label' }, 'Step'), prevBtn, nextBtn, stepOut),
    h('div', { class: 'pl-row' }, ...(original.noDegrees ? [] : [h('label', { class: 'pl-inline' }, 'Key ', keySel)]), ...(original.parts > 1 && !original.noDegrees ? [exerciseBtn] : []), ...(original.noDegrees ? [] : [degreesBtn])),
    voiceBox,
    note,
    status,
  );

  // key choices: the keys of the example's own mode
  const keys = isMajorKey(original.key) ? MAJOR_KEYS : MINOR_KEYS;
  for (const k of keys) keySel.append(h('option', { value: k, selected: k === state.key }, titleCase(keyLabel(k))));

  // ---------- helpers ----------
  const audible = (voice: number) => {
    if (!state.showUpper && voice < upperCount) return false;
    if (state.solo !== null) return voice === state.solo;
    return !state.muted.has(voice);
  };

  function buildVoiceButtons() {
    voiceBox.replaceChildren(
      ...Array.from({ length: original.parts }, (_, i) => {
        const mute = button('Mute', 'seg-btn', { 'aria-pressed': String(state.muted.has(i)) });
        const solo = button('Solo', 'seg-btn', { 'aria-pressed': String(state.solo === i) });
        mute.addEventListener('click', () => {
          if (state.muted.has(i)) state.muted.delete(i);
          else state.muted.add(i);
          buildVoiceButtons();
        });
        solo.addEventListener('click', () => {
          state.solo = state.solo === i ? null : i;
          buildVoiceButtons();
        });
        return h('div', { class: 'pl-voice' }, h('span', { class: 'pl-label' }, voiceName(i)), mute, solo);
      }),
    );
  }

  function redraw() {
    const t = transposeExample(original, state.key);
    current = t.example;
    const width = Math.max(320, Math.floor(score.clientWidth || root.clientWidth || 700));
    drawn = drawExample(score, current, { width, showUpper: state.showUpper });
    note.textContent = t.overflow > 0 ? 'This key needs a triple sharp or flat in places, which the score shows as a double.' : '';
    state.step = null;
  }

  async function ensureSound(): Promise<boolean> {
    if (sampler.ready) {
      await sampler.activate(); // the samples were preloaded: only the audio context needs starting
      return true;
    }
    status.textContent = `Loading the ${sampler.instrument.name.toLowerCase()}…`;
    try {
      await sampler.activate();
      status.textContent = '';
      return true;
    } catch {
      status.textContent = 'The instrument sound could not be loaded. Check your connection and try again.';
      return false;
    }
  }

  function stopPlayback() {
    cancelAnimationFrame(raf);
    sampler.stop();
    playing = false;
    playBtn.textContent = '▶ Play';
    drawn?.highlight(null);
  }

  async function play() {
    if (!(await ensureSound())) return;
    stopPlayback();
    const ac = sampler.context;
    const beat = 60 / state.bpm;
    t0 = ac.currentTime + 0.12;
    for (const n of playableNotes(current)) {
      if (!audible(n.voice)) continue;
      sampler.play(n.midi, t0 + n.start * beat, n.dur * beat * 0.96, n.voice === upperCount ? 1 : 0.85);
    }
    playing = true;
    playBtn.textContent = '❚❚ Pause';
    const total = current.realized.lengthBeats;
    const tick = () => {
      const beats = (ac.currentTime - t0) / beat;
      if (drawn) {
        let idx = -1;
        drawn.slices.forEach((s, i) => {
          if (s.beat <= beats + 1e-6) idx = i;
        });
        drawn.highlight(beats >= 0 && beats < total ? idx : null);
      }
      if (beats >= total + 0.4) {
        if (state.loop) void play();
        else stopPlayback();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  async function step(delta: number) {
    if (!drawn || drawn.slices.length === 0 || !(await ensureSound())) return;
    stopPlayback();
    const n = drawn.slices.length;
    state.step = state.step === null ? (delta > 0 ? 0 : n - 1) : Math.max(0, Math.min(n - 1, state.step + delta));
    const s = drawn.slices[state.step];
    drawn.highlight(state.step);
    stepOut.textContent = `Sonority ${state.step + 1} of ${n}`;
    const ac = sampler.context;
    for (const nt of soundingAt(current, s.beat)) if (audible(nt.voice)) sampler.play(nt.midi, ac.currentTime + 0.03, 1.6, 0.9);
  }

  // ---------- events ----------
  playBtn.addEventListener('click', () => (playing ? stopPlayback() : void play()));
  stopBtn.addEventListener('click', stopPlayback);
  loopBtn.addEventListener('click', () => {
    state.loop = !state.loop;
    loopBtn.setAttribute('aria-pressed', String(state.loop));
  });
  bpmIn.addEventListener('input', () => {
    state.bpm = Number(bpmIn.value);
    bpmOut.textContent = `${state.bpm} bpm`;
  });
  bpmIn.addEventListener('change', () => {
    if (playing) void play(); // new tempo applies from the start
  });
  prevBtn.addEventListener('click', () => void step(-1));
  nextBtn.addEventListener('click', () => void step(1));
  keySel.addEventListener('change', () => {
    stopPlayback();
    state.key = keySel.value;
    redraw();
  });
  exerciseBtn.addEventListener('click', () => {
    stopPlayback();
    state.showUpper = !state.showUpper;
    exerciseBtn.setAttribute('aria-pressed', String(!state.showUpper));
    redraw();
  });
  // the circled scale degrees under the bass can be switched off; the choice is shared by every example
  const showDegrees = (on: boolean) => {
    root.classList.toggle('no-degrees', !on);
    degreesBtn.setAttribute('aria-pressed', String(on));
  };
  showDegrees(degreesWanted());
  degreesBtn.addEventListener('click', () => {
    const on = degreesBtn.getAttribute('aria-pressed') !== 'true';
    try {
      localStorage.setItem(DEGREES_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode: applies to this page only */
    }
    window.dispatchEvent(new CustomEvent('partimento-degrees', { detail: on }));
  });
  window.addEventListener('partimento-degrees', (e) => showDegrees((e as CustomEvent<boolean>).detail));
  root.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('select, input')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      void step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      void step(-1);
    } else if (e.key === ' ' && !target.matches('button')) {
      e.preventDefault();
      playing ? stopPlayback() : void play();
    }
  });
  let lastWidth = 0;
  let timer = 0;
  new ResizeObserver(() => {
    const w = Math.floor(score.clientWidth);
    if (Math.abs(w - lastWidth) < 30) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      lastWidth = w;
      if (!playing) redraw();
    }, 150);
  }).observe(score);

  buildVoiceButtons();
  lastWidth = Math.floor(score.clientWidth);
  await fontsReady(); // the music font must be loaded before VexFlow measures any notehead
  redraw();
}
