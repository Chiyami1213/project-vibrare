# Verification report

Your handwritten notes set the outline and the order of every pattern. Each pattern was then checked against the sources below. Every pattern in `data/*.json` lists its checks in `verification.checks` and any problems in `verification.flags`.

## Sources used
| Source | How it was used |
|---|---|
| Your notes: *Moti del Basso & Schemata* (40 pp.), *Cadences* (3 pp.), *Clausulae* (1 p.), *HCP Notes* (16 pp.) | The outline, groups, figures and examples |
| J. IJzerman, *Harmony, Counterpoint, Partimento* (OUP 2018) | Every "Terms to remember" section in chapters 1–8, plus Appendix II (cadences), with your annotations |
| F. Fenaroli, *Partimenti ossia basso numerato*, Book III (Rules, 1775; annotated) | Cadence definitions and the bass-motion rules ("Concerning a partimento that rises / falls …") |
| H. P. Weber, *Generalbass-Compendium* (English) | Bass models, the Quintfall/Quartfall sequence overview, cadence naming by the bass clausula |
| G. Sanguinetti, *The Art of Partimento* (OUP 2012), Ch. 9 "The Rules" (cadences, Rule of the Octave, suspensions, bass motions, scale mutations) | Second cross-check of every moto del basso and of the cadence classification; source of the additions listed below (`tools/sanguinetti.py`, field `sources.sanguinetti`) |
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


## Sanguinetti cross-check (added later)
**Confirmed:** Fenaroli's simple / compound / double cadence definitions; 5–6 (minor stops on ⑤), 9–8 (never beyond ⑤), descending 5–6 (stops on ③), descending 6–6 (last 6th major), 7–6 descending (whole octave), chromatic ascent ③–⑥ with the mi–fa rule, lamento 7–6, romanesca (exactly one octave, three moduli), 5-up-4-down (major only, ≤ 3 moduli, penultimate triad major), 3-down-2-up (5 then 6), Prinner = Durante's descending tetrachord with 7–6, cadenza finta = indugio.

**Added from Sanguinetti** (status `textbook-only`, "(Sanguinetti)" guidelines):
- Schemata: a *Rule of the Octave (reference)* group — essential foundations of the key, and Fenaroli's RO up/down in major and minor (4 realized examples, checker-clean); two moti missing from your notes: *seventh up / octave down* and *bass falling by thirds* (non-sequential).
- Cadences: *cadenza lunga* (Pasquini ③ 6 – ④ 6/5 – ⑤ 5/4–5/3 – ①), the root of the Galant cadence.
- Guidelines: passing 7th in the simple cadence; differing cadence names in Durante, Paisiello, Tritto; Cotumacci's major/minor penultimate 6th in the 7–6 descent; chromatic ascent in minor ⑤–⑧; two alternative accompaniments of the lament bass; Fenaroli's hexachord limit for 4-up-3-down.

**New questions for you:**
1. **(8–)7–6** (`rise-7-6`): Range in minor: the notes say the minor version spans only a fourth; Sanguinetti says it "must stop on ⑤" (①–⑤). Check which you mean.
2. **Third up, second down** (`dis-3up-2down`): Sanguinetti's main Fenaroli version (Ex. 9.46a) is NOT accompanied sequentially: the accented notes follow the Rule of the Octave (Fenaroli: "a scale interrupted by the third"). The notes/data present the 7–6 sequential version as the default; consider adding the RO version.
3. **Fourth up, third down (Monte Principale)** (`dis-4up-3down`): Sanguinetti attaches Gjerdingen's name "monte principale" to the motion rising by fourths and falling by FIFTHS (the descending circle), not to this one. Your notes and the data use it for 4th-up/3rd-down. Check Gjerdingen, Music in the Galant Style, to settle the name.
4. **Sixth up, fifth down (= third down, fourth up)** (`dis-6up-5down`): Your notes (and Fenaroli III, per the data) say this motion equals "third down, fourth up"; Sanguinetti writes that "no such motion exists in partimento rules". Not a contradiction of the music, only of the name — keep the notes' wording.
5. **Rule of the Octave (Fenaroli standard scale)** (`ro-fenaroli`): Not in your notes — added because several notes pages say "move to R.O.". Remove the group if you plan a separate RO page.
6. **Seventh up (filled in), octave down** (`dis-7up-8down`): Score to be transcribed (no automatic realization: the bass contains passing notes).

