// A Fux example on the page: the score (the shared Example Player), the version toggle where the book has one,
// and the rule checker, which marks the faulty notes on the staff and lists them.
import type { FuxExampleData } from '../../data/counterpoint';
import type { ExampleData } from '../partimento/model';
import { analyze } from './engine.js';
import { RULE_NAMES, kindOf, marksOf, verdict } from './rules';
import type { Issue, Voice } from './rules';
import { mountPlayer } from '../partimento/player';
import { sampler } from '../sampler';
import { titleCase } from '../title-case';

export const toEngine = (voices: Voice[]) => voices.map((v) => ({ role: v.role ?? 'cpt', species: v.species ?? 1, notes: v.notes }));

/** The issues of a score, limited to the rules the example is about when the book's example names them. */
export function checkVoices(voices: Voice[], only?: string[]): Issue[] {
  const all = analyze(toEngine(voices)).issues as Issue[];
  return only ? all.filter((i) => only.includes(i.rule)) : all;
}

const bar = (t: number) => Math.floor(t + 1e-6) + 1;

/** Fill `host` with the verdict and the list of issues. */
export function showIssues(host: HTMLElement, issues: Issue[], voiceNames: string[]): void {
  const v = verdict(issues);
  const head = document.createElement('p');
  head.className = `verdict ${v.tone}`;
  head.textContent = v.text;
  host.replaceChildren(head);
  if (issues.length === 0) return;
  const ol = document.createElement('ol');
  ol.className = 'issue-list';
  for (const i of issues) {
    const li = document.createElement('li');
    li.className = i.level;
    const tag = document.createElement('span');
    tag.className = 'issue-tag';
    tag.textContent = kindOf(i.level);
    const where = document.createElement('b');
    where.textContent = ` Bar ${bar(i.t)}, ${voiceNames[i.v] ?? `voice ${i.v + 1}`}: `;
    const rule = document.createElement('span');
    rule.className = 'issue-rule';
    rule.textContent = `${RULE_NAMES[i.rule] ?? titleCase(i.rule)}. `;
    li.append(tag, where, rule, i.msg ?? '');
    ol.append(li);
  }
  host.append(ol);
}

export function mountFuxExample(root: HTMLElement, ex: FuxExampleData): void {
  const stage = root.querySelector<HTMLElement>('.fux-stage')!;
  const result = root.querySelector<HTMLElement>('.fux-result')!;
  const controls = root.querySelector<HTMLElement>('.fux-controls')!;
  let alt = false;
  let checked = ex.auto;

  const names = () => (alt ? ex.alt! : ex.main).voiceNames ?? [];

  function render() {
    const data: ExampleData = alt && ex.alt ? ex.alt : ex.main;
    const voices = alt && ex.altVoices ? ex.altVoices : ex.voices;
    const issues = checked && ex.check ? checkVoices(voices, ex.only) : [];
    sampler.stop();
    const fresh = document.createElement('div');
    fresh.className = 'player';
    stage.replaceChildren(fresh);
    void mountPlayer(fresh, { ...data, marks: marksOf(issues) });
    if (checked && ex.check) showIssues(result, issues, names());
    else result.replaceChildren();
  }

  if (ex.alt && ex.toggleLabel) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'seg-btn';
    t.setAttribute('aria-pressed', 'false');
    t.textContent = titleCase(ex.toggleLabel);
    t.addEventListener('click', () => {
      alt = !alt;
      t.setAttribute('aria-pressed', String(alt));
      render();
    });
    controls.append(t);
  }
  if (ex.check && !ex.auto) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'seg-btn';
    c.setAttribute('aria-pressed', 'false');
    c.textContent = 'Check Against the Rules';
    c.addEventListener('click', () => {
      checked = !checked;
      c.setAttribute('aria-pressed', String(checked));
      render();
    });
    controls.append(c);
  }
  render();
}
