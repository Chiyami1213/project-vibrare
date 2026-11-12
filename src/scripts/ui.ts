import { makeRoot, type SpelledNote } from './theory';

export const byId = <T extends HTMLElement = HTMLSelectElement>(id: string) =>
  document.getElementById(id) as T;

/** Read a NoteSelect (letter + accidental) into a root note. */
export function readNote(id: string) {
  return makeRoot(Number(byId(`${id}-letter`).value), Number(byId(`${id}-acc`).value));
}

/** Draw notes as chips: the note name large, its interval above the root small. */
export function renderChips(container: HTMLElement, notes: SpelledNote[]) {
  container.replaceChildren(
    ...notes.map((n) => {
      const chip = document.createElement('div');
      chip.className = 'note-chip';
      const name = document.createElement('span');
      name.className = 'note-name';
      name.textContent = n.name;
      const interval = document.createElement('span');
      interval.className = 'note-interval';
      interval.textContent = n.interval;
      chip.append(name, interval);
      return chip;
    }),
  );
}

/** Re-run `render` whenever any of the given controls change. */
export function bind(ids: string[], render: () => void) {
  ids.forEach((id) => byId(id).addEventListener('change', render));
  render();
}
