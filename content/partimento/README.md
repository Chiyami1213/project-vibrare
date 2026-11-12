# Partimento content pack: Schemata & Cadences

Built from your handwritten notes, cross-checked against IJzerman (HCP), Fenaroli Book III, the Generalbass-Compendium and essaysonmusic.com.

## How to use it with Claude in VS Code
1. Copy this whole folder into your website repo, e.g. as `content/partimento/`.
2. Open Claude in VS Code at the repo root and paste the prompt below.
3. To change content later, edit `tools/data_schemata.py` or `tools/data_cadences.py`, then run `python3 tools/build.py data`. The build re-voices the examples and re-checks them.

## Prompt to paste
> Read `content/partimento/BUILD_BRIEF.md`, then `content/partimento/schema/types.ts`, then skim `content/partimento/data/schemata.json` and `content/partimento/data/cadences.json`. Build the two pages described in the brief (Schemata and Cadences) inside this site's existing stack. Start with the shared Example Player component (score + figured bass + harpsichord playback + step mode + transpose), then the Schemata page, then the Cadences page. Don't change any musical content. Log anything that looks wrong in `CONTENT_ISSUES.md`. Show me a plan before writing code.

## Files
- `BUILD_BRIEF.md`: the spec for the builder (start here)
- `data/schemata.json`, `data/cadences.json`: the content (80 patterns, 118 realized examples)
- `schema/types.ts`: TypeScript types for the data
- `VERIFICATION.md`: what was checked, and 12 items for you to review
- `tools/`: Python source of truth, plus the realizer and voice-leading checker
