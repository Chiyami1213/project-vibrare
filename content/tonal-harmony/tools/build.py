"""Build data/*.json from the Python content files and check every example.

usage: python3 tools/build.py [outdir]     (default: ../data relative to this file)
Exit code 1 if any example has an unexpected problem or misses an expected one.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from satb import realize, check, to_json
import data_p1, data_p2, data_p3, data_p5, data_p6, index_data, burstein

MODULES = [data_p1, data_p2, data_p3, data_p5, data_p6]
problems, infos, count = [], [], 0


def process(topic):
    global count
    for e in topic.get('examples', []):
        count += 1
        try:
            r = realize(e['notation'])
        except Exception as x:
            problems.append((topic['id'], e['id'], 'SYNTAX', str(x)))
            continue
        iss = check(r, allow=e.get('allow', ())) if e['intent'] in ('model', 'error') else check(r, allow=('range', 'spacing', 'doubling', 'crossing', 'overlap', 'leap', 'augLeap', 'sixFour'))
        js = to_json(r, e['key'])
        e['parts'] = r['nv']
        e['realized'] = {'voiceOrder': 'top→bottom; last = bass', 'lengthBeats': r['length'], **js}
        if iss:
            e['checker'] = iss
        found = {i['type'] for i in iss}
        exp = set(e.get('expect', ()))
        if e['intent'] == 'error':
            miss = exp - found
            if miss:
                problems.append((topic['id'], e['id'], 'MISSING-EXPECTED', sorted(miss)))
            extra = [i for i in iss if i['type'] not in exp]
            for i in extra:
                problems.append((topic['id'], e['id'], 'UNEXPECTED-' + i['type'], i['detail']))
        else:
            for i in iss:
                if e['intent'] in ('line', 'demo') and i['type'] not in ('parallel', 'contrary', 'tie', 'bigLeap'):
                    continue
                problems.append((topic['id'], e['id'], i['type'], 'beat %s %s: %s' % (i['beat'], i['voices'], i['detail'])))


out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(out, exist_ok=True)

def apply_burstein(t):
    x = burstein.X.get(t['id'])
    if not x:
        problems.append((t['id'], '-', 'NO-BURSTEIN-ENTRY', ''))
        return
    t['sources']['textbook2'] = x['ref']
    v = t['verification']
    v['checks'] = v['checks'] + x.get('checks', [])
    for key, note in x.get('resolve', {}).items():
        hit = [f for f in v.get('flags', []) if key in f]
        if not hit:
            problems.append((t['id'], '-', 'RESOLVE-NOT-FOUND', key))
        for f in hit:
            v['flags'].remove(f)
            v['checks'].append('Resolved: ' + note)
    if x.get('flags'):
        v['flags'] = v.get('flags', []) + x['flags']
    if 'flags' in v and not v['flags']:
        del v['flags']
    if x.get('add_guidelines'):
        t['guidelines'] = t.get('guidelines', []) + x['add_guidelines']
    if x.get('set_status'):
        v['status'] = x['set_status']


ids = set()
for m in MODULES:
    for t in m.TOPICS:
        apply_burstein(t)
for m in MODULES:
    for t in m.TOPICS:
        assert t['id'] not in ids, t['id']
        ids.add(t['id'])
        t['part'] = m.PART['id']
        process(t)
    fn = os.path.join(out, 'part-%s.json' % m.PART['id'])
    json.dump({'version': 1, 'part': m.PART, 'chapters': m.CHAPTERS, 'topics': m.TOPICS}, open(fn, 'w'), ensure_ascii=False, indent=1)
# cross-reference check
for m in MODULES:
    for t in m.TOPICS:
        for s in t.get('seeAlso', []):
            if s not in ids:
                problems.append((t['id'], '-', 'SEEALSO', s))
        for tool in t.get('tools', []):
            if tool not in {x['id'] for x in index_data.TOOLS}:
                problems.append((t['id'], '-', 'TOOL', tool))
idx = {'version': 1, 'parts': [m.PART for m in MODULES], 'chapters': [c for m in MODULES for c in m.CHAPTERS],
       'lessons': index_data.LESSONS, 'tools': index_data.TOOLS, 'checks': index_data.CHECKS, 'ranges': index_data.RANGES}
json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print('topics', len(ids), 'examples', count)
for p in problems:
    print('PROBLEM', *p, sep=' | ')
for i in infos:
    print('info', *i, sep=' | ')
sys.exit(1 if problems else 0)
