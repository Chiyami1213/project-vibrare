from helpers import T, tbl, ex, AS

PART = {'id': 'p5', 'num': 'V', 'title': 'Predominant Chords', 'notesPages': '34–36'}

CHAPTERS = [
    {'id': 'ch14', 'part': 'p5', 'num': 14, 'title': 'Supertonic Seventh Chord: ii7 (iiø7)', 'notesPages': '34', 'video': [30], 'textbook': AS(13, 'Supertonic Seventh Chords')},
    {'id': 'ch15', 'part': 'p5', 'num': 15, 'title': 'Uncommon Diatonic Seventh Chords & the Circle-of-Fifths Sequence', 'notesPages': '35–36', 'video': [33, 34], 'textbook': AS(13, 'Subdominant Seventh Chords') + '; ' + AS(18) + '; ' + AS(25, 'Seventh Chords in Sequence')},
]

TOPICS = [
    # ------------------------------------------------------------------ CH14
    T('seventh-frequency', 'ch14', 'How common are the diatonic seventh chords?', 'concept',
      'V7 (Mm7) is the most frequent seventh chord, ii7 (m7) or iiø7 (dm7) the next most frequent, and viiø7 (vii°7) less frequent.',
      notes='p.34', textbook=AS(13), checks=['Consistent with the order of treatment in A&S (Units 7, 13, 23)']),
    T('ii7-inversions', 'ch14', 'ii7 and its inversions', 'table',
      'The supertonic seventh is a predominant chord leading to V. ii6/5 is the most common position; it sounds like IV with an added 6th.',
      rules=['Resolve the chordal 7th down: 1̂ → 7̂.', 'An incomplete ii7 must keep the root and the 7th: omit the 5th of a m7 (or M7) chord, the 3rd of a ø7 (or °7) chord.',
             'Never double the chordal 7th or the leading tone; double the root.'],
      guidelines=['Approach the chordal 7th as a suspension (common tone) or passing tone — far more common than neighbour or appoggiatura approaches.', 'The 7th may be held over a cadential 6/4 and resolve when V arrives.'],
      tables=[tbl('ii7-table', 'ii7 and inversions (notes p.34)', ['Position', 'Symbol', 'Bass', 'Intervals above bass', 'Progressions', '≈', 'Note'],
                  [['Root', 'ii7', '2̂', 'm3, P5, m7', '→ I6/4 – V, → V, or → vii°6', '', ''],
                   ['1st inv.', 'ii6/5', '4̂', 'M3, P5, M6', '→ V or V4/2', 'IV add6', 'most common'],
                   ['2nd inv.', 'ii4/3', '6̂', 'm3, P4, m6', '→ V7', '', ''],
                   ['3rd inv.', 'ii4/2', '1̂ → 7̂', 'M2, P4, M6', '→ V6/5', '', '']])],
      examples=[ex('ii7-cad', 'ii7 – I6/4 – V – I', 'F', 'ii7:F4,D4,Bb3,G2 I6/4:F4,C4,A3,C3 V:E4,C4,G3,C3 I:F4,C4,A3,F3@2', caption='the 7th F is held over the cadential 6/4 and resolves to E on V', source='notes p.34'),
                ex('ii7-vii6', 'ii7 – vii°6 – I6', 'F', 'ii7:F4,D4,Bb3,G2 vii°6:E4,Bb3,G3,G2 I6:F4,C4,F3,A2@2', caption='bass 2̂–2̂: vii°6 keeps the bass and doubles it', source='notes p.34'),
                ex('ii65-v', 'ii6/5 – V – I', 'F', 'ii6/5:G4,F4,D4,Bb2 V:G4,E4,C4,C3 I:F4,F4,C4,F3@2', source='notes p.34'),
                ex('ii65-v42', 'ii6/5 – V4/2 – I6', 'F', 'ii6/5:G4,F4,D4,Bb2 V4/2:G4,E4,C4,Bb2 I6:F4,F4,C4,A2@2', caption='bass 4̂–4̂: the bass becomes the 7th of V4/2', source='notes p.34'),
                ex('ii43-v7', 'ii4/3 – V7 – I', 'F', 'ii4/3:G4,F4,Bb3,D3 V7:G4,E4,Bb3,C3 I:F4,C4,A3,F3@2', caption='bass 6̂–5̂', source='notes p.34'),
                ex('ii42-v65', 'ii4/2 – V6/5 – I', 'F', 'ii4/2:G4,D4,Bb3,F3 V6/5:G4,C4,Bb3,E3 I:F4,C4,A3,F3@2', caption='bass 1̂–7̂–1̂', source='notes p.34')],
      tools=['inversion-table', 'satb-checker'], notes='p.34', textbook=AS(13, 'Points for Review 1–7'), video=[30],
      checks=['A&S Unit 13 PfR 1: ii6/5 is the most important position; all positions usually complete except root-position ii7 in major', 'PfR 2: 7th prepared as common tone or passing tone ("prepare and resolve in the same voice")', 'PfR 6: cadential 6/4 delays the resolution of the 7th', 'PfR 7: ii4/2 leads to V6 or V6/5']),
    T('ivadd6', 'ch14', 'Plagal substitution: ii6/5 as IV add6', 'concept',
      'ii does not go to I in the harmonic-progression chart, but ii6/5 can work as IV with an added 6th, which can go to I like a plagal cadence.',
      examples=[ex('ivadd6-i', 'IV add6 → I', 'F', 'IVadd6:G4,F4,D4,Bb2 I:A4,F4,C4,F3@2', caption='heard as IV + 6th: the F is simply held into I and the added 6th G moves up to A', source='notes p.34')],
      notes='p.34', textbook=AS(25, 'Apparent Seventh Chords'), status='verified',
      checks=['A&S Unit 25 PfR 8a: a 5/3 plus an added 6th becomes an "apparent" 6/5 — same idea']),

    # ------------------------------------------------------------------ CH15
    T('uncommon-sevenths', 'ch15', 'Uncommon diatonic seventh chords', 'table',
      'Seventh chords on 4̂, 6̂, 1̂ and 3̂ appear mostly inside circle-of-fifths sequences. Each resolves to the chord a 5th below (or to its substitute).',
      tables=[tbl('uncommon7', 'Uncommon diatonic sevenths (notes p.35)', ['Degree', 'Major', 'Minor', 'Resolves to', 'Note'],
                  [['4̂ (subdominant)', 'IVΔ7 (MM7)', 'iv7 (mm7); IV7 (Mm7) in melodic minor', 'V or vii°', 'inversions uncommon EXCEPT IV6/5 with ♮6̂ in the bass (minor): passing predominant, ♮6̂–♮7̂–1̂'],
                   ['6̂ (submediant)', 'vi7 (mm7)', 'VIΔ7 (MM7); ♯viø7 (dm7) in melodic minor', 'major: IV or ii; minor: iv or ii°', '♯viø7 has ♮6̂ in the bass and passes up to vii°'],
                   ['1̂ (tonic)', 'IΔ7 (MM7)', 'i7 (mm7) or iΔ7 (mM7, jazz)', 'IΔ7 → IVΔ7; i7/iΔ7 → ii4/2', 'not a stable harmonic goal'],
                   ['3̂ (mediant)', 'iii7 (mm7)', 'IIIΔ7 (MM7)', 'iii7 → vi or IV; IIIΔ7 → VI or iv', 'iii7 and vi7 are rarely inverted']])],
      examples=[ex('iv65-minor', 'IV6/5 – V6 – i (melodic minor)', 'e', 'IV6/5:G4,E4,A3,C#3 V6:F#4,B3,F#3,D#3 i:E4,B3,G3,E3@2', caption='bass C♯–D♯–E: the ascending melodic-minor scale', source='notes p.35'),
                ex('vi-half-dim', 'V – ♯viø7 – vii° – i', 'e', 'V:F#4,D#4,B3,B2 #viø7:G4,E4,B3,C#3 vii°:F#4,F#4,A3,D#3 i:G4,E4,G3,E3@2', allow=['viiRoot'], caption='bass 5̂–♮6̂–♮7̂–1̂; the notes use root-position vii° here. The tenor A resolves down to G (rising to B would make unequal 5ths with the bass)', source='notes p.35'),
                ex('imaj7', 'IΔ7 – IVΔ7 – V', 'C', 'IΔ7:G4,E4,B3,C3 IVΔ7:A4,E4,A3,F3 V:G4,D4,B3,G3@2', caption='each 7th steps down into the next chord', source='notes p.35 (voiced by the builder)')],
      tools=['diatonic-table'], notes='p.35', textbook=AS(13, 'Subdominant Seventh Chords') + '; ' + AS(16), video=[33, 34],
      checks=['IV7 with 3̂ and parallel-5ths caution: A&S Unit 13 PfR 8–9', 'IV6/5 – V6/5 – I with ascending bass: A&S Unit 13 PfR 9'],
      flags=['The notes use a root-position vii° in the ♯viø7 example; the checklist (p.20) asks for vii° in first inversion only. A&S (Unit 16 PfR 10) also avoids raised vii°5/3 in minor. Please check which you want to teach.']),
    T('fifths-sequence', 'ch15', 'Circle-of-fifths sequence with seventh chords', 'progression',
      'Seventh chords on every degree can follow each other by descending 5ths for smooth voice leading: each 7th resolves down into the 3rd of the next chord.',
      rules=['Root-position seventh chords in a fifths sequence MUST alternate complete and incomplete chords.'],
      guidelines=['In minor the chord on 7̂ is the subtonic VII7 from natural minor; the raised leading tone appears only in V7.', 'Bass pattern: down a 5th, up a 4th (a tritone appears once in the diatonic circle: ↓P5 = ↑A4 between VI and ii° in minor).', 'Inverted versions: 6/5 → 4/2 and 4/3 → root position also give smooth sequences.'],
      tables=[tbl('fifths-seq', 'Sequence in G minor (notes p.36)', ['Chord', 'i', 'iv7', 'VII7', 'IIIΔ7', 'VIΔ7', 'iiø7', 'V7', 'i'],
                  [['Bass', 'G', 'C', 'F', 'B♭', 'E♭', 'A', 'D', 'G'], ['Complete?', '', 'C', 'I', 'C', 'I', 'C', 'I', 'C']])],
      examples=[ex('seq-g', 'i – iv7 – VII7 – IIIΔ7 – VIΔ7 – iiø7 – V7 – i', 'g', 'i:Bb4,G4,D4,G2 iv7:Bb4,G4,Eb4,C3 VII7:A4,F4,Eb4,F3 IIIΔ7:A4,F4,D4,Bb2 VIΔ7:G4,Eb4,D4,Eb3 iiø7:G4,Eb4,C4,A2 V7:F#4,D4,C4,D3 i:G4,D4,Bb3,G2@2', caption='complete and incomplete chords alternate; the 7th of each chord is prepared by the previous chord', source='notes p.36 (re-voiced)')],
      tools=['fifths-substitution', 'satb-checker'], notes='p.36', textbook=AS(25, 'Points for Review 1–2') + '; ' + AS(18, 'Sequences with Descending 5ths'), video=[34],
      checks=['A&S Unit 25 PfR 2a (7–7 chain) and Unit 28 PfR 7: in four voices such sequences alternate complete and incomplete chords', 'Diminished 5th between VI and ii° in minor: A&S Unit 17 PfR 1']),
]
