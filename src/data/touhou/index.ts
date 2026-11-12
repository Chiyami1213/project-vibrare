import games from './games.json';
import type { Game } from '../../scripts/touhou';

// 15 numbered games (Th06-Th20) and their OSTs. Compiled from Japanese Wikipedia and
// cross-checked against thwiki.cc; see the Touhou overview page for the sources.
export const GAMES = games as Game[];
