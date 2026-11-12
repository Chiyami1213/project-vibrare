// The instruments the site can play with. Each is a set of recorded notes in public/audio/<dir>/ (CC0, from the
// Versilian Community Sample Library; see public/audio/README.txt).

export type InstrumentGroup = 'Harpsichord' | 'Piano' | 'Organ';

export interface Instrument {
  id: string;
  name: string;
  group: InstrumentGroup;
  dir: string;
  blurb: string;
  /** How fast a note dies when the key is released, in seconds (the time constant of the fade). */
  release: number;
  /** Loudness trim, so the instruments sound about equally loud. */
  level: number;
}

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'harpsichord-italian',
    name: 'Italian Harpsichord',
    group: 'Harpsichord',
    dir: 'harpsichord',
    blurb: 'A recording of an Italian harpsichord on a single stop. The default, and the nearest in style to the instruments partimento was taught on.',
    release: 0.07,
    level: 1,
  },
  {
    id: 'harpsichord-flemish',
    name: 'Flemish Harpsichord',
    group: 'Harpsichord',
    dir: 'harpsichord-flemish',
    blurb: 'A recording of a Flemish harpsichord (its low register).',
    release: 0.07,
    level: 1,
  },
  {
    id: 'piano-steinway',
    name: 'Steinway Grand Piano',
    group: 'Piano',
    dir: 'piano-steinway',
    blurb: 'A recording of a Steinway model B grand piano.',
    release: 0.2,
    level: 1,
  },
  {
    id: 'piano-kawai',
    name: 'Kawai Grand Piano',
    group: 'Piano',
    dir: 'piano-kawai',
    blurb: 'A recording of a Kawai grand piano.',
    release: 0.2,
    level: 1,
  },
  {
    id: 'organ-renaissance',
    name: 'Chamber Organ',
    group: 'Organ',
    dir: 'organ-renaissance',
    blurb: 'A recording of a Renaissance-style organ on its 8-foot stop. Organ and harpsichord were the two usual keyboards for continuo.',
    release: 0.1,
    level: 0.9,
  },
];

/**
 * Every instrument is played in twelve-tone equal temperament (12-TET, A = 440 Hz): a recording is speeded up or
 * slowed down from its own measured pitch to the exact equal-tempered pitch of the note asked for. This is the
 * playback rate that does it.
 */
export const equalTemperamentRate = (sampleMidi: number, targetMidi: number): number => Math.pow(2, (targetMidi - sampleMidi) / 12);

export const DEFAULT_INSTRUMENT = 'harpsichord-italian';

export const isInstrumentId = (id: unknown): id is string => typeof id === 'string' && INSTRUMENTS.some((i) => i.id === id);

export const getInstrument = (id: string): Instrument => INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];

export const INSTRUMENT_GROUPS: InstrumentGroup[] = ['Harpsichord', 'Piano', 'Organ'];
