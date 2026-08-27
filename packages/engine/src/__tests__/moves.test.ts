import { slideLine } from '../moves';
import { line, lineToNumbers } from './helpers';

describe('slideLine', () => {
  const cases: Array<{ name: string; input: number[]; expected: number[]; gained: number }> = [
    { name: 'compacts without merging', input: [2, 0, 0, 4], expected: [2, 4, 0, 0], gained: 0 },
    { name: 'merges an adjacent pair', input: [2, 2, 0, 0], expected: [4, 0, 0, 0], gained: 4 },
    { name: 'merges across a gap', input: [2, 0, 2, 0], expected: [4, 0, 0, 0], gained: 4 },
    { name: 'merges two independent pairs', input: [2, 2, 4, 4], expected: [4, 8, 0, 0], gained: 12 },
    { name: 'never triple-merges', input: [4, 4, 4, 4], expected: [8, 8, 0, 0], gained: 16 },
    { name: 'merges only the leading pair', input: [2, 2, 2, 0], expected: [4, 2, 0, 0], gained: 4 },
    { name: 'does not merge a freshly merged tile', input: [4, 2, 2, 0], expected: [4, 4, 0, 0], gained: 4 },
    { name: 'leaves an alternating line compacted', input: [2, 4, 2, 4], expected: [2, 4, 2, 4], gained: 0 },
    { name: 'handles an empty line', input: [0, 0, 0, 0], expected: [0, 0, 0, 0], gained: 0 },
    { name: 'merges the full line into two', input: [2, 2, 2, 2], expected: [4, 4, 0, 0], gained: 8 },
  ];

  it.each(cases)('$name', ({ input, expected, gained }) => {
    const result = slideLine(line(input));
    expect(lineToNumbers(result.line)).toEqual(expected);
    expect(result.gained).toBe(gained);
  });

  it('reports moved=false when nothing changes', () => {
    expect(slideLine(line([2, 4, 8, 16])).moved).toBe(false);
    expect(slideLine(line([0, 0, 0, 0])).moved).toBe(false);
    expect(slideLine(line([2, 4, 0, 0])).moved).toBe(false);
  });

  it('reports moved=true for a slide and for a merge', () => {
    expect(slideLine(line([0, 2, 0, 0])).moved).toBe(true);
    expect(slideLine(line([2, 2, 0, 0])).moved).toBe(true);
  });

  it('keeps the leading tile id as the merge survivor', () => {
    const input = line([2, 2, 0, 0]);
    const leadingId = input[0]!.id;
    const trailingId = input[1]!.id;

    const result = slideLine(input);

    expect(result.line[0]!.id).toBe(leadingId);
    expect(result.merges).toEqual([
      { survivorId: leadingId, consumedId: trailingId, value: 4, index: 0 },
    ]);
  });

  it('works on non-4 line lengths', () => {
    expect(lineToNumbers(slideLine(line([2, 2, 2])).line)).toEqual([4, 2, 0]);
    expect(lineToNumbers(slideLine(line([2, 2, 2, 2, 2, 2])).line)).toEqual([4, 4, 4, 0, 0, 0]);
  });

  it('does not mutate its input', () => {
    const input = line([2, 2, 0, 0]);
    const snapshot = lineToNumbers(input);
    slideLine(input);
    expect(lineToNumbers(input)).toEqual(snapshot);
  });
});
