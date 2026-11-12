# -*- coding: utf-8 -*-
"""Schemata tab content. Outline follows the user's handwritten notes
("Moti del Basso & Schemata Notes", 40 pp.; "HCP Notes" pp. 1-12).
Every example string uses the mini-notation documented in realize.py / BUILD_BRIEF.md.
Keys: 'C' = C major, 'a' = A minor, 'd' = D minor."""

DEM = 'https://essaysonmusic.com/'


def ex(id, title, key, notation, caption='', parts=None, meter='4/4', review=False, source=''):
    d = {'id': id, 'title': title, 'key': key, 'notation': notation, 'caption': caption, 'meter': meter}
    if parts:
        d['parts'] = parts
    if review:
        d['review'] = review
    if source:
        d['source'] = source
    return d


def var(id, name, desc, figures='', examples=None, review=False):
    d = {'id': id, 'name': name, 'description': desc}
    if figures:
        d['figures'] = figures
    if examples:
        d['examples'] = examples
    if review:
        d['review'] = review
    return d


GROUPS = [
    {'id': 'moti-diatonic-rising', 'title': 'Moti del basso: diatonic, rising stepwise', 'notesPages': '1–2',
     'blurb': 'Bass motion only. The bass rises by step; the upper voices are set with a repeating interval pattern.'},
    {'id': 'moti-diatonic-descending', 'title': 'Moti del basso: diatonic, descending stepwise', 'notesPages': '2–4',
     'blurb': 'The bass falls by step. These are the alternatives to the descending Rule of the Octave.'},
    {'id': 'moti-chromatic-rising', 'title': 'Moti del basso: chromatic, rising', 'notesPages': '5',
     'blurb': 'Chromatic leading tones in the bass make each segment a small cadence in a new key.'},
    {'id': 'moti-chromatic-descending', 'title': 'Moti del basso: chromatic, descending (laments)', 'notesPages': '6',
     'blurb': 'The chromatic tetrachord ①–⑤ in the bass: Lamento and Morte.'},
    {'id': 'moti-disjunct', 'title': 'Moti del basso: disjunct (sequences)', 'notesPages': '7–12',
     'blurb': 'Sequential basses. A model (prototype) is transposed by a second up or down; the Romanesca is the exception (down a third). Swapping the metric position of bass and chords ("metric inversion") creates a different pattern: A→B ≠ B→A.'},
    {'id': 'schemata-opening', 'title': 'Schemata: Romanesca, Prinner and opening gambits', 'notesPages': '13–21',
     'blurb': 'Schemata = a bass motion plus a set of upper voices. Embellishment by suspensions, non-chord tones, bass motion and combinations.'},
    {'id': 'schemata-changing-note', 'title': 'Schemata: changing-note (dichotomous) schemata', 'notesPages': '22–24',
     'blurb': 'Double-neighbour melodic shapes split into a question (opening) and an answer (closing). Aprile, Meyer and paired Do-Re-Mi can sound simultaneously.'},
    {'id': 'schemata-sequential', 'title': 'Schemata: Folia, Fonte, Monte, Monte Romanesca', 'notesPages': '25–32',
     'blurb': 'Larger sequential schemata, typically opening the second half of a binary form.'},
    {'id': 'schemata-pedal', 'title': 'Schemata on pedal points: Quiescenza, Ponte, Indugio, Fenaroli', 'notesPages': '33–39',
     'blurb': 'Pedal points on ①, ⑤ or ④ with stereotyped chord successions.'},
    {'id': 'schemata-combinations', 'title': 'Combinations of schemata', 'notesPages': '40',
     'blurb': 'Schemata chained into phrases; harmonic rhythm often accelerates.'},
]

P = []  # patterns


# =====================================================================
# 1  DIATONIC RISING
# =====================================================================
P.append({
    'id': 'rise-5-6', 'name': '5–6 (stepwise Monte)', 'aka': ['5–6 Monte', '5–6 chain'], 'group': 'moti-diatonic-rising',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–②–③–④–⑤–⑥–⑦–① (one step per bar)', 'modes': ['major', 'minor'], 'textures': [3, 4],
    'summary': 'Each bass note carries a 5/3 then a 6/3. The sixth is tied over and becomes the fifth of the next bar, so the potential parallel fifths are broken up.',
    'rules': ['The 6 on each bass note is held into the next bar as its 5 (tie).',
              'In 3 parts, one upper voice moves in parallel thirds (tenths) with the bass; the other does the 5–6.'],
    'guidelines': ['Major: can span the whole octave.',
                   'Minor: usually breaks off after ④ and closes ⑤ (5–7) → ①.',
                   'Invertible: 6↔3 and 4↔5 (green marks in notes p.1).'],
    'examples': [
        ex('rise-5-6-maj', 'Major, 3 parts', 'C', '1:5,3 1:6,3 | 2:^5,3 2:6,3 | 3:^5,3 3:6,3 | 4:^5,3 4:6,3 | 5:^5,3 5:6,3 | 6:^5,3 6:6,3 | 7:^5,3 7:6,3 | 1:^5,3@2'),
        ex('rise-5-6-min', 'Minor, 3 parts, closing ⑤ 5–7 → ①', 'a', '1:5,3 1:#6,3 | 2:^#5,3 2:#6,3 | 3:^#5,3 3:6,3 | 4:^5,3 4:6,3 | 5:^5,#3 5:7,#3 | 1:3,8@2',
           caption='Melodic-minor inflections (F♯, G♯) follow the rising bass, as in the notes.'),
    ],
    'sources': {'notes': 'Moti del Basso p.1', 'hcp': '§2.2 The Monte and the 7–6 Fauxbourdon', 'fenaroli': 'Book III, “Moves of the partimento”: rising stepwise I (5th moving to 6th)',
                'web': [DEM + 'diatonic-moti-del-basso-that-rise-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['HCP: “The Monte is a stepwise ascending sequence, in which 5/3 and 6/3 chords alternate.”',
                                                      'Demeyere: sixth tied to the next fifth; major spans an octave, minor stops after ④ while the bass still rises to ⑤.',
                                                      'Fenaroli III: rising stepwise, rule I = 5th moving to 6th, 6th held as next 5th.']},
})

P.append({
    'id': 'rise-3-6', 'name': '3–6 progression (3–6 Monte)', 'aka': ['alternation of thirds and sixths'], 'group': 'moti-diatonic-rising',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–②–③… (stepwise)', 'modes': ['major', 'minor'], 'textures': [2, 3],
    'summary': 'Two-part origin of the Monte: the upper voice alternates a third and a sixth over each bass note, leaping a fourth up and a third down.',
    'rules': ['Upper voice: 3 → 6 over the same bass note (4th up), then 3 over the next bass note (3rd down).'],
    'guidelines': ['The second type of 3–6 progression is the schema Third Down Second Up (see disjunct moti).', 'Minor: raise ⑥ and ⑦ when the bass ascends (melodic minor).'],
    'examples': [ex('rise-3-6-2p', 'Two parts, major', 'C', '1:3 1:6 | 2:3 2:6 | 3:3 3:6 | 4:3 4:6 | 5:3 5:6 | 6:3 6:6 | 7:3 7:6 | 1:3@2')],
    'variants': [var('rise-3-6-3p', '3-part 3–6 Monte', 'Three-part setting adding a voice to the 3–6 alternation (5/3 → 6/3 per bass note).',
                     figures='3 6 | 3 6 … over 5 6 | 5 6 … (notes p.1)', review='The voice assignment of the 3-part version on notes p.1 is ambiguous; no realization generated.')],
    'sources': {'notes': 'Moti del Basso p.1; HCP Notes p.1 (§1.2)', 'hcp': '§1.2 Alternation of Thirds and Sixths; §2.2'},
    'verification': {'status': 'partly', 'checks': ['HCP Terms: “two types of 3–6 progressions … alternation of thirds and sixths on a stepwise bass … second type is Third Down Second Up.”'],
                     'flags': ['3-part voicing not realized (ambiguous in the notes).']},
})

P.append({
    'id': 'rise-7-6', 'name': '(8–)7–6', 'aka': ['7–6 chain over a rising bass'], 'group': 'moti-diatonic-rising',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–②–③–…', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'The octave of each bass note is held as a 7th over the next one, resolves to 6, then leaps up a third to the new octave.',
    'rules': ['7 must be prepared (tied) and resolve down by step to 6.', 'Each resolution is followed by a rising third (back to the octave).'],
    'guidelines': ['Major can span the octave; minor only a fourth.', 'Minor alternative from ④: 7–6 5 | 9–8 7 | 3/8 (notes p.1).'],
    'examples': [ex('rise-7-6-maj', 'Major, 3 parts', 'C', '1:5,3 1:8,3 | 2:^7-6,3 2:8,3 | 3:^7-6,3 3:8,3 | 4:^7-6,3 4:8,3 | 5:^7-6,3 5:8,3 | 6:^7-6,3 6:8,3 | 7:^7-6,3 | 1:8,3@2')],
    'sources': {'notes': 'Moti del Basso p.1', 'fenaroli': 'Book III, rising stepwise II (7th resolving to 6th)', 'web': [DEM + 'diatonic-moti-del-basso-that-rise-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: “each resolution must be followed by a rising third”; major spans an octave, minor a fourth.', 'Fenaroli III rule II: octave held as 7th, resolves to 6th, rises a 3rd to the octave.']},
})

P.append({
    'id': 'rise-9-8', 'name': '(10–)9–8', 'group': 'moti-diatonic-rising', 'kind': 'moto', 'direction': 'ASC', 'bass': '①–②–③–④–⑤ (stops at ⑤)',
    'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'The tenth of each bass note is held as a 9th over the next, resolves to 8, then leaps to the new tenth. An optional 5–6 in the other voice (□ in the notes) smooths the chord change.',
    'rules': ['9 prepared by 10, resolves to 8.', 'Stop at ⑤: continuing to ⑥–⑦ would double the leading tone (crossed out in notes p.1).'],
    'guidelines': ['Cadence: ⑤ 9–8 7 → ① 3/8.', 'Minor: add a passing ⑦ (G in A minor) in the middle voice to avoid the augmented second.'],
    'examples': [ex('rise-9-8-maj', 'Major, 3 parts', 'C', '1:10,5 | 2:^9,3 2:8-10,3-5 | 3:^9,3 3:8-10,3-5 | 4:^9,3 4:8-10,3-5 | 5:^9,3 5:8-7,. | 1:3,8@2',
                     caption='The second half of each bar shows the optional 5–6 shift in the middle voice.')],
    'sources': {'notes': 'Moti del Basso p.1', 'fenaroli': 'Book III rising stepwise (9–8 rule)', 'web': [DEM + 'diatonic-moti-del-basso-that-rise-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: “The 9–8 pattern breaks off at ⑤, probably to avoid doubling the leading note there”; minor needs an added g¹ to avoid the augmented second.']},
})

