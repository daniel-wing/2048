/**
 * Shared type surface for the platform-split `useKeyboard`.
 *
 * Metro resolves the runtime file (`.web.ts` or `.native.ts`); TypeScript
 * resolves this declaration. Keeping the contract in one place means the two
 * implementations cannot drift apart silently.
 */

import type { Direction } from '@2048/engine';

export type KeyboardHandlers = {
  onMove: (dir: Direction) => void;
  onUndo?: () => void;
  onNewGame?: () => void;
  enabled?: boolean;
};

export declare function useKeyboard(handlers: KeyboardHandlers): void;
