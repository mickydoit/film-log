import { describe, it, expect } from 'vitest';
import { detectFilmSpeed } from './LoadRoll';

describe('detectFilmSpeed', () => {
  it('reads the speed off ordinary stock names', () => {
    expect(detectFilmSpeed('Kodak Gold 200')).toBe(200);
    expect(detectFilmSpeed('Ilford HP5 Plus 400')).toBe(400);
    expect(detectFilmSpeed('Fujifilm C200')).toBe(200);
  });

  it('reads through a letter suffix', () => {
    expect(detectFilmSpeed('Cinestill 800T')).toBe(800);
    expect(detectFilmSpeed('Kodak Tri-X 400TX')).toBe(400);
    expect(detectFilmSpeed('Kodak Portra 160NC')).toBe(160);
  });

  it('ignores film sizes and frame counts that are not film speeds', () => {
    // The dangerous case: these numbers are not speeds, and picking one
    // would make the app give the lab a false developing instruction.
    expect(detectFilmSpeed('Kodak Gold 200 35mm')).toBe(200);
    expect(detectFilmSpeed('Kodak Portra 400 120')).toBe(400);
    expect(detectFilmSpeed('Fujicolor 100 24exp')).toBe(100);
  });

  it('finds the speed even when a word follows it', () => {
    expect(detectFilmSpeed('Ilford Delta 3200 Professional')).toBe(3200);
  });

  it('detects nothing rather than guessing', () => {
    expect(detectFilmSpeed('Ilford HP5 Plus')).toBeNull();
    expect(detectFilmSpeed('')).toBeNull();
  });
});
