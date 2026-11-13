#!/usr/bin/env python3
"""Validate data/history.json after hand edits. Usage: python3 tools/validate.py  (exit 1 on errors)."""
import json, os, sys
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'history.json')))
err = []
def uniq(k):
    ids = [x['id'] for x in D[k]]; d = {i for i in ids if ids.count(i) > 1}
    if d: err.append(f'duplicate {k} ids: {sorted(d)}')
    return set(ids)
A, P, W, T, E, TH, S = (uniq(k) for k in ['articles', 'people', 'works', 'terms', 'eras', 'threads', 'sources'])
EV = uniq('events'); Q = uniq('quiz')
for a in D['articles']:
    if a['thread'] not in TH: err.append(f"{a['id']}: unknown thread {a['thread']}")
    if a['span']['from'] > a['span']['to']: err.append(f"{a['id']}: span reversed")
    for x in a['eras']:
        if x not in E: err.append(f"{a['id']}: unknown era {x}")
    for k, pool in [('people', P), ('works', W), ('terms', T)]:
        for x in a[k]:
            if x not in pool: err.append(f"{a['id']}: unknown {k[:-1]} {x}")
    for s in a['seeAlso']:
        if s['tab'] not in D['tabs']: err.append(f"{a['id']}: unknown tab {s['tab']}")
    for r in a['sourceRefs']:
        if r['source'] not in S: err.append(f"{a['id']}: unknown source {r['source']}")
for w in D['works']:
    if w['author'] and w['author'] not in P: err.append(f"work {w['id']}: unknown author {w['author']}")
    if not isinstance(w['sort'], int): err.append(f"work {w['id']}: sort must be an integer year (negative = BCE)")
for ev in D['events']:
    for k in ['id', 'year', 'sort', 'title']:
        if k not in ev: err.append(f"event missing {k}: {ev}")
for q in D['quiz']:
    if q['article'] not in A: err.append(f"quiz {q['id']}: unknown article")
    if not 0 <= q['answer'] < len(q['options']): err.append(f"quiz {q['id']}: answer out of range")
print(f"{len(D['articles'])} articles, {len(D['people'])} people, {len(D['works'])} works, {len(D['events'])} events, {len(D['terms'])} terms, {len(D['quiz'])} quiz")
for e in err: print('ERROR:', e)
sys.exit(1 if err else 0)
