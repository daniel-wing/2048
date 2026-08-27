/**
 * The computer player.
 *
 * These are behavioural tests, not exact-output tests: the AI is deterministic
 * for a given position, but asserting on specific directions would break on any
 * weight change without telling us anything useful. What matters is that it
 * only ever returns legal moves, and that it actually plays well.
 */

import { bestMove, createGame, gameFromGrid, highestTile, move, type Direction } from '../index';

/** Play a whole game and report where it got to. */
function playOut(seed: number, moveCap = 3000) {
  let state = createGame({ size: 4, seed });
  let moves = 0;

  while (!state.over && moves < moveCap) {
    const dir = bestMove(state.board);
    if (!dir) break;
    const result = move(state, dir);
    // A move the AI proposes must always be legal, or it would deadlock.
    expect(result.moved).toBe(true);
    state = result.state;
    moves++;
  }

  return { best: highestTile(state.board), score: state.score, moves };
}

describe('bestMove', () => {
  it('returns null only when the position is dead', () => {
    const dead = gameFromGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(bestMove(dead.board)).toBeNull();

    const alive = gameFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(bestMove(alive.board)).not.toBeNull();
  });

  it('never proposes a move that does nothing', () => {
    // Everything already hard left: moving left again is illegal.
    const packedLeft = gameFromGrid([
      [4, 0, 0, 0],
      [8, 0, 0, 0],
      [16, 0, 0, 0],
      [32, 0, 0, 0],
    ]);
    const dir = bestMove(packedLeft.board);
    expect(dir).not.toBe('left');
    expect(move(packedLeft, dir as Direction, { spawn: false }).moved).toBe(true);
  });

  it('takes a free merge when nothing is at stake', () => {
    const twoPairs = gameFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const dir = bestMove(twoPairs.board)!;
    expect(move(twoPairs, dir, { spawn: false }).scoreGained).toBe(4);
  });

  it('is deterministic for a given position', () => {
    const game = createGame({ size: 4, seed: 99 });
    expect(bestMove(game.board)).toBe(bestMove(game.board));
  });

  it('works on board sizes other than 4x4', () => {
    for (const size of [3, 5, 6]) {
      const game = createGame({ size, seed: 5 });
      const dir = bestMove(game.board);
      expect(dir).not.toBeNull();
      expect(move(game, dir as Direction).moved).toBe(true);
    }
  });
});

describe('how well it actually plays', () => {
  // Guards the strength the "watch a game" demo depends on.
  //
  // Deliberately ONE game, shared by both assertions. Playing a full game is
  // slow — six of them took two minutes, which is enough friction that people
  // stop running the suite. One game costs a few seconds and still catches a
  // real regression: the earlier positional-weight heuristic peaked at 512
  // across every seed, and the thresholds below sit under the benchmarked
  // median of 2048 so ordinary weight tuning will not turn this red.
  let result: ReturnType<typeof playOut>;

  beforeAll(() => {
    result = playOut(1);
  }, 60_000);

  it('reaches at least 1024', () => {
    expect(result.best).toBeGreaterThanOrEqual(1024);
  });

  it('scores well past a beginner game', () => {
    expect(result.score).toBeGreaterThan(10_000);
  });

  it('plays a long game rather than stalling early', () => {
    expect(result.moves).toBeGreaterThan(400);
  });
});
