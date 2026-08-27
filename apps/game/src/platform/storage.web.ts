/**
 * Persistence seam.
 *
 * Everything that persists goes through this wrapper — stores never touch a
 * storage engine directly (portability guardrail #6).
 *
 * PHASE 1 (web): backed by the DOM's `localStorage`, which is synchronous, so
 * Zustand's `persist` rehydrates before first render and the saved board paints
 * with no empty-board flash.
 *
 * PHASE 2 (native): see `storage.native.ts`, which is currently a loud
 * in-memory stub. Swapping it for `react-native-mmkv` (also synchronous) is the
 * whole job; nothing outside this folder changes.
 */

import type { StateStorage } from 'zustand/middleware';

/**
 * Storage can throw or be missing entirely — Safari private mode, disabled
 * site data, a server-side prerender pass. Every access is guarded so the game
 * degrades to "works, but forgets" instead of failing to start.
 */
function safeLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    // Touch it: some browsers only throw on first use, not on access.
    const probe = '__2048_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

const memoryFallback = new Map<string, string>();

/**
 * Whether writes actually survive a restart.
 *
 * False when storage is unavailable and the in-memory fallback is carrying
 * everything — Safari private mode, disabled site data, or the native stub.
 * The UI can use this to say so rather than silently forgetting.
 */
export const isPersistent = safeLocalStorage() !== null;

export const storage: StateStorage = {
  getItem: (name) => {
    const ls = safeLocalStorage();
    if (!ls) return memoryFallback.get(name) ?? null;
    try {
      return ls.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    const ls = safeLocalStorage();
    if (!ls) {
      memoryFallback.set(name, value);
      return;
    }
    try {
      ls.setItem(name, value);
    } catch {
      // Quota exceeded or storage disabled mid-session — keep playing.
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    const ls = safeLocalStorage();
    memoryFallback.delete(name);
    if (!ls) return;
    try {
      ls.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

/** Wipe every key this app owns. Used by Settings → reset all data. */
export function clearAllStoredData(keys: string[]): void {
  for (const key of keys) storage.removeItem(key);
}
