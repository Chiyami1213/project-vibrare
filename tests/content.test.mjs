import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { refSource, safeHtml, slug, toItem, toItems } from '../src/scripts/content.ts';

test('safeHtml keeps <b> and <i> and nothing else', () => {
  assert.equal(safeHtml('a <b>bold</b> and <i>italic</i>'), 'a <b>bold</b> and <i>italic</i>');
  assert.equal(safeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(safeHtml('<a href="x" onclick="y">link</a>'), '&lt;a href=&quot;x&quot; onclick=&quot;y&quot;&gt;link&lt;/a&gt;');
  assert.equal(safeHtml('5 < 6 & 7 > 3'), '5 &lt; 6 &amp; 7 &gt; 3');
});

test('toItem accepts the three shapes the packs use', () => {
  assert.deepEqual(toItem('plain <b>x</b>'), { html: 'plain <b>x</b>', refs: [] });
  assert.deepEqual(toItem({ text: 'Q text', refs: ['Q XI, p. 1'] }), { html: 'Q text', refs: ['Q XI, p. 1'] });
  assert.deepEqual(toItem({ html: '<i>rich</i>', text: 'rich', refs: ['p. 80'] }), { html: '<i>rich</i>', refs: ['p. 80'] });
  assert.deepEqual(toItems(undefined), []);
});

test('reference prefixes and slugs', () => {
  assert.equal(refSource('Q XI §12, p. 123'), 'Q');
  assert.equal(refSource('CPE III §23, p. 157'), 'CPE');
  assert.equal(refSource('LM IX (cross-ref)'), 'LM');
  assert.equal(refSource('p. 80'), '');
  assert.equal(slug('Part Writing & Voice Leading'), 'part-writing-voice-leading');
});

test('every rule and guideline in the four packs converts to an item with text', () => {
  const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}`, import.meta.url), 'utf8'));
  const hip = read('hip/data/hip.json');
  const fux = read('counterpoint/data/fux.json');
  const fug = read('fugue/data/fugue-theory.json');
  const ana = read('fugue/data/fugue-analysis.json');
  let n = 0;
  const check = (xs) => {
    for (const it of toItems(xs)) {
      assert.ok(it.html.length > 0);
      n++;
    }
  };
  for (const t of hip.topics) {
    check(t.rules);
    check(t.guidelines);
  }
  for (const c of [...fux.chapters, ...fug.chapters]) for (const b of c.ruleBoxes ?? []) check(b.items);
  for (const t of ana.topics) {
    check(t.rules);
    check(t.guidelines);
  }
  for (const f of ['p1', 'p2', 'p3', 'p5', 'p6']) for (const t of read(`tonal-harmony/data/part-${f}.json`).topics) {
    check(t.rules);
    check(t.guidelines);
  }
  assert.ok(n > 600, `converted ${n} items`);
});
