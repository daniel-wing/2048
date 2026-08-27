/**
 * Test helpers: convert between readable numeric grids and real boards so the
 * assertions read like the game looks. `0` means an empty cell.
 */

import type { Board, Cell } from '../board';

let idCounter = 0;

/** Fresh ids per call so a grid never accidentally reuses another grid's ids. */
export function line(values: number[]): Cell[] {
  return values.map((value) => (value === 0 ? null : { id: ++idCounter, value }));
}

export function grid(values: number[][]): Board {
  return values.map((row) => line(row));
}

export function toNumbers(board: Board): number[][] {
  return board.map((row) => row.map((cell) => (cell ? cell.value : 0)));
}

export function lineToNumbers(cells: Cell[]): number[] {
  return cells.map((cell) => (cell ? cell.value : 0));
}

export function allTiles(board: Board) {
  return board.flat().filter((cell): cell is NonNullable<Cell> => cell !== null);
}