P.append({
    'id': 'rise-9-8-leapfrog', 'name': '(10–)9–8 with leapfrog (Corellian)', 'aka': ['Corelli leapfrog', 'alternating 9–8'], 'group': 'moti-diatonic-rising',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–②–③–④–⑤ → ①', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'The two upper voices take turns: one resolves 9–8 and then leaps a fourth up to the third of the next bass note, while the other is suspended.',
    'rules': ['Each octave resolution leaps a 4th up to the 3rd over the next bass note.', 'Avoid the melodic tritone in the middle voice.'],
    'guidelines': ['The voices cross every bar (that is the “leapfrog”).', 'Also used under the Folia (notes p.26) and the minor Stabat-Mater-type basses.'],
    'examples': [dict(ex('rise-9-8-lf', 'Major, 3 parts', 'C', '1:3,_ | 2:^9-8,3 | 3:3,^9-8 | 4:^9-8,3 | 5:3,^9-8 | 1:8,3@2'), cross=True)],
    'sources': {'notes': 'Moti del Basso p.2', 'web': [DEM + 'diatonic-moti-del-basso-that-rise-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: “Each octave resolution leaps a fourth to the third on the next bass note, and the middle voice avoids the melodic tritone.”']},
})

P.append({
    'id': 'rise-97-86', 'name': '(10/8–)9/7–8/6 combined', 'group': 'moti-diatonic-rising', 'kind': 'moto', 'direction': 'ASC',
    'bass': '①–②–③–④–⑤ → ①', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'The 9–8 and 7–6 chains run simultaneously in the two upper voices, giving a richer harmony.',
    'rules': ['Both suspensions prepared together (10 and 8) and resolved together (8 and 6).'],
    'guidelines': ['Close: ⑤ 9–8 7 / 7–6 5 → ① 3/8.'],
    'examples': [ex('rise-97-86-maj', 'Major, 3 parts', 'C', '1:10,8 | 2:^9,^7 2:8-10,6-8 | 3:^9,^7 3:8-10,6-8 | 4:^9,^7 4:8-10,6-8 | 5:^9,^7 5:8-7,6-5 | 1:3,8@2')],
    'sources': {'notes': 'Moti del Basso p.2', 'web': [DEM + 'diatonic-moti-del-basso-that-rise-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: “(10/8–)9/7–8/6: Both suspension chains run simultaneously.”']},
})

# =====================================================================
# 2  DIATONIC DESCENDING
# =====================================================================
P.append({
    'id': 'dsc-stepwise-romanesca', 'name': 'Stepwise Romanesca (moto)', 'aka': ['alternative for the descending Rule of the Octave'], 'group': 'moti-diatonic-descending',
    'kind': 'moto', 'direction': 'DSC', 'bass': '①–⑦–⑥–⑤–④–③ (+ ②–① to complete the octave)', 'modes': ['major', 'minor'], 'textures': [2, 3, 4],
    'summary': 'Bass notes alternate 5/3 (strong) and 6/3 (weak). Soprano either in parallel thirds with the bass, or leaping (3rd up, 5th down).',
    'rules': ['One sonority per bass note: 5/3 on strong, 6/3 on weak beats.', 'To span the octave append ②–① with 6/3 → 5/3.', 'Minor: use the natural ⑥ and ⑦ (natural minor).'],
    'guidelines': ['Voices available: 5–6, 3–3 (parallel thirds), 3–6 (leaping).', 'Inverts with the leaping Romanesca (see Schemata).'],
    'examples': [ex('dsc-sr-3p', '3 parts, soprano in parallel tenths', 'C', '1:3,5 7:3,6 | 6:3,5 5:3,6 | 4:3,5 3:3,6 | 2:3,6 1:3,8@2'),
                 ex('dsc-sr-2p-leap', '2 parts, leaping soprano', 'C', '1:3 7:6 | 6:3 5:6 | 4:3 3:6 | 2:^7-6 | 1:8@2')],
    'sources': {'notes': 'Moti del Basso p.2', 'hcp': '§2.3 The Stepwise Romanesca', 'web': [DEM + 'diatonic-moti-del-basso-that-descend-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: stepwise Romanesca usually ①→③; 5/3 on strong, 6/3 on weak beats.', 'Demeyere: alternative for the descending RO; append ②–① to span an octave; melody stepwise (parallel thirds) or leaping.']},
})

P.append({
    'id': 'dsc-7-6-fauxbourdon', 'name': '7–6 Fauxbourdon', 'aka': ['7–6 chain over a falling bass'], 'group': 'moti-diatonic-descending',
    'kind': 'moto', 'direction': 'DSC', 'bass': '①–⑦–⑥–⑤–④–③–②–①', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'One upper voice in parallel thirds (tenths) with the bass; the other forms a chain of 7–6 suspensions. Each 6 is the preparation of the next 7.',
    'rules': ['Each 7 tied from the previous 6 and resolved to 6.', 'Ends with the compound cadence 7–6(♯) → 8 over ②–①.'],
    'guidelines': ['Embellished fauxbourdon; mirrors the 5–6 Monte in descent (HCP).', 'Can span a full octave in both modes.'],
    'examples': [ex('dsc-76-maj', 'Major, 3 parts', 'C', '1:5,3 1:6,3 | 7:^7-6,3 | 6:^7-6,3 | 5:^7-6,3 | 4:^7-6,3 | 3:^7-6,3 | 2:^7-6,3 | 1:8,3@2'),
                 ex('dsc-76-min', 'Minor, 3 parts', 'a', '1:5,3 1:6,3 | 7:^7-6,3 | 6:^7-6,3 | 5:^7-6,3 | 4:^7-6,3 | 3:^7-6,3 | 2:^7-#6,3 | 1:8,3@2')],
    'sources': {'notes': 'Moti del Basso p.2; HCP Notes p.4', 'hcp': '§2.2', 'web': [DEM + 'diatonic-moti-del-basso-that-descend-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: “The 7–6 Fauxbourdon mirrors the Monte in a descending motion, with 7/3 and 6/3 chords alternating.”']},
})

P.append({
    'id': 'dsc-fauxbourdon', 'name': 'Fauxbourdon (parallel 6/3)', 'group': 'moti-diatonic-descending', 'kind': 'moto', 'direction': 'ASC/DSC',
    'bass': 'stepwise, either direction', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'Chains of 6/3 chords between 5/3 anchors. In your notes this is marked “move to R.O.” (it is the default realization of the stepwise RO without anchors).',
    'rules': ['Not invertible: exchanging the two upper voices turns their parallel fourths into parallel fifths.', 'Parallel 5/3 chords must be avoided (parallel fifths/octaves).'],
    'guidelines': ['Begin and end with (5)/3 on ①.', 'Minor: raised ⑥ and ⑦ ascending, natural descending.'],
    'examples': [ex('fb-asc', 'Ascending, major', 'C', '1:5,3 | 2:6,3 | 3:6,3 | 4:6,3 | 5:6,3 | 6:6,3 | 7:6,3 | 1:8,3')],
    'sources': {'notes': 'Moti del Basso p.1 (crossed: “move to R.O.”); HCP Notes p.3', 'hcp': '§2.1 The Fauxbourdon'},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: “Fauxbourdon is … the parallel progression of 6/3 chords”; parallel 5/3 chords must be avoided.']},
})

P.append({
    'id': 'dsc-5-6-42', 'name': '5–6/4+/2–6 (elaborated stepwise Romanesca)', 'aka': ['inverted Fonte-Romanesca (Byros)'], 'group': 'moti-diatonic-descending',
    'kind': 'moto', 'direction': 'DSC', 'bass': '①–⑦ | ⑥–⑤ | ④–③', 'modes': ['major'], 'textures': [4],
    'summary': 'Each odd bass note takes 5/3 then 6/4+/2; each even bass note takes 6/3. Every pair is a local ④–③ (in V, iii/III and I).',
    'rules': ['The 4+ resolves up to the 6 of the next bass note; the bass resolves down by step.'],
    'guidelines': ['Usually major.', 'Your notes ask: “inverted fonte-romanesca?” — Demeyere confirms Byros’s label.'],
    'examples': [ex('dsc-5642', '4 parts, major', 'C', '1:3,8,5 1:4+,2,6 | 7:6,3,8@2 | 6:3,8,5 6:4+,2,6 | 5:6,3,8@2 | 4:3,8,5 4:4+,2,6 | 3:6,3,8@2')],
    'sources': {'notes': 'Moti del Basso p.2', 'web': [DEM + 'diatonic-moti-del-basso-that-descend-stepwise/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: “Each uneven bass note takes a triad, then a 6/4+/2 chord; each even bass note takes one sixth chord … local ④–③ … typically major … Byros labels it an inverted Fonte-Romanesca.”']},
})

P.append({
    'id': 'dsc-chromatic-5-6', 'name': 'Chromatic 5–6 (descending)', 'group': 'moti-diatonic-descending', 'kind': 'moto', 'direction': 'DSC',
    'bass': '①–⑦–⑥–⑤–④–③–②–①', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'Most bass notes take 5/3 then 6/3 with chromatic inflections, tonicizing VI, (V), IV, (III), II on the way down. The upper voices combine a descending chromatic line and an ascending diatonic one.',
    'rules': ['Each 6 resolves (→8) as a local leading-tone motion into the next key.'],
    'guidelines': ['Contains the Fonte-Romanesca in its first segment.', 'Several distributions exist (notes p.3 shows two major and three minor versions).'],
    'figures': 'Major: 3 | 3♯ 3♮ 3♯ | 3♮ 3 3♭ 3 … over 3 . | 5♯ 6♯→8 | 3 5 6→8 … (notes p.3)',
    'sources': {'notes': 'Moti del Basso p.3', 'web': [DEM + 'diatonic-moti-del-basso-that-descend-stepwise/']},
    'verification': {'status': 'partly', 'checks': ['Demeyere: derived from settings by Muscogiuri and Lavigna (not Fenaroli’s regole); Fonte-Romanesca appears in the first excerpt.'],
                     'flags': ['Dense chromatic voice distribution: no automatic realization generated; transcribe directly from notes p.3 when building.']},
})

