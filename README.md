# Project Vibrare

A personal study notebook and archive about music: theory, analysis and arranging. It brings together notes,
small interactive tools, reference lists and a collection of arrangements.

Live site: <https://vibrare.pages.dev/>

## What is on the site

| Section | Contents |
| :-- | :-- |
| **Theory** | *Tonal Harmony* (74 topics and 154 playable scores, from the owner's notes on Dr. B's lessons), *Partimento* (96 patterns and 156 playable scores in six pages: Moti del Basso, Schemata, Cadences, Rule of the Octave, Suspension and Diminution; and *Fugue*, with Mann's theory and an analysis guide), *Counterpoint* (Fux's *Gradus ad Parnassum*, with 22 playable examples), *HIP* (historically informed performance for flute and keyboard, with 17 playable examples), *Jazz* and *Music History* (not written yet). Each rule and guideline is badged apart. See [Status](#status). |
| **Analysis** | *Baroque*: *Bach* lists the 48 preludes and fugues of *The Well-Tempered Clavier* (BWV 846 to 893) with keys and fugue voice counts; *Quantz* and *Blavet* are not written yet. *Touhou Project*: the numbered games Th06 to Th20 (15 games, 271 tracks), each with its OST, where every track is used, and its BPM and key where the wiki below has them. *Japanese Music*: not written yet. |
| **Tools** | Interval and scale calculators that show the notes on a staff; a chord calculator with inversions, a piano keyboard, playback and shareable links; an interactive circle of fifths with a rainbow colour scheme that draws a chord's shape (triangle, square, and so on). Notes are spelled the way a musician would write them. |
| **Works** | Arrangements by category: Anime, Commissions, Concert Band, Flute, Ghibli, Touhou Project, Vocaloid, VTubers, Miscellaneous. Three arrangements are listed so far. |
| **Glossary** | Searchable music-theory terms. |
| **Resources** | Books, websites, videos and software for further study. |
| **About, Settings** | What the site is, and the theme and audio settings. |

The menu is a drill-down: clicking a top-level tab shows that tab with its sub-tabs, and a back arrow at the top
returns to the main list.

## Content and sources

- **Touhou track lists** are compiled from Japanese Wikipedia (CC BY-SA 4.0) and cross-checked against
  [thwiki.cc](https://thwiki.cc/) and the [ZUN Music Database Wiki](https://w.atwiki.jp/tohomusicdb/).
- **Touhou BPM and keys** come from the BPM and key tables of that same wiki. The BPM is the maximum tempo it lists
  (two values where it lists two) and the keys are named as the wiki names them, in the order they are heard.
  The wiki has an entry for 163 of the 271 tracks (BPM) and 140 (key), so some tracks, mostly from Th15 onward, have
  none. One typo in the source (a key range written "1;45") is corrected.
  Corrections found by comparing the sources are recorded in the data and covered by tests.
- **The Well-Tempered Clavier list** follows the English and German Wikipedia articles (CC BY-SA 4.0).
- **Instrument sounds** for the partimento player and the chord tools, chosen in Settings: an Italian and a Flemish
  harpsichord and a French one, a Steinway and a Kawai grand piano and a Yamaha upright, and three organs, all from the
  [Versilian Community Sample Library](https://github.com/sgossner/VCSL) (CC0), trimmed and converted to small
  MP3 files and hosted with the site (see `public/audio/README.txt`).
- **Content packs** in `content/`, each with its brief, its verification notes and the source that generates its data.
  Summaries are paraphrased and cite their sources.
  - `partimento/`: 96 patterns and 156 realized examples (moti del basso, schemata, cadences, rule of the octave,
    suspensions, diminution), after the author's notes, Gjerdingen, IJzerman, Fenaroli, Sanguinetti, Durante, Furno
    and essaysonmusic.com.
  - `tonal-harmony/`: 74 topics and 154 notated examples, after the author's notes on Dr. B's lessons, checked
    against Aldwell, Schachter and Cadwallader and Burstein and Straus.
  - `counterpoint/`: Fux's *Gradus ad Parnassum* in Mann's translation, with its rule engine.
  - `fugue/`: Mann's *The Study of Fugue*, and an analysis guide after Roberts, Badura-Skoda, Bodky, Gedalge and
    C. P. E. Bach.
  - `hip/`: Quantz, C. P. E. Bach, Badura-Skoda and Bodky, with L. Mozart as a cross-reference only.
  - `CONTENT_ISSUES.md` lists what looked wrong in the data and what the pages do not do yet.
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
