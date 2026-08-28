/**
 * Store-level tests.
 *
 * The rules themselves are covered exhaustively in `@2048/engine`; these tests
 * cover the wiring the store adds on top — undo history, per-size best scores,
 * transient animation state, and the settings interaction.
 */

import { achievements, emptyStats, gameFromGrid } from '@2048/engine';

import { describeOutcome } from '../components/MoveAnnouncer';
import { describeAchievement } from '../i18n/achievements';
import { translate, type StringKey } from '../i18n/strings';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;

/** Play until something actually moves, so tests never assert on a no-op. */
function makeAnyMove(): boolean {
  for (const dir of DIRECTIONS) {
    const before = useGameStore.getState().game;
    useGameStore.getState().move(dir);
    if (useGameStore.getState().game !== before) return true;
  }
  return false;
}

beforeEach(() => {
  useSettingsStore.getState().resetSettings();
  useStatsStore.getState().resetStats();
  useGameStore.getState().resetEverything();
});

describe('gameStore', () => {
  it('starts a game with two tiles', () => {
    const { game } = useGameStore.getState();
    const tiles = game.board.flat().filter(Boolean);
    expect(tiles).toHaveLength(2);
    expect(game.score).toBe(0);
  });

  it('records history so a move can be undone', () => {
    const before = useGameStore.getState().game;
    expect(makeAnyMove()).toBe(true);

    expect(useGameStore.getState().history).toHaveLength(1);

    useGameStore.getState().undo();
    expect(useGameStore.getState().game).toBe(before);
    expect(useGameStore.getState().history).toHaveLength(0);
  });

  it('undo is a no-op with no history', () => {
    const before = useGameStore.getState().game;
    useGameStore.getState().undo();
    expect(useGameStore.getState().game).toBe(before);
  });

  it('keeps no history when undo is disabled', () => {
    useSettingsStore.getState().setUndoDepth(0);
    makeAnyMove();
    expect(useGameStore.getState().history).toHaveLength(0);
  });

  it('caps history at the configured depth', () => {
    useSettingsStore.getState().setUndoDepth(1);
    for (let i = 0; i < 6; i++) useGameStore.getState().move(DIRECTIONS[i % 4]);
    expect(useGameStore.getState().history.length).toBeLessThanOrEqual(1);
  });

  it('tracks best score per board size', () => {
    // Play a while on the default 4x4 to build a score.
    for (let i = 0; i < 40; i++) useGameStore.getState().move(DIRECTIONS[i % 4]);
    const { bests, game } = useGameStore.getState();
    expect(bests[game.size]).toBeGreaterThanOrEqual(game.score);

    // A different size starts from its own, independent best.
    useGameStore.getState().newGame(6);
    expect(useGameStore.getState().game.size).toBe(6);
    expect(useGameStore.getState().bests[6] ?? 0).toBe(0);
    // ...and the 4x4 best survives.
    expect(useGameStore.getState().bests[4]).toBe(bests[4]);
  });

  it('newGame resets the board and history but keeps bests', () => {
    for (let i = 0; i < 20; i++) useGameStore.getState().move(DIRECTIONS[i % 4]);
    const bestsBefore = { ...useGameStore.getState().bests };

    useGameStore.getState().newGame();
    const state = useGameStore.getState();

    expect(state.game.score).toBe(0);
    expect(state.history).toHaveLength(0);
    expect(state.game.board.flat().filter(Boolean)).toHaveLength(2);
    expect(state.bests).toEqual(bestsBefore);
  });

  it('clears transient animation state', () => {
    makeAnyMove();
    useGameStore.getState().clearTransients();
    const state = useGameStore.getState();
    expect(state.merges).toEqual([]);
    expect(state.vanishing).toEqual([]);
    expect(state.spawnedId).toBeNull();
  });

  it('does not persist transient animation state', () => {
    // partialize must keep animation state out of storage, or a reload would
    // replay a merge that already finished. Asserting the absent keys directly
    // states the invariant, rather than breaking every time a legitimate new
    // field is persisted.
    const persisted = useGameStore.persist.getOptions().partialize?.(
      useGameStore.getState(),
    ) as Record<string, unknown>;

    for (const transient of ['merges', 'spawnedId', 'vanishing', 'moveSeq', 'lastOutcome']) {
      expect(persisted).not.toHaveProperty(transient);
    }
    expect(Object.keys(persisted).sort()).toEqual([
      'bests',
      'game',
      'gameOverRecorded',
      'gameStartRecorded',
      'history',
    ]);
  });

  it('caps how much undo history is persisted', () => {
    // The whole in-memory history must not reach storage: writing ~360KB
    // synchronously on every move is what forced the write to stay small
    // enough to remain synchronous, and a synchronous write cannot lose the
    // last move to a phone locking mid-timer.
    for (let i = 0; i < 40; i++) makeAnyMove();

    const inMemory = useGameStore.getState().history.length;
    const persisted = useGameStore.persist.getOptions().partialize?.(
      useGameStore.getState(),
    ) as { history: unknown[] };

    expect(inMemory).toBeGreaterThan(20);
    expect(persisted.history.length).toBeLessThanOrEqual(20);
  });

  it('feeds move statistics through to the stats store', () => {
    expect(useStatsStore.getState().stats.totalMoves).toBe(0);
    makeAnyMove();
    expect(useStatsStore.getState().stats.totalMoves).toBe(1);
  });

  it('counts a new game in the stats', () => {
    const before = useStatsStore.getState().stats.gamesStarted;
    useGameStore.getState().newGame();
    expect(useStatsStore.getState().stats.gamesStarted).toBe(before + 1);
  });
});

