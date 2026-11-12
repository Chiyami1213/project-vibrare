# -*- coding: utf-8 -*-
"""Cadences tab content. Outline follows the user's notes: 'Cadences' (3 pp.), 'Clausulae' (1 p.),
'HCP Notes' (cadence pp. 6-8 and 13-15), annotated HCP Appendix II, Fenaroli Book III."""
from data_schemata import ex, var, DEM

GROUPS = [
    {'id': 'cad-theory', 'title': 'Terminology and classification', 'blurb': 'Bass motion decides the cadence family; the treatment of ⑤ decides the form (simple / compound / double).'},
    {'id': 'cad-clausulae', 'title': 'Clausulae', 'blurb': 'The melodic (polyphonic) view of the cadence: each voice has its own formula.'},
    {'id': 'cad-2part', 'title': 'Two-part cadences', 'blurb': 'Discant (③–①… / ⑦–①) and tenor (②–①) cadences in simple, compound and double form.'},
    {'id': 'cad-3part', 'title': 'Three-part cadences', 'blurb': 'Tenor-type (bass ②–①) and leaping (bass ⑤–①) cadences, plus Galant, Neapolitan, deceptive and Phrygian.'},
    {'id': 'cad-4part', 'title': 'Four-part cadences', 'blurb': 'Every three-part cadence has a four-part equivalent; the fourth voice completes the chords and raises doubling questions.'},
    {'id': 'cad-related', 'title': 'Related cadential formulas', 'blurb': 'Cadential schemata that appear in the Schemata tab.'},
]

NOMEN = {
    'bassMotion': [
        {'name': 'Authentic (leaping)', 'abbr': 'AC', 'bass': '⑤→①', 'sub': [{'name': 'Perfect', 'abbr': 'PAC', 'def': 'soprano and bass both on ①'}, {'name': 'Imperfect', 'abbr': 'IAC', 'def': 'soprano (or bass) on ③'}]},
        {'name': 'Half', 'abbr': 'HC', 'bass': '…→⑤', 'sub': [{'name': 'Phrygian half', 'abbr': 'PHC', 'def': '⑥→⑤ half step in the bass (minor)'}]},
        {'name': 'Evaded / Deceptive', 'abbr': 'EC / DC', 'bass': '⑤→ not ① (usually ⑥); also ⑤→④♯ (deceptive Neapolitan)'},
        {'name': 'Discant', 'abbr': 'DC', 'bass': '⑦→①'}, {'name': 'Alto', 'abbr': 'AC', 'bass': '④→③'}, {'name': 'Tenor', 'abbr': 'TC', 'bass': '②→①'},
    ],
    'form': [{'name': 'Simple', 'abbr': 'S', 'def': 'all consonances'}, {'name': 'Compound', 'abbr': 'C', 'def': 'dissonance (suspension) + consonance on ⑤'},
             {'name': 'Double', 'abbr': 'D', 'def': 'simple + compound on a sustained ⑤ (5/3 – 6/4 – 5/4 – 5/3)'}],
    'grammar': '[Evaded | Deceptive]? + [Perfect | Imperfect] + [Simple | Compound | Double] + [Galant | Neapolitan | Discant | Alto | Tenor]? + [Half | Phrygian Half]? + Cadence',
    'abbreviations': {'PASC': 'perfect authentic simple', 'IASC': 'imperfect authentic simple', 'PACC': 'perfect authentic compound', 'IACC': 'imperfect authentic compound',
                      'PADC': 'perfect authentic double', 'PSGC': 'perfect simple Galant', 'PCGC': 'perfect compound Galant', 'ICGC': 'imperfect compound Galant',
                      'SNC': 'simple Neapolitan', 'CNC': 'compound Neapolitan', 'DCC': 'deceptive compound', 'DCGC': 'deceptive compound Galant', 'GHC': 'Galant half cadence'},
    'note': 'From your HCP cadence notes p.13 (nomenclature table) and your annotations on HCP Appendix II. “Plagal” was crossed out in your notes and is not used.',
}

C = []

