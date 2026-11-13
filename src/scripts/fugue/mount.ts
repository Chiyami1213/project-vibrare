// Build the fugue tools (div[data-ftool], with an optional data-preset) when they come into view.
import { makeQueue, whenIdle } from '../partimento/mount';

export function mountFugueTools(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-ftool]')];
  if (boxes.length === 0) return;
  whenIdle(() => void import('./tools'));
  const enqueue = makeQueue();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        enqueue(async () => (await import('./tools')).mountFugueTool(el, el.dataset.ftool!, el.dataset.preset));
      }
    },
    { rootMargin: '1200px' },
  );
  boxes.forEach((b) => io.observe(b));
}
