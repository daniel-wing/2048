/**
 * User settings. Persisted synchronously so the chosen theme and board size
 * are already correct on the very first paint.
 */

import { DEFAULT_SIZE, clampSize } from '@2048/engine';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { systemPrefersReducedMotion } from '../platform/motion';
import { storage } from '../platform/storage';
import type { ThemeId } from '../theme/palettes';

export const SETTINGS_STORAGE_KEY = '2048.settings.v1';

/** 'system' follows the OS; anything else is an explicit override. */
export type ThemePreference = ThemeId | 'system';

export type SettingsState = {
  size: number;
  themePreference: ThemePreference;
  hapticsEnabled: boolean;
  /** 0 disables undo; -1 means unlimited. */
  undoDepth: number;
  reducedMotion: boolean;

  setSize: (size: number) => void;
  setThemePreference: (theme: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setUndoDepth: (depth: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  resetSettings: () => void;
};

const defaults = {
  size: DEFAULT_SIZE,
  // The house theme, matching wing.cx. Other themes stay available in settings.
  themePreference: 'wing' as ThemePreference,
  hapticsEnabled: true,
  undoDepth: -1,
  // Seeded from the OS. Someone who has already asked for reduced motion at the
  // system level should not have to ask again here. An explicit choice in
  // Settings is persisted and wins from then on.
  reducedMotion: systemPrefersReducedMotion(),
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,

      setSize: (size) => set({ size: clampSize(size) }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setUndoDepth: (undoDepth) => set({ undoDepth }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      resetSettings: () => set({ ...defaults }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      // v2 introduced the Wing house theme as the default. Anyone still holding
      // the old 'system' default is moved onto it; an explicit theme choice is
      // left alone.
      version: 2,
      migrate: (persisted, fromVersion) => {
        const state = persisted as Partial<SettingsState> | undefined;
        if (!state) return persisted as SettingsState;

        // Rehydration writes persisted values straight into state, bypassing
        // the setters' guards — so a hand-edited or stale size has to be
        // clamped here or Settings ends up highlighting no chip at all.
        const clamped: Partial<SettingsState> = {
          ...state,
          size: clampSize(typeof state.size === 'number' ? state.size : DEFAULT_SIZE),
        };

        if (fromVersion < 2 && clamped.themePreference === 'system') {
          return { ...clamped, themePreference: 'wing' } as SettingsState;
        }
        return clamped as SettingsState;
      },
    },
  ),
);
