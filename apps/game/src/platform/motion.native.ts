/**
 * Whether the system asks for reduced motion — NATIVE.
 *
 * `AccessibilityInfo.isReduceMotionEnabled()` is async, and this seeds a store
 * default that has to be read synchronously at module load. Phase 2 should call
 * it on mount and update the setting once it resolves; until then native starts
 * with animation on, which matches the previous behaviour on every platform.
 */

export function systemPrefersReducedMotion(): boolean {
  return false;
}
