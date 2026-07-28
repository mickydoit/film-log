import { describe, it, expect } from 'vitest';
import { planScans } from './scanPlan';

const pair = { isPair: true };
const single = { isPair: false };

describe('planScans', () => {
  it('gives each half of a pair its own consecutive frame', () => {
    const plan = planScans([pair, pair], 1, 72);
    expect(plan.assignments).toEqual([
      { index: 0, frames: [1, 2] },
      { index: 1, frames: [3, 4] },
    ]);
    expect(plan).toMatchObject({ pairs: 2, frames: 4, dropped: 0 });
  });

  it('gives a single file one frame', () => {
    const plan = planScans([single, single], 1, 36);
    expect(plan.assignments).toEqual([
      { index: 0, frames: [1] },
      { index: 1, frames: [2] },
    ]);
    expect(plan).toMatchObject({ pairs: 0, frames: 2, dropped: 0 });
  });

  it('starts wherever the user says, so a retry lands on the right frame', () => {
    // Re-uploading one failed pair from the middle of a scanned roll.
    const plan = planScans([pair], 23, 72);
    expect(plan.assignments).toEqual([{ index: 0, frames: [23, 24] }]);
  });

  it('mixes pairs and singles without losing count', () => {
    const plan = planScans([pair, single, pair], 1, 72);
    expect(plan.assignments).toEqual([
      { index: 0, frames: [1, 2] },
      { index: 1, frames: [3] },
      { index: 2, frames: [4, 5] },
    ]);
    expect(plan.frames).toBe(5);
  });

  it('skips a pair that cannot fit both halves rather than mangling it', () => {
    // Capacity 3: the first pair takes 1-2, the second needs 3-4 and cannot fit.
    const plan = planScans([pair, pair], 1, 3);
    expect(plan.assignments).toEqual([{ index: 0, frames: [1, 2] }]);
    expect(plan).toMatchObject({ frames: 2, dropped: 2 });
  });

  it('counts singles that fall past the end of the roll', () => {
    const plan = planScans([single, single, single], 35, 36);
    expect(plan.assignments).toEqual([
      { index: 0, frames: [35] },
      { index: 1, frames: [36] },
    ]);
    expect(plan.dropped).toBe(1);
  });

  it('plans nothing for no files', () => {
    expect(planScans([], 1, 72)).toEqual({
      assignments: [], pairs: 0, frames: 0, dropped: 0,
    });
  });
});
