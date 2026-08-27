import { nextFloat, nextInt, seedRng } from '../rng';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = nextFloat(seedRng(123));
    const b = nextFloat(seedRng(123));
    expect(a).toEqual(b);
  });

  it('differs across seeds', () => {
    const [a] = nextFloat(seedRng(1));
    const [b] = nextFloat(seedRng(2));
    expect(a).not.toBe(b);
  });

  it('stays within [0, 1)', () => {
    let state = seedRng(5);
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextFloat(state);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      state = next;
    }
  });

  it('nextInt stays within range', () => {
    let state = seedRng(9);
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextInt(state, 16);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(16);
      expect(Number.isInteger(value)).toBe(true);
      state = next;
    }
  });

  it('does not immediately repeat itself', () => {
    let state = seedRng(17);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const [value, next] = nextFloat(state);
      seen.add(value);
      state = next;
    }
    // A degenerate generator would collapse to a handful of values.
    expect(seen.size).toBeGreaterThan(150);
  });

  it('handles a zero seed', () => {
    const [value] = nextFloat(seedRng(0));
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});
