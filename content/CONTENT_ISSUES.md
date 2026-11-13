# Content issues found while building the pages

The packs ask the builder not to change content silently and to log anything that looks wrong. This is that log. The
open questions each pack lists for the owner are in that pack's own `VERIFICATION.md`; they are not repeated here.

## Repaired in the code (the data files are unchanged)

- **Counterpoint (`counterpoint/data/fux.json`) and fugue theory (`fugue/data/fugue-theory.json`): rule-box titles lost
  their first letter.** 15 + 12 titles read `ules` (Rules), 15 + 12 read `uidelines` (Guidelines), one reads
  `uidelines and exceptions` and one `ameau’s rules (1722)` (Rameau’s). The site restores them in
  `src/scripts/content.ts` (`repairTitle`); a test checks that no rule-box title starts with a lower-case letter after
  the repair. The cause is probably in `tools/extract.py` or `tools/extract_theory.py`, which cut the first character
  of the heading when it turned the guide's HTML into the data.

## Things the pages do not do yet (so the text can promise less than it should)

- **Counterpoint:** built (rule engine port, checker marks on the notes, 15 workbenches, 7 tools). Still missing: voice
  colouring, and clicking on the staff to place a note (the workbench uses a grid of pitch selectors under the score).
- **Tonal harmony:** the `checker` overlay on the 22 deliberate-error examples is not drawn, the SATB checker is not
  ported, and none of the 30 tools exist. The Roman-numeral label is printed as plain text (`V6/5`), not stacked.
- **Fugue:** all eleven tools are built (nine in the theory, two in the analysis). Their logic is tested against the reference
  page's own output for the eight preset subjects (`tests/fixtures/fugue-reference.json`, generated from `tools/guide/main.js`).
  The analysis worksheet starts with the C minor demonstration; the case study gives bars for the entries but not their voices
  or keys, so those columns are left blank. A tool that three analysis topics name (the worksheet) is built once, under the
  first of them, and the others link to it.
- **HIP:** examples are played and shown as notation text with their annotations (syllables, bows, breaths), not as
  engraved staves, because triplet values do not fit the staff renderer's grid. The seven tools are not built, and the
  Written / Performed toggle is a set of play buttons.
- **All score pages:** voice colouring (`VOICE_COLORS.md`) is not built.

## Music History pack and the history-background panels (added with the second delivery of the packs)

- **Built:** the History page (era map, ten threads, 32 articles with their people, terms, rules and quick checks), the
  timeline, people, glossary and quiz indexes, and the "History Background" panels at their places in the five other
  tabs (counterpoint, tonal harmony, partimento, fugue, HIP). Links run both ways; `tests/history.test.mjs` checks that
  every reference resolves.
- **Tools:** all nine are built (`src/scripts/history-tools/`), with their tests in `tests/history-tools.test.mjs`: `mensural` and
  `row-matrix` in the articles, and `modes`, `gamut`, `organum`, `tuning-lab`, `fundamental-bass`, `tonnetz` and `ursatz` in the
  panels. Two differences from the packs: `modes` and `tuning-lab` are not merged into the existing `mode-explorer` (a different
  chapter, with Fux's six cantus firmi) or a tonal tuning lab (none exists), so each stands alone in its panel; and the
  fundamental-bass root finder prefers a perfect fifth over an augmented one, because the pack's tests need E–G–C read as C
  (its reference code read it as E).
- **`tools/validate.py` is not wired into the build** (there is no Python in the site's toolchain); the JavaScript tests
  check the same references instead.
- **The articles' address** is `/theory/music-history/<id>/`, not `/history#<id>` as the brief suggests; the ids are the
  pack's, so the links from the other tabs are the same ones.
- **The pack's intro text** (`scope`) begins "The History page." It is shown as written.