C.append({
    'id': 'fenaroli-definitions', 'name': 'Fenaroli’s three cadences', 'group': 'cad-theory', 'kind': 'definition',
    'summary': 'A cadence is the bass going ①→⑤→①. Simple: plain consonances (3 and 5 over ①; major 3 and 5 over ⑤). Compound: a 4th over ⑤, prepared by the octave of ①, resolving to the major 3rd. Double: over ⑤ in turn 5/3, 6/4, 5/4, 5/3.',
    'rules': ['Compound: the 4 over ⑤ must be prepared by the 8 of ① and resolve to the major 3.', 'Double: ⑤ lasts twice as long as in the compound cadence (four sonorities).'],
    'guidelines': ['Right-hand positions: 1st position (8 on top) closes most strongly; 2nd (3 on top) and 3rd (5 on top) are less conclusive.'],
    'examples': [ex('fen-simple', 'Simple', 'C', '1:8,5,3 5:3,8,5 | 1:8,5,3@2'), ex('fen-comp', 'Compound', 'C', '1:8,5,3 5:^4-3,8-7,5 | 1:8,3,8@2'),
                 ex('fen-double', 'Double', 'C', '1:8,5,3 | 5:5-6-5-.,8-.-.-7,3-4-^4-3@4 | 1:8,3,8@2')],
    'sources': {'fenaroli': 'Book III, “Concerning Cadences” (1775)', 'web': [DEM + 'cadences-the-basics/']},
    'verification': {'status': 'verified', 'checks': ['Fenaroli III (Gjerdingen ed.): definitions quoted in substance.', 'Demeyere: simple ⑤ = 1 beat, compound 2 beats (4–3, first sonority 5/4 or 6/4), double 4 beats.']},
})

C.append({'id': 'nomenclature', 'name': 'Naming a cadence', 'group': 'cad-theory', 'kind': 'nomenclature', 'nomenclature': NOMEN,
          'summary': 'Combine the bass-motion family with the form and the type: e.g. “perfect compound Galant cadence” (PCGC).',
          'sources': {'notes': 'HCP Notes (Cadences) p.13; HCP Notes p.6', 'hcp': 'Ch. 3; Appendix II'},
          'verification': {'status': 'verified', 'checks': ['HCP Appendix II: perfect = tonic in both voices; imperfect = upper voice on 3̂ or lower on ③; tenor (②–①) vs ⑤–① types; simple/compound/double.']}})

# ---------------- clausulae
CL = [
    ('cantizans', 'Clausula cantizans', '(①–)⑦–①', 'discant cadence', 'weakest'),
    ('altizans', 'Clausula altizans', '(③–)⑤–③ or (⑤–)④–③', 'alto cadence', 'weak'),
    ('tenorizans', 'Clausula tenorizans', '(③–)②–①', 'tenor cadence', 'strong'),
    ('basizans', 'Clausula basizans', '(①–)⑤–①', 'perfect cadence', 'strongest'),
]
for i, (cid, name, deg, cad, strength) in enumerate(CL):
    C.append({'id': 'clausula-' + cid, 'name': name, 'group': 'cad-clausulae', 'kind': 'clausula', 'degrees': deg, 'cadenceWhenInBass': cad, 'conclusiveness': strength, 'rank': i,
              'summary': f'{name}: {deg}. When it lies in the bass the result is the {cad}.',
              'rules': ['Any of the four clausulae can be the bass; the others then appear in the remaining voices (invertible counterpoint).'],
              'sources': {'notes': 'Clausulae p.1', 'other': 'Generalbass-Compendium p.32: cadences are named after the clausula in the bass'},
              'verification': {'status': 'verified', 'checks': ['Compendium: bass, tenor, Phrygian and discant cadences named by the bass clausula.', 'HCP Appendix II: ②–① tenor, ⑦–① discant, ⑤–④–③ alto (weakest cadence type in II.14).']}})

C.append({'id': 'clausulae-4part', 'name': 'Four-part cadences built from the clausulae', 'group': 'cad-clausulae', 'kind': 'demo',
          'summary': 'Same four voice formulas, redistributed: whichever clausula is in the bass names the cadence.',
          'examples': [ex('cl-perfect', 'Perfect cadence (basizans in bass)', 'C', '1:8,5,3 5:^4-3,8-7,5 | 1:8,3,8@2'),
                       ex('cl-alto', 'Alto cadence (altizans in bass)', 'C', '1:8,5,3 | 5:4,8,5 4:4+,9,6 | 3:6,3,6@2'),
                       ex('cl-tenor', 'Tenor cadence (tenorizans in bass)', 'C', '3:6,3,6 | 2:^7-6,3,8 | 1:8,5,3@2'),
                       ex('cl-discant', 'Discant cadence (cantizans in bass, bass suspension)', 'C', '1:3,5,8 | 1~:9,5,2 7:3,6,3 | 1:8,5,3@2')],
          'sources': {'notes': 'Clausulae p.1'}, 'verification': {'status': 'verified', 'checks': ['HCP Ex. II.14: tenor ③–②–①, discant (suspension in the bass), alto ⑤–④–③.']}})

