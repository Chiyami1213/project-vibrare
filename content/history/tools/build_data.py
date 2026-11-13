#!/usr/bin/env python3
"""Builds data/theory-history.json from content_a.py + content_b.py. Prints counts and checks."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import content_b  # noqa: registers chapters 16-31
from content_a import CH

PARTS = [
    {'id': 'front', 'title': 'Introduction'},
    {'id': 'I', 'title': 'Part I · Disciplining music theory'},
    {'id': 'II', 'title': 'Part II · Speculative traditions'},
    {'id': 'III', 'title': 'Part III · Regulative traditions'},
    {'id': 'IV', 'title': 'Part IV · Descriptive traditions'},
]
SITE_TABS = {'fux': 'Counterpoint (Fux)', 'partimento': 'Partimento', 'harmony': 'Tonal harmony', 'fugue': 'Fugue', 'hip': 'Historically Informed Performance'}

TOOLS = [
 {'id': 'tuning-lab', 'title': 'Monochord & tuning lab', 'chapters': ['greek', 'canonics', 'tuning', 'acoustics'],
  'spec': 'Pick a system: Pythagorean (fifths E♭–G♯), just (C major, Ramis/Salinas type), ¼-comma meantone, 2/7-comma (Zarlino), ⅙-comma, Werckmeister III, equal. Show a 12-note table of cents relative to C, plus the size of every fifth and major third with its deviation from pure (colour scale; the wolf flagged). Play: scale, chosen triad, the wolf fifth. Playback detunes the harpsichord by fractional MIDI (cents/100). Second panel: Greek tetrachord genera in Aristoxenian parts (fourth = 30 parts): enharmonic 3+3+24, soft chromatic 4+4+22, hemiolic 4½+4½+21, tonic chromatic 6+6+18, soft diatonic 6+9+15, intense diatonic 6+12+12; play descending as the Greeks listed them.',
  'tests': ['¼-comma meantone: C–E = 386.3 c, every fifth 696.6 c, G♯–E♭ wolf ≈ 737.6 c', 'Pythagorean: C–E = 407.8 c; fifth G♯–E♭ ≈ 678.5 c', 'Equal: every interval a multiple of 100 c']},
 {'id': 'gamut', 'title': 'Gamut & hexachord solmizer', 'chapters': ['earlymodes', 'seventeenth'],
  'spec': 'Draw the Guidonian gamut Γ-ut to e-la (G2–E5) with all syllables per step. Input a melody of letter names (with b for b♭). Output syllables with mutations marked: stay in the current hexachord when possible; mutate at the latest common note before leaving its range; b♭ forces the soft (F) hexachord, b♮ the hard (G). Show cantus durus/mollis. Play the melody.',
  'tests': ['C D E F G A → ut re mi fa sol la (natural)', 'G A B C D E F (b♮) → mutation to natural hexachord on D or E: ut re mi fa (hard) … la in natural', 'F G A Bb → ut re mi fa (soft)']},
 {'id': 'modes', 'title': 'Mode explorer (8 and 12 modes)', 'chapters': ['earlymodes', 'renmodes', 'seventeenth'],
  'spec': 'Choose a mode (1–8, or Glarean 9–12). Show final, ambitus, reciting tone (tenor of the psalm tone), species of fifth + fourth, Greek name (Alia musica tradition) and Zarlino\'s 1571 renumbering. Draw the octave with final and tenor marked; play the scale and a short typical cadence.',
  'tests': ['Mode 1: final D, ambitus D–d, tenor A', 'Mode 2: final D, ambitus A–a, tenor F', 'Mode 3: tenor C', 'Mode 8: final G, tenor C']},
 {'id': 'organum', 'title': 'Organum & contrapunctus lab', 'chapters': ['organum', 'renpoint'],
  'spec': 'Input a chant (letters). Modes: parallel organum at the octave / fifth / composite (four voices); organum at the fourth with boundary tone (organal voice may not go below the tritus C below; holds it; converges to the unison at the end — occursus). Under every vertical interval show Garlandia\'s class (perfect / medial / imperfect concord or discord). A "contrapunctus check" flags parallel perfect consonances and imperfect→perfect moves that do not go to the nearest perfect consonance.',
  'tests': ['Organum at the fourth never goes below the boundary tone', 'Last vertical is a unison', 'P5 → P5 in parallel motion is flagged in contrapunctus mode']},
 {'id': 'mensural', 'title': 'Rhythmic modes & mensuration', 'chapters': ['notation', 'rhythm1819'],
  'spec': 'Panel 1: the six rhythmic modes (L = long, B = breve) in modern transcription (6/8), play each. Panel 2: choose tempus (perfect/imperfect) and prolation (major/minor) → the sign (circle/half-circle with/without dot), the number of minims per breve, and the modern equivalent (9/8, 3/4, 6/8, 2/4); play one breve of minims with an accent on each semibreve.',
  'tests': ['Mode 1 = L B = quarter–eighth in 6/8', 'Perfect tempus + major prolation = ⊙ = 9 minims = 9/8', 'Imperfect tempus + minor prolation = C = 4 minims = 2/4']},
 {'id': 'tonnetz', 'title': 'Tonnetz & Riemann transformations', 'chapters': ['math', 'dualism', 'tonality', 'harm19'],
  'spec': 'A triangular lattice of pitch classes (fifths horizontal, major thirds diagonal). Triangles are triads. Buttons P, L, R (and chains like LR, PL) move the current triad; show its name, the dualist reading (Oberklang from root / Unterklang from fifth) and the path. Play each triad.',
  'tests': ['C+ R → a−', 'C+ L → e−', 'C+ P → c−', 'C+ R then L → F+', 'Alternating P and L returns to C+ after 6 moves (hexatonic cycle)']},
 {'id': 'fundamental-bass', 'title': 'Rameau\'s fundamental bass', 'chapters': ['rameau', 'harm19', 'tonality'],
  'spec': 'Input chords as pitch-letter groups separated by "|" (e.g., C E G | F A C D | G B D F | C E G). For each chord find the root by stacking thirds; for F–A–C–D show both readings (IV add6 / ii7, double emploi). Draw the actual bass and the fundamental bass on two staves; label each root move as 5th/4th (cadential), 3rd, or step (flag: Rameau/Sechter would explain with a hidden root). Play actual and fundamental bass.',
  'tests': ['C–E–G → root C; E–G–C → root C (inversion)', 'G–B–D–F → root G, seventh F resolves down', 'F–A–C–D → double emploi']},
 {'id': 'row-matrix', 'title': 'Twelve-tone matrix', 'chapters': ['twelvetone', 'math'],
  'spec': 'Input a row (pitch names or 0–11). Validate 12 distinct pcs. Build the 12×12 matrix with P/I labels on the sides and R/RI on the opposite sides (P0 = first row form). Report hexachordal combinatoriality (which I_n has a first hexachord equal to the complement of P0\'s first hexachord; also P- and R-combinatoriality). Click a row/column to play it.',
  'tests': ['Chromatic scale is all-combinatorial (P6 and I with hexachord complement)', 'Berg Violin Concerto row (G B♭ D F♯ A C E G♯ B C♯ E♭ F) validates']},
 {'id': 'ursatz', 'title': 'Ursatz viewer', 'chapters': ['schenker', 'rhythm20'],
  'spec': 'Choose 3-, 5- or 8-line, major/minor, and interruption on/off. Show the Ursatz in two voices: Urlinie (open noteheads with ^ degree numbers and a beam) over Bassbrechung I–V–I. Play it; then optionally play a simple middleground (e.g., ③–②–① with a neighbour or an initial ascent).',
  'tests': ['3-line in C: E–D–C over C–G–C', '5-line: G–F–E–D–C, with V under ②', 'Interruption: E–D ‖ E–D–C']},
]

def year_key(y):
    s = str(y)
    neg = 'BCE' in s
    m = re.search(r'(\d{3,4})', s)
    if m:
        v = int(m.group(1))
        return -v if neg else v
    m = re.search(r'(\d+)(st|nd|rd|th) c', s)
    if m:
        c = int(m.group(1)); base = (c - 1) * 100 + 50
        if 'late' in s: base += 30
        if 'early' in s: base -= 30
        return -base if neg else base
    return None

def main():
    chs = sorted(CH, key=lambda c: c['num'])
    tool_ids = {t['id'] for t in TOOLS}
    errs = []
    theorists = {}
    timeline = []
    gloss = {}
    quiz = []
    for c in chs:
        c['terms'] = [{'term': a, 'def': b} for a, b in c['terms']]
        for t in c['tools']:
            if t not in tool_ids: errs.append(f"{c['id']}: unknown tool {t}")
        for l in c['links']:
            if l not in SITE_TABS: errs.append(f"{c['id']}: unknown link {l}")
        for qi, q in enumerate(c['quiz']):
            if not (0 <= q['answer'] < len(q['options'])): errs.append(f"{c['id']}: bad answer")
            quiz.append(dict(q, chapter=c['id'], id=f"{c['id']}-{qi+1}"))
        for t in c['theorists']:
            for w in t['works']:
                k = year_key(w['year'])
                if k is None: errs.append(f"no year key: {w}")
                timeline.append({'sort': k, 'year': w['year'], 'who': t['name'] if t['name'] != 'Anonymous' else 'anon.', 'title': w['title'], 'chapter': c['id']})
            if t['name'] == 'Anonymous': continue
            e = theorists.setdefault(t['name'], {'name': t['name'], 'dates': t['dates'], 'works': [], 'ideas': [], 'chapters': []})
            if t['dates'] and not e['dates']: e['dates'] = t['dates']
            for w in t['works']:
                if w['title'] not in [x['title'] for x in e['works']]: e['works'].append(w)
            if t['idea'] not in e['ideas']: e['ideas'].append(t['idea'])
            if c['id'] not in e['chapters']: e['chapters'].append(c['id'])
        for tm in c['terms']:
            g = gloss.setdefault(tm['term'], {'term': tm['term'], 'def': tm['def'], 'chapters': []})
            g['chapters'].append(c['id'])
    # de-dup timeline (same title+who)
    seen = set(); tl = []
    for e in sorted(timeline, key=lambda e: (e['sort'], e['title'])):
        key = (e['who'], e['title'])
        if key in seen: continue
        seen.add(key); tl.append(e)
    th = sorted(theorists.values(), key=lambda e: e['name'].split()[-1].lower() if not e['name'].startswith('C. P. E.') else 'bach')
    data = {'version': 1, 'tab': 'theory-history',
            'source': {'title': 'The Cambridge History of Western Music Theory', 'editor': 'Thomas Christensen', 'publisher': 'Cambridge University Press', 'year': '2002 (3rd printing 2006)', 'pages': 'Page references are to the printed book.'},
            'scope': 'A history of Western music theory (not of music in general): ideas about pitch, tuning, modes, counterpoint, rhythm, tonality, form, analysis and perception, from Greek antiquity to the late 20th century.',
            'legend': {'R': 'Rule: a precept stated by a historical theorist (named with each item).', 'G': 'Guideline: advice, a widely repeated convention, or the chapter author\'s interpretation.'},
            'parts': PARTS, 'siteTabs': SITE_TABS, 'chapters': chs, 'theorists': th, 'timeline': tl,
            'glossary': sorted(gloss.values(), key=lambda g: g['term'].lower()), 'quiz': quiz, 'tools': TOOLS}
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'theory-history.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
    nr = sum(len(c['rules']) for c in chs); ng = sum(len(c['guidelines']) for c in chs)
    print(f"chapters {len(chs)} theorists {len(th)} timeline {len(tl)} terms {len(gloss)} quiz {len(quiz)} rules {nr} guidelines {ng} tools {len(TOOLS)}")
    for e in errs: print('CHECK:', e)
    return 1 if errs else 0

if __name__ == '__main__':
    sys.exit(main())
