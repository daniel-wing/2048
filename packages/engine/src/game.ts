/**
 * Game state and the move transition.
 *
 * `GameState` is immutable: every transition returns a new state and leaves the
 * old one untouched. Undo is therefore just keeping references to previous
 * states — no snapshotting or deep-cloning required by the caller.
 */

import {
  DEFAULT_SIZE,
  DEFAULT_WIN_TARGET,
  MAX_SIZE,
  MIN_SIZE,
  type Board,
  type Coord,
  type Direction,
  type PlacedTile,
  cloneBoard,
  createEmptyBoard,
  highestTile,
  lineCoords,
  spawnTile,
} from './board';
import { slideLine } from './moves';
import { seedRng, type RngState } from './rng';

export type GameState = {
  size: number;
  board: Board;
  score: number;
  /** Monotonic source of stable tile ids. */
  nextTileId: number;
  rng: RngState;
  winTarget: number;
  /** True once the target tile has ever been reached this game. */
  won: boolean;
  /** Set when the player dismisses the win overlay to continue past the target. */
  keepPlaying: boolean;
  /** True when no legal move remains. */
  over: boolean;
};

export type MergeEvent = {
  survivorId: number;
  consumedId: number;
  value: number;
} & Coord;

export type MoveResult = {
  state: GameState;
  /** False when the move was illegal — nothing shifted, so nothing spawned. */
  moved: boolean;
  scoreGained: number;
  merges: MergeEvent[];
  spawned: PlacedTile | null;
  /** True only on the move that first reaches the win target. */
  justWon: boolean;
};

export type NewGameOptions = {
  size?: number;
  seed?: number;
  winTarget?: number;
};

export function clampSize(size: number): number {
  if (!Number.isFinite(size)) return DEFAULT_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.floor(size)));
}

/** Start a new game with the classic two opening tiles. */
export function createGame(options: NewGameOptions = {}): GameState {
  const size = clampSize(options.size ?? DEFAULT_SIZE);
  const winTarget = options.winTarget ?? DEFAULT_WIN_TARGET;
  const seed = options.seed ?? 1;

  let board = createEmptyBoard(size);
  let rng = seedRng(seed);
  let nextTileId = 1;

  for (let i = 0; i < 2; i++) {
    const spawn = spawnTile(board, rng, nextTileId);
    board = spawn.board;
    rng = spawn.rng;
    nextTileId = spawn.nextTileId;
  }

  return {
    size,
    board,
    score: 0,
    nextTileId,
    rng,
    winTarget,
    won: false,
    keepPlaying: false,
    over: false,
  };
}

/** Is any legal move available? */
export function canMove(board: Board): boolean {
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = board[row][col];
      if (cell === null) return true;
      const right = col + 1 < size ? board[row][col + 1] : null;
      const down = row + 1 < size ? board[row + 1][col] : null;
      if (right && right.value === cell.value) return true;
      if (down && down.value === cell.value) return true;
    }
  }
  return false;
}

export function isGameOver(board: Board): boolean {
  return !canMove(board);
}

export function hasWon(board: Board, winTarget: number = DEFAULT_WIN_TARGET): boolean {
  return highestTile(board) >= winTarget;
}

/**
 * Apply a move.
 *
 * When nothing shifts the move is a no-op: no tile spawns and the state is
 * returned unchanged. That guard is the difference between a fair game and one
 * that quietly fills the board when the player presses into a wall.
 */
/**
 * Build a game from a literal grid of values, 0 meaning an empty cell.
 *
 * For scripted positions — tutorial lessons, and tests that need an exact board
 * rather than a random one. Tile ids are assigned in reading order, so a caller
 * can predict them.
 *
 * The rng is still seeded, so a state built this way behaves normally if play
 * continues from it.
 */
