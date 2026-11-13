# Counterpoint (Fux) content pack

The Fux *Gradus ad Parnassum* study guide, converted into website content: chapters, rules vs guidelines, figure notes, examples and the rule engine.

## How to use it
1. Copy this folder into your site repo, e.g. `content/counterpoint/`.
2. In VS Code, paste to Claude:

> Read `content/counterpoint/BUILD_BRIEF.md`, then `schema/types.ts`, then skim `data/fux.json`. Build the `/counterpoint` page described in the brief using this site's stack and the example player we already use for partimento and harmony. Port the rule engine (`engine/fux-engine.js`) as a module and use each example's `engineResult` as a unit test. Also implement the voice-colouring option in `VOICE_COLORS.md` (shared across all score pages). Don't change musical content; log questions in `CONTENT_ISSUES.md`. Show me a plan first.

## Files
- `BUILD_BRIEF.md` — the spec · `schema/types.ts` — types · `data/fux.json` — the content
- `engine/` — rule engine + the original UI code (reference) · `tools/` — the original guide and the extract scripts
- `VERIFICATION.md` — where the content comes from and how it was checked
- `VOICE_COLORS.md`: spec for colouring each voice (shows voice crossing/overlap), shared by all score pages

## Already built these pages? Add voice colouring only
> Read `VOICE_COLORS.md` in this content folder. Add the voice-colouring option it describes to our shared Example player, so it works on every score page (harmony, counterpoint, partimento, fugue). That means the `Plain | Voices | …` control, a fixed colour per voice, voice-path lines, crossing/overlap markers, a legend and the tests in §6. Don't change musical content. Show me a plan first.


## Already built this tab? Add the History background only
> Read the "History background" section at the end of `BUILD_BRIEF.md` and the `HistoryBackgroundFile` types at the end of `schema/types.ts`, then `data/history-background.json`. Add the History background panels at each topic's `attachTo.ref` in the Counterpoint (Fux) tab, with "Read the history →" links to the History tab. Port or extend the tools listed there from `tools/history-tools.js` and make them pass their tests. Don't change existing content; log conflicts in `CONTENT_ISSUES.md`. Show me a plan first.
