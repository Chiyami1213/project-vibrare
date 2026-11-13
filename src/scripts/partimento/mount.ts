// Mount the Example Players of a page. The page puts the examples in a JSON script (id "examples-data":
// { exampleId: ExampleData }) and an empty <div class="player" data-example="exampleId"> for each.
//
// Speed: the player (with the music font, about 700 KB) is fetched as soon as the browser is idle, not when the first
// example scrolls into view; examples are drawn a screen or two before they are reached, one at a time, so that
// drawing never freezes the page.
import type { ExampleData } from './model';

/** Run `fn` when the browser has nothing better to do (a short timeout where idle callbacks do not exist). */
export const whenIdle = (fn: () => void, timeout = 1500) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 200);
};

/** Fetch the score player and the music font ahead of time. */
export function prefetchPlayer(): Promise<typeof import('./player')> {
  return import('./player');
}

/** Draw the given jobs one after another, giving the browser a frame between them. */
export function makeQueue() {
  const jobs: (() => Promise<void>)[] = [];
  let running = false;
  async function drain() {
    if (running) return;
    running = true;
    while (jobs.length) {
      const job = jobs.shift()!;
      try {
        await job();
      } catch (e) {
        console.error(e);
      }
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    running = false;
  }
  return (job: () => Promise<void>) => {
    jobs.push(job);
    void drain();
  };
}

export function mountExamples(): void {
  const raw = document.getElementById('examples-data')?.textContent;
  const data: Record<string, ExampleData> = raw ? JSON.parse(raw) : {};
  const boxes = [...document.querySelectorAll<HTMLElement>('.player[data-example]')];
  if (boxes.length === 0) return;
  whenIdle(() => void prefetchPlayer());
  const enqueue = makeQueue();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const ex = data[el.dataset.example ?? ''];
        if (ex) enqueue(async () => (await prefetchPlayer()).mountPlayer(el, ex));
      }
    },
    { rootMargin: '1200px' },
  );
  boxes.forEach((b) => io.observe(b));
}
