// Audio settings shared by every page that makes sound. Stored only in the visitor's browser.
import { DEFAULT_INSTRUMENT, isInstrumentId } from './instruments.ts';

export interface AudioSettings {
  volume: number; // 0 to 100
  muted: boolean;
  instrument: string; // id from instruments.ts
}

export const DEFAULT_AUDIO: AudioSettings = { volume: 80, muted: false, instrument: DEFAULT_INSTRUMENT };
const KEY = 'audio-settings';

/** Turn whatever was stored into valid settings (bad or missing values fall back to the defaults). */
export function normalizeAudio(raw: unknown): AudioSettings {
  let o: Partial<AudioSettings> = {};
  if (typeof raw === 'string') {
    try {
      o = JSON.parse(raw) ?? {};
    } catch {
      o = {};
    }
  } else if (raw && typeof raw === 'object') {
    o = raw as Partial<AudioSettings>;
  }
  const v = Number(o.volume);
  return {
    volume: Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : DEFAULT_AUDIO.volume,
    muted: o.muted === true,
    instrument: isInstrumentId(o.instrument) ? o.instrument : DEFAULT_INSTRUMENT,
  };
}

/** Loudness multiplier for the slider position: a gentle curve, so the middle of the slider is not too loud. */
export function outputGain(s: AudioSettings): number {
  return s.muted ? 0 : Math.pow(s.volume / 100, 2);
}

export function getAudioSettings(): AudioSettings {
  try {
    return normalizeAudio(localStorage.getItem(KEY));
  } catch {
    return { ...DEFAULT_AUDIO };
  }
}

/** Save changes, tell the rest of the page, and return the new settings. */
export function saveAudioSettings(change: Partial<AudioSettings>): AudioSettings {
  const next = normalizeAudio({ ...getAudioSettings(), ...change });
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: the change still applies to this page */
  }
  window.dispatchEvent(new CustomEvent('audio-settings', { detail: next }));
  return next;
}
