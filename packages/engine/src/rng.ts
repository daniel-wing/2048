/**
 * Seedable, purely-functional PRNG (mulberry32).
 *
 * The engine never calls Math.random(). Every random draw threads an explicit
 * `RngState` through, which makes games deterministic and reproducible from a
 * seed — that is what lets the unit tests assert on exact spawns, and what
 * would later allow shareable/replayable seeds.
 */

export type RngState = number;

/** Turn an arbitrary seed into a well-mixed initial state. */
export function seedRng(seed: number): RngState {
  // Force to uint32 and avoid a zero state, which mulberry32 handles poorly.
  const s = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return s === 0 ? 0x6d2b79f5 : s;
}

/**
 * Draw the next float in [0, 1).
 * Returns the value together with the *next* state — never mutates.
 */
export function nextFloat(state: RngState): [value: number, next: RngState] {
  let t = (state + 0x6d2b79f5) >>> 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

/** Draw an integer in [0, maxExclusive). */
export function nextInt(state: RngState, maxExclusive: number): [value: number, next: RngState] {
  const [f, next] = nextFloat(state);
  return [Math.floor(f * maxExclusive), next];
}
