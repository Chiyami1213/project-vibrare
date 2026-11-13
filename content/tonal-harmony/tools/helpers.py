"""Small constructors used by the data_*.py content files (keep the JSON shape in one place)."""


def T(id, chapter, title, kind, summary, rules=(), guidelines=(), tables=(), examples=(), tools=(), seeAlso=(),
      notes='', textbook='', video=(), web=(), status='verified', checks=(), flags=(), terms=()):
    t = {'id': id, 'chapter': chapter, 'title': title, 'kind': kind, 'summary': summary}
    if terms:
        t['terms'] = [{'term': a, 'def': b} for a, b in terms]
    if rules:
        t['rules'] = list(rules)
    if guidelines:
        t['guidelines'] = list(guidelines)
    if tables:
        t['tables'] = list(tables)
    if examples:
        t['examples'] = list(examples)
    if tools:
        t['tools'] = list(tools)
    if seeAlso:
        t['seeAlso'] = list(seeAlso)
    src = {}
    if notes:
        src['notes'] = notes
    if textbook:
        src['textbook'] = textbook
    if video:
        src['video'] = list(video)
    if web:
        src['web'] = list(web)
    t['sources'] = src
    v = {'status': status, 'checks': list(checks)}
    if flags:
        v['flags'] = list(flags)
    t['verification'] = v
    return t


def tbl(id, title, columns, rows, note=None, highlight=None):
    d = {'id': id, 'title': title, 'columns': list(columns), 'rows': [list(r) for r in rows]}
    if note:
        d['note'] = note
    if highlight:
        d['highlight'] = highlight  # list of [row, col] cells the notes circle/box
    return d


def ex(id, title, key, notation, caption='', meter='4/4', intent='model', expect=(), allow=(), source='', beatUnit='quarter'):
    """intent: 'model' (correct writing) | 'error' (deliberately faulty, the checker must find `expect`)
    | 'line' (melody / scale, one voice) | 'demo' (2-voice interval or motion demo)."""
    e = {'id': id, 'title': title, 'key': key, 'meter': meter, 'beatUnit': beatUnit, 'notation': notation, 'intent': intent}
    if caption:
        e['caption'] = caption
    if expect:
        e['expect'] = list(expect)
    if allow:
        e['allow'] = list(allow)
    if source:
        e['source'] = source
    return e


def AS(unit, section=''):
    return 'Aldwell, Schachter & Cadwallader, Harmony and Voice Leading 5e, Unit %s%s' % (unit, (' — ' + section) if section else '')
