# BUILD BRIEF: Historically Informed Performance (HIP) tab

## 1. Goal
Add a **HIP** tab to the music site, next to Counterpoint, Partimento, Tonal harmony and Fugue. It teaches how to play baroque music on **flute** and **keyboard** (harpsichord, clavichord, piano). The content comes from Quantz and C. P. E. Bach, checked against Badura-Skoda and Bodky for Bach. L. Mozart's violin treatise is used only as a cross-reference. Its bowing is the analogue of flute breathing and tonguing, and of keyboard touch and "breathing".

All content lives in `data/hip.json` (types in `schema/types.ts`). Don't rewrite content; log problems in `CONTENT_ISSUES.md`.

## 2. Page structure
- **Header:** title, the `scope` sentence, and an **instrument filter**: `All | Flute | Keyboard`. A topic tagged `both` shows under each filter. Remember the choice in localStorage, wrapped in try/catch.
- **Left nav (desktop) / dropdown (mobile):** the 9 `groups` in order, each listing its topics. Deep link every topic with `#topic-id`.
- **Topic page** (render the fields in this order, skipping empty ones):
  1. Title, instrument chips, summary.
  2. `rules` with the red **Rule** badge, then `guidelines` with the amber **Guideline** badge. Reuse the badge components from the other tabs. The distinction matters: a rule is something a source states as a requirement; a guideline is advice, taste, or a modern author's view.
  3. `steps` as a numbered list.
  4. `tables`. The `disagreements` table is wide: give it horizontal scroll inside its own container, never page-level scroll, with a sticky first column.
  5. `crossRefs` as small cards, each with three rows: "Violin (L. Mozart)", "Flute", "Keyboard". Style them as cross-reference: dashed border and the LM source tint.
  6. `examples` with the example player (§5).
  7. `tools` as embedded widgets (§6).
  8. `terms` as a definition list.
  9. A sources footer: `refs` chips. Clicking one shows the full source from `sources[]`.
  10. Verification: a small status pill (verified / partly / flagged). On expand it shows the checks and the flags.
- **Ref chips:** each `Item.refs` entry renders as a chip after its sentence. Colour by the source prefix: `Q`, `CPE`, `BS`, `BO`, `LM`. LM chips always carry a "cross-ref" label.

## 3. Sources panel
A page (or modal) that lists `sources[]` with their role. State plainly that L. Mozart is cross-reference only.

## 4. Playback (harpsichord)
- Use the **same harpsichord sampler** as the other tabs (site-wide standing rule).
- The tempo for examples is crotchet = 60, unless an example's caption names a tempo. Give the player a tempo slider from 40 to 100.
- **Sounding length:** plain notes sound for 90% of their duration; `.` notes for 50%; `_` notes for 100%, slurred into the next note.
- **`@VEL` on harpsichord:** a harpsichord can't play louder by touch. Ignore `@VEL` for loudness, but use it for **agogic emphasis**: notes with `@VEL ≥ 0.8` start about 10 ms late and sound for 100% instead of 90%. Badura-Skoda says unstressed notes on harpsichord can only be made shorter. Offer a "piano" sound option, where `@VEL` maps to velocity.
- **Grace notes (`g`):** draw them as small notes in the written layer; they don't sound in the written layer.
- **Version toggle:** when `performed` holds several realisations (for example `Quantz` and `C. P. E. Bach`), show a segmented control `Written | Quantz | C. P. E. Bach`. When `performed` has a single layer, the control is `Written | Performed`. Play them in sequence with a 1-beat gap, and show the active one.
- `"same"`: the example is about annotations (breaths, syllables, bows), not rhythm. Show only the Written view, with the annotation layer.

## 5. Example player
- **Two-row display:** the score as written (small notes, ornament `marks` above the notes), and below it the score as performed. For two-voice examples, draw two staves (treble plus bass) or a grand staff.
- **Annotation layers** (toggles, all on by default):
  - `syllables` under the upper voice;
  - `bows` above it, labelled "L. Mozart (cross-ref)";
  - `breaths` as a comma or a ✓ above the staff after note index `after`, in two styles for `main` and `emergency`. Hovering or tapping shows `why`.
- **Index rule:** indices count the upper voice's **sounding** notes. Skip `g` notes, rests and `|`.
- **`diss-dyn` example:** draw the chord progression with figures under the bass and a `class` label above each chord. Play it with the harpsichord texture rule in `performed.rule`: add the doubled bass and the extra parts, and arpeggiate the ff chords (about 30 ms between notes).
- **Voice colouring:** see `VOICE_COLORS.md`. Voices are `upper`, `lower` and `bass`. Few HIP examples have two upper voices, but keep the toggle consistent with the other tabs.

