// The History pack (content/history) and the background panels the other packs carry: every reference resolves, so no
// link on the site can lead nowhere. (The pack's own tools/validate.py checks the same in Python.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}`, import.meta.url), 'utf8'));
const H = read('history/data/history.json');
const BG = {
  fux: read('counterpoint/data/history-background.json'),
  tonal: read('tonal-harmony/data/history-background.json'),
  partimento: read('partimento/data/history-background.json'),
  fugue: read('fugue/data/history-background.json'),
  hip: read('hip/data/history-background.json'),
};
const ids = (xs) => xs.map((x) => x.id);
const set = (xs) => new Set(ids(xs));

test('ids are unique in every list', () => {
  for (const k of ['articles', 'people', 'works', 'events', 'terms', 'quiz', 'tools', 'eras', 'threads']) {
    assert.equal(set(H[k]).size, H[k].length, k);
  }
});

test('article ids do not collide with the index pages', () => {
  for (const a of H.articles) assert.ok(!['timeline', 'people', 'glossary', 'quiz'].includes(a.id), a.id);
});

test('articles point at real threads, eras, people, works, terms and tools', () => {
  const threads = set(H.threads), eras = set(H.eras), people = set(H.people), works = set(H.works), terms = set(H.terms), tools = set(H.tools);
  for (const a of H.articles) {
    assert.ok(threads.has(a.thread), `${a.id} thread`);
    for (const e of a.eras) assert.ok(eras.has(e), `${a.id} era ${e}`);
    for (const p of a.people) assert.ok(people.has(p), `${a.id} person ${p}`);
    for (const w of a.works) assert.ok(works.has(w), `${a.id} work ${w}`);
    for (const t of a.terms) assert.ok(terms.has(t), `${a.id} term ${t}`);
    for (const t of a.tools) assert.ok(tools.has(t), `${a.id} tool ${t}`);
    assert.ok(a.span.from < a.span.to, `${a.id} span`);
  }
});

test('works, events, people and terms name articles that exist', () => {
  const arts = set(H.articles);
  for (const k of ['people', 'works', 'events', 'terms']) for (const x of H[k]) for (const id of x.articles) assert.ok(arts.has(id), `${k} ${x.id} -> ${id}`);
  const people = set(H.people);
  for (const w of H.works) if (w.author) assert.ok(people.has(w.author), `${w.id} author ${w.author}`);
});

test('quiz answers are within the options and name an article', () => {
  const arts = set(H.articles);
  for (const q of H.quiz) {
    assert.ok(arts.has(q.article), q.id);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id);
  }
});

test('every link to another tab leads to a background topic that exists', () => {
  const has = (tab, topic) => BG[tab].topics.some((t) => t.id === topic);
  for (const a of H.articles) for (const s of a.seeAlso) assert.ok(has(s.tab, s.topic), `${a.id} -> ${s.tab}/${s.topic}`);
  for (const t of H.terms) for (const x of t.taughtIn) assert.ok(has(x.tab, x.topic), `${t.id} -> ${x.tab}/${x.topic}`);
});

test('every background topic links back to articles that exist, and ids are unique across the site', () => {
  const arts = set(H.articles);
  const seen = new Set();
  for (const [tab, f] of Object.entries(BG)) {
    for (const t of f.topics) {
      assert.ok(!seen.has(t.id), `${tab}/${t.id} repeated`);
      seen.add(t.id);
      for (const a of t.historyArticles) assert.ok(arts.has(a), `${tab}/${t.id} -> ${a}`);
      for (const q of t.quiz) assert.ok(q.answer >= 0 && q.answer < q.options.length, `${tab}/${t.id} ${q.id}`);
    }
  }
});
