# History content pack

This pack is the structure of the site's **History** page. Its first source is Christensen (ed.), *The Cambridge History of Western Music Theory* (CUP 2002).

**Contents:**
- 32 articles in 10 threads across 8 eras;
- 125 people;
- 132 dated works;
- 119 terms;
- 45 quiz questions;
- 2 tools.

Technique that overlapped the other tabs was moved to `data/history-background.json` in those packs (Counterpoint, Tonal harmony, Partimento, Fugue, HIP). This page links to it.

## How to use it with Claude in VS Code
1. Copy this folder into your site repo, for example to `content/history/`.
2. Paste this prompt:

> Read `content/history/BUILD_BRIEF.md`, then `schema/types.ts`, then skim `data/history.json`. Open `content/history/tools/guide/music-history.html` in a browser as the reference. Build the History tab in this site's stack with a data-driven structure (eras, threads, articles, people, works, events, terms) so I can keep adding content: the era map, the thread sections, the article layout with "Technique on other tabs" links into the Counterpoint, Tonal harmony, Partimento, Fugue and HIP tabs, the indexes and the quiz. Port the two tools (mensural, row-matrix) from `tools/guide/main.js`. Wire `tools/validate.py` into the build. Don't change content; log questions in `CONTENT_ISSUES.md`. Show me a plan first.

## Adding content later
Follow §5 of `BUILD_BRIEF.md`. Edit `data/history.json` (or your CMS), then run `python3 tools/validate.py`.

## Files
- `BUILD_BRIEF.md`: the spec, including how to extend the page.
- `schema/types.ts`: the entity model.
- `data/history.json`: the content.
- `VERIFICATION.md`: what was read, what moved where, choices made, and open questions.
- `VOICE_COLORS.md`: the shared spec.
- `tools/validate.py`: checks the data after edits.
- `tools/history_build.py` with `content_a.py`, `content_b.py`, `build_data.py`: regenerates this first source and the five tab overlays.
- `tools/guide/`: the reference page (`music-history.html`, `main.js`, `build_history.py`). Rebuilding needs the shared Fux/Mann page assets.
- `tools/notes/`: reading notes, chapter by chapter.
