# Verification: HIP content pack

## What was read
| Source | Read in full for this pack | Method |
|---|---|---|
| Quantz, *On Playing the Flute* (Reilly 1966) | Ch. V §§20–23 (dotted notes), VI (tonguing), VII (breath), VIII (appoggiaturas), IX (shakes), XI (good execution), XII (Allegro), XIV (opening and messa di voce), XV (cadenzas, key passages), XVII sec. VI §§12–17 (keyboard accompanist, dissonance dynamics) and sec. VII §§45–59 (tempo) | OCR of the scanned PDF (Tesseract), cleaned |
| C. P. E. Bach, *Essay* (Mitchell 1949) | Introduction to Part One; Ch. II.1 (embellishments in general); II.2 (appoggiatura); II.3 (trill); Ch. III (performance) | OCR |
| Badura-Skoda, *Interpreting Bach at the Keyboard* | Ch. 2 (rhythm, rubato, inégales), 3 (tempo), 4 (articulation), 5 (dynamics), 6 (harpsichord or piano), 7 (legato) | text layer |
| Bodky, *Interpretation of Bach's Keyboard Works* | Ch. 2 (instruments), 3 (dynamics), 4 (tempo), 6 (rhythmic alterations), 7 (articulation conclusions) | text layer |
| L. Mozart, *Treatise* (cross-ref only) | Ch. IV, V, IX, X, XII | text layer |

My reading notes, with page references, are in `tools/notes/`. Everything in `data/hip.json` is paraphrased; quotations are a few words long and marked.

## Cross-checks that agreed
- **Appoggiatura length.** Half of a plain note and two thirds of a dotted note. Quantz, C. P. E. Bach and L. Mozart all agree. L. Mozart also gives three quarters of a minim in some metres; that is not used.
- **Dotted notes.** All three primary sources shorten the note after a dot. Quantz limits this to dotted quavers and shorter values.
- **Rests on the beat.** Quantz says to enter late after a short rest. C. P. E. Bach and Badura-Skoda cite the same advice.
- **Inequality.** Quantz's exceptions list (XI §12) matches Badura-Skoda's summary of it (p. 69).
- **Tempo.** Quantz's four classes match Badura-Skoda's summary of them (pp. 75–76). Bodky's five groups pivot on the same value, about 80.
- **Rubato.** C. P. E. Bach (one hand free, the other strict), Quantz (the accompanist must not follow) and L. Mozart (the accompanist keeps strict time) describe the same practice.
- **Dissonances louder than consonances.** Quantz and C. P. E. Bach agree in general. Mitchell notes that C. P. E. Bach accepted Quantz's graded classes only broadly.

## Disagreements kept as disagreements (topic `disagreements`)
These are shown side by side rather than resolved:
- passing appoggiaturas;
- how a trill begins;
- the closing appoggiatura after a trill;
- trill speed;
- dotted figures against triplets;
- graded dissonance dynamics;
- repeated continuo bass notes;
- inequality in Bach;
- ordinary touch;
- tempo norms.

## Rule vs guideline
- **Rule:** a primary source states it as a requirement. Rules are never based on L. Mozart alone; the build script checks this.
- **Guideline:** taste, advice, or a modern author's interpretation (Badura-Skoda, Bodky).

## Choices made by me (the pack author), marked with `note` in the data
- The 0.29/0.21 split in the `inequality` example. Quantz gives no ratio.
- The `app-before-dissonant-trill` example, the `diss-dyn` progression and the `breath-q`, `tongue-q` and `bow-map` passages were composed to illustrate the rules. They are not transcriptions of the treatises' plates.
- Harpsichord playback cannot show dynamics, so `@VEL` is used for agogic weight. Dissonance dynamics are shown by texture, following Quantz's own harpsichord means.

## Page references
- Quantz page numbers are Reilly's. They were read from the running heads in the OCR, so a ref may be off by one page at a page turn.
- § numbers appear only where they were checked. Elsewhere a ref gives the chapter and page.
- L. Mozart refs give the chapter, plus a page only where it was checked (Ch. IV p. 73, Ch. V p. 96, Ch. XII p. 215).

## Questions for you
1. **Dissonance class list (Q XVII.vi §16).** The OCR of the mf list reads "the major sixth with the minor third". Please check it against your printed copy (Tab. XXIV) before the `dissonance-dynamics` tool is finalised.
2. **Modern or baroque flute?** Quantz's trill fingerings (Tab. VII) are for the one-keyed flute and were not transcribed. Do you want a baroque-flute fingering table? If you play a modern Boehm flute, the topic already says to use modern trill fingerings.
3. **C. P. E. Bach on the turn, mordent and fermata.** These chapters were not read in detail, so the `small-graces` topic is marked *partly*. Should I add them?
4. **Piano as a sound option.** Playback is harpsichord by default, as you asked. Is an optional piano sound for the dynamics demos acceptable?


## History background (merged from the History page)
- **Source.** Christensen (ed.), *The Cambridge History of Western Music Theory* (CUP 2002). Each chapter was read at survey level (headings, topic sentences, opening and closing paragraphs). Names, dates and treatise years were checked against the book's text.
- **Content.** Only the overlapping technical content moved here: Performance, meter and rhetoric in the history of theory. The narrative stays on the History tab.
- **Rules.** Rules are precepts stated by the named historical writer. They are paraphrased, not quoted.
- **Tools.** The tools are models written by the pack author, not figures from the book.
