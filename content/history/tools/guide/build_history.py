import json, html, os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))
fux = open('/home/claude/fux/page.html').read().split('\n')
head = '<meta charset="utf-8">\n' + '\n'.join(fux[:219]).replace('<title>Gradus Counterpoint Guide</title>', '<title>Music History</title>')
mshell = open('/home/claude/mann/shell.txt').read()
extra_css = mshell[:mshell.find('</style>')]  # mann additions (tools-row, mini-tbl, tl …)
extra_css += '''
.tbl-scroll{overflow-x:auto;max-width:100%}
.btn.tiny{padding:2px 6px;font-size:11px}
.mini-tbl td.pure{color:var(--verd);font-weight:600}
.chapter .rulebox{align-content:start}
.subtool{border-top:1px dashed var(--rule);padding-top:12px;margin-top:6px;display:grid;gap:8px}
.cols3{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 16px}
.kv{display:grid;gap:0}
.rm{display:grid;gap:6px}.rm-row{display:grid;grid-template-columns:70px 120px minmax(0,1fr) auto;gap:8px;align-items:center}
@media (max-width:560px){.rm-row{grid-template-columns:60px minmax(0,1fr) auto}.rm-row .mini{display:none}}
.rm-svg{width:100%;height:30px}.rm-l{fill:var(--accent)}.rm-b{fill:var(--ochre)}
.mz-res{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.msign circle,.msign path{stroke:var(--ink)}.msign circle[r="3"]{fill:var(--ink);stroke:none}
.tonnetz{width:100%;max-width:560px;height:auto}.tri{fill:transparent;stroke:var(--rule)}.tri.maj.on{fill:var(--accent-bg);stroke:var(--accent)}.tri.min.on{fill:var(--ochre-bg);stroke:var(--ochre)}
.tn{fill:var(--sheet);stroke:var(--ink-2)}.tn.on{fill:var(--ink);stroke:var(--ink)}.tnl{font:600 11px var(--f-ui);text-anchor:middle;fill:var(--ink)}.tn.on+.tnl{fill:var(--sheet)}
.chip{display:inline-block;font:600 11px var(--f-ui);padding:1px 7px;border-radius:10px;background:var(--accent-bg);color:var(--accent);text-decoration:none;margin:0 2px;white-space:nowrap}
.chip.site{background:var(--verd-bg);color:var(--verd)}
.who{display:block;font:12px var(--f-ui);color:var(--ink-2);margin-top:2px}
dl.th dt{margin-top:8px} dl.th dd{margin-left:0}
.thtbl{width:100%;border-collapse:collapse;font-size:15px}.thtbl td{border-top:1px solid var(--rule);padding:6px 8px;vertical-align:top}.thtbl td:first-child{width:34%}
.thtbl .mini{display:block}
@media (max-width:560px){.thtbl td{display:block;width:auto!important;border:0;padding:2px 0}.thtbl tr{display:block;border-top:1px solid var(--rule);padding:6px 0}}
details.qz>summary,details.tool-open>summary{cursor:pointer;font:600 13px var(--f-ui);color:var(--accent)}
.toollink{font:13px var(--f-ui)}
.eramap{width:100%;min-width:720px;height:auto}.era-bg{fill:var(--sheet)}.era-bg.alt{fill:var(--paper)}.era-l{font:600 11px var(--f-ui);text-anchor:middle;fill:var(--ink-2)}.thr-l{font:600 10px var(--f-ui);fill:var(--ink-2);text-transform:uppercase;letter-spacing:.08em}
.bar{opacity:.85}.bar:hover{opacity:1}.bar.t0{fill:var(--accent-bg);stroke:var(--accent)}.bar.t1{fill:var(--ochre-bg);stroke:var(--ochre)}.bar.t2{fill:var(--verd-bg);stroke:var(--verd)}.bar.t3{fill:var(--rubric-bg);stroke:var(--rubric)}.bar.t4{fill:var(--paper);stroke:var(--ink-2)}.bar-l{font:11px var(--f-ui);fill:var(--ink);pointer-events:none}
.thread-head{padding:40px 0 0;display:grid;gap:4px}.thread-head h2{font-family:var(--f-display);font-size:clamp(28px,4.5vw,40px);color:var(--rubric)}
.eras{display:flex;flex-wrap:wrap;gap:4px}.chip.era{background:var(--ochre-bg);color:var(--ochre)}.rulebox.see{border-top:3px solid var(--verd)}.rulebox.see h4{color:var(--verd)}
.terms dt{font-weight:600}.terms dd{margin:0 0 6px 0;color:var(--ink-2)}
'''
head = head + '\n' + extra_css + '\n.toc h4.sub{margin:8px 0 4px;font-size:10px;opacity:.8}\n</style>'

