import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from realize import realize, check, to_json, sounding
import data_schemata as S, data_cadences as Cd

def walk_examples(p):
    for e in p.get('examples', []) or []:
        yield e
    for v in p.get('variants', []) or []:
        for e in v.get('examples', []) or []:
            yield e

report = []
def process(patterns, tab):
    n = 0
    for p in patterns:
        p['tab'] = tab
        for e in walk_examples(p):
            n += 1
            try:
                r = realize(e['notation'], e['key'], cross=e.get('cross', False))
            except Exception as ex_:
                report.append((p['id'], e['id'], 'SYNTAX', str(ex_)))
                continue
            iss = check(r)
            # doubled leading tone check (only on full-bar onsets of dominant-function bass ⑤/⑦)
            lt = {'C': 11, 'G': 6, 'F': 4, 'a': 8, 'd': 1, 'e': 3}[e['key']]
            vs = r['voices']
            for t in sorted({round(x['t'], 6) for v in vs for x in v}):
                pcs = [ (sounding(v, t) or {}).get('p') for v in vs ]
                cnt = sum(1 for p_ in pcs if p_ is not None and p_.midi % 12 == lt)
                if cnt >= 2:
                    iss.append(('doubledLT', t, None, 'leading tone doubled'))
            if e.get('beatUnit') is None:
                e['beatUnit'] = 'quarter' if e.get('meter') == '3/4' else 'half'
            e['parts'] = r['nup'] + 1
            e['realized'] = {'voices': to_json(r), 'lengthBeats': r['length'], 'voiceOrder': 'top→bottom; last = bass'}
            if iss:
                e['checker'] = [{'type': i[0], 'severity': 'info' if i[0] == 'doubledLT' else 'error', 'beat': i[1], 'voices': i[2], 'detail': i[3]} for i in iss]
                for i in iss:
                    report.append((p['id'], e['id'], i[0], f'beat {i[1]} voices {i[2]}: {i[3]}'))
    return n

out = sys.argv[1] if len(sys.argv) > 1 else '../data'
os.makedirs(out, exist_ok=True)
n1 = process(S.PATTERNS, 'schemata'); n2 = process(Cd.PATTERNS, 'cadences')
json.dump({'version': 1, 'tab': 'schemata', 'groups': S.GROUPS, 'patterns': S.PATTERNS}, open(f'{out}/schemata.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'version': 1, 'tab': 'cadences', 'groups': Cd.GROUPS, 'patterns': Cd.PATTERNS}, open(f'{out}/cadences.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('examples', n1, n2, 'patterns', len(S.PATTERNS), len(Cd.PATTERNS))
for r in report: print(*r, sep=' | ')
