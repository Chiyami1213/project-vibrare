// The instruments the site can play with. Each is a set of recorded notes in public/audio/<dir>/ (CC0, from the
// Versilian Community Sample Library; see public/audio/README.txt).

export type InstrumentGroup = 'Historic harpsichord' | 'Modern piano' | 'Organ';

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
    name: 'Italian harpsichord',
    group: 'Historic harpsichord',
    dir: 'harpsichord',
    blurb: 'A recording of an Italian harpsichord on a single stop. The default, and the nearest in style to the instruments partimento was taught on.',
    release: 0.07,
    level: 1,
  },
  {
    id: 'harpsichord-flemish',
    name: 'Flemish harpsichord',
    group: 'Historic harpsichord',
    dir: 'harpsichord-flemish',
    blurb: 'A recording of a Flemish harpsichord (its low register).',
    release: 0.07,
    level: 1,
  },
  {
    id: 'piano-steinway',
    name: 'Steinway grand piano',
    group: 'Modern piano',
    dir: 'piano-steinway',
    blurb: 'A recording of a Steinway model B grand piano.',
    release: 0.2,
    level: 1,
  },
  {
    id: 'piano-kawai',
    name: 'Kawai grand piano',
    group: 'Modern piano',
    dir: 'piano-kawai',
    blurb: 'A recording of a Kawai grand piano.',
    release: 0.2,
    level: 1,
  },
  {
    id: 'organ-renaissance',
    name: 'Chamber organ',
    group: 'Organ',
    dir: 'organ-renaissance',
    blurb: 'A recording of a Renaissance-style organ on its 8-foot stop. Organ and harpsichord were the two usual keyboards for continuo.',
    release: 0.1,
    level: 0.9,
  },
];

export const DEFAULT_INSTRUMENT = 'harpsichord-italian';

export const isInstrumentId = (id: unknown): id is string => typeof id === 'string' && INSTRUMENTS.some((i) => i.id === id);

export const getInstrument = (id: string): Instrument => INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];

export const INSTRUMENT_GROUPS: InstrumentGroup[] = ['Historic harpsichord', 'Modern piano', 'Organ'];
