// Types and helpers for the Touhou OST data (src/data/touhou/games.json).
export type RoleKind =
  | 'title'
  | 'stage'
  | 'boss'
  | 'extra-stage'
  | 'extra-boss'
  | 'phantasm-stage'
  | 'phantasm-boss'
  | 'character'
  | 'ending'
  | 'staff-roll'
  | 'other';

export interface Role {
  kind: RoleKind;
  stage?: number;
  character?: string; // Japanese name, as written in the source
}

export interface Track {
  n: number; // position in the OST
  title: string; // Japanese title
  scene: string; // the scene as written in the source (Japanese)
  role: Role;
  /** Maximum BPM as listed on the Touhou Music Database wiki (atwiki). Two values when the wiki lists two. */
  bpm?: number[];
  /** Key of each passage, as listed on the same wiki: a code such as "Dm" or "Ebm/D#m", and the time range. */
  keys?: { key: string; range: string }[];
}

export interface Game {
  id: string; // "th06"
  number: number;
  titleJa: string;
  titleEn: string;
  year: number;
  tracks: Track[];
}

export const gameLabel = (g: Pick<Game, 'number'>) => `Th${String(g.number).padStart(2, '0')}`;

/** English label for where a track is used. The character name stays in Japanese. */
export function roleLabel(t: Pick<Track, 'role' | 'scene'>): { label: string; character?: string } {
  const r = t.role;
  switch (r.kind) {
    case 'title':
      return { label: 'Title screen' };
    case 'stage':
      return { label: `Stage ${r.stage}` };
    case 'boss':
      return { label: `Stage ${r.stage} boss`, character: r.character };
    case 'extra-stage':
      return { label: 'Extra stage' };
    case 'extra-boss':
      return { label: 'Extra boss', character: r.character };
    case 'phantasm-stage':
      return { label: 'Phantasm stage' };
    case 'phantasm-boss':
      return { label: 'Phantasm boss', character: r.character };
    case 'character':
      return { label: 'Character theme', character: r.character };
    case 'ending':
      return { label: 'Ending' };
    case 'staff-roll':
      return { label: 'Staff roll' };
    default:
      return { label: t.scene };
  }
}

/** The BPM values of a track, largest first, e.g. "146 / 143". Empty when the wiki lists none. */
export function bpmLabel(bpm: number[] | undefined): string {
  return (bpm ?? []).map((v) => String(v)).join(' / ');
}

const ACCIDENTAL: Record<string, string> = { '#': '♯', b: '♭' };

/** "Ebm/D#m" becomes "E♭/D♯ minor" (or "E♭/D♯m" when short); "Am" becomes "A minor"; "Chromatic" and "Major Scale" are words. */
export function keyLabel(code: string, short = false): string {
  if (code === 'Chromatic') return 'Chromatic';
  if (code === 'Major Scale') return 'Major';
  const names = code.split('/').map((part) => {
    const m = /^([A-G])([#b]?)m$/.exec(part);
    return m ? m[1] + (ACCIDENTAL[m[2]] ?? '') : null;
  });
  if (names.some((n) => n === null)) return code; // an unknown code is shown as it is
  return short ? `${names.join('/')}m` : `${names.join('/')} minor`;
}

const startSeconds = (range: string): number => {
  const m = /^(\d+):(\d{2})/.exec(range);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

/** The keys of a track in the order they are heard, repeats merged: "D minor → F minor → D minor".
 *  A track that passes through four or more keys is written in the short form ("Dm → F♯m → …") to stay on one line. */
export function keysLabel(keys: { key: string; range: string }[] | undefined): string {
  const heard = [...(keys ?? [])].sort((a, b) => startSeconds(a.range) - startSeconds(b.range));
  const codes: string[] = [];
  for (const k of heard) if (codes[codes.length - 1] !== k.key) codes.push(k.key);
  return codes.map((c) => keyLabel(c, codes.length >= 4)).join(' → ');
}
