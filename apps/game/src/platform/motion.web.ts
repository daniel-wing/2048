/**
 * Whether the system asks for reduced motion — WEB.
 *
 * Read once at startup to seed the in-app setting. Someone who has turned
 * Reduce Motion on at the OS level has already said what they want; making them
 * find a second toggle inside the game to say it again is the wrong default.
 */

export function systemPrefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    // Server-side prerender, or a browser without matchMedia.
    return false;
  }
}
