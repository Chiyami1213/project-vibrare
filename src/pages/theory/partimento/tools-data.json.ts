// The examples the partimento tools need (the quizzes, the combination builder, the grids), as one small file the page
// loads when a tool first comes into view, so that the pattern pages stay light.
import { CADENCES, SCHEMATA } from '../../../data/partimento';
import type { Pattern } from '../../../data/partimento';

const slim = (p: Pattern) => ({
  id: p.id,
  name: p.name,
  group: p.group,
  kind: p.kind,
  form: p.form,
  modes: p.modes,
  ex: [...(p.examples ?? []), ...(p.variants ?? []).flatMap((v) => v.examples ?? [])].map((e) => ({
    id: e.id,
    title: e.title,
    key: e.key,
    meter: e.meter,
    beatUnit: e.beatUnit,
    parts: e.parts,
    cross: e.cross ?? false,
    realized: e.realized,
  })),
});

export function GET() {
  const all = [...SCHEMATA.patterns, ...CADENCES.patterns].map(slim).filter((p) => p.ex.length > 0);
  return new Response(JSON.stringify({ patterns: all }), { headers: { 'Content-Type': 'application/json' } });
}
