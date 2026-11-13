// Build the History tools (div[data-htool]) when they come into view.
export function mountHistoryTools(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-htool]')];
  if (boxes.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        void import('./tools').then((m) => m.mountHistoryTool(el, el.dataset.htool!));
      }
    },
    { rootMargin: '300px' },
  );
  boxes.forEach((b) => io.observe(b));
}
