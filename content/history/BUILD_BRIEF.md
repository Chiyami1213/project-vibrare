# BUILD BRIEF: History tab

## 1. Goal
Build the site's **History** page. It is the structure the owner will keep adding to. For now it holds one source, Christensen (ed.), *The Cambridge History of Western Music Theory* (2002), as 32 articles. Technique that overlaps other tabs has been **moved to those tabs**: each of them now has a `data/history-background.json`. This page keeps the narrative (who, when, what changed) and links out with green "Technique on other tabs" chips.

Content is in `data/history.json` and the types are in `schema/types.ts`. The working reference is `tools/guide/music-history.html`; open it in a browser. Do not rewrite the content; log issues in `CONTENT_ISSUES.md`.

## 2. Information architecture (keep this; it is the owner's structure)
- **Eras** are chronological bands. **Threads** are thematic strands. Every **article** has one thread and a span of years that places it in one or more eras.
- **People, works, events and terms** are separate entities. Articles reference them by id, so one person or treatise can appear in many articles and in the indexes.
- **Sources** are listed once. Every article carries `sourceRefs` (source id, chapter, pages, author). Later sources add new articles or extra `sourceRefs` on existing ones.

## 3. Pages and components
- **History home**: the intro (`scope`), then the **era map**, then the threads, each with its articles in order. Port `eraMap()` from `tools/guide/main.js`: every era is drawn at equal width, bars are placed by `span`, a lane is chosen so labels don't overlap, and tapping a bar opens the article.
- **Article page or section** (`/history#<id>`, or `/history/<id>` if you prefer routes, but keep the `#id` anchors working). Render in this order:
  1. Thread and span.
  2. Title, with era chips.
  3. Source line.
  4. Summary.
  5. Key points.
  6. **Technique on other tabs**: chips that link to `/<tab>#<topic>`; those panels are defined in each tab's `history-background.json`.
  7. Rules (only where present), as "Rules as stated".
  8. A people and treatises table.
  9. Terms.
  10. Tools.
  11. Quick check.
- **Indexes**:
  - Timeline: works plus events, filtered by era, with search.
  - People.
  - Glossary: each term shows a green chip for the tab where it is taught (`taughtIn`).
  - Review quiz, filtered by thread.
- **Cross-links.** Other tabs link back to `/history#<articleId>` through `historyArticles`. Keep those ids stable.

## 4. Tools on this page
Only two tools belong here; the other seven moved with their technique.
- **`mensural`**: rhythmic modes and mensuration. Reference: `mensuralTool()`.
- **`row-matrix`**: the twelve-tone matrix. Reference: `rowTool()`. It is parked here until a 20th-century techniques tab exists.

Both tools use the shared harpsichord. Their tests are in `tools[]`.

## 5. Adding content later (keep this working)
- **New source.** Add it to `sources`. Then either add new articles, or add a `sourceRefs` entry to an existing article and extend its points.
- **New article.**
  - Pick a `thread`, set the `span`, and derive `eras` from it.
  - Write the `summary` and `points`.
  - Reference existing people, works and terms by id, adding new ones as needed.
  - Set `status` to `stub`, `survey` or `full`.
- **New composer or event.** Add a `people` or `events` entry and reference it from an article. The timeline merges works and events.
- **New era or thread.** Add the entry. The map and the table of contents are data-driven; hard-coded lists are not allowed.
- **Run `python3 tools/validate.py`** after every edit, and treat its exit code as the gate. It checks unique ids, references, eras and quiz answers.
- **CMS option.** If the site has a CMS, map these entities one-to-one to collections.
- **Regenerating from the source scripts.** `tools/history_build.py` regenerates `history.json` and the five tab overlays from `content_a.py` and `content_b.py`. Use it only to rebuild this first source. Hand-edit the JSON for new material.

## 6. Shared conventions
- **Harpsichord and notation.** Use the same harpsichord and notation components as the other tabs.
- **Badges.** Use the same Rule/Guideline badges as the other tabs.
- **Theme.** Support dark mode.
- **Small screens.** The era map scrolls horizontally inside its own container at 360 px.

## 7. Done means
- All 32 articles render in their threads, and the era map links to them.
- The indexes search correctly.
- Every green chip opens the right panel on the other tab.
- The two tools pass their tests.
- `validate.py` passes.
