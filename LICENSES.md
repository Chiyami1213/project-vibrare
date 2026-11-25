# Licenses

This repository has several kinds of material, each under its own terms.

| What | Where | License |
| :-- | :-- | :-- |
| Code | `src/`, `tests/`, `astro.config.mjs`, `package.json` | MIT, see [LICENSE](LICENSE) |
| Touhou Project track lists | `src/data/touhou/` | Compiled from Japanese Wikipedia, so [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Credit: Wikipedia contributors; cross-checked against thwiki.cc and the ZUN Music Database Wiki. Please share adaptations under the same license. |
| Well-Tempered Clavier list | `src/data/bach/` | Follows the English and German Wikipedia articles, so [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Credit: Wikipedia contributors. |
| Instrument samples | `public/audio/` | CC0 1.0, from the Versilian Community Sample Library (see `public/audio/README.txt`) |
| The author's notes, summaries and writing | `content/`, `src/data/` (other than the two rows above), About and glossary text | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). The summaries paraphrase the books they cite; the books themselves stay under their authors' copyright. |
| Analysis pages kept as delivered | `public/analysis/` (Bach fugue analysis, Roberts's method, First Lessons in Bach, Quantz, Blavet, Touhou OST analysis) | The author's analysis and writing: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). The scores are engraved (Verovio) from third-party encodings and editions, and each page lists its own sources; they stay under their owners' terms (see below). |
| Sound samples of those pages | `public/analysis/**/sounds*.js` | Piano: Nice-Steinway v3.9 (soundfonts4u), from the Iowa EMS piano recordings, CC BY-ND 3.0, shortened and otherwise unaltered. Harpsichords: Versilian Community Sample Library, CC0. Flute, violin, viola, cello: MusyngKite (Paul Batchelor, via the gleitz MIDI.js soundfonts), CC BY-SA 3.0, and the Versilian Chamber Orchestra violin, CC0. Modern flute in the Quantz exercises: tonejs-instruments, CC BY 3.0. Organ: see the note below. |
| Music notation font | Bravura, bundled inside VexFlow | SIL Open Font License 1.1 |
| Dependencies | `node_modules/` (not in this repository) | Their own licenses; Astro, tonal and VexFlow are MIT |

Touhou Project and its music belong to ZUN and Team Shanghai Alice; this is an unofficial fan project and does not host
any of the original recordings.

## Notes on the analysis pages

- **Bach fugues:** the scores come from David Huron's Humdrum encoding of the Bach-Gesellschaft edition (BG 14; (c) 1994 David Huron, humdrum-tools/bach-wtc-fugues), "used for study" as the pages say; BWV 847 was also checked against Mutopia's edition (CC BY-SA 4.0). Busoni's edition (1894) and the Bach-Gesellschaft edition are in the public domain. The Neue Bach-Ausgabe urtext (Baerenreiter) was only compared, not reproduced. The terms of Huron's encoding for redistribution have not been confirmed: check them before the site is promoted.
- **Quantz exercises:** the music is from Erwin Schwarz-Reiflingen's 1934 edition (Breitkopf 5606); Quantz's notes are in the public domain, but the editor's additions (bracketed notes, dynamics) may still be protected. Not confirmed.
- **Blavet and the Quantz concerto:** engraved from a scan of the 1731 print, and from the Augsbach edition (Breitkopf) as a reference; the concerto page reproduces what it analyses. Not confirmed for the second.
- **First Lessons in Bach:** Walter Carroll's 1911 pieces (Forsyth / Schuberth), re-engraved; Carroll died in 1955, so the text is public domain in the EU and the US but not everywhere.
- **Touhou analysis:** the music is (c) ZUN / Team Shanghai Alice; the pages show short excerpts, only to analyse them, as they state.
- The organ samples used by the four organ fugue pages have no source note on the pages; ask the author before relying on them.
