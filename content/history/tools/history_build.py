#!/usr/bin/env python3
"""Splits the Cambridge-History content into
   (1) data/history.json  – the History page (narrative, people, works, eras, threads, timeline, glossary, quiz), extensible;
   (2) background overlays for the other packs (technical rules, tools and quizzes that overlap them).
Run: python3 tools/history_build.py  → writes ../data/history.json and ../overlays/<pack>.json, prints checks."""
import json, os, re, sys, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import content_b  # noqa
from content_a import CH
from build_data import TOOLS as ALLTOOLS, year_key

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]

SOURCE = {'id': 'cht', 'short': 'Cambridge History', 'title': 'The Cambridge History of Western Music Theory', 'editor': 'Thomas Christensen',
          'publisher': 'Cambridge University Press', 'year': 2002, 'note': 'Page references are to the printed book (3rd printing 2006).'}
ERAS = [('antiquity', 'Antiquity', -600, 500), ('early-ma', 'Early Middle Ages', 500, 1100), ('late-ma', 'Late Middle Ages', 1100, 1430),
        ('renaissance', 'Renaissance', 1430, 1600), ('baroque', 'Baroque', 1600, 1750), ('classical', 'Classical era', 1750, 1820),
        ('c19', 'Nineteenth century', 1820, 1900), ('c20', 'Twentieth century', 1900, 2000)]
THREADS = [('foundations', 'What music theory is', 'How theory was defined, mapped, taught and justified.'),
           ('number', 'Number, cosmos and science', 'Music as mathematics and natural philosophy, from Pythagoras to set theory.'),
           ('tuning', 'Tuning and acoustics', 'Monochords, temperaments, the harmonic series and the psychology of tone.'),
           ('pitch', 'Pitch systems: modes to keys', 'Notes, scales, the church modes, hexachords and the emergence of major and minor.'),
           ('counterpoint', 'Counterpoint and composition', 'From organum to species counterpoint and twelve-tone method.'),
           ('performance', 'Performance', 'Improvisation, thoroughbass, ornament and the performance treatise.'),
           ('time', 'Rhythm, meter and notation', 'Rhythmic modes and mensural notation; theories of meter and phrase.'),
           ('harmony', 'Harmony and tonality', 'Rameau, Roman numerals, function, dualism, Schenker and the idea of tonality.'),
           ('analysis', 'Analysis and form', 'Rhetoric, Formenlehre and thematic analysis.'),
           ('perception', 'Perception and energy', 'Energetics and the psychology of music.')]
# chapter id → thread, span
ART = {
 'intro': ('foundations', -500, 2000), 'mapping': ('foundations', 300, 1900), 'practica': ('foundations', 800, 1990), 'epistemology': ('foundations', 1600, 2000),
 'greek': ('number', -550, 400), 'transmission': ('number', -100, 1050), 'scirev': ('number', 1550, 1750), 'math': ('number', -500, 2000),
 'canonics': ('tuning', 1000, 1500), 'tuning': ('tuning', 1300, 1900), 'acoustics': ('tuning', 1580, 1930),
 'earlymodes': ('pitch', 800, 1100), 'renmodes': ('pitch', 1470, 1600), 'seventeenth': ('pitch', 1600, 1720),
 'organum': ('counterpoint', 850, 1420), 'renpoint': ('counterpoint', 1430, 1620), 'gradus': ('counterpoint', 1558, 1930), 'twelvetone': ('counterpoint', 1920, 1990),
 'performance': ('performance', 1550, 1800),
 'notation': ('time', 1200, 1500), 'rhythm1819': ('time', 1680, 1910), 'rhythm20': ('time', 1910, 2000),
 'dualism': ('harmony', 1850, 1920), 'tonality': ('harmony', 1810, 1960), 'rameau': ('harmony', 1600, 1800), 'harm19': ('harmony', 1776, 1911), 'schenker': ('harmony', 1900, 1990),
 'rhetoric': ('analysis', 1537, 1800), 'form': ('analysis', 1790, 2000), 'thematic': ('analysis', 1900, 1990),
 'energetics': ('perception', 1850, 1960), 'psychology': ('perception', 1850, 2000)}
