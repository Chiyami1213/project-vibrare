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
