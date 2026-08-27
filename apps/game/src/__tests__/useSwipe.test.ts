/**
 * Swipe direction mapping.
 *
 * Gesture Handler turns touches into a pan displacement; this is the part we
 * own — deciding which way that displacement points. Screen coordinates put
 * +y downward, which is exactly the convention that tends to get inverted.
 */

import { SWIPE_THRESHOLD, resolveSwipeDirection } from '../hooks/useSwipe';

describe('resolveSwipeDirection', () => {
  const far = SWIPE_THRESHOLD * 3;

  it('maps the four cardinal swipes', () => {
    expect(resolveSwipeDirection(far, 0)).toBe('right');
    expect(resolveSwipeDirection(-far, 0)).toBe('left');
    // +y is downward on screen.
    expect(resolveSwipeDirection(0, far)).toBe('down');
    expect(resolveSwipeDirection(0, -far)).toBe('up');
  });

  it('ignores movement below the threshold', () => {
    expect(resolveSwipeDirection(0, 0)).toBeNull();
    expect(resolveSwipeDirection(SWIPE_THRESHOLD - 1, SWIPE_THRESHOLD - 1)).toBeNull();
    expect(resolveSwipeDirection(-(SWIPE_THRESHOLD - 1), 0)).toBeNull();
  });

  it('accepts movement at exactly the threshold', () => {
    expect(resolveSwipeDirection(SWIPE_THRESHOLD, 0)).toBe('right');
    expect(resolveSwipeDirection(0, SWIPE_THRESHOLD)).toBe('down');
  });

  it('lets the dominant axis win a sloppy diagonal', () => {
    expect(resolveSwipeDirection(far, far * 0.6)).toBe('right');
    expect(resolveSwipeDirection(far * 0.6, far)).toBe('down');
    expect(resolveSwipeDirection(-far, -far * 0.4)).toBe('left');
    expect(resolveSwipeDirection(far * 0.3, -far)).toBe('up');
  });

  it('prefers the vertical axis on a perfect diagonal', () => {
    // Arbitrary but deterministic: a 45° swipe must resolve to exactly one
    // direction rather than flickering between two.
    expect(resolveSwipeDirection(far, far)).toBe('down');
    expect(resolveSwipeDirection(-far, -far)).toBe('up');
  });

  it('triggers when only one axis clears the threshold', () => {
    expect(resolveSwipeDirection(far, 2)).toBe('right');
    expect(resolveSwipeDirection(2, -far)).toBe('up');
  });

  it('honours a custom threshold', () => {
    expect(resolveSwipeDirection(10, 0, 5)).toBe('right');
    expect(resolveSwipeDirection(10, 0, 50)).toBeNull();
  });
});
