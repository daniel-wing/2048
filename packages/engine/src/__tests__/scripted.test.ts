/**
 * Scripted positions: building a game from a literal grid, and moving without
 * spawning. Both exist so a caller can demonstrate or assert one rule at a time
 * without a random tile landing in the middle of it.
 */

import { gameFromGrid, move, type Board } from '../index';

/** Board back to plain numbers, so expectations read like the grid literal. */
function toGrid(board: Board): number[][] {
  return board.map((row) => row.map((cell) => (cell ? cell.value : 0)));
}

describe('gameFromGrid', () => {
  it('places tiles exactly where the grid says', () => {
    const game = gameFromGrid([
      [2, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 8, 0, 0],
      [0, 0, 0, 16],
    ]);

    expect(toGrid(game.board)).toEqual([
      [2, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 8, 0, 0],
      [0, 0, 0, 16],
    ]);
    expect(game.size).toBe(4);
    expect(game.score).toBe(0);
  });

  it('gives every tile a distinct id', () => {
    const game = gameFromGrid([
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
    ]);
    const ids = game.board.flat().map((cell) => cell!.id);
    expect(new Set(ids).size).toBe(16);
  });

  it('derives won and over from the position it is given', () => {
    const won = gameFromGrid([
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(won.won).toBe(true);
    expect(won.over).toBe(false);

    // Fully packed with no equal neighbours: no legal move remains.
    const dead = gameFromGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(dead.over).toBe(true);
  });

  it('rejects a grid that is not square, and sizes out of range', () => {
    expect(() => gameFromGrid([[2, 0], [0, 0], [0, 0]])).toThrow(/square/);
    expect(() => gameFromGrid([[2]])).toThrow(/outside/);
  });

  it('accepts an explicit starting score', () => {
    expect(gameFromGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], { score: 40 }).score)
      .toBe(40);
  });
});

describe('move with spawning suppressed', () => {
  const start = () =>
    gameFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

  it('leaves exactly the tiles the slide produced', () => {
    const result = move(start(), 'left', { spawn: false });

    expect(result.moved).toBe(true);
    expect(result.spawned).toBeNull();
    expect(toGrid(result.state.board)).toEqual([
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it('still scores the merge', () => {
    expect(move(start(), 'left', { spawn: false }).scoreGained).toBe(4);
  });

  it('does not consume the rng, so the state stays reproducible', () => {
    const before = start();
    const after = move(before, 'left', { spawn: false }).state;
    expect(after.rng).toEqual(before.rng);
    expect(after.nextTileId).toBe(before.nextTileId);
  });

  it('spawns by default, matching the real rule', () => {
    const result = move(start(), 'left');
    expect(result.spawned).not.toBeNull();
    expect(result.state.board.flat().filter(Boolean)).toHaveLength(2);
  });

  it('an illegal move still does nothing either way', () => {
    const packed = gameFromGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(move(packed, 'left', { spawn: false }).moved).toBe(false);
  });
});
