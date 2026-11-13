// The tonal-harmony tools, against the tables and rules of the pack (content/tonal-harmony).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../src/scripts/harmony/tools-pure.ts';

const read = (n) => JSON.parse(readFileSync(new URL(`../content/tonal-harmony/data/${n}.json`, import.meta.url), 'utf8'));
const TOPICS = ['p1', 'p2', 'p3', 'p5', 'p6'].flatMap((p) => read(`part-${p}`).topics);
const table = (topic, id) => TOPICS.find((t) => t.id === topic).tables.find((x) => x.id === id);
const chord = (n, major = true, tonic = 'C') => T.chordFromNumeral(tonic, major, n);
const notes = (n, major, tonic) => chord(n, major, tonic).notes.join(' ');

test('chords from Roman numerals: triads, sevenths, inversions, spelling', () => {
  assert.equal(notes('V7'), 'G B D F');
  assert.equal(notes('viiø7'), 'B D F A');
  assert.equal(notes('vii°7'), 'B D F Ab');
  assert.equal(notes('ii7'), 'D F A C');
  assert.equal(notes('bVI'), 'Ab C Eb');
  assert.equal(notes('iv'), 'F Ab C');
  assert.equal(notes('V7', true, 'F#'), 'C# E# G# B');
  assert.equal(notes('V', false, 'A'), 'E G# B');
  assert.equal(notes('vii°7', false, 'A'), 'G# B D F');
  assert.equal(notes('VII', false, 'A'), 'G B D');
  assert.equal(chord('V65').bass, 'B');
  assert.equal(chord('V65').figures, '6/5');
  assert.equal(chord('V43').bass, 'D');
  assert.equal(chord('V42').bass, 'F');
  assert.equal(chord('vii°6').figures, '6');
  assert.equal(chord('I64').figures, '6/4');
  assert.equal(chord('V7').symbol, 'G7');
  assert.equal(chord('X'), null);
});

test('chords: every numeral of the pack tables builds a chord', () => {
  const tables = [table('diatonic-chords', 'diatonic7'), table('mixture', 'mixture-chords')];
  let n = 0;
  for (const t of tables) for (const row of t.rows) for (const cell of row.slice(1)) {
    const num = cell.replace(/\s*\*|\s*\(.*\)/g, '').replace('Δ7', 'Δ7');
    if (!num) continue;
    const major = !/minor/i.test(row[0]);
    assert.ok(T.chordFromNumeral('C', major, num), `${row[0]}: ${num}`);
    n++;
  }
  assert.ok(n > 40);
});

test('secondary calculator: V, V7, vii° of a target, in the key of C', () => {
  const sec = (target) => Object.fromEntries(T.secondaryChords('C', true, target).map((s) => [s.numeral.split('/')[0], s.chord.notes.join(' ')]));
  assert.equal(sec('V').V, 'D F# A');
  assert.equal(sec('V').V7, 'D F# A C');
  assert.equal(sec('V')['vii°7'], 'F# A C Eb');
  assert.equal(sec('V')['viiø7'], 'F# A C E');
  assert.equal(sec('ii').V, 'A C# E');
  assert.equal(sec('vi').V7, 'E G# B D');
  assert.equal(sec('IV').V7, 'C E G Bb'); // V/IV = I itself, with the 7th added
  assert.ok(T.secondaryChords('C', true, 'ii')[0].steps.length >= 3);
});

test('secondary calculator: the analysis of a chromatic chord', () => {
  assert.equal(T.analyseSecondary('C', true, ['D', 'F#', 'A', 'C']).numeral, 'V7/V');
  assert.equal(T.analyseSecondary('C', true, ['A', 'C#', 'E']).numeral, 'V/ii');
  assert.equal(T.analyseSecondary('C', true, ['F#', 'A', 'C', 'Eb']).numeral, 'vii°7/V');
  assert.equal(T.analyseSecondary('C', true, ['G', 'B', 'D']).numeral, 'V/I');
  assert.equal(T.analyseSecondary('C', true, ['C', 'Eb', 'G']).numeral, null);
});

