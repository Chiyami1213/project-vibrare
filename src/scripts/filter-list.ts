// A search box and a row of choice buttons that show and hide the items of a list.
//   <input data-filter-input>                 the words to look for (in the item's data-search)
//   <button data-filter-group="era" data-value="baroque">   one choice of a group; "all" shows everything
//   <li data-filter-item data-search="…" data-era="baroque">
//   <p data-filter-count>                      "12 of 132 shown"
export function mountFilter(): void {
  const input = document.querySelector<HTMLInputElement>('[data-filter-input]');
  const items = [...document.querySelectorAll<HTMLElement>('[data-filter-item]')];
  if (items.length === 0) return;
  const choice: Record<string, string> = {};
  const count = document.querySelector<HTMLElement>('[data-filter-count]');
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');

  function apply() {
    const words = (input?.value ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const el of items) {
      const text = (el.dataset.search ?? '').toLowerCase();
      const okText = words.every((w) => text.includes(w));
      const okChoice = Object.entries(choice).every(([g, v]) => v === 'all' || (el.dataset[g] ?? '').split(' ').includes(v));
      el.hidden = !(okText && okChoice);
      if (!el.hidden) shown++;
    }
    // a group of items (a heading with its list) hides when nothing in it is shown
    document.querySelectorAll<HTMLElement>('[data-filter-section]').forEach((s) => {
      s.hidden = !s.querySelector('[data-filter-item]:not([hidden])');
    });
    if (count) count.textContent = `${shown} of ${items.length} shown`;
    if (empty) empty.hidden = shown > 0;
  }

  input?.addEventListener('input', apply);
  document.querySelectorAll<HTMLButtonElement>('[data-filter-group]').forEach((b) => {
    b.addEventListener('click', () => {
      const g = b.dataset.filterGroup!;
      choice[g] = b.dataset.value!;
      document.querySelectorAll<HTMLButtonElement>(`[data-filter-group="${g}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    });
  });
  apply();
}
