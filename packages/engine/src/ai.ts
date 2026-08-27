/**
 * A computer player, for the "watch a game" demo.
 *
 * Pure and synchronous like the rest of the engine: give it a position, it
 * returns a direction. It holds no state, so the caller drives the pace and can
 * stop, restart, or hand the position to a human at any point.
 *
 * The search is expectimax rather than minimax, because the opponent here is
 * not adversarial — it is a uniformly random tile spawn. Minimax would assume
 * the worst possible spawn every time and play far too defensively.
 */

import { cloneBoard, emptyCoords, type Board, type Direction } from './board';
import { slideLine } from './moves';
import { lineCoords } from './board';

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

/** Probability the random spawn is a 4 rather than a 2, per the game's rules. */
const FOUR_CHANCE = 0.1;

function tileRank(value: number): number {
  // Rank, not raw value: the step from 512 to 1024 should weigh the same as the
  // step from 2 to 4.
  return value > 0 ? Math.log2(value) : 0;
}

/** Board as ranks, with 0 for an empty square. Cheaper to scan repeatedly. */
function ranks(board: Board): number[][] {
  return board.map((row) => row.map((cell) => (cell ? tileRank(cell.value) : 0)));
}

/**
 * How consistently ranks increase (or decrease) along each row and column.
 *
 * This is the term that encodes the habit the tutorial teaches: an ordered run
 * of tiles down one edge. Each axis is scored both ways and the better
 * direction is kept, so the AI is free to pick whichever corner the game gives
 * it rather than being forced into one.
 *
 * A first attempt used a fixed positional weight table instead. It scored
 * worse the deeper the search went, because a table rewards tiles for sitting
 * on high-value squares even when that wrecks the ordering — and more search
 * just pursued that harder.
 */
function monotonicity(g: number[][]): number {
  const size = g.length;
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j + 1 < size; j++) {
      const a = g[i][j];
      const b = g[i][j + 1];
      if (a > b) right += b - a;
      else left += a - b;

      const c = g[j][i];
      const d = g[j + 1][i];
      if (c > d) down += d - c;
      else up += c - d;
    }
  }

  return Math.max(left, right) + Math.max(up, down);
}

/** Penalty for neighbours of very different rank: they can never merge. */
function smoothness(g: number[][]): number {
  const size = g.length;
  let total = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = g[row][col];
      if (value === 0) continue;
      if (col + 1 < size && g[row][col + 1] > 0) total -= Math.abs(value - g[row][col + 1]);
      if (row + 1 < size && g[row + 1][col] > 0) total -= Math.abs(value - g[row + 1][col]);
    }
  }
  return total;
}

/**
 * Score a position; higher is better.
 *
 * Free space carries the largest weight because running out of squares is the
 * only way to actually lose. The weights are the well-worn set from the
 * published expectimax players, and were checked here by playing whole games
 * rather than by eye.
 */
function evaluate(board: Board): number {
  const g = ranks(board);
  const free = emptyCoords(board).length;

  let max = 0;
  for (const row of g) for (const value of row) if (value > max) max = value;

  return (
    monotonicity(g) * 1.0 +
    smoothness(g) * 0.1 +
    Math.log(free + 1) * 2.7 * 4 +
    max * 1.0
  );
}

/** Apply a direction to a bare board. Returns null when nothing moves. */
function slide(board: Board, dir: Direction): { board: Board; gained: number } | null {
  const size = board.length;
  const next = cloneBoard(board);
  let moved = false;
  let gained = 0;

  for (let i = 0; i < size; i++) {
    const coords = lineCoords(size, dir, i);
    const line = coords.map(({ row, col }) => next[row][col]);
    const slid = slideLine(line);
    if (!slid.moved) continue;
    moved = true;
    gained += slid.gained;
    coords.forEach(({ row, col }, index) => {
      next[row][col] = slid.line[index];
    });
  }

  return moved ? { board: next, gained } : null;
}

/**
 * How deep to look. Searching hard is only worth it when the board is tight;
 * with plenty of space almost anything is recoverable, and the extra plies cost
 * time the UI thread does not have.
 */
function depthFor(free: number): number {
  if (free <= 2) return 6;
  if (free <= 4) return 5;
  if (free <= 8) return 4;
  return 3;
}

function expectimax(board: Board, depth: number, chance: boolean, nextId: number): number {
  if (depth <= 0) return evaluate(board);

  if (!chance) {
    let best = -Infinity;
    for (const dir of DIRECTIONS) {
      const result = slide(board, dir);
      if (!result) continue;
      best = Math.max(best, expectimax(result.board, depth - 1, true, nextId));
    }
    // No legal move: this line ends here.
    return best === -Infinity ? evaluate(board) : best;
  }

  const empties = emptyCoords(board);
  if (empties.length === 0) return evaluate(board);

  // Averaging over every empty square is the correct expectation but the cost
  // explodes. On a roomy board the exact placement barely matters, so a spread
  // of candidates gives the same decision far cheaper.
  const step = empties.length > 6 ? Math.ceil(empties.length / 6) : 1;
  const sampled = empties.filter((_, index) => index % step === 0);

  let total = 0;
  for (const { row, col } of sampled) {
    for (const [value, probability] of [[2, 1 - FOUR_CHANCE], [4, FOUR_CHANCE]] as const) {
      const next = cloneBoard(board);
      next[row][col] = { id: nextId, value };
      total += probability * expectimax(next, depth - 1, false, nextId + 1);
    }
  }
  return total / sampled.length;
}

/**
 * The move the computer would play, or null when the position is dead.
 *
 * Deterministic: the same position always yields the same answer, so a demo can
 * be reproduced from its seed.
 */
export function bestMove(board: Board, options: { depth?: number } = {}): Direction | null {
  const free = emptyCoords(board).length;
  const depth = options.depth ?? depthFor(free);

  let best: Direction | null = null;
  let bestScore = -Infinity;

  for (const dir of DIRECTIONS) {
    const result = slide(board, dir);
    if (!result) continue;

    // The immediate merge score is worth a nudge, but only a nudge: chasing it
    // greedily is exactly how a player wrecks their own corner.
    const score = expectimax(result.board, depth - 1, true, 1_000_000) + result.gained * 0.1;

    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }

  return best;
}