test('the progression chart: arrows against the chart are red, the tonic goes anywhere', () => {
  assert.deepEqual(T.progressionArrows('major', ['I', 'vi', 'ii', 'V', 'I']), ['ok', 'ok', 'ok', 'ok']);
  assert.deepEqual(T.progressionArrows('major', ['I', 'V', 'IV', 'I']), ['ok', 'back', 'ok']); // V → IV goes back
  assert.deepEqual(T.progressionArrows('major', ['V', 'vii°', 'V', 'I']), ['ok', 'ok', 'ok']);
  assert.deepEqual(T.progressionArrows('major', ['IV', 'ii']), ['ok']);
  assert.deepEqual(T.progressionArrows('major', ['ii', 'IV']), ['back']);
  assert.deepEqual(T.progressionArrows('minor', ['i', 'iv', 'V', 'i']), ['ok', 'ok', 'ok']);
  assert.deepEqual(T.progressionArrows('minor', ['VI', 'III']), ['back']);
  const chart = table('harmonic-progression', 'chart');
  assert.ok(chart.rows[0][1].includes('iii → vi'));
});

test('fifths substitution: 27 progressions, each ending V7 – I', () => {
  const paths = T.allSubstitutionPaths();
  assert.equal(paths.length, 27);
  assert.equal(new Set(paths.map((p) => T.substitutionPath('C', p).chords.map((c) => c.symbol).join(' '))).size, 27);
  const plain = T.substitutionPath('C', ['diatonic', 'diatonic', 'diatonic']);
  assert.deepEqual(plain.chords.map((c) => c.symbol), ['Em7', 'Am7', 'Dm7', 'G7', 'C']);
  const sec = T.substitutionPath('C', ['dominant', 'dominant', 'dominant']);
  assert.deepEqual(sec.chords.map((c) => c.symbol).slice(0, 3), ['E7', 'A7', 'D7']); // V7/vi, V7/ii, V7/V
  const lt = T.substitutionPath('C', ['leading', 'leading', 'leading']);
  assert.equal(lt.chords[0].notes.join(' '), 'G# B D F#'); // viiø7/vi: the leading-tone chord of a minor target is half-diminished
  assert.equal(lt.chords[2].notes.join(' '), 'F# A C Eb'); // V is major: vii°7/V is fully diminished

  for (const p of paths) assert.ok(T.substitutionPath('C', p).chords.every((c) => c.notes.length >= 3));
});

test('pivot chords: C major and G major share C, G, Em and Am', () => {
  const p = T.pivotChords({ tonic: 'C', major: true }, { tonic: 'G', major: true });
  assert.deepEqual(p.map((x) => `${x.inA}=${x.inB}`).sort(), ['I=IV', 'iii=vi', 'V=I', 'vi=ii'].sort());
  const minor = T.pivotChords({ tonic: 'A', major: false }, { tonic: 'C', major: true });
  assert.ok(minor.some((x) => x.inA === 'i' && x.inB === 'vi'));
});

test('mode mixture: the chords borrowed from the parallel minor, most common first', () => {
  const b = T.borrowedChords('C');
  const names = b.map((x) => x.numeral);
  assert.ok(names.includes('iv') && names.includes('bVI') && names.includes('bIII') && names.includes('bVII') && names.includes('ii°'));
  assert.ok(b.find((x) => x.numeral === 'iv').degrees.includes('♭6̂'));
  assert.ok(b.find((x) => x.numeral === 'bVII').degrees.includes('♭7̂'));
  assert.equal(b[0].degrees[0], '♭6̂'); // the most common borrowed degree first
  assert.ok(!names.includes('IV'));
});

test('augmented sixths and the Neapolitan, spelled in C', () => {
  assert.deepEqual(T.augmentedSixth('C', true, 'It').notes, ['Ab', 'C', 'F#']);
  assert.deepEqual(T.augmentedSixth('C', true, 'Fr').notes, ['Ab', 'C', 'D', 'F#']);
  assert.deepEqual(T.augmentedSixth('C', true, 'Ger').notes, ['Ab', 'C', 'Eb', 'F#']);
  assert.deepEqual(T.augmentedSixth('D', false, 'Ger').notes, ['Bb', 'D', 'F', 'G#']);
  assert.deepEqual(T.neapolitan('C').notes, ['F', 'Db', 'Ab']);
  assert.deepEqual(T.neapolitan('A').notes, ['D', 'Bb', 'F']);
  const t = table('aug6-spelling', 'aug6-types').rows;
  assert.ok(t[0][1].includes('A♭ – C – C – F♯'));
});

