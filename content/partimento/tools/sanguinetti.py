# -*- coding: utf-8 -*-
"""Cross-check and additions from G. Sanguinetti, The Art of Partimento (OUP 2012), Ch. 9 "The Rules".

Applied by build.py after the notes-based data is loaded:
  PATCH         id -> extra checks / flags / guidelines + `sources.sanguinetti`
  NEW_GROUPS    groups that only exist because of Sanguinetti (Rule of the Octave reference)
  NEW_SCHEMATA  / NEW_CADENCES   patterns added from Sanguinetti (status 'textbook-only': not in your notes)
"""
from data_schemata import ex, var

SG = 'Sanguinetti, The Art of Partimento (2012), Ch. 9'


def s(sec):
    return '%s — %s' % (SG, sec)


PATCH = {
    # ---------------- cadences tab
    'fenaroli-definitions': dict(ref=s('Cadences; Classification of Cadences (Ex. 9.2–9.4, Table 9.1)'),
        checks=['Sanguinetti confirms Fenaroli\'s standard: simple = one metrical unit on ⑤, consonances only; compound = two units, 4–3 prepared by the 8 of ①, the 4th accompanied by the 5th or 6th; double = four units, 5/3 6/4 5/4 5/3.',
                'Sanguinetti: in Neapolitan teaching the cadence (①–⑤–①, only I and V) is also the first and simplest tonal structure; the Rule of the Octave is generated from it.'],
        add_guidelines=['(Sanguinetti) The simple cadence may also take a passing 7th over ⑤ (Fenaroli\'s "cadenza semplice con la passata della settima").',
                        '(Sanguinetti) Names differ between masters: Durante\'s "simple" cadence = Fenaroli\'s compound; Paisiello\'s compound inserts ④ (7–6 or 9–8 on ④); Tritto counts beats on ⑤: semplice 1, breve 2, composta 3, doppia 4. Check which master a source follows before naming a cadence.']),
    'nomenclature': dict(ref=s('Classification of Cadences'),
        checks=['Sanguinetti classifies cadences only by the number of metrical units on ⑤ (simple/compound/double) plus cadenza lunga and cadenza finta; the discant/tenor/Galant/Neapolitan layer of the naming system comes from Demeyere and IJzerman, not from the Neapolitan rule books.']),
    'cadenza-finta': dict(ref=s('Feigned Cadences (Ex. 9.8)'),
        checks=['Sanguinetti: Valente\'s cadenze finte are cadential progressions that delay the final tonic by expanding the pre-dominant (④–⑤–⑥ third-progression, ⑤ treated as passing until the end, ⑥ never with a triad) — "the schema Gjerdingen calls indugio". Consistent with the data.',
                'Gasparini (quoted by Sanguinetti) defines the feigned cadence more broadly: a cadence that moves to an unexpected degree, or resolves to minor instead of major.']),
    'converging-cadence': dict(ref=s('Feigned Cadences (Valente, Ex. 9.8b: ④ raised chromatically before ⑤)')),
    'c3-phrygian-half': dict(ref=s('Single Bass Motions — bass descending by half step (Durante, Ex. 9.9b)'),
        checks=['Sanguinetti: Durante\'s rule for a bass descending by half step is an archetypal Phrygian cadence — upper note of the half step gets the 6th, lower note the 5th (fa–mi).']),
    'c2-simple-tenor': dict(ref=s('Single Bass Motions'), checks=['Sanguinetti: the major 6th on ② going to ① concerns the end of stepwise descents (the tenor clausula); if ② leaps to ⑤ instead, ② takes a triad (Cotumacci).']),
    'c3-galant': dict(ref=s('Cadenze Lunghe (Ex. 9.5a)'),
        checks=['Sanguinetti: Pasquini\'s cadenza lunga ③ (6/3) – ④ (6/5) – ⑤ (5/4–5/3) – ① "will become the standard clausula in the galant and classical style" — the bass of the Galant cadence.']),
    'c4-galant': dict(ref=s('Cadenze Lunghe (Ex. 9.5a)')),
    # ---------------- schemata tab: moti del basso
    'rise-5-6': dict(ref=s('Ascending 5–6 (Ex. 9.32)'),
        checks=['Sanguinetti: the oldest alternative to the RO ("altra maniera"); 5 → 6 on every bass note, third voice in 3rds/10ths with the bass; major covers the octave, minor must stop on ⑤ (augmented 2nd); two beats per bass note; its usual descending partner is 7–6.']),
    'rise-7-6': dict(ref=s('Ascending 8⌒7–6 (Ex. 9.33)'),
        checks=['Sanguinetti: needs three beats per bass note in triple meter, four in duple (the dissonance must be longer); third voice in 3rds/10ths with the bass.'],
        flags=['Range in minor: the notes say the minor version spans only a fourth; Sanguinetti says it "must stop on ⑤" (①–⑤). Check which you mean.']),
    'rise-9-8': dict(ref=s('Ascending 10⌒9–8 (Ex. 9.34)'),
        checks=['Sanguinetti: cannot go beyond ⑤ in either mode — matches "stops at ⑤".']),
    'rise-9-8-leapfrog': dict(ref=s('Ascending 10⌒9–8 (Ex. 9.34b)'),
        checks=['Sanguinetti: when the two upper voices are a second apart they overlap and take the suspensions in turn; Fenaroli notates what is heard rather than strict voice leading — the leapfrog version.']),
    'dsc-stepwise-romanesca': dict(ref=s('Descending 5–6 (Ex. 9.35)'),
        checks=['Sanguinetti: the descending 5–6 is "a variant of the romanesca"; 5 on the first, 6 on the second note of each pair (fa–mi law); it cannot go beyond ③ — only three pairs.']),
    'dsc-5-6-42': dict(ref=s('Descending 5–6 with 4/2 (Ex. 9.35c–d)'),
        checks=['Sanguinetti: Fenaroli inserts a 4/2 (augmented 4th) between the triad and the 6th, approached from below or above; only one position (3rd on top).']),
    'dsc-fauxbourdon': dict(ref=s('Descending 6–6 (Ex. 9.36)'),
        checks=['Sanguinetti: first note 5/3 (counts as ①), then 6/3 chords; the last 6th acts as a leading tone and must be major, resolving up to the octave.'],
        add_guidelines=['(Sanguinetti) A shorter 6–6 descent that ends on a major 6th causes a scale mutation (the major 6th makes the arrival a new tonic).']),
    'dsc-tied-bass': dict(ref=s('Descending 6–6 variants (Ex. 9.36b–c, Tritto)'),
        checks=['Sanguinetti: with the tenor in parallel 6ths and the upper voices in 3rds, 5/6 and 4/2 alternate on each bass note — Tritto\'s "descending scale with diverse figures".']),
    'dsc-7-6-fauxbourdon': dict(ref=s('Descending 7–6 (Ex. 9.37)'),
        checks=['Sanguinetti: standard descending partner of the ascending 5–6; runs through the whole octave; suspensions in the top or inner voice.'],
        add_guidelines=['(Sanguinetti, after Cotumacci) The penultimate 6th is major when the bass falls a whole step to the goal; if it falls a half step the 6th is minor.']),
    'chrom-monte': dict(ref=s('Ascending Chromatic Motions (Ex. 9.38–9.41)'),
        checks=['Sanguinetti: of two notes a half step apart the chromatic (lower, "mi") one takes the 6th, the diatonic one the 5th; in major the chromatic ascent fits ③–⑥ — exactly this schema.'],
        add_guidelines=['(Sanguinetti) In minor the chromatic ascent fits ⑤–⑧ (Fenaroli, Partimenti Book III: 6 and 6 with false 5th); a full-octave chromatic ascent needs a repeated ③ or a diatonic finish after ⑥.']),
    'lamento-7-6': dict(ref=s('Descending Chromatic Motions (Ex. 9.42a)'),
        checks=['Sanguinetti: the favoured accompaniment of the chromatic ⑧–⑤ descent (passus duriusculus): the 7th falls on the chromatic note and resolves on the diatonic one; slower tempo than the diatonic 7–6.'],
        add_guidelines=['(Sanguinetti) Two less common alternatives: an early "omnibus" with a voice rising chromatically against the bass from a 10th on ♯⑦ to an augmented 6th on ♭⑥; or 6/3 chords only, ending with an augmented 6th.']),
    'dis-2up-3down': dict(ref=s('Rising by Step and Falling by Thirds (Ex. 9.45)'),
        checks=['Sanguinetti: sequential form of the rising half step (mi–fa); metrically ambiguous — often heard as "third down, step up".']),
    'dis-3up-2down': dict(ref=s('Rising by Thirds and Falling by Step (Ex. 9.46)'),
        checks=['Sanguinetti: two readings — rising by 3rds (the falling note shares the previous harmony) or falling by step (the first note offers a dissonant suspension, the data\'s 7–6 version).'],
        flags=['Sanguinetti\'s main Fenaroli version (Ex. 9.46a) is NOT accompanied sequentially: the accented notes follow the Rule of the Octave (Fenaroli: "a scale interrupted by the third"). The notes/data present the 7–6 sequential version as the default; consider adding the RO version.']),
    'dis-3down-2up': dict(ref=s('Falling by Thirds and Rising by Step (Ex. 9.47)'),
        checks=['Sanguinetti: first note takes the 5th, second the 6th (again mi–fa) — matches "5/3 strong, 6 weak".']),
    'dis-4up-3down': dict(ref=s('Rising by Fourths and Falling by Thirds (Ex. 9.48)'),
        checks=['Sanguinetti: an "essential motion" (triads); Fenaroli uses all diatonic triads, only one variant makes the "dominants" major.'],
        add_guidelines=['(Sanguinetti) Fenaroli limits this motion to the hexachord: it should not go beyond ⑥ (the next step would hit the ④–⑦ tritone).'],
        flags=['Sanguinetti attaches Gjerdingen\'s name "monte principale" to the motion rising by fourths and falling by FIFTHS (the descending circle), not to this one. Your notes and the data use it for 4th-up/3rd-down. Check Gjerdingen, Music in the Galant Style, to settle the name.']),
    'dis-4up-5down': dict(ref=s('Rising by Fourths and Falling by Fifths (Ex. 9.49)'),
        checks=['Sanguinetti: sequential form of the descending circle of fifths; essential motion, triads in the basic version.']),
    'dis-4down-2up': dict(ref=s('Falling by Fourths and Rising by Step = Romanesca (Ex. 9.50)'),
        checks=['Sanguinetti: the romanesca bass must span exactly one octave (⑧–①), so only three occurrences; basic version triads; the only sequence transposed by a third rather than a step — matches the data.']),
    'romanesca-leaping': dict(ref=s('Falling by Fourths and Rising by Step (Ex. 9.50, Fig. 9.4 Valente)')),
    'dis-5up-4down': dict(ref=s('Rising by Fifths and Falling by Fourths (Ex. 9.51)'),
        checks=['Sanguinetti: not usable in minor; at most three occurrences; in Fenaroli the penultimate triad is major (tonicizing the closing mediant) — Gjerdingen\'s monte romanesca. Matches the data.']),
    'monte-romanesca': dict(ref=s('Rising by Fifths and Falling by Fourths (Ex. 9.51)')),
    'dis-6up-5down': dict(ref=s('Rising by Sixths and Falling by Fifths (Ex. 9.52)'),
        checks=['Sanguinetti: two basic progressions — triads on both notes (a variant of the ascending 5–6), or triad + 6/3 (dominant + inverted tonic, so all triads major); a third version adds a suspended 7th.'],
        flags=['Your notes (and Fenaroli III, per the data) say this motion equals "third down, fourth up"; Sanguinetti writes that "no such motion exists in partimento rules". Not a contradiction of the music, only of the name — keep the notes\' wording.']),
    'prinner': dict(ref=s('Single Bass Motions (Ex. 9.9, Durante)'),
        checks=['Sanguinetti: the descending tetrachord with a 7–6 on the penultimate note (Durante, Pasquini) "corresponds to the schema Gjerdingen calls the Prinner".']),
    'sol-fa-mi': dict(ref=s('Partial Use of the RO (rule 41)'),
        checks=['Sanguinetti mentions "sol-fa-mi" only as a BASS figure: three notes descending by step whose first has a major 3rd are read as ⑤–④–③ of the Rule of the Octave. This is not Gjerdingen\'s melodic Sol-Fa-Mi schema, so the pattern stays notes-only.']),
    'do-re-mi': dict(ref='Sanguinetti, The Art of Partimento, Ch. 9 (RO segments) and Ch. 13 (seven patterns in double counterpoint, Ex. 13.5)',
        checks=['Sanguinetti: a do–re–mi bass is read as the first three degrees of the ascending RO; Ch. 13 lists Do-Re-Mi / Do-Si-Do among the seven common patterns in double counterpoint used for imitation.']),
    'quiescenza': dict(ref='Sanguinetti, The Art of Partimento (index: Quiescenza, p.344)'),
    'indugio': dict(ref=s('Feigned Cadences'), checks=['Sanguinetti identifies Valente\'s cadenza finta with Gjerdingen\'s indugio (see Cadences → Cadenza finta).']),
}