## Neapolitan primary sources (added later): suspensions, Rule of the Octave, diminution
**Sources read:**
- Durante, *Regole*: all 59 rule titles (Italian with the edition's English). The scores of pp. 6, 20–23 were read.
- Durante, *Partimenti diminuiti*: the editor's notes to all 103 numbers. The scores of Nos. 1, 7, 9 and 11 were read.
- Fenaroli, *Regole* (Book III): the full "Delle Dissonanze" chapter and the legature del basso.
- Fenaroli, Books I, II, IV, V and VI: editor's notes only. These books are figured and unfigured basses with no prose.
- Fenaroli, *Movimenti*: the list of 11 bass motions.
- Furno, *Movimenti del Partimento*: the list of 9 bass motions.
- Sanguinetti Ch. 9, Class III (suspensions) and Ch. 12 (diminution) for cross-reading.

**Added** (status `textbook-only`):
- *Suspensions* group (5 cards, 17 examples):
  - preparation, accompaniment and resolution rules for the 4th, 7th and 9th;
  - bass suspensions with a perfect 4th (bass returns) vs an augmented 4th (bass moves on, modulating to V);
  - the 7→3 chain in falling fifths.
- *Rule of the Octave*: Durante's version (4 examples) and Durante's interval rules for the bass (5 examples).
- *Diminution* group (4 cards, 6 examples). Four of the examples are Durante's own diminutions, transcribed and transposed to C: No. 1 Styles 1–2, No. 9 Style 1 and No. 11 Style 2. The other cards are a catalogue of techniques and a map from each bass motion to Diminuiti numbers.
- Cross-references (`sources.napoli` plus checks) on 16 existing patterns:
  - Fenaroli's and Furno's movimento numbers on every disjunct and chromatic moto;
  - Durante's "ascends: 5 then 6" and "descends: 7 then 6" rules.

**Confirmed:**
- 5–6 rising: every note keeps its 3rd.
- 7–6 falling.
- The tied bass takes 2/4.
- Romanesca diminutions with 7–6.
- Every moto in your disjunct group appears in Fenaroli's or Furno's list. The one exception is "second up, third down", which is in Furno only.

**Questions for you:**
1. **Durante's RO, ascending ② and ③.** Durante writes only "6". The voicings use 6/3, which doubles the 3rd on ②. Do you want Fenaroli's 6/4/3 on ② instead?
2. **Durante's minor descending ⑥.** The edition prints (♯)6. It is read as an augmented 6th (F–D♯ in A minor). Check against the manuscript if this matters to you.
3. **Diminution examples in two parts.** Durante's styles are one right-hand line over the bass, so the figured-bass row is not meaningful there. The brief tells the builder to hide it for `parts: 2`. Keep it hidden, or show the figures of the underlying chords?
4. **Durante No. 7** (Romanesca with a diminished bass) is described but not notated. Its passing bass notes make the checker report parallel 5ths that are not real. Transcribe it anyway, with the checker switched off for that example?

`doubledLT` info lines added by this section: `dd1-s1`, `dd1-s2`. These are melodic leading tones inside Durante's figuration, not voice-leading errors.

## Limits of the automatic voicings
The realizer turns your figures into concrete octaves using nearest-note voice leading. It checks parallel 5ths and 8ves, ties, and leading-tone doubling. It does **not** judge dissonance treatment, spacing, or style. Spot-check a few examples by ear in the finished site.


## History background (merged from the History page)
- **Source.** Christensen (ed.), *The Cambridge History of Western Music Theory* (CUP 2002). Each chapter was read at survey level (headings, topic sentences, opening and closing paragraphs). Names, dates and treatise years were checked against the book's text.
- **Content.** Only the overlapping technical content moved here: Thoroughbass and partimento in the history of theory. The narrative stays on the History tab.
- **Rules.** Rules are precepts stated by the named historical writer. They are paraphrased, not quoted.
- **Tools.** The tools are models written by the pack author, not figures from the book.