test('tendency tones: the leading tone, the chordal 7th and the tritone', () => {
  const v7 = T.tendencies('C', true, ['G', 'B', 'D', 'F'], true).map((t) => t.kind);
  assert.ok(v7.includes('Leading tone 7̂') && v7.includes('Chordal 7th') && v7.includes('Tritone'));
  assert.ok(T.tendencies('C', true, ['F', 'Ab', 'C'], false).some((t) => t.kind === '♭6̂'));
  assert.deepEqual(T.tendencies('C', true, ['C', 'E', 'G'], false), []);
});

test('motion classifier: the kinds, and parallel, contrary, hidden and unequal fifths', () => {
  const m = (a1, b1, a2, b2) => T.classifyMotion(a1, b1, a2, b2);
  assert.equal(m('E4', 'C4', 'F#4', 'D4').kind, 'parallel');
  assert.equal(m('E4', 'C4', 'G4', 'D4').kind, 'similar');
  assert.equal(m('E4', 'C4', 'E4', 'D4').kind, 'oblique');
  assert.equal(m('E4', 'C4', 'D4', 'D4').kind, 'contrary');
  assert.ok(m('G4', 'C4', 'A4', 'D4').flags.some((f) => /parallel fifths/.test(f)));
  assert.ok(m('C5', 'C4', 'D5', 'D4').flags.some((f) => /parallel octaves/.test(f)));
  assert.ok(m('G4', 'C4', 'A4', 'D4').flags.length >= 1);
  assert.ok(m('A4', 'D4', 'G4', 'C4').flags.some((f) => /parallel fifths/.test(f)));
  assert.deepEqual(m('A4', 'D4', 'D5', 'G3').flags.filter((f) => /consecutive/.test(f)).length, 1, 'a fifth and a twelfth are both fifths');
  assert.ok(m('E4', 'C4', 'A4', 'D4').flags.some((f) => /hidden fifth/.test(f)));
  assert.ok(m('G4', 'C4', 'F4', 'B3').flags.some((f) => /unequal/.test(f)), 'a perfect and a diminished fifth');
  assert.deepEqual(m('E4', 'C4', 'F4', 'F3').flags, [], 'an octave reached by contrary motion is allowed');
});

test('voicing explorer: ranges, spacing, position and doubling', () => {
  const good = T.voicingReport(['C', 'E', 'G'], ['E5', 'C5', 'G4', 'C3']);
  assert.ok(good.ranges.every((r) => r.ok));
  assert.ok(good.spacing.every((s) => s.ok));
  assert.deepEqual(good.doubling, { C: 2, E: 1, G: 1 });
  assert.deepEqual(good.missing, []);
  const bad = T.voicingReport(['C', 'E', 'G'], ['E5', 'C4', 'G3', 'C3']);
  assert.ok(!bad.spacing[0].ok, 'S–A wider than an octave');
  const out = T.voicingReport(['C', 'E', 'G'], ['C6', 'G4', 'E4', 'C2']);
  assert.ok(!out.ranges[0].ok && !out.ranges[3].ok);
  assert.equal(T.voicingReport(['C', 'E', 'G'], ['G4', 'E4', 'C4', 'C3']).position, 'closed');
  assert.deepEqual(T.voicingReport(['C', 'E', 'G'], ['G4', 'E4', 'E4', 'C3']).missing, []);
  assert.deepEqual(T.voicingReport(['C', 'E', 'G'], ['C5', 'C4', 'C4', 'C3']).missing.sort(), ['E', 'G']);
});

test('V7 resolution lab: a complete V7 goes to an incomplete I, an incomplete V7 to a complete I', () => {
  const ci = T.v7Lab(true, false);
  const ic = T.v7Lab(false, true);
  const cc = T.v7Lab(true, true);
  assert.ok(ci.works > 0, `complete V7 → incomplete I: ${ci.works}/${ci.total}`);
  assert.ok(ic.works > 0, `incomplete V7 → complete I: ${ic.works}/${ic.total}`);
  assert.ok(ci.example && ic.example);
  // in the example the 7th (F) falls to E and the leading tone (B) rises to C
  const ex = ci.example;
  const idxF = ex.v7.findIndex((n) => n.startsWith('F'));
  assert.ok(ex.one[idxF].startsWith('E'));
  assert.ok(cc.works < ci.works && cc.works < ic.works, 'complete + complete works less often');
  assert.ok(cc.total > 0 && (cc.works === 0 ? cc.reason.length > 0 : true));
});