NEW_GROUPS_SCHEMATA = [
    {'id': 'rule-of-octave', 'title': 'Rule of the Octave (reference)', 'notesPages': '— (Sanguinetti Ch. 9, Class II)',
     'blurb': 'Added from Sanguinetti. Your notes mark several patterns "move to R.O."; this group gives the standard (Fenaroli) Rule of the Octave and the "essential foundations of the key" it is built on, so those links have a target.'},
]

ROBASE = dict(group='rule-of-octave', kind='moto', textures=[4], modes=['major', 'minor'])

NEW_SCHEMATA = [
    dict(ROBASE, id='ro-essential-foundations', name='Essential foundations of the key (basi fondamentali)', direction='static', bass='①–⑦',
         figures='① 3 5 8 · ② m3 M6 · ③ 3 6 · ④ 3 5 · ⑤ M3 5 · ⑥ 3 6 · ⑦ 3 6',
         summary='Fenaroli\'s rule (Regole, 1775, §5): every scale degree has a "natural" chord — triads on ①, ④, ⑤, sixth chords on the others. The Rule of the Octave adds optional dissonances to these (4 on ascending ②, 6 on ascending ④, false 5th on ⑦) or replaces them (6/4/2 on descending ④).',
         rules=['① takes 3, 5, 8; ② minor 3rd and major 6th; ③ 3rd and 6th; ④ 3rd and 5th; ⑤ major 3rd and 5th; ⑥ 3rd and 6th; ⑦ 3rd and 6th.'],
         guidelines=['Think of RO chords as essential foundation + added (accidental) interval.', 'Neapolitan masters taught: cadences first, then the scale (RO), then moti del basso, in all keys and all three positions.'],
         examples=[], sources={'other': s('The Essential Foundations of the Key, Table 9.2')},
         verification={'status': 'textbook-only', 'checks': ['Quoted from Fenaroli via Sanguinetti; not in your notes']}),
    dict(ROBASE, id='ro-fenaroli', name='Rule of the Octave (Fenaroli standard scale)', direction='ASC/DSC', bass='①–⑧ and ⑧–①',
         figures='Up: ① 5/3 ② 6/4/3 ③ 6/3 ④ 6/5/3 ⑤ 5/3 ⑥ 6/3 ⑦ 6/5/3 ⑧ 5/3 · Down: ⑧ 5/3 ⑦ 6/3 ⑥ ♮6/4/3 ⑤ 5/3 ④ 6/♯4/2 ③ 6/3 ② 6/4/3 ① 5/3 (minor: ascending melodic minor, ⑥ ♯6/4/3 descending)',
         summary='A single chord for each scale degree, so that every degree is recognisable by its harmony and its neighbours: the major triad on ① is followed by a 6/4/3 with major 6th, the one on ⑤ by a 6/3 with minor 6th. Ascending ④ adds a 6th to smooth ④–⑤; descending ④ takes 6/4+/2 to undo the "modulation" to V; ⑦ takes the false 5th to avoid parallel 5ths.',
         rules=['Ascending ⑤ and ① are the only triads; ④ ascending is 6/5/3, descending 6/♯4/2.', 'Descending ⑥ takes a major 6th (6/4/3) leading to ⑤.', 'In minor use the melodic form ascending; Fenaroli\'s abridged minor scale avoids ⑥–⑦ altogether (stays in the hexachord).'],
         guidelines=['Usable in fragments: any stepwise bass segment can be read as part of the RO once its scale degrees are identified (e.g. a do–re–mi bass = ①–②–③).', 'Practise in all keys and all three positions (8, 3 or 5 on top).', 'Earlier versions: Scarlatti uses only triads and 6/3 chords (triad on ⑥, ⑦ leaps to ⑤); Durante a 5th on ascending ④ where Scarlatti has a 6th.'],
         examples=[ex('ro-up-major', 'Ascending, C major', 'C', '1:8,5,3 2:6,4,3 3:6,3,8 4:6,5,3 5:5,3,8 6:8,6,3 7:6,5,3 1:8,5,3', source='Sanguinetti Ex. 9.11 (voiced by the builder)'),
                   ex('ro-down-major', 'Descending, C major', 'C', '1>:8,5,3 7:6,3,3 6:6,4,3 5:8,5,3 4:6,4+,2 3:6,3,8 2:6,4,3 1:8,5,3', source='Sanguinetti Ex. 9.11 (voiced by the builder)'),
                   ex('ro-up-minor', 'Ascending, A minor (melodic)', 'a', '1:8,5,3 2:6,4,3 3:6,3,8 4:6,5,3 5:5,#3,8 #6:8,6,3 #7:6,5,3 1:8,5,3', source='Sanguinetti Ex. 9.11 (voiced by the builder)'),
                   ex('ro-down-minor', 'Descending, A minor', 'a', '1>:8,5,3 7:6,3,8 6:#6,4,3 5:8,5,#3 4:6,#4,2 3:6,3,8 2:6,4,3 1:8,5,3', source='Sanguinetti Ex. 9.11 (voiced by the builder)')],
         seeAlso=['dsc-fauxbourdon', 'ro-essential-foundations'],
         sources={'other': s('Class II: Rule of the Octave (Ex. 9.10–9.14)')},
         verification={'status': 'textbook-only', 'checks': ['Figures from Sanguinetti Ex. 9.11 / Table 9.2; the examples pass the parallel-5ths/8ves checker'],
                       'flags': ['Not in your notes — added because several notes pages say "move to R.O.". Remove the group if you plan a separate RO page.']}),
    dict(id='dis-7up-8down', name='Seventh up (filled in), octave down', group='moti-disjunct', kind='moto', direction='DSC', bass='① (rising 7th by step) ↘ ⑦ … (each bar one step lower)',
         modes=['major'], textures=[3], figures='a dyad on the first note of each bar, held through the bar',
         summary='The bass climbs a 7th in passing notes and drops an octave; apart from the register shift it is a stepwise descent in bass and upper voices.',
         rules=[], guidelines=['Root-position triads on the accents only thinly disguise parallel 5ths/8ves (octave leaps and runs) — treat as a keyboard figuration, not as strict voice leading.'],
         examples=[], sources={'other': s('Rising by Sevenths and Falling by Octaves (Ex. 9.53)')},
         verification={'status': 'textbook-only', 'checks': ['Fenaroli motion listed by Sanguinetti; not in your notes'], 'flags': ['Score to be transcribed (no automatic realization: the bass contains passing notes).']}),
    dict(id='dis-thirds-down', name='Bass falling by thirds (non-sequential)', group='moti-disjunct', kind='moto', direction='DSC', bass='① ⑥ ④ ② ⑦ ⑤ … (or rising by sixths)',
         modes=['major', 'minor'], textures=[4], figures='5/3 on every note; Tritto: last note 7 6 5 3 with a 9th suspension (the 6 below the other voices)',
         summary='The only non-sequential disjunct bass motion: each note takes a triad and can be "considered as first of the key" (Tritto), so the tonal feeling is suspended until the motion ends.',
         rules=['Basic accompaniment: simple triads on every note.'], guidelines=['Tritto\'s dissonant variant on the last note: 3, 5, 6, 7 with the 6 in the lowest upper voice (a 9th suspension between tenor and soprano).'],
         examples=[ex('thirds-down', 'Falling thirds, C major', 'C', '1:3,8,5 6:5,3,8 4:8,5,3 2:3,8,5 7:3,3,5 5:8,5,3 1:3,8,5', caption='common tones held; triads throughout', source='Sanguinetti Ex. 9.54a (voiced by the builder)')],
         sources={'other': s('Nonsequential Motions: Bass Falling by Thirds (Ex. 9.54)')},
         verification={'status': 'textbook-only', 'checks': ['Listed by Sanguinetti (Tritto); not in your notes']}),
]

