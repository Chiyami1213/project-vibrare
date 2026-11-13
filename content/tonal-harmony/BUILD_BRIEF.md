# Build brief: Tonal Harmony pages

**Audience:** the coding assistant (Claude in VS Code) building the site. Read this file first, then `schema/types.ts`, then skim `data/index.json` and one `data/part-*.json`.

**Owner's intent:** a set of tonal-harmony pages made of interactive study tools. The outline follows the owner's notes on Dr. B's video series (Parts I–VI, Chapters 0–22). All musical content is already prepared in `data/`. Your job is UI, rendering, audio and interaction. Do not rewrite the musical content. If something looks wrong, report it (see §8).

This is a sister package to the partimento pack (Schemata / Cadences). Reuse its example player if it already exists. The data shapes are close, but they are not identical (§4).

---

## 1. What is in this package

| Path | What it is |
|---|---|
| `data/index.json` | Parts, chapters, the 47 video lessons (with YouTube links), the 30 tool specs, checker levels, voice ranges |
| `data/part-p1.json` | Part I Fundamentals: Ch. 0–4 (26 topics, 17 examples) |
| `data/part-p2.json` | Part II Part Writing & Voice Leading: Ch. 5–8 (15 topics, 45 examples) |
| `data/part-p3.json` | Part III Dominant Chords: Ch. 9–13 (11 topics, 48 examples) |
| `data/part-p5.json` | Part V Predominant Chords: Ch. 14–15 (5 topics, 11 examples). The notes have no Part IV, so keep the owner's numbering. |
| `data/part-p6.json` | Part VI Chromaticism & Dissonance: Ch. 16–22 (17 topics, 33 examples) |
| `schema/types.ts` | TypeScript types for every file. Import them. |
| `tools/` | Python source of truth: `data_p*.py` (content), `burstein.py` (second-textbook cross-check, applied at build time), `index_data.py`, `satb.py` (parser and part-writing checker), `build.py`, `report.py` |
| `OUTLINE.md` | The topic tree, generated from the data |
| `VERIFICATION.md` | What was cross-checked against which source, plus 41 open questions for the owner |

Totals: 74 topics and 154 notated examples. The examples break down as 107 correct models, 22 deliberate-error examples, 17 demos and 8 single-line scales or melodies.

Regenerate after editing content: `python3 tools/build.py data`. There are no dependencies. The build exits with code 1 and prints `PROBLEM` lines if:
- a model example breaks a part-writing rule;
- an error example does not show its intended fault, or shows an extra one;
- a `seeAlso` or tool id does not resolve.

## 2. Content model

**Part → Chapter → Topic.** A topic is one card or section. It has:
- `summary`
- optional `terms`
- `rules` (HARD) and `guidelines` (SOFT)
- `tables` (structured; render them as real tables)
- `examples` (notated, playable)
- `tools` (ids of interactive widgets to embed)
- `seeAlso`
- `sources` (notes page, `textbook` = Aldwell/Schachter 5e unit, `textbook2` = Burstein & Straus 2e chapter, video lesson numbers)
- `verification` (status, checks and flags)

Keep **Rules vs Guidelines** visually distinct everywhere, for example a red "Rule" badge and an amber "Guideline" badge. The owner asked for this distinction explicitly. Guidelines that start with "(Burstein)" come from the second textbook, not the notes — show them with a small "textbook" tag.

## 3. Pages

Suggested routes (adapt to the site): `/harmony` (overview), then one page per Part (`/harmony/fundamentals`, `/harmony/voice-leading`, `/harmony/dominant`, `/harmony/predominant`, `/harmony/chromatic`). Within each page, add a chapter sub-nav and deep links `#<topic.id>`.

On every chapter header, show:
- the chapter title;
- the notes pages;
- the **video lessons** as small cards. Use `index.lessons`, filtered by `chapter.video`. Each card shows the title and opens `url`. The playlist link is in `tools/index_data.py` (`PLAYLIST`). Lessons 19 and 24 have no confirmed title, so show "Lesson 19" with the playlist link.

### 3.1 Shared components
1. **Topic card.** It contains:
   - the title;
   - a kind chip (concept / table / procedure / progression / checklist / form);
   - the summary;
   - the terms as a definition list;
   - the rules and guidelines (badged as in §2);
   - the tables;
   - the examples, each in an Example player;
   - the embedded tools;
   - a sources footer (notes page, textbook unit, lesson links);
   - a verification badge. Hovering it shows `checks`. When `flags` is non-empty, show a "check ⚑" badge that lists the flags.
