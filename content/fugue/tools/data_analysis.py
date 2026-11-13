# -*- coding: utf-8 -*-
"""Fugue ANALYSIS tab. Compiled from:
  RO  = S. Roberts, Toward a Methodology for the Analysis of Fugue: An Examination of Selected Bach Organ Works (diss., Florida State Univ., 2004)
  BS  = P. Badura-Skoda, Interpreting Bach at the Keyboard (Oxford 1993) — only Ch. 9 'Rendering the Structure as a Whole' and Ch. 10 (WTC I D# minor fugue) are used
  BO  = E. Bodky, The Interpretation of Bach's Keyboard Works (Harvard 1960) — only the parts that bear on reading fugue subjects (articulation slurs, affect/key, symbolism)
  GE  = A. Gedalge, Traité de la fugue — the one-page 'Plan for an Academic Fugue' table supplied
  CPE = C. P. E. Bach, Essay on the True Art of Playing Keyboard Instruments — only the organ-point chapter, the accompaniment of fugues, and Mitchell's
        introduction on analyses by the Bach school are used (the Essay contains no fugue analysis)
  MA  = A. Mann, The Study of Fugue — cross-check for terms, Marpurg's and Martini's historical analyses
All text is paraphrased; short quotations are marked."""

RO = 'Roberts (2004)'
BS = 'Badura-Skoda (1993)'
BO = 'Bodky (1960)'
GE = 'Gedalge, Traité de la fugue (plan table)'
MA = 'Mann, The Study of Fugue (1958/1987)'
CPE = 'C. P. E. Bach, Essay (trans. Mitchell 1949)'


def T(id, group, title, kind, summary, steps=(), rules=(), guidelines=(), terms=(), tables=(), cases=(), sources=(), checks=(), flags=(), status='verified', tools=(), seeAlso=()):
    d = {'id': id, 'group': group, 'title': title, 'kind': kind, 'summary': summary}
    for k, v in (('steps', steps), ('rules', rules), ('guidelines', guidelines), ('tables', tables), ('cases', cases), ('tools', tools), ('seeAlso', seeAlso)):
        if v:
            d[k] = list(v)
    if terms:
        d['terms'] = [{'term': a, 'def': b} for a, b in terms]
    d['sources'] = list(sources)
    v = {'status': status, 'checks': list(checks)}
    if flags:
        v['flags'] = list(flags)
    d['verification'] = v
    return d


def tbl(id, title, columns, rows, note=None):
    d = {'id': id, 'title': title, 'columns': columns, 'rows': rows}
    if note:
        d['note'] = note
    return d


GROUPS = [
    {'id': 'a-basics', 'title': 'What to label', 'blurb': 'The traditional elements every fugue analysis starts with.'},
    {'id': 'a-method', 'title': 'A method: notable properties (Roberts)', 'blurb': 'A six-step procedure that goes beyond labelling: find what is unusual in the opening, then see whether the fugue "answers" it.'},
    {'id': 'a-cases', 'title': 'Case studies', 'blurb': 'Bach fugues analysed in the sources.'},
    {'id': 'a-structure', 'title': 'Structure, tonality and plans', 'blurb': 'Key plans, proportions, the academic fugue plan, and how the large shape is heard.'},
    {'id': 'a-meaning', 'title': 'Character, affect and symbol', 'blurb': 'Reading a subject\'s expression: articulation, key character, figures and symbols (with the sources\' own cautions).'},
]

