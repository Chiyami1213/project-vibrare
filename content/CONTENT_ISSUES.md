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

- **Counterpoint:** the captions of some examples speak of dissonances "in red"; the player does not colour them yet.
  The stored result of the rule engine is shown as a sentence under each example; the engine itself
  (`counterpoint/engine/fux-engine.js`) is not ported, so nothing is re-checked in the browser, and the seven tools and
  fifteen workbenches are not built.
- **Tonal harmony:** the `checker` overlay on the 22 deliberate-error examples is not drawn, the SATB checker is not
  ported, and none of the 30 tools exist. The Roman-numeral label is printed as plain text (`V6/5`), not stacked.
- **Fugue:** the nine theory tools and two analysis tools are not built.
- **HIP:** examples are played and shown as notation text with their annotations (syllables, bows, breaths), not as
  engraved staves, because triplet values do not fit the staff renderer's grid. The seven tools are not built, and the
  Written / Performed toggle is a set of play buttons.
- **All score pages:** voice colouring (`VOICE_COLORS.md`) is not built.
