/**
 * Shared type surface for the platform-split storage seam.
 *
 * Metro resolves the runtime file (`.web.ts` or `.native.ts`); TypeScript
 * resolves this, so the two implementations cannot drift apart.
 */

import type { StateStorage } from 'zustand/middleware';

export declare const storage: StateStorage;
/** False when writes are held in memory only and will not survive a restart. */
export declare const isPersistent: boolean;
export declare function clearAllStoredData(keys: string[]): void;
