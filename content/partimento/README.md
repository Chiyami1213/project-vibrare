# Partimento content pack: Schemata & Cadences

Built from your handwritten notes, cross-checked against IJzerman (HCP), Fenaroli Book III, the Generalbass-Compendium, essaysonmusic.com, Sanguinetti's *The Art of Partimento* (2012), and the Neapolitan primary sources: Durante's *Regole* and *Partimenti diminuiti*, Fenaroli's Books I–VI and *Movimenti*, and Furno's *Movimenti del Partimento*.

## How to use it with Claude in VS Code
1. Copy this whole folder into your website repo, e.g. as `content/partimento/`.
2. Open Claude in VS Code at the repo root and paste the prompt below.
3. To change content later, edit `tools/data_schemata.py`, `tools/data_cadences.py` or `tools/sanguinetti.py` / `tools/napoli.py` (textbook and primary-source additions), then run `python3 tools/build.py data`. The build re-voices the examples and re-checks them.

## Prompt to paste
> Read `content/partimento/BUILD_BRIEF.md`, then `content/partimento/schema/types.ts`, then skim `content/partimento/data/schemata.json` and `content/partimento/data/cadences.json`. Build the two pages described in the brief (Schemata and Cadences) inside this site's existing stack. Start with the shared Example Player component (score + figured bass + harpsichord playback + step mode + transpose), then the Schemata page, then the Cadences page. Also implement the voice-colouring option described in `VOICE_COLORS.md` (shared across all score pages). Don't change any musical content. Log anything that looks wrong in `CONTENT_ISSUES.md`. Show me a plan before writing code.

## Files
- `BUILD_BRIEF.md`: the spec for the builder (start here)
- `data/schemata.json`, `data/cadences.json`: the content (96 patterns, 156 realized examples)
- `schema/types.ts`: TypeScript types for the data
- `VERIFICATION.md`: what was checked, 12 items for you to review, plus the Sanguinetti cross-check (6 questions) and the Neapolitan-sources section (suspensions, Rule of the Octave, diminution; 4 questions)
- `tools/`: Python source of truth, plus the realizer and voice-leading checker
- `VOICE_COLORS.md`: spec for colouring each voice (shows voice crossing/overlap), shared by all score pages

## Already built these pages? Add voice colouring only
> Read `VOICE_COLORS.md` in this content folder. Add the voice-colouring option it describes to our shared Example player, so it works on every score page (harmony, counterpoint, partimento, fugue). That means the `Plain | Voices | …` control, a fixed colour per voice, voice-path lines, crossing/overlap markers, a legend and the tests in §6. Don't change musical content. Show me a plan first.

## Already built the partimento pages? Add the new groups only
> Read §9 of `BUILD_BRIEF.md` in this content folder. The schemata data now has two new groups, `suspensions` and `diminution`, plus two new Rule of the Octave patterns. Render them with the existing components, add the "textbook" tag, and build the tool suggestions in §9 if they fit our UI. The realizer's mini-notation also gained `<`/`>` on upper voices (§4). Don't change musical content. Show me a plan first.


## Already built this tab? Add the History background only
> Read the "History background" section at the end of `BUILD_BRIEF.md` and the `HistoryBackgroundFile` types at the end of `schema/types.ts`, then `data/history-background.json`. Add the History background panels at each topic's `attachTo.ref` in the Partimento tab, with "Read the history →" links to the History tab. Don't change existing content; log conflicts in `CONTENT_ISSUES.md`. Show me a plan first.
