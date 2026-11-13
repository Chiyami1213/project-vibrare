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
- **Fugue:** the nine theory tools and two analysis tools are not built.
- **HIP:** examples are played and shown as notation text with their annotations (syllables, bows, breaths), not as
  engraved staves, because triplet values do not fit the staff renderer's grid. The seven tools are not built, and the
  Written / Performed toggle is a set of play buttons.
- **All score pages:** voice colouring (`VOICE_COLORS.md`) is not built.

## Music History pack and the history-background panels (added with the second delivery of the packs)

- **Built:** the History page (era map, ten threads, 32 articles with their people, terms, rules and quick checks), the
  timeline, people, glossary and quiz indexes, and the "History Background" panels at their places in the five other
  tabs (counterpoint, tonal harmony, partimento, fugue, HIP). Links run both ways; `tests/history.test.mjs` checks that
  every reference resolves.
- **Not built yet:** the nine tools of this delivery. On the History page `mensural` and `row-matrix`; in the panels
  `modes` (extends the mode explorer), `gamut`, `organum`, `tuning-lab` (extends the tonal tuning lab),
  `fundamental-bass`, `tonnetz` and `ursatz`. Their specs and tests are in each pack's `history-background.json`
  (`content/history/data/history.json` for the first two) and the working code in each pack's `tools/history-tools.js`.
- **`tools/validate.py` is not wired into the build** (there is no Python in the site's toolchain); the JavaScript tests
  check the same references instead.
- **The articles' address** is `/theory/music-history/<id>/`, not `/history#<id>` as the brief suggests; the ids are the
  pack's, so the links from the other tabs are the same ones.
- **The pack's intro text** (`scope`) begins "The History page." It is shown as written.
