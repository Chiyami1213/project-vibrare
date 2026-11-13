"""Build data/*.json for the fugue pages (no dependencies).  usage: python3 tools/build.py [outdir]"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import data_analysis as A
try:
    import data_theory as TH
except ImportError:
    TH = None
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(out, exist_ok=True)
problems = []

def check(mod, tab):
    ids = set()
    gids = {g['id'] for g in mod.GROUPS}
    tids = {t['id'] for t in mod.TOOLS}
    for t in mod.TOPICS:
        if t['id'] in ids: problems.append(('dup', t['id']))
        ids.add(t['id'])
        if t['group'] not in gids: problems.append(('group', t['id']))
        for x in t.get('tools', []):
            if x not in tids: problems.append(('tool', t['id'], x))
    return ids

all_ids = check(A, 'analysis')
files = [('fugue-analysis.json', 'analysis', A)]
if TH:
    all_ids |= check(TH, 'theory'); files.insert(0, ('fugue-theory.json', 'theory', TH))
for fn, tab, m in files:
    for t in m.TOPICS:
        for s in t.get('seeAlso', []):
            if s not in all_ids: problems.append(('seeAlso', t['id'], s))
    d = {'version': 1, 'tab': tab, 'groups': m.GROUPS, 'topics': m.TOPICS, 'tools': m.TOOLS}
    if hasattr(m, 'EXAMPLES'): d['examples'] = m.EXAMPLES
    if hasattr(m, 'SOURCE'): d['source'] = m.SOURCE
    json.dump(d, open(os.path.join(out, fn), 'w'), ensure_ascii=False, indent=1)
    print(fn, 'topics', len(m.TOPICS))
for p in problems: print('PROBLEM', *p)
sys.exit(1 if problems else 0)
