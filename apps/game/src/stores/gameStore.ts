/**
 * Game store.
 *
 * Holds engine state and the small amount of presentation state the animations
 * need. It never implements a game rule itself — every transition goes through
 * `@2048/engine`, which is what keeps the rules unit-tested and portable.
 */

import {
  createGame,
  highestTile,
  keepPlaying as keepPlayingState,
  move as applyMove,
  type Direction,
  type GameState,
  type MergeEvent,
} from '@2048/engine';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { haptic } from '../platform/haptics';
import { storage } from '../platform/storage';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

export const GAME_STORAGE_KEY = '2048.game.v1';

/** How long a consumed tile keeps rendering while it slides into its survivor. */
export const MERGE_ANIMATION_MS = 140;

/** Hard cap on in-memory undo history so "unlimited" cannot grow without bound. */
const MAX_HISTORY = 200;

/**
 * How much history survives a reload.
 *
 * Persisting all 200 snapshots meant `JSON.stringify`ing up to ~360 KB on every
 * single move, synchronously, into a 5 MB quota shared with the rest of the
 * site. Twenty snapshots is ~5 KB at 4x4 and keeps the write sub-millisecond,
 * which is what lets the write stay synchronous — and a synchronous write
 * cannot lose the last move to a phone locking mid-timer.
 *
 * The visible consequence: undo is unlimited within a session, and twenty moves
 * deep after a reload.
 */
const PERSISTED_HISTORY = 20;

/** A tile that has been merged away but is still animating to its destination. */
export type VanishingTile = {
  id: number;
  value: number;
  row: number;
  col: number;
};

/**
 * What the last move attempt did, for the screen reader announcement.
 *
 * `seq` increments on every *attempt*, including rejected ones — a move that
 * does nothing still needs saying, and it is the one case the player cannot
 * infer from the board.
 */
export type MoveOutcome = {
  seq: number;
  dir: Direction;
  moved: boolean;
  /** Values created by merges this move, e.g. [8, 16]. */
  merged: number[];
  score: number;
  spawned: { value: number; row: number; col: number } | null;
};

export type GameStoreState = {
  game: GameState;
  /** Best score per board size — a 3x3 best is not comparable to an 8x8 best. */
  bests: Record<number, number>;
  history: GameState[];

  /**
   * Whether this game's ending has already been added to lifetime stats.
   *
   * Undo can walk back out of a finished game — the game-over overlay offers it
   * — and without this the same defeat is counted every time the player loses,
   * undoes, and loses again. Persisted, because a reload between the loss and
   * the undo must not forget that it was already counted.
   */
  gameOverRecorded: boolean;
  /** Whether the current game has been counted in `gamesStarted`. */
  gameStartRecorded: boolean;

  /** Presentation-only, never persisted. */
  merges: MergeEvent[];
  spawnedId: number | null;
  vanishing: VanishingTile[];
  /** Bumps on every committed move so effects can react to "a move happened". */
  moveSeq: number;
  lastOutcome: MoveOutcome | null;

  move: (dir: Direction) => void;
  newGame: (size?: number) => void;
  undo: () => void;
  continuePlaying: () => void;
  /** Adopt a position from elsewhere — the watch screen's "take over". */
  adoptGame: (game: GameState) => void;
  clearTransients: () => void;
  resetEverything: () => void;
};

function freshGame(size: number): GameState {
  // Date.now() gives each game a different sequence; the engine itself stays
  // pure and seeded, so any single game remains reproducible from its seed.
  return createGame({ size, seed: Date.now() >>> 0 });
}

/**
 * Is this shape safe to render?
 *
 * Persisted state is attacker-adjacent in the mundane sense: a write truncated
 * by a quota error or a crash leaves JSON that parses but is missing fields.
 * Rendering it threw inside `forEachTile` and blanked the page on *every*
 * subsequent load, with no way back short of clearing site data by hand.
 */
function isPlausibleGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<GameState>;

  if (typeof game.size !== 'number' || !Number.isInteger(game.size)) return false;
  if (game.size < 2 || game.size > 12) return false;
  if (typeof game.score !== 'number' || !Number.isFinite(game.score)) return false;
  if (!Array.isArray(game.board) || game.board.length !== game.size) return false;

  for (const row of game.board) {
    if (!Array.isArray(row) || row.length !== game.size) return false;
    for (const cell of row) {
      if (cell === null) continue;
      if (!cell || typeof cell !== 'object') return false;
      const tile = cell as { id?: unknown; value?: unknown };
      if (typeof tile.id !== 'number' || typeof tile.value !== 'number') return false;
    }
  }

  return true;
}

let vanishTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Cancel any pending transient clear.
 *
 * Every transition that resets the board must do this. Today the late callback
 * would be a harmless no-op because these transitions already zero the
 * transients, but the moment one of them sets a spawn animation the stale timer
 * would wipe it ~140ms in.
 */
function cancelVanishTimer(): void {
  if (vanishTimer) {
    clearTimeout(vanishTimer);
    vanishTimer = null;
  }
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      game: freshGame(useSettingsStore.getState().size),
      bests: {},
      history: [],
      gameOverRecorded: false,
      gameStartRecorded: false,
      merges: [],
      spawnedId: null,
      vanishing: [],
      moveSeq: 0,
      lastOutcome: null,

      move: (dir) => {
        const { game, history, bests, moveSeq, lastOutcome } = get();
        const nextSeq = (lastOutcome?.seq ?? 0) + 1;

        if (game.over) {
          set({ lastOutcome: { seq: nextSeq, dir, moved: false, merged: [], score: game.score, spawned: null } });
          return;
        }

        const result = applyMove(game, dir);

        // A rejected move still has to be announced. It is the only outcome the
        // player cannot read off the board, so silence here reads as "did my
        // input register at all?".
        if (!result.moved) {
          set({ lastOutcome: { seq: nextSeq, dir, moved: false, merged: [], score: game.score, spawned: null } });
          return;
        }

        const settings = useSettingsStore.getState();
        const stats = useStatsStore.getState();

        // Consumed tiles keep rendering briefly at their destination so they
        // can be seen sliding into the surviving tile.
        const vanishing: VanishingTile[] = result.merges.map((merge) => ({
          id: merge.consumedId,
          value: merge.value / 2,
          row: merge.row,
          col: merge.col,
        }));

        const nextHistory =
          settings.undoDepth === 0
            ? []
            : [...history, game].slice(
                -(settings.undoDepth === -1 ? MAX_HISTORY : settings.undoDepth),
              );

        const size = result.state.size;
        const best = Math.max(bests[size] ?? 0, result.state.score);
        const top = highestTile(result.state.board);

        set({
          game: result.state,
          history: nextHistory,
          bests: { ...bests, [size]: best },
          merges: result.merges,
          spawnedId: result.spawned?.id ?? null,
          vanishing,
          moveSeq: moveSeq + 1,
          lastOutcome: {
            seq: nextSeq,
            dir,
            moved: true,
            merged: result.merges.map((m) => m.value),
            score: result.state.score,
            spawned: result.spawned
              ? { value: result.spawned.value, row: result.spawned.row, col: result.spawned.col }
              : null,
          },
        });

        stats.noteMove({
          merges: result.merges.length,
          score: result.state.score,
          highestTile: top,
        });

        if (settings.hapticsEnabled && result.merges.length > 0) haptic('merge');

        if (result.justWon) {
          stats.noteWin();
          if (settings.hapticsEnabled) haptic('win');
        }

        // Counted at most once per game — see `gameOverRecorded`.
        if (result.state.over && !get().gameOverRecorded) {
          stats.noteGameOver({
            score: result.state.score,
            highestTile: top,
            won: result.state.won,
          });
          set({ gameOverRecorded: true });
          if (settings.hapticsEnabled) haptic('gameOver');
        }

        cancelVanishTimer();
        vanishTimer = setTimeout(() => {
          get().clearTransients();
        }, MERGE_ANIMATION_MS);
      },

      newGame: (size) => {
        const nextSize = size ?? useSettingsStore.getState().size;
        cancelVanishTimer();
        useStatsStore.getState().noteGameStarted();
        set({
          game: freshGame(nextSize),
          history: [],
          gameOverRecorded: false,
          gameStartRecorded: true,
          merges: [],
          spawnedId: null,
          vanishing: [],
          moveSeq: get().moveSeq + 1,
          lastOutcome: null,
        });
      },

      undo: () => {
        const { history } = get();
        if (history.length === 0) return;
        cancelVanishTimer();
        const previous = history[history.length - 1];
        set({
          game: previous,
          history: history.slice(0, -1),
          // Deliberately NOT cleared. One game has one ending, however many
          // times the player undoes out of it and loses again — and the
          // game-over overlay offers Undo, so that round trip is the normal
          // path, not an edge case. Clearing here is exactly the double count
          // this flag exists to prevent.
          gameOverRecorded: get().gameOverRecorded,
          merges: [],
          spawnedId: null,
          vanishing: [],
          moveSeq: get().moveSeq + 1,
          lastOutcome: null,
        });
      },

      continuePlaying: () => set({ game: keepPlayingState(get().game) }),

      /**
       * Replace the current game with a position produced elsewhere.
       *
       * History is cleared rather than carried over: the moves in it belong to
       * a game the player did not play, so undo must not be able to walk back
       * into someone else's decisions. Transients are cleared too, so the board
       * appears settled rather than mid-animation.
       */
      adoptGame: (game) => {
        cancelVanishTimer();
        // An adopted position can be played to a finish, so it has to be
        // counted as a game started or `gamesOver` would outrun `gamesStarted`.
        useStatsStore.getState().noteGameStarted();
        set({
          game,
          history: [],
          gameOverRecorded: false,
          gameStartRecorded: true,
          merges: [],
          spawnedId: null,
          vanishing: [],
          lastOutcome: null,
        });
      },

      clearTransients: () => set({ merges: [], spawnedId: null, vanishing: [] }),

      resetEverything: () => {
        cancelVanishTimer();
        useStatsStore.getState().noteGameStarted();
        set({
          game: freshGame(useSettingsStore.getState().size),
          bests: {},
          history: [],
          gameOverRecorded: false,
          gameStartRecorded: true,
          merges: [],
          spawnedId: null,
          vanishing: [],
          moveSeq: 0,
          lastOutcome: null,
        });
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      version: 1,

      /**
       * Pass-through migration.
       *
       * Present before it is needed on purpose: without a `migrate`, Zustand
       * *discards* persisted state on any version bump, so the day this store
       * goes to v2 every player silently loses their board and every best score.
       */
      migrate: (persisted) => persisted as GameStoreState,

      /**
       * Reject a saved game that cannot be rendered.
       *
       * The default merge is a shallow spread, so a persisted `game` replaces
       * the default one wholesale — including a `board: null` that then throws
       * on first render, on every load, forever.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameStoreState>;
        const game = isPlausibleGameState(saved.game) ? saved.game : current.game;
        const recovered = game !== saved.game;

        return {
          ...current,
          ...saved,
          game,
          // A rejected save leaves history pointing at a game that is no longer
          // loaded, so it goes too.
          history: recovered || !Array.isArray(saved.history) ? [] : saved.history,
          bests: saved.bests && typeof saved.bests === 'object' ? saved.bests : current.bests,
          gameOverRecorded: recovered ? false : saved.gameOverRecorded === true,
          // Transients are never persisted; keep the defaults.
          merges: [],
          spawnedId: null,
          vanishing: [],
          lastOutcome: null,
        };
      },

      // Transient animation state must never be persisted — restoring it would
      // replay a merge that already finished.
      partialize: (state) => ({
        game: state.game,
        bests: state.bests,
        history: state.history.slice(-PERSISTED_HISTORY),
        gameOverRecorded: state.gameOverRecorded,
        gameStartRecorded: state.gameStartRecorded,
      }),

      /**
       * Count the very first game.
       *
       * The store's initial `freshGame` is built at module load, which happens
       * on every visit — so counting there would add a "game started" each time
       * the page opened. Counting on rehydrate, gated by a persisted flag,
       * counts it exactly once.
       */
      onRehydrateStorage: () => (state) => {
        if (state && !state.gameStartRecorded) {
          useStatsStore.getState().noteGameStarted();
          state.gameStartRecorded = true;
        }
      },
    },
  ),
);

/** Best score for the size currently being played. */
export function selectBest(state: GameStoreState): number {
  return state.bests[state.game.size] ?? 0;
}
