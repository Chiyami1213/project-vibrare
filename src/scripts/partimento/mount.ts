// Mount the Example Players of a page when they come into view. The page puts the examples in a JSON script
// (id "examples-data": { exampleId: ExampleData }) and an empty <div class="player" data-example="exampleId"> for each.
import type { ExampleData } from './model';

export function mountExamples(): void {
  const raw = document.getElementById('examples-data')?.textContent;
  const data: Record<string, ExampleData> = raw ? JSON.parse(raw) : {};
  const boxes = [...document.querySelectorAll<HTMLElement>('.player[data-example]')];
  if (boxes.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const ex = data[el.dataset.example ?? ''];
        if (ex) void import('./player').then((m) => m.mountPlayer(el, ex));
      }
    },
    { rootMargin: '300px' },
  );
  boxes.forEach((b) => io.observe(b));
}
