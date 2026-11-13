"""Print OUTLINE.md (topic tree) and the list of flags for VERIFICATION.md from the data files.

usage: python3 tools/report.py outline > OUTLINE.md
       python3 tools/report.py flags
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import data_p1, data_p2, data_p3, data_p5, data_p6, index_data

MODS = [data_p1, data_p2, data_p3, data_p5, data_p6]
lessons = {l['num']: l for l in index_data.LESSONS}


def _json_topics():
    import json, glob
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    return {t['id']: t for f in glob.glob(os.path.join(base, 'part-*.json')) for t in json.load(open(f))['topics']}


def outline():
    J = _json_topics()
    print('# Tonal Harmony — content outline\n')
    print('Generated from `tools/data_*.py` by `tools/report.py`. Order and numbering follow the handwritten notes.\n')
    for m in MODS:
        P = m.PART
        print('## Part %s — %s (notes pp.%s)\n' % (P['num'], P['title'], P['notesPages']))
        for c in m.CHAPTERS:
            vids = ', '.join('L%d' % v for v in c['video'])
            print('### Ch. %d %s  \n*notes pp.%s · videos %s*\n' % (c['num'], c['title'], c['notesPages'], vids or '—'))
            for t0 in m.TOPICS:
                t = J.get(t0['id'], t0)
                if t['chapter'] != c['id']:
                    continue
                ne = len(t.get('examples', []))
                nr, ng = len(t.get('rules', [])), len(t.get('guidelines', []))
                badge = '' if t['verification']['status'] == 'verified' else ' `%s`' % t['verification']['status']
                fl = ' ⚑%d' % len(t['verification'].get('flags', [])) if t['verification'].get('flags') else ''
                print('- **%s** (`%s`) — %d rules, %d guidelines, %d examples%s%s' % (t['title'], t['id'], nr, ng, ne, badge, fl))
            print()


def flags():
    import json, glob
    n = 0
    base = os.path.join(os.path.dirname(__file__), '..', 'data')
    for f in sorted(glob.glob(os.path.join(base, 'part-*.json'))):
        for t in json.load(open(f))['topics']:
            for f in t['verification'].get('flags', []):
                n += 1
                print('%d. **%s** (`%s`, notes %s): %s' % (n, t['title'], t['id'], t['sources'].get('notes', '—'), f))


if __name__ == '__main__':
    {'outline': outline, 'flags': flags}[sys.argv[1] if len(sys.argv) > 1 else 'outline']()