# ---------------- two-part
TWO = [
    ('c2-simple-discant', 'Simple discant cadence (cadenza semplice)', 'Simple', '3 – 3 – 1 (8) over ① ⑦ ①', [ex('c2sd', 'Major', 'C', '1:3 7:3 | 1:8@2'), ex('c2sd-m', 'Minor', 'a', '1:3 #7:3 | 1:8@2')]),
    ('c2-simple-tenor', 'Simple tenor cadence', 'Simple', '6 – 6(♯) – 8 over ③ ② ①', [ex('c2st', 'Major', 'C', '3:6 2:6 | 1:8@2'), ex('c2st-m', 'Minor', 'a', '3:6 2:#6 | 1:8@2')]),
    ('c2-compound-tenor', 'Compound tenor cadence (cadenza composta)', 'Compound', '8 (or 6 on ③) ⌒ 7–6(♯) – 8; suspension in the upper voice', [ex('c2ct', 'Major', 'C', '1:8 | 2:^7-6 | 1:8@2'), ex('c2ct-m', 'Minor', 'a', '1:8 | 2:^7-#6 | 1:8@2')]),
    ('c2-compound-discant', 'Compound discant cadence', 'Compound', '1 or 3 ⌒ 2–3 – 1 or 3 over ①⌒⑦ ①; suspension in the bass. Major: 1→3 or 3→1; minor: 1→1 or 3→3.', [ex('c2cd', 'Major (3→1)', 'C', '1:3 | 1~:2 7:3 | 1:8@2')]),
    ('c2-double-discant', 'Double discant cadence (cadenza doppia)', 'Double', 'simple + compound: 3 | 3 3 2–3 | 1 over ① | ⑦ ①⌒ ⑦ | ①; twofold leading-tone resolution in the lower voice', [ex('c2dd', 'Major', 'C', '1:3 | 7:3 1:3 1~:2 7:3 | 1:8@2')]),
    ('c2-double-tenor', 'Double tenor cadence', 'Double', '3♯ | 4♯–6 ⌒ 7–6♯ | 8 over ④⌒③ ② | ①; twofold leading-tone resolution in the upper voice', [ex('c2dt', 'Major', 'C', '4:3 | 4~:4+ 3:6 | 2:^7-6 | 1:8@2'), ex('c2dt-m', 'Minor', 'a', '4:#3 | 4~:4+ 3:6 | 2:^7-#6 | 1:8@2')]),
]
for cid, name, form, figs, exs in TWO:
    C.append({'id': cid, 'name': name, 'group': 'cad-2part', 'kind': 'cadence', 'form': form, 'figures': figs, 'textures': [2], 'examples': exs,
              'summary': name + '.', 'rules': ['Suspensions: the 7 is the tied note in the upper voice; the 2 is the tied note in the bass.'] if form == 'Compound' else [],
              'sources': {'notes': 'Cadences p.1; HCP Notes (Cadences) p.14', 'hcp': 'Appendix II, Ex. II.1–II.3; §1.3'},
              'verification': {'status': 'verified', 'checks': ['HCP Appendix II: simple 6–8 (tenor) and 3–1 (discant); compound 7–6–8 and 2–3–1; double cadence = simple + compound with twofold leading-tone resolution.']}})