2. **Example player** (VexFlow or the partimento player):
   - **Staves.**
     - 4 voices: grand staff, with S and A in treble (S stems up, A down) and T and B in bass (T up, B down).
     - 3 voices: S and A in treble, B in bass.
     - 2 voices: treble plus bass, or a single treble when both voices are high.
     - 1 voice: treble.
   - **Key and meter.** Key signature from `key` (upper case = major, lower case = minor). Meter from `meter`. Durations come from `d` × `beatUnit`. Barlines go every bar of the meter. `realized.slices[].bar` gives explicit barlines where the notation had `|`.
   - **Accidentals and ties.** Spell accidentals from `pitch` relative to the key signature. Honour `natural: true`. Draw ties from `tie: true`.
   - **Analysis rows under the bass.** Three rows:
     - the Roman numeral `label`. Render `6/5`, `4/3` and `6/4` as stacked figures, and keep the `/V` secondary part on the same line. `I=IV` means pivot (old key = new key), so render it as two stacked labels.
     - the computed `figures`;
     - `bassDegree` as a scale-degree caret.
     Any row can be toggled off.
   - **Audio and playback.**
     - Harpsichord sample (smplr Soundfont "harpsichord" or a Tone.js Sampler), same as the partimento pages. Optional piano toggle.
     - Tempo, loop, a playhead, and step mode with arrow keys (each step sounds the chord and highlights it).
     - Mute or solo each voice.
     - Transpose: use `tonal` and preserve spelling. Minor stays minor.
     - **Colour mode:** the chordal 7th in green and the leading tone in red, as in the owner's notes. Compute them from `slices[].root` and the label: V-type label → 3rd = LT; vii-type → root = LT.
   - **Checker overlay.** If `checker` is present, draw a coloured marker at `beat` on the listed voices, using `level` as the colour (white/blue/green/yellow/orange/red) and `detail` as a tooltip. For `intent: "error"` examples, show the overlay by default and give the card a red "faulty on purpose" ribbon. Show the `caption` under the player.
   - **Hide-upper-voices mode** turns a model into an exercise: bass, figures and soprano only.
3. **Tables.** Make them sortable where it makes sense. Wrap them horizontally on mobile, inside their own scroll box.

### 3.2 Tools (`index.tools`)
Each tool has an `id`, `title`, `chapters` and a one-paragraph `spec`. Build them as embeddable components and mount them where `topic.tools` lists them. In priority order:
1. `satb-checker`: four-voice editor plus the checker ported from `tools/satb.py` (≈480 lines including comments; §5). This is the most important tool. Students write a progression and get colour-coded feedback using the notes' p.20 checklist levels.
2. `progression-chart`, `interval-lab`, `scale-builder`, `chord-builder`, `inversion-table`, `secondary-calculator`, `chromatic-builder`, `pivot-finder`.
3. The rest (`tuning-lab`, `overtone-player`, `meter-lab`, `form-diagrams`, …).

`error-gallery` is a page section, not a widget. It collects every `intent: "error"` example, grouped by checker level, so the checklist can be studied by ear.

## 4. Example notation (`example.notation`): only needed if you add or edit examples
```
slice  = [LABEL ':'] VOICE (',' VOICE)* ['@' BEATS]     slices separated by spaces; '|' = barline token
VOICE  = top → bottom (S,A,T,B), each:
         PITCH        C5, F#4, Bb3, F##4, En4 (explicit natural)
         ~PITCH       tied from the previous note of this voice
         -            hold (no new attack)        _   rest
         P1.P2[.P3]   split the slice equally inside this voice (non-chord tones)
         !P1.P2       first sub-note is an accented NCT (suspension/appoggiatura); analysis uses P2
LABEL  = Roman numeral or analysis text without ':' or ','
```
Example: `ii6:A4,F4,D4,F3 V:G4,D4,B3,G3@2` (ii6 for one beat, then V for two).

Unlike the partimento pack, pitches are absolute, not intervals above the bass. That makes the four-part voicing exact.

