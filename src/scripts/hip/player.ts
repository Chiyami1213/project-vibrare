// Plays the examples of the HIP page on the instrument chosen in Settings (the harpsichord by default).
import { Note } from 'tonal';
import { sampler } from '../sampler';
import { parseVoice, schedule } from './notation';
import type { Layer } from './notation';

interface PlayableExample {
  id: string;
  layers: Layer[];
  chords?: { bass: string; notes: string[]; class: string }[];
}

const CHORD_BEATS = 2;

/** Quantz's texture for a harpsichord accompaniment: more parts and an arpeggio as the dissonance grows. */
function chordNotes(c: { bass: string; notes: string[]; class: string }, start: number, beat: number) {
  const bass = Note.midi(c.bass) ?? 45;
  const tones = c.notes.map((n) => Note.midi(n)).filter((m): m is number => m !== null);
  const midis = [bass, ...tones];
  if (c.class !== 'consonant') midis.push(bass - 12); // mf and louder: the bass doubled an octave lower
  const arpeggio = c.class === 'ff';
  return midis
    .sort((a, b) => a - b)
    .map((midi, i) => ({ midi, start: start + (arpeggio ? i * 0.03 : 0), dur: CHORD_BEATS * beat * 0.9, level: 1 }));
}

export function initHip(): void {
  const raw = document.getElementById('hip-examples')?.textContent;
  const data: Record<string, PlayableExample> = raw ? JSON.parse(raw) : {};
  let stopTimer = 0;
  let activeButton: HTMLButtonElement | null = null;

  const reset = () => {
    window.clearTimeout(stopTimer);
    sampler.stop();
    if (activeButton) activeButton.textContent = activeButton.dataset.label ?? '▶';
    activeButton = null;
  };

  document.querySelectorAll<HTMLButtonElement>('button[data-hip-play]').forEach((btn) => {
    btn.dataset.label = btn.textContent ?? '';
    btn.addEventListener('click', async () => {
      const was = activeButton === btn;
      reset();
      if (was) return;
      const box = btn.closest<HTMLElement>('.hip-ex')!;
      const ex = data[box.dataset.ex ?? ''];
      if (!ex) return;
      const tempo = Number(box.querySelector<HTMLInputElement>('input[type=range]')?.value ?? 60);
      const beat = 60 / tempo;
      try {
        await sampler.load();
      } catch {
        btn.textContent = 'The sound could not be loaded';
        return;
      }
      const ac = sampler.context;
      const t0 = ac.currentTime + 0.1;
      const piano = sampler.instrument.group === 'Piano';
      let notes: { midi: number; start: number; dur: number; level: number }[] = [];
      let total = 0;
      if (ex.chords) {
        ex.chords.forEach((c, i) => notes.push(...chordNotes(c, i * CHORD_BEATS * beat, beat)));
        total = ex.chords.length * CHORD_BEATS * beat;
      } else {
        const which = btn.dataset.hipPlay!;
        const layers = which === 'all' ? ex.layers : [ex.layers[Number(which)]];
        let offset = 0;
        for (const layer of layers) {
          const voices = Object.values(layer.voices).map(parseVoice);
          const scheduled = schedule(voices, beat, piano);
          const length = Math.max(0, ...voices.map((v) => v.reduce((a, n) => Math.max(a, n.t + n.d), 0))) * beat;
          notes.push(...scheduled.map((n) => ({ ...n, start: n.start + offset })));
          offset += length + beat; // a gap of one crotchet between the layers
        }
        total = offset;
      }
      notes.forEach((n) => sampler.play(n.midi, t0 + n.start, n.dur, n.level));
      activeButton = btn;
      btn.textContent = '■ Stop';
      stopTimer = window.setTimeout(reset, (total + 0.5) * 1000);
    });
  });
}