TOPICS = [
    # ------------------------------------------------------------- basics
    T('elements', 'a-basics', 'Traditional fugue elements', 'concept',
      'Step 1 of any analysis: find and label the subject and answer entries (with voice and key), the countersubject(s), codettas, episodes, middle entries, any stretto, and the coda; note techniques such as augmentation, diminution, inversion and retrograde.',
      terms=[('Subject', 'the theme, stated first alone'), ('Answer', 'the subject transposed to the dominant (real = exact; tonal = adjusted so the tonic–dominant frame stays in the key)'),
             ('Countersubject (CS)', 'a counter-melody that regularly accompanies the subject/answer'), ('Codetta', 'a short link inside the exposition (Roberts follows Lester and calls the one in WTC I c minor "Episode 1")'),
             ('Exposition', 'the first round of entries, one in each voice; its end is part of Step 1'), ('Episode', 'a passage without a complete entry, usually built from subject or CS motives, often sequential and modulating'),
             ('Middle entries', 'entries after the exposition, often in related keys'), ('Stretto', 'overlapping entries'), ('Counterexposition', 'a second exposition in which the voices that had the subject now have the answer and vice versa (Gedalge\'s plan)'),
             ('Pedal point', 'a held bass (dominant before the end, tonic at the end in the academic plan)'), ('Coda', 'closing section after the last structural cadence')],
      guidelines=['Beyond the exposition you do not need to decide whether an entry is a "subject" or an "answer" — it is often impossible unless the answer is tonal (Roberts).',
                  'In Bach the voice often "runs into" the subject without a break, sometimes arriving only on its second note — a reason not to hammer every entry in performance (Badura-Skoda).'],
      sources=[RO + ', Ch. 3 Step 1 and Fig. 5 (WTC I C minor)', BS + ', Ch. 10 "General Remarks on the Performance of Fugues"', GE, MA + ', Marpurg pp. 154–155'],
      checks=['Element list = Roberts Step 1a; counterexposition and pedal points from Gedalge\'s plan', 'Cross-check (Mann): Marpurg (1753) names five characteristic elements — theme, answer, exposition (repercussio), counterparts, episodes; Walther\'s repercussio also meant the counter-exposition. Consistent with the list.'], tools=['analysis-worksheet']),
    T('statistics', 'a-basics', 'How long are Bach\'s fugues? (statistics)', 'table',
      'Roberts measures length in beats (bars × beats per bar) so that different metres compare fairly.',
      tables=[tbl('wtc-vs-organ', 'Averages (Roberts, Tables 1–2)', ['Corpus', 'Subject length', 'Fugue length'],
                  [['Well-Tempered Clavier (48 fugues)', '≈ 8.5 beats', '≈ 61.5 bars ≈ 184 beats'], ['Organ fugues', '≈ 11.4 beats', '≈ 121 bars ≈ 366 beats (about twice as long)']]),
              tbl('studied', 'The four organ fugues studied', ['Fugue', 'Subject', 'Character'],
                  [['G minor BWV 578', '4½ bars', 'instrumental; a period'], ['E minor BWV 533', '2 bars', 'instrumental'], ['C major BWV 545', '3 bars', 'sustained, vocal-like'], ['C major BWV 547', '1 bar', 'instrumental; 49 entries']])],
      guidelines=['Following Paul Walker: harpsichord fugues tend to be brief and tight (teaching pieces), organ fugues grander (public performance, pedal range and colour).'],
      sources=[RO + ', Ch. 1 Tables 1–2; Ch. 3'], checks=['Averages and subject lengths quoted from Roberts; the full per-fugue tables are in the dissertation']),
    # ------------------------------------------------------------- method
    T('roberts-method', 'a-method', 'Six-step method for fugue analysis', 'procedure',
      'Roberts\' core idea: each Bach fugue begins with a "musical core" containing notable properties — things that arouse analytic curiosity. The rest of the fugue either reconciles them (a rhetorical approach) or leaves them unchallenged (a literal approach). The process is recursive: a property\'s importance only shows once you see the whole fugue.',
      steps=['1. Identify the traditional elements: entries (voice, key), countersubject, codettas, episodes, coda; techniques (augmentation, diminution, inversion, retrograde, stretto); harmony.',
             '2. Find notable properties in the exposition: linear ascents/descents; "blocked" ascents/descents; rhythmic and melodic patterns (e.g. cells); "suspended" scale degrees; contrasting material (active vs static); structural units (a subject that is a period).',
             '3. Look for patterns in the structure from Step 1, using integrants (the recurring element, usually entries) and digressions (what comes between, usually episodes): successively longer/shorter sections; mirrored (palindromic) lengths; simple length ratios (1:2, 2:3, 3:4, 4:5 — the tuning ratios).',
             '4. Re-segment the fugue by other significant phenomena if the entry/episode map is unhelpful: incoherent or obscured entry structure; rare changes in the prevailing rhythm; rare changes of texture or density; several entries fused into one "Exposition Block".',
             '5. If Step 4 produced a new structure, repeat Step 3 on it.',
             '6. Decide how the fugue responds: a property is reconciled when it reappears with the feature that made it notable resolved (a blocked descent finally reaches 1̂). All reconciled → rhetorical; none → literal.'],
      terms=[('Notable property', 'a salient feature not required of every fugue (e.g. a head-and-tail subject), or an anomaly'), ('Blocked line', 'a descent that does not reach 1̂, or an ascent that stops short of 5̂ (from below) or 1̂ (from 5̂)'),
             ('Suspended scale degree', 'a non-tonic degree left unconnected linearly'), ('Integrant / digression', 'the recurring core element vs what lies between; = entry / episode in a traditional segmentation'),
             ('Exposition Block (EB)', 'several entries that act as one unit (BWV 547)'), ('Rhetorical / literal', 'notable properties resolved by musical "argument" / simply presented and left standing')],
      guidelines=['Do not treat the expected Urlinie descent as notable by itself; it becomes notable only if the fugue makes something of it.', 'In the rhetorical fugues studied, the properties resolve together, near the end, and the fugue stops soon after (any coda is brief).', 'Accept as notable only features supported both in the opening and in the fugue as a whole.'],
      sources=[RO + ', Ch. 1 and Ch. 3 (outline of the methodology)'], checks=['Steps and sub-points follow Roberts\' own outline at the end of Ch. 3'],
      flags=['Roberts builds on Daniel Harrison ("Rhetoric and Fugue", 1990) and Joel Lester (2001); he deliberately avoids naming classical rhetorical figures.'], tools=['analysis-worksheet', 'proportion-calculator']),
    T('analysis-critiques', 'a-method', 'Other analytical approaches (and their limits)', 'concept',
      'Roberts surveys approaches before proposing his own.',
      tables=[tbl('approaches', 'Approaches to fugue analysis (Roberts, Ch. 2 and Conclusion)', ['Approach', 'Idea', 'Roberts\' reservation'],
                  [['Traditional formal analysis', 'subject/answer/CS, exposition–episodes–middle entries–close, keys, devices', 'describes the surface; treats fugue as a form, not as a compositional process'],
                   ['Lerdahl & Jackendoff (GTTM)', 'rhythm-based hierarchies', 'rhythm-first readings can conflict with harmony and voice leading'],
                   ['Renwick', 'Schenkerian subject/answer "paradigms"', 'paradigms do not always clarify the harmony and voice leading of a fugue'],
                   ['Harrison', 'rhetoric as musical argument: a status (issue) is set up and resolved', 'adopted as the basis of the rhetorical reading'],
                   ['Lester', 'an opening core of material worked through parallel sections with heightened recurrences', 'adopted, but "core" widened beyond themes to structure, rhythm and spacing'],
                   ['Westergaard', 'musical space (degrees and keys)', 'extended to horizontal space (blocks of bars)']])],
      guidelines=['"No single defining characteristic beyond imitation in the broadest sense" (Walker, quoted by Roberts) — fugue is a procedure more than a form.'],
      sources=[RO + ', Ch. 1–2, Conclusion']),
    T('historical-analysis', 'a-method', 'How the old masters analysed fugues', 'concept',
      'Long before modern methods, fugues were analysed in print. The historical models show what earlier musicians listened for, and Mann\'s history shows which habits later distorted analysis.',
      tables=[tbl('hist', 'Historical analyses of fugues', ['Who', 'How', 'Use for analysis today'],
                  [['Marpurg (1753), four-part fugue', 'bar-by-bar account divided into seven expositions; for each: order of entries, subject/answer exchange, closeness of entries, double counterpoint, how cadences are avoided', 'segment a fugue into expositions and say what changes from one to the next'],
                   ['Marpurg, Kyrie on three themes', 'four "parts" defined by key areas (I–V; III–VI; vi–ii; dominant then tonic pedal) and by which themes combine', 'read the large form through key areas and combinations, not a fixed pattern'],
                   ['Martini (1775), Esemplare', 'numbered entry markers in the score with commentary (real vs tonal answers, "inversion of answers", stretto, pedal, harmonies used)', 'annotate entries with numbers and comment only on what is notable'],
                   ['Bach circle (Kirnberger)', 'Rameau-style fundamental-bass analyses of WTC fugues (C minor, B minor) — C. P. E. Bach disclaimed Rameau\'s principles', 'harmonic reduction is one layer, not the whole story'],
                   ['19th-c. textbooks (Riemann, Prout, Kitson)', 'fugue as tripartite form / 8-bar period; "exam fugue" checklists', 'avoid: Mann shows these judge Bach by rules his fugues never followed']])],
      guidelines=['Marpurg\'s lesson from his analysis: entries should not be delayed when the texture allows them; free passages are inserted only to reach a place suited for an entry.',
                  'Martini judges a fugue by clarity, simplicity and regularity — and by whether every voice re-enters with the theme after a rest.',
                  'Mann: describe style before form; a fugue is a sum of procedures (state, answer, establish the key, develop, re-establish), not a mould.'],
      sources=[MA + ', pp. 182–184 (Marpurg\'s analysis), 204–212 (Kyrie), 270–312 (Martini), 62–72 (textbooks)', CPE + ', translator\'s introduction (Mitchell) on Kirnberger\'s analyses'],
      checks=['Summarised from Mann\'s translations; Kirnberger detail from Mitchell\'s introduction to the Essay'], seeAlso=['analysis-critiques', 'roberts-method']),
    # ------------------------------------------------------------- cases
    T('case-847', 'a-cases', 'WTC I, Fugue in C minor, BWV 847 — Roberts\' demonstration', 'case',
      'A three-voice, 31-bar fugue used to demonstrate the method.',
      cases=[{'work': 'WTC I/2, C minor, BWV 847', 'verdict': 'rhetorical',
              'properties': ['Prominent descent 6̂–5̂–4̂–3̂ in the subject that never reaches 1̂ (blocked)',
                             'Episode 1 (bars 5–6): an ascent 5̂→1̂ through every half step of the combined minor-scale forms',
                             'Rhythmic cells in the subject: 4+4+3+3+2 eighth notes (motive repeated, interrupted, then mirrored)'],
              'structure': 'Entries at bars 1, 3, 7, 11, 15, 20, 26 with episodes between (Ep. 4 = inversion of Ep. 1); coda with a final subject statement',
              'resolution': 'Bars 27–29: the descent reaches 1̂ (soprano and bass), the 5̂→1̂ ascent goes straight up the melodic minor, and the cells shrink to 4+4+3+3+3+3+2+1 — all at once, then the fugue ends.'}],
      sources=[RO + ', Ch. 3 (Figs. 5–12, Table 3)'], checks=['Bar numbers and cells quoted from Roberts']),
    T('case-organ', 'a-cases', 'Four organ fugues (Roberts)', 'case',
      'Each fugue shows a different kind of notable property.',
      cases=[{'work': 'G minor BWV 578 — expansion', 'verdict': 'rhetorical',
              'properties': ['Subject = an asymmetrical period (2-bar phrase to HC + 2½-bar phrase to AC)', 'Active vs static halves', 'Descending arpeggio D–B♭–G and the opening fifth'],
              'structure': 'Digressions grow additively: 2, 3, 3½, 5, 8½ bars (each later one the sum of two earlier); period V is the only expanded integrant',
              'resolution': 'The expansion of the subject\'s period is mirrored in the growing digressions, which make the last (unchanged) entry sound climactic.'},
             {'work': 'E minor BWV 533 — palindrome', 'verdict': 'literal',
              'properties': ['Static half then active half', 'Ascents from 5̂ always blocked by 6̂', 'No linear 5̂–1̂ descent'],
              'structure': 'Spacing of the eight entries: 2, 3½, 3½, 5, 5, 3½, 3½, 2 bars — a palindrome',
              'resolution': 'Nothing is reconciled: a "stop-and-start" fugue (Roberts reads it as frustration, or as a secure enclosure).'},
             {'work': 'C major BWV 545 — unexpected change of prevailing rhythm', 'verdict': 'not stated',
              'properties': ['Slow, vocal-like subject (static) vs later running eighths', 'Ascent past 4̂ seems blocked', 'Quarter-note motion returns only at bars 18, 54, 81, 108–9'],
              'structure': 'Those four rhythmic breaks coincide with cadences and divide the fugue in proportions close to tuning ratios (Roberts, Table 9); several entries are obscured',
              'resolution': 'First case where the alternative structure (Step 4) reveals the notable property.'},
             {'work': 'C major BWV 547 — combining forces', 'verdict': 'rhetorical',
              'properties': ['One-bar, modulating subject; 49 entries', 'Entries fused into Exposition Blocks of three; the 4th exposition entry belongs to the transition', 'Raised 4̂'],
              'structure': 'EBs shrink from three entries to two (dividing the fugue 2:1) and finally one; entries augmented, then augmented and inverted, overlapping by half their length',
              'resolution': 'The reduction of the blocks, ending in a single entry reinforced by a tonal answer, resolves the "combined forces".'}],
      sources=[RO + ', Ch. 4–7'], checks=['Section lengths and verdicts quoted from Roberts; BWV 545 is not explicitly labelled rhetorical or literal in the text']),
    T('case-853', 'a-cases', 'WTC I, Fugue in D♯ minor, BWV 853 — an analysis for performance (Badura-Skoda)', 'case',
      'A structural and affective reading aimed at the performer.',
      cases=[{'work': 'WTC I/8, D♯ minor, BWV 853', 'verdict': '—',
              'properties': ['Subject: 5̂ → minor 6̂ → 5̂, the "pathopoietic" figure; kinship with Luther\'s "Aus tiefer Not"', 'Second half rises only a 4th from the tonic, like a small coda; bar lines cut across a 3 + 2 grouping of minims', 'The minor 6th is the melodic climax even though it falls on a weak, short note', 'Countersubjects (unusually free) are stepwise and cantabile: a contrast to the subject\'s gravity'],
              'structure': 'Surplus 4th entry in the exposition (bars 12–14); expected F♯ major evaded (bars 16–17), cadence in A♯ minor instead (bar 19), first stretto in A♯ minor; F♯ major arrives only at bar 30 with the first inversion; inversion in the bass at bar 44 = middle of the fugue (first climax); triple stretto of the subject (minor, bars 52–53) answered by triple stretto of the inversion (major); from bar 61 (HC) subject in augmentation thrice, combined with subject, inversion and a "one-and-a-half" augmentation (bar 77); Picardy third',
              'resolution': 'The fugue moves from the prelude\'s grief toward light: subject (minor) vs inversion (major) is almost programmatic; the ending should be firm, not a diminuendo.'}],
      guidelines=['Free "1½-times" augmentation (only some notes lengthened, bars 24–27) prepares the real augmentation — a device Bach reuses in The Art of Fugue.', 'Bach\'s inversion is not mathematically exact: harmony comes first (bar 30).'],
      sources=[BS + ', Ch. 10, pp. 220–227'], checks=['Bar numbers quoted from Badura-Skoda'],
      flags=['Badura-Skoda (with Tovey, Keller and others) thinks the fugue was first in D minor and transposed; editions printing it in E♭ minor are "perfectly reasonable".']),
    # ------------------------------------------------------------- structure
    T('key-plan', 'a-structure', 'Key plan as the structure\'s corner-stones', 'concept',
      'Modulations to related keys are the most audible landmarks of a Bach fugue.',
      rules=['Major: usually first to the dominant, then to more distant related keys (in C: G, then a, d, sometimes F); the mediant (e) is the most distant diatonic area and carries the most tension; keys outside the scale (B♭, D in C major) are rare.',
             'Minor: first to the dominant and the relative major.',
             'The last structural events are the return to the tonic and, often, dominant or tonic pedal points.'],
      guidelines=['Tension grows with distance from the tonic, "as if a rubber band were attached to the tonic" (Badura-Skoda).', 'Other tension sources: thematic development, registral highs and lows, texture, and dissonance — ninth chords were heard as shocking (WTC II E major, bar 33; Chromatic Fugue bars 94, 135, 139, 158).', 'Some fugues have a different "fundamental line": a return to the beginning (BWV 548; WTC I C♯ major) or continual intensification (WTC I D♯ minor; most fugues with several subjects) — after Dürr.'],
      sources=[BS + ', Ch. 9 pp. 204–209'], checks=['Paraphrased from Badura-Skoda']),
    T('proportion', 'a-structure', 'Proportion and spacing of entries', 'concept',
      'Count the length of each integrant and digression (in bars or beats) and look for patterns.',
      guidelines=['Successive growth (BWV 578), mirror symmetry (BWV 533), or simple ratios 1:1, 2:1, 3:2, 4:3, 5:4 between sections (BWV 533, 545, 547).', 'Use "intuitive" ratios only (easy to picture), not 43:19.'],
      sources=[RO + ', Ch. 3 Step 3; Ch. 4–7'], tools=['proportion-calculator']),
    T('gedalge-plan', 'a-structure', 'Gedalge\'s plan for an academic (school) fugue', 'table',
      'The French conservatoire model: a fixed succession of sections with typical lengths. Useful as a yardstick — Bach\'s fugues rarely follow it.',
      tables=[tbl('gedalge', 'Plan for an academic fugue (lengths in bars)', ['Section', 'Bars'],
                  [['Exposition', '16–24'], ['Episode', '2–8'], ['Counterexposition', '8–12'], ['1st modulating episode', '8–12'], ['Subject on the 6th degree', '4–6'], ['Answer on the 3rd degree', '4–6'],
                   ['2nd modulating episode', '10–16'], ['Subject on the 4th degree', '4–6'], ['Transition', '2–4'], ['Subject or answer on the 2nd degree', '4–6'], ['3rd modulating episode', '14–20'],
                   ['Pedal point on the dominant', '2–8'], ['1st stretto, subject — 4 entries', '10–18'], ['1st stretto, countersubject — 4 entries', '2–6'], ['2nd stretto, subject — 2 entries', '4–8'],
                   ['2nd stretto, countersubject — 2 entries', '2–6'], ['3rd stretto, inversion — 4 entries', '6–12'], ['Pedal point on the tonic', '4–16'], ['Total', '106–194']])],
      guidelines=['Compare a Bach fugue with this plan to see what is not "academic": Bach\'s strettos, key choices and endings are tailored to the subject (see the case studies).'],
      sources=[GE], checks=['Transcribed from the supplied one-page table'], tools=['analysis-worksheet']),
    T('pedal-point', 'a-structure', 'The organ point (pedal) in fugues', 'concept',
      'A held or repeated bass under changing harmonies. Every source places it at the same structural moments.',
      rules=['C. P. E. Bach: the organ point appears "generally in learned things, especially fugues, near the end over the dominant or over the final note"; occasionally mid-piece over the dominant or tonic of a key reached by modulation.'],
      guidelines=['Over a final dominant pedal composers bring "all manner of contrapuntal devices in stretto" (C. P. E. Bach) — the same place Marpurg prescribes for the closing stretti, and Gedalge for the dominant pedal before the final stretto.',
                  'Martini\'s four-part model ends with a stretto of subject and inverted countersubject over a three-bar bass pedal (Mann p. 280).',
                  'Historical root: Mersenne\'s point d\'orgue was the fermata on the last note of a canonic voice (Mann p. 36).',
                  'In analysis, mark where pedals begin and end; a pedal often marks the arrival of the last section.'],
      sources=[CPE + ', ch. "The Organ Point"', MA + ', pp. 36, 180, 211–212, 280', GE],
      checks=['C. P. E. Bach, Marpurg (via Mann), Martini and Gedalge agree on dominant pedal before the close and tonic pedal at the end']),
    T('performing-structure', 'a-structure', 'Hearing and showing the whole', 'concept',
      'Badura-Skoda\'s advice on turning an analysis into a performance.',
      guidelines=['(C. P. E. Bach) When accompanying a fugue whose subject is in the bass, play the bass as written without chords until figures appear; a simple octave doubling of the bass suits loud fugal entries, but lively figuration is doubled only in its principal notes.', 'Aim for a "telescopic view" of the whole (filo, the connecting thread) while still shaping small units.', 'Think in lines, not chords: every voice is a melody, as if given to a string player; mark slurs and breaths per voice.', 'Do not "chisel out" every entry — exaggerating structure is like stressing the metre of a poem. Exceptions: strettos and close imitation, where the collision of voices is the message.', 'Complementary rhythm: accents in different voices fall at different times; cadential formulas are where accents coincide — the fugue\'s corner-stones.', 'Keep strict time inside sections; broaden only at structural breaks (pauses, imperfect cadences).', 'Thematic development (collocatio) asks for more tension than the exposition (in rhetorical terms).'],
      sources=[BS + ', Ch. 9; Ch. 10 pp. 220–223', CPE + ', Part II: accompaniment §42; Ch. on the organ point']),
    # ------------------------------------------------------------- meaning
    T('affect-subject', 'a-meaning', 'Reading a subject\'s affect', 'concept',
      'Bach\'s fugues are expressive, not "abstract": subject, countersubjects and episodes all carry affect.',
      guidelines=['Find the affect first; if unsure, compare with vocal works of similar material (arias, chorales) (Badura-Skoda).', 'Interval figures: 5̂–♭6̂–5̂ (minor 6th over the 5th) = pain/despair ("pathopoietic"); descending chromatic line = lament; diminished seventh = terror/tragedy (Badura-Skoda).', 'Bach\'s own slurs are rare; where they occur in subjects they usually mark sighs (pairs of descending seconds), e.g. the six slurs in the subject of WTC I B minor (Bodky).', 'Briskness → detached notes, tenderness → slurred broad notes, "in general" (C. P. E. Bach, quoted by Bodky).'],
      sources=[BS + ', Ch. 9–10', BO + ', Ch. 7 Articulation'], checks=['Slur counts in WTC subjects from Bodky\'s survey of autograph slurs']),
    T('key-symbol', 'a-meaning', 'Key character and symbols (with caution)', 'concept',
      'Some analysts read keys and figures symbolically. Treat these as hypotheses, not facts.',
      guidelines=['Bodky compares pieces in the same key: e.g. E♭ major linked to the Trinity (three flats) and to the "fundamental" interval of the 4th; F minor to anguish; a C major tendency toward rising scales (after Abert).', 'Cross symbol: the subject of WTC I C♯ minor draws a cross and hides B-A-C-H (lines joining the middle notes and the outer notes form a cross — Hamel, quoted by Bodky).', 'Number symbolism: Badura-Skoda calls it a possible "self-imposed discipline", irrelevant to performance; the 13-note D♯ minor subject is an example of what such readings count.'],
      sources=[BO + ', Ch. 8 Symbolism (Tonality Problems; Cross Symbols)', BS + ', Ch. 9 p. 211'],
      flags=['Both authors warn against over-reading: Bodky notes Mattheson later withdrew his key descriptions and that Bach\'s keys in the WTC follow the scheme of all 24 keys; Badura-Skoda doubts cabbalistic readings of most works.'], status='verified'),
]

TOOLS = [
    {'id': 'analysis-worksheet', 'title': 'Fugue analysis worksheet', 'spec': 'A form the student fills in for any fugue: element map (entries with bar, voice, key, device), CS and episodes, then notable properties (checklist of Roberts\' six types), integrant/digression lengths, and a verdict (rhetorical/literal) with reasons. Export as JSON/Markdown. Pre-filled demo: WTC I C minor from the case study.'},
    {'id': 'proportion-calculator', 'title': 'Proportion calculator', 'spec': 'Enter section lengths (bars or beats); show them as a bar chart, flag successive growth/shrinking, palindromes, and ratios close to 1:1, 2:1, 3:2, 4:3, 5:4 (±10%). Demo data: BWV 578 digressions 2, 3, 3.5, 5, 8.5; BWV 533 spacing 2, 3.5, 3.5, 5, 5, 3.5, 3.5, 2.'},
]
