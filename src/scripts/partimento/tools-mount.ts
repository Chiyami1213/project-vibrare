// Build the partimento tools (div[data-ptool], with an optional data-arg) when they come into view.
import { makeQueue, whenIdle } from './mount';

export function mountPartimentoTools(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-ptool]')];
  if (boxes.length === 0) return;
  whenIdle(() => {
    void import('./tools');
    void fetch('/theory/partimento/tools-data.json'); // the examples the tools need, ready in the cache
    void import('./player'); // and the score player
  });
  const enqueue = makeQueue();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        enqueue(async () => (await import('./tools')).mountPartimentoTool(el, el.dataset.ptool!, el.dataset.arg));
      }
    },
    { rootMargin: '1200px' },
  );
  boxes.forEach((b) => io.observe(b));
}
