import { describe, it, expect } from 'vitest';
import { summarise } from './summarise';
import type { Shot } from '../lib/types';

const shot = (n: number, settings: Record<string, unknown>): Shot => ({
  id: `s${n}`, roll_id: 'r', frame_number: n, settings: settings as any,
  light: null, shot_at: '', subject: null, scan_path: null,
  ai_critique: null, my_notes: null, created_at: '',
});

describe('summarise', () => {
  it('counts how often each value was used, most used first', () => {
    const shots = [
      shot(1, { aperture: 'f/8' }),
      shot(2, { aperture: 'f/8' }),
      shot(3, { aperture: 'f/2.8' }),
    ];
    expect(summarise(shots, 'aperture')).toEqual([
      { value: 'f/8', count: 2, share: 2 / 3 },
      { value: 'f/2.8', count: 1, share: 1 / 3 },
    ]);
  });

  it('ignores frames that never recorded that control', () => {
    const shots = [shot(1, { aperture: 'f/8' }), shot(2, {})];
    expect(summarise(shots, 'aperture')).toEqual([
      { value: 'f/8', count: 1, share: 1 },
    ]);
  });

  it('returns nothing for an empty roll', () => {
    expect(summarise([], 'aperture')).toEqual([]);
  });

  it('renders booleans and numbers as readable values', () => {
    const shots = [shot(1, { backlight: true }), shot(2, { backlight: false })];
    expect(summarise(shots, 'backlight').map(r => r.value).sort())
      .toEqual(['Off', 'On']);
  });
});
