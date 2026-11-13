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
- **HIP:** the seven tools are built (`src/scripts/hip/tools.ts`, logic in `tools-pure.ts`), with the acceptance tests of the
  brief in `tests/hip-tools.test.mjs`. The examples are still shown as notation text with their annotations, not as engraved
  staves, because triplet values do not fit the staff renderer's grid; the tools show the notes as a piano roll instead.
  Points where the tools go beyond or differ from the pack:
  - **Breath planner:** on `breath-q` the rules give the stored breaths (main after notes 1 and 10, emergency after 6) and one
    more emergency breath after note 15, because the second bar repeats the shape of the first (a leap at the start of the
    last beat group). The stored example lists only the first; the tool marks both, and the user can remove a mark.
  - **Quantz tempo:** the tables cover common time, alla breve and some triple and compound metres. For other cases (for
    example 9/8, a plain Allegro in alla breve) the tool applies the nearest rule and says it is by analogy.
  - **Messa di voce:** the pack names L. Mozart's four divisions of the bow but describes only the first (soft, loud, soft), so
    only that one is drawn. The keyboard substitutes (trill filling, broken chord, Bebung) are illustrations of the spec, not
    transcriptions.
  - **Trill builder:** the L. Mozart "accelerating" preset speeds up from half to one and a half times the chosen speed; the
    pack gives no figures.
  - **Appoggiatura lab:** only Quantz gives a rule for the tied 6/8 case, before a rest, and before a dissonant trill; the tool
    says so instead of inventing a C. P. E. Bach version.
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

## Partimento tools (added with the history pack)

- **Built:** all eleven (`src/scripts/partimento/tools.ts`, logic in `tools-pure.ts`, tests in `tests/partimento-tools.test.mjs`): bass-motion
  explorer, combination builder, recognition quiz (moti and schemata), nomenclature builder, P–T–R grid, clausulae mixer, simple–
  compound–double morph, ear quiz, suspension finder, Durante and Fenaroli table, plain and diminished. They sit on the page
  of the section they belong to; the examples they need are one file, `/theory/partimento/tools-data.json`.
- **P–T–R:** the data does not mark preparation, tension and resolution. The tool cuts each example by its bass: the
  resolution is the last chord, the tension the chords over the note the bass stands on before it, the preparation what
  comes before. That is a rule of the tool, not of the notes.
- **Durante and Fenaroli:** the brief names ascending ②, ③ and ④ and descending minor ⑥ as the degrees that differ. The
  figures in the examples show ②, ④ and the descending minor ⑥ (and minor ② too) as different harmonies; ascending ③ is 6/3 in
  both, and only the octave doubling in the realisations differs. The tool leaves the octave out of the comparison, so ③ is
  not marked.
- **Combination builder:** examples are joined when they have the same number of parts and the same mode; examples in
  different metres are laid out on the first one's bar lines.
- **Suspension finder:** it marks what the rules of the cards allow (which bass motions prepare a 4–3, 7–6 or 9–8), not what a
  given harmony needs.
