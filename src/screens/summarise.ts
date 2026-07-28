import type { Shot } from '../lib/types';

export type Tally = { value: string; count: number; share: number };

function display(value: unknown): string {
  if (value === true) return 'On';
  if (value === false) return 'Off';
  if (typeof value === 'number') return value > 0 ? `+${value}` : String(value);
  return String(value);
}

/**
 * How often each setting was used across a roll. Seeing that 80% of a roll was
 * shot at one aperture is itself the lesson.
 */
export function summarise(shots: Shot[], controlId: string): Tally[] {
  const counts = new Map<string, number>();

  for (const shot of shots) {
    const raw = shot.settings?.[controlId];
    if (raw === undefined || raw === null || raw === '') continue;
    const key = display(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, share: count / total }))
    .sort((a, b) => b.count - a.count);
}
