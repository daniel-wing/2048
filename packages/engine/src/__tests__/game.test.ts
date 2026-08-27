import { createEmptyBoard, type Direction } from '../board';
import {
  canMove,
  createGame,
  hasWon,
  isGameOver,
  keepPlaying,
  move,
  type GameState,
} from '../game';
import { seedRng } from '../rng';
import { allTiles, grid, toNumbers } from './helpers';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

function stateFrom(values: number[][], overrides: Partial<GameState> = {}): GameState {
  const board = grid(values);
  return {
    size: board.length,
    board,
    score: 0,
    // Far above the helper's id counter so spawned tiles can never collide
    // with the ids the fixture handed out.
    nextTileId: 1_000_000,
    rng: seedRng(42),
    winTarget: 2048,
    won: false,
    keepPlaying: false,
    over: false,
    ...overrides,
  };
}

describe('createGame', () => {
  it('starts with exactly two tiles', () => {
    const state = createGame({ seed: 7 });
    expect(allTiles(state.board)).toHaveLength(2);
  });

  it('starts with only 2s and 4s', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const tile of allTiles(createGame({ seed }).board)) {
        expect([2, 4]).toContain(tile.value);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(toNumbers(createGame({ seed: 99 }).board)).toEqual(
      toNumbers(createGame({ seed: 99 }).board),
    );
  });

  it('honours and clamps the board size', () => {
    expect(createGame({ size: 6 }).size).toBe(6);
    expect(createGame({ size: 2 }).size).toBe(3);
    expect(createGame({ size: 99 }).size).toBe(8);
  });

  it('starts with a zero score and no win', () => {
    const state = createGame({ seed: 1 });
    expect(state.score).toBe(0);
    expect(state.won).toBe(false);
    expect(state.over).toBe(false);
  });
});

