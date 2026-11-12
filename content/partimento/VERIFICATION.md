# Verification report

Your handwritten notes set the outline and the order of every pattern. Each pattern was then checked against the sources below. Every pattern in `data/*.json` lists its checks in `verification.checks` and any problems in `verification.flags`.

## Sources used
| Source | How it was used |
|---|---|
| Your notes: *Moti del Basso & Schemata* (40 pp.), *Cadences* (3 pp.), *Clausulae* (1 p.), *HCP Notes* (16 pp.) | The outline, groups, figures and examples |
| J. IJzerman, *Harmony, Counterpoint, Partimento* (OUP 2018) | Every "Terms to remember" section in chapters 1–8, plus Appendix II (cadences), with your annotations |
| F. Fenaroli, *Partimenti ossia basso numerato*, Book III (Rules, 1775; annotated) | Cadence definitions and the bass-motion rules ("Concerning a partimento that rises / falls …") |
| H. P. Weber, *Generalbass-Compendium* (English) | Bass models, the Quintfall/Quartfall sequence overview, cadence naming by the bass clausula |
| essaysonmusic.com (Ewald Demeyere) | Partimento theory pages (cadences, the four moti del basso pages) and all 32 schemata pages that match your notes |

## Results
- **Schemata tab:** 43 patterns. 39 verified, 2 partly verified (3–6 Monte, chromatic 5–6), 2 notes-only (Sol-Fa-Mi, Ponte). 7 carry a flag or note for you.
- **Cadences tab:** 37 entries. 36 verified, 1 flagged (the D.C./T.C. label in item 1).
- **Music examples:** 118 examples were realized from your figures. The checker finds no parallel fifths or octaves and no broken ties. Six leading-tone doublings occur on ⑦ inside sequences; these are reported as "info" (see item 3).

## Items for you to check
1. **Cadences p.2, four-part "Simple", second row (6/6/3 ③ → 8/6♯/3 ② → ①).** It is labelled **D.C.**, but with the bass ③–②–① it is a **tenor cadence (T.C.)** (HCP Ex. II.14a). The data uses T.C.
2. **Two-part compound discant: "Major 1–3, 3–1; Minor 1–1, 3–3"** is confirmed by HCP Ex. II.1d and II.2a. No change needed.
3. **Tied bass, 4 parts (notes p.4):** on the weak beats your 6/3 chords double the bass ("6 · 8"). HCP §7.3 says that in four parts doubling the sixth is preferable, and over ⑦ your voicing doubles the leading tone. The example keeps your voicing and marks it as info.
4. **Stabat Mater Prinner:** Demeyere describes the "Second Up Third Down" motion as the bass. In your notes it is the optional tenor over the dominant pedal. Both describe the same texture; the wording follows your notes.
5. **Jupiter:** the essaysonmusic page is inconsistent about the first melody note (➊ vs ➌). Your notes and Gjerdingen give ①–②…④–③, which is what the data uses.
6. **Monte, "a key is defined by A4→6 or d5→3":** this is your own formulation. It is consistent with HCP (Quiescenza, RO), but no source states it about the Monte.
7. **Sol-Fa-Mi and Ponte:** neither appears in HCP or on essaysonmusic.com, so they are marked `notes-only`. If you have Gjerdingen's *Music in the Galant Style*, check them there.
8. **Indugio with N6:** your notes say "temporary relative minor"; Demeyere says "when the key temporarily turns minor". The data uses the neutral wording.
9. **Do-Re-Mi "5/2 sounds empty":** this is your own judgement, kept as a guideline.
10. **Not auto-realized; score to be transcribed from your notes:**
    - 3-part 3–6 Monte (p.1; the voice assignment is ambiguous)
    - Chromatic 5–6 (p.3)
    - Minor chromatic Monte (p.5)
    - Stabat Mater Prinner (p.19)
    - Marpurg, Neapolitan and double four-part cadences (Cadences pp.2–3)
11. **Fauxbourdon:** on p.1 it is crossed out with "move to R.O.". It is kept as a pattern in the descending group with that note. If the site gets a Rule of the Octave page, move it there.
12. **Plagal cadence:** it is crossed out in your HCP cadence notes, so it is left out.

## Limits of the automatic voicings
The realizer turns your figures into concrete octaves using nearest-note voice leading. It checks parallel 5ths and 8ves, ties, and leading-tone doubling. It does **not** judge dissonance treatment, spacing, or style. Spot-check a few examples by ear in the finished site.
