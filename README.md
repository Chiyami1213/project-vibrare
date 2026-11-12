# Project Vibrare

A personal study notebook and archive about music: theory, analysis and arranging. It brings together notes,
small interactive tools, reference lists and a collection of arrangements.

Live site: <https://vibrare.pages.dev/>

## What is on the site

| Section | Contents |
| :-- | :-- |
| **Theory** | Tonal Harmony, Partimento (Moti del Basso and Schemata with playable scores; Cadences to come), Counterpoint, Jazz. Several of these are still being written; see [Status](#status). |
| **Analysis** | *Bach's Fugue*: the 48 preludes and fugues of *The Well-Tempered Clavier* (BWV 846 to 893) with keys and fugue voice counts. *Touhou Project*: the numbered games Th06 to Th20 (15 games, 271 tracks), each with its OST and where every track is used. *Japanese Music*: not written yet. |
| **Tools** | Interval and scale calculators that show the notes on a staff; a chord calculator with inversions, a piano keyboard, playback and shareable links; an interactive circle of fifths with a rainbow colour scheme that draws a chord's shape (triangle, square, and so on). Notes are spelled the way a musician would write them. |
| **Works** | Arrangements by category: Anime, Commissions, Concert Band, Flute, Ghibli, Touhou Project, Vocaloid, VTubers, Miscellaneous. The lists are empty for now. |
| **Glossary** | Searchable music-theory terms. |
| **Resources** | Books, websites, videos and software for further study. |
| **About, Settings** | What the site is, and the theme and audio settings. |

The menu is a drill-down: clicking a top-level tab shows that tab with its sub-tabs, and a back arrow at the top
returns to the main list.

## Content and sources

- **Touhou track lists** are compiled from Japanese Wikipedia (CC BY-SA 4.0) and cross-checked against
  [thwiki.cc](https://thwiki.cc/) and the [ZUN Music Database Wiki](https://w.atwiki.jp/tohomusicdb/).
  Corrections found by comparing the sources are recorded in the data and covered by tests.
- **The Well-Tempered Clavier list** follows the English and German Wikipedia articles (CC BY-SA 4.0).
- **Instrument sounds** for the partimento player and the chord tools, chosen in Settings: an Italian and a Flemish
  harpsichord, a Steinway and a Kawai grand piano, and a Renaissance-style organ, all from the
  [Versilian Community Sample Library](https://github.com/sgossner/VCSL) (CC0), trimmed and converted to small
  MP3 files and hosted with the site (see `public/audio/README.txt`).
- **Partimento content pack** (`content/partimento/`): 80 patterns and 118 realized examples (moti del basso,
  schemata and cadences), with the Python source that generates the JSON and checks the voice leading.
  Summaries are paraphrased and cite their sources (Gjerdingen, IJzerman, Fenaroli, essaysonmusic.com and the
  author's own notes).
- The calculators are modelled on the features of [musictheory.net](https://www.musictheory.net/tools) and
  [ToneGym](https://www.tonegym.co/); the code and data here are original.

## Status

- Done: menu, themes and audio settings, glossary, resources, About, the Touhou Project OST pages, the Bach
  list, the interval, scale and chord calculators (with staff notation), the circle of fifths, and the Partimento
  Moti del Basso and Schemata pages: 43 patterns, each with rules, guidelines, variants and playable scores
  (figured bass, harpsichord, step mode, transposition, exercise mode).
- In progress: the Partimento Cadences page.
- Not started: Tonal Harmony, Counterpoint, Jazz and Japanese Music notes; the Works lists.

## Privacy

The site has no accounts and adds no analytics or cookies of its own. The theme and audio settings are stored
only in the visitor's own browser. (The hosting provider's own settings are separate from this repository.)
The repository is public, so nothing private belongs in it.

## Disclaimer

Touhou Project and its music belong to ZUN and Team Shanghai Alice. This is an unofficial fan project for
study and analysis, and it does not host any of the original recordings.