test('meter lab: beats, divisions and accents', () => {
  assert.deepEqual([T.meterInfo('4/4').beats, T.meterInfo('4/4').division, T.meterInfo('4/4').pattern], [4, 2, 'S w M w']);
  assert.deepEqual([T.meterInfo('3/4').beats, T.meterInfo('3/4').pattern], [3, 'S w w']);
  assert.deepEqual([T.meterInfo('6/8').beats, T.meterInfo('6/8').division, T.meterInfo('6/8').type], [2, 3, 'Compound duple']);
  assert.deepEqual([T.meterInfo('12/8').beats, T.meterInfo('12/8').division], [4, 3]);
  assert.equal(T.meterInfo('9/8').type, 'Compound triple');
  assert.equal(T.meterInfo('2/2').type, 'Simple duple');
  assert.equal(T.meterGrid('12/8').length, 4);
  assert.equal(T.HEMIOLA.felt.filter(Boolean).length, 3);
});

test('overtone series: partials, ratios and intervals above the fundamental', () => {
  const c2 = 36;
  assert.equal(T.partial(c2, 2).name, 'C3');
  assert.equal(T.partial(c2, 3).name, 'G3');
  assert.equal(T.partial(c2, 4).name, 'C4');
  assert.equal(T.partial(c2, 5).name, 'E4');
  assert.equal(T.partial(c2, 5).cents, -14); // the 5th partial is 14 cents below the equal-tempered third
  assert.equal(T.partial(c2, 7).cents, -31);
  assert.equal(T.partial(c2, 3).cents, 2);
  const p = [4, 5, 6].map((n) => T.partial(c2, n).name);
  assert.deepEqual(p, ['C4', 'E4', 'G4']); // the major triad 4:5:6
});

test('clef reader: the bottom line of every clef, and the note at any position', () => {
  const bottom = Object.fromEntries(T.CLEFS.map((c) => [c.id, T.bottomLine(c)]));
  assert.equal(bottom.treble, 'E4');
  assert.equal(bottom.bass, 'G2');
  assert.equal(bottom.alto, 'F3');
  assert.equal(bottom.tenor, 'D3');
  assert.equal(bottom.soprano, 'C4');
  assert.equal(bottom['mezzo-soprano'], 'A3');
  assert.equal(bottom.french, 'G4');
  const treble = T.CLEFS.find((c) => c.id === 'treble');
  assert.equal(T.noteAt(treble, 8), 'F5'); // the top line
  assert.equal(T.noteAt(treble, -2), 'C4'); // middle C on the first ledger line below
  const alto = T.CLEFS.find((c) => c.id === 'alto');
  assert.equal(T.noteAt(alto, 8), 'G4');
  const clefTable = table('notation-basics', 'clefs').rows;
  assert.ok(clefTable.length >= 8);
  for (const row of clefTable.filter((r) => !/percussion/i.test(r[0]))) assert.ok(T.CLEFS.some((c) => c.label.toLowerCase().replace(/[()]/g, '').startsWith(row[0].toLowerCase().split(' ')[0])), row[0]);
});

test('figured bass explainer: the stacks of the pack table', () => {
  const ex = (key, bass, figs, major = true) => T.explainFigures(key, major, bass, figs);
  const set = (r) => r.notes.slice().sort().join('');
  assert.equal(set(ex('C', 'G2', '')), 'BDG');
  assert.equal(set(ex('C', 'E3', '6')), 'CEG');
  assert.equal(set(ex('C', 'G2', '6 4')), 'CEG');
  assert.equal(set(ex('C', 'G2', '7')), 'BDFG');
  assert.equal(ex('C', 'G2', '6 4').notes[0], 'G');
  assert.deepEqual(ex('C', 'B2', '6 5').notes.slice().sort(), ['B', 'D', 'F', 'G']);
  assert.deepEqual(ex('C', 'D3', '4 3').notes.slice().sort(), ['B', 'D', 'F', 'G']);
  assert.deepEqual(ex('C', 'F3', '4 2').notes.slice().sort(), ['B', 'D', 'F', 'G']);
  assert.equal(ex('C', 'G2', '').abbreviation, 'none');
  assert.equal(ex('C', 'B2', '6 5').abbreviation, '6/5/3 → 6/5');
  // an accidental alone alters the 3rd
  assert.ok(ex('A', 'E2', '#', false).notes.includes('G#'));
  assert.equal(ex('C', 'X1', ''), null);
  assert.equal(ex('C', 'G2', 'q'), null);
  const inv = table('figured-bass', 'inversion-figures').rows;
  assert.equal(inv.length, 4);
});

