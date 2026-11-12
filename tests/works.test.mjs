import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../src/data/works.ts';

test('Works categories: alphabetical, Miscellaneous last', () => {
  const labels = CATEGORIES.map((c) => c.label);
  assert.equal(labels.at(-1), 'Miscellaneous');
  const rest = labels.slice(0, -1);
  assert.deepEqual(rest, [...rest].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  assert.deepEqual(labels, ['Anime', 'Commissions', 'Concert Band', 'Flute', 'Ghibli', 'Touhou Project', 'Vocaloid', 'VTubers', 'Miscellaneous']);
  assert.equal(new Set(CATEGORIES.map((c) => c.id)).size, CATEGORIES.length);
});