describe('settingsStore', () => {
  it('clamps board size to the supported range', () => {
    useSettingsStore.getState().setSize(99);
    expect(useSettingsStore.getState().size).toBe(8);
    useSettingsStore.getState().setSize(1);
    expect(useSettingsStore.getState().size).toBe(3);
  });

  it('defaults to the Wing house theme', () => {
    // The game is published on wing.cx and should match it out of the box.
    // 'system' stays available as an explicit choice in settings.
    expect(useSettingsStore.getState().themePreference).toBe('wing');
  });

  it('can still opt into following the system theme', () => {
    useSettingsStore.getState().setThemePreference('system');
    expect(useSettingsStore.getState().themePreference).toBe('system');
  });
});


describe('recovering from a corrupt save', () => {
  /** Run a persisted payload through the store's own merge, as rehydration does. */
  function rehydrate(persisted: unknown) {
    const merge = useGameStore.persist.getOptions().merge!;
    return merge(persisted, useGameStore.getState()) as ReturnType<typeof useGameStore.getState>;
  }

  it('falls back to a playable game when the board is missing', () => {
    // A write truncated by a quota error leaves JSON that parses but is not a
    // board. Rendering it threw and blanked the page on every load after.
    const merged = rehydrate({ game: { size: 4, score: 0, board: null }, bests: {}, history: [] });

    expect(Array.isArray(merged.game.board)).toBe(true);
    expect(merged.game.board).toHaveLength(merged.game.size);
  });

  it.each([
    ['a board that is not an array', { size: 4, score: 0, board: 'nope' }],
    ['a board of the wrong size', { size: 4, score: 0, board: [[null], [null]] }],
    ['rows of the wrong length', { size: 2, score: 0, board: [[null, null], [null]] }],
    ['a tile with no value', { size: 1, score: 0, board: [[{ id: 1 }]] }],
    ['a missing score', { size: 4, board: [] }],
    ['null', null],
  ])('rejects %s', (_label, game) => {
    const merged = rehydrate({ game, bests: {}, history: [] });
    expect(Array.isArray(merged.game.board)).toBe(true);
    expect(merged.game.board).toHaveLength(merged.game.size);
  });

  it('drops history alongside a rejected game', () => {
    // History would otherwise point into a game that is no longer loaded.
    const merged = rehydrate({
      game: { size: 4, score: 0, board: null },
      bests: {},
      history: [{ anything: true }],
    });
    expect(merged.history).toEqual([]);
  });

  it('keeps a save that is actually intact', () => {
    const good = gameFromGrid([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 4],
    ], { score: 40 });

    const merged = rehydrate({ game: good, bests: { 4: 40 }, history: [] });
    expect(merged.game.score).toBe(40);
    expect(merged.bests[4]).toBe(40);
  });
});

