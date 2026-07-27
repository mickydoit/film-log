// Matched with tolerance: log2(125/100) is 0.3219, not a clean 1/3.
const FRACTIONS: [number, string][] = [
  [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'],
];

/**
 * Describe the difference between the film's box speed and the speed dialled
 * on the camera. This is the single most confusing thing about shooting film,
 * so the app states it in words rather than leaving two numbers side by side.
 */
export function pushPullLabel(boxIso: number, isoSet: number): string | null {
  if (boxIso === isoSet) return null;

  const stops = Math.log2(isoSet / boxIso);
  const direction = stops > 0 ? 'Pushed' : 'Pulled';
  const magnitude = Math.abs(stops);

  const whole = Math.round(magnitude);
  const isWhole = Math.abs(magnitude - whole) < 0.05;

  if (isWhole) {
    return `${direction} ${whole} stop${whole === 1 ? '' : 's'} — tell the lab.`;
  }

  const fraction = FRACTIONS.find(([value]) => Math.abs(magnitude - value) < 0.06);
  if (fraction) return `${direction} ${fraction[1]} stop — tell the lab.`;

  return `${direction} ${magnitude.toFixed(1)} stops — tell the lab.`;
}
