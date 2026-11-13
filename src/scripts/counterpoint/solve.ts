// Ask for a counterpoint from the solver (in a Web Worker; on the page's own thread if workers are unavailable).
import { solveSmart } from './engine.js';
import type { Voice } from './rules';

export type EngineVoice = Voice & { lo?: string; hi?: string };
interface Opts {
  maxNodes?: number;
  maxMs?: number;
  noCross?: boolean;
  seed?: number;
}

let worker: Worker | null = null;
const waiting = new Map<number, (v: EngineVoice[] | null) => void>();
let next = 0;

export function solveAsync(voices: EngineVoice[], mode: string, opts: Opts): Promise<EngineVoice[] | null> {
  try {
    if (!worker) {
      worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ id: number; res: EngineVoice[] | null }>) => {
        const f = waiting.get(e.data.id);
        if (f) {
          waiting.delete(e.data.id);
          f(e.data.res);
        }
      };
    }
    const id = ++next;
    return new Promise((resolve) => {
      waiting.set(id, resolve);
      worker!.postMessage({ id, voices, mode, opts });
    });
  } catch {
    return new Promise((resolve) => setTimeout(() => resolve(solveSmart(voices, mode, { ...opts, maxMs: Math.min(opts.maxMs ?? 2500, 2500) })), 20));
  }
}
