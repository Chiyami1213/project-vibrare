// Multiple-choice questions on the pages: the markup (see components/history/Quiz.astro) holds the right answer in
// data-answer; a click marks the choice, shows the right one and the explanation, and scores the set.
let done = false;

export function mountQuiz(): void {
  if (done) return; // several quizzes can share a page: one handler serves all
  done = true;
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.quiz-item .quiz-options button');
    if (!btn) return;
    const item = btn.closest<HTMLElement>('.quiz-item')!;
    if (item.dataset.done) return;
    item.dataset.done = '1';
    const right = Number(item.dataset.answer);
    const chosen = Number(btn.dataset.i);
    item.querySelectorAll<HTMLButtonElement>('.quiz-options button').forEach((b) => {
      const i = Number(b.dataset.i);
      if (i === right) b.classList.add('quiz-right');
      else if (i === chosen) b.classList.add('quiz-wrong');
      b.disabled = true;
    });
    item.querySelector<HTMLElement>('.quiz-why')!.hidden = false;
    const quiz = item.closest<HTMLElement>('.quiz')!;
    quiz.dispatchEvent(new CustomEvent('quiz-answer', { bubbles: true, detail: { right: chosen === right } }));
  });
}
