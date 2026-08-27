/**
 * The single sliding primitive.
 *
 * Every direction is normalised to "compact this line toward index 0" by
 * reading the line's coordinates in the right order (see `lineCoords`). That
 * means the merge rules live in exactly one function, which is where the
 * classic 2048 bugs (double-merging, wrong scores, phantom moves) would
 * otherwise hide.
 */

import type { Cell } from './board';

export type LineMerge = {
  /** Tile that stays and doubles. */
  survivorId: number;
  /** Tile that slides into the survivor and disappears. */
  consumedId: number;
  /** Value *after* doubling. */
  value: number;
  /** Position in the resulting line. */
  index: number;
};

export type SlideResult = {
  line: Cell[];
  gained: number;
  merges: LineMerge[];
  moved: boolean;
};

/**
 * Compact and merge one line toward index 0.
 *
 * A tile produced by a merge cannot merge again in the same move, which is why
 * this walks the compacted list pairwise and skips the consumed tile rather
 * than re-scanning. `[4,4,4,4]` therefore becomes `[8,8]`, never `[16]`.
 */
export function slideLine(line: Cell[]): SlideResult {
  const size = line.length;
  const tiles = line.filter((cell): cell is NonNullable<Cell> => cell !== null);

  const result: Cell[] = [];
  const merges: LineMerge[] = [];
  let gained = 0;

  let i = 0;
  while (i < tiles.length) {
    const current = tiles[i];
    const next = i + 1 < tiles.length ? tiles[i + 1] : null;

    if (next && next.value === current.value) {
      const value = current.value * 2;
      // The survivor keeps the leading tile's id so the UI can animate the
      // consumed tile sliding into a tile that is already on screen.
      result.push({ id: current.id, value });
      merges.push({
        survivorId: current.id,
        consumedId: next.id,
        value,
        index: result.length - 1,
      });
      gained += value;
      i += 2;
    } else {
      result.push(current);
      i += 1;
    }
  }

  while (result.length < size) result.push(null);

  // "Moved" means the line is not identical to what it was. Comparing ids
  // catches slides; comparing values catches merges.
  let moved = false;
  for (let k = 0; k < size; k++) {
    const before = line[k];
    const after = result[k];
    if (before === null && after === null) continue;
    if (before === null || after === null) {
      moved = true;
      break;
    }
    if (before.id !== after.id || before.value !== after.value) {
      moved = true;
      break;
    }
  }

  return { line: result, gained, merges, moved };
}
