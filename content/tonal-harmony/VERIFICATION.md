# Verification report: Tonal Harmony pages

Your notes on Dr. B's video series set the outline, the order and the chapter numbering (Parts I, II, III, V, VI — the notes have no Part IV). Every topic was then checked against the sources below. Each topic in `data/part-*.json` lists its checks in `verification.checks` and any open questions in `verification.flags`.

## Sources used
| Source | How it was used |
|---|---|
| Your notes: *Dr. B Music Theory Notes* (50 pp., 2024-08-09) | Outline, chapter order, every rule/guideline, tables, keys and progressions of the music examples |
| E. Aldwell, C. Schachter & A. Cadwallader, *Harmony and Voice Leading*, 5th ed. (Cengage 2019) | Cross-check of every chapter, mainly through the "Points for Review" of Units 6–33 and the definitions in Units 1–5 (unit numbers are in each topic's `sources.textbook`) |
| J. Burstein & J. N. Straus, *Concise Introduction to Tonal Harmony*, 2nd ed. (Norton) | Second cross-check of every topic through the chapter "Points for Review" and definitions (`sources.textbook2`; the patch is `tools/burstein.py`, applied at build time so the notes-based data stays untouched) |
| Dr. B Music Theory playlist (Christopher Brellochs, YouTube) | Titles for 45 of the 47 lessons were found by web search (44 with a confirmed video link) and mapped to chapters (`index.json → lessons`). The videos themselves could not be watched from here, so the notes stand in for their content. Lessons 19 and 24: title not found. Lesson 31: title from a study-set listing, URL not confirmed. |

## Results
- **74 topics:** 70 verified, 1 partly (secondary functions that modulate), 3 notes-only (tuning systems, pentatonic scales, music-history timeline — in neither textbook). The large forms moved from partly to verified thanks to Burstein Ch. 37–39.
- **154 notated examples**, all checked by the part-writing checker in `tools/satb.py` (port of the rules on notes pp.15–20, 29, 38, 40, 49):
  - 107 **model** examples: zero problems (except where a rule is switched off on purpose with `allow`, explained in the caption — e.g. the rising 7th in V4/3 with parallel 10ths, notes p.30).
  - 22 **error** examples: each shows exactly the fault it is meant to show (parallel, contrary and hidden 5ths/8ves, unequal 5ths, doubled leading tone, unresolved 7th or leading tone, 7th approached by leap, spacing, range, crossing, overlap, vii° root position, misused 6/4, Ger+6 → V).
  - 17 demos and 8 single-line scales/melodies.
- Where the notes give a full voicing it was transcribed (`source: "notes p.X"`); where they give only chords, a voicing was composed and checked (`source: "… voiced by the builder"`).

## What the Burstein cross-check changed
- **Resolved 4 open items:** vii°6 doubling (Burstein: never double the root, double the 3rd or 5th — the data already did this); sentence (Burstein Ch. 35 defines it as the notes do); retardation (Burstein Ch. 7 uses the same term and definition); direct modulation (Burstein calls it "abrupt modulation").
- **Supported existing flags:** no T–B limit, d5 → P5 forbidden between any voices, root-position vii° not used in four parts, Ger+6 "usually" (not always) via the 6/4.
- **New guidelines added (marked "(Burstein)")**: avoid melodic 7ths, augmented intervals and leaps of more than a 3rd up into the leading tone; never approach a unison by similar motion or an octave by similar motion from a 2nd/7th; arpeggiated 6/4; half cadences end on V, not V7.
- **New questions for you:** cadential 6/4 labelling (I6/4 vs V6/4–5/3); what counts as an IAC; binary sub-types; altered pivot chords; the V7 → V reading of p.29.

## Rules the checker had to interpret
- Spacing T–B ≤ P12 (notes p.15) is stricter than the textbook; it is enforced.
- Hidden 5ths/8ves only between outer voices with a soprano leap (notes p.17).
- Unequal 5ths only against the bass (notes p.17).
- A leading tone that slides down a chromatic half step (B → B♭ to become a 7th) is accepted (notes p.38).
- A flat 7th raised chromatically and then resolved (A♭ → A♮ → G) counts as a delayed resolution (notes p.40).
- "Hidden" and "unequal 5ths", "7th approached by leap" and "A6 must expand" are not on the colour checklist (p.20); the builder gave them levels (blue / orange) — change them in `tools/satb.py → LEVEL` if you prefer others.

## Items for you to check
1. **Harmonic function: T – P – D** (`harmonic-function`, notes p.1): The "Typical chords" column is added from A&S Units 7–10; the notes list only the three function names.
2. **Acoustics & tuning systems** (`tuning-systems`, notes pp.1, 3): The "Idea" column is a one-line gloss added for the site; the notes list only the names.
3. **Notation: staff, clefs, notes, rests, accidentals** (`notation-basics`, notes p.2): The notes sketch the clefs without naming the reference lines; the "Reference line" column is filled in from standard definitions.
4. **Pentatonic scales** (`pentatonic`, notes p.4): The notes list sub-topics only (hemitonic vs anhemitonic, Japanese/Chinese scales, relation to modes, tuning, history). Content beyond the definition is left for the owner to add.
5. **The overtone series** (`overtone-series`, notes p.9): The notes give quality labels for partials 10–16 that differ from each other (M2↓, m2↓); the table uses the approximate quality, because these intervals are not equal-tempered. Check the wording.
6. **The overtone series** (`overtone-series`, notes p.9): Notes: "P4 does NOT belong to the overtone series". A P4 does occur between partials 3 and 4; the point (as A&S also argues) is that it is not a stable interval above the bass. The guideline is worded that way.
7. **Diatonic triads and sevenths in each scale** (`diatonic-chords`, notes p.13): In the melodic-minor row the notes box ii7, III+Δ7, IV7 and ♯viø7 as rare; V7 and viiø7 are not boxed. The data follows the notes.
8. **Harmonizing a melody: 5-step procedure** (`harmonization`, notes p.14): "Change the chord for every melody note" is a classroom rule; A&S allows repeated chords strong→weak (Unit 7 Points for Review 12). Shown as a rule because the notes say so — consider making it a guideline.
9. **SATB format: ranges, spacing, positions** (`satb-format`, notes p.15): T–B ≤ P12 is a limit from the notes/lecture; A&S sets no maximum between tenor and bass. The checker enforces the notes' P12.
10. **SATB format: ranges, spacing, positions** (`satb-format`, notes p.15): Burstein (Ch. 4) also sets no limit between tenor and bass — two textbooks against the notes' T–B ≤ P12. Consider making P12 a guideline.
11. **Motion to avoid: parallel, contrary, hidden, unequal** (`forbidden-motion`, notes p.17): The notes apply unequal fifths only "w.r.t. the bass"; A&S states the d5→P5 caution for any pair of voices. The checker follows the notes (bass only).
12. **Motion to avoid: parallel, contrary, hidden, unequal** (`forbidden-motion`, notes p.17): Burstein forbids d5 → P5 between any pair of voices (with the V4/3/vii°6 → I6 exception) — like A&S, broader than the notes' "w.r.t. the bass". Contrary 5ths/8ves are not discussed in Burstein's four-part chapters (only in species, Ch. 8).
13. **Root-position part writing: procedure and V–I patterns** (`root-position-writing`, notes p.19): Pattern 2 in the notes is labelled IAC with "similar motion in S A T, contrary w.r.t. B"; the exact pitches of the sketch were hard to read, so the example is re-voiced to show the same idea.
14. **Part-writing checklist (white → red)** (`part-writing-checklist`, notes p.20): A&S treats doubling the 3rd as possible (Unit 7 PfR 5: "the 3rd of I is possible"); the notes rank root-doubling in 5/3 as a checklist item (blue = mild). Consistent if read as a preference.
15. **Second inversion (6/4): passing, neighbour, cadential** (`second-inversion`, notes p.21): Labelling: the notes write the cadential 6/4 as "I6/4" (as A&S also shows it). Burstein labels it "V6/4–5/3" because it embellishes V. Pick one convention for the site; the data uses I6/4.
16. **Second inversion (6/4): passing, neighbour, cadential** (`second-inversion`, notes p.21): The notes' checklist (p.20) allows only passing, neighbour and cadential 6/4s; Burstein also accepts the arpeggiated 6/4.
17. **Cadences** (`cadences`, notes p.22): IAC: Burstein defines it only as root-position V(7)–I with 3̂ or 5̂ in the melody, and says inverted dominants (V6, V6/5, V4/3) and phrase endings on I6 are not cadences. The notes (and A&S's looser usage) also count inverted and leading-tone (vii°6–I) versions as IACs. Decide which definition the site teaches.
18. **Forms: sectional, binary, ternary, sonata, minuet & trio, rondo** (`forms`, notes pp.24–26): Notes p.25: "Minuet & trio … usually in minor" — this probably refers to the trio being often in a contrasting key or mode; the wording in the data says "contrasting key". Please confirm.
19. **Forms: sectional, binary, ternary, sonata, minuet & trio, rondo** (`forms`, notes pp.24–26): Burstein classifies binary forms by thematic return (rounded / balanced / simple binary); the notes classify them by section length (symmetrical / asymmetrical). Consider adding Burstein's three types.
20. **Types of non-chord tones** (`nct-types`, notes pp.27–28): Suspension figures: the notes list 9–8, 6–5, 4–3. A&S names 9–8, 7–6 and 4–3 as the dissonant upper-voice suspensions; 6–5 is a consonant suspension. Consider adding 7–6 and marking 6–5 as consonant.
21. **Types of non-chord tones** (`nct-types`, notes pp.27–28): Appoggiatura: the notes define it narrowly (leap in, step out in the opposite direction, accented); A&S uses the word for any accented incomplete neighbour. The data keeps the notes' definition.
22. **Types of non-chord tones** (`nct-types`, notes pp.27–28): Burstein has no separate "appoggiatura" or "escape tone": both are an incomplete neighbour (INT), approached by leap and left by step or vice versa.
23. **Resolving V7: complete and incomplete chords** (`v7-resolution`, notes p.29): The notes call the problem in the last example a hidden octave (tenor–bass). Whatever the voicing, two incomplete chords send the doubled 5̂ to 1̂ in two voices, giving parallel, contrary or hidden octaves; the example shows the contrary-octave form, which the checker can detect.
24. **Approaching the chordal 7th** (`v7-seventh-approach`, notes p.29): The notes illustrate the approaches with the degrees 7̂–7̂→1̂ (sus.), 6̂–7̂→1̂ (P), 1̂–7̂–1̂ (LN). These are leading-tone patterns; for the chordal 7th of V7 the matching degrees are 4̂–4̂→3̂ (common tone), 5̂–4̂→3̂ (passing from above) and 3̂–4̂→3̂ (neighbour from below). The examples use the 4̂ versions — please check.
25. **Approaching the chordal 7th** (`v7-seventh-approach`, notes p.29): A&S allows a 7th approached by leap as an incomplete neighbour (rare); the notes forbid a descending leap. The checker follows the notes.
26. **Common progressions with V7** (`v7-progressions`, notes p.29): The notes cross out I6 → V → V7 with "hidden octave". I6 → V is a normal progression in A&S (Unit 8 PfR 1: I–I6–V). The ✗ presumably refers to one specific voicing (soprano leaping into an octave with the bass). Shown as text only; please confirm what was meant.
27. **Common progressions with V7** (`v7-progressions`, notes p.29): A possible reading of the crossed-out arrow on notes p.29: Burstein forbids V7 → V (going back from V7 to the triad). Compare with the I6 → V reading in the earlier flag.
28. **Major keys: viiø7 and its inversions** (`vii-half-dim`, notes p.32): The second example on p.32 is labelled IV – viiø4/3 – I6 but the bass-degree line under it reads 4̂ 4̂ 1̂ and it is captioned "plagal cadence"; the table on the same page says viiø4/3 should not go to root-position I. The data uses I6 (bass 4̂–4̂–3̂).
29. **Uncommon diatonic seventh chords** (`uncommon-sevenths`, notes p.35): The notes use a root-position vii° in the ♯viø7 example; the checklist (p.20) asks for vii° in first inversion only. A&S (Unit 16 PfR 10) also avoids raised vii°5/3 in minor. Please check which you want to teach.
30. **Uncommon diatonic seventh chords** (`uncommon-sevenths`, notes p.35): Burstein (Ch. 21) also rules out root-position vii° in four parts — supports the flag on the ♯viø7 example.
31. **Secondary leading-tone chords** (`secondary-lt`, notes p.39): The notes write viiø7/V as "DNE in nat. minor ⇒ v not V". The data words this as "use vii°7/V in minor". Please check that this matches what you meant.
32. **Enharmonic spelling follows resolution** (`enharmonic-spelling`, notes p.40): The checker treats A♭ → A♮ → G as one delayed resolution of the 7th (rule added from this page of the notes).
33. **Secondary deceptive resolutions and nested functions** (`secondary-deceptive`, notes pp.40–41): In the analysis example the notes label the chord after A7 as "VI" under a /vi bracket; in F major that chord (B♭) is IV. Both labels are kept.
34. **Secondary functions that modulate** (`modulating-secondary`, notes p.41): The notes write the second-to-last chord as A7/G♯ and label it V6/5. A7 contains no G♯; V6/5 in D is A7/C♯. Probably a slip — the table keeps the notes' symbol marked (sic).
35. **Common-chord (pivot) modulation** (`pivot-modulation`, notes pp.42–43): Burstein Ch. 27 requires the pivot to be diatonic in both keys; altered pivots (the notes' A7 = V7/V = V7) appear only in Burstein's chromatic-modulation chapter (Ch. 34, mixture pivots). Fine to keep, but label it "chromatic pivot".
36. **Mode mixture (borrowed chords)** (`mixture`, notes pp.45–46): The frequency list puts ♭VI under ♭7̂. ♭VI contains ♭6̂ and ♭3̂ but not ♭7̂; ♭VII would be the ♭7̂ chord. Please check.
37. **Mode mixture (borrowed chords)** (`mixture`, notes pp.45–46): "Picardy third — French?" is a question in the notes; left out of the data.
38. **Spelling augmented-sixth chords** (`aug6-spelling`, notes p.48): "Any note of an It+6 may be in the bass": A&S says positions other than ♭6̂ in the bass are less frequent and mostly have ♯4̂ in the bass ("diminished 3rd chords", Unit 30 PfR 7). The data keeps the notes' wording as a guideline.
39. **Augmented sixths: progression and resolution** (`aug6-resolution`, notes p.49): "Ger+6 ALWAYS → I6/4": A&S says usually, and allows the 5ths if they are not between the outer voices. Kept as a rule (notes) — consider making it a strong guideline.
40. **Augmented sixths: progression and resolution** (`aug6-resolution`, notes p.49): Notes p.49 continue It+6 → V4/3/V → V6 → i. In four parts, V4/3/V → V6 forces the 7th (C) onto B♮ while the bass also rises to B♮, doubling the leading tone. The example uses root-position V; please check the intended voicing.
41. **Augmented sixths: progression and resolution** (`aug6-resolution`, notes p.49): Burstein (Ch. 31) also says the German sixth "usually" (not always) goes through the cadential 6/4.


## Limits
- The checker judges four-part chorale style. It does not judge melody quality, rhythm, or style beyond the listed rules, and it reads chord function from the Roman-numeral label you see under each chord.
- Builder-voiced examples follow the notes' chord progressions but are not transcriptions of the videos. Spot-check a few by ear on the finished site.


## History background (merged from the History page)
- **Source.** Christensen (ed.), *The Cambridge History of Western Music Theory* (CUP 2002). Each chapter was read at survey level (headings, topic sentences, opening and closing paragraphs). Names, dates and treatise years were checked against the book's text.
- **Content.** Only the overlapping technical content moved here: Tuning, temperament and consonance in history, From modes to keys, Rameau: roots, inversion and the fundamental bass, Roman numerals, functions and dualism, Schenker: levels and the Ursatz. The narrative stays on the History tab.
- **Rules.** Rules are precepts stated by the named historical writer. They are paraphrased, not quoted.
- **Tools.** The tools are models written by the pack author, not figures from the book.
