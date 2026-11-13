// Evaluates the guide's engine.js + the data part of main.js and writes the examples/workbench specs as JSON.
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = process.argv[2];
const ctx = { window: {}, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(src, 'engine.js'), 'utf8'), ctx);
ctx.window.FuxEngine = ctx.FuxEngine;
ctx.window.MODELS = JSON.parse(fs.readFileSync(path.join(src, 'models.json'), 'utf8'));
ctx.window.Gradus = { AudioEng: {}, Player: {}, figure: () => {}, Workbench: function () {} };
let main = fs.readFileSync(path.join(src, 'main.js'), 'utf8');
main = main.slice(0, main.indexOf("document.querySelectorAll('[data-w]')"));
main = main.replace(/^\(\(\) => \{|^\(function\s*\(\)\s*\{/, '');
vm.runInContext('var window = this.window;' + main + '\nthis.__out = { FIG, WB };', ctx);
const FE = ctx.window.FuxEngine;
const figs = JSON.parse(JSON.stringify(ctx.__out.FIG));
for (const [k, f] of Object.entries(figs)) {   // pre-computed engine results = test suite for a port
  if (f.check === false) continue;
  const run = vs => { let r = FE.analyze(vs, { mode: 'D' }).issues; if (f.only) r = r.filter(i => f.only.includes(i.rule)); return r.map(i => ({ level: i.level, rule: i.rule, v: i.v, t: i.t })); };
  f.engineResult = run(f.voices);
  if (f.toggle && f.toggle.alt) f.toggle.engineResult = run(f.toggle.alt);
}
const out = { figures: figs, workbenches: ctx.__out.WB, modes: FE.MODES };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('figures', Object.keys(out.figures).length, 'workbenches', Object.keys(out.workbenches).length);
