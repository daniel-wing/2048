/**
 * Persistence seam — NATIVE.
 *
 * A deliberate stub, not an oversight. Phase 2 replaces the map below with
 * `react-native-mmkv` (synchronous, so Zustand still rehydrates before first
 * render and the saved board paints with no empty-board flash).
 *
 * It does NOT throw. Failing hard on a cold start would block every bit of
 * native UI work until MMKV is wired up, which is the wrong trade — the
 * original problem here was silence, not survivability. So the app runs, and
 * says clearly that nothing is being saved.
 */

import type { StateStorage } from 'zustand/middleware';

const memory = new Map<string, string>();

/** False until MMKV lands. The UI surfaces this in development. */
export const isPersistent = false;

let warned = false;
function warnOnce(): void {
  // Quiet under test: the suites deliberately exercise this in-memory backend,
  // and one warning per store would drown the output.
  if (warned || !__DEV__ || process.env.NODE_ENV === 'test') return;
  warned = true;
  console.warn(
    '[storage] Persistence is not implemented on native yet. The board, best ' +
      'scores, statistics and settings are held in memory only and will be lost ' +
      'on restart. Replace src/platform/storage.native.ts with react-native-mmkv.',
  );
}

export const storage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => {
    warnOnce();
    memory.set(name, value);
  },
  removeItem: (name) => {
    memory.delete(name);
  },
};

/** Wipe every key this app owns. Used by Settings -> reset all data. */
export function clearAllStoredData(keys: string[]): void {
  for (const key of keys) storage.removeItem(key);
}
