/**
 * Viewport size — WEB.
 *
 * Deliberately avoids `useWindowDimensions`. This page is statically
 * prerendered, and that hook reports the build machine's viewport and never
 * corrects on the client — it is what previously pinned the board to one size
 * for every visitor regardless of screen.
 *
 * Observation uses a ResizeObserver on the document element rather than a
 * `resize` listener. Both fire when a user drags a window, but the observer also
 * catches layout-box changes a resize event can miss — device-metric overrides,
 * devtools device emulation, a mobile URL bar collapsing. The listener is kept
 * alongside as a fallback.
 *
 * Returns zeros until the first client measurement, so callers can fall back to
 * a fixed size for the server-rendered pass.
 */

import { useEffect, useState } from 'react';

export type ViewportSize = { width: number; height: number };

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return size;
}
