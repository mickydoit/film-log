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

  // Two speeds that differ by a hair are the same speed in practice. Without
  // this, box 195 shot at 200 reads "Pushed 0 stops", which is nonsense.
  if (magnitude < 0.06) return null;

  // Split into whole stops plus a fraction, so real dial combinations above
  // one stop read as photographers say them. Box 125 shot at 400 is 1.678
  // stops — "1⅔ stops", not "1.7 stops", which is not lab language.
  const whole = Math.floor(magnitude + 0.06);
  const remainder = magnitude - whole;
  const fraction = FRACTIONS.find(([value]) => Math.abs(remainder - value) < 0.06);

  let amount: string;
  if (remainder < 0.06) amount = String(whole);
  else if (fraction) amount = whole > 0 ? `${whole}${fraction[1]}` : fraction[1];
  else amount = magnitude.toFixed(1);

  const singular = amount === '1' || (whole === 0 && Boolean(fraction));
  return `${direction} ${amount} stop${singular ? '' : 's'} — tell the lab.`;
}