describe('lifetime stats bookkeeping', () => {
  /**
   * A position where moving left ends the game, whatever spawns.
   *
   * Getting this deterministic matters: a checkerboard of 2s and 4s looks dead
   * but the spawned tile can land next to its own value and keep the game
   * alive. Here the only free square after the move is (3,3), whose neighbours
   * are 8 and 16 — so neither a 2 nor a 4 can merge with anything.
   */
  function oneMoveFromDeath() {
    return gameFromGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 8],
      [2, 4, 2, 16],
      [0, 4, 2, 8],
    ]);
  }

  it('counts a game over once, even across undo and losing again', () => {
    // The game-over overlay offers Undo, so lose-undo-lose is the normal path.
    // Counting each loss inflated gamesOver and added the score to the lifetime
    // total twice for a single game.
    useGameStore.getState().adoptGame(oneMoveFromDeath());
    const before = useStatsStore.getState().stats.gamesOver;

    useGameStore.getState().move('left');
    expect(useGameStore.getState().game.over).toBe(true);
    expect(useStatsStore.getState().stats.gamesOver).toBe(before + 1);

    useGameStore.getState().undo();
    expect(useGameStore.getState().game.over).toBe(false);

    useGameStore.getState().move('left');
    expect(useGameStore.getState().game.over).toBe(true);
    // Still one. The same game ended; it did not end twice.
    expect(useStatsStore.getState().stats.gamesOver).toBe(before + 1);
  });

  it('counts a fresh game over again after a new game', () => {
    useGameStore.getState().adoptGame(oneMoveFromDeath());
    const before = useStatsStore.getState().stats.gamesOver;
    useGameStore.getState().move('left');

    useGameStore.getState().adoptGame(oneMoveFromDeath());
    useGameStore.getState().move('left');

    expect(useStatsStore.getState().stats.gamesOver).toBe(before + 2);
  });

  it('counts an adopted position as a game started', () => {
    // Otherwise gamesOver can outrun gamesStarted.
    const before = useStatsStore.getState().stats.gamesStarted;
    useGameStore.getState().adoptGame(oneMoveFromDeath());
    expect(useStatsStore.getState().stats.gamesStarted).toBe(before + 1);
  });

  it('adoptGame clears history so undo cannot enter another game', () => {
    makeAnyMove();
    expect(useGameStore.getState().history.length).toBeGreaterThan(0);
    useGameStore.getState().adoptGame(oneMoveFromDeath());
    expect(useGameStore.getState().history).toEqual([]);
  });
});

/** A translator bound to one language, matching what useT() hands the component. */
const speak = (lang: 'en' | 'es') =>
  (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars);

