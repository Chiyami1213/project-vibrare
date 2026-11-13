(function () {
'use strict';
const FE = window.FuxEngine, Gx = window.Gradus, M = window.MODELS || {};
const { AudioEng, Player, figure, Workbench } = Gx;
const cf = mode => FE.cfLine(FE.MODES[mode].cf);
const W = (notes, role, species) => ({ role: role || 'cpt', species: species || 1, notes });
const wl = s => s.split(' ').map(p => ({ p, d: 1 }));
const hl = (arr, last) => arr.map(p => p === 'r' ? { d: .5, rest: 1 } : { p, d: .5 }).concat([{ p: last, d: 1 }]);
const ql = (arr, last) => arr.map(p => ({ p, d: .25 })).concat([{ p: last, d: 1 }]);
const DIS = ['diss', 'acc-diss', 'susp', 'susp-perf'];

function plainOf(voices) { // remove ligatures: each bar takes the note sounding on its upbeat
  return voices.map(v => {
    if (v.species !== 4) return v;
    const ms = FE.mergeVoice(v.notes); const total = Math.round(ms[ms.length - 1].end); const out = [];
    for (let b = 0; b < total; b++) { const t = b === total - 1 ? b : b + .5; const m = ms.find(m => m.on <= t + 1e-6 && t < m.end - 1e-6); out.push({ p: m.p, d: 1 }); }
    return { role: v.role, species: 1, notes: out };
  });
}
const S4 = [{ d: .5, rest: 1 }, { p: 'A4', d: .5, tie: 1 }, { p: 'A4', d: .5 }, { p: 'D5', d: .5, tie: 1 }, { p: 'D5', d: .5 }, { p: 'C5', d: .5, tie: 1 }, { p: 'C5', d: .5 }, { p: 'Bb4', d: .5, tie: 1 }, { p: 'Bb4', d: .5 }, { p: 'G4', d: .5 }, { p: 'A4', d: .5 }, { p: 'C5', d: .5, tie: 1 }, { p: 'C5', d: .5 }, { p: 'F5', d: .5, tie: 1 }, { p: 'F5', d: .5 }, { p: 'E5', d: .5, tie: 1 }, { p: 'E5', d: .5 }, { p: 'D5', d: .5, tie: 1 }, { p: 'D5', d: .5 }, { p: 'C#5', d: .5 }, { p: 'D5', d: 1 }];

const FIG = {
  fig5: { fig: 'Fig. 5', title: 'Josephus’s first counterpoint, above the cantus in D', voices: [W(wl('A4 A4 G4 A4 B4 C5 C5 B4 D5 C#5 D5')), W(cf('D'), 'cf')], caption: 'Fifth at the start; 5→3 by oblique motion (the only use of repetition); 3→3 parallel; 3→5 contrary; 6–8 at the cadence with the raised C♯. Numbers between the staves are the intervals: blue = perfect, grey = imperfect.' },
  fig6: { fig: 'After Fig. 6', title: 'Counterpoint below: two mistakes, then the correction', voices: [W(cf('D'), 'cf'), W(wl('G3 D4 A3 F3 E3 D3 F3 G3 A3 C#4 D4'))], autoCheck: true, toggle: { label: 'Apply Aloysius’s correction', alt: [W(cf('D'), 'cf'), W(wl('D3 D3 A3 F3 E3 D3 F3 G3 A3 C#4 D4'))], autoCheck: true }, caption: 'As in Fux’s Fig. 6, the first attempt opens a fifth below (outside the mode) and moves from a third to a fifth in direct motion. The correction starts on the octave and stays on the low D, so a tenth moves to the fifth by contrary motion.' },
  fig7: { fig: 'After Figs. 7–8', title: 'Hidden fifths revealed by diminution', check: false, voices: [W([{ p: 'F4', d: 1 }, { p: 'E4', d: 1 }, { p: 'D5', d: 1 }, { p: 'E5', d: 1 }]), W([{ p: 'D4', d: 1 }, { p: 'A3', d: 1 }, { p: 'D4', d: 1 }, { p: 'A4', d: 1 }])], toggle: { label: 'Fill in the skips (diminution)', alt: [W([{ p: 'F4', d: 1 }, { p: 'E4', d: 1 }, { p: 'D5', d: 1 }, { p: 'E5', d: 1 }]), W([{ p: 'D4', d: .5 }, { p: 'C4', d: .25 }, { p: 'Bb3', d: .25 }, { p: 'A3', d: 1 }, { p: 'D4', d: .25 }, { p: 'E4', d: .25 }, { p: 'F4', d: .25 }, { p: 'G4', d: .25 }, { p: 'A4', d: 1 }])] }, caption: 'Bars 1–2: a third moves to a fifth by direct motion (Fig. 7). Bars 3–4: an octave moves to a fifth by direct motion (Fig. 8). Fill in the skip the way a singer would ornament it, and two real fifths appear (B♭–F → A–E; G–D → A–E). “The lawgivers of an art have set down nothing pointlessly.”' },
  fig16: { fig: 'After Figs. 16–20', title: 'Octaves and unisons approached by contrary motion', check: false, voices: [W(wl('C5 B4 A4 G4 E5 C5 E4 C4')), W(wl('A3 B3 F4 G4 G3 C4 A3 C4'))], caption: 'Bars 1–2: <i>ottava battuta</i>, a tenth to an octave by contrary steps. Fux “has long searched for the reason” it is forbidden and leaves it to your discretion. Bars 3–4: a unison reached from a third; the unison is avoided except at the start and end. Bars 5–6 and 7–8: an octave and a unison reached by skips from a remote consonance, “not to be tolerated even in composition for more than two voices.”' },
  fig33: { fig: 'Fig. 33', title: 'Second species above the cantus, corrected', voices: [W(hl(['A4', 'D5', 'A4', 'B4', 'C5', 'G4', 'A4', 'D5', 'B4', 'C5', 'D5', 'A4', 'C5', 'D5', 'E5', 'B4', 'D5', 'A4', 'B4', 'C#5'], 'D5'), 'cpt', 2), W(cf('D'), 'cf')], caption: 'Upbeat dissonances (red figures) are all passing notes filling a third: A–B–C in bar 2, B–C–D in bar 5 and so on. The cadence is 5–6–8.' },
  fig35: { fig: 'Fig. 35', title: 'Second species below, beginning with a half rest', voices: [W(cf('D'), 'cf'), W(hl(['r', 'D3', 'D4', 'A3', 'C4', 'A3', 'B3', 'A3', 'G3', 'B3', 'D4', 'E4', 'F4', 'C4', 'E4', 'B3', 'D4', 'D3', 'A3', 'C#4'], 'D4'), 'cpt', 2)], caption: 'Below the cantus the cadence becomes 5–3–1 (with C♯ as the minor third below E). Note the octave skip in bar 9 that makes room.' },
  skip3: { fig: 'After Figs. 26–32', title: 'Does a skip hide fifths between downbeats?', voices: [W(hl(['D5', 'B4', 'E5', 'C5'], 'C5'), 'cpt', 2), W(wl('G4 A4 F4'), 'cf')], only: ['dd', 'par5', 'par8', 'direct', 'diss', 'acc-diss'], autoCheck: true, toggle: { label: 'Skip a fourth instead', alt: [W(hl(['D5', 'G5', 'E5', 'C5'], 'C5'), 'cpt', 2), W(wl('G4 A4 F4'), 'cf')], autoCheck: true }, caption: 'D–G and E–A are fifths on two downbeats. With a skip of a third (D–B) the ear still links them, so they count as consecutive fifths. With a skip of a fourth (D–G) the distance makes the ear “forget” the first downbeat (Figs. 30–32).' },
  fig55: { fig: 'Fig. 55', title: 'Third species above the cantus in D', voices: [W(ql('D4 E4 F4 G4 A4 B4 C5 D5 E5 D5 B4 C5 D5 C5 Bb4 A4 Bb4 C5 D5 E5 F5 F4 A4 B4 C5 A4 Bb4 C5 Bb4 A4 G4 Bb4 A4 D4 E4 F4 G4 A4 B4 C#5'.split(' '), 'D5'), 'cpt', 3), W(cf('D'), 'cf')], caption: 'Bar 1 shows the stepwise pattern of Fig. 47: 1 consonant, 2 dissonant, 3 consonant, 4 dissonant. Bar 3 (8–7–5–6) is a cambiata: the dissonant seventh skips down a third to the fifth. B♭ appears where B would make mi contra fa against F.' },
  cambiata: { fig: 'After Fig. 50', title: 'The nota cambiata', voices: [W(ql('E5 D5 B4 C5'.split(' '), 'A4'), 'cpt', 3), W(wl('E4 F4'), 'cf')], only: DIS, autoCheck: true, caption: '8–7–5–6: the second quarter (D, a seventh) is dissonant and skips a third down to a consonance, then the line turns up by step. Strictly the skip belongs between the 1st and 2nd notes (Fig. 51), but filling it would need eighth notes, so the masters approved this form.' },
  fig73: { fig: 'Fig. 73', title: 'Fourth species above the cantus in D', voices: [W(S4, 'cpt', 4), W(cf('D'), 'cf')], caption: 'Upbeats consonant; downbeat sevenths (red) resolve down to sixths. Bar 5 drops the ligature: Josephus avoided repeating the ligature of bars 3–4. The cadence is 7–6–8.' },
  eighths: { fig: 'After Fig. 81', title: 'Where eighth notes may go', voices: [W([{ p: 'A4', d: .25 }, { p: 'B4', d: .125 }, { p: 'C5', d: .125 }, { p: 'D5', d: .5 }, { p: 'E5', d: .125 }, { p: 'D5', d: .125 }, { p: 'C5', d: .25 }, { p: 'G4', d: .5 }, { p: 'F#4', d: 1 }], 'cpt', 5), W(wl('D4 C4 D4'), 'cf')], only: ['eighth'], autoCheck: true, caption: 'Bar 1: a pair of eighths on the 2nd quarter, moving by step, is good. Bar 2: eighths on the 1st quarter are bad. They are allowed on the 2nd and 4th quarters, never on the 1st and 3rd.' },
  fig101: { fig: 'Fig. 101', title: 'Three parts, note against note: cantus on top', figures: 'bass', voices: [W(cf('D'), 'cf'), W(wl('F3 A3 C4 A3 B3 D4 C4 E4 D4 C#4 D4')), W(wl('D3 D3 A3 F3 E3 D3 F3 C3 D3 A3 D3'))], caption: 'The harmonic triad stands in almost every bar (figures under the bass). Bars 7–8: the outer voices move into a fifth by direct motion, which Fux allows “if there is no other possibility, in order to avoid a worse awkwardness.” The final chord has no third.' },
  fig160: { fig: 'Fig. 160', title: 'Four parts: the model, cantus in the alto', figures: 'bass', voices: [W(wl('F4 A4 C5 B4 B4 D5 C5 E5 D5 C#5 D5')), W(cf('D'), 'cf'), W(wl('A3 F3 G3 G3 G3 A3 A3 C4 A3 A3 A3')), W(wl('D3 D3 C3 G3 E3 D3 F3 C3 D3 A2 D3'))], caption: 'Each chord holds third, fifth and octave where possible. Fux numbers all intervals as simple numbers “so that the doubling of the consonances might be plainer to the eye.” Bar 4 has a fourth between inner voices, which is acceptable because intervals are reckoned from the bass.' }
};
// models (generated and checked by the rule engine)
if (M.florid2) FIG.florid2 = { fig: 'Model', title: 'Florid counterpoint over the cantus in D (compare Figs. 82–83)', voices: M.florid2, toggle: M.florid2b ? { label: 'Cantus above instead', alt: M.florid2b } : null, caption: 'Halves, quarters, ligatures and a pair of eighths. Written for this guide and checked by the rule engine; play it, then compare with Fux’s models on pp. 64–65.' };
if (M.m3s2) FIG.m3s2 = { fig: 'Model', title: 'Half notes in the middle voice, cantus on top (compare Fig. 121)', figures: 'bass', voices: M.m3s2, caption: 'The half notes agree with both whole notes. Generated for this guide and checked by the rule engine.' };
if (M.m3s3) FIG.m3s3 = { fig: 'Model', title: 'Quarters on top, cantus in the middle (compare Fig. 130)', figures: 'bass', voices: M.m3s3, caption: 'Watch the downbeats: each first quarter completes the harmony with the two whole notes.' };
if (M.lig3) FIG.lig3 = { fig: 'Model', title: 'Ligatures on top, cantus in the middle (compare Figs. 135–136)', figures: 'bass', voices: M.lig3, toggle: { label: 'Remove the ligatures', alt: plainOf(M.lig3) }, caption: 'Toggle to remove the ties: each upbeat note moves to the downbeat it delays. The bass keeps exactly the same consonances, as Fux says. Check the plain version: any fifths it contains are the ones the syncopation makes acceptable (Fig. 138).' };
if (M.m3s5) FIG.m3s5 = { fig: 'Model', title: 'Florid voice on top, cantus in the middle (compare Figs. 154–159)', figures: 'bass', voices: M.m3s5, caption: 'All species combined over two voices in whole notes.' };
if (M.m4s2) FIG.m4s2 = { fig: 'Model', title: 'Half notes in the tenor, cantus in the soprano (compare Fig. 173)', figures: 'bass', voices: M.m4s2, caption: 'Two half notes against three whole notes.' };
if (M.m4s3) FIG.m4s3 = { fig: 'Model', title: 'Quarters in the soprano, cantus in the alto (compare Fig. 177)', figures: 'bass', voices: M.m4s3, caption: 'A complete triad on each first quarter where possible.' };
if (M.m4s4) FIG.m4s4 = { fig: 'Model', title: 'Ligatures in the soprano, cantus in the alto (compare Fig. 193)', figures: 'bass', voices: M.m4s4, toggle: { label: 'Remove the ligatures', alt: plainOf(M.m4s4) }, caption: 'The tied notes take the consonances they would have without the ties.' };
if (M.m4s5) FIG.m4s5 = { fig: 'Model', title: 'Florid soprano over three whole-note voices (compare Fig. 200)', figures: 'bass', voices: M.m4s5, caption: 'The fifth species in four parts, the last step of the Gradus.' };

const WB = {
  wb11: { nv: 2, species: 1, cfPos: 1, title: 'Note against note, two voices' },
  wb12: { nv: 2, species: 2, cfPos: 1, title: 'Second species, two voices' },
  wb13: { nv: 2, species: 3, cfPos: 1, title: 'Third species, two voices' },
  wb14: { nv: 2, species: 4, cfPos: 1, title: 'Fourth species, two voices' },
  wb15: { nv: 2, species: 5, cfPos: 1, title: 'Florid counterpoint, two voices', demo: true },
  wb21: { nv: 3, species: 1, cfPos: 0, title: 'Note against note, three voices', demo: true },
  wb22: { nv: 3, species: 2, cfPos: 0, florid: 1, title: 'Half notes in three voices', demo: true },
  wb23: { nv: 3, species: 3, cfPos: 1, florid: 0, title: 'Quarters in three voices', demo: true },
  wb24: { nv: 3, species: 4, cfPos: 1, florid: 0, title: 'Ligatures in three voices', demo: true },
  wb25: { nv: 3, species: 5, cfPos: 1, florid: 0, title: 'Florid counterpoint, three voices', demo: true },
  wb31: { nv: 4, species: 1, cfPos: 1, title: 'Note against note, four voices', demo: true },
  wb32: { nv: 4, species: 2, cfPos: 0, florid: 2, title: 'Half notes in four voices', demo: true },
  wb33: { nv: 4, species: 3, cfPos: 1, florid: 0, title: 'Quarters in four voices', demo: true },
  wb34: { nv: 4, species: 4, cfPos: 1, florid: 0, title: 'Ligatures in four voices', demo: true },
  wb35: { nv: 4, species: 5, cfPos: 1, florid: 0, title: 'Florid counterpoint, four voices', demo: true }
};

document.querySelectorAll('[data-w]').forEach(el => {
  const k = el.dataset.w;
  try {
    if (FIG[k]) figure(el, FIG[k]);
    else if (WB[k]) new Workbench(el, WB[k]);
    else if (k === 'motion') Gx.motionLab(el);
    else if (k === 'intervals') Gx.intervalExplorer(el);
    else if (k === 'modes') Gx.modeExplorer(el);
    else if (k === 'susp') Gx.suspensionLab(el);
    else if (k === 'mono') Gx.monochord(el);
    else if (k === 'triad') Gx.triadOrder(el);
    else if (k === 'quiz') Gx.faultQuiz(el);
  } catch (e) { console.error('widget', k, e); el.textContent = 'This example could not be drawn.'; }
});

// toolbar
const reg = document.getElementById('reg'), tempo = document.getElementById('tempo'), tv = document.getElementById('tempo-v');
reg.addEventListener('change', () => { AudioEng.reg = reg.value; AudioEng.pluckNow('D4', 1); });
tempo.addEventListener('input', () => { AudioEng.halfBpm = +tempo.value; tv.textContent = '𝅗𝅥 = ' + tempo.value; });
document.getElementById('stopall').addEventListener('click', () => Player.stop());
// contents
const toc = document.getElementById('toc'), nb = document.getElementById('navbtn');
nb.addEventListener('click', () => { const o = toc.classList.toggle('open'); nb.setAttribute('aria-expanded', String(o)); });
toc.addEventListener('click', e => { if (e.target.closest('a')) { toc.classList.remove('open'); nb.setAttribute('aria-expanded', 'false'); } });
const links = [...toc.querySelectorAll('a')];
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); } });
}, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('section.chapter').forEach(s => io.observe(s));
if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 50); }
})();
