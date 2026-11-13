# Build brief: Counterpoint (Fux) pages

**Audience:** the coding assistant (Claude in VS Code) building the site. Read this file, then `schema/types.ts`, then skim `data/fux.json`.

**Owner's intent:** move the existing Fux study guide (a single HTML page) into the website as proper pages that share the site's components (score player with harpsichord sound, rule/guideline badges, quizzes). The musical content and the rule engine already exist. Do not rewrite them; port and restyle.

## 1. What is in this package
| Path | What it is |
|---|---|
| `data/fux.json` | 20 chapters in book order (front matter, Parts I–III with five species each, appendix, species-at-a-glance table): 62 rules, 68 guidelines, figure descriptions, Fux's assignments, 22 notated examples, 15 workbench specs, the six cantus firmi |
| `engine/fux-engine.js` | The counterpoint rule engine (UMD: `require()` in Node, `window.FuxEngine` in the browser). `analyze(voices, {mode})` → issues; `solveSmart` / `buildExercise` generate exercises and models. ~600 lines, no dependencies. |
| `engine/reference-ui.js` | The guide's original UI code: SVG score renderer, Karplus-Strong harpsichord synth (`AudioEng`), and the seven tools. Reference for porting — don't ship it as is. |
| `tools/` | `guide-page.html`, `guide-main.js`, `models.json` (the original guide, source of truth for the text), `export_examples.js` (Node: evaluates the examples and runs the engine on them) and `extract.py` (HTML → `data/fux.json`) |

Regenerate: `node tools/export_examples.js <guide-dir> /tmp/ex.json && python3 tools/extract.py <guide-dir> /tmp/ex.json data/fux.json` (needs `beautifulsoup4`). Since the site now owns the content, you may instead edit `data/fux.json` directly.

## 2. Pages
Route `/counterpoint` with a left table of contents (Front matter · First Part: two voices · Second Part: three voices · Third Part: four voices · Back matter). One page section per chapter, deep link `#<chapter.id>`.

Each chapter renders, in this order:
1. Eyebrow (part · chapter · Mann pages), title, `lede`.
2. `ruleBoxes`: two columns on desktop. Red **Rule** badge for `kind: 'rules'`, amber **Guideline** badge for `'guidelines'`. Each item shows its `refs` (Mann page / figure) as small grey tags.
3. `prose`, `quotes` (pull-quote style).
4. `bookFigures` as a definition list ("Figures in the book").
5. `assignment` in a highlighted box headed "Fux's assignment".
6. `blocks` in order: `example` → Example player; `workbench` → Workbench; `tool` → the matching tool (§3).
7. `cheat` chapter: render `table` as the species-at-a-glance table, and `notes` as a footnote.

## 3. Components
- **Example player** (share it with the partimento/tonal pages if possible): clefs chosen per voice range (treble, octave-treble, bass), durations from `d` (1 = whole note), ties, rests; interval numbers between two-voice staves (blue = perfect, grey = imperfect); figures under the bass when `figures: 'bass'`; harpsichord playback with tempo and register (the synth in `reference-ui.js` → `AudioEng`, or the site's sampler); tap a note to hear it. If `toggle` exists, a switch swaps `voices` ↔ `toggle.alt`. Run `FuxEngine.analyze` unless `check === false`; filter by `only`; list issues (error = Rule, warn = Guideline) and highlight the note at `t` in voice `v`. Show `caption` below.
- **Workbench** (`workbenches[id]`): exercise builder — choose mode (D E F G A C), cantus position; the student enters notes by clicking; live `analyze`; "solve"/"show a model" via `solveSmart`. `demo: true` means start with a generated model filled in. Port from `reference-ui.js` → `class Workbench`.
- **Tools** (ids in `blocks`): `motion-lab` (three motions + four rules), `interval-explorer`, `mode-explorer` (six modes and their cantus), `suspension-lab`, `monochord` (appendix: arithmetic vs harmonic division), `triad-order` (natural order octave–fifth–third), `fault-quiz` (spot the error). Behaviour is in `reference-ui.js`; restyle to the site.

## 4. Acceptance
- Every chapter, rule, guideline, figure note and block renders; TOC highlights the current chapter.
- Every example plays, and `FuxEngine.analyze` on each example returns exactly its stored `engineResult` (and `toggle.engineResult`) — use these as unit tests.
- Workbenches can generate a model in every mode and the checker accepts it.
- Mobile: scores scroll inside their own container.

## 5. Rules for you
- Don't change musical content or rule wording silently; log questions in `CONTENT_ISSUES.md`.
- Keep the Mann page/figure references visible — they are how the owner checks the text against the book.
- Don't copy book text beyond the short quotations already in the data.

## Voice colouring (owner request, all score pages)
Every score must support **colouring each voice consistently**, the way the owner does in their handwritten notes, so that voice crossing and overlap are visible at a glance. Full spec: `VOICE_COLORS.md`, which covers the palette, voice paths, crossing markers, the per-pack voice mapping and acceptance tests. Build it into the shared Example player once, so the tonal, counterpoint, partimento and fugue pages all get it.
