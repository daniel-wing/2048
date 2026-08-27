/**
 * @2048/engine — the pure game core.
 *
 * Imports nothing from React, React Native, Expo, or the DOM. Everything here
 * is plain data and pure functions, which is what lets the same engine drive
 * the web, iOS, and Android builds unchanged.
 */

export {
  DEFAULT_SIZE,
  DEFAULT_WIN_TARGET,
  MAX_SIZE,
  MIN_SIZE,
  cloneBoard,
  createEmptyBoard,
  emptyCoords,
  forEachTile,
  highestTile,
  lineCoords,
  spawnTile,
  type Board,
  type Cell,
  type Coord,
  type Direction,
  type PlacedTile,
  type SpawnResult,
  type Tile,
} from './board';

export { bestMove } from './ai';

export { slideLine, type LineMerge, type SlideResult } from './moves';

export {
  canMove,
  clampSize,
  createGame,
  hasWon,
  isGameOver,
  keepPlaying,
  gameFromGrid,
  move,
  type GameState,
  type MergeEvent,
  type MoveOptions,
  type MoveResult,
  type NewGameOptions,
} from './game';

export { nextFloat, nextInt, seedRng, type RngState } from './rng';

export {
  achievements,
  emptyStats,
  recordGameOver,
  recordGameStarted,
  recordMove,
  recordWin,
  type Achievement,
  type Stats,
} from './stats';
