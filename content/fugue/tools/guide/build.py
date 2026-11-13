import json
head=open('head.html').read()
parts=open('shell.txt').read().split('@@BODY@@')
body=''.join(open(f).read() for f in ['c1.html','c2.html','c3.html','c4.html'])
page=head+parts[0]+body+parts[1]
open('page.html','w').write(page)
eng=open('engine.js').read(); ui=open('ui.js').read(); main=open('main.js').read()
gl=json.load(open('glyphs.json')); gl={k:{'d':v['d'],'bbox':v['bbox']} for k,v in gl.items()}
assert '</script' not in eng+ui+main
page=page.replace('<script id="engine-src" type="text/plain">/*ENGINE*/</script>','<script id="engine-src" type="text/plain">'+eng+'</script>',1)
page=page.replace('<script>/*GLYPHS*/</script>','<script>window.GLYPHS='+json.dumps(gl,separators=(',',':'))+';window.MODELS={};</script>',1)
page=page.replace('<script>/*ENGINE*/</script>','<script>'+eng+'</script>',1)
page=page.replace('<script>/*UI*/</script>','<script>'+ui+'</script>',1)
page=page.replace('<script>/*MAIN*/</script>','<script>'+main+'</script>',1)
open('study-of-fugue.html','w').write(page); print(len(page))
