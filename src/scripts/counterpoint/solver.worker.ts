// The search for a counterpoint can take seconds: it runs here, off the page's thread.
import { solveSmart } from './engine.js';

self.onmessage = (e: MessageEvent<{ id: number; voices: unknown; mode: string; opts: unknown }>) => {
  const { id, voices, mode, opts } = e.data;
  let res = null;
  try {
    res = solveSmart(voices, mode, opts);
  } catch {
    res = null;
  }
  (self as unknown as Worker).postMessage({ id, res });
};
