# Tonal Harmony content pack (for the website)

Content for the tonal-harmony pages, structured by your Dr. B notes and checked against Aldwell/Schachter/Cadwallader 5e. It mirrors the partimento pack you already have.

## How to use it
1. Unzip into your website repo, e.g. as `content/tonal-harmony/`.
2. Open the repo in VS Code and paste this into Claude:

> Read `content/tonal-harmony/BUILD_BRIEF.md`, then `schema/types.ts`, then skim `data/index.json` and `data/part-p2.json`. Build the tonal-harmony pages described in the brief, reusing our partimento example player if it fits. Start with the shared Topic card and Example player, then the SATB checker (port `tools/satb.py` and use every example in `data/` as its test suite), then the remaining tools in the brief's priority order. Also implement the voice-colouring option described in `VOICE_COLORS.md` (shared across all score pages). Do not change musical content; log anything that looks wrong in `CONTENT_ISSUES.md`.

3. To edit content later, change `tools/data_p*.py` and run `python3 tools/build.py data` (no dependencies). It refuses to pass if a model example breaks a part-writing rule.

## Files
- `BUILD_BRIEF.md`: instructions for the coding assistant (pages, components, tools, acceptance tests)
- `OUTLINE.md`: every chapter and topic, with counts of rules, guidelines and examples
- `VERIFICATION.md`: sources, results, and 41 numbered questions for you
- `data/`: the generated JSON · `schema/types.ts`: its types · `tools/`: source of truth + checker
- `VOICE_COLORS.md`: spec for colouring each voice (shows voice crossing/overlap), shared by all score pages

## Already built these pages? Add voice colouring only
> Read `VOICE_COLORS.md` in this content folder. Add the voice-colouring option it describes to our shared Example player, so it works on every score page (harmony, counterpoint, partimento, fugue). That means the `Plain | Voices | …` control, a fixed colour per voice, voice-path lines, crossing/overlap markers, a legend and the tests in §6. Don't change musical content. Show me a plan first.
