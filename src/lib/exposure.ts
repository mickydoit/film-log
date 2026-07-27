export type LightId =
  | 'bright-sun' | 'hazy-sun' | 'overcast'
  | 'open-shade' | 'indoors' | 'night';

export type Light = {
  id: LightId;
  label: string;
  icon: string;
  /** Exposure value at ISO 100 for this kind of light. */
  ev100: number;
  description: string;
};

/** Standard EV100 values. Ordered brightest first. */
export const LIGHTS: Light[] = [
  { id: 'bright-sun', label: 'Bright sun', icon: '☀️', ev100: 15,
    description: 'Hard, distinct shadows' },
  { id: 'hazy-sun', label: 'Hazy sun', icon: '🌤️', ev100: 14,
    description: 'Soft-edged shadows' },
  { id: 'overcast', label: 'Overcast', icon: '☁️', ev100: 13,
    description: 'No visible shadows' },
  { id: 'open-shade', label: 'Open shade', icon: '⛅', ev100: 11,
    description: 'Shade under open sky, or sunset' },
  { id: 'indoors', label: 'Indoors', icon: '🏠', ev100: 8,
    description: 'Bright room, or a lit street at night' },
  { id: 'night', label: 'Night', icon: '🌙', ev100: 5,
    description: 'Dim interior or dark street' },
];

/** Shutter speeds the Olympus XA can produce, in seconds, slowest first. */
const XA_SPEEDS: { seconds: number; label: string }[] = [
  { seconds: 10, label: '10s' },
  { seconds: 8, label: '8s' },
  { seconds: 4, label: '4s' },
  { seconds: 2, label: '2s' },
  { seconds: 1, label: '1s' },
  { seconds: 1 / 2, label: '1/2' },
  { seconds: 1 / 4, label: '1/4' },
  { seconds: 1 / 8, label: '1/8' },
  { seconds: 1 / 15, label: '1/15' },
  { seconds: 1 / 30, label: '1/30' },
  { seconds: 1 / 60, label: '1/60' },
  { seconds: 1 / 125, label: '1/125' },
  { seconds: 1 / 250, label: '1/250' },
  { seconds: 1 / 500, label: '1/500' },
];

const SLOWEST = XA_SPEEDS[0];
const FASTEST = XA_SPEEDS[XA_SPEEDS.length - 1];
const SHAKE_THRESHOLD = 1 / 30;

export type ShutterEstimate = {
  label: string;
  seconds: number;
  outOfRange: 'none' | 'too-dark' | 'too-bright';
  shakeRisk: boolean;
  note: string;
};

export function parseAperture(label: string): number {
  const match = /^f\/(\d+(?:\.\d+)?)$/.exec(label.trim());
  if (!match) throw new Error(`Cannot parse aperture: "${label}"`);
  return Number(match[1]);
}

/**
 * Estimate the shutter speed an aperture-priority camera would choose.
 *
 *   EV_scene = EV100(light) + log2(ISO / 100) - compensation
 *   t        = N^2 / 2^EV_scene
 *
 * Positive compensation asks for more light, which lowers the effective EV
 * and therefore lengthens the exposure.
 */
export function estimateShutter(input: {
  aperture: string;
  iso: number;
  light: LightId;
  compensationEv?: number;
}): ShutterEstimate {
  const { aperture, iso, light, compensationEv = 0 } = input;

  const lightSpec = LIGHTS.find(l => l.id === light);
  if (!lightSpec) throw new Error(`Unknown light condition: ${light}`);

  const n = parseAperture(aperture);
  const evScene = lightSpec.ev100 + Math.log2(iso / 100) - compensationEv;
  const ideal = (n * n) / Math.pow(2, evScene);

  if (ideal > SLOWEST.seconds) {
    return {
      ...SLOWEST,
      outOfRange: 'too-dark',
      shakeRisk: true,
      note: `Too dark for this aperture — the XA tops out at 10s, so expect underexposure. Open up the aperture or use faster film.`,
    };
  }

  if (ideal < FASTEST.seconds) {
    return {
      ...FASTEST,
      outOfRange: 'too-bright',
      shakeRisk: false,
      note: `Too bright for this aperture — the XA stops at 1/500, so expect overexposure. Stop down or use slower film.`,
    };
  }

  const nearest = XA_SPEEDS.reduce((best, speed) =>
    Math.abs(Math.log2(speed.seconds / ideal)) <
    Math.abs(Math.log2(best.seconds / ideal)) ? speed : best,
  );

  const shakeRisk = nearest.seconds >= SHAKE_THRESHOLD;

  return {
    ...nearest,
    outOfRange: 'none',
    shakeRisk,
    note: shakeRisk
      ? `At ${nearest.label} camera shake is likely — brace against something or find a tripod.`
      : `Fast enough to hand-hold comfortably.`,
  };
}
