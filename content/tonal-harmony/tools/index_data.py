"""Site-wide data: video lessons, interactive tools, checker levels, voice ranges."""

YT = 'https://www.youtube.com/watch?v='
PLAYLIST = 'https://www.youtube.com/playlist?list=PLw9t0oA3fHkxx1PgYpiXrMUPXaOiwh6KU'

# Lesson titles were confirmed one by one with web searches (YouTube titles). None = not confirmed.
_L = [
    (1, 'Circle of 5ths, Scales', 'ICDPWP6HUbk', ['ch1']),
    (2, 'Minor scales, Intervals', 'QV5bD6nBQQc', ['ch1', 'ch2']),
    (3, 'Intervals, Consonance vs. Dissonance', 'TlnLPUQpMho', ['ch2']),
    (4, 'Writing Intervals, Scale Review', 'B5673V7RaUw', ['ch2', 'ch1']),
    (5, 'Note Values, Triplets, Meter', 'wPHWBfSc0vw', ['ch0', 'ch3']),
    (6, 'Time Signatures, Beaming', 'A-4T6-R07yw', ['ch3']),
    (7, 'Triads, 7th Chords, Lead-sheet Symbols', 'uTsXb0ntsOg', ['ch4']),
    (8, 'Inversions, Figured Bass', 'ZfXEP__nrAE', ['ch4']),
    (9, 'Realizing Figured Bass with Lead Sheet Symbols', 'YNA2693P1bg', ['ch4']),
    (10, 'Diatonic Chords and Roman Numeral Analysis', 'oz_jLQ9hypw', ['ch4']),
    (11, 'Voice Leading 101', '3njDTtnIt4U', ['ch5']),
    (12, 'Voice Leading 102', 'anxHT-a9FHU', ['ch5']),
    (13, 'Part Writing/Voice Leading', 'IIiKQqU4Kvc', ['ch6']),
    (14, 'Part Writing & Transposition', 'o1LBxW077N0', ['ch6']),
    (15, 'Harmonic Progression', 'Uv0sp-zxax0', ['ch4']),
    (16, 'Part Writing Checklist & Triads in First Inversion', 'qpgRMG5Oz1A', ['ch6', 'ch7']),
    (17, 'Part Writing w/ 1st Inversion Triads', '5KtSefoO9Xg', ['ch7']),
    (18, '1st Inversion Triad Examples & Intro to 2nd Inversion Triads', 'TUrHVLu7kPk', ['ch7']),
    (19, None, None, []),
    (20, 'Step by step examples', 'WRUu8H8OqeA', ['ch7']),
    (21, 'Melody Harmonization', 'urHCiAy3Wwc', ['ch4']),
    (22, 'Cadences', 'jXetg6_LE6A', ['ch8']),
    (23, 'Periods', '1YnDA1bZ1a4', ['ch8']),
    (24, None, None, []),
    (25, 'Examples of Non-Chord Tones', 'EmhLrWJ5Qis', ['ch9']),
    (26, 'Non-Chord Tone Analysis', 'hi6piiWq90k', ['ch9']),
    (27, 'Using NCTs to Make Music Interesting', 'H6LVI8REf4o', ['ch9']),
    (28, 'The V7 Chord in Root Position', 'jAWuEomArJ8', ['ch10']),
    (29, 'The Inverted V7 Chord', 'tXVxkGRhECw', ['ch11']),
    (30, 'Dominant 7th & Supertonic 7th Chord', 'YdNfQuQ9bLo', ['ch11', 'ch14']),
    (31, 'Leading-Tone 7th in Major', None, ['ch13']),
    (32, 'Leading-Tone 7th Chord in Minor', 'AsPSO_q95Gk', ['ch13']),
    (33, 'Uncommon Diatonic 7th Chords', 'LpVBC2RgxdA', ['ch15']),
    (34, 'Diatonic 7th Chord Examples', 'sHipRHp89rs', ['ch15']),
    (35, 'Secondary Dominants', 'Fg3JU6mQdzM', ['ch16']),
    (36, 'Secondary Dominant Examples', 'tHcwkzZ2Qms', ['ch16']),
    (37, 'Secondary Leading-Tone Chords', 'skDgBOrvC5U', ['ch17']),
    (38, 'Advanced Secondary Functions', 'Q0v2t20cMNc', ['ch18']),
    (39, 'Even More Advanced Secondary Functions', 'pxNB_pg3TTU', ['ch18']),
    (40, 'Modulation 101', 'BaC6oqcV60A', ['ch19']),
    (41, 'Modulation 201', '8DeITpT7S_M', ['ch19']),
    (42, 'How to Harmonize with a Modulation', 'WMovx_pJaOs', ['ch19']),
    (43, 'Form', 'uVGWnwHpsRQ', ['ch8']),
    (44, 'Mode Mixture', 'FoqILFusV9o', ['ch20']),
    (45, 'Neapolitan Chord', '4hdHxqX8bkY', ['ch21']),
    (46, 'Augmented Sixth "Chords"', 'e-mWICem4Sc', ['ch22']),
    (47, 'Augmented Sixth "Chords" & Part Writing', 'aKsln-UJkjU', ['ch22']),
]
LESSONS = []
for n, title, vid, chs in _L:
    d = {'num': n, 'title': ('Dr. B Music Theory Lesson %d (%s)' % (n, title)) if title else None, 'url': (YT + vid) if vid else None, 'chapters': chs}
    if title is None:
        d['note'] = 'title not confirmed; open the playlist'
    elif vid is None:
        d['note'] = 'title from a study-set listing; video URL not confirmed'
    LESSONS.append(d)