# ---------------- three-part
THREE = [
    ('c3-simple-perfect', 'Simple authentic cadence (PASC)', 'Simple', '(5)/3 – 5/3♯ – (5)/3 over ① ⑤ ①', 'Most often ① incomplete, ⑤ complete; upper voices typically in parallel sixths.',
     [ex('c3sp', 'Major', 'C', '1:8,3 5:3,5 | 1:8,3@2'), ex('c3sp-m', 'Minor', 'a', '1:8,3 5:#3,5 | 1:8,3@2')]),
    ('c3-simple-tenor', 'Simple tenor cadence', 'Simple', '6/3 – 6♯/3 – (5)/3 over ③ ② ①', 'The final 8/3 is an incomplete 5/3; the penultimate is a diminished 6/3 treated as a consonance.',
     [ex('c3st', 'Major', 'C', '3:6,3 2:6,3 | 1:8,3@2')]),
    ('c3-compound-perfect', 'Compound authentic cadence (PACC)', 'Compound', '(5)/3 ⌒ 5/4–3♯ – (5)/3 over ① ⑤ ①', 'The 4 is prepared by the 8 on ① and resolves to the 3♯ (the 2–3 or 7–6 pattern between the upper voices).',
     [ex('c3cp', 'Major', 'C', '1:8,3 5:^4-3,5 | 1:8,3@2'), ex('c3cp-m', 'Minor', 'a', '1:8,3 5:^4-#3,5 | 1:8,3@2')]),
    ('c3-compound-65', 'Compound cadence with 6/5 on ④', 'Compound', '(5)/3 – 6/5 ⌒ 5/4–3♯ – (5)/3 over ① ④ ⑤ ①', 'Start 5/3 on ① or 6/3 on ③. The soprano suspension is a consonant 5th over ④.',
     [ex('c3c65', 'Major', 'C', '1:8,3 4:5,6 | 5:^4-3,5 | 1:8,3@2')]),
    ('c3-compound-tenor', 'Compound tenor cadence', 'Compound', '6/(3) ⌒ 7–6♯/3 – (5)/3 over ③ ② ①', '7–6–8 between the upper voices; suspension in the upper or middle voice.',
     [ex('c3ct', 'Major', 'C', '3:6,3 | 2:^7-6,3 | 1:8,3@2')]),
    ('c3-double', 'Double authentic cadence (PADC)', 'Double', '(5)/3 – 5/3♯ 6/4 ⌒ 5/4 – 5(7)/3♯ – (5)/3 over ① ⑤ (sustained) ①', 'Four sonorities on a sustained ⑤; can start 5/3 or 7/3. Solemn/majestic; at home in sacred music.',
     [ex('c3d', 'Major', 'C', '1:3,8 | 5:5-6-5-7,3-4-^4-3@2 | 1:3,8@2')]),
    ('c3-phrygian-half', 'Phrygian half cadence (PHC)', 'Compound', '6/3 – 6/3 ⌒ 7–6/3 – 5/3♯ over ① ⑦ ⑥ ⑤ (minor)', 'Baroque: major 6 on ⑥; Classical: augmented 6 (♯④). Often closes a Baroque slow movement as an upbeat to the next.',
     [ex('c3ph-b', 'Baroque', 'a', '1:6,3 7:6,3 | 6:^7-6,3 | 5:8,#3@2'), ex('c3ph-c', 'Classical (augmented sixth)', 'a', '1:6,3 7:6,3 | 6:^7-#6,3 | 5:8,#3@2')]),
    ('c3-galant', 'Galant cadence (PSGC / PCGC / ICGC)', 'Simple or compound', '(5)/3 – 6/(3) – 6/4–5/3 – (5)/3 over ① ④ ⑤ ①', 'Bass ①–④–⑤–① (③ 6/3 or ⑥ 5/3 may replace the first ①). Upper voices in parallel sixths (or thirds); compound = 6/4–5/3 on ⑤ with accented passing tones; complete = with the 6/3 on ④.',
     [ex('c3gc', 'Compound (PCGC)', 'C', '1:3,5 4:6,8 | 5:6-5,4-3 | 1:8,8@2'), ex('c3gs', 'Simple (PSGC)', 'C', '1:3,5 4:6,8 | 5:5,3 | 1:8,8@2')]),
    ('c3-neapolitan', 'Neapolitan cadence (SNC / CNC)', 'Simple or compound', '(5)/3 – ♭6/(3) – 5♮/3♯ (or 6/4–5♮/3♯) – (5)/3 over ① ④ ⑤ ①, minor', 'Variant of the Galant cadence with the lowered ②; the Neapolitan turn ♭②–⑦♯–①. Mostly minor; expresses pain, sorrow, anger.',
     [dict(cross=True, **ex('c3ns', 'Simple', 'a', '1:3,8 4:b6,3 | 5:#3,5 | 1:8,3@2')), dict(cross=True, **ex('c3nc', 'Compound', 'a', '1:3,8 4:b6,3 | 5:4-#3,6-5 | 1:8,3@2'))]),
    ('c3-deceptive', 'Deceptive cadence (DCC / DCGC)', 'Compound', '6/(3) – 6/5 or 6/4–5/3♯ – (5)/3 over ③ ④ ⑤ ⑥', '⑤→⑥ forbids 2–3 in an upper voice (parallel fifths): use 2–1. The third is doubled on ⑥.',
     [ex('c3dc', 'Deceptive Galant', 'C', '1:3,5 4:6,8 | 5:6-5,4-3 | 6:3,3@2')]),
]
for cid, name, form, figs, desc, exs in THREE:
    C.append({'id': cid, 'name': name, 'group': 'cad-3part', 'kind': 'cadence', 'form': form, 'figures': figs, 'textures': [3], 'summary': desc, 'examples': exs,
              'sources': {'notes': 'Cadences pp.1–2; HCP Notes pp.6–8 and Cadences pp.14–15', 'hcp': 'Ch. 3 (§3.1–3.5); Appendix II Ex. II.4–II.11'},
              'verification': {'status': 'verified', 'checks': ['Checked against HCP Ch. 3 Terms to remember and Appendix II descriptions.']}})

