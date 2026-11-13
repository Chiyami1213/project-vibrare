// Build the HIP tools (div[data-hiptool]) when they come into view.
import { makeQueue, whenIdle } from '../partimento/mount';

export function mountHipTools(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-hiptool]')];
  if (boxes.length === 0) return;
  whenIdle(() => void import('./tools'));
  const enqueue = makeQueue();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        enqueue(async () => (await import('./tools')).mountHipTool(el, el.dataset.hiptool!));
      }
    },
    { rootMargin: '1200px' },
  );
  boxes.forEach((b) => io.observe(b));
  // a link to #tool-… must find the tool built: open it at once when the address asks for it
  if (location.hash.startsWith('#tool-')) {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.dataset.hiptool) enqueue(async () => (await import('./tools')).mountHipTool(el, el.dataset.hiptool!));
  }
}
