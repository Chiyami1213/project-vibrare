import test from 'node:test';
import assert from 'node:assert/strict';
import { titleCase } from '../src/scripts/title-case.ts';

const cases = [
  ['Play a test chord', 'Play a Test Chord'],
  ['Hide upper voices (exercise)', 'Hide Upper Voices (Exercise)'],
  ['One after the other', 'One After the Other'],
  ['Search by name', 'Search by Name'],
  ['What is here', 'What Is Here'],
  ['A note on Touhou Project', 'A Note on Touhou Project'],
  ['Rule of the Octave', 'Rule of the Octave'],
  ['Moti del basso: chromatic, descending (laments)', 'Moti del Basso: Chromatic, Descending (Laments)'],
  ['Schemata: changing-note (dichotomous) schemata', 'Schemata: Changing-Note (Dichotomous) Schemata'],
  ['Schemata on pedal points: Quiescenza, Ponte, Indugio, Fenaroli', 'Schemata on Pedal Points: Quiescenza, Ponte, Indugio, Fenaroli'],
  ['Pre-galant', 'Pre-Galant'],
  ['Galant variant', 'Galant Variant'],
  ['Half-diminished 7th', 'Half-Diminished 7th'],
  ['Minor add 11', 'Minor Add 11'],
  ['Major 7th sus4', 'Major 7th sus4'],
  ['Suspended 2nd (sus2)', 'Suspended 2nd (sus2)'],
  ['Perfect octave (P8)', 'Perfect Octave (P8)'],
  ['Melodic minor (ascending)', 'Melodic Minor (Ascending)'],
  ['Fifth up, fourth down (Monte Romanesca, Quartfall)', 'Fifth Up, Fourth Down (Monte Romanesca, Quartfall)'],
  ['Fourth down, second up (leaping Romanesca / Pachelbel bass)', 'Fourth Down, Second Up (Leaping Romanesca / Pachelbel Bass)'],
  ['Tied bass: (5–)6/4+/2–6(/5)', 'Tied Bass: (5–)6/4+/2–6(/5)'],
  ['Lamento: (6–)7–6', 'Lamento: (6–)7–6'],
  ['3 parts (HCP §2.5)', '3 Parts (HCP §2.5)'],
  ['2-part prototype', '2-Part Prototype'],
  ['3-part, minor (natural)', '3-Part, Minor (Natural)'],
  ['Variant II, 4 parts, major', 'Variant II, 4 Parts, Major'],
  ['Stabat Mater Prinner (SMP)', 'Stabat Mater Prinner (SMP)'],
  ['Do-Re-Mi', 'Do-Re-Mi'],
  ['Circle of fifths', 'Circle of Fifths'],
  ['Regola dell’ottava', 'Regola dell’ottava'],
  ["Regola dell'ottava", "Regola dell'ottava"],
  ['Subject and answer', 'Subject and Answer'],
  ['Schema (schemata)', 'Schema (Schemata)'],
  ['Dominant (V)', 'Dominant (V)'],
  ['YouTube', 'YouTube'],
];

for (const [input, expected] of cases) {
  test(`title case: ${input}`, () => assert.equal(titleCase(input), expected));
}

test('title case is stable when applied twice', () => {
  for (const [, out] of cases) assert.equal(titleCase(out), out);
});