## 5. The checker (`tools/satb.py` → port to TypeScript)
`check(realize(notation), allow)` returns issues `{type, level, beat, voices, detail}`. The checks:
- range and spacing (S–A ≤ P8, A–T ≤ P8, T–B ≤ P12 — the notes' limits);
- voice crossing and overlap;
- leap > M6 in the upper voices; any leap > P8; augmented melodic intervals;
- parallel P1/P5/P8; consecutive P5/P8 in contrary motion; hidden P5/P8 in the outer voices when the soprano leaps; unequal fifths (d5→P5 against the bass);
- doubled leading tone; root-position doubling; 6/4 doubling;
- chordal 7th must step down. Delayed resolutions are allowed: a held note, or a chromatic raise such as A♭→A♮ (notes p.40). A 7th approached by a descending leap is flagged.
- the leading tone in the soprano or bass must rise. A chromatic B→B♭ (becoming the next 7th) is allowed, per notes p.38.
- vii° in root position;
- 6/4 bass approached or left by leap (a cadential 6/4 may be approached by leap);
- augmented 6th must expand to an octave.

Chord roots and members are found from the pitches (tertian stacking by letter name). Leading tones are identified from the label (V… → 3rd, vii… → root), so secondary chords work automatically.

The TypeScript port must reproduce the build's results: zero issues for every `model` example and exactly the `expect` types for every `error` example. Use that as the unit-test suite. Loop over all examples in `data/`.

## 6. Tech defaults (adapt to the existing stack)
- Notation: VexFlow 4. Theory helpers: `tonal`. Audio: `smplr` (harpsichord) or Tone.js, started after a user gesture.
- All data is static JSON. No backend.
- Accessibility: keyboard step mode, visible focus, analysis rows readable as text, colour never the only cue (add icons or labels to the checker markers).
- Mobile: scores and tables scroll horizontally inside their own containers. The page itself must not scroll sideways.

## 7. Acceptance criteria
- Every topic renders, with its rules/guidelines badges, tables, sources and verification badge.
- Every example renders and plays. Each transposes to F♯ major / E♭ minor (or their equivalents) without spelling errors.
- The ported checker reproduces the Python results on all 154 examples (§5).
- Video lesson links appear on each chapter. `seeAlso` links resolve across part files.
- `python3 tools/build.py data` prints only the summary line.

## 8. Rules for you (the builder)
- **Do not change musical content silently.** If an example or rule looks wrong, add a visible "check" flag in the UI and list it in `CONTENT_ISSUES.md` for the owner.
- **Do not copy textbook prose.** The summaries are paraphrased. Cite with the `sources` fields.
- Topics whose `verification.status` is not `verified`, and topics with `flags`, need a small "check ⚑" badge so the owner can find them.
- Examples marked `source: "voiced by the builder"` were composed to illustrate the notes' chord progressions. Keep that attribution visible in a tooltip.

## Voice colouring (owner request, all score pages)
Every score must support **colouring each voice consistently**, the way the owner does in their handwritten notes, so that voice crossing and overlap are visible at a glance. Full spec: `VOICE_COLORS.md`, which covers the palette, voice paths, crossing markers, the per-pack voice mapping and acceptance tests. Build it into the shared Example player once, so the tonal, counterpoint, partimento and fugue pages all get it.


## History background (added: merged from the History page)
The site has a new **History** tab, built from Christensen (ed.), *The Cambridge History of Western Music Theory* (2002). Where its technical content overlaps this tab, the technique now lives **here**, in `data/history-background.json` (types at the end of `schema/types.ts`). The History tab keeps the narrative and links to this tab.

**What to build**
- **Where each topic goes.** Render each topic as a collapsible "History background" panel at its `attachTo.ref`. Show its points, then the rules and guidelines under the usual Rule and Guideline badges with the `who` line, then the terms and tools. Finish with the quiz items, using the same quiz component as the rest of the tab.
- **Links.** Each panel ends with "Read the history →" links to `/history#<historyArticle>`, one for each id in `historyArticles`.
- **Sources.** Source refs are to the printed book (chapter and pages).

**Topics**
  - `bg-tuning`: Tuning, temperament and consonance in history. Attach to `ch0` (Extends the tools tuning-lab, overtone-player and consonance-ladder.) · 9 rules, 0 guidelines, 17 terms, 5 quiz items, tools: `tuning-lab`.
  - `bg-keys`: From modes to keys. Attach to `ch1` (Background to keys, scales and modes.) · 1 rules, 0 guidelines, 0 terms, 0 quiz items.
  - `bg-rameau`: Rameau: roots, inversion and the fundamental bass. Attach to `ch7` (Background to chords and their inversions (ch4, ch7).) · 3 rules, 1 guidelines, 5 terms, 2 quiz items, tools: `fundamental-bass`.
  - `bg-functions`: Roman numerals, functions and dualism. Attach to `ch4` (Where Roman numerals (Weber) and function labels (Riemann) come from.) · 3 rules, 1 guidelines, 7 terms, 3 quiz items, tools: `tonnetz`.
  - `bg-schenker`: Schenker: levels and the Ursatz. Attach to `ch5` (Background to voice leading.) · 2 rules, 0 guidelines, 5 terms, 2 quiz items, tools: `ursatz`.

**Tools**
  - `tuning-lab`: Monochord & tuning lab. **Extend the existing `tuning-lab` tool** with this spec rather than adding a second tool. Reference: `tools/history-tools.js → tuningLab()`. Tests: ¼-comma meantone: C–E = 386.3 c, every fifth 696.6 c, G♯–E♭ wolf ≈ 737.6 c; Pythagorean: C–E = 407.8 c; fifth G♯–E♭ ≈ 678.5 c; Equal: every interval a multiple of 100 c
  - `fundamental-bass`: Rameau's fundamental bass. Reference: `tools/history-tools.js → fbTool()`. Tests: C–E–G → root C; E–G–C → root C (inversion); G–B–D–F → root G, seventh F resolves down; F–A–C–D → double emploi
  - `tonnetz`: Tonnetz & Riemann transformations. Reference: `tools/history-tools.js → tonnetzTool()`. Tests: C+ R → a−; C+ L → e−; C+ P → c−; C+ R then L → F+; Alternating P and L returns to C+ after 6 moves (hexatonic cycle)
  - `ursatz`: Ursatz viewer. Reference: `tools/history-tools.js → ursatzTool()`. Tests: 3-line in C: E–D–C over C–G–C; 5-line: G–F–E–D–C, with V under ②; Interruption: E–D ‖ E–D–C

Do not duplicate content that this tab already has. If a background rule restates one of this tab's own rules (for example Fux's four rules of motion), show it as historical lineage ("first stated by…") rather than as a second rule. Log any conflicts in `CONTENT_ISSUES.md`.