RANGES = {'note': 'notes p.15 (extended range in brackets); same as A&S Unit 6',
          'S': {'low': 'C4', 'high': 'G5', 'extLow': 'B3', 'extHigh': 'A5'},
          'A': {'low': 'G3', 'high': 'C5', 'extHigh': 'D5'},
          'T': {'low': 'C3', 'high': 'G4', 'extHigh': 'A4'},
          'B': {'low': 'E2', 'high': 'C4', 'extLow': 'D2', 'extHigh': 'D4'},
          'spacing': {'S-A': 'P8', 'A-T': 'P8', 'T-B': 'P12'}}

# checker types → notes p.20 colour levels (white = least problematic … red = most)
CHECKS = [
    {'type': 'range', 'level': 'white', 'label': 'Voice out of range'},
    {'type': 'leap', 'level': 'white', 'label': 'Melodic leap larger than M6 in S, A or T (octave allowed)'},
    {'type': 'doubling', 'level': 'blue', 'label': 'Doubling: root of 5/3 (except vi/VI after V), bass of 6/4; chordal 7th doubled'},
    {'type': 'contrary', 'level': 'blue', 'label': 'Consecutive P5/P8 by contrary motion'},
    {'type': 'hidden', 'level': 'blue', 'label': 'Hidden (direct) P5/P8 in the outer voices with a soprano leap (level assigned by the builder; not on the checklist)'},
    {'type': 'augLeap', 'level': 'green', 'label': 'Augmented melodic interval'},
    {'type': 'overlap', 'level': 'green', 'label': 'Overlapping voices'},
    {'type': 'crossing', 'level': 'green', 'label': 'Voice crossing'},
    {'type': 'viiRoot', 'level': 'yellow', 'label': 'vii° in root position (use vii°6)'},
    {'type': 'sixFour', 'level': 'yellow', 'label': '6/4 bass approached or left by leap (cadential 6/4 may be approached by leap)'},
    {'type': 'doubledLT', 'level': 'orange', 'label': 'Doubled leading tone'},
    {'type': 'spacing', 'level': 'orange', 'label': 'Spacing: S–A or A–T wider than P8, T–B wider than P12'},
    {'type': 'seventh', 'level': 'orange', 'label': 'Chordal 7th not resolved down by step'},
    {'type': 'seventhLeap', 'level': 'orange', 'label': 'Chordal 7th approached by descending leap (notes p.29; level assigned by the builder)'},
    {'type': 'leadingTone', 'level': 'orange', 'label': 'Leading tone in soprano or bass not resolved up to the tonic (a chromatic half step down, e.g. B → B♭ to become the 7th of V7/IV, is accepted — notes p.38)'},
    {'type': 'unequal5', 'level': 'orange', 'label': 'Unequal fifths d5 → P5 against the bass (level assigned by the builder)'},
    {'type': 'aug6', 'level': 'orange', 'label': 'Augmented 6th does not expand to an octave (♭6̂ down, ♯4̂ up) — notes p.49; level assigned by the builder'},
    {'type': 'parallel', 'level': 'red', 'label': 'Parallel P1/P5/P8'},
    {'type': 'bigLeap', 'level': 'red', 'label': 'Melodic leap larger than an octave'},
    {'type': 'tie', 'level': 'red', 'label': 'Notation error: tie between different pitches'},
]

