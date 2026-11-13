// What the tonal-harmony tools need from the content: the cadence and error examples, and the period and form tables.
import { INDEX, PARTS, exampleData, getTopic } from '../../../data/tonal-harmony';

export function GET() {
  const topics = PARTS.flatMap((p) => p.file.topics);
  const examples = (id: string) => (getTopic(id)?.examples ?? []).map((e) => ({ ...exampleData(e), caption: e.caption ?? '', intent: e.intent, checker: e.checker ?? [] }));
  const table = (topic: string, id: string) => getTopic(topic)?.tables?.find((t) => t.id === id) ?? null;
  const errors = topics.flatMap((t) => (t.examples ?? []).filter((e) => e.intent === 'error').map((e) => ({ ...exampleData(e), caption: e.caption ?? '', topic: t.id, checker: e.checker ?? [], expect: e.expect ?? [] })));
  const body = {
    cadences: examples('cadences'),
    nct: examples('nct-types'),
    errors,
    periods: table('periods', 'period-types'),
    forms: table('forms', 'form-table'),
    clefs: table('notation-basics', 'clefs'),
    checks: INDEX.checks,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