SHORT = {'intro': 'Introduction', 'mapping': 'Mapping the terrain', 'practica': 'Theory as pedagogy', 'epistemology': 'Epistemologies', 'greek': 'Greek theory', 'transmission': 'Transmission to the MA',
 'scirev': 'Scientific revolution', 'math': 'Theory & mathematics', 'canonics': 'Medieval canonics', 'tuning': 'Tuning & temperament', 'acoustics': 'Acoustics → Tonpsychologie', 'earlymodes': 'Early medieval modes',
 'renmodes': 'Renaissance modes', 'seventeenth': '17th-c. tonal space', 'organum': 'Organum → contrapunctus', 'renpoint': 'Renaissance counterpoint', 'gradus': 'Gradus ad Parnassum', 'twelvetone': 'Twelve-tone theory',
 'performance': 'Performance theory', 'notation': 'Rhythmic notation', 'rhythm1819': 'Rhythm 1700–1900', 'rhythm20': '20th-c. rhythm', 'dualism': 'Dualism', 'tonality': 'Tonality', 'rameau': 'Rameau',
 'harm19': '19th-c. harmony', 'schenker': 'Schenker', 'rhetoric': 'Rhetoric', 'form': 'Form', 'thematic': 'Thematic analysis', 'energetics': 'Energetics', 'psychology': 'Psychology'}
# history-only wording where the chapter's technical detail moved to another tab
POINTS = {'organum': ['<b>Organum</b> (c. 850–1030): the <i>Musica</i> and <i>Scolica enchiriadis</i> describe singing a second voice to chant in parallel or at the fourth, with a converging cadence (occursus).',
  'Guido\'s <i>Micrologus</i> (c. 1026–28) describes diaphony with oblique motion. Around 1100, treatises such as <i>Ad organum faciendum</i> and the Montpellier treatise show contrary motion and note-against-note writing.',
  '<b>Discantus</b> (13th c.) belongs to the new measured music of Paris (musica mensurabilis), preserved in the great Notre Dame codices. Johannes de Garlandia (c. 1250) ranked the concords and discords.',
  '<b>Contrapunctus</b> (14th c.): short manuals such as "Quilibet affectans", and later Prosdocimo (1412), turned two-voice writing into a teachable system of consonances and progressions.',
  'Fuller\'s theme is the change from adding a voice to a chant to a combinatorial system that composers could learn. That system leads directly into Renaissance counterpoint.']}
TABS = {'fux': 'Counterpoint (Fux)', 'tonal': 'Tonal harmony', 'partimento': 'Partimento', 'fugue': 'Fugue', 'hip': 'Historically Informed Performance'}

