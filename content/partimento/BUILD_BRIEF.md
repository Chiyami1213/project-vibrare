# Build brief: Partimento website — Schemata & Cadences pages

**Audience:** the coding assistant (Claude in VS Code) building the site. Read this file first, then `schema/types.ts`, then skim `data/*.json`.
**Owner's intent:** two separate pages/tabs — **Schemata** and **Cadences** — made of interactive tools for studying partimento. All musical content is already prepared in `data/`. Your job is UI, rendering, audio and interaction. Do not rewrite the musical content; if something looks wrong, surface it (see §7).

---

## 1. What is in this package

| Path | What it is |
|---|---|
| `data/schemata.json` | 13 groups, 58 patterns (moti del basso + galant schemata + Rule of the Octave + **suspensions** + **diminution**), 115 realized examples |
| `data/cadences.json` | 6 groups, 38 entries (terminology, clausulae, 2/3/4-part cadences, related formulas incl. Sanguinetti's cadenza lunga), 41 realized examples |
| `schema/types.ts` | TypeScript types for both files — import these |
| `tools/` | Python source of truth (`data_schemata.py`, `data_cadences.py`, `sanguinetti.py` — cross-check notes and additions from Sanguinetti — and `napoli.py` — additions and cross-checks from Durante's Regole and Partimenti diminuiti, Fenaroli's Books I–VI and Movimenti, Furno's Movimenti; both applied at build time) + realizer/checker (`realize.py`) + `build.py` that regenerates `data/` |
| `VERIFICATION.md` | What was cross-checked against which source, and the open questions for the owner |

Regenerate the JSON after editing the Python content: `python3 tools/build.py data` (no dependencies). The build prints any voice-leading problems; it must print none except `doubledLT` info lines listed in VERIFICATION.md.

## 2. Content model in one paragraph

A **Group** is a section of a page (e.g. "Moti del basso: disjunct"). A **Pattern** is one card: name, aliases, bass/melody degrees, a summary, **rules** (hard requirements) and **guidelines** (soft advice), one or more **examples**, optional **variants** (with or without their own examples), cross-links (`seeAlso`), sources and a verification status. An **Example** is a short score in a fixed key (C major, A minor or D minor) with every note already realized (`realized.voices`), plus the compact `notation` string it came from.

Guidelines starting with "(Sanguinetti)" come from the textbook, not the owner's notes — give them a small "textbook" tag. Patterns with `verification.status: "textbook-only"` (the Rule of the Octave group, two extra moti, cadenza lunga) were added from Sanguinetti: show a "not in notes" badge.

Keep the distinction between `rules` and `guidelines` visible everywhere (e.g. red "Rule" badge vs amber "Guideline" badge). It is a core study aid for the owner.

## 3. Pages

### 3.1 Schemata page (`/schemata`)
Order of groups = order in the JSON (it mirrors the owner's handwritten notes). Required tools:

1. **Pattern browser.** Left rail grouped by `groups`; filters for direction (ASC/DSC/static), mode (major/minor), texture (2/3/4 parts), function (opening, riposte, pre-cadential…), verification status. Search over `name` + `aka`. Deep link `#<pattern.id>`.
2. **Pattern card.** Header with name, aliases, a **degree strip** that shows the bass degrees (circled numerals) and melody degrees as two rows of chips; summary; Rules vs Guidelines lists; variants as collapsible sub-cards; sources as links; a small verification badge (`verified` / `partly` / `notes-only` / `flagged`) with the checks in a tooltip.
3. **Example player** (shared component, also used on the Cadences page):
   - Grand-staff rendering of `realized.voices` (bass in F clef; upper voices in G clef — 2 upper voices may share one staff, 3 upper voices: 2 + 1). Ties from `tie: true`. Durations from `d` × `beatUnit`.
   - **Figured bass** under the bass: build each slice's figure stack from the `fig` values of the upper voices sounding at that onset (reduce compound intervals > 9 except 9 itself: 10→3, 12→5, 13→6; sort descending; dedupe; keep accidentals and `+`).
   - **Circled bass degrees** under the figures (compute from bass pitch vs key).
   - **Playback** with a harpsichord sample (e.g. `smplr` Soundfont "harpsichord" or Tone.js Sampler). Tempo slider, loop, and a playhead that highlights the current slice.
   - **Step mode:** arrow keys move slice by slice; each step sounds the sonority and highlights it, so the "stages" of a schema can be walked.
   - **Transpose** to any key (use `tonal` for interval transposition and correct spelling) and switch major/minor when the pattern has both.
   - **Voice controls:** mute/solo per voice; "hide upper voices" turns the example into a partimento exercise (bass + figures only).
   - Show the example `caption` and any `review` note in a muted callout.
4. **Bass-motion explorer** (moti del basso): pick an interval pair (e.g. 4↓2↑, 3↓2↑, 5↑4↓ …) and a start degree; draw the bass and list the patterns whose `bass` matches, linking to their cards. Explain the metric-inversion idea from the "disjunct" group blurb (A→B ≠ B→A).
5. **Combination builder:** chain 2–4 pattern examples into one phrase (e.g. Romanesca → Prinner → Fonte), transpose to a common key, play continuously. Seed with the `romanesca-prinner` combination.
6. **Recognition quiz:** play a random example (bass + top voice only), ask for the schema name (4 choices from the same group); reveal the card on answer.

### 3.2 Cadences page (`/cadences`)
1. **Nomenclature builder** from the `nomenclature` entry: dropdowns (bass-motion family → perfect/imperfect → simple/compound/double → Galant/Neapolitan/discant/alto/tenor → half/Phrygian half). Output the full name + abbreviation (e.g. PCGC) and jump to the matching example when one exists.
2. **P–T–R grid** (preparation / tension / resolution): the owner's notes lay cadences out as a table with rows = type (simple, compound, double, Galant, Neapolitan, deceptive, Phrygian half) and columns = P, T, R. Render the `cad-2part`, `cad-3part`, `cad-4part` groups as such grids; each cell plays its part of the example.
3. **Clausulae mixer:** four voices, four clausulae (cantizans, altizans, tenorizans, basizans). The user chooses which clausula goes in the bass; the tool shows/plays the matching `clausulae-4part` example and names the resulting cadence. Show the conclusiveness ranking (weakest → strongest).
4. **Simple → compound → double morph:** for Fenaroli's three cadences, a toggle that animates the extra sonorities appearing on ⑤.
5. **Ear-training quiz** across cadence types.

## 4. Mini-notation (`example.notation`) — only needed if you add or edit examples
```
slice  = BASS ':' V1 ',' V2 [',' V3] ['@' beats]      (slices separated by spaces, bars by '|')
V      = upper voices TOP→BOTTOM, each an interval above the bass: [^][#|b|n]NUM[+][<|>]*   ('<'/'>' = octave below/above the nearest-note choice, used for leaps in diminutions)
         '^' tied from previous · '+' exact augmented interval · 'a-b(-c)' split the slice equally
         '.' hold previous pitch · '_' rest
BASS   = [#|b|n]DEG[<|>]*[~]    ('<'/'>' force octave, '~' tied/held display) · '.' = bass holds
```
Accidentals are relative to the key signature (A minor = natural minor; write `#7` for G♯). Example: `4:5,3 3:6,3 | 2:^7-6,3@2 | 1:8,3@2` = Prinner with 7–6.
`tools/realize.py` turns this into pitches (nearest-octave voice leading, no-crossing preference unless `cross: true`) and `check()` reports parallel 5ths/8ves and broken ties. If you need this in the browser, port `realize.py` (≈200 lines) to TypeScript; otherwise just render `realized`.

## 5. Specific data notes
5.1 `realized.voices[last]` is always the bass. Held bass notes appear as one long event.
5.2 `cadences.json` → pattern `nomenclature` has `nomenclature.bassMotion`, `.form`, `.grammar`, `.abbreviations` for the builder.
5.3 Patterns with no `examples` but `figures` text (e.g. chromatic 5–6, Stabat Mater Prinner, Marpurg cadence) should still render the figures string in a monospace "figures" box and show a "needs score" badge. Don't invent realizations.
5.4 `seeAlso` can cross tabs (e.g. `converging-cadence` ↔ `indugio`). Resolve ids across both files.

## 6. Tech defaults (adapt to the existing site if it already has a stack)
- Notation: VexFlow 4 (or abcjs if the site already uses ABC). Audio: Tone.js or `smplr` with a harpsichord soundfont; start audio only after a user gesture.
- Theory helpers: `tonal` (transposition, spelling, scale degrees).
- Both pages load their JSON statically; no backend needed.
- Accessibility: keyboard step mode, visible focus, figures readable by screen readers as text.
- Mobile: score scrolls horizontally inside its own container; the page must not.

## 7. Rules for you (the builder)
- **Don't change musical content silently.** If a realization looks wrong, add a UI flag and list it in a `CONTENT_ISSUES.md` for the owner.
- **Don't copy textbook prose.** Summaries are paraphrased; keep it that way. Cite with the `sources` fields (HCP section, Fenaroli rule, essaysonmusic.com URL, notes page).
- Show items whose `verification.status` is `notes-only` or `flagged`, and variants with `review`, with a small "check" badge so the owner can find them.
- Acceptance: every example renders, plays, transposes to F♯ major/E♭ minor without spelling errors, and the build prints no `par5`/`par8`/`tie` lines.

## Voice colouring (owner request, all score pages)
Every score must support **colouring each voice consistently**, the way the owner does in their handwritten notes, so that voice crossing and overlap are visible at a glance. Full spec: `VOICE_COLORS.md`, which covers the palette, voice paths, crossing markers, the per-pack voice mapping and acceptance tests. Build it into the shared Example player once, so the tonal, counterpoint, partimento and fugue pages all get it.


## 9. New groups: Suspensions, Rule of the Octave (Durante), Diminution
Added from the Neapolitan rule books (`tools/napoli.py`). They are all `textbook-only` (not from the owner's notes) and need the same "textbook" tag.
- **Suspensions** (`susp-*`): one card per dissonance (4th, 7th, 9th, bass 2nd), plus a principles card. Each example letter (a, b, c…) is one way of *preparing* the dissonance. Render the examples of a card as a small gallery in which each item is labelled with its preparation (its `title`). When an example plays, highlight the tied note and its resolution: `tie: true` events, and the next event in the same voice. **Tool suggestion:** "Suspension finder". Given a bass line (choose any example or type degrees), mark every bass step where a 4–3, 7–6 or 9–8 is possible according to the bass-motion rules in `susp-4th/7th/9th.rules`. This is the use of these rules the masters intended for unfigured basses.
- **Rule of the Octave**: the group now holds Fenaroli's scale (`ro-fenaroli`), Durante's earlier scale (`ro-durante`) and Durante's interval rules (`ro-bass-motion-rules`). **Tool suggestion:** a side-by-side "Durante vs Fenaroli" RO table, with one row per degree and a play button per cell, highlighting the degrees where they differ: ascending ②, ③, ④ and minor descending ⑥.
- **Diminution** (`dim-*`): two-part examples where the upper voice moves in sixteenths over a slow bass.
  - Use beams.
  - Show the figures only where the bass moves. Use the `fig` of the first upper note in each bass slice, or hide the figures row for `parts: 2` examples.
  - Examples whose `source` starts with "Durante, Partimenti diminuiti" are Durante's own diminutions, transposed. Show that attribution in full under the score.
  - **Tool suggestion:** "Plain ↔ diminished". `dim-plain` and `dim-lt-tonic` share the same bass ⑦→①. Offer a toggle that plays the plain realization, then Style 1, then Style 2.
- The two `doubledLT` info lines on `dd1-s1` and `dd1-s2` are melodic leading tones inside Durante's own figuration, not voice-leading errors. Do not flag them in the UI.