D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'history.json')))
e = html.escape
ART = {a['id']: a for a in D['articles']}; PPL = {p['id']: p for p in D['people']}; WRK = {w['id']: w for w in D['works']}; TRM = {t['id']: t for t in D['terms']}
ERA = {x['id']: x for x in D['eras']}; SRC = {x['id']: x for x in D['sources']}
TOOLN = {t['id']: t['title'] for t in D['tools']}
def plain(s): return re.sub('<[^>]+>', '', s)
def yr(v): return f'{-v} BCE' if v < 0 else str(v)
bar = """<div class="bar"><div class="in wrap">
  <span class="brand">History</span>
  <button class="btn navbtn" type="button" id="navbtn" aria-expanded="false" aria-controls="toc">Contents</button>
  <span class="sp"></span>
  <label for="reg">Harpsichord <select id="reg"><option value="full">8′ + 8′ + 4′</option><option value="double">8′ + 8′</option><option value="single">single 8′</option><option value="lute">lute stop</option></select></label>
  <label for="tempo">Tempo <input type="range" id="tempo" min="40" max="140" value="84" aria-describedby="tempo-v"><span id="tempo-v">𝅗𝅥 = 84</span></label>
  <button class="btn" type="button" id="stopall">■ Stop sound</button>
</div></div>"""
toc = ['<nav class="toc" id="toc" aria-label="Contents"><h4>Overview</h4><a href="#how">About this page</a><a href="#map">Map of the page</a>']
for t in D['threads']:
    arts = [x for x in D['articles'] if x['thread'] == t['id']]
    if not arts: continue
    toc.append(f'<h4>{e(t["title"])}</h4>')
    for x in arts: toc.append(f'<a href="#{x["id"]}">{e(x["short"])} <small>{yr(x["span"]["from"])}–{x["span"]["to"] if x["span"]["to"] < 2000 else ""}</small></a>')
