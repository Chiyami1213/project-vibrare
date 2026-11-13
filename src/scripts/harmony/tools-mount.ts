// Build the tonal-harmony tools (div[data-ttool]) when they come into view.
import { makeQueue, whenIdle } from '../partimento/mount';

export function mountTonalTools(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-ttool]')];
  if (boxes.length === 0) return;
  whenIdle(() => {
    void import('./tools');
    void import('../partimento/player');
  });
  const enqueue = makeQueue();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        enqueue(async () => (await import('./tools')).mountTonalTool(el, el.dataset.ttool!));
      }
    },
    { rootMargin: '1200px' },
  );
  boxes.forEach((b) => io.observe(b));
  if (location.hash.startsWith('#tool-')) {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.dataset.ttool) enqueue(async () => (await import('./tools')).mountTonalTool(el, el.dataset.ttool!));
  }
}
