"""Turn the Mann study-guide HTML (tools/guide/page.html) into data/fugue-theory.json.
usage: python3 tools/extract_theory.py tools/guide/page.html data/fugue-theory.json   (needs beautifulsoup4)"""
import json, re, sys
from bs4 import BeautifulSoup
src, out = sys.argv[1:3]
soup = BeautifulSoup(open(src, encoding='utf8').read(), 'html.parser')

def rich(el):
    el = BeautifulSoup(str(el), 'html.parser')
    refs = [r.get_text(' ', strip=True) for r in el.select('.ref')]
    for r in el.select('.ref'): r.decompose()
    for t in el.find_all(True):
        if t.name not in ('b', 'i', 'em', 'strong'): t.unwrap()
    h = re.sub(r'\s+', ' ', str(el).strip()); txt = re.sub(r'<[^>]+>', '', h)
    d = {'html': h, 'text': txt}
    if refs: d['refs'] = refs
    return d

TOOLS = {
 'timeline': ('timeline', 'Timeline of fugal theory', '30 theorists 1330–1922 with year, name, idea and a topic tag (terms, answer, structure, stretto, several themes, texture, textbooks); filter chips by topic.'),
 'terms': ('terms-evolution', 'How the words changed', 'Searchable list of 16 terms (fuga, imitation, canon, soggetto/thema, guida/consequente, punto, repercussio, consociatio/aequatio, regolare/reale, regular fugue, strict/free, ricercar, counterfugue, stretto, double fugue, point d’orgue) with the history of each meaning.'),
 'answer': ('answer-generator', 'Answer generator (modes)', 'Input: subject (pitch/duration tokens), key or mode, tonal vs real. Output: degree table, answer with notes answered at the 4th marked, notated subject→answer, playback. Algorithm in tools/guide/main.js makeAnswer(): head notes on ①/⑤ swap (⑤ answered a 4th up), skips ⑤↔① inside the theme swap, a theme ending on ⑤ (and a raised ④ before it) is answered a 4th up so the answer ends on ①; everything else a 5th up. Modes transpose diatonically (Fux); keys transpose by exact intervals (Marpurg). Start preset: a D-mode subject.'),
 'answer2': ('answer-generator', 'Answer generator (keys)', 'Same component, started on a C-major subject that ends on the dominant (tail mutation).'),
 'stretto': ('stretto-finder', 'Stretto finder', 'Tries the subject against itself at every entry distance up to ¾ of its length and at 8ve above, 5th above, 4th below, unison, 8ve below (diatonic transposition). Counts strong-beat dissonances (two-voice: P4 counts as dissonant) and parallel 5ths/8ves; sorts by score then by shortest distance; shows the 8 best with a notated, playable result. Strong beat selectable (half or quarter).'),
 'dc': ('dc-calculator', 'Invertible counterpoint calculator', 'Two parts in; for species at the 8ve/10th/12th list intervals, inverted intervals (9−x, 11−x, 13−x), and flags: 5th (8ve species, untied), octave by skip, consecutive 3rds/6ths in direct motion (10th), 6th untied (12th), exceeding the limit. Notated original with a toggle that exchanges the parts. Presets: model at the octave, parallel thirds, 12th-friendly model.'),
 'mirror': ('inversion-mirror', 'Inversion mirror', 'Strict inversion = exact semitone mirror around an axis: Fux Dorian (white keys around D), Marpurg major around ②, minor around ④; free inversion = diatonic mirror around the first note. Notated original and inversion.'),
 'orders': ('entry-orders', 'Entry orders in four voices', 'All 24 orders as chips; regular (paired S–T / A–B so entries 1&3 = theme, 2&4 = answer) in green. Click shows a lane diagram of the exposition.'),
 'fuxplan': ('fux-plan', 'Fux’s two-part plan by mode', 'Segmented control D E F G A C; shows the six steps (exposition, 1st cadence, re-entry, 2nd cadence, close entries, final cadence) with the cadence tones for that mode and Fux’s exceptions (E: 6th; F: 7–6; A: re-entry on B).'),
 'quiz': ('quiz', 'Check yourself', '12 multiple-choice questions with explanations and page references (see main.js QZ).'),
}
EXAMPLES = {
 'exD': {'id': 'exD', 'title': 'Tonal exposition in D minor: subject D–A, answer A–D', 'source': 'model written for this guide', 'voices': [
   {'notes': [{'d': 1, 'rest': 1}, {'d': 1, 'rest': 1}, {'p': 'A4', 'd': .5}, {'p': 'D5', 'd': .5}, {'p': 'D5', 'd': .25}, {'p': 'C5', 'd': .25}, {'p': 'B4', 'd': .25, 'natural': True}, {'p': 'A4', 'd': .25}, {'p': 'A4', 'd': 1}]},
   {'notes': [{'p': 'D4', 'd': .5}, {'p': 'A4', 'd': .5}, {'p': 'G4', 'd': .25}, {'p': 'F4', 'd': .25}, {'p': 'E4', 'd': .25}, {'p': 'D4', 'd': .25}, {'p': 'F4', 'd': .5}, {'p': 'D4', 'd': .5}, {'p': 'G3', 'd': 1}, {'p': 'A3', 'd': 1}]}],
   'key': 'd', 'caption': 'The subject leaps a fifth D–A; the answer leaps a fourth A–D and repeats the D (narrowing / exchange of fifth and fourth). After the head the answer is a fifth higher, in A minor (B♮).'},
 'exReal': {'id': 'exReal', 'title': 'Real answer in C major', 'source': 'model written for this guide', 'voices': [
   {'notes': [{'d': 1, 'rest': 1}, {'p': 'G4', 'd': .25}, {'p': 'A4', 'd': .25}, {'p': 'B4', 'd': .25}, {'p': 'C5', 'd': .25}, {'p': 'B4', 'd': .25}, {'p': 'A4', 'd': .25}, {'p': 'G4', 'd': .5}]},
   {'notes': [{'p': 'C4', 'd': .25}, {'p': 'D4', 'd': .25}, {'p': 'E4', 'd': .25}, {'p': 'F4', 'd': .25}, {'p': 'E4', 'd': .5}, {'p': 'D4', 'd': .5}, {'p': 'G3', 'd': .5}, {'p': 'C4', 'd': .5}]}],
   'key': 'C', 'caption': 'The subject stays in C, so the answer is an exact transposition a fifth higher.'}
}
parts, chapters, part = [], [], None
for el in soup.select('main > *'):
    cls = el.get('class') or []
    if 'part' in cls:
        part = {'id': el['id'], 'title': el.h2.get_text(strip=True), 'subtitle': el.span.get_text(' ', strip=True)}; parts.append(part); continue
    if el.name != 'section' or 'chapter' not in cls: continue
    hdr = el.header
    ch = {'id': el['id'], 'part': part['id'] if part else 'front', 'title': hdr.h2.get_text(strip=True), 'eyebrow': hdr.select_one('.eyebrow').get_text(strip=True)}
    m = re.search(r'pp?\.\s*([\d–\-]+)', ch['eyebrow']);  ch['pages'] = m.group(1) if m else None
    if hdr.select_one('.lede'): ch['lede'] = rich(hdr.select_one('.lede'))
    ch['ruleBoxes'] = [{'kind': 'rules' if 'hard' in b['class'] else 'guidelines', 'title': b.h4.get_text(' ', strip=True).lstrip('RG ').strip(), 'items': [rich(li) for li in b.select('li')]} for b in el.select('.rulebox')]
    if el.select_one('.prose'): ch['prose'] = [rich(p) for p in el.select_one('.prose').select('p')]
    ch['quotes'] = [q.get_text(' ', strip=True) for q in el.select('p.quote')]
    ch['theorists'] = [{'who': rich(dt), **{'idea': rich(dt.find_next_sibling('dd'))}} for dt in el.select('dl.theorists dt')]
    if el.select_one('.assign'):
        a = el.select_one('.assign'); a.b.decompose(); ch['assignment'] = rich(a)
    t = el.select_one('table.cheat')
    if t: ch['table'] = {'columns': [th.get_text(' ', strip=True) for th in t.select('thead th')], 'rows': [[td.get_text(' ', strip=True) for td in tr.select('td')] for tr in t.select('tbody tr')]}
    if el.select_one('.foot'): ch['notes'] = [rich(p) for p in el.select_one('.foot').select('p')]
    ch['blocks'] = [({'type': 'example', 'id': w['data-w']} if w['data-w'] in EXAMPLES else {'type': 'tool', 'id': TOOLS[w['data-w']][0], 'preset': w['data-w']}) for w in el.select('[data-w]')]
    for k in list(ch):
        if ch[k] in ([], None): del ch[k]
    chapters.append(ch)
hero = soup.select_one('section.hero')
tools, seen = [], set()
for k, (tid, title, spec) in TOOLS.items():
    if tid in seen: continue
    seen.add(tid); tools.append({'id': tid, 'title': title, 'spec': spec, 'reference': 'tools/guide/main.js'})
data = {'version': 1, 'tab': 'theory', 'source': 'A. Mann, The Study of Fugue (Rutgers 1958; Dover 1987); page numbers = Dover edition',
        'intro': {'title': hero.h1.get_text(' ', strip=True), 'paragraphs': [rich(p) for p in hero.select('p')]},
        'parts': parts, 'chapters': chapters, 'examples': EXAMPLES, 'tools': tools}
json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
print('chapters', len(chapters), 'rules', sum(len(b['items']) for c in chapters for b in c.get('ruleBoxes', []) if b['kind'] == 'rules'),
      'guidelines', sum(len(b['items']) for c in chapters for b in c.get('ruleBoxes', []) if b['kind'] == 'guidelines'),
      'theorists', sum(len(c.get('theorists', [])) for c in chapters), 'tools', len(tools))