## 6. Tools (priority order)
Each tool's `spec` and `reference` are in `tools[]`. Build them as components that can be embedded in topics and also opened full-page at `#tool-id`.
1. `quantz-tempo`: the Quantz tempo calculator. The data tables are in the topic `quantz-pulse`. Acceptance tests:
   - C, Allegro assai gives minim = 80;
   - ¢, Allegretto gives minim = 80;
   - C, plain Allegro gives crotchet ≈ 120 (one pulse per three quavers);
   - 12/8 Siciliana gives quaver ≈ 120;
   - C, Adagio assai gives quaver = 40.
   Change the pulse slider to 70 and every result scales by 70/80.
2. `appoggiatura-lab`: the appoggiatura length lab. Acceptance tests:
   - a plain minim gives a crotchet appoggiatura;
   - a dotted minim in 3/4 gives a minim appoggiatura plus a crotchet;
   - before a rest (Quantz), the appoggiatura takes the note's value;
   - before a trill on a dissonance, the appoggiatura is ≤ 1/16 of the note, with a warning if it is set longer.
3. `rhythm-lab`: the rhythm lab. Acceptance tests:
   - the inequality slider is disabled, with a reason shown, when any Quantz exception is ticked;
   - the triplet toggle reproduces both realisations of `dot-vs-triplet`.
4. `trill-builder`: the trill builder. Acceptance tests:
   - the Quantz preset at pulse 80 plays 8 notes per crotchet;
   - the CPE preset starts on the upper note;
   - Pralltriller is only offered when the next note is a step lower.
5. `breath-planner`: the breath and articulation planner. Implement Quantz's rules as functions that return `{index, kind, why}`:
   - after a note ≥ 2× the following note: `main`;
   - never after the last note of a bar unless the passage is in quick stepwise triplets;
   - before a restated opening motif: `main`;
   - inside runs of equal notes, after the first note of a beat group where the next interval is ≥ a third: `emergency`.

   Syllables:
   - dotted pairs: tiri, starting ti ti;
   - leaps in an Allegro: ti;
   - stepwise or slow notes: di;
   - eight or more notes per pulse: did'll.

   Check it against the stored examples: `breath-q` must give indices 0 and 9 as `main` and 5 as `emergency`. Keyboard mode shows the same points as lift commas and adds strong/weak beat dots. The "bowing view" toggle uses L. Mozart's rules: downbeat down-bow, upbeat up-bow, and a dotted pair in one bow.
6. `dissonance-dynamics`: the dissonance dynamics tool. Map figures to a class using the lists in the topic `dissonance-dynamics`. Acceptance tests:
   - 6/5 over a raised bass (dim 5 + minor 6) gives f;
   - an augmented 6th gives ff;
   - 4/2 gives mf;
   - 9/7 gives consonant-level ("no special emphasis").
   The global p and pp settings scale the classes down by one and two steps.
7. `messa-di-voce`: visual only (SVG envelopes, no audio for the swell). The keyboard substitutes can be played.

## 7. Notes on the content
- The `disagreements` topic is a central feature. Link to it from each topic whose rules include a contested point: appoggiatura, trill, triplets, inequality, dissonance-dynamics, keyboard-touch, keyboard-timekeeper. Use a small "Sources disagree →" link.
- **Page references:** Quantz refs are to Reilly's pages (1966), CPE refs to Mitchell's pages (1949), and BS and BO refs to their book pages. A § number appears only where it was checked; otherwise the ref gives the chapter and page.
- **`note` fields:** an example's `note` field records an assumption the pack author made, such as the 0.29/0.21 inequality split. Show it in small print under the example.

## 8. Done means
- All 30 topics render under the right filters.
- All 17 examples play on the harpsichord.
- The 7 tools pass their acceptance tests.
- Light and dark mode both work, with no horizontal page scroll at 360 px.
- `CONTENT_ISSUES.md` lists anything unclear.


## History background (added: merged from the History page)
The site has a new **History** tab, built from Christensen (ed.), *The Cambridge History of Western Music Theory* (2002). Where its technical content overlaps this tab, the technique now lives **here**, in `data/history-background.json` (types at the end of `schema/types.ts`). The History tab keeps the narrative and links to this tab.

**What to build**
- **Where each topic goes.** Render each topic as a collapsible "History background" panel at its `attachTo.ref`. Show its points, then the rules and guidelines under the usual Rule and Guideline badges with the `who` line, then the terms and tools. Finish with the quiz items, using the same quiz component as the rest of the tab.
- **Links.** Each panel ends with "Read the history →" links to `/history#<historyArticle>`, one for each id in `historyArticles`.
- **Sources.** Source refs are to the printed book (chapter and pages).

**Topics**
  - `bg-performance`: Performance, meter and rhetoric in the history of theory. Attach to `foundations` (Background to the Foundations and Rhythm groups.) · 1 rules, 4 guidelines, 8 terms, 0 quiz items.

**Tools**
  - none

Do not duplicate content that this tab already has. If a background rule restates one of this tab's own rules (for example Fux's four rules of motion), show it as historical lineage ("first stated by…") rather than as a second rule. Log any conflicts in `CONTENT_ISSUES.md`.
