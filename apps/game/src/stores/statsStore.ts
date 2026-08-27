/**
 * Lifetime statistics and achievements.
 *
 * All the arithmetic lives in the engine's pure reducers; this store only holds
 * the result and persists it.
 */

import {
  emptyStats,
  recordGameOver,
  recordGameStarted,
  recordMove,
  recordWin,
  type Stats,
} from '@2048/engine';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '../platform/storage';

export const STATS_STORAGE_KEY = '2048.stats.v1';

export type StatsState = {
  stats: Stats;
  noteGameStarted: () => void;
  noteMove: (input: { merges: number; score: number; highestTile: number }) => void;
  noteWin: () => void;
  noteGameOver: (input: { score: number; highestTile: number; won: boolean }) => void;
  resetStats: () => void;
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      stats: emptyStats,

      noteGameStarted: () => set((s) => ({ stats: recordGameStarted(s.stats) })),
      noteMove: (input) => set((s) => ({ stats: recordMove(s.stats, input) })),
      noteWin: () => set((s) => ({ stats: recordWin(s.stats) })),
      noteGameOver: (input) => set((s) => ({ stats: recordGameOver(s.stats, input) })),
      resetStats: () => set({ stats: emptyStats }),
    }),
    {
      name: STATS_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      version: 1,

      /**
       * Pass-through migration, present before it is needed.
       *
       * Without a `migrate`, Zustand discards persisted state entirely on a
       * version bump — so bumping this store to v2 would silently erase every
       * player's lifetime statistics and achievements.
       */
      migrate: (persisted) => persisted as StatsState,
    },
  ),
);
