# Project Vibrare

A personal study notebook and archive about music: theory, analysis and arranging. It brings together notes,
small interactive tools, reference lists and a collection of arrangements.

Live site: <https://vibrare.pages.dev/>

## What is on the site

| Section | Contents |
| :-- | :-- |
| **Theory** | Tonal Harmony, Partimento (Moti del Basso, Schemata, Cadences), Counterpoint, Jazz. Several of these are still being written; see [Status](#status). |
| **Analysis** | *Bach's Fugue*: the 48 preludes and fugues of *The Well-Tempered Clavier* (BWV 846 to 893) with keys and fugue voice counts. *Touhou Project*: the numbered games Th06 to Th20 (15 games, 271 tracks), each with its OST and where every track is used. *Japanese Music*: not written yet. |
| **Tools** | Interval, scale and chord calculators with correct note spelling; a chord calculator with inversions, a piano keyboard, playback and shareable links; an interactive circle of fifths with a rainbow colour scheme that draws a chord's shape (triangle, square, and so on). |
| **Works** | Arrangements by category: Anime, Commissions, Concert Band, Flute, Ghibli, Touhou Project, Vocaloid, VTubers, Miscellaneous. The lists are empty for now. |
| **Glossary** | Searchable music-theory terms. |
| **Resources** | Books, websites, videos and software for further study. |
| **About, Settings** | What the site is, and the light / dark / device theme setting. |

The menu is a drill-down: clicking a top-level tab shows that tab with its sub-tabs, and a back arrow at the top
returns to the main list.

## Built with

- [Astro](https://astro.build) (static output), TypeScript, plain CSS. No UI framework.
- All the music-theory logic (note spelling, scales, chords, inversions, circle of fifths, chord shapes) is
  written in this repo as plain TypeScript functions and covered by unit tests.
- Chord playback uses the browser's Web Audio API; nothing is downloaded.
- Hosted on Cloudflare Pages. Every push to `main` redeploys the site.

## Run it locally

Requires Node.js 22.23.4 or newer.

```sh
npm install
npm run dev       # local dev server at http://localhost:4321
npm test          # unit tests (node:test)
npm run build     # production build into ./dist/
npm run preview   # preview the production build
```

## Project structure

```text
src/
  layouts/        page layout and the drill-down menu definition (Layout.astro)
  components/     menu item, note selector, partimento components
  pages/          one file per route (theory/, analysis/, tools/, works/, ...)
  scripts/        music-theory logic and small browser helpers (tested)
  data/           editable content: glossary, resources, works, Touhou OSTs, Bach WTC
  styles/         global.css (light/dark themes, menu, components)
content/
  partimento/     partimento content pack: JSON data, Python tools, notes (see below)
tests/            unit tests for the theory, chord, circle, Touhou, Bach and Works data
public/           favicon
```

Adding a menu item or sub-tab is one entry in the `top` list in `src/layouts/Layout.astro`
(icons are in `src/components/MenuItem.astro`). Page content for the Glossary, Resources and Works lives in
`src/data/`, so it can be edited without touching page code.

## Content and sources

- **Touhou track lists** are compiled from Japanese Wikipedia (CC BY-SA 4.0) and cross-checked against
  [thwiki.cc](https://thwiki.cc/) and the [ZUN Music Database Wiki](https://w.atwiki.jp/tohomusicdb/).
  Corrections found by comparing the sources are recorded in the data and covered by tests.
- **The Well-Tempered Clavier list** follows the English and German Wikipedia articles (CC BY-SA 4.0).
- **Partimento content pack** (`content/partimento/`): 80 patterns and 118 realized examples (moti del basso,
  schemata and cadences), with the Python source that generates the JSON and checks the voice leading
  (`python tools/build.py data`). Summaries are paraphrased and cite their sources (Gjerdingen, IJzerman,
  Fenaroli, essaysonmusic.com and the author's own notes).
- The calculators are modelled on the features of [musictheory.net](https://www.musictheory.net/tools) and
  [ToneGym](https://www.tonegym.co/); the code and data here are original.

## Status

- Done: menu, themes, glossary, resources, About, the Touhou Project OST pages, the Bach list, the interval,
  scale and chord calculators and the circle of fifths.
- In progress: the Partimento pages (overview pages, pattern cards and a playable score player), and showing
  notes on a staff in the interval and scale calculators.
- Not started: Tonal Harmony, Counterpoint, Jazz and Japanese Music notes; the Works lists.

## Privacy

The site has no accounts and adds no analytics or cookies of its own. The theme choice is stored only in the visitor's own browser.
(The hosting provider's own settings are separate from this repository.)
The repository is public, so nothing private belongs in it.

## Disclaimer

Touhou Project and its music belong to ZUN and Team Shanghai Alice. This is an unofficial fan project for
study and analysis, and it does not host any of the original recordings.