describe('move outcomes for the screen reader', () => {
  it('reports a rejected move, which the board cannot show', () => {
    // Everything hard left already: moving left again is illegal.
    useGameStore.getState().adoptGame(
      gameFromGrid([
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [16, 0, 0, 0],
        [32, 0, 0, 0],
      ]),
    );
    useGameStore.getState().move('left');

    const outcome = useGameStore.getState().lastOutcome!;
    expect(outcome.moved).toBe(false);
    expect(describeOutcome(outcome, speak('en'))).toBe('No move left.');
  });

  it('bumps the sequence even when nothing moved, so repeats are announced', () => {
    useGameStore.getState().adoptGame(
      gameFromGrid([
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [16, 0, 0, 0],
        [32, 0, 0, 0],
      ]),
    );
    useGameStore.getState().move('left');
    const first = useGameStore.getState().lastOutcome!.seq;
    useGameStore.getState().move('left');
    expect(useGameStore.getState().lastOutcome!.seq).toBe(first + 1);
  });

  it('names the merge, the score and where the new tile landed', () => {
    useGameStore.getState().adoptGame(
      gameFromGrid([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
    );
    useGameStore.getState().move('left');

    const outcome = useGameStore.getState().lastOutcome!;
    expect(outcome.moved).toBe(true);
    expect(outcome.merged).toEqual([4]);

    const spoken = describeOutcome(outcome, speak('en'));
    expect(spoken).toContain('Moved left.');
    expect(spoken).toContain('Merged to 4.');
    expect(spoken).toContain('Score 4.');
    expect(spoken).toMatch(/New tile \d+ at row \d+, column \d+\./);
  });

  it('uses one-based coordinates, since they are spoken to a person', () => {
    const spoken = describeOutcome(
      {
        seq: 1,
        dir: 'up',
        moved: true,
        merged: [],
        score: 0,
        spawned: { value: 2, row: 0, col: 0 },
      },
      speak('en'),
    );
    expect(spoken).toContain('row 1, column 1');
  });

  it('speaks Spanish when Spanish is in effect', () => {
    // The announcement is the only feedback a screen-reader user gets, so it
    // has to follow the site's language toggle like everything else.
    const outcome = {
      seq: 1,
      dir: 'left' as const,
      moved: true,
      merged: [4],
      score: 4,
      spawned: { value: 2, row: 2, col: 3 },
    };

    const spoken = describeOutcome(outcome, speak('es'));
    expect(spoken).toContain('Moviste hacia la izquierda.');
    expect(spoken).toContain('Se combinaron en 4.');
    expect(spoken).toContain('fila 3, columna 4');
    // Word boundaries matter here: a naive /column/ matches inside "columna".
    expect(spoken).not.toMatch(/\bMoved\b|\brow\b|\bcolumn\b/);
  });

  it('falls back to English for a key with no translation', () => {
    // A half-translated screen should read, not show raw keys.
    expect(translate('es', 'theme.wing')).toBe('Wing');
  });
});

describe('achievement translation', () => {
  /*
    The regression that prompted this: the dictionary was written from memory
    rather than read off the engine, so ids like `tile-128` and `dedicated` had
    no key and the Stats screen printed `achv.tile-128.label` to the player.
    Asserting over the engine's real list is what makes drift impossible.
  */
  const ALL = achievements(emptyStats);

  it.each(['en', 'es'] as const)('renders every engine achievement in %s', (lang) => {
    expect(ALL.length).toBeGreaterThan(0);

    for (const achievement of ALL) {
      const { label, description } = describeAchievement(achievement, speak(lang));

      expect(label).not.toContain('achv.');
      expect(description).not.toContain('achv.');
      expect(label.length).toBeGreaterThan(0);
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('substitutes the tile value into the shared parametric string', () => {
    const tile2048 = ALL.find((a) => a.id === 'tile-2048');
    expect(tile2048).toBeDefined();

    expect(describeAchievement(tile2048!, speak('en')).label).toBe('Reach 2048');
    expect(describeAchievement(tile2048!, speak('es')).label).toBe('Llegar a 2048');
  });

  it('falls back to the engine wording for an id the dictionary has never heard of', () => {
    const unknown = { id: 'invented-later', label: 'Invented', description: 'Later.', achieved: false };

    expect(describeAchievement(unknown, speak('es'))).toEqual({
      label: 'Invented',
      description: 'Later.',
    });
  });
});
