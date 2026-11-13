# Build brief: Fugue pages (Theory + Analysis)

**Audience:** the coding assistant (Claude in VS Code) building the site. Read this file first, then `schema/types.ts`, then skim both files in `data/`.

**Owner's intent:** two fugue tabs, styled like the existing Counterpoint (Fux), Partimento and Harmony pages, with the same Example player (harpsichord) and the same Rule/Guideline badges.
- **Fugue · Theory**: the content of Alfred Mann's *The Study of Fugue*, as a guided read.
- **Fugue · Analysis**: how to analyse a fugue, compiled from Roberts, Badura-Skoda, Bodky, Gedalge, C. P. E. Bach and Mann.

A finished stand-alone study guide for the Theory tab already exists: `tools/guide/study-of-fugue.html`. Open it in a browser. It is the visual and behavioural reference for the theory pages and their tools. Do not ship that file as is. Port it into the site's components.

## 1. Package
| Path | What it is |
|---|---|
| `data/fugue-theory.json` | 30 chapters in Mann's order. Front: Mann's thesis. Part One: history, chapters I–V. Part Two: Fux (10 chapters), Marpurg (8), Albrechtsberger (3), Martini (2), plus a quick-reference table. In total: 77 rules, 163 guidelines, 36 theorist entries, 2 notated examples, 9 tool specs, and page references to the Dover edition. |
| `data/fugue-analysis.json` | 5 groups and 15 topics: elements, statistics, Roberts' six-step method, other approaches, historical analyses, 3 case studies (WTC I C minor; four organ fugues; WTC I D♯ minor), key plan, proportion, Gedalge's plan, pedal point, performing the structure, affect, key symbolism. Also 2 tool specs. |
| `schema/types.ts` | Types for both files. |
| `tools/guide/` | The study guide source. `c1–c4.html` are the content, `main.js` the tools, `engine.js`/`ui.js` the score renderer and harpsichord (shared with the Fux pack), and `build.py` assembles `study-of-fugue.html`. |
| `tools/extract_theory.py` | Converts the guide HTML into `data/fugue-theory.json` (needs `beautifulsoup4`). |
| `tools/data_analysis.py`, `tools/build.py` | Python source of truth for the analysis tab. `python3 tools/build.py data` regenerates `fugue-analysis.json` and checks ids. |
| `VOICE_COLORS.md` | The shared voice-colouring spec (see §5). |

## 2. Theory tab: `/fugue/theory`
- Left table of contents grouped by part: Overview · Part One · Fux · Marpurg · Albrechtsberger · Martini · Back matter. One section per chapter, deep link `#<chapter.id>`. Show `pages` in the TOC.
- Each chapter renders, in this order:
  1. the eyebrow, title and `lede`;
  2. `ruleBoxes` in two columns: a red **Rule** badge for `rules`, an amber **Guideline** badge for `guidelines`, and each item's `refs` as small grey page tags;
  3. `theorists` as a definition list (name and work on the first line, idea indented) — this replaces rule boxes in the history chapters;
  4. `prose`, `quotes` (pull quotes), `assignment` (a highlighted box titled "Fux's assignment");
  5. `blocks` in order;
  6. for the `cheat` chapter, `table` as a comparison table, then the quiz, then `notes`.
- Circled numbers (①–⑦) are scale degrees. Add a legend line that says so.

## 3. Theory tools (`tools[]`; the behaviour is in `tools/guide/main.js`)
Build them as components and mount them where a chapter's `blocks` lists `{type:'tool', id, preset}`. `preset` tells you which starting state to use; see the `data-w` handling at the end of `main.js`.

| Tool id | Priority | Notes |
|---|---|---|
| `answer-generator` | 1 | Port `makeAnswer()` exactly. It is the teaching point of the Fux and Marpurg chapters. Input format: `D4/2 F#4/8 r/4`. Mark notes answered at the 4th. Unit tests: the 8 presets in `SUBJ` (record their outputs from the reference page before porting). |
| `stretto-finder` | 1 | Port `evalPair()`. Show the results table and a notated, playable candidate. |
| `dc-calculator` | 1 | Invertible counterpoint at the 8ve, 10th and 12th, with a toggle that exchanges the parts. |
| `inversion-mirror` | 2 | Strict vs free inversion. |
| `entry-orders` | 2 | 24 chips plus a lane diagram. |
| `fux-plan` | 2 | Cadence plan by mode. |
| `timeline` | 2 | Filterable. |
| `terms-evolution` | 3 | Searchable glossary. |
| `quiz` | 3 | 12 questions. |

The two notated `examples` are short models written for the guide (`source`). Render them with the shared Example player; `natural: true` means print a natural sign.

## 4. Analysis tab: `/fugue/analysis`
- Groups as page sections; topics as cards. A card shows:
  - `kind` chip, `summary`;
  - `steps` as a numbered procedure;
  - `rules` and `guidelines` with badges;
  - `terms` as a definition list;
  - `tables` as real tables (horizontal scroll on mobile);
  - `cases` as case cards (work, verdict pill: *rhetorical* / *literal* / *not stated*, properties list, structure, resolution);
  - `sources` footer;
  - verification badge (hover shows `checks`).
- Tools (`tools[]` in `fugue-analysis.json`):
  1. **`analysis-worksheet`**: a form that exports Markdown/JSON, prefilled with the WTC I C minor demo.
  2. **`proportion-calculator`**: a bar chart of section lengths with ratio flags. Demo data is in the spec.
- Cross-links: analysis `elements` ↔ theory `mar-imitation`; `pedal-point` ↔ `mar-exposition`; `historical-analysis` ↔ `mar-exposition`, `mart-models`, `h5`. Add these as "See also (Theory)" links.

## 5. Voice colouring (owner request, all score pages)
Every score must support **colouring each voice consistently**, the way the owner does in handwritten notes, so that voice crossing and overlap stand out. Follow `VOICE_COLORS.md`. For fugue, add the second layer `Plain | Voices | Entries` (§5 of that file). Tools that generate scores (answer generator, stretto finder, calculator, mirror) use the same player, so they get the feature automatically.

## 6. Acceptance
- Every chapter, rule, guideline, theorist entry, page tag and block renders. The TOC tracks the current chapter.
- All tools behave like the reference page for every preset.
- The page does not scroll sideways at 390 px; scores and tables scroll inside their own boxes.
- `python3 tools/build.py data` prints only the summary line.

## 7. Rules for you
- Don't change musical or textual content silently. Put questions in `CONTENT_ISSUES.md`.
- Keep the page references visible; the owner uses them to check against the book.
- The text is paraphrased. Don't add longer quotations from the books.