export function gameFromGrid(
  grid: number[][],
  options: { seed?: number; score?: number; winTarget?: number } = {},
): GameState {
  if (!Array.isArray(grid)) {
    throw new Error('gameFromGrid: grid must be an array of rows');
  }

  const size = grid.length;
  if (size < MIN_SIZE || size > MAX_SIZE) {
    throw new Error(`gameFromGrid: size ${size} is outside ${MIN_SIZE}-${MAX_SIZE}`);
  }

  for (const row of grid) {
    if (!Array.isArray(row)) {
      throw new Error('gameFromGrid: every row must be an array');
    }
    if (row.length !== size) {
      throw new Error('gameFromGrid: grid must be square');
    }
    for (const value of row) {
      // Contents are checked, not just shape. This builds scripted positions
      // for the tutorial and for tests, where a silently-dropped -4 or an
      // unmergeable 3 is the worst possible failure: the position looks fine
      // and behaves wrongly.
      if (value === 0) continue;
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`gameFromGrid: ${String(value)} is not a number`);
      }
      if (value < 2 || !Number.isInteger(Math.log2(value))) {
        throw new Error(`gameFromGrid: ${value} is not 0 or a power of two >= 2`);
      }
    }
  }

  const score = options.score ?? 0;
  if (!Number.isFinite(score) || score < 0 || !Number.isInteger(score)) {
    throw new Error(`gameFromGrid: score ${score} must be a non-negative integer`);
  }

  let nextTileId = 1;
  const board: Board = grid.map((row) =>
    row.map((value) => (value > 0 ? { id: nextTileId++, value } : null)),
  );

  const winTarget = options.winTarget ?? DEFAULT_WIN_TARGET;

  const won = hasWon(board, winTarget);

  return {
    size,
    board,
    score,
    nextTileId,
    rng: seedRng(options.seed ?? 1),
    winTarget,
    won,
    // A position handed in already at the target is a scripted one — a tutorial
    // lesson, a test fixture — not a win the player just earned. Marking it as
    // already-continued keeps the win overlay from firing on the first frame.
    keepPlaying: won,
    over: isGameOver(board),
  };
}

/**
 * Options for a single move.
 */
export type MoveOptions = {
  /**
   * Whether a new tile spawns after a successful move. Defaults to true, which
   * is the real rule. Set false to demonstrate a slide or a merge in isolation
   * — the tutorial does this so a random tile cannot land mid-lesson and
   * distract from the point — and in tests that assert on board shape alone.
   */
  spawn?: boolean;
};

export function move(state: GameState, dir: Direction, options: MoveOptions = {}): MoveResult {
  const noop: MoveResult = {
    state,
    moved: false,
    scoreGained: 0,
    merges: [],
    spawned: null,
    justWon: false,
  };

  if (state.over) return noop;

  const { size } = state;
  const board = cloneBoard(state.board);
  const merges: MergeEvent[] = [];
  let gained = 0;
  let moved = false;

  for (let i = 0; i < size; i++) {
    const coords = lineCoords(size, dir, i);
    const line = coords.map(({ row, col }) => board[row][col]);
    const slid = slideLine(line);

    if (!slid.moved) continue;
    moved = true;
    gained += slid.gained;

    coords.forEach(({ row, col }, index) => {
      board[row][col] = slid.line[index];
    });

    for (const merge of slid.merges) {
      const at = coords[merge.index];
      merges.push({
        survivorId: merge.survivorId,
        consumedId: merge.consumedId,
        value: merge.value,
        row: at.row,
        col: at.col,
      });
    }
  }

  if (!moved) return noop;

  // A suppressed spawn still has to leave the state consistent, so the board
  // and rng are simply carried through untouched.
  const spawn =
    options.spawn === false
      ? { board, rng: state.rng, nextTileId: state.nextTileId, tile: null }
      : spawnTile(board, state.rng, state.nextTileId);

  const wonNow = hasWon(spawn.board, state.winTarget);

  const next: GameState = {
    ...state,
    board: spawn.board,
    score: state.score + gained,
    rng: spawn.rng,
    nextTileId: spawn.nextTileId,
    won: state.won || wonNow,
    over: isGameOver(spawn.board),
  };

  return {
    state: next,
    moved: true,
    scoreGained: gained,
    merges,
    spawned: spawn.tile,
    justWon: wonNow && !state.won,
  };
}

/** Dismiss the win overlay and keep playing past the target. */
export function keepPlaying(state: GameState): GameState {
  return state.keepPlaying ? state : { ...state, keepPlaying: true };
}
