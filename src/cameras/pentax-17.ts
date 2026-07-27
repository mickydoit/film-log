import type { CameraSpec } from './types';

/**
 * Pentax 17 (2024, Ricoh). Half-frame, programmed AE.
 * Zone names and ranges are Ricoh's official six.
 */
export const pentax17: CameraSpec = {
  id: 'pentax-17',
  name: 'Pentax 17',
  year: 2024,
  format: 'half',
  lens: 'HD Pentax 25mm f/3.5 (≈37mm equiv.)',
  controls: [
    {
      id: 'mode',
      label: 'Mode dial',
      type: 'select',
      values: [
        'Full Auto',
        'Standard',
        'Slow-speed',
        'Max-aperture (Bokeh)',
        'Bulb',
        'Daylight sync',
        'Slow-speed sync',
      ],
      hint: 'Full Auto ignores the focus ring. Bokeh opens the lens as wide as it can.',
    },
    {
      id: 'zone',
      label: 'Focus zone',
      type: 'zone',
      values: [
        { label: 'Macro', range: '0.24–0.26 m' },
        { label: 'Tabletop', range: '0.47–0.54 m' },
        { label: 'Extremely close', range: '1.0–1.4 m' },
        { label: 'Close', range: '1.4–2.2 m' },
        { label: 'Medium', range: '2.1–5.3 m' },
        { label: 'Far', range: '5.1 m – ∞' },
      ],
      hint: 'Estimate the distance to your subject and pick the zone containing it.',
    },
    {
      id: 'expcomp',
      label: 'Exposure compensation',
      type: 'stops',
      values: [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2],
      hint: 'Positive brightens. Use + for backlit subjects, − for bright snow or sand.',
    },
    {
      id: 'flash',
      label: 'Flash',
      type: 'toggle',
    },
  ],
  cameraDecides: ['Aperture (f/3.5 – f/16)', 'Shutter speed (4s – 1/350)'],
  isoValues: [50, 100, 125, 160, 200, 400, 800, 1600, 3200],
  estimatesShutter: false,
};
