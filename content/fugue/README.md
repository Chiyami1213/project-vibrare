# Fugue content pack (Theory + Analysis)

Theory is built from Alfred Mann's *The Study of Fugue*. Analysis is compiled from Roberts (2004), Badura-Skoda (1993; only the fugue chapters), Bodky (1960; only what bears on fugue subjects), Gedalge's academic-fugue plan, C. P. E. Bach's *Essay* (pedal point and accompanying fugues only), and Mann. The stand-alone study guide is `tools/guide/study-of-fugue.html`; it is published separately as your study artifact.

## How to use it with Claude in VS Code
1. Copy this folder into your site repo, e.g. `content/fugue/`.
2. Paste this prompt:

> Read `content/fugue/BUILD_BRIEF.md`, then `schema/types.ts`, then skim `data/fugue-theory.json` and `data/fugue-analysis.json`. Open `content/fugue/tools/guide/study-of-fugue.html` in a browser as the reference. Build the two fugue tabs (Theory and Analysis) in this site's stack, reusing the Example player and Rule/Guideline badges from the counterpoint, partimento and harmony pages. Port the tools in the priority order of the brief, starting with the answer generator, the stretto finder and the invertible-counterpoint calculator. Also implement the voice-colouring option described in `VOICE_COLORS.md`, with the fugue-specific "Entries" mode. Don't change content; log questions in `CONTENT_ISSUES.md`. Show me a plan first.

## Files
- `BUILD_BRIEF.md`: the spec. `schema/types.ts`: types. `data/`: the two content files.
- `VERIFICATION.md`: what was read and checked, plus questions for you.
- `VOICE_COLORS.md`: the shared voice-colouring spec.
- `tools/`: the guide source and the scripts that regenerate `data/`.