# ---- what moves where -------------------------------------------------------
# Each overlay topic: id, pack, title, attachTo (an id in that pack + a note), sources = [(chapter, what)], tools, quiz ids
MOVES = [
 dict(id='bg-modes', pack='fux', title='The church modes, hexachords and the road to major/minor', attachTo={'ref': 'prelim', 'note': 'Fux writes in the modes (fux.json → modes). Show this as background beside the mode list.'},
      take=[('earlymodes', 'all'), ('renmodes', 'all'), ('seventeenth', [0])], tools=['modes', 'gamut'], quiz=['earlymodes-1', 'seventeenth-1']),
 dict(id='bg-organum', pack='fux', title='Before species: organum, discant and contrapunctus', attachTo={'ref': 'p1c1', 'note': 'Background to note-against-note counterpoint.'},
      take=[('organum', 'all')], tools=['organum'], quiz=['organum-1', 'organum-2', 'organum-3']),
 dict(id='bg-renaissance', pack='fux', title='Renaissance counterpoint teaching', attachTo={'ref': 'intro', 'note': 'What Fux inherited.'},
      take=[('renpoint', 'all')], tools=[], quiz=['renpoint-1']),
 dict(id='bg-gradus', pack='fux', title='The Gradus in history: precursors and successors', attachTo={'ref': 'prelim', 'note': 'The four rules of motion predate Fux (Zarlino 1558).'},
      take=[('gradus', 'all')], tools=[], quiz=['gradus-1', 'gradus-2']),
 dict(id='bg-tuning', pack='tonal', title='Tuning, temperament and consonance in history', attachTo={'ref': 'ch0', 'note': 'Extends the tools tuning-lab, overtone-player and consonance-ladder.'},
      take=[('greek', 'all'), ('canonics', 'all'), ('tuning', 'all'), ('acoustics', 'all')], tools=['tuning-lab'], quiz=['greek-1', 'canonics-1', 'tuning-1', 'tuning-2', 'acoustics-1']),
 dict(id='bg-keys', pack='tonal', title='From modes to keys', attachTo={'ref': 'ch1', 'note': 'Background to keys, scales and modes.'},
      take=[('seventeenth', [1])], tools=[], quiz=[]),
 dict(id='bg-rameau', pack='tonal', title='Rameau: roots, inversion and the fundamental bass', attachTo={'ref': 'ch7', 'note': 'Background to chords and their inversions (ch4, ch7).'},
      take=[('rameau', 'all')], tools=['fundamental-bass'], quiz=['rameau-1', 'rameau-2']),
 dict(id='bg-functions', pack='tonal', title='Roman numerals, functions and dualism', attachTo={'ref': 'ch4', 'note': 'Where Roman numerals (Weber) and function labels (Riemann) come from.'},
      take=[('harm19', 'all'), ('dualism', 'all')], tools=['tonnetz'], quiz=['harm19-2', 'dualism-1', 'dualism-2']),
 dict(id='bg-schenker', pack='tonal', title='Schenker: levels and the Ursatz', attachTo={'ref': 'ch5', 'note': 'Background to voice leading.'},
      take=[('schenker', 'all')], tools=['ursatz'], quiz=['schenker-1', 'schenker-2']),
 dict(id='bg-thoroughbass', pack='partimento', title='Thoroughbass and partimento in the history of theory', attachTo={'ref': 'rule-of-octave', 'note': 'Context for the schemata and the rule of the octave.'},
      take=[('performance', 'terms'), ('practica', 'terms')], tools=[], quiz=['performance-1'],
      points=['Thoroughbass appears in print with Viadana (1602). Agazzari (1607) divides continuo instruments into those of foundation and those of ornament.',
              'Partimento and "preluding" join bass-based improvisation to composition, above all in Naples.',
              'Heinichen (1728) turns thoroughbass into a complete composition course, teaching styles through the figured bass.',
              'Before Rameau, harmony was taught as patterns over the bass: Campion\'s rule (1618) and the rule of the octave.',
              'Around 1800 three national traditions blend: French fundamental bass, Italian species counterpoint and partimento, and German thoroughbass.']),
 dict(id='bg-fugue', pack='fugue', title='Imitation, double counterpoint and fugue in the history of theory', attachTo={'ref': 'theory-tab', 'note': 'Context for the Theory tab (Mann); show on the tab intro.'},
      take=[('renpoint', 'terms:double')], tools=[], quiz=[],
      points=['16th-century teachers moved from note-against-note formulas to motives and imitation (contrapunto fugato); Lusitano (1553) taught improvised canon.',
              'Double counterpoint at the octave, tenth and twelfth was codified by Zarlino (1558) and Chiodino (1610).',
              'Fux\'s Gradus (1725) continues past the species to imitation, fugue and double counterpoint, all in the modes. Martini (1774–75) and Albrechtsberger (1790) carried the tradition on.',
              'Halm (1913) contrasted fugue and sonata as "two cultures"; Kurth (1917) heard Bach\'s lines as kinetic energy.']),
 dict(id='bg-performance', pack='hip', title='Performance, meter and rhetoric in the history of theory', attachTo={'ref': 'foundations', 'note': 'Background to the Foundations and Rhythm groups.'},
      take=[('rhythm1819', 'all'), ('rhetoric', 'all')], tools=[], quiz=[],
      points=['Improvised counterpoint and divisions were already described in the 16th century (Lusitano 1553, Vicentino 1555, Zarlino 1558; Ortiz 1553).',
              'Mersenne (1636–37) recorded what Parisian performers actually did.',
              'The 18th-century treatises of Couperin, Quantz, C. P. E. Bach and L. Mozart made performance itself a subject of theory.']),
]
# quiz items that move with technique (everything else stays on the History page)
MOVED_Q = {q for m in MOVES for q in m['quiz']}
MOVED_TOOLS = {t for m in MOVES for t in m['tools']}
MOVED_RULES = {c for m in MOVES for c, w in m['take'] if w == 'all' or isinstance(w, list)}  # chapters whose rules/guidelines left the History page
SEEALSO = {}
for m in MOVES:
    for c, w in m['take']:
        SEEALSO.setdefault(c, [])
        if not any(x['topic'] == m['id'] for x in SEEALSO[c]): SEEALSO[c].append({'tab': m['pack'], 'topic': m['id'], 'label': m['title']})
