# -*- coding: utf-8 -*-
"""Additions from the Neapolitan primary sources (Monuments of Partimenti editions, ed. R. O. Gjerdingen):

  Durante, Regole (Naples MSS 34.2.4 / Oc.3.40)            -> DR(page)
  Durante, Partimenti diminuiti                             -> DD(no)
  Fenaroli, Regole = Partimenti Book III (annotated)        -> FR(section)
  Fenaroli, Partimenti Books I, II, IV, V, VI (editor notes)
  Fenaroli, Movimenti (Sebastiani MS 22.1.23) and Furno, Movimenti del Partimento (I-Rsc A.Ms 3084)
cross-read with Sanguinetti, The Art of Partimento (2012) Ch. 9 Class III (suspensions) and Ch. 12 (diminution).

Applied by build.py after sanguinetti.py:
  NEW_GROUPS     groups added to the Schemata tab (suspensions, diminution)
  NEW_SCHEMATA   patterns (status 'textbook-only' = from the rule books, not from your notes)
  PATCH          id -> sources.napoli + extra verification checks on existing patterns
Every example string is in the mini-notation (realize.py). Examples marked 'Durante, Partimenti diminuiti …
transcribed' are transpositions of Durante's own diminutions; everything else is voiced by the builder.
"""
from data_schemata import ex

SG = 'Sanguinetti, The Art of Partimento (2012)'


def DR(p, title):
    return 'Durante, Regole p. %s "%s"' % (p, title)


def DD(n):
    return 'Durante, Partimenti diminuiti No. %s' % n


def FR(sec):
    return 'Fenaroli, Regole (Partimenti Book III) — %s' % sec


NEW_GROUPS = [
    {'id': 'suspensions', 'title': 'Suspensions (legature): the four dissonances',
     'notesPages': '— (Durante Regole pp. 6–13, 23–24, 38–41; Fenaroli Book III “Delle Dissonanze”)',
     'blurb': 'Added from the Neapolitan rule books. In partimento theory only suspensions count as dissonances (passing 7ths etc. belong to diminution). '
              'For each dissonance the masters list: the consonance that prepares it, the bass motion that produces it, the consonance that accompanies it, '
              'and where it resolves with a stationary or a moving bass. Learn these and you can find the suspensions in an unfigured bass.'},
    {'id': 'diminution', 'title': 'Diminution (Durante, Partimenti diminuiti)',
     'notesPages': '— (Durante Partimenti diminuiti; Sanguinetti Ch. 12; Fenaroli Books I, II, IV, V editor notes)',
     'blurb': 'Added from Durante’s Partimenti diminuiti: each partimento is preceded by two to five “modi” (styles) of embellishing one passage, which the player then applies to every parallel passage. '
              'Diminution turns the chordal realization into a fast, idiomatic right-hand line without changing the underlying harmony and voice leading.'},
]

SUS = dict(group='suspensions', kind='definition', modes=['major', 'minor'], textures=[3])
DIM = dict(group='diminution', kind='demo', modes=['major', 'minor'], textures=[2, 3])
RO = dict(group='rule-of-octave', kind='moto', modes=['major', 'minor'], textures=[4])
TB = lambda checks, flags=None: dict({'status': 'textbook-only', 'checks': checks}, **({'flags': flags} if flags else {}))

