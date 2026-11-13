"""Turn the Gradus study-guide HTML (page.html) + exported examples into data/fux.json.

usage: python3 tools/extract.py <guide_dir> <examples.json> data/fux.json
Rich text is kept as a small HTML subset (<b>, <i>) in `html` fields; `text` holds the plain version.
"""
import json, re, sys
from bs4 import BeautifulSoup

guide, exjson, out = sys.argv[1:4]
soup = BeautifulSoup(open(guide + '/page.html', encoding='utf8').read(), 'html.parser')
ex = json.load(open(exjson))


def rich(el):
    """inner HTML limited to b/i, refs pulled out"""
    el = BeautifulSoup(str(el), 'html.parser')
    refs = [r.get_text(' ', strip=True) for r in el.select('.ref')]
    for r in el.select('.ref'):
        r.decompose()
    for t in el.find_all(True):
        if t.name not in ('b', 'i', 'em', 'strong'):
            t.unwrap()
    h = str(el).strip()
    h = re.sub(r'\s+', ' ', h)
    txt = re.sub(r'<[^>]+>', '', h)
    return {'html': h, 'text': txt, 'refs': refs} if refs else {'html': h, 'text': txt}


WIDGETS = {'motion': 'motion-lab', 'intervals': 'interval-explorer', 'modes': 'mode-explorer', 'susp': 'suspension-lab',
           'mono': 'monochord', 'triad': 'triad-order', 'quiz': 'fault-quiz'}
part = None
chapters = []
for el in soup.select('main > *'):
    if 'part' in (el.get('class') or []):
        part = {'id': el['id'], 'title': el.h2.get_text(strip=True), 'subtitle': el.span.get_text(strip=True) if el.span else ''}
        continue
    if el.name != 'section' or 'chapter' not in (el.get('class') or []):
        continue
    hdr = el.header
    ch = {'id': el['id'], 'part': part['id'] if part else 'front', 'title': hdr.h2.get_text(strip=True),
          'eyebrow': hdr.select_one('.eyebrow').get_text(strip=True) if hdr and hdr.select_one('.eyebrow') else ''}
    m = re.search(r'pp?\.\s*([\w–\-]+)', ch['eyebrow'])
    if m:
        ch['pages'] = m.group(1)
    lede = hdr.select_one('.lede') if hdr else None
    if lede:
        ch['lede'] = rich(lede)
    ch['ruleBoxes'] = []
    for box in el.select('.rulebox'):
        kind = 'rules' if 'hard' in box['class'] else 'guidelines'
        b = {'kind': kind, 'title': box.h4.get_text(' ', strip=True).lstrip('RG ').strip(), 'items': [rich(li) for li in box.select('li')]}
        note = box.select_one('p.mini')
        if note:
            b['note'] = rich(note)
        ch['ruleBoxes'].append(b)
    prose = el.select_one('.prose')
    if prose:
        ch['prose'] = [rich(p) for p in prose.select('p')]
    ch['quotes'] = [q.get_text(' ', strip=True) for q in el.select('p.quote')]
    ch['bookFigures'] = [{'fig': dt.get_text(strip=True), **rich(dt.find_next_sibling('dd'))} for dt in el.select('dl.figs dt')]
    asg = el.select_one('.assign')
    if asg:
        asg.b.decompose()
        ch['assignment'] = rich(asg)
    tbl = el.select_one('table')
    if tbl:
        ch['table'] = {'columns': [th.get_text(' ', strip=True) for th in tbl.select('thead th')],
                       'rows': [[td.get_text(' ', strip=True) for td in tr.select('td')] for tr in tbl.select('tbody tr')]}
    foot = el.select_one('.foot')
    if foot:
        ch['notes'] = [rich(p) for p in foot.select('p')]
    ch['blocks'] = []
    for w in el.select('[data-w]'):
        k = w['data-w']
        if k in ex['figures']:
            ch['blocks'].append({'type': 'example', 'id': k})
        elif k in ex['workbenches']:
            ch['blocks'].append({'type': 'workbench', 'id': k})
        else:
            ch['blocks'].append({'type': 'tool', 'id': WIDGETS.get(k, k)})
    for k in ('quotes', 'bookFigures', 'ruleBoxes', 'blocks'):
        if not ch[k]:
            del ch[k]
    chapters.append(ch)

parts = [{'id': p['id'], 'title': p.h2.get_text(strip=True), 'subtitle': p.span.get_text(strip=True)} for p in soup.select('main > .part')]
hero = soup.select_one('section.hero')
data = {'version': 1, 'source': 'J. J. Fux, Gradus ad Parnassum (1725), trans. A. Mann, The Study of Counterpoint (Norton 1965)',
        'intro': {'title': hero.h1.get_text(' ', strip=True), 'paragraphs': [rich(p) for p in hero.select('p')]},
        'parts': parts, 'chapters': chapters,
        'examples': ex['figures'], 'workbenches': ex['workbenches'], 'modes': ex['modes']}
json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
print('chapters', len(chapters), 'rules', sum(len(b['items']) for c in chapters for b in c.get('ruleBoxes', []) if b['kind'] == 'rules'),
      'guidelines', sum(len(b['items']) for c in chapters for b in c.get('ruleBoxes', []) if b['kind'] == 'guidelines'),
      'examples', len(ex['figures']), 'workbenches', len(ex['workbenches']))