describe('move — direction', () => {
  it('merges toward the left edge', () => {
    const result = move(stateFrom([[0, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(result.state.board[0][0]?.value).toBe(4);
    expect(result.scoreGained).toBe(4);
  });

  it('merges toward the right edge', () => {
    const result = move(stateFrom([[0, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'right');
    expect(result.state.board[0][3]?.value).toBe(4);
  });

  it('merges toward the top edge', () => {
    const result = move(stateFrom([[2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'up');
    expect(result.state.board[0][0]?.value).toBe(4);
  });

  it('merges toward the bottom edge', () => {
    const result = move(stateFrom([[2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'down');
    expect(result.state.board[3][0]?.value).toBe(4);
  });
});

describe('move — legality', () => {
  it('is a no-op when nothing can shift', () => {
    const state = stateFrom([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    const result = move(state, 'left');

    expect(result.moved).toBe(false);
    expect(result.state).toBe(state);
    expect(result.spawned).toBeNull();
  });

  it('does not spawn a tile on an illegal move', () => {
    // Already packed left: pressing left changes nothing.
    const state = stateFrom([[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const before = allTiles(state.board).length;
    const result = move(state, 'left');

    expect(result.moved).toBe(false);
    expect(allTiles(result.state.board)).toHaveLength(before);
  });

  it('spawns exactly one tile on a legal move', () => {
    const state = stateFrom([[0, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const result = move(state, 'left');

    expect(result.moved).toBe(true);
    expect(result.spawned).not.toBeNull();
    expect(allTiles(result.state.board)).toHaveLength(2);
  });

  it('refuses to move once the game is over', () => {
    const state = stateFrom([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]], {
      over: true,
    });
    expect(move(state, 'up').moved).toBe(false);
  });

  it('does not mutate the previous state', () => {
    const state = stateFrom([[0, 0, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const snapshot = toNumbers(state.board);

    move(state, 'left');

    expect(toNumbers(state.board)).toEqual(snapshot);
    expect(state.score).toBe(0);
  });
});

describe('move — scoring', () => {
  it('adds the value of each created tile', () => {
    const result = move(stateFrom([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    // 2+2 -> 4, 4+4 -> 8
    expect(result.scoreGained).toBe(12);
    expect(result.state.score).toBe(12);
  });

  it('accumulates across moves', () => {
    let state = stateFrom([[2, 2, 0, 0], [2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    state = move(state, 'left').state;
    const first = state.score;
    state = move(state, 'up').state;

    expect(first).toBe(8);
    expect(state.score).toBeGreaterThanOrEqual(first);
  });

  it('scores nothing for a pure slide', () => {
    expect(move(stateFrom([[0, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left').scoreGained).toBe(0);
  });
});

describe('move — merge reporting', () => {
  it('reports the survivor, the consumed tile and where it landed', () => {
    const state = stateFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const survivorId = state.board[0][0]!.id;
    const consumedId = state.board[0][1]!.id;

    const result = move(state, 'left');

    expect(result.merges).toEqual([
      { survivorId, consumedId, value: 4, row: 0, col: 0 },
    ]);
  });

  it('reports every merge in a multi-row move', () => {
    const result = move(
      stateFrom([[2, 2, 0, 0], [4, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
      'left',
    );
    expect(result.merges).toHaveLength(2);
    expect(result.merges.map((m) => m.value).sort((a, b) => a - b)).toEqual([4, 8]);
  });
});

describe('win and game over', () => {
  it('detects a win and flags the exact move that caused it', () => {
    const state = stateFrom([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const result = move(state, 'left');

    expect(result.justWon).toBe(true);
    expect(result.state.won).toBe(true);
  });

  it('only flags justWon once', () => {
    let state = stateFrom([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    state = move(state, 'left').state;
    const second = move(state, 'right');

    expect(second.state.won).toBe(true);
    expect(second.justWon).toBe(false);
  });

  it('does not end the game on a win', () => {
    const result = move(
      stateFrom([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
      'left',
    );
    expect(result.state.over).toBe(false);
  });

  it('hasWon respects a custom target', () => {
    const board = grid([[64, 0], [0, 0]]);
    expect(hasWon(board, 64)).toBe(true);
    expect(hasWon(board, 128)).toBe(false);
  });

  it('canMove is true while an empty cell remains', () => {
    expect(canMove(createEmptyBoard(4))).toBe(true);
  });

  it('canMove is true on a full board with an adjacent pair', () => {
    expect(
      canMove(
        grid([
          [2, 2, 4, 8],
          [4, 8, 16, 32],
          [8, 16, 32, 64],
          [16, 32, 64, 128],
        ]),
      ),
    ).toBe(true);
  });

  it('detects game over on a full gridlocked board', () => {
    const board = grid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(board)).toBe(false);
    expect(isGameOver(board)).toBe(true);
  });

  it('sets over when the final move gridlocks the board', () => {
    // Exactly one empty cell, and the spawn lands next to 8/16 neighbours — so
    // the board is gridlocked whether the new tile rolls a 2 or a 4. Asserting
    // this without depending on the spawn value keeps the test deterministic.
    const state = stateFrom([
      [0, 8, 16, 8],
      [4, 2, 4, 16],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    const result = move(state, 'left');

    expect(result.moved).toBe(true);
    expect(result.spawned).not.toBeNull();
    expect(allTiles(result.state.board)).toHaveLength(16);
    expect(result.state.over).toBe(true);
  });

  it('keepPlaying is sticky', () => {
    const state = stateFrom([[2, 0], [0, 0]]);
    const continued = keepPlaying(state);
    expect(continued.keepPlaying).toBe(true);
    expect(keepPlaying(continued)).toBe(continued);
  });
});

describe('integrity over long random games', () => {
  it.each([1, 2, 3, 4, 5])('keeps tile ids unique and values valid (seed %i)', (seed) => {
    let state = createGame({ seed, size: 4 });
    let rng = seed * 7919;

    for (let step = 0; step < 400 && !state.over; step++) {
      // Deterministic direction choice so a failure is reproducible.
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      const dir = DIRECTIONS[rng % 4];
      state = move(state, dir).state;

      const tiles = allTiles(state.board);
      const ids = new Set(tiles.map((t) => t.id));

      expect(ids.size).toBe(tiles.length);
      expect(tiles.length).toBeLessThanOrEqual(16);
      for (const tile of tiles) {
        expect(tile.value).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(Math.log2(tile.value))).toBe(true);
      }
    }
  });

  it('never lets the score decrease', () => {
    let state = createGame({ seed: 11 });
    let previous = state.score;

    for (let step = 0; step < 300 && !state.over; step++) {
      state = move(state, DIRECTIONS[step % 4]).state;
      expect(state.score).toBeGreaterThanOrEqual(previous);
      previous = state.score;
    }
  });

  it.each([3, 5, 6, 8])('plays out on a %ix%i board', (size) => {
    let state = createGame({ seed: 3, size });

    for (let step = 0; step < 300 && !state.over; step++) {
      state = move(state, DIRECTIONS[step % 4]).state;
      expect(state.board).toHaveLength(size);
      expect(allTiles(state.board).length).toBeLessThanOrEqual(size * size);
    }
  });
});
