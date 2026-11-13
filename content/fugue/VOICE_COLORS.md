# Feature spec: colour each voice (voice-identity colouring)

**Owner's request:** the owner colours each voice in their handwritten notes, so the same voice keeps one colour from start to finish. Voice crossing and overlap then stand out at a glance. Build the same feature into every score on the site: tonal harmony, counterpoint (Fux), partimento (schemata/cadences) and fugue. Build it once, as a shared option of the Example player, and reuse it everywhere.

## 1. What it does
- **Toggle** on every Example player: `Colour voices` (off / on). Remember the choice site-wide with localStorage, wrapped in try/catch. Default: **on** for counterpoint and fugue, **off** for tonal and partimento, where the SATB colour mode (7th/LT) is the default. The owner can change these defaults in one config object.
- When on, everything belonging to one voice is drawn in that voice's colour:
  - noteheads, stems, flags, beams, ties and accidentals;
  - rests;
  - the voice's name label at the start of the system (e.g. `S`, `A`, `T`, `B`, `CF`, `Bass`, or the fugue voice name).
- **Voice paths** (sub-toggle, default on when colouring is on): a thin, semi-transparent line (≈1.5 px, 35% opacity) runs through the centre of the voice's consecutive noteheads, in the voice's colour.
  - The line breaks at rests.
  - On a shared staff (two voices on one staff, as in partimento, three-voice tonal examples and fugue keyboard reductions), when two paths cross, the voices have crossed.
- **Crossing / overlap markers:**
  - When the colour switch is on, compute crossings and overlaps (§3).
  - Mark each one with a small labelled marker above the system, e.g. `✕ crossing A/T` or `⇅ overlap S/A`.
  - Shade the span with a light band in the colours of both voices.
  - Use a label as well as colour, so the information is never carried by colour alone.
  - Clicking a marker plays that span.
- **Legend:** a small row of coloured chips with the voice names under the player. Clicking a chip solos that voice, using the same behaviour as the existing mute/solo control.
- **Playback highlight:** while playing, the sounding note of each voice gets a soft glow in its own colour.

## 2. Palette
The colours must not clash with colours that already carry meaning on the site:
- tonal colour mode: green = chordal 7th, red = leading tone;
- checker levels: white, blue, green, yellow, orange, red;
- Fux interval numbers: blue = perfect.

When **voice colouring** is on, those meanings move to **outlined markers or text badges**, and noteheads take the voice colours. When **tonal colour mode** is on, voice colouring switches off; the two are mutually exclusive, and it is one segmented control: `Plain | Voices | 7th & LT`.

Default palette, based on Okabe-Ito and colour-blind safe. Each colour has a light-mode value and a dark-mode value. Define them as CSS variables `--voice-1` … `--voice-5`, so the owner can replace them with the colours from their notes.

| Slot | Default role | Light | Dark |
|---|---|---|---|
| voice-1 | top voice (S / upper counterpoint / fugue voice 1) | `#0072B2` blue | `#56B4E9` |
| voice-2 | A / 2nd voice | `#D55E00` vermillion | `#F08A4B` |
| voice-3 | T / 3rd voice | `#9A4F96` purple | `#CC79A7` |
| voice-4 | B / lowest voice | `#3A3A3A` ink | `#E6E6E6` |
| voice-5 | 5th voice (5-voice fugues only) | `#8C6D1F` ochre | `#E0B84F` |

**Colour belongs to the voice, not to the register.** A voice keeps its colour even when it moves below the voice under it. That is the whole point, because a crossing shows up as, for example, a purple note below an ink note.

## 3. Detecting crossing and overlap
Run the checks on adjacent voice pairs in score order (voice i above voice i+1). Use MIDI numbers.
- **Crossing:** at any instant where both voices sound, `midi(i) < midi(i+1)`. Report it once per continuous span, with its start time, end time and the two voices.
- **Overlap:** on consecutive attacks, the lower voice moves above the upper voice's previous note, or the upper voice moves below the lower voice's previous note. The tonal checker's `overlap` rule already does this; port it.
- **Unison** (`midi(i) == midi(i+1)`): not a crossing. Draw the shared notehead split in both colours (a half-and-half fill) or offset the two noteheads side by side, so both voices remain visible.
- Report these as **information, not errors**, unless the page's own checker flags them (tonal `crossing`/`overlap` rules; Fux engine issues). In that case, show the checker's level as well.

## 4. Where voice identity comes from (per pack)
| Pack | Voices in the data | Order (voice-1 = top) | Name labels |
|---|---|---|---|
| Tonal harmony | `realized` slices, S,A,T,B (or fewer) per slice | S, A, T, B | S A T B |
| Counterpoint (Fux) | `examples[id].voices[]`, each with `role` (`cf` / `cp`) and `species` | in array order, as drawn (the top staff is voice-1) | `CF`, or `CP` + species number; cantus firmus always gets a small "CF" tag besides its colour |
| Partimento | `realized.voices[]`; the last one is always the bass | array order; bass = voice-4 colour (ink) whatever the number of parts | `1`, `2`, `3` for the upper voices, then `Bass` |
| Fugue | `voices[]` in each example, top to bottom, with `name` | array order | the voice name (S A T B, or Voice 1–5) |

In partimento, the upper voices may cross by design when `cross: true` is set in the notation. Voice paths make that visible, and that is intended.

## 5. Fugue only: second colour layer (do not mix the two)
Fugue examples also mark **thematic entries** (subject, answer, countersubject, episode). Keep that as a separate mode in the same segmented control: `Plain | Voices | Entries`.
- In `Entries` mode, colour by function: subject, answer, countersubject 1/2, free material in grey.
- In `Voices` mode, show entries as labelled brackets above the notes (`S`, `A`, `CS1`).
- Never use both colour schemes at once.

## 6. Accessibility and acceptance
- Colour is never the only cue. The legend has the voice names, crossing markers have text, and stem direction still separates two voices on one staff (upper voice stems up).
- Contrast: each voice colour has at least 3:1 contrast against the page background in both themes. Check this in light and dark mode.
- Tests:
  - every example renders with the colouring on and off;
  - the crossing detector finds the crossing in the tonal error example tagged `crossing`;
  - it finds every partimento example with `cross: true`;
  - no current Fux example has a crossing in its `engineResult`, so any crossing found there means the detector has a bug;
  - on all other model examples it reports no crossing.
- Performance: colouring is a style change, so there is no re-layout when it is toggled.