P.append({
    'id': 'dsc-tied-bass', 'name': 'Tied bass: (5–)6/4+/2–6(/5)', 'aka': ['bass suspensions', '2–3 bass suspension chain'], 'group': 'moti-diatonic-descending',
    'kind': 'moto', 'direction': 'DSC', 'bass': '① ⑧ ⌒ ⑦ ⌒ ⑥ ⌒ ⑤ ⌒ ④ ⌒ ③ (syncopated)', 'modes': ['major', 'minor'], 'textures': [2, 3, 4],
    'summary': 'The bass is syncopated: each tied bass note is a 2nd (4/2) against the upper voices on the strong beat and resolves down to a 6/3 on the weak beat.',
    'rules': ['Each tied bass note is a suspension: prepared, sounded against 4/2 (or 6/4/2) on the strong beat, resolved down by step.',
              'At the syncopated ④ the 4 must be augmented (6/4+/2) — “④ MUST w/ 4+”.',
              'The pattern stops on ③; then a cadence (e.g., ② 6/5 – ⑤ – ①).'],
    'guidelines': ['Variant I: 6/4+/2 on every strong beat (scale mutations; local ④→③ in V, IV, iii, I…).',
                   'Variant II: diatonic 6/4/2 strong, 6/3 weak.',
                   'Variant III: 6/4/2 strong, 6/5/3 weak.',
                   '3 parts: drop the 6–8 line → 4/2 – 6/3 (HCP §2.5).',
                   '2 parts: 2–6 over the tied bass (HCP §1.4).',
                   'Opening gambit: ① ⑧⌒ ⑦♯ → ① with 2–3 / 4–6 figures (notes p.4).'],
    'examples': [ex('tb-4p-II', 'Variant II, 4 parts, major', 'C', '1:8,5,3 1>:3,8,5 | 1~:4,2,6 7:6,3,8 | 7~:4,2,6 6:6,3,8 | 6~:4,2,6 5:6,3,8 | 5~:4,2,6 4:6,3,8 | 4~:4+,2,6 3:6,3,8 | 2:6,5,3 5:3,8,7 | 1:8,5,3@2',
                    caption='At ④ the 4 is the augmented fourth (diatonic in major). Ends with the compound cadence ② 6/5 → ⑤ 7 → ①.'),
                 ex('tb-3p', '3 parts (HCP §2.5)', 'C', '1:8,5 1>:6,3 | 1~:4,2 7:6,3 | 7~:4,2 6:6,3 | 6~:4,2 5:6,3 | 5~:4,2 4:6,3 | 4~:4+,2 3:6,3 | 2:^7-6,3 | 1:8,3@2')],
    'sources': {'notes': 'Moti del Basso p.4; HCP Notes p.5', 'hcp': '§1.4, §2.5, §7.3 The Tied Bass', 'fenaroli': 'Book III “Partimento that descends in ties”',
                'web': [DEM + 'diatonic-moti-del-basso-that-descend-stepwise/', DEM + 'suspensions-in-the-bass/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: three settings (6/4+/2 + 6; diatonic 6/4/2 + 6; 6/4/2 + 6/5); syncopated ④ requires 6/4+/2; 3-part omits the sixth → 4(+)/2.',
                                                      'HCP Terms: 4/2 on the tied (strong) beat, 6/3 on the weak beat; 3-part variant of the two-part 2–3 schema.',
                                                      'Fenaroli III: descending in ties — the last tied 4th “should definitely be augmented”; don’t descend this way beyond ④.']},
})

# =====================================================================
# 3  CHROMATIC RISING
# =====================================================================
P.append({
    'id': 'chrom-monte', 'name': 'Chromatic Monte (③→⑥)', 'group': 'moti-chromatic-rising', 'kind': 'moto', 'direction': 'ASC',
    'bass': '③→④ | ♯④→⑤ | ♯⑤→⑥', 'modes': ['major'], 'textures': [3, 4],
    'summary': 'Each segment is a local ⑦–① cadence: 6/3 (or 6/5) on the chromatic leading tone, 5/3 on the new local tonic. Tonicizes IV, V, vi.',
    'rules': ['The chromatic leading tones sit in the bass and rise to the local tonic.', 'Avoid doubling the leading tone in 4 parts (the struck 8 in notes p.5).'],
    'guidelines': ['Embellish with 4–3 suspensions, or invertible 4–3/9–8 pairs.', 'Two-segment version ends on ⑤ and also occurs in minor.', 'Major ③→⑥ equals ⑤→① in the relative minor.'],
    'examples': [ex('cm-3p', '3 parts', 'C', '3:3,6 4:8,5 | #4:3,6 5:8,5 | #5:3,6 6:8,5@2')],
    'variants': [var('cm-minor', 'Minor ⑤→①', 'Bass ⑤–⑥–♯⑥–⑦–♯⑦–①; tonicizes VI, VII, i. Can be embellished by 9–8/7–6 or 4–3/9–8 suspensions.',
                     figures='8 | 6. 8̸ 3 | 8̸ 3. / 5 | (3) 3 8♮ 3 8 / 3♯→3. 6 5 6 5 over ⑤ ⑥ ⑥♯ ⑦ ⑦♯ ①', review='Not auto-realized; transcribe from notes p.5.')],
    'sources': {'notes': 'Moti del Basso p.5', 'hcp': '§8.2 The Chromatic Monte', 'web': [DEM + 'chromatic-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: chromaticism best in the bass; leading tones support secondary dominants (6/3 or 6/5); usual tonicizations ii, IV, V, vi.', 'Demeyere: ③, ♯④, ♯⑤ act as local leading notes; Fenaroli links it to major and ends on ⑥.']},
})

# =====================================================================
# 4  CHROMATIC DESCENDING
# =====================================================================
P.append({
    'id': 'lamento-7-6', 'name': 'Lamento: (6–)7–6', 'aka': ['chromatic tetrachord', 'passus duriusculus'], 'group': 'moti-chromatic-descending',
    'kind': 'moto', 'direction': 'DSC', 'bass': '①–⑦♯–⑦–⑥♯–⑥–⑤ (chromatic)', 'modes': ['minor'], 'textures': [3],
    'summary': 'Chromatic descent ①→⑤ realized with 7–6 suspensions over each pair of bass notes; ends with ⑥–⑤ as an augmented sixth or a Phrygian half cadence.',
    'rules': ['Best in 3 parts.', 'In 4 parts the fourth voice (mostly the tenor) is forced to leap to avoid parallel octaves.'],
    'guidelines': ['⑥–⑤: augmented sixth (♯④ over ♭⑥, per the RO) or major sixth (Phrygian cadence).', 'Represents lament / suffering; common as a Baroque basso ostinato.'],
    'examples': [ex('lam-76', '3 parts, A minor, ending with the augmented sixth', 'a', '1:5,3 1:6,3 | #7:^7,3 7:6,3 | #6:^7,3 6:#6,3 | 5:8,#3@2')],
    'variants': [var('lam-66', 'Lamento 6–6 (simplified)', 'Only sixth chords; normally three voices in one position (exchanging the upper voices creates fifths).',
                     examples=[ex('lam-66', '3 parts, A minor', 'a', '1:3,8 | #7:6,3 7:6,3 | #6:6,3 6:#6,3 | 5:8,#3@2')])],
    'sources': {'notes': 'Moti del Basso p.6', 'hcp': '§8.4 The Chromatic Tetrachord: The Lamento', 'web': [DEM + 'chromatic-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: Lamento fits best in 3 parts; in 4 parts the fourth voice (mostly tenor) must leap to prevent parallel octaves.', 'Demeyere: chain of 7–6; ⑥–⑤ with augmented sixth or Phrygian cadence; 6–6 version in one position only.']},
})

P.append({
    'id': 'morte', 'name': 'Morte', 'group': 'moti-chromatic-descending', 'kind': 'moto', 'direction': 'DSC',
    'bass': '①–⑦(♯)–⑦♭–⑥–⑥♭–⑤', 'modes': ['minor', 'major'], 'textures': [4],
    'summary': 'Same chromatic bass as the Lamento, different harmony: the upper voice moves in contrary motion; ⑦♭ carries an active 6/4+/2 (④→③ in the IV key); ♭⑥ an augmented sixth.',
    'rules': ['The 6/4+/2 on the lowered ⑦ resolves to 6/3 on ⑥ (tonicizes IV).'],
    'guidelines': ['Can open a piece (contrary motion between ① and ⑤).', 'Alternative segment 3 uses a passing 6/4 to avoid parallel fifths.'],
    'examples': [ex('morte-min', '4 parts, A minor', 'a', '1:8,5,3 #7:3,6,3 | 7:4+,2,6 #6:6,3,6 | 6:#6,3,3 5:8,#3,5@2'),
                 ex('morte-maj', '4 parts, C major', 'C', '1:8,5,3 7:3,6,3 | b7:4+,2,6 6:6,3,6 | b6:#6,3,3 5:8,3,5@2')],
    'sources': {'notes': 'Moti del Basso p.6', 'hcp': '§8.5 Advanced Realizations', 'web': [DEM + 'chromatic-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: Morte shares the Lamento bass; both modes; upper voice in contrary motion; lowered ⑦ supports a secondary 4/2 → 6/3 on ⑥ (IV).', 'Demeyere: 6/+4/2 on ♭⑦; common in major.']},
})