NEW_CADENCES = [
    dict(id='cadenza-lunga', name='Cadenza lunga (long cadence)', group='cad-related', kind='cadence', direction='ASC', bass='③–④–⑤–① (Pasquini); ⑤ preceded by any RO segment from ②, ③ or ④',
         modes=['major', 'minor'], textures=[4], figures='③ 6/3 · ④ 6/5 · ⑤ 5/4–5/3 · ①',
         summary='A cadence whose dominant is prepared by a pre-dominant degree (IV or II6) — close to the modern "cadential progression". Pasquini\'s version (stepwise ③–④–⑤ then the leap to ①) became the standard galant and classical cadence; Greco and Durante expand the tonic before it.',
         rules=['Pasquini: 6 on ③, 6/5 on ④, 5/4 then 5/3 on ⑤.'], guidelines=['Any RO segment ending on ⑤ followed by ① makes a long cadence.', 'Same bass as the Galant cadence (Cadences → Galant).'],
         examples=[ex('lunga-pasquini', 'Pasquini\'s long cadence, C major', 'C', '3:6,3,8 4:6,5,3 | 5:5,^4-3,8@2 | 1:8,5,3@2', source='Sanguinetti Ex. 9.5a (voiced by the builder)')],
         seeAlso=['c3-galant', 'ro-fenaroli'], sources={'other': s('Cadenze Lunghe (Ex. 9.5–9.7)')},
         verification={'status': 'textbook-only', 'checks': ['From Sanguinetti; not a separate item in your notes']}),
]
