/**
 * Keyboard input — WEB ONLY.
 *
 * This file is resolved by Metro only for the web bundle. Its native twin
 * (`useKeyboard.native.ts`) is an empty no-op. The split is by file extension
 * rather than a `Platform.OS` check on purpose: `window` does not exist on
 * React Native, so DOM code must never be bundled for native at all.
 */

import { useEffect } from 'react';

import type { Direction } from '@2048/engine';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
  k: 'up',
  h: 'left',
  j: 'down',
  l: 'right',
};

export type KeyboardHandlers = {
  onMove: (dir: Direction) => void;
  onUndo?: () => void;
  onNewGame?: () => void;
  enabled?: boolean;
};

export function useKeyboard({ onMove, onUndo, onNewGame, enabled = true }: KeyboardHandlers): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Never hijack keys while the player is typing somewhere.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        onUndo?.();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        onNewGame?.();
        return;
      }

      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;

      // Stop arrow keys from scrolling the page underneath the board.
      event.preventDefault();
      onMove(direction);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove, onUndo, onNewGame, enabled]);
}