test('non-chord tones: the table lookup finds the right names', () => {
  assert.equal(T.nctFor('step', 'step in the same', 'weak')[0].type, 'Passing tone');
  assert.equal(T.nctFor('step', 'step in the opposite', 'weak')[0].type, 'Neighbour tone');
  assert.equal(T.nctFor('common tone', 'step down', 'strong')[0].type, 'Suspension');
  assert.equal(T.nctFor('common tone', 'step up', 'strong')[0].type, 'Retardation');
  assert.equal(T.nctFor('leap', 'step', 'strong')[0].type, 'Appoggiatura');
  const nct = table('nct-types', 'nct-table').rows;
  for (const r of T.NCT_ROWS) assert.ok(nct.some((row) => row[1].toLowerCase().includes(r.type.toLowerCase().split(' ')[0]) || row[2].startsWith(r.abbr)), r.type);
});

test('steps and intervals', () => {
  assert.equal(T.stepKind('E4', 'F4').kind, 'diatonic');
  assert.equal(T.stepKind('C4', 'C#4').kind, 'chromatic');
  assert.equal(T.stepKind('C4', 'D4').name, 'whole step');
  const iv = T.intervalReport('C4', 'E4');
  assert.deepEqual([iv.name, iv.semitones, iv.inversion, iv.sum, iv.compound], ['3M', 4, '6m', 9, false]);
  const c = T.intervalReport('C4', 'D5');
  assert.deepEqual([c.name, c.compound, c.simple], ['9M', true, '2M']);
  assert.equal(T.intervalReport('G4', 'C4').name, '5P'); // the lower note first: C4 up to G4
  const sizes = table('interval-size-quality', 'half-steps').rows;
  assert.ok(sizes[0][1].includes('P1'));
});

test('scale builder and modes', () => {
  const major = T.scaleReport('C', 'major');
  assert.deepEqual(major.steps, ['W', 'W', 'H', 'W', 'W', 'W', 'H']);
  assert.deepEqual(major.solfege, ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti']);
  assert.deepEqual(T.scaleReport('A', 'harmonic minor').steps, ['W', 'H', 'W', 'W', 'H', '1½', 'H']);
  assert.equal(T.scaleReport('C', 'chromatic').notes.length, 12);
  assert.equal(T.scaleReport('C', 'major pentatonic').notes.length, 5);
  assert.deepEqual(T.characteristicNote('C', 'lydian'), { degree: '4̂', note: 'F#', against: 'Ionian' });
  assert.equal(T.characteristicNote('C', 'dorian').note, 'A');
  assert.equal(T.characteristicNote('C', 'phrygian').note, 'Db');
  assert.equal(T.characteristicNote('C', 'ionian'), null);
  assert.deepEqual(T.MODE_BRIGHTNESS.slice(0, 2), ['lydian', 'ionian']);
});

test('voice leading: four voices, each chord within the ranges, moving little', () => {
  const chords = ['C', 'F', 'G', 'C'].map((r) => T.chordFromNumeral('C', true, { C: 'I', F: 'IV', G: 'V', B: 'V7' }[r]).notes);
  const v = T.voiceLead(chords);
  assert.equal(v.length, 4);
  for (const x of v) {
    assert.equal(x.length, 4);
    assert.ok(x[0] >= x[1] && x[1] >= x[2] && x[2] >= x[3]);
  }
  for (let i = 1; i < v.length; i++) assert.ok(v[i].slice(0, 3).reduce((s, m, k) => s + Math.abs(m - v[i - 1][k]), 0) <= 14);
  assert.equal(v[0][3] % 12, 0);
});

test('cadences: the order lists examples the pack has', () => {
  const ex = TOPICS.find((t) => t.id === 'cadences').examples.map((e) => e.id);
  for (const id of T.CADENCE_ORDER) assert.ok(ex.includes(id), id);
  assert.equal(T.CADENCE_ORDER.length, ex.length);
});