TOOLS = [
    {'id': 'clef-reader', 'title': 'Clef reader', 'chapters': ['ch0'], 'spec': 'Show a random note on a random clef from the clef table; the learner names it. Toggle clefs on/off. Middle C marker.'},
    {'id': 'tuning-lab', 'title': 'Tuning lab', 'chapters': ['ch0'], 'spec': 'Play a C major triad and a scale in just, Pythagorean, quarter-comma meantone, a well temperament (e.g. Werckmeister III) and equal temperament; show each note\'s deviation in cents from equal temperament. Use a sine or harpsichord tone with detune.'},
    {'id': 'keyboard-steps', 'title': 'Half/whole step keyboard', 'chapters': ['ch1'], 'spec': 'Piano keyboard; click two keys to see half/whole step, diatonic vs chromatic spelling (same vs different letter).'},
    {'id': 'scale-builder', 'title': 'Scale builder', 'chapters': ['ch1'], 'spec': 'Pick tonic + scale (major, natural/harmonic/melodic minor, chromatic, major/minor pentatonic, 7 modes). Draw on staff with W/H/1½ labels under each step, scale-degree numbers and solfège (fixed/movable toggle). Melodic minor plays up and down.'},
    {'id': 'mode-wheel', 'title': 'Mode wheel', 'chapters': ['ch1'], 'spec': 'Rotate a major scale to each mode; highlight the characteristic note vs Ionian/Aeolian; order modes bright→dark (Lydian…Locrian) as in the notes p.6 chart.'},
    {'id': 'circle-of-fifths', 'title': 'Circle of fifths', 'chapters': ['ch1', 'ch19'], 'spec': 'Interactive circle with majors outside, relative minors inside, signatures. Click a key: show its signature on a staff; highlight closely related keys (±1 accidental) for the modulation chapter.'},
    {'id': 'interval-lab', 'title': 'Interval lab', 'chapters': ['ch2'], 'spec': 'Two notes on a staff: name the interval (size + quality), show half steps, inversion (sum 9) and compound/simple form; quiz mode both directions (identify / construct). Play harmonic and melodic.'},
    {'id': 'overtone-player', 'title': 'Overtone series', 'chapters': ['ch2'], 'spec': 'Fundamental selectable; show partials 1–16 on a staff with ratio and approximate interval; play cumulatively; highlight 4:5:6 major triad.'},
    {'id': 'consonance-ladder', 'title': 'Consonance ladder', 'chapters': ['ch2'], 'spec': 'Stability ranking as a ladder; play each interval; demo the P4 in two contexts (above the bass → resolves to 3; between upper voices over a 5th → stable).'},
    {'id': 'meter-lab', 'title': 'Meter & rhythm lab', 'chapters': ['ch3'], 'spec': 'Choose a time signature; show beat/division/multiple levels as a grid with strong/weak accents; metronome; toggle triplet/duplet, syncopation types and a hemiola demo (two 3/4 bars felt as 3/2).'},
    {'id': 'chord-builder', 'title': 'Chord builder', 'chapters': ['ch4'], 'spec': 'Pick root, quality (4 triads, 7 sevenths) and inversion; show staff, lead-sheet symbol, figured-bass figures, Roman numeral in a chosen key.'},
    {'id': 'diatonic-table', 'title': 'Diatonic chord table', 'chapters': ['ch4', 'ch20'], 'spec': 'Grid of diatonic triads/sevenths for major and the three minor forms (data: diatonic-chords tables); rare chords dimmed; click to hear. Mode-mixture view overlays borrowed chords.'},
    {'id': 'progression-chart', 'title': 'Harmonic progression chart', 'chapters': ['ch0', 'ch4', 'ch16', 'ch17'], 'spec': 'Clickable flow chart (major/minor) from notes p.14. Build a progression by clicking; arrows that go backward turn red. Later chapters insert secondary chords before their targets.'},
    {'id': 'harmonization-helper', 'title': 'Melody harmonizer (5 steps)', 'chapters': ['ch4'], 'spec': 'Enter a short soprano; step through the 5-step procedure: list candidate chords under each note, pick a path through the chart, then hand off to the SATB checker.'},
    {'id': 'figured-bass-explainer', 'title': 'Figured bass explainer', 'chapters': ['ch4'], 'spec': 'Bass + figures in, chord spelled out; explain accidental-alone (3rd) and slashed figures; show abbreviations.'},
    {'id': 'satb-checker', 'title': 'SATB part-writing checker', 'chapters': ['ch5', 'ch6', 'ch7', 'ch10', 'ch11', 'ch13', 'ch14', 'ch16'], 'spec': 'Four-voice editor (click on grand staff or type notation). Runs the same checks as tools/satb.py (port to TS) and colours each problem by the notes p.20 checklist level (white→red). Load any example from the data as a starting point.'},
    {'id': 'voicing-explorer', 'title': 'Voicing & spacing explorer', 'chapters': ['ch5'], 'spec': 'Drag S/A/T/B of one chord; live display of ranges, spacing limits, open/closed/keyboard position, doubling counts.'},
    {'id': 'motion-classifier', 'title': 'Motion classifier', 'chapters': ['ch5'], 'spec': 'Two voices, two chords: animate parallel/similar/oblique/contrary; flag parallel, contrary and hidden 5ths/8ves and unequal 5ths with the hidden-interval "fill-in" view.'},
    {'id': 'error-gallery', 'title': 'Error gallery', 'chapters': ['ch5', 'ch6'], 'spec': 'Cards for each checker type, using the intent:"error" examples; play, show the fault highlighted, then the corrected version when one exists.'},
    {'id': 'cadence-player', 'title': 'Cadence player & quiz', 'chapters': ['ch8'], 'spec': 'Play each cadence example; conclusiveness slider (HC/IAC weak → PAC strong); quiz: identify PAC/IAC/HC/PHC/DC/PC/evaded.'},
    {'id': 'form-diagrams', 'title': 'Period & form diagrams', 'chapters': ['ch8'], 'spec': 'Render the period and form tables as timelines (phrase boxes, cadence labels, key plan). Optional audio from the cadence examples.'},
    {'id': 'nct-identifier', 'title': 'Non-chord-tone identifier', 'chapters': ['ch9'], 'spec': 'Click a highlighted note; answer preparation (step/leap/common tone) and resolution; tool names the NCT using the notes p.27 table logic.'},
    {'id': 'v7-resolution-lab', 'title': 'V7 → I resolution lab', 'chapters': ['ch10', 'ch11'], 'spec': 'Toggle complete/incomplete V7 and I; show which combinations work (one chord incomplete) and which create parallel/hidden fifths/octaves; inversions table with bass motions.'},
    {'id': 'inversion-table', 'title': 'Seventh-chord inversion tables', 'chapters': ['ch11', 'ch13', 'ch14'], 'spec': 'Render the V7, viiø7, vii°7 and ii7 tables; each row plays its example progression and highlights the 7th (green) and leading tone (red) as the notes colour them.'},
    {'id': 'secondary-calculator', 'title': 'Secondary function calculator', 'chapters': ['ch16', 'ch17', 'ch18'], 'spec': 'Choose key + target chord: spell V, V7, vii°, vii°7, viiø7 of it with the 3-step procedures; reverse mode analyses a chromatic chord with the 4-step / 3-step analysis procedures.'},
    {'id': 'fifths-substitution', 'title': 'Circle-of-fifths substitution matrix', 'chapters': ['ch18'], 'spec': 'C: iii7–vi7–ii7–V7–I with a 3 × 3 matrix (diatonic / secondary dominant / secondary LT) per slot = 27 progressions; play any path.'},
    {'id': 'pivot-finder', 'title': 'Pivot-chord finder', 'chapters': ['ch19'], 'spec': 'Pick two keys: list the diatonic triads of each (minor uses harmonic minor as in the notes), highlight common chords with both Roman numerals.'},
    {'id': 'mixture-palette', 'title': 'Mode-mixture palette', 'chapters': ['ch20'], 'spec': 'Major key chords plus borrowed chords from the parallel minor; mark which borrowed degree (♭3, ♭6, ♭7) each uses and how common it is.'},
    {'id': 'chromatic-builder', 'title': 'Neapolitan & augmented-sixth builder', 'chapters': ['ch21', 'ch22'], 'spec': 'Step-by-step spelling (notes p.48 five steps) for It/Fr/Ger; play the resolution to V or I6/4 with the A6 → P8 expansion animated; N6 with ♭2̂ → 7̂ (d3).'},
    {'id': 'tendency-tones', 'title': 'Tendency-tone map', 'chapters': ['ch22'], 'spec': 'Keyboard/staff overlay: arrows for 7̂→1̂, ♭6̂→5̂, chordal 7th ↓, tritone resolution; toggle per chord.'},
]