NEW_SCHEMATA = [
    # ------------------------------------------------------------------ suspensions
    dict(SUS, id='susp-principles', name='Suspensions: principles (preparation, accompaniment, resolution)',
         figures='4 (with 5) → 3 · 7 (with 3) → 6 · 9 (with 10, +5 if isolated) → 8 · bass 2 (with 4, ±6) → 3',
         summary='Four dissonances: the 2nd, 4th, 7th and 9th. They exist to make the consonances that follow more beautiful, so each must be prepared by a consonance and resolve to one. '
                 'The 4th, 7th and 9th sit in the upper voices; the 2nd is the bass suspension (the bass note is tied while the upper voices move to it). '
                 'Dissonance on the strong beat, resolution on the following weak beat.',
         rules=['Every upper-voice dissonance (4, 7, 9) is prepared in the same voice by a consonance on the previous note and resolves down by step.',
                'Preparing consonances: the 4th from 8, 3, 5 or 6 (also from the minor 7th or diminished 5th); the 7th from 8, 3, 5 or 6; the 9th from 3 or 5 only (from 8 it would make parallel octaves).',
                'Accompanying consonances: the 4th always with the 5th (so it can only stand on a bass note that naturally takes a 5th); the 7th with the 3rd; the 9th with the 10th (3rd).',
                'Primary resolution, bass stationary: 4→3, 7→6, 9→8; bass 2→3 (the bass resolves down).',
                'The 2nd and the 9th are different intervals in partimento theory: the 9th must be prepared, the 2nd (bass suspension) needs no preparation in the right hand — it is struck “di botto”.'],
         guidelines=['Secondary resolutions (bass moves while the dissonance resolves): 7→3 when the bass rises a 4th / falls a 5th; 9→3 when the bass falls a 3rd / rises a 6th; 9→6 when the bass rises a 3rd / falls a 6th; 4→6 when the bass falls a 4th.',
                     'Suspensions are harmonically placed: the 4–3 prepared by the 8 is the compound cadence; the 7–6 is the tenor clausula ②→①; the 9–8 usually stands on ④ (sometimes on ①). In sequences they are free of these tonal constraints.',
                     '(Sanguinetti, Table 9.4) Secondary accompaniments: 4th with 6th; 9th with 5th. Add the 5th to a 9th only when it is isolated, or when the 5th moves to 6 before the next 9th — otherwise parallel 5ths.',
                     'Practice order (Fenaroli Book II, editor’s notes): first make every suspension correctly prepared and resolved; then find places for motives; finally shape whole phrases and connect sequences with rising or falling lines.',
                     'Fenaroli: the minor 7th and diminished 5th count as consonances (they need no preparation); Pasquini, earlier, treated the false 5th as a dissonance. Follow the source you are realizing.'],
         examples=[],
         seeAlso=['susp-4th', 'susp-7th', 'susp-9th', 'susp-bass', 'fenaroli-definitions'],
         sources={'fenaroli': FR('Delle Dissonanze; legatura di quarta, settima, nona; legature del Basso'),
                  'sanguinetti': SG + ', Ch. 9 Class III: Suspensions (Table 9.4)',
                  'napoli': DR('6–13, 38–39', 'formazione della 4a / 7a / 9a') + '; Fenaroli Book II (editor’s notes)'},
         verification=TB(['Fenaroli Book III and Sanguinetti Ch. 9 agree on preparation, accompaniment and primary resolutions.',
                          'Durante’s Regole give the same preparations as figured-bass exercises (4th from 8/5/3/6; 7th from 8/5/3/6; 9th from 5/3).'])),

    dict(SUS, id='susp-4th', name='The 4th (4–3): six preparations', direction='mixed',
         bass='bass motion → preparation: up 5th/down 4th → 8 · down step → 3 · up step → 5 · up 3rd → 6 · up 4th → m7 · up semitone → d5',
         figures='(8/3/5/6/m7/d5) ⌒ 4–3 with 5',
         summary='The most important dissonance: the core of the compound and double cadences. Which consonance prepares the 4th depends only on how the bass moves to the note that carries it, so a bass line tells you where a 4–3 is possible.',
         rules=['From the 8: the bass rises a 5th or falls a 4th (① → ⑤): the compound cadence.',
                'From the 3: the bass falls a step (⑥ → ⑤, or ② → ①).',
                'From the 5: the bass rises a step (④ → ⑤, or ① → ②).',
                'From the 6: the bass rises a 3rd (③ → ⑤).',
                'From the minor 7th: the bass rises a 4th (⑤ → ①). From the diminished 5th: the bass rises a semitone (⑦ → ①).',
                'The 4th is always accompanied by the 5th, and resolves to the 3rd over the same bass note.'],
         guidelines=['(Sanguinetti) Secondary resolutions: 4 → diminished 5th when the bass falls a minor 3rd (it then rises a semitone as a new leading tone); 4 → 6 when the bass falls a 4th.',
                     'In three parts the suspension can sit in either upper voice; when the 5th would have to cross above the suspended voice, put the 4th in the lower voice (examples c, d).'],
         examples=[ex('s4-from8', 'a. From the 8 (bass ①→⑤)', 'C', '1:8,3 5:^4-3,5 | 1:8,3@2', source='Fenaroli Book III letter A / Durante Regole p. 6 (voiced by the builder)'),
                   ex('s4-from3', 'b. From the 3 (bass ⑥→⑤)', 'C', '6:3,6 5:^4-3,5 | 1:8,3@2', source='Fenaroli letter B / Durante p. 8 (voiced by the builder)'),
                   ex('s4-from5', 'c. From the 5 (bass ④→⑤), 4th in the lower voice', 'C', '4:3,5 5:5,^4-3 | 1:3,8@2', source='Fenaroli letter C / Durante p. 7 (voiced by the builder)'),
                   ex('s4-from6', 'd. From the 6 (bass ③→⑤)', 'C', '3:3,6 5:5>,^4-3 | 1:3,8@2', source='Fenaroli letter D / Durante p. 9 (voiced by the builder)'),
                   ex('s4-fromm7', 'e. From the minor 7th (bass ⑤→①)', 'C', '5:7,3 1:^4-3,8 | 1:3,8@2', source='Fenaroli letter E (voiced by the builder)'),
                   ex('s4-fromd5', 'f. From the diminished 5th (bass ⑦→①)', 'C', '7:5,3 1:^4-3,8 | 1:3,8@2', source='Fenaroli letter F (voiced by the builder)')],
         seeAlso=['susp-principles', 'fenaroli-definitions', 'c3-compound-perfect'],
         sources={'fenaroli': FR('Della legatura di quarta (letters A–F)'), 'sanguinetti': SG + ', Ex. 9.22–9.23',
                  'napoli': DR('6–9', '4ths prepared by 8vas / 5ths / 3rds / 6ths') + '; ' + DR('17–19', 'Cadences with 4ths prepared by 5ths')},
         verification=TB(['All six preparations quoted from Fenaroli; Durante gives the first four as separate exercises.'])),

    dict(SUS, id='susp-7th', name='The 7th (7–6, 7–3): four preparations', direction='mixed',
         bass='up step → 8 · up 4th/down 5th → 3 · up 6th/down 3rd → 5 · down step → 6',
         figures='(8/3/5/6) ⌒ 7–6 with 3 (bass holds) · 7 → 3 (bass up 4th / down 5th)',
         summary='Outside sequences, the suspended 7th belongs to the tenor clausula: it stands on ② (or on ⑤), resolves to a major 6th, and the bass then steps down to ①. When the bass instead rises a 4th or falls a 5th, the 7th resolves to the 3rd — the seed of the falling-fifths sequence with 7ths.',
         rules=['From the 8: the bass rises a step (① → ②).', 'From the 3: the bass rises a 4th or falls a 5th (⑥ → ②, ① → ④).',
                'From the 5: the bass rises a 6th or falls a 3rd (④ → ②).', 'From the 6: the bass falls a step (③ → ②).',
                'The 7th is accompanied by the 3rd. It resolves to the 6th if the bass holds, to the 3rd if the bass rises a 4th / falls a 5th.'],
         guidelines=['(Sanguinetti) The strongest resolution is to a major 6th — Paisiello and Insanguine allow nothing else; a minor 6th is possible on an untonicized ⑤ in major (Durante).',
                     'Chains: “descends by step: 7th then 6th” (Durante p. 25, sequences pp. 46–49) — see the 7–6 fauxbourdon; “7ths in falling fifths” (Durante p. 29) — example e.'],
         examples=[ex('s7-from8', 'a. From the 8 (bass ①→②→①)', 'C', '1:8,3 2:^7-6,3 | 1:8,3@2', source='Fenaroli letter G / Durante p. 10 (voiced by the builder)'),
                   ex('s7-from3', 'b. From the 3 (bass ⑥→②)', 'C', '6:3,8 2:^7-6,3 | 1:8,3@2', source='Fenaroli letter H / Durante p. 12 (voiced by the builder)'),
                   ex('s7-from5', 'c. From the 5 (bass ④→②)', 'C', '4:5,3 2:^7-6,3 | 1:8,3@2', source='Fenaroli letter I / Durante p. 11 (voiced by the builder)'),
                   ex('s7-from6', 'd. From the 6 (bass ③→②)', 'C', '3:6,3 2:^7-6,3 | 1:8,3@2', source='Fenaroli letter L / Durante p. 13 (voiced by the builder)'),
                   ex('s7-to3-chain', 'e. 7→3 in falling fifths (the two upper voices alternate)', 'C', '1:3,8 4:^7,3 | 7:3,^7 3:^7,3 | 6:3,^7 2:^7,3 | 5:3,^7 1:8,3',
                      caption='each 7th is prepared as a 3rd and resolves to the 3rd of the next bass', source='Durante Regole p. 29 “Moto di 7a di sbalzo”; Fenaroli letter M (voiced by the builder)')],
         seeAlso=['susp-principles', 'dsc-7-6-fauxbourdon', 'dis-4up-5down', 'rise-7-6'],
         sources={'fenaroli': FR('Della legatura di settima (letters G–M)'), 'sanguinetti': SG + ', Ex. 9.24–9.25',
                  'napoli': DR('10–13', '7ths prepared by 8vas / 5ths / 3rds / 6ths') + '; ' + DR('29', 'Descending 5ths with 7ths')},
         verification=TB(['Preparations and resolutions quoted from Fenaroli; Durante gives the same four preparations.'])),

    dict(SUS, id='susp-9th', name='The 9th (9–8): two preparations', direction='mixed',
         bass='up step → 3 · up 4th/down 5th → 5',
         figures='(3/5) ⌒ 9–8 with 10 (+5 when isolated)',
         summary='The ninth most often stands on ④, less often on ①. It can only be prepared by the 3rd or the 5th, and in practice the preparation and dissonance often pass between overlapping upper voices, so a chain of 9–8s sounds like a rising line (Pergolesi, Stabat Mater).',
         rules=['From the 3: the bass rises a step (① → ②, ③ → ④, ⑦ → ①).', 'From the 5: the bass rises a 4th or falls a 5th (① → ④, ⑤ → ①).',
                'Accompanied by the 10th (3rd); resolves to the 8 over the same bass note.'],
         guidelines=['Secondary resolutions: to the 3rd when the bass falls a 3rd / rises a 6th; to the 6th when the bass rises a 3rd / falls a 6th (the Stabat Mater pattern); Sala and Valente also allow the 5th when the bass falls a 5th.',
                     'Cotumacci’s “Rule of Ninth and Octave”: a stepwise chain of 9ths may carry the 5th as well only if the 5th moves to 6 before the next 9th.'],
         examples=[ex('s9-from3', 'a. From the 3 (bass ③→④), then a cadence', 'C', '1:3,8 3:6,3 | 4:3,^9-8 5:3,5 | 1:3,8@2', source='Fenaroli letter N / Durante p. 39 (voiced by the builder)'),
                   ex('s9-from5', 'b. From the 5 (bass ①→④), passing 7th on ⑤', 'C', '1:5,3 4:^9-8,3 | 5:7,3 1:3,8@2', source='Fenaroli letter O / Durante p. 38 (voiced by the builder)')],
         seeAlso=['susp-principles', 'rise-9-8', 'rise-9-8-leapfrog', 'stabat-mater-prinner'],
         sources={'fenaroli': FR('Della legatura di Nona (letters N–Q)'), 'sanguinetti': SG + ', Ex. 9.26–9.28, Fig. 9.3 (Cotumacci)',
                  'napoli': DR('38–39', '9ths prepared by 5ths / 3rds') + '; ' + DR('44–45', 'Sequences of 9ths')},
         verification=TB(['Quoted from Fenaroli; Durante and Sanguinetti agree.'])),

    dict(SUS, id='susp-bass', name='Bass suspensions: 4/2 (returning) and 4+/2 (moving on)', direction='DSC',
         bass='① ⌒ ⑦ ① (returns) · ① ⌒ ⑦ ⑥ ⑤ (continues down)', figures='4/2 (6) → 6/5 or 5♭/3 · 4+/2 (6) → 6 → 7–♯6 → 8',
         summary='The one suspension the realizer cannot skip, because the bass itself is tied or syncopated: whenever the partimento ties a note, the right hand plays a 2nd and a 4th above it (a 6th may be added), and the bass resolves down by step. Whether the bass then comes back or keeps going decides the quality of the 4th.',
         rules=['A tied or syncopated bass always takes 2 and 4 (± 6); the bass resolves down by step. No figures are needed to know this.',
                'Bass returns to the tied note (neighbour figure): the 4th is perfect (“quarta minore”). Over the resolution the 2nd stays as a 3rd, and the 4th either stays as a diminished 5th or rises to a 6th.',
                'Bass does not return (keeps descending): the 4th is augmented (“quarta maggiore”) and must rise a semitone to the 6th; the 2nd stays as the 3rd.',
                'The augmented-4th suspension moves the harmony to the key of the 5th: the next stepwise-falling bass note is no longer ⑦ of the old key but ③ of the new one.'],
         guidelines=['The 6th after the augmented 4th is often tied again over the next bass note as a 7–6, making a tenor clausula into the new key (example c).',
                     'In a chain of bass suspensions the 4ths follow the scale; the last one, on ④ going to ③, is augmented. In minor it is raised artificially; Valente allows all of them augmented “per modo cantabile”.',
                     'Durante (pp. 30–31): with a chain of ties the bass takes 4/2 each time; if the bass leaps up after a tie, read 5–6 instead of 2–4.'],
         examples=[ex('sb-return', 'a. 4/2 → 5♭/3 (bass returns)', 'C', '1:5,3 | 1~:4,2 7:5,3 | 1:3,8@2', source='Fenaroli letter R (voiced by the builder)'),
                   ex('sb-durante', 'b. Durante’s context: tied ① 4/2, ⑦ 6/5, ① then ④ ⑤ 4–3 ①', 'C', '1:8,5 | 1~:4,2 7:5,3 | 1:3,8 4:5,3 | 5:^4-3,5 1:8,3',
                      source='Durante Regole p. 23 “Della 4a minore” (third progression, simplified; voiced by the builder)'),
                   ex('sb-aug4', 'c. 4+/2 → 6 → 7–♯6 → 8 (moves to the key of V)', 'C', '1:5,3 | 1~:4+,2 7:6,3 | 6:^7-#6,3 5:8,3', source='Fenaroli letter S; Sanguinetti Ex. 9.29b (voiced by the builder)'),
                   ex('sb-4p', 'd. Four parts with the added 6th', 'C', '1:8,5,3 | 1~:6,4,2 7:6,5,3 | 1:5,3,8@2', source='Fenaroli letter R (voiced by the builder)')],
         seeAlso=['susp-principles', 'dsc-tied-bass', 'c4-discant'],
         sources={'fenaroli': FR('Delle legature del Basso (letters R–S)'), 'sanguinetti': SG + ', Ex. 9.29–9.31',
                  'napoli': DR('23–24', 'Tied basses with 4/2 or #4/2') + '; ' + DR('30–32', 'Chains of ties; leaps after ties take 5–6') + '; ' + DR('40–41', 'Tied basses in context')},
         verification=TB(['Rules quoted from Fenaroli and confirmed by Durante’s pp. 23–24 exercises (figures 4/2–6/5 and #4/2).'])),

    # ------------------------------------------------------------------ rule of the octave (Durante) + bass-motion rules
    dict(RO, id='ro-durante', name='Rule of the Octave (Durante’s version)', direction='ASC/DSC', bass='①–⑧ and ⑧–①',
         figures='Up: ① 5/3 ② 6 ③ 6 ④ 5/3 ⑤ 5/3 (struck twice) ⑥ 6 ⑦ 6/5 ⑧ · Down: ⑧ ⑦ 6 ⑥ ♯6 ⑤ 5/3 ④ 6/4(/2) ③ 6 ② 6 ① · Minor up: ② ♯6 … ♯⑥ 6 ♯⑦ 6/5 · Minor down: ♮⑦ 6 ♮⑥ ♯6 (augmented) ⑤ ♯ ④ 6/♯4(/2) ③ 6 ② ♯6',
         summary='Durante’s scale (“modulazione dei toni”), a generation before Fenaroli. Compared with Fenaroli’s standard version it is plainer going up — ② and ③ take simple 6ths and ④ a triad — and it repeats ⑤ so the ascent pauses on the dominant. Going down it agrees with Fenaroli on ⑥ (raised 6th leading to ⑤) and ④ (6/4/2). In minor the descending ⑥ takes the augmented 6th.',
         rules=['Ascending ④ takes a plain 5/3 in Durante (Fenaroli and most later masters: 6/5/3).', 'Descending ⑥ takes the raised (major) 6th that leads to ⑤; descending ④ takes 6/4 = 6/4/2.',
                'Minor, ascending: melodic minor, ♯⑥ with 6, ♯⑦ with 6/5. Descending: natural ⑦ and ⑥, ⑥ with ♯6 (an augmented 6th above the bass), ⑤ major, ④ 6/♯4(/2), ② ♯6.'],
         guidelines=['Use Durante’s scale when realizing Durante’s own partimenti; Fenaroli’s fuller figures (② 6/4/3, ④ 6/5/3) are the later Neapolitan standard.',
                     'Durante writes the scales in every key; practise them in all keys and positions, as with Fenaroli’s.'],
         examples=[ex('rod-up-major', 'Ascending, C major', 'C', '1:8,5,3 2:3,3,6 3:6,3,3 4:3,8,5 5:5,3,8 5:5,3,8 6:6,3,6 7:6,3,5 1:5,8,3', source='Durante Regole p. 20 (voiced by the builder)'),
                   ex('rod-down-major', 'Descending, C major', 'C', '1>:3,8,5 7:3,3,6 6:#6,3,8 5:8,3,5 4:2,4+,6 3:3,6,6 2:3,6,3 1:3,8,5', source='Durante Regole p. 21 (voiced by the builder)'),
                   ex('rod-up-minor', 'Ascending, A minor', 'a', '1:8,5,3 2:#6,3,3 3:3,3,6 4:3,8,5 5:5,#3,8 5:5,#3,8 #6:6,3,6 #7:6,3,5 1:5,8,3', source='Durante Regole p. 22 (voiced by the builder)'),
                   ex('rod-down-minor', 'Descending, A minor (augmented 6th on ⑥)', 'a', '1>:3,8,5 7:3,3,6 6:#6,3,8 5:8,#3,5 4:2,#4,6 3:3,6,6 2:3,#6,3 1:3,8,5', source='Durante Regole p. 22 (voiced by the builder)')],
         seeAlso=['ro-fenaroli', 'ro-bass-motion-rules', 'ro-essential-foundations'],
         sources={'napoli': DR('20–22', 'Rule of the Octave ascending / descending / minor'), 'sanguinetti': SG + ', Ch. 9 Class II (Durante vs Scarlatti vs Fenaroli)'},
         verification=TB(['Figures read from the bass exercises on Durante Regole pp. 20–22 (seven major keys, seven minor keys); the editor notes that ④ ascending “usually takes 6/5/3”.',
                          'The examples pass the parallel-5ths/8ves and doubled-leading-tone checks.'],
                         ['Durante’s ascending ② and ③ carry only “6”; the voicings use 6/3 (doubling the 3rd on ②). If you prefer 6/4/3 on ② as in Fenaroli, say so.',
                          'Descending minor ⑥: the edition prints (♯)6 in parentheses — read as an augmented 6th (F–D♯ in A minor). Check against the manuscript if this matters.'])),

    dict(RO, id='ro-bass-motion-rules', name='Durante’s interval rules for the bass (mi takes the 6th, etc.)', direction='mixed', bass='semitone and leading-tone motions',
         figures='rising semitone: lower note 6 · falling semitone: 2nd note 6 (at a close: 5) · M3 → 8 or 6 · M6 → 8 · d5 → 3',
         summary='Short rules in Durante’s Regole that let you harmonize an unfigured bass from its intervals alone. They are the reasoning behind the Rule of the Octave: a semitone in the bass marks a “mi” (the lower note of a rising semitone), which takes a 6th.',
         rules=['When the bass rises a semitone, the first note takes the 6th (it is a “mi”: ③ → ④, ⑦ → ①).',
                'When the bass falls a semitone, the second note takes the 6th (④ → ③ with 6 on ③) — but when the falling semitone closes a descent (⑥ → ⑤ in minor, a Phrygian ending), the last note takes the 5th (with a major 3rd).',
                'A major 3rd above the bass rises: to the 8 of the next bass (falling 5ths) or to its 6th.',
                'A major 6th expands to the octave (bass down a step, upper voice up a step).',
                'A diminished 5th contracts to a 3rd (bass up a semitone, upper voice down a step).'],
         guidelines=['Leaping bass after a tie: read 5–6, not 2–4 (Durante p. 31).', 'When the bass leaps down a 4th, a passing augmented 4th accompanied by a 6th can be inserted (Durante p. 27).',
                     'Ascending by step the bass “takes 5 then 6”; descending by step “7 then 6” (pp. 25–26) — the 5–6 and 7–6 moti.'],
         examples=[ex('rbm-mi', 'a. Rising semitones take the 6th (③→④, ⑦→①)', 'C', '1:3,5,8 3:8,3,6 4:5,8,3 7:3,5,6 1:8,3,5', source='Durante Regole p. 34 (voiced by the builder)'),
                   ex('rbm-fall', 'b. Falling semitone: 6th on the second note (④→③)', 'C', '1:5,3,8 4:3,8,5 3:6,3,8 | 2:6,4,3 1:8,5,3@2', source='Durante Regole p. 36 (voiced by the builder)'),
                   ex('rbm-phryg', 'c. Falling semitone at a close: 5th on the last note; M6 expands to 8', 'a', '4:8,5,3 6:6,3,8 | 5:8,#3,5@2', source='Durante Regole pp. 37, 42 (voiced by the builder)'),
                   ex('rbm-m3', 'd. Major 3rd → 8 (falling 5th) or → 6 (bass to ③)', 'C', '1:8,5,3 5:3,8,5 1:8,5,3 5:3,8,5 3:6,3,8', source='Durante Regole pp. 33, 35 (voiced by the builder)'),
                   ex('rbm-d5', 'e. Diminished 5th contracts to a 3rd', 'C', '7:5,3 1:3,8 | 7:5,3 1:3,8@2', source='Durante Regole p. 43 (voiced by the builder)')],
         seeAlso=['ro-durante', 'ro-fenaroli', 'rise-5-6', 'dsc-7-6-fauxbourdon', 'dis-4down-2up'],
         sources={'napoli': DR('25–27, 31, 33–37, 42–43', 'Quando il partimento ascende di mezzo tono vuole la 6a, …')},
         verification=TB(['Rule wording from Durante’s Regole (Italian with the edition’s English); examples are short demonstrations voiced by the builder.'])),

    # ------------------------------------------------------------------ diminution
    dict(DIM, id='dim-principles', name='Diminution: what changes and what stays',
         summary='Diminution transforms a slow, chordal (continuo-like) realization into a fast, idiomatic one. The harmony and the voice leading of the simple realization stay; the surface changes. '
                 'Neapolitan students learnt it by writing endless diminutions over the same cadences, scales and bass motions they used for partimenti, first in slow, species-like values and then in fast scales, arpeggios and passagework.',
         rules=['The diminished line must still realize the same chords and resolve the same dissonances as the plain realization — diminution decorates, it does not reharmonize.',
                'Once a “modo” (style) is chosen for a passage, apply it to every parallel passage (the same bass motion, the same transposed module).'],
         guidelines=['A decorated realization differs from a simple one in four ways (Sanguinetti): the right hand moves faster than the harmony; the right-hand line is a polyphonic melody (it alternates between voices of the underlying chords); the left hand may take part in the inner voices; rhythms are complementary between the hands.',
                     'Keep two levels apart: the surface rhythm (sixteenths, triplets) and the essential pulse (how often harmony and voice leading change). Abrupt changes of surface rhythm in the bass need a complementary figure in the right hand.',
                     'Levels of realization (Fenaroli Books I, II, IV, editor’s notes): block chords → a melody made of chord tones → passing and neighbour notes, motives taken from the bass → prepared dissonances and small figures → extended imitation and counterpoint.',
                     'Unfigured basses (Fenaroli Book IV): ask “which pattern is this?” rather than “which chord comes next?”.',
                     'Rhythmic continuity is the norm in Durante’s generation: once the right hand starts in eighths or sixteenths it keeps going, except at grace notes and cadences.'],
         examples=[ex('dim-plain', 'Plain realization of the bass ⑦–① (compare the next pattern)', 'C', '7:6,3@1 1:8,3@0.25', parts=3, source='builder')],
         seeAlso=['dim-techniques', 'dim-lt-tonic', 'dim-movimenti'],
         sources={'sanguinetti': SG + ', Ch. 12 “The Art of Diminution” and Ch. 5 (Lavigna’s diminutions on the simple cadence)',
                  'napoli': 'Durante, Partimenti diminuiti (editor’s preface); Fenaroli Books I, II, IV and V (editor’s notes)'},
         verification=TB(['Paraphrased from Sanguinetti Ch. 12 and the Gjerdingen editions’ notes; not in your notes.'])),

    dict(DIM, id='dim-techniques', name='Catalogue of diminution techniques in Durante’s Diminuiti',
         summary='Durante’s diminuiti are wordless; the techniques below are what the styles (modi) actually do. The numbers point to the collection so you can study each one.',
         rules=[],
         guidelines=['Arpeggiation of the continuo chords (No. 1 Style 1; Sanguinetti Ex. 12.2).',
                     'Scalar runs that fill the space between chord tones (No. 1 Style 2).',
                     'Fast alternation of two voices, a violinistic figure (No. 7, Romanesca; Style 2 adds a 7–6).',
                     'Turns and neighbour figures over each bass note (No. 9 Style 1; triplets in Style 2).',
                     'Patterns that carry an interval progression: 5–6 (No. 9 Style 3, Nos. 12, 28; on the last eighth of each bass note in No. 51), parallel 6ths (No. 62 Style 2), parallel 3rds/10ths with the bass (Nos. 9, 58).',
                     'A leading tone placed before each new chord root (Nos. 43, 54); chromatic circles of fifths (No. 22 Style 5, Nos. 89–90). Leading tones accompanied by a diminished 5th that contracts to a 3rd (No. 73).',
                     'Fa–mi in the right hand against mi–fa in the bass, across the barline (Nos. 25, 26).',
                     'Call and response between soprano and alto, or between melody and bass (Nos. 36, 70, 83, 102).',
                     'Anticipating or echoing the bass motive in the right hand (Nos. 60, 76, 90, 92, 94) — the step from diminution to imitation.',
                     'Time stretching: the same chords spread over more or fewer bars (Nos. 64, 67, 68) — preparation for the free treatment of time in fugues.',
                     'Disguised basses: octave displacement of every other note, reordered steps, a note held from weak to strong beat implying a 4/2 (Nos. 50, 62, 87, 91, 100).'],
         examples=[], seeAlso=['dim-principles', 'dim-lt-tonic', 'dim-movimenti'],
         sources={'napoli': DD('1–104 (editor’s notes)'), 'sanguinetti': SG + ', Ch. 12 (Ex. 12.2–12.6)'},
         verification=TB(['Compiled from the editor’s notes to each number and checked against the scores of Nos. 1, 7, 9 and 11.'])),

    dict(DIM, id='dim-lt-tonic', name='Diminutions of the leading tone → tonic bass (mi–fa)', bass='⑦ → ①', direction='ASC',
         figures='⑦ 6 (6/5) → ① 3',
         summary='Durante opens the collection with the commonest bass of all, the rising semitone ⑦→①, and shows three manners of decorating it: an arpeggio rising through the dominant chord and falling by step to the tonic’s 3rd; a scale descending a 10th; and chords in the right hand while the left hand breaks the bass into octaves.',
         rules=['Whatever the figuration, the outer frame stays: ⑦ carries a 6 (or 6/5), the line lands on the 3rd of ①.'],
         guidelines=['The ⑦→① bass often leads into a compound cadence (No. 2) or a simple cadence in triple time (No. 4).', 'In minor the same figures apply with the raised ⑦ (No. 6).'],
         examples=[ex('dd1-s1', 'Durante No. 1, Style 1 (arpeggio, then scale)', 'C', '7:_-13-8-3-6-5-4-3@1 1:3@0.25', parts=2, source='Durante, Partimenti diminuiti No. 1 Style 1, transcribed and transposed from A major'),
                   ex('dd1-s2', 'Durante No. 1, Style 2 (descending scale)', 'C', '7:13>-12-11-10-9-8-7-6@1 1:3@0.25', parts=2, source='Durante, Partimenti diminuiti No. 1 Style 2, transcribed and transposed from A major')],
         seeAlso=['dim-principles', 'ro-bass-motion-rules'],
         sources={'napoli': DD('1–6, 25–27, 39, 66')},
         verification=TB(['Transcribed from the score of No. 1 (A major, two-sharp signature) and transposed to C.'])),

    dict(DIM, id='dim-movimenti', name='Diminutions over the moti del basso', direction='mixed',
         summary='Most of the Diminuiti decorate the standard bass motions (movimenti) — the same ones Fenaroli lists in his Rules and Furno sets in three parts. Learn one or two manners for each motion and you can apply them in any partimento.',
         rules=['Identify the movimento first (reduce octave displacements and reorderings), then choose a manner.'],
         guidelines=['Rising scale: 3–2–1 turns or 5–6 on each note (Nos. 9, 12, 13, 14, 28, 51, 64, 92); fast versions sound like fauxbourdon 6/3s (No. 13).',
                     'Up a 3rd, down a step: alternating 5/3 and 6/3, or 8–7 / 6 with passing 7ths (Nos. 11, 15, 16, 17, 20, 29, 44); with 7–6 suspensions (No. 98).',
                     'Down a 3rd, up a step: 6/3 or 6/5/3 on the second note (Nos. 50, 59, 72, 77–78 — fourteen treatments in all —, 91, 100, 102, 103).',
                     'Up a 4th, down a 3rd: Nos. 19, 21, 23, 30, 40, 52, 53. Up a 4th, down a 5th (circle of fifths): Nos. 16, 22 (diatonic and chromatic), 89.',
                     'Up a 5th, down a 4th: Nos. 24, 31 (passing 4/2), 43, 54, 62, 81, 88, 96. Up a 6th, down a 5th: Nos. 32–35, 80, 83, 93.',
                     'Descending 6/3 chords with 7–6 or implied 7ths: Nos. 71, 101, 103. Descending tetrachords: Nos. 42, 94, 95. Romanesca: Nos. 7, 8, 79, 99. Rising chromatic bass: Nos. 27, 55; falling: No. 75.'],
         examples=[ex('dd9-s1', 'Rising scale with 3–2–1 turns (Durante No. 9, Style 1)', 'C', '1:_-10-9-8@0.5 2:_-10-9-8@0.5 3:_-10-9-8@0.5 4:_-10-9-8@0.5 | 5:10@2', parts=2,
                      source='Durante, Partimenti diminuiti No. 9 Style 1, transcribed and transposed from D major (the final G is added by the builder)'),
                   ex('dd11-s2', 'Up a 3rd, down a step: 8–7 | 6–3 | 9–8 | 3 (Durante No. 11, Style 2)', 'C', '1:_@0.5 1:8>>-7@0.5 3:6-3@0.5 3:9-8@0.5 | 2:3@1', parts=2,
                      source='Durante, Partimenti diminuiti No. 11 Style 2, transcribed and transposed from F major'),
                   ex('dim-56-broken', 'Rising scale, 5–6 as broken chords', 'C', '1:3-5-8-6@0.5 2:3-5-8-6@0.5 3:3-5-8-6@0.5 4:3-5-8-6@0.5 | 5:3@2', parts=2,
                      source='builder (the 5–6 diminution of Nos. 12, 28, 50, simplified)')],
         seeAlso=['rise-5-6', 'dis-3up-2down', 'dis-3down-2up', 'dis-4up-3down', 'dis-4up-5down', 'dis-5up-4down', 'dis-6up-5down', 'romanesca-leaping'],
         sources={'napoli': DD('see guideline numbers') + '; Fenaroli, Movimenti (Sebastiani MS); Furno, Movimenti del Partimento',
                  'sanguinetti': SG + ', Ch. 12 (Ex. 12.6, Gj 16: up a 3rd/down a step + falling 5ths under a changing surface rhythm)'},
         verification=TB(['Movimento for each number taken from the editor’s notes; Nos. 9 and 11 transcribed from the score.'],
                         ['Durante No. 7 (Romanesca with a diminished bass) is described but not notated: its passing bass notes make the checker report false parallels.'])),
]

