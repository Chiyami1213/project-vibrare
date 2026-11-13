// Small building blocks shared by the interactive tools: DOM helpers, a row of choices, sound and a score box.
import type { Issue, Voice } from './counterpoint/rules';
import { marksOf } from './counterpoint/rules';
import { scoreData, voiceNamesOf } from './counterpoint/score';
import { mountPlayer } from './partimento/player';
import type { ExampleData } from './partimento/model';
import { sampler } from './sampler';


export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
}
export function button(label: string, onclick: () => void, cls = 'btn'): HTMLButtonElement {
  const b = h('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onclick);
  return b;
}
/** A row of exclusive choices (segmented control). */
export function choices(options: [string, string][], value: string, onpick: (v: string) => void, label: string): HTMLElement {
  const wrap = h('div', 'chip-row');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', label);
  const bs = options.map(([v, t]) => {
    const b = button(t, () => {
      bs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onpick(v);
    }, 'seg-btn');
    b.setAttribute('aria-pressed', String(v === value));
    return b;
  });
  wrap.append(...bs);
  return wrap;
}
export const head = (box: HTMLElement, eyebrow: string, title: string, hint: string) => {
  const hd = h('div', 'tool-head');
  hd.append(h('span', 'eyebrow', eyebrow), h('strong', '', title), h('span', 'muted-line', hint));
  box.replaceChildren(hd);
};
export const flat = (p: string) => p.replace('b', '♭').replace('#', '♯');

/** Sound a list of notes with the instrument chosen in Settings. */
export async function sound(notes: { midi: number; at: number; dur: number; level?: number }[]) {
  const ac = await sampler.activate();
  const t0 = ac.currentTime + 0.05;
  for (const n of notes) sampler.play(n.midi, t0 + n.at, n.dur, n.level ?? 1);
}

/** Put a score (the shared Example Player) into `stage`, replacing the one there. */
export function showScore(stage: HTMLElement, voices: Voice[], title: string, marks: Issue[] = []) {
  sampler.stop();
  const fresh = h('div', 'player');
  stage.replaceChildren(fresh);
  void mountPlayer(fresh, { ...scoreData(`tool-${title}`, title, voices, voiceNamesOf(voices)), marks: marksOf(marks) });
}

export const whole = (notes: string[], d = 1): Voice['notes'] => notes.map((p) => ({ p, d }));
export const pill = (text: string, ok: boolean) => Object.assign(h('span', `pill ${ok ? 'ok' : 'no'}`), { textContent: text });


/** Put an Example Player (score, play, step, transpose) for `data` into `stage`, replacing what is there. */
export function showExample(stage: HTMLElement, data: ExampleData): void {
  sampler.stop();
  const fresh = h('div', 'player');
  stage.replaceChildren(fresh);
  void mountPlayer(fresh, data);
}
