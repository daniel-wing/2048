/**
 * Swipe input — all platforms, web included.
 *
 * Web swipe is a launch requirement, not a native-only nicety: a large share of
 * web players are on phone browsers, so the same Gesture Handler pan drives
 * web, iOS and Android. (The board container also sets `touchAction: 'none'`,
 * without which mobile browsers steal the gesture for pull-to-refresh or
 * back-navigation.)
 */

import type { Direction } from '@2048/engine';
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';

/** Minimum travel, in px, before a pan counts as a swipe rather than a tap. */
export const SWIPE_THRESHOLD = 24;

/**
 * Map a pan displacement to a direction.
 *
 * Split out from the gesture so the axis/sign conventions — the part most
 * likely to be subtly wrong — can be unit-tested without a touch screen.
 * Returns null when the movement is too small to be a deliberate swipe.
 *
 * Note the y-axis points down in screen coordinates, so a positive dy is a
 * downward swipe.
 */
export function resolveSwipeDirection(
  dx: number,
  dy: number,
  threshold: number = SWIPE_THRESHOLD,
): Direction | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;

  // Dominant axis wins, so a sloppy diagonal still does what was meant.
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

export function useSwipe(onMove: (dir: Direction) => void, enabled = true) {
  return useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        // Discrete swipes only — one state update per gesture, so there is no
        // reason to pay for a worklet round-trip here.
        .runOnJS(true)
        .minDistance(SWIPE_THRESHOLD / 2)
        .onEnd((event) => {
          const direction = resolveSwipeDirection(event.translationX, event.translationY);
          if (direction) onMove(direction);
        }),
    [onMove, enabled],
  );
}
