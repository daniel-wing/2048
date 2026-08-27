/**
 * Shared type surface for the platform-split `useViewportSize`.
 *
 * Metro resolves the runtime file (`.web.ts` or `.native.ts`); TypeScript
 * resolves this declaration, so the two cannot drift apart.
 */

export type ViewportSize = { width: number; height: number };

export declare function useViewportSize(): ViewportSize;