EXTRA_LINKS = {'performance': [('partimento', 'bg-thoroughbass'), ('hip', 'bg-performance')], 'practica': [('partimento', 'bg-thoroughbass')], 'energetics': [('fugue', 'bg-fugue')], 'gradus': [('fugue', 'bg-fugue')]}
TITLE = {m['id']: m['title'] for m in MOVES}
for c, lst in EXTRA_LINKS.items():
    for tab, t in lst:
        SEEALSO.setdefault(c, [])
        if not any(x['topic'] == t for x in SEEALSO[c]): SEEALSO[c].append({'tab': tab, 'topic': t, 'label': TITLE[t]})
EXTENDS = {('tonal', 'tuning-lab'): 'tuning-lab', ('fux', 'modes'): 'mode-explorer'}  # existing tools in those packs
REFJS = {'tuning-lab': 'tuningLab', 'gamut': 'gamutTool', 'modes': 'modeTool', 'organum': 'organumTool', 'tonnetz': 'tonnetzTool', 'fundamental-bass': 'fbTool', 'ursatz': 'ursatzTool', 'mensural': 'mensuralTool', 'row-matrix': 'rowTool'}

def era_ids(a, b):
    return [e[0] for e in ERAS if e[2] < b and e[3] > a]

def main():
    chs = sorted(CH, key=lambda c: c['num']); byid = {c['id']: c for c in chs}
    errs = []
    people, works, terms, articles, quiz = {}, {}, {}, [], []
    for c in chs:
        th, a, b = ART[c['id']]
        pids, wids = [], []
        for t in c['theorists']:
            if t['name'] == 'Anonymous':
                pid = None
            else:
                pid = slug(t['name']); p = people.setdefault(pid, {'id': pid, 'name': t['name'], 'dates': t['dates'], 'ideas': [], 'articles': []})
                if t['idea'] not in p['ideas']: p['ideas'].append(t['idea'])
                if c['id'] not in p['articles']: p['articles'].append(c['id'])
                pids.append(pid)
            for w in t['works']:
                wid = slug(w['title'] + '-' + w['year'])
                ww = works.setdefault(wid, {'id': wid, 'title': w['title'], 'year': w['year'], 'sort': year_key(w['year']), 'author': pid, 'articles': []})
                if c['id'] not in ww['articles']: ww['articles'].append(c['id'])
                wids.append(wid)
        tids = []
        for tm in c['terms']:
            tid = slug(tm[0]); g = terms.setdefault(tid, {'id': tid, 'term': tm[0], 'def': tm[1], 'articles': [], 'taughtIn': []}); g['articles'].append(c['id']); tids.append(tid)
        keep_rules = c['id'] not in MOVED_RULES
        art = {'id': c['id'], 'title': c['title'], 'thread': th, 'span': {'from': a, 'to': b}, 'eras': era_ids(a, b),
               'short': SHORT[c['id']], 'summary': c['summary'], 'points': POINTS.get(c['id'], c['points']),
               'rules': c['rules'] if keep_rules else [], 'guidelines': c['guidelines'] if keep_rules else [],
               'people': list(dict.fromkeys(pids)), 'works': list(dict.fromkeys(wids)), 'terms': tids,
               'tools': [t for t in c['tools'] if t not in MOVED_TOOLS],
               'seeAlso': SEEALSO.get(c['id'], []),
               'sourceRefs': [{'source': 'cht', 'chapter': c['num'], 'author': c['author'], 'pages': c['pages'], 'part': c['part'], 'section': c['section']}],
               'status': 'survey'}
        articles.append(art)
        for qi, q in enumerate(c['quiz']):
            qid = f"{c['id']}-{qi+1}"
            if qid not in MOVED_Q: quiz.append(dict(q, id=qid, article=c['id']))
    # glossary: where the term is taught now
    overlays = {}
    for m in MOVES:
        o = overlays.setdefault(m['pack'], {'version': 1, 'pack': m['pack'], 'from': {'source': 'cht', 'title': SOURCE['title'], 'editor': SOURCE['editor'], 'year': SOURCE['year']}, 'historyTab': 'history', 'topics': [], 'tools': []})
        rules, guides, tms, pts, refs = [], [], [], list(m.get('points', [])), []
        for cid, what in m['take']:
            c = byid[cid]; refs.append({'source': 'cht', 'chapter': c['num'], 'pages': c['pages'], 'author': c['author'], 'historyArticle': cid})
            if what == 'all': rules += c['rules']; guides += c['guidelines']; tms += c['terms']
            elif what == 'terms': tms += c['terms']
            elif what == 'terms:double': tms += [t for t in c['terms'] if 'double' in t[0]]
            elif isinstance(what, list): rules += [c['rules'][i] for i in what]
        for tm in tms:
            g = terms[slug(tm[0])]
            if {'tab': m['pack'], 'topic': m['id']} not in g['taughtIn']: g['taughtIn'].append({'tab': m['pack'], 'topic': m['id']})
        qz = []
        for qid in m['quiz']:
            cid, n = qid.rsplit('-', 1); qz.append(dict(byid[cid]['quiz'][int(n) - 1], id=qid))
        o['topics'].append({'id': m['id'], 'title': m['title'], 'attachTo': m['attachTo'], 'historyArticles': [r['historyArticle'] for r in refs],
                            'points': pts, 'rules': rules, 'guidelines': guides, 'terms': [{'term': a, 'def': b} for a, b in dict(tms).items()],
                            'tools': m['tools'], 'quiz': qz, 'sourceRefs': refs})
        for tid in m['tools']:
            t = next(x for x in ALLTOOLS if x['id'] == tid)
            o['tools'].append({'id': tid, 'title': t['title'], 'spec': t['spec'], 'tests': t['tests'], 'extends': EXTENDS.get((m['pack'], tid)),
                               'reference': f"tools/history-tools.js → {REFJS[tid]}()"})
    hist_tools = [dict(next(x for x in ALLTOOLS if x['id'] == t), reference=f"tools/guide/main.js → {REFJS[t]}()") for t in ['mensural', 'row-matrix']]
    tl = sorted(works.values(), key=lambda w: (w['sort'], w['title']))
    data = {'version': 2, 'tab': 'history',
            'scope': 'The History page. It starts from one source, a history of Western music theory, and is built to grow: add eras, threads, articles, people, works and events from further sources without changing the structure.',
            'sources': [SOURCE], 'eras': [{'id': a, 'title': b, 'from': c, 'to': d} for a, b, c, d in ERAS],
            'threads': [{'id': a, 'title': b, 'blurb': c} for a, b, c in THREADS], 'tabs': TABS,
            'articles': sorted(articles, key=lambda x: ([t[0] for t in THREADS].index(x['thread']), x['span']['from'])),
            'people': sorted(people.values(), key=lambda p: p['name'].split()[-1].lower()), 'works': tl, 'events': [],
            'terms': sorted(terms.values(), key=lambda g: g['term'].lower()), 'quiz': quiz, 'tools': hist_tools}
    # checks
    ids = {k: {x['id'] for x in data[k]} for k in ['articles', 'people', 'works', 'terms']}
    eras = {e['id'] for e in data['eras']}; thr = {t['id'] for t in data['threads']}
    for a in data['articles']:
        if a['thread'] not in thr: errs.append('thread ' + a['id'])
        if not a['eras']: errs.append('no era ' + a['id'])
        for p in a['people']:
            if p not in ids['people']: errs.append('person ' + p)
        for s in a['seeAlso']:
            if s['tab'] not in TABS: errs.append('tab ' + s['tab'])
    for q in quiz:
        if not (0 <= q['answer'] < len(q['options'])): errs.append('quiz ' + q['id'])
    out = os.path.join(HERE, '..', 'data', 'history.json'); json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(HERE, '..', 'overlays'), exist_ok=True)
    for k, o in overlays.items(): json.dump(o, open(os.path.join(HERE, '..', 'overlays', k + '.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"history: articles {len(articles)} people {len(people)} works {len(works)} terms {len(terms)} quiz {len(quiz)} tools {len(hist_tools)} rules kept {sum(len(a['rules']) for a in articles)}")
    for k, o in overlays.items(): print(f"overlay {k}: topics {len(o['topics'])} rules {sum(len(t['rules']) for t in o['topics'])} guidelines {sum(len(t['guidelines']) for t in o['topics'])} quiz {sum(len(t['quiz']) for t in o['topics'])} tools {[t['id'] for t in o['tools']]}")
    for e in errs: print('CHECK:', e)
    return 1 if errs else 0
if __name__ == '__main__': sys.exit(main())
