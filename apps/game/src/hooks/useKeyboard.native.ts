/**
 * Keyboard input — NATIVE no-op.
 *
 * Phones have no keyboard to listen to, and `window.addEventListener` does not
 * exist on React Native. Keeping this as a separate file (rather than a runtime
 * `Platform.OS` guard inside the web version) guarantees the DOM code is never
 * bundled for iOS/Android.
 *
 * Signature must stay identical to `useKeyboard.web.ts`.
 */

import type { Direction } from '@2048/engine';

export type KeyboardHandlers = {
  onMove: (dir: Direction) => void;
  onUndo?: () => void;
  onNewGame?: () => void;
  enabled?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useKeyboard(_handlers: KeyboardHandlers): void {
  // Intentionally empty.
}