# =====================================================================
# 5  DISJUNCT
# =====================================================================
P.append({
    'id': 'dis-2up-3down', 'name': 'Second up, third down', 'group': 'moti-disjunct', 'kind': 'moto', 'direction': 'DSC',
    'bass': '③–④ | ②–③ | ①–② | ⑦–① (or ⑥→③)', 'modes': ['major', 'minor'], 'textures': [3],
    'summary': 'Strong beats: 6 or 6/5; weak beats: 5/3.',
    'rules': ['Bad for opening a piece: it starts on a 6/3 or 6/5 chord.'],
    'guidelines': ['5/3 on the weak beat sounds unstable → prefer the metric complement, third down second up.', 'Rare in partimenti because its meter is unclear.'],
    'examples': [ex('d23', '3 parts', 'C', '3:6,3 4:5,3 | 2:6,3 3:5,3 | 1:6,3 2:5,3 | 7:6,3 1:8,3')],
    'sources': {'notes': 'Moti del Basso p.7', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: strong beats 6 or 6/5, weak beats triad; not suitable for opening; rare, tends to sound like Third Down Second Up.']},
})

P.append({
    'id': 'dis-3down-2up', 'name': 'Third down, second up', 'group': 'moti-disjunct', 'kind': 'moto', 'direction': 'DSC',
    'bass': '①–⑥ | ⑦–⑤ | ⑥–④ | ⑤ (or ④→①)', 'modes': ['major', 'minor'], 'textures': [3, 4],
    'summary': 'Strong beats: 5/3; weak beats: 6 or 6/5. Derived from the two-part 3–6 progression.',
    'rules': ['Fits the meter (5/3 on the strong beat).'],
    'guidelines': ['Embellish with 10–9–3 suspensions (4 parts) or with (5–)7–6 and (3–)9–8 together (“2 perspectives”).'],
    'examples': [ex('d32', '3 parts', 'C', '1:5,3 6:6,3 | 7:5,3 5:6,3 | 6:5,3 4:6,3 | 5:5,3 | 1:3,8')],
    'sources': {'notes': 'Moti del Basso p.7', 'hcp': '§1.2, §7.2', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: Third Down Second Up alternates 6/5 and 5/3 (6/3 may replace 6/5).', 'Demeyere: usually ①→⑤ or ④→①; triad on strong beats.']},
})

P.append({
    'id': 'dis-3up-2down', 'name': 'Third up, second down', 'group': 'moti-disjunct', 'kind': 'moto', 'direction': 'ASC',
    'bass': '①–③ | ②–④ | ③–⑤ | ④–⑥ | ⑤ → ①', 'modes': ['major', 'minor'], 'textures': [3, 4],
    'summary': 'The first bass note of each segment takes a 7–6 suspension, the second a sixth chord.',
    'rules': ['The first-bass-note suspensions are the defining feature (7–6, or 3–4–3 in the 4-part version).'],
    'guidelines': ['Better in triple time.', '4 parts: each falling second becomes a local ②→① clausula tenorizans with a 3–4–3 suspension.'],
    'examples': [ex('d3u2d', '3 parts with 7–6', 'C', '1:5,3 3:6,3 | 2:^7-6,3 4:6,3 | 3:^7-6,3 5:6,3 | 4:^7-6,3 6:6,3 | 5:^7-6,3 | 1:3,8@2')],
    'sources': {'notes': 'Moti del Basso p.8', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere version 1: 7–6 on each first bass note, sixth chord on the second; version 2: local ②–① clausula tenorizans with 4–3.']},
})

P.append({
    'id': 'dis-4down-2up', 'name': 'Fourth down, second up (leaping Romanesca / Pachelbel bass)', 'aka': ['Leaping Romanesca', 'Pachelbel bass'], 'group': 'moti-disjunct',
    'kind': 'moto', 'direction': 'DSC', 'bass': '①–⑤ | ⑥–③ | ④–①', 'modes': ['major', 'minor'], 'textures': [2, 3, 4], 'seeAlso': ['romanesca-leaping'],
    'summary': 'Upper voices in parallel thirds; complete and incomplete 5/3 alternate. The only sequence whose model is transposed down a third.',
    'rules': ['Minor: natural ⑥ and ⑦.'],
    'guidelines': ['(8–)4–3 / (3–)9–8 suspensions are invertible — keep them for 3 parts.', 'Full schema material (embellishments, stretto, endings) is under Schemata → Leaping Romanesca.'],
    'examples': [ex('d42-4p', '4 parts (all triads complete)', 'C', '1:3,8,5 5:5,3,8 | 6:3,8,5 3:5,3,8 | 4:3,8,5 1:5,3,8'),
                 ex('d42-susp', '3 parts with 4–3 / 9–8', 'C', '1:3,8 5:5,^4-3 | 6:3,^9-8 3:5,^4-3 | 4:3,^9-8 1:5,^4-3')],
    'sources': {'notes': 'Moti del Basso p.9', 'hcp': '§5.1', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP §5.1: leaping Romanesca, 4–3/9–8 alternation; only complete 5/3 chords require 4 parts.']},
})

P.append({
    'id': 'dis-4up-3down', 'name': 'Fourth up, third down (Monte Principale)', 'aka': ['Monte Principale'], 'group': 'moti-disjunct',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–④ | ②–⑤ | ③–⑥', 'modes': ['major'], 'textures': [4],
    'summary': 'Each segment’s first chord can take a major third, making each segment a local ⑤→① (tonicizing V and vi). Not the same as the stepwise Monte.',
    'rules': ['Usually major.'],
    'guidelines': ['Embellish with (5–)9–8 (voice crossing) and/or (7–)4–3 to avoid leading tone → tonic doubling.', 'Gjerdingen added “principale” to distinguish it from the stepwise Monte.'],
    'examples': [ex('d43', '4 parts', 'C', '1:5,3,8 4:3,8,5 | 2:5,#3,8 5:3,8,5 | 3:5,#3,8 6:3,8,5')],
    'sources': {'notes': 'Moti del Basso p.9', 'hcp': '§8.2 (Monte Principale)', 'fenaroli': 'Book III “Partimento that rises by fourth and descends by third”', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: leaping chromatic variant with rising fourths = Monte Principale.', 'Fenaroli III: rises 4th / falls 3rd — 9th prepared by the 5th on the note a 4th up.']},
})

P.append({
    'id': 'dis-4up-5down', 'name': 'Fourth up, fifth down (descending circle of fifths, Quintfall)', 'aka': ['Quintfall', 'descending circle of fifths', 'Fifth down fourth up'],
    'group': 'moti-disjunct', 'kind': 'moto', 'direction': 'DSC', 'bass': '①–④ | ⑦–③ | ⑥–② | ⑤–①', 'modes': ['major', 'minor'], 'textures': [3, 4],
    'summary': 'Triads only in the basic version; a 7–3 suspension chain (both upper voices alternately) or 9–8 / 9–5 suspensions enrich it. Fifth down fourth up is the same with the octaves of every second bass note swapped.',
    'rules': ['Melodic tritones (④–⑦ major, ♭⑥–② minor) are accepted inside the sequence.', 'Strong beat on ① (or on ④ with ① as upbeat).'],
    'guidelines': ['Minor: ④–♭⑦–♭③ forms a local ②–⑤–① in the relative major.', 'The 7–3 chain is invertible.'],
    'examples': [ex('d45-3p', '3 parts, triads', 'C', '1:8,3 4:3,8 | 7:8,3 3:3,8 | 6:8,3 2:3,8 | 5:8,3 1:3,8'),
                 dict(cross=True, **ex('d45-73', '3 parts, 7–3 chain', 'C', '1:3,5 4:^7,3 | 7:3,^7 3:^7,3 | 6:3,^7 2:^7,3 | 5:3,^7 1:8,3'))],
    'variants': [var('chain-dominants', 'Chain of dominants (chromatic 5↓4↑)', 'Every chord becomes a (secondary) dominant of the next: major triads and/or dominant sevenths; the third descends chromatically while the seventh resolves.',
                     examples=[ex('chain-dom', '4 parts, C major', 'C', '1:3,5,8 | 3:7,#3,5 6:#3,7,8 | 2:7,#3,5 5:3,7,8 | 1:8,3,5')])],
    'sources': {'notes': 'Moti del Basso pp.10–11', 'hcp': '§2.4, §7.2, §8.6', 'fenaroli': 'Book III “Partimento that rises a fourth” / “falls a fourth”', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: basic version triads only; seventh chain in 3 parts; ninths on ④, (♭)③, ②; melodic tritones accepted.',
                                                      'HCP Terms: Chain of Dominants is the chromatic variant of Fifth Down Fourth Up; the leading tone descends by a chromatic half tone.',
                                                      'Compendium: “Quintfall” sequence (7th run) and its inversions.']},
})

P.append({
    'id': 'dis-5up-4down', 'name': 'Fifth up, fourth down (Monte Romanesca, Quartfall)', 'aka': ['Monte Romanesca', 'Quartfall'], 'group': 'moti-disjunct',
    'kind': 'moto', 'direction': 'ASC', 'bass': '①–⑤ | ②–⑥ | (③–⑦)', 'modes': ['major'], 'textures': [3, 4], 'seeAlso': ['monte-romanesca'],
    'summary': 'Model like the Romanesca but the second bass note an octave higher; triads only in teaching, canonic 4–3 version in real compositions.',
    'rules': ['Major only.', 'Third segment (optional) becomes a local ①–⑤ to avoid the diminished fifth on ⑦.'],
    'guidelines': ['Canonic Monte Romanesca: (8–)4–3 suspensions alternate between the upper voices (proposta/risposta).'],
    'examples': [ex('d54-4p', '4 parts, triads', 'C', '1:8,5,3 5:3,8,5 | 2:8,5,3 6:3,8,5 | 3:8,5,3 7:#3,8,#5'),
                 dict(cross=True, **ex('d54-canon', 'Canonic, 3 parts', 'C', '1:5-8,3 5:^4-3,5-8 | 2:5-8,^4-3 6:^4-3,5-8 | 3:5-8,^4-3 7:^4-#3,#5-8'))],
    'sources': {'notes': 'Moti del Basso p.11', 'hcp': '§5.4', 'fenaroli': 'Book III “Partimento that rises a fifth” (4th prepared by the 8ve)', 'web': [DEM + 'disjunct-moti-del-basso/', DEM + 'the-leaping-monte-romanesca/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: major only; third segment a local ①–⑤; canonic 4–3 variant used in compositions.', 'Fenaroli III rises a fifth II: 4th prepared by the 8ve resolved to the 3rd.']},
})

P.append({
    'id': 'dis-6up-5down', 'name': 'Sixth up, fifth down (= third down, fourth up)', 'group': 'moti-disjunct', 'kind': 'moto', 'direction': 'ASC',
    'bass': '①–⑥ | ②–⑦ | ③–① | ④–②', 'modes': ['major'], 'textures': [3, 4],
    'summary': 'Alternating 5/3 and 6/3: each bass pair is a local ⑤–③, so the pattern is a Monte with exchanged outer voices.',
    'rules': [],
    'guidelines': ['Remove the octaves for 3 parts.', 'Add a (5–)7–6 suspension on the second note of each segment.', 'Fenaroli: this motion is equivalent to one that descends a third and rises a fourth.'],
    'examples': [ex('d65', '4 parts', 'C', '1:3,8,5 6:6,3,8 | 2:#3,8,5 7:6,#3,8 | 3:#3,8,5 1:6,3,8 | 4:3,8,5 2:6,3,8')],
    'sources': {'notes': 'Moti del Basso p.12', 'fenaroli': 'Book III “Partimento that rises a sixth”', 'web': [DEM + 'disjunct-moti-del-basso/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: version (b) alternates triads and sixth chords — local ⑤–③, a Monte with exchanged outer voices; 7–6 on the second note.', 'Fenaroli III: “this motion is equivalent to one that descends a 3rd and rises a 4th.”']},
})

# =====================================================================
# 6  SCHEMATA
# =====================================================================
EMBELLISH = ['repeated notes', 'escape tone (step then leap)', 'repeated notes + escape tone', 'upper neighbour', 'double neighbour', 'lower neighbour + escape tone',
             'arpeggiation (compound line: two voices merged into one)', 'lower neighbour + arpeggio', 'passing tones', 'passing tones + arpeggio', 'rests (offbeat entries)', 'combinations of the above']

P.append({
    'id': 'romanesca-leaping', 'name': 'Leaping Romanesca', 'aka': ['Pachelbel bass', 'Pachelbel sequence'], 'group': 'schemata-opening',
    'kind': 'schema', 'direction': 'DSC', 'bass': '①–⑤ | ⑥–③ | ④–① (4th down, 2nd up)', 'melody': '①–⑦ | ⑥–⑤ | ④–③ (or 3rds above)', 'modes': ['major', 'minor'], 'textures': [2, 3, 4],
    'function': ['opening'],
    'summary': 'Opening schema; Pachelbel’s Canon is “the” exemplar. Upper voices in parallel thirds; complete and incomplete 5/3 alternate.',
    'rules': ['Minor uses the natural scale (⑥♮, ⑦♮).', 'Only complete 5/3 chords → 4 parts required.'],
    'guidelines': ['Suspensions: (5–)4–3 in 2 parts; (8–)4–3 / (3–)9–8 in 3 parts (invertible); add (5–)4–3 for a third chain.',
                   'Embellish the embellishments: ' + '; '.join(EMBELLISH) + '.',
                   'If the bass is embellished (chordal skips, Insanguine, Durante or Fenaroli running basses), keep the upper voices plain.',
                   '3-part embellishment: one upper voice; or two voices in parallel/complementary (canonic) motion; bariolage as a keyboard technique.',
                   'With 6/4+ (Fenaroli): the bass may fall a perfect 4th with 6/4+; with 6/4+/2 the bass must step down.'],
    'examples': [ex('rom-2p', '2-part prototype', 'C', '1:8 5:3 | 6:8 3:3 | 4:8 1:3'),
                 ex('rom-3p', '3-part prototype', 'C', '1:3,8 5:5,3 | 6:3,8 3:5,3 | 4:3,8 1:5,3'),
                 ex('rom-3p-min', '3-part, minor (natural)', 'a', '1:3,8 5:5,3 | 6:3,8 3:5,3 | 4:3,8 1:5,3'),
                 ex('rom-susp', '3 parts, (8–)4–3 / (3–)9–8', 'C', '1:3,8 5:5,^4-3 | 6:3,^9-8 3:5,^4-3 | 4:3,^9-8 1:5,^4-3')],
    'variants': [
        var('rom-key-change', 'Temporary key change', '2 parts: turn a rising second into a discant cadence (⑤♯→⑥, ③♯→④) or a deceptive cadence (⑤→⑥) → leads to the Fonte-Romanesca (I, vi, IV keys). Applies to 3 parts too.',
            figures='3 | 8̸→3 | 8̸→3 | 5 over ① | ⑤♯→⑥ | ③♯→④ | ① (notes p.14)'),
        var('rom-stretto', 'Stretto', '2 parts: second voice enters a bar late at the 3rd (stretto sine pausa = without the rest). Stretto per arsin et thesin uses syncopations (9–3). 3 parts: avoid parallel fifths by doubling the 3rd at the end.'),
        var('rom-short-end', 'Modified and shortened end', 'Only two segments, then a cadence: in major the ④ gets 6/3 instead of 5/3 and continues as a Galant cadence (⑤→①) or a Prinner (③–②–①); in minor ③ takes 6/3 → ④ – ⑤ – ① G.C.'),
    ],
    'sources': {'notes': 'Moti del Basso pp.13–15', 'hcp': '§5.1 The Leaping Romanesca; §7.5 (Folia relation)',
                'web': [DEM + 'the-leaping-romanesca-the-pachelbel-pattern-the-basics/', DEM + 'the-leaping-romanesca-two-part-embellishment-part-1/', DEM + 'the-leaping-romanesca-two-part-embellishment-part-2/',
                        DEM + 'the-leaping-romanesca-embellishing-three-part-settings/', DEM + 'the-leaping-romanesca-set-with-stretto/', DEM + 'the-leaping-romanesca-with-a-modified-and-shortened-end/']},
    'verification': {'status': 'verified', 'checks': ['HCP §5.1 Terms: Pachelbel exemplar; inverts with stepwise Romanesca; 4–3 and 9–8 suspensions; natural minor.',
                                                      'Demeyere: section titles match the note structure (embellishment parts 1–2, three-part, stretto, modified/shortened end).']},
})

P.append({
    'id': 'romanesca-stepwise', 'name': 'Stepwise Romanesca', 'aka': ['inverted leaping Romanesca'], 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'DSC',
    'bass': '①–⑦ | ⑥–⑤ | ④–③', 'melody': '③ ③ | ① ① | … (parallel tenths)', 'modes': ['major', 'minor'], 'textures': [2, 3], 'function': ['opening'],
    'summary': 'Stepwise diatonic descent; it is the leaping Romanesca in invertible counterpoint. Often extended by a Prinner (④–③–②–①).',
    'rules': ['Avoid the incomplete 6/3 with doubled 6th (3↑6 over 8↓6).', 'Minor: use ⑥♮ and ⑦♮ (natural minor) — less common.'],
    'guidelines': ['3-part options: 3/8 | 3/6; or 3/5 (invertible); or 3↑6 with 3↓2 voices.', '(3–)2–3 suspensions in either voice, or as a syncopated/tied bass.',
                   'Temporary key change: ⑦ → ⑥ as 4+ (vi key), ⑤ → ④ (IV key).', 'Embellishments: same choices as the leaping Romanesca.'],
    'examples': [ex('srom-2p', '2-part prototype + Prinner extension', 'C', '1:3 7:3 | 6:3 5:3 | 4:3 3:3 | 2:3 1:3'),
                 ex('srom-3p', '3-part prototype', 'C', '1:3,8 7:3,6 | 6:3,8 5:3,6 | 4:3,8 3:3,6')],
    'sources': {'notes': 'Moti del Basso p.16', 'hcp': '§2.3, §5.1', 'web': [DEM + 'the-stepwise-romanesca-the-basics/', DEM + 'the-stepwise-romanesca-two-part-embellishment/']},
    'verification': {'status': 'verified', 'checks': ['HCP: stepwise ↔ leaping Romanesca by invertible counterpoint; suspensions less frequent but possible; natural minor.']},
})

P.append({
    'id': 'prinner', 'name': 'Prinner', 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'DSC',
    'bass': '④–③–②–①', 'melody': '⑥–⑤–④–③ (parallel tenths)', 'modes': ['major', 'minor'], 'textures': [2, 3, 4], 'function': ['riposte', 'mild cadence (clausula tenorizans ②→①)', 'modulation (modulating Prinner)'],
    'summary': 'The galant riposte: answers an opening gambit. In 3 parts a third voice is nearly stationary on ① (upper voice in the 17th c., middle in the 18th c.).',
    'rules': ['5/3 on ④ (deviates from the descending RO).', 'Modulating Prinner (①–⑦–⑥–⑤ = ④–③–②–① of V) needs ⑥ raised; it does not exist in minor.'],
    'guidelines': ['Best in major (graceful).', 'With 7–6 on ②: stage 3 twice as long as stage 1.', 'High ② drop: conventional ornamental sign of impending closure.',
                   'Incomplete Prinner: repeat stages 1–2 (④–③, ④–③, ④–③–②–①).'],
    'examples': [ex('prin-3p', 'Without suspension', 'C', '4:5,3 3:6,3 | 2:6,3 1:8,3'),
                 ex('prin-76', 'With 7–6 (stage 3 doubled)', 'C', '4:5,3 3:6,3 | 2:^7-6,3@2 | 1:8,3@2'),
                 ex('prin-stat', 'Stationary line holding ①', 'C', '4:5,3 3:6,3 | 2:7,3 1:8,3'),
                 ex('prin-mod', 'Modulating Prinner (to V)', 'C', '1:5,3 7:6,3 | 6:^7-#6,3 | 5:8,3@2')],
    'variants': [
        var('prin-4325', 'Bass ④–③–②–⑤–①', 'Turns the Prinner into an authentic cadence; 7–6 then 7 → 3♯ → 8. Can start on the upbeat.',
            examples=[ex('prin-4325', '3 parts', 'C', '4:3,5 3:3,6 | 2:3,^7 5:7,3 | 1:3,8@2')]),
        var('prin-4327', 'Bass ④–③–②–⑦–①', 'Sixth chord on ⑦ to avoid voice-leading problems.', examples=[ex('prin-4327', '3 parts', 'C', '4:5,3 3:6,3 | 2:6,3 7:6,3 | 1:8,3@2')]),
        var('prin-other-basses', 'Other bass lines', '④–③–⑦–①; ③–④–⑤–① (⑤ as passing tone); ④–①–⑤–① (IAC); ④–①–⑤–⑥ (deceptive); ④–①–⑦–①; ①–①–⑦–① (Mozart K.545/i bars 1–4); ①–①–②–⑦–①; ①–①–②–⑤–①; ①–①–⑤–①.',
            figures='notes p.18'),
        var('prin-expanded', 'Expanded Prinner', 'Bass ④–① | ③–⑥ | ②–⑤ | ① with 7–3 suspensions.', figures='5 3 | 7 3 | 7 3♯→8 over ④ ① | ③ ⑥ | ② ⑤ | ①'),
        var('prin-canonic', 'Canonic Prinner', 'Upper voice and bass in canon (proposta/risposta): bass ⑥–⑤ | ④–③ | ②–①.', figures='6 6 | 3 3 | 3 3 / 3 3 | 5 6 | 6♯→8'),
    ],
    'sources': {'notes': 'Moti del Basso pp.17–18; HCP Notes p.11', 'hcp': '§5.3 The Prinner',
                'web': [DEM + 'the-traditional-prinner/', DEM + 'variants-of-the-traditional-prinner-part-1/', DEM + 'variants-of-the-prinner-part-2-sequential-prinners/', DEM + 'variants-of-the-prinner-part-3/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: 5/3 on ④ deviates from the descending RO; modulating Prinner needs raised sixth on ⑥ and doesn’t exist in minor; best in major.',
                                                      'Demeyere: riposte; mild ②–① clausula tenorizans; stage 3 with 7–6 often twice as long; High ② drop “a conventional sign of impending closure” (Gjerdingen 2007, p.74).']},
})

P.append({
    'id': 'stabat-mater-prinner', 'name': 'Stabat Mater Prinner (SMP)', 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'DSC',
    'bass': '⑤ pedal (dominant)', 'melody': 'top ⑥–⑤–④–③; middle (⑤)–④–③–②–① metrically shifted (2–3 suspensions)', 'modes': ['major', 'minor'], 'textures': [3, 4],
    'function': ['IAC/PAC or broken cadence', 'half cadence (extended SMP)'],
    'summary': 'Dominant pedal (≈ Quiescenza on ⑤) + a Prinner top line + a metrically shifted descent in the middle voice that produces a chain of 2–3 suspensions. Named after the “Amen” of Pergolesi’s Stabat Mater.',
    'rules': ['In 3 voices the chordal 7th and the leading tone cannot be doubled (half-cadence version: use ④♯ in minor).'],
    'guidelines': ['Optional 4th voice: ②↑ ③↓ on the dominant pedal (⑦ ① ② ⑦ ① ⑥ ⑦ ①; ①♯ optional in major).', 'Mozart loves the IAC/broken-cadence type.'],
    'figures': 'over ⑤: 9–8 | 7 | 6 | 5, middle 4(♯) 5 | 3 4 | 2♯ 3♯ → 1 (notes p.19)',
    'sources': {'notes': 'Moti del Basso p.19', 'web': [DEM + 'variants-of-the-prinner-part-4-the-stabat-mater-prinner/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: dominant pedal; top ➏–➎–➍–➌; metrically shifted ➎–➍–➌–➋–➊ with 2–3 suspensions; functions IAC/PAC/broken, half cadence; Pergolesi Amen bars 45–51a.'],
                     'flags': ['Demeyere calls the bass motion “Second Up Third Down” — in your notes that line is the optional tenor over the pedal. Both readings describe the same texture.',
                               'Not auto-realized: voice layout over the pedal is dense; transcribe from notes p.19.']},
})

P.append({
    'id': 'do-re-mi', 'name': 'Do-Re-Mi', 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'ASC', 'bass': '①–⑦–① (most common), ①–⑤–①, ①–④–⑤–①',
    'melody': '①–②–③', 'modes': ['major', 'minor'], 'textures': [2, 3, 4], 'function': ['opening (proposta)'],
    'summary': 'Proposta schema that opens a piece or section. Melody and bass are invertible (Do-Re-Mi can also sit in the bass under ①–⑦–①).',
    'rules': ['3 parts over ①–⑦–①: ④→③ in the middle would double the third on ① — hold ⑤ instead.'],
    'guidelines': ['18th-c. embellishment: “Adeste Fideles leaps” (broken chord).', 'With suspension: 8⌒9–3 over ① ⑦ ① (4/2, 5/2 or 6/4/2 sonorities); 5/2 sounds empty in 4 parts.',
                   'Bass ①–②–③ with melody ①–⑦–① (add parallel thirds for 3 voices).'],
    'examples': [ex('drm-2p', '①–⑦–① bass, 2 parts', 'C', '1:8 7:3 | 1:3@2'), ex('drm-3p', '3 parts with suspension', 'C', '1:8,3 1:9,4 7:3,6 | 1:3,5@2'),
                 ex('drm-151', '①–⑤–① bass', 'C', '1:8 5:5 | 1:3@2'), ex('drm-1451', '①–④–⑤–① bass', 'C', '1:8 4:6 5:5 | 1:3@2'),
                 ex('drm-bass', 'Do-Re-Mi in the bass, melody ①–⑦–①', 'C', '1:8,3 2:6,3 | 3:6,3@2')],
    'sources': {'notes': 'Moti del Basso p.20', 'web': [DEM + 'the-do-re-mi/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: proposta, ➊–➋–➌ over ①–⑦–①; Do-Sol-Do; suspension → 4/2 or 5/2 (3 parts), 5/2, 5/4/2, 6/4/2 (4 parts); Do-Fa&Sol-Do; Do-Re-Mi in the bass.']},
})

P.append({
    'id': 'paired-do-re-mi', 'name': 'Paired Do-Re-Mi', 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'ASC', 'bass': '①–⑦ | ⑦–① or ①–⑤ | ⑤–①',
    'melody': '①–② | ②–③ (question | answer)', 'modes': ['major', 'minor'], 'textures': [2, 3], 'function': ['opening (dichotomous)'],
    'summary': 'An extra Re splits the Do-Re-Mi into a question (opens) and an answer (closes).',
    'rules': [], 'guidelines': ['Chromatic version (most popular): chromatic appoggiaturas / passing notes ①♯ and ②♯ (9♯→3, 4♯→5).'],
    'examples': [ex('pdrm-171', '①–⑦ | ⑦–① bass', 'C', '1:8 7:3 | 7:3 1:3'), ex('pdrm-151', '①–⑤ | ⑤–① bass', 'C', '1:8 5:5 | 5:5 1:3')],
    'sources': {'notes': 'Moti del Basso p.21', 'web': [DEM + 'the-paired-do-re-mi/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: Gjerdingen’s label; question/answer pairs; ①–⑦…⑦–① and ①–⑤…⑤–① basses; chromatic form most popular.']},
})

P.append({
    'id': 'sol-fa-mi', 'name': 'Sol-Fa-Mi', 'group': 'schemata-opening', 'kind': 'schema', 'direction': 'DSC', 'bass': '①–② … ⑦–① (or … ⑤–①)',
    'melody': '⑤–④ … ④–③', 'modes': ['major', 'minor'], 'textures': [2, 3], 'function': ['opening (proposta)'],
    'summary': 'Proposta schema: the melody descends ⑤–④, then repeats ④–③ over a closing bass.',
    'rules': [], 'guidelines': ['② can take a 6/3 chord, or 7/5/3 on ⑤ in the ⑤–① version.'],
    'examples': [ex('sfm-71', '①–②…⑦–① bass', 'C', '1:5,3 2:3,8 | 7:5,3 1:3,8'), ex('sfm-51', '①–②…⑤–① bass', 'C', '1:5,3 2:3,8 | 5:7,3 1:3,8')],
    'sources': {'notes': 'Moti del Basso p.21', 'other': 'Gjerdingen, Music in the Galant Style (2007), Sol-Fa-Mi'},
    'verification': {'status': 'notes-only', 'checks': [], 'flags': ['No Sol-Fa-Mi page on essaysonmusic.com and not in HCP; check against Gjerdingen ch. “The Sol-Fa-Mi” if available.']},
})

CN_INTRO = 'Changing-note schemata: double-neighbour shapes (↗↘↗ or ↘↗↘) forming a question (harmonically & melodically opening) and an answer (closing).'

P.append({
    'id': 'meyer', 'name': 'Meyer', 'group': 'schemata-changing-note', 'kind': 'schema', 'direction': 'mixed', 'bass': '①–② … ⑦–① (and variants)', 'melody': '①–⑦ … ④–③',
    'modes': ['major', 'minor'], 'textures': [2, 3, 4], 'function': ['opening (proposta)', 'stays in one key'],
    'summary': CN_INTRO + ' The Meyer melody ①–⑦…④–③.',
    'rules': [], 'guidelines': ['①–②…⑦–①: clausula cantizans → weaker close; ①–②…⑤–①: clausula basizans → stronger.', 'Stage 2 can be metrically doubled so stage 3 falls on a weak beat.',
                                 'Typical cantizans gesture ⑥–⑤–④–③ in the second dyad.', 'Suspensions often on stages 2 and 4 (e.g., 8⌒7→6♯, 5⌒7–6 8 4–3).'],
    'examples': [ex('meyer-71', '①–②…⑦–①, 3 parts', 'C', '1:8,3 2:6,3 | 7:5,3 1:3,8'), ex('meyer-51', '①–②…⑤–①', 'C', '1:8,3 2:6,3 | 5:7,3 1:3,8'),
                 ex('meyer-56', '①–②…⑤–⑥ (deceptive)', 'C', '1:8,3 2:6,3 | 5:7,3 6:5,3')],
    'variants': [var('meyer-other', 'Other basses', '①–⑤…⑤–①; ①–⑤…⑦–①.', figures='notes p.22')],
    'sources': {'notes': 'Moti del Basso p.22', 'web': [DEM + 'the-meyer/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: treble ➊–➐…➍–➌; basses ①–②…⑦–①, metrically shifted, ①–②…⑤–① (somewhat stronger), ①–⑤…⑤–①, ①–⑤…⑦–①, ①–②…⑤–⑥.']},
})

P.append({
    'id': 'aprile', 'name': 'Aprile', 'group': 'schemata-changing-note', 'kind': 'schema', 'direction': 'mixed', 'bass': '①–② … ⑦–① (and variants)', 'melody': '①–⑦ … ②–①',
    'modes': ['major'], 'textures': [4], 'function': ['opening (proposta)'],
    'summary': CN_INTRO + ' Shares its first dyad with the Meyer; the answer is ②–①.',
    'rules': [], 'guidelines': ['Optional suspensions on stages 2 and/or 4 (7/4/3 and 9/4).', '①–②…④–③ bass = the Jupiter bass (clausula altizans).'],
    'examples': [ex('aprile-71', '①–②…⑦–①, 4 parts', 'C', '1:8,3,5 2:6,3,4 | 7:3,5,6 1:8,3,5'), ex('aprile-51', '①–②…⑤–①, 4 parts', 'C', '1:8,3,5 2:6,3,4 | 5:5,7,8 1:8,3,5')],
    'variants': [var('aprile-other', 'Other basses', '①–②…④–③ (Jupiter); ①–⑤…⑤–①; ①–⑤…⑦–①; ③–④…④–③ (6/3 4+/2 | 6/2 6/3).', figures='notes p.23')],
    'sources': {'notes': 'Moti del Basso p.23', 'web': [DEM + 'the-aprile/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: treble ➊–➐…➋–➊; same set of basses including ③–④…④–③ and the Jupiter bass.']},
})

P.append({
    'id': 'pastorella', 'name': 'Pastorella', 'group': 'schemata-changing-note', 'kind': 'schema', 'direction': 'mixed', 'bass': '①–⑤ … ⑤–① (or …⑦–①, or pedal on ①)', 'melody': '③–② … ④–③',
    'modes': ['major'], 'textures': [2, 3, 4], 'function': ['opening (proposta)'],
    'summary': CN_INTRO + ' Melody ③–②…④–③; in parallel thirds below it gives the Aprile treble.',
    'rules': [], 'guidelines': ['Optional suspensions on stages 2 and/or 4.', 'Pedal-point version on ① with 7/4/2 on stages 2–3.'],
    'examples': [ex('past-51', '①–⑤…⑤–①', 'C', '1:3,8 5:5,3 | 5:7,3 1:3,8')],
    'sources': {'notes': 'Moti del Basso p.24', 'web': [DEM + 'the-pastorella/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: ➌–➋…➍–➌; basses ①–⑤…⑤–①, ①–⑤…⑦–①, pedal on ① (7/4/2).']},
})

P.append({
    'id': 'jupiter', 'name': 'Jupiter', 'group': 'schemata-changing-note', 'kind': 'schema', 'direction': 'mixed', 'bass': '①–⑤ … ⑤–① (dichotomous) or ①–④–⑤–① (single gesture)', 'melody': '①–② … ④–③',
    'modes': ['major'], 'textures': [4], 'function': ['opening (proposta)'],
    'summary': CN_INTRO + ' Melody ①–②…④–③ (Mozart K.551 finale). With ④ in stage 2 the dichotomy disappears (single gesture).',
    'rules': [], 'guidelines': ['Optional suspensions on stages 2 and/or 4.', '③–④–⑤–⑥ bass ends deceptively.'],
    'examples': [ex('jup-51', '①–⑤…⑤–①, 4 parts', 'C', '1:8,5,3 5:5,3,8 | 5:7,3,5 1:3,8,8'), ex('jup-1451', '①–④–⑤–① (single gesture)', 'C', '1:8,5,3 4:6,3,6 | 5:7,3,5 1:3,8,8')],
    'variants': [var('jup-other', 'Other basses', '③–④–⑤–① ; ③–④–⑤–⑥ (deceptive).', figures='notes p.24')],
    'sources': {'notes': 'Moti del Basso p.24', 'web': [DEM + 'the-jupiter/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: ①–⑤…⑤–① dichotomous; ①–④–⑤–① single gesture; ③–④–⑤–① and ③–④–⑤–⑥ variants.'],
                     'flags': ['The web page is inconsistent about the first melody note (➊ vs ➌); your notes and Gjerdingen give ①–②…④–③.']},
})

P.append({
    'id': 'folia', 'name': 'Folia', 'group': 'schemata-sequential', 'kind': 'schema', 'direction': 'mixed', 'bass': '①–⑤–①–⑦–③–⑦–①–⑤ :‖ ①–⑤–①', 'melody': '①–⑦–①–②–③–②–①–⑦ (standard treble)',
    'modes': ['minor'], 'textures': [2, 3, 4], 'meter': '3/4', 'function': ['opening', 'variation ground', 'sarabande'],
    'summary': 'Late Folia (17th–18th c.), usually in D minor, in 3/4 with the sarabande rhythm. Bass moves by fourths and seconds; temporary turn to the relative major (♭⑦–♭③).',
    'rules': ['Minor only (Dorian colour: no ⑥ in the bass, ⑦♮).', 'First phrase ends with a half cadence; second with a clausula basizans.'],
    'guidelines': ['Rhythm: odd bars ♩ ♩. ♪ (sarabande), even bars shorter values with inégalité.', 'Alternative treble a third above / sixth below; combine both for 3 parts (compound line).',
                   'Corelli leapfrog setting; extra harmonies (⑦♯ passing tone, ⑥♯ toward the relative major, chromatic passing tones).',
                   'Bars 4–5 can be read as a sequential transposition of bars 2–3 (4↑2↓); bars 5–8 as a leaping Romanesca (4↓2↑).'],
    'examples': [ex('folia-3p', 'Standard + alternative treble, 3 parts', 'd', '1:8,3@3 | 5:#3,5@3 | 1:8,3@3 | 7:3,5@3 | 3:8,3@3 | 7:3,5@3 | 1:8,3@3 | 5:#3,5@3 | 1:8,3@3 | 5:#3,5@3 | 1:8,3@3', meter='3/4',
                    caption='Framework only (one sonority per bar); add the sarabande rhythm in the melody.')],
    'sources': {'notes': 'Moti del Basso pp.25–26; HCP Notes p.12', 'hcp': '§5.6 The Folia; §7.5 The Folia (II)', 'web': [DEM + 'the-folia/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: parallel sixths or thirds; complete/incomplete 5/3; minor only.', 'Demeyere: bass ①–⑤–①–♭⑦–♭③–♭⑦; standard treble 1–7–1–2–♭3–2–1–7; alternative treble; Corelli leapfrog (hypothetical); extra harmonies (C.P.E. Bach, Corelli).']},
})

P.append({
    'id': 'fonte', 'name': 'Fonte', 'group': 'schemata-sequential', 'kind': 'schema', 'direction': 'DSC', 'bass': '①♯–② | ⑦–① (each segment a ⑦→① cadence)', 'melody': '(⑥)–⑤–④ | ④–③',
    'modes': ['major'], 'textures': [3, 4], 'function': ['opens the 2nd half of a (rounded) binary form'],
    'summary': 'Two-segment descending sequence: segment 1 in the ii key, segment 2 in I, each a clausula cantizans with a ④–③ melody. Named by Riepel (1755).',
    'rules': ['Major only (ii° in minor cannot form a triad). In a minor piece use the relative major (“borrowed Fonte”).'],
    'guidelines': ['Melody ⑥–⑤–④–③ (V6 → V6/5 → i, V6 → V6/5 → I).', 'Jommelli: ⑥(♭) on ⑦ in each segment (vii°7); the literally transposed ⑥♭ is the “hermaphrodite tone” (Riepel disliked it, Mozart used it).',
                   'Suspensions 4–3 and/or 9–8 on the second chord.', 'Bass ⑤–①; bass ⑦–⑤–① (temporary 3/2 in 4/4).', 'Chromatic Fonte: Picardy third in the II key.', 'Metrically shifted Fonte possible.'],
    'examples': [ex('fonte-std', 'Standard, 4 parts', 'C', '#1:5,3,6 2:3,8,5 | 7:5,3,6 1:3,8,5'), ex('fonte-6543', 'With ⑥–⑤–④–③ melody', 'C', '#1:6-5,3,6 2:3,8,5 | 7:6-5,3,6 1:3,8,5'),
                 ex('fonte-jom', 'Jommelli (dim. sevenths)', 'C', '#1:b7,5 2:5,3 | 7:b7,5 1:5,3'), ex('fonte-51', 'Bass ⑤–①', 'C', '6:7,#3 2:3,8 | 5:7,3 1:3,8')],
    'variants': [var('fonte-extended', 'Extended Fonte', 'Each segment holds two different cadences (cantizans + basizans, or altizans + cantizans), or a whole phrase with several cadential gestures.'),
                 var('fonte-triple', 'Triple Fonte', 'Three segments: iii key → ii key → I key.'),
                 var('fonte-keys', 'Fonte in other keys', 'Finishing in V (vi → V; D. Cimarosa); starting in v and finishing in IV (rare).')],
    'sources': {'notes': 'Moti del Basso pp.27–28', 'hcp': '§8.1 The Fonte', 'web': [DEM + 'the-fonte-the-basics/', DEM + 'extending-the-fonte/', DEM + 'the-fonte-in-other-keys/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: escapes and returns; after the medial repeat sign; ①♯–② with 6–5–4 then ⑦–① with 5–4–3; major only, relative major in minor pieces; dim7 may replace V7.',
                                                      'Demeyere: Riepel (1755/57); Jommelli; hermaphrodite note; ⑤–① and ⑦–⑤–① basses; chromatic and metrically shifted Fonte.']},
})

P.append({
    'id': 'monte', 'name': 'Monte', 'group': 'schemata-sequential', 'kind': 'schema', 'direction': 'ASC', 'bass': '③→④ | ④♯→⑤ (…)', 'melody': 'each segment a cadence (often ⑦→① clausula cantizans)',
    'modes': ['major', 'minor'], 'textures': [3, 4], 'function': ['opens the 2nd half of a binary form (alternative to the Fonte)'],
    'summary': 'Ascending sequence of cadences starting in the subdominant key; “mountain”.',
    'rules': ['A key is defined by A4→6 or d5→3.'],
    'guidelines': ['2 segments: IV–V. 3: IV–V–vi, or IV(iv)–V–I(i). 4: IV–V–vi–I. 5: IV–V–vi–I–I (vii° sounds too dissonant, so segment 4 stays in I).',
                   'Minor Monte ending in v: use V instead of v (the second segment is key-ambiguous).', 'Rare: major Monte ending in v; (♭VI–)♭vii–i Monte.', 'IV–I Monte: clausula altizans.', 'Borrowed Monte: in a minor piece, take the Monte from the relative major.'],
    'examples': [ex('monte-2', '2-segment Monte, 4 parts', 'C', '3:6,b5,3 4:5,3,8 | #4:6,5,3 5:5,3,8')],
    'sources': {'notes': 'Moti del Basso pp.29–30', 'hcp': '§2.2; §8.2', 'web': [DEM + 'the-monte-the-basics/', DEM + 'some-more-montes/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: IV then V; IV–V–vi; IV–V–I/iv–V–i; IV–V–vi–I; IV–V–vi–I–I; minor Monte possible.'],
                     'flags': ['The A4→6 / d5→3 key-definition rule is from your notes (Demeyere does not phrase it that way).']},
})

P.append({
    'id': 'monte-romanesca', 'name': 'Monte Romanesca', 'group': 'schemata-sequential', 'kind': 'schema', 'direction': 'ASC', 'bass': 'leaping: ①–⑤ | ②–⑥ | (③–⑦); stepwise: ①–⑦♭ | ②–① | ③',
    'modes': ['major'], 'textures': [3, 4], 'function': ['opening', 'modulation'],
    'summary': 'A schema of its own (not Monte, not Romanesca): 2, 2½ or 3 segments; leaping (5↑4↓) or stepwise (2↓3↑).',
    'rules': ['Major only (in minor the segment ②–⑥ fails on the diminished triad; in major ③–⑦ fails).'],
    'guidelines': ['♭3 on ⑤ optional to announce the minor quality of ii and vi.', 'Canonic version with (8–)4–3 for practical composition.', '2½ segments + comma (regular comma or Corelli long comma).', '3 segments: deviation back to the main key (5♯ on ⑦), or the third segment rises a third (④–①).', 'Can be tonicized (upper, lower or both voices).'],
    'examples': [ex('mr-leap', 'Leaping, basic 2 segments (3 parts)', 'C', '1:3,8 5:5,3 | 2:3,8 6:5,3'), ex('mr-step', 'Stepwise, 3 segments', 'C', '1:3,8 b7:3,6 | 2:3,8 1:3,6 | 3:3,8')],
    'sources': {'notes': 'Moti del Basso pp.31–32; HCP Notes p.11', 'hcp': '§5.4 The Monte Romanesca', 'web': [DEM + 'the-leaping-monte-romanesca/', DEM + 'the-stepwise-monte-romanesca/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: bass a fifth up and a fourth down; 4–3 suspension on second chord; segments ③–⑦ (major) and ②–⑥ (minor) omitted; canonic variant.',
                                                      'Demeyere: 2, 2½, 3 segments; Corelli long comma; regular comma; tonicization; major only.']},
})

P.append({
    'id': 'quiescenza', 'name': 'Quiescenza', 'group': 'schemata-pedal', 'kind': 'pedal', 'direction': 'static', 'bass': '① pedal (also ⑤)', 'melody': '⑤–⑥–⑦–① or ①–♭⑦–⑥–♮⑦–①',
    'modes': ['major', 'minor'], 'textures': [3, 4], 'function': ['proposta (1st half 18th c., once, unequal stages)', 'closing (2nd half 18th c., twice in a row, after a clausula basizans)'],
    'summary': 'Tonic pedal with 4–5 sonorities: 5/3 – (7♭/5/3) – 6/4 – 7♮/4/2 – 8/5/3. The temporary departure (d5→3, toward IV) and return (A4→6) strengthen the tonic.',
    'rules': ['Chromatic element: lowered ⑦ in major; raised ③ in minor; raised ④ on a ⑤ pedal (both modes).'],
    'guidelines': ['Often announced by a trill on ②.', 'Minor proposta: the augmented second ⑥–⑦♯ can be avoided (Bach BWV 999 turns ⑤–⑥–④–③), borrowed (⑥♯), or kept (Cimarosa).',
                   'Insert 6/4/2 between 6/4 and 7♮/4/2 (Do-Ti-Te-La-Ti-Do counterpoint).', 'Hermaphrodite Quiescenza: ⑥♭ in major — darker.', 'Quiescenza-Ponte: ⑤–④–③–④♯–⑤ over a ⑤ pedal, prolongs a half cadence and bridges back (K.550/i, bars 38–42).'],
    'examples': [ex('qui-maj', 'On ①, major, 3 parts', 'C', '1:8,3 .:b7,3 | .:6,4 .:7,4 | .:8,3@2'), ex('qui-min', 'On ①, minor', 'a', '1:8,3 .:7,#3 | .:6,4 .:#7,4 | .:8,3@2'),
                 ex('qui-dom', 'On ⑤ (raised ④)', 'C', '5:8,3 .:7,3 | .:6,4 .:#7,4 | .:8,3@2'), ex('qui-prop', 'Proposta with ⑤–⑥–⑦–① treble, 4 parts', 'C', '1:5,3,8 .:6,4,8 | .:7,4,2 .:8,5,3@2')],
    'sources': {'notes': 'Moti del Basso pp.33–34; HCP Notes p.10', 'hcp': '§5.2 The Quiescenza', 'web': [DEM + 'the-quiescenza-the-basics/', DEM + 'some-more-quiescenzas/']},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: pedal on ① or ⑤; d5→3 and A4→6; chromatic element ♭7 (major), ♯3 (minor), ♯4 on ⑤.',
                                                      'Demeyere: Gjerdingen’s 4–5 sonorities; proposta (Bach) vs closing (Cimarosa, Mozart); BWV 999 and Cimarosa C36 minor solutions; trill on ➋.']},
})

P.append({
    'id': 'ponte', 'name': 'Ponte', 'group': 'schemata-pedal', 'kind': 'pedal', 'direction': 'static', 'bass': '⑤ pedal (may be implicit)', 'melody': 'parallel 3rds or 6ths',
    'modes': ['major', 'minor'], 'textures': [3], 'function': ['bridge (Riepel)', 'after the repeat sign'],
    'summary': 'Dominant pedal with parallel thirds or sixths and no fixed structure; rhetorically effective right after ‖: .',
    'rules': [], 'guidelines': ['Melodic-minor inflections (②♯, ③♯) in the rising line.'],
    'examples': [ex('ponte-min', 'Standard form, A minor', 'a', '5:#3-4,8-#2 | .:5,#3 .:6,4 | .:7,5 .:6,4 | .:5,#3@2')],
    'sources': {'notes': 'Moti del Basso p.35', 'other': 'Riepel (term); Gjerdingen 2007'},
    'verification': {'status': 'notes-only', 'checks': ['HCP preface: Riepel coined Fonte and Monte; “Another term, the Ponte, does not occur in HCP.”'],
                     'flags': ['No Ponte page on essaysonmusic.com; verify against Gjerdingen if needed.']},
})

P.append({
    'id': 'indugio', 'name': 'Indugio', 'group': 'schemata-pedal', 'kind': 'pedal', 'direction': 'static', 'bass': '④ pedal (6 or 6/5)', 'melody': '② (with lower neighbour ①♯), often ②–④–⑥ ascent at the end',
    'modes': ['major', 'minor'], 'textures': [3, 4], 'function': ['pre-cadential delay', 'concluded by a converging cadence'],
    'summary': 'Lingers on ④ to increase the expectation of closure; typically ends with the converging cadence (④–♯④–⑤) and its high ⑥ drop.',
    'rules': [], 'guidelines': ['Bass ④ can be embellished by the lower neighbour ③; treble ② by ①♯.', '②–④–⑥ ascent = temporary focus on the ii key; perfect for connecting to the high ⑥ drop.',
                               'With 5/3 triad (V7/IV, vii°/IV → IV) = temporary focus on the ④ key.', 'With N6 (②♭): popular in minor, possible in major (temporary minor).'],
    'examples': [ex('ind-6', 'With 6 chord + converging cadence', 'C', '4:6,3@2 | .:6,3 #4:6,5 | 5:5,3@2')],
    'variants': [var('ind-circular', 'Circular Indugio', 'Three-part, most common: bass ④–⑤–⑥–⑤–④, treble ②–③–④–③–② in parallel sixths, pedal ① in the middle voice; 6/5 – passing 6/4 – 6/3; usually repeated twice.',
                     examples=[ex('ind-circ', 'Circular Indugio + converging cadence', 'C', '4:6,5 5:6,4 | 6:6,3 5:6,4 | 4:6,5 5:6,4 | 6:6,3 5:6,4 | 4:6,5 #4:6,5 | 5:5,3@2')]),
                 var('ind-chromatic', 'Chromatic circular Indugio', '♯④ starts each rotation (V6/5/V → I6/4); add the melodic inversion for 4 parts.'),
                 var('ind-susp', 'With (6–)7–6 suspension', 'Upper voice holds over the barline (Mozart K.279).'),
                 var('ind-finta', 'Cadenza finta (feigned cadence)', 'Pedals on ① and ③; or the interrupted circular Indugio (bass leaps ③→④), or set as a deceptive cadence (Valente).'),
                 var('ind-shifted', 'Metrically shifted circular Indugio', 'Bass ⑥–⑤–④–⑤–⑥ with ⑥ strongest; 6/3 – passing 6/4 – 6/5.')],
    'sources': {'notes': 'Moti del Basso pp.36–38', 'web': [DEM + 'the-indugio-part-1/', DEM + 'the-indugio-part-2-the-circular-indugio/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere: pedal on ④ with 6 or 6/5; converging cadence; triad start; Neapolitan sixth; circular Indugio rotations, cadenza finta (Valente), interrupted, metrically shifted.']},
})

P.append({
    'id': 'fenaroli', 'name': 'Fenaroli', 'group': 'schemata-pedal', 'kind': 'schema', 'direction': 'circular', 'bass': '① ② ③ ⑦ | ① ② ③ ⑦ | ① (circling the tonic)',
    'melody': '⑦–① … ②–③ (imitating the bass) over a ⑤ pedal in another voice', 'modes': ['major'], 'textures': [3], 'function': ['pre-cadential', 'opening'],
    'summary': 'Three components: bass circling ①; one upper voice imitating the bass (canonic); another holding ⑤. Usually repeated twice.',
    'rules': ['Harmonies follow the RO, except 6/4 on ②.'],
    'guidelines': ['All sorts of diminutions may obscure it.'],
    'examples': [ex('fen-3p', '3 parts', 'C', '1:5,3 2:4,6 | 3:3,6 7:6,3 | 1:5,3 2:4,6 | 3:3,6 7:6,3 | 1:5,3@2')],
    'sources': {'notes': 'Moti del Basso p.39; HCP Notes p.12', 'hcp': '§5.5 The Fenaroli'},
    'verification': {'status': 'verified', 'checks': ['HCP Terms: three components; RO except 6/4 on ②.']},
})

P.append({
    'id': 'romanesca-prinner', 'name': 'Romanesca + Prinner', 'group': 'schemata-combinations', 'kind': 'combination', 'direction': 'DSC',
    'bass': '① ⑦ | ⑥ ③ | ④ ③ ② ⑤ | ①', 'modes': ['major'], 'textures': [3], 'function': ['common 18th-c. opening'],
    'summary': 'Romanesca (gambit) answered by a Prinner (riposte) at twice the harmonic rhythm; often followed by a modulating Prinner.',
    'rules': [], 'guidelines': ['Other combinations to explore: Prinner + Fonte/Meyer; Monte + Fonte; Fonte + Monte.'],
    'examples': [ex('rp', 'Romanesca (stepwise→leaping) + Prinner', 'C', '1:5,3 7:6,3 | 6:3,5 3:6,3 | 4:3,5@0.5 3:3,6@0.5 2:3,7@0.5 5:7,3@0.5 | 1:3,8@2')],
    'sources': {'notes': 'Moti del Basso p.40', 'web': [DEM + 'combinations-of-a-romanesca-and-a-prinner/']},
    'verification': {'status': 'verified', 'checks': ['Demeyere page exists: “Combinations of a Romanesca and a Prinner”.']},
})

PATTERNS = P
