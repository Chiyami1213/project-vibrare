// The interactive parts of the counterpoint pages: the examples (with the rule checker and their alternative versions),
// the workbenches and the tools. Each is built when it comes into view.
import type { FuxExampleData } from '../../data/counterpoint';

interface PageData {
  examples: Record<string, FuxExampleData>;
  workbenches: Record<string, { nv: 2 | 3 | 4; species: 1 | 2 | 3 | 4 | 5; cfPos: number; florid?: number; title: string; demo?: true }>;
}

export function mountCounterpoint(): void {
  const raw = document.getElementById('fux-data')?.textContent;
  const data: PageData = raw ? JSON.parse(raw) : { examples: {}, workbenches: {} };
  const targets = [...document.querySelectorAll<HTMLElement>('[data-fux], [data-wb], [data-tool]')];
  if (targets.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (el.dataset.fux) {
          const ex = data.examples[el.dataset.fux];
          if (ex) void import('./examples').then((m) => m.mountFuxExample(el, ex));
        } else if (el.dataset.wb) {
          const spec = data.workbenches[el.dataset.wb];
          if (spec) void import('./workbench').then((m) => m.mountWorkbench(el, spec));
        } else if (el.dataset.tool) {
          void import('./tools').then((m) => m.mountTool(el, el.dataset.tool!));
        }
      }
    },
    { rootMargin: '300px' },
  );
  targets.forEach((t) => io.observe(t));
}
