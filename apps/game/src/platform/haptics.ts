/**
 * Haptics seam.
 *
 * Phase 1 (web) is a deliberate no-op: browsers have no equivalent worth
 * shipping, and `navigator.vibrate` is unsupported on iOS Safari and actively
 * unpleasant on Android. Phase 2 adds `haptics.native.ts` backed by
 * `expo-haptics`; call sites never change.
 */

export type HapticKind = 'merge' | 'move' | 'win' | 'gameOver';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function haptic(_kind: HapticKind): void {
  // No-op on web.
}
