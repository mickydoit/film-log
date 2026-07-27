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

  it('detects nothing when the text names two different speeds', () => {
    // Setting box speed to 1600 here would silence the push warning for a
    // real 1-stop push — the opposite of what the app is for.
    expect(detectFilmSpeed('Kodak Portra 800 pushed to 1600')).toBeNull();
    expect(detectFilmSpeed('Kodak Gold 200 batch 1600')).toBeNull();
    expect(detectFilmSpeed('Kodak Portra 400 and Fuji 100')).toBeNull();
  });

  it('is not confused by the same speed appearing twice', () => {
    expect(detectFilmSpeed('Kodak Tri-X 400 (400 in stock)')).toBe(400);
  });

  it('detects the speeds that were previously missing from the list', () => {
    expect(detectFilmSpeed('Fomapan 1000')).toBe(1000);
    expect(detectFilmSpeed('Adox CMS 20')).toBe(20);
  });
});