# ---------------- four-part
FOUR = [
    ('c4-simple', 'Simple cadence, close position', 'Simple', '8/5/3 – 8/5/3♯ – 8/5/3 over ① ⑤ ①', 'All voices in their most natural pattern: bass ①–⑤–①, soprano ①–⑦–① (discant), tenor ③–②–③, alto static ⑤. All 5/3 chords complete.',
     [ex('c4s', 'Major', 'C', '1:8,5,3 5:3,8,5 | 1:8,5,3@2')]),
    ('c4-simple-tenor', 'Simple tenor cadence', 'Simple', '6/6/3 – 8/6♯/3 – 8/(5)/3 over ③ ② ①', 'Your Cadences p.2 labels this row “D.C.”; with the bass ③–②–① it is a tenor cadence (T.C.) — see VERIFICATION.md.',
     [ex('c4st', 'Major', 'C', '3:6,6,3 2:8,6,3 | 1:3,8,5@2')]),
    ('c4-compound', 'Compound cadence (1700s standard)', 'Compound', '8/5/3 ⌒ 8/5/4–7/(5)/3♯ – 8/(5)/3 over ① ⑤ ①', 'The passing tone makes the alto ⑤–④–③: dominant 7/5/3 on ⑤, incomplete 5/3 on ①.',
     [ex('c4c', 'Major', 'C', '1:8,5,3 5:^4-3,8-7,5 | 1:8,3,8@2')]),
    ('c4-compound-65', 'Compound cadence with 6/5/3 on ④', 'Compound', '8/5/3 – 6/5/3 ⌒ 8/5/4–3♯ – 8/5/3 over ① ④ ⑤ ①', 'Alto ⑤–⑥–⑤–④–③. Variant ending on ♭⑥ (Molldur, major only).',
     [ex('c4c65', 'Major', 'C', '1:8,5,3 4:5,3,6 | 5:^4-3,8-7,5 | 1:8,3,8@2')]),
    ('c4-alto', 'Alto cadence', 'Simple', '6/3 – 5/3♯ – 6/4+/2 – 6/3 over ③ ⑤ ④ ③', 'The weakest cadence type; usually followed by a stronger one. Also ⑤–③ or ④–③ alone.',
     [ex('c4ac', 'Major', 'C', '3:6,3,8 5:3,8,5 | 4:4+,2,6 | 3:6,3,8@2')]),
    ('c4-galant', 'Galant cadence (4 parts)', 'Simple or compound', '8/5/3 – 6/3 (bass doubled) – 6/4–5/3 – 8/5/3 over ① ④ ⑤ ①', 'Double the bass of 6/3 on ④ and of 6/4 on ⑤.',
     [ex('c4gc', 'Compound', 'C', '1:3,5,8 4:6,8,3 | 5:6-5,4-3,8 | 1:8,8,3@2')]),
    ('c4-marpurg', 'Marpurg cadence', 'Compound', '8/6/3 on ④ (or ③) – 6/4 (appoggiatura) – 7/5/3♯ – 8/(5)/3', 'Galant variant with the soprano ①–③–②–①: the leap to ③ is an appoggiatura to ②.',
     []),
    ('c4-neapolitan', 'Neapolitan cadence (4 parts)', 'Simple or compound', '8/6♭/3 on ④ – 8/6/4 – 7/5/3♯ – 8/5/3 (or → ③ alto cadence)', 'Minor; can also continue deceptively to ⑥ or as an alto cadence via 6/4♯/2 on ④.',
     []),
    ('c4-discant', 'Discant cadence (4 parts)', 'Compound', '8/5/3 ⌒ 6/4/2 – 6/5(3)/3 – 8/5/3 over ①⌒ ⑦♯ ①', 'The tied ① is a bass suspension (prepared and resolved); relates to the compound cadence with 6/5 on ④ by invertible counterpoint. Often an opening gesture.',
     [ex('c4dc', 'Major', 'C', '1:8,5,3 | 1~:6,4,2 7:6,5,3 | 1:8,5,3@2')]),
    ('c4-double', 'Double cadence (4 parts)', 'Double', '8 – (5→6 or 7–6) 5 (5 or 7) / 3♯→4⌒4–3♯ over a sustained ⑤', 'Four sonorities on ⑤ as in three parts; the soprano holds 8.', []),
]
for cid, name, form, figs, desc, exs in FOUR:
    d = {'id': cid, 'name': name, 'group': 'cad-4part', 'kind': 'cadence', 'form': form, 'figures': figs, 'textures': [4], 'summary': desc, 'examples': exs,
         'sources': {'notes': 'Cadences pp.2–3', 'hcp': '§6.1–6.3; Appendix II Ex. II.12–II.15'},
         'verification': {'status': 'verified', 'checks': ['HCP Appendix II and Ch. 6 Terms (doublings, Marpurg, discant, alto).']}}
    if cid == 'c4-simple-tenor':
        d['verification'] = {'status': 'flagged', 'checks': ['HCP Ex. II.14a: bass ③–②–① = tenor cadence.'], 'flags': ['Your notes label this row D.C.; probably T.C.']}
    if not exs:
        d['verification']['flags'] = ['No auto-realization; transcribe the voicing from Cadences pp.2–3.']
    C.append(d)