toc.append('<h4>Indexes</h4><a href="#timeline">Timeline</a><a href="#people">People</a><a href="#glossary">Glossary</a><a href="#review">Review quiz</a></nav>')
body = ['<main>', f"""<section class="hero" id="how">
  <span class="kicker">History · first source: {e(D['sources'][0]['title'])}, ed. {e(D['sources'][0]['editor'])} ({D['sources'][0]['year']})</span>
  <h1>Music History <em>how musicians and scholars have thought about music, from Pythagoras to the cognitive sciences</em></h1>
  <p>The page is organized by <b>threads</b> (tuning, pitch systems, counterpoint, harmony and so on). Each article is placed in the <b>eras</b> it spans. The first source is a history of Western music <i>theory</i>, so the articles so far follow ideas and the people and treatises behind them. Later sources can add composers, genres and events to the same threads and eras.</p>
  <p>Techniques are taught on the other tabs. Where an article overlaps one, a green chip points there: the modes, organum and species to <b>Counterpoint</b>; tuning, Rameau, functions and Schenker to <b>Tonal harmony</b>; thoroughbass to <b>Partimento</b>; imitation to <b>Fugue</b>; performance, meter and rhetoric to <b>HIP</b>.</p>
  <div class="legend"><span><i class="mk f">p.</i> Each article cites its source chapter and pages</span><span><span class="chip site">Tab</span> technique taught on another tab</span><span><i class="mk r">R</i> Rule as stated by a historical writer (only where no other tab covers it)</span></div>
</section>""", '<section class="chapter" id="map"><header><span class="eyebrow">Overview</span><h2>Map of the page</h2></header><div data-w="eramap"></div></section>']
for t in D['threads']:
    arts = [x for x in D['articles'] if x['thread'] == t['id']]
    if not arts: continue
    body.append(f'<div class="thread-head"><span class="eyebrow">Thread</span><h2>{e(t["title"])}</h2><p class="mini">{e(t["blurb"])}</p></div>')
    for x in arts:
        r = x['sourceRefs'][0]; src = SRC[r['source']]
        eras = ' '.join(f'<span class="chip era">{e(ERA[i]["title"])}</span>' for i in x['eras'])
        s = [f'<section class="chapter" id="{x["id"]}"><header><span class="eyebrow">{e(t["title"])} · {yr(x["span"]["from"])}–{yr(x["span"]["to"]) if x["span"]["to"] < 2000 else "today"}</span><h2>{x["title"]}</h2>'
             f'<div class="eras">{eras}</div><span class="who">{e(src["short"])}, ch. {r["chapter"]} ({e(r["author"])}), pp. {r["pages"]}</span><p class="lede">{x["summary"]}</p></header>']
        s.append('<div class="cols"><div class="rulebox soft"><h4>Key points</h4><ul>' + ''.join(f'<li>{p}</li>' for p in x['points']) + '</ul></div>')
        side = ''
        if x['seeAlso']:
            side += '<div class="rulebox see"><h4>Technique on other tabs</h4><ul>' + ''.join(f'<li><span class="chip site">{e(D["tabs"][l["tab"]])}</span> {e(l["label"])}</li>' for l in x['seeAlso']) + '</ul></div>'
        if x['rules']:
            side += '<div class="rulebox hard"><h4><i class="mk r">R</i> Rules as stated</h4><ol>' + ''.join(f'<li>{q["text"]}<span class="who">{e(q["who"])}</span></li>' for q in x['rules']) + '</ol></div>'
        if side: s.append('<div style="display:grid;gap:18px;min-width:0;align-content:start">' + side + '</div>')
        s.append('</div>')
        if x['people'] or x['works']:
            rows = []
            for pid in x['people']:
                p = PPL[pid]; ws = [WRK[w] for w in x['works'] if WRK[w]['author'] == pid]
                rows.append(f'<tr><td><b>{e(p["name"])}</b>{" <span class=mini>(" + e(p["dates"]) + ")</span>" if p["dates"] else ""}</td><td>{e(" ".join(p["ideas"][:1]))}{"<span class=mini>" + "; ".join(f"<i>{e(w["title"])}</i> ({e(w["year"])})" for w in ws) + "</span>" if ws else ""}</td></tr>')
            for w in x['works']:
                if WRK[w]['author'] is None: rows.append(f'<tr><td><b>Anonymous</b></td><td><i>{e(WRK[w]["title"])}</i> <span class=mini>({e(WRK[w]["year"])})</span></td></tr>')
            s.append(f'<h3>People and treatises</h3><table class="thtbl">{"".join(rows)}</table>')
        if x['terms']:
            s.append('<h3>Terms</h3><dl class="terms">' + ''.join(f'<dt>{e(TRM[i]["term"])}</dt><dd>{e(TRM[i]["def"])}</dd>' for i in x['terms']) + '</dl>')
        for tl in x['tools']: s.append(f'<div data-w="{tl}"></div>')
        nq = sum(1 for q in D['quiz'] if q['article'] == x['id'])
        if nq: s.append(f'<details class="qz tool-open"><summary>Quick check ({nq} question{"s" if nq > 1 else ""})</summary><div data-w="quiz:{x["id"]}"></div></details>')
        s.append('</section>'); body.append(''.join(s))
for sid, w, t in [('timeline', 'timeline', 'Timeline'), ('people', 'theorists', 'People'), ('glossary', 'glossary', 'Glossary'), ('review', 'quiz', 'Review quiz')]:
    body.append(f'<section class="chapter" id="{sid}"><header><span class="eyebrow">Index</span><h2>{t}</h2></header><div data-w="{w}"></div></section>')
body.append('<p class="mini" style="padding:30px 0">Sources: ' + '; '.join(f'{e(x["editor"])} (ed.), <i>{e(x["title"])}</i> ({e(x["publisher"])}, {x["year"]})' for x in D['sources']) + '. All text is paraphrase.</p></main>')
page = head + '\n' + bar + '\n<div class="page wrap">\n' + '\n'.join(toc) + '\n' + '\n'.join(body) + '\n</div>\n'
eng = open('/home/claude/mann/engine.js').read(); ui = open('/home/claude/mann/ui.js').read(); main = open('main.js').read()
gl = json.load(open('/home/claude/mann/glyphs.json')); gl = {k: {'d': v['d'], 'bbox': v['bbox']} for k, v in gl.items()}
data = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
for x in (eng, ui, main): assert '</script' not in x
page += '<script id="engine-src" type="text/plain">' + eng + '</script>\n'
page += '<script>window.GLYPHS=' + json.dumps(gl, separators=(',', ':')) + ';window.MODELS={};window.CHT=' + data + ';</script>\n'
page += '<script>' + eng + '</script>\n<script>' + ui + '</script>\n<script>' + main + '</script>\n'
open('music-history.html', 'w').write(page); print(len(page))
