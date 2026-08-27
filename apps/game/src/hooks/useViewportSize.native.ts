/**
 * Viewport size — NATIVE.
 *
 * No prerendering here, so the standard hook is correct and already reactive to
 * rotation. Signature must stay identical to useViewportSize.web.ts.
 */

import { useWindowDimensions } from 'react-native';

export type ViewportSize = { width: number; height: number };

export function useViewportSize(): ViewportSize {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
