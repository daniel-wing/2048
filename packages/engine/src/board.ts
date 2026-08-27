/**
 * Board types and primitives.
 *
 * A board is `board[row][col]`. Each cell is either `null` (empty) or a tile.
 * Tiles carry a stable `id` that survives across moves — the UI animates by id,
 * which is what makes slides and merges look real rather than like a redraw.
 */

import { nextFloat, nextInt, type RngState } from './rng';

export type Tile = { id: number; value: number };
export type Cell = Tile | null;
export type Board = Cell[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export type Coord = { row: number; col: number };
export type PlacedTile = Tile & Coord;

export const MIN_SIZE = 3;
export const MAX_SIZE = 8;
export const DEFAULT_SIZE = 4;
export const DEFAULT_WIN_TARGET = 2048;

/** Probability that a newly spawned tile is a 4 rather than a 2. */
const FOUR_SPAWN_CHANCE = 0.1;

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null as Cell));
}

/** Shallow-clones the row arrays; cells themselves are immutable and shared. */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function emptyCoords(board: Board): Coord[] {
  const out: Coord[] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === null) out.push({ row, col });
    }
  }
  return out;
}

export function forEachTile(board: Board, fn: (tile: Tile, coord: Coord) => void): void {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell) fn(cell, { row, col });
    }
  }
}

export function highestTile(board: Board): number {
  let max = 0;
  forEachTile(board, (tile) => {
    if (tile.value > max) max = tile.value;
  });
  return max;
}

export type SpawnResult = {
  board: Board;
  tile: PlacedTile | null;
  rng: RngState;
  nextTileId: number;
};

/**
 * Place one new tile (90% a 2, 10% a 4) in a uniformly random empty cell.
 * Returns `tile: null` when the board is full. Never mutates its input.
 */
export function spawnTile(
  board: Board,
  rng: RngState,
  nextTileId: number,
): SpawnResult {
  const empties = emptyCoords(board);
  if (empties.length === 0) {
    return { board, tile: null, rng, nextTileId };
  }

  const [index, afterIndex] = nextInt(rng, empties.length);
  const [roll, afterRoll] = nextFloat(afterIndex);

  const { row, col } = empties[index];
  const tile: Tile = { id: nextTileId, value: roll < FOUR_SPAWN_CHANCE ? 4 : 2 };

  const next = cloneBoard(board);
  next[row][col] = tile;

  return {
    board: next,
    tile: { ...tile, row, col },
    rng: afterRoll,
    nextTileId: nextTileId + 1,
  };
}

/**
 * Coordinates of one line, ordered from the "front" (the edge tiles pile up
 * against for this direction) to the back. Sliding is then always the same
 * operation — compact toward index 0 — regardless of direction.
 */
export function lineCoords(size: number, dir: Direction, index: number): Coord[] {
  const out: Coord[] = [];
  for (let i = 0; i < size; i++) {
    switch (dir) {
      case 'left':
        out.push({ row: index, col: i });
        break;
      case 'right':
        out.push({ row: index, col: size - 1 - i });
        break;
      case 'up':
        out.push({ row: i, col: index });
        break;
      case 'down':
        out.push({ row: size - 1 - i, col: index });
        break;
    }
  }
  return out;
}