# ------------------------------------------------------------------ cross-check of existing patterns
FM = 'Fenaroli, Movimenti (Sebastiani MS 22.1.23) no. %s'
FU = 'Furno, Movimenti del Partimento §%s (three-voice dispositions)'


def pn(*parts):
    return '; '.join(parts)


PATCH = {
    'rise-5-6': dict(ref=pn(DR('26', 'Quando ascende vuole 5a e poi 6a'), FR('Movimenti I “Quinta che passa a sesta”'), DD('9, 12, 28, 50')),
                     checks=['Durante: “when the partimento ascends by step it takes the 5th and then the 6th”; Fenaroli adds that every note keeps its 3rd. Matches the data.']),
    'rise-7-6': dict(ref=pn(FR('Movimenti II “Settima che risolve a sesta”')),
                     checks=['Fenaroli: on a rising bass the 8 of each note is held as a 7 over the next and resolves to 6, then the voice leaps up a 3rd to the next octave. Matches the (8–)7–6 data.']),
    'dsc-7-6-fauxbourdon': dict(ref=pn(DR('25', 'Quando il partimento discende di grado vuole 7a e poi 6a'), DR('46–49', 'Sequences of 7–6'), DD('98, 101, 103')),
                                checks=['Durante: a stepwise descent takes the 7th and then the 6th. In Diminuiti Nos. 101 and 103 such chains end with a 4/2 on ④ that signals the cadence.']),
    'dsc-tied-bass': dict(ref=pn(DR('23–24, 30, 40–41, 50–51', 'tied basses with 4/2 and #4/2; sequences of 4/2–6'), FM % '11 (falls with ties)'),
                          checks=['Durante and Fenaroli: a tied bass takes 2 and 4; perfect 4th if the bass returns, augmented if it goes on down. See the new pattern “Bass suspensions”.']),
    'dis-3up-2down': dict(ref=pn(FM % '1', FU % '5', DD('11, 15–17, 20, 29, 44, 98')), checks=['Listed as a standard movimento by Fenaroli (no. 1) and Furno (§5).']),
    'dis-3down-2up': dict(ref=pn(FM % '2', FU % '6', DD('50, 59, 72, 77–78, 91, 100, 102–103')), checks=['Fenaroli no. 2, Furno §6; Durante usually puts a 6/3 or 6/5/3 on the second note.']),
    'dis-4up-3down': dict(ref=pn(FM % '3', FU % '7', DD('19, 21, 23, 30, 40, 52, 53')), checks=['Fenaroli no. 3, Furno §7.']),
    'dis-4down-2up': dict(ref=pn(FM % '4', DR('27', 'Descending 4ths with passing 6/#4')), checks=['Fenaroli no. 4 (“falls a 4th and rises a step”); Durante p. 27 inserts a passing augmented 4th with 6 when the bass leaps down a 4th.']),
    'dis-4up-5down': dict(ref=pn(FM % '5–6', FU % '8', DR('28–29', 'Descending 5ths with major 3rds / with 7ths'), DD('16, 22, 89')),
                          checks=['Durante p. 28: when the bass falls a 5th, the first note takes a major 3rd; p. 29: the 7ths version (7 → 3). Fenaroli nos. 5–6, Furno §8.']),
    'dis-5up-4down': dict(ref=pn(FM % '7', FU % '9', DD('24, 31, 43, 54, 62, 81, 88, 96')), checks=['Fenaroli no. 7, Furno §9.']),
    'dis-6up-5down': dict(ref=pn(FM % '8', DD('32–35, 49, 80, 83, 93')), checks=['Fenaroli no. 8 (“rises a 6th and falls a 5th”).']),
    'dis-2up-3down': dict(ref=pn(FU % '4'), checks=['Furno §4 (“rises by a step and falls by a third”).']),
    'chrom-monte': dict(ref=pn(FM % '10 (rises by semitone)', FU % '1–2', DD('27, 55')), checks=['Fenaroli no. 10 and Furno §1–2 (major ③→⑥, minor ⑤→①); Durante No. 27 treats each pair as leading tone + tonic.']),
    'lamento-7-6': dict(ref=pn(FM % '9 (falls by semitone)', FU % '3', DD('75')), checks=['Fenaroli no. 9, Furno §3 (falls by semitones ①→⑤). Durante No. 75: 4ths (often augmented) expanding to 6ths over a chromatic descent.']),
    'romanesca-leaping': dict(ref=pn(DD('7, 8, 79, 99')), checks=['Durante No. 7 Style 2 adds a 7–6 to the Romanesca diminution; No. 99 continues a fast Romanesca into a Monte.']),
    'ro-fenaroli': dict(ref=pn(DR('20–22', 'Rule of the Octave'), 'Fenaroli Book I (editor: the RO and the three cadences are prerequisites); Book VI No. 39 (giro through all keys, one movimento per key)'),
                        checks=['Durante’s earlier scale differs on ascending ②–④ (simple 6ths, triad on ④) — see the new pattern “Rule of the Octave (Durante’s version)”.']),
}