# ---------------- related
C.append({'id': 'converging-cadence', 'name': 'Converging cadence', 'group': 'cad-related', 'kind': 'cadence', 'form': 'Half', 'figures': '6 – 6/5 – 5/3 over ④ ④♯ ⑤',
          'summary': 'Half cadence whose outer voices converge on ⑤: bass rises ④–♯④–⑤, treble falls. Ends the Indugio; often decorated by the high ⑥ drop.',
          'examples': [ex('conv', 'Major', 'C', '4:6,3 #4:6,5 | 5:5,3@2')], 'seeAlso': ['indugio'],
          'sources': {'notes': 'Moti del Basso pp.36–37', 'web': [DEM + 'what-is-a-converging-cadence/']}, 'verification': {'status': 'verified', 'checks': ['Demeyere: Gjerdingen’s term (2007, p.159); bass rises chromatically; high ➏ drop.']}})
C.append({'id': 'comma', 'name': 'Comma and Corelli long comma', 'group': 'cad-related', 'kind': 'cadence', 'form': 'Simple/compound', 'figures': 'regular comma: ③–④–⑦–① with the diminished 5th; long comma: 6/5 on ⑥ and 9–8 on ①',
          'summary': 'Short cadential tags that close the 2½-segment Monte Romanesca.', 'seeAlso': ['monte-romanesca'],
          'sources': {'notes': 'Moti del Basso p.31', 'web': [DEM + 'the-leaping-monte-romanesca/']}, 'verification': {'status': 'verified', 'checks': ['Demeyere: Corelli long comma (6/5 over ⑥, 9–8 over ①); regular comma starts with the diminished fifth.']}})
C.append({'id': 'jommelli-cadence', 'name': 'Jommelli cadence / extended SMP half cadence', 'group': 'cad-related', 'kind': 'cadence', 'form': 'Half',
          'summary': 'The Stabat Mater Prinner extended to a half cadence; in minor ♯④ is inserted before the final triad (diminished seventh).', 'seeAlso': ['stabat-mater-prinner'],
          'sources': {'notes': 'Moti del Basso p.19', 'web': [DEM + 'variants-of-the-prinner-part-4-the-stabat-mater-prinner/']}, 'verification': {'status': 'verified', 'checks': ['Demeyere: “An appended version of this is called a Jommelli cadence.”']}})
C.append({'id': 'cadenza-finta', 'name': 'Cadenza finta (feigned cadence)', 'group': 'cad-related', 'kind': 'cadence', 'form': '—',
          'summary': 'Valente’s term for Indugio variants that pretend to cadence: double pedal on ① and ③, or the interrupted circular Indugio (which may also be set as a deceptive cadence / deceptive Pulcinella).', 'seeAlso': ['indugio'],
          'sources': {'notes': 'Moti del Basso p.38', 'web': [DEM + 'the-indugio-part-2-the-circular-indugio/']}, 'verification': {'status': 'verified', 'checks': ['Demeyere: “Cadenza finta: Saverio Valente’s term”.']}})

PATTERNS = C
