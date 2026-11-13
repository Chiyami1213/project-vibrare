# HIP content pack (Historically Informed Performance)

This is a flute and keyboard performance-practice tab. It is built from:
- Quantz, *On Playing the Flute* (1752);
- C. P. E. Bach's *Essay* (1753/62);
- Badura-Skoda, *Interpreting Bach at the Keyboard* (1993);
- Bodky, *The Interpretation of Bach's Keyboard Works* (1960).

L. Mozart's violin *Treatise* is used only for cross-checking, and to map bowing onto flute breathing and tonguing and onto keyboard touch and "breathing".

**Contents:**
- 30 topics in 9 groups;
- 72 rules and 98 guidelines, each with page references;
- 17 playable examples (written vs performed);
- 7 tool specs.

## How to use it with Claude in VS Code
1. Copy this folder into your site repo, for example as `content/hip/`.
2. Paste this prompt:

> Read `content/hip/BUILD_BRIEF.md`, then `schema/types.ts`, then skim `data/hip.json`. Build the HIP tab in this site's stack, reusing the harpsichord player, the Rule/Guideline badges and the example components from the counterpoint, partimento, harmony and fugue tabs. Add the Flute / Keyboard filter, the "written vs performed" example player with the syllable, bowing and breath layers, and the disagreements table. Then build the tools in the brief's priority order, starting with the Quantz tempo calculator, the appoggiatura lab and the rhythm lab, and make each one pass its acceptance tests. Implement voice colouring as in `VOICE_COLORS.md` (HIP row). Don't change content; log questions in `CONTENT_ISSUES.md`. Show me a plan first.

## Files
- `BUILD_BRIEF.md`: the spec.
- `schema/types.ts`: the types.
- `data/hip.json`: the content.
- `VERIFICATION.md`: what was read, the cross-checks, and questions for you.
- `VOICE_COLORS.md`: the shared voice-colouring spec, with a new HIP row.
- `tools/build_hip.py`: the content source. Run `python3 tools/build_hip.py` to regenerate the data and rerun the checks.
- `tools/notes/`: reading notes with page references.


## Already built this tab? Add the History background only
> Read the "History background" section at the end of `BUILD_BRIEF.md` and the `HistoryBackgroundFile` types at the end of `schema/types.ts`, then `data/history-background.json`. Add the History background panels at each topic's `attachTo.ref` in the HIP tab, with "Read the history →" links to the History tab. Don't change existing content; log conflicts in `CONTENT_ISSUES.md`. Show me a plan first.
