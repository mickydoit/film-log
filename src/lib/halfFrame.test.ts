import { describe, it, expect } from 'vitest';
import { splitGeometry, looksLikeFramePair, assignFrameNumbers } from './halfFrame';

describe('looksLikeFramePair', () => {
  it('recognises a landscape scan of two portrait half-frames', () => {
    // Two 24x36-ish portrait frames side by side ~= 3:2 landscape.
    expect(looksLikeFramePair(3000, 2000)).toBe(true);
  });

  it('rejects a single portrait half-frame', () => {
    expect(looksLikeFramePair(1500, 2000)).toBe(false);
  });

  it('rejects a square image', () => {
    expect(looksLikeFramePair(2000, 2000)).toBe(false);
  });
});

describe('splitGeometry', () => {
  it('splits an even-width image into two equal halves', () => {
    const [left, right] = splitGeometry(3000, 2000);
    expect(left).toEqual({ x: 0, y: 0, width: 1500, height: 2000 });
    expect(right).toEqual({ x: 1500, y: 0, width: 1500, height: 2000 });
  });

  it('never exceeds the source width on an odd-width image', () => {
    const [left, right] = splitGeometry(3001, 2000);
    expect(left.width + right.width).toBeLessThanOrEqual(3001);
    expect(right.x + right.width).toBeLessThanOrEqual(3001);
  });

  it('keeps full height on both halves', () => {
    const [left, right] = splitGeometry(1000, 700);
    expect(left.height).toBe(700);
    expect(right.height).toBe(700);
  });
});

describe('assignFrameNumbers', () => {
  it('numbers a split pair consecutively from the start frame', () => {
    expect(assignFrameNumbers(1, 2)).toEqual([1, 2]);
    expect(assignFrameNumbers(23, 2)).toEqual([23, 24]);
  });

  it('handles a single unsplit frame', () => {
    expect(assignFrameNumbers(7, 1)).toEqual([7]);
  });
});
