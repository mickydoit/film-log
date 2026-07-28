import type { CameraSpec } from './types';

/**
 * Olympus XA (1979). Aperture-priority rangefinder.
 * The aperture ring is physically continuous; we offer whole stops only,
 * because finer settings cannot be placed reliably by hand.
 */
export const olympusXA: CameraSpec = {
  id: 'olympus-xa',
  name: 'Olympus XA',
  year: 1979,
  format: 'full',
  lens: 'F.Zuiko 35mm f/2.8',
  controls: [
    {
      id: 'aperture',
      label: 'Aperture',
      type: 'select',
      values: ['f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'],
      hint: 'Wider (f/2.8) blurs the background. Narrower (f/16) keeps more sharp.',
    },
    {
      id: 'focus',
      label: 'Rangefinder distance',
      type: 'select',
      values: ['0.9m', '1.2m', '1.5m', '2m', '3m (hyperfocal)', '5m', '10m', '∞'],
      hint: 'Align the split patch in the viewfinder. 3m is the orange mark.',
    },
    {
      id: 'backlight',
      label: 'Backlight +1.5 EV',
      type: 'toggle',
      hint: 'Use when the subject is darker than the background.',
    },
  ],
  cameraDecides: ['Shutter speed (10s – 1/500)'],
  isoValues: [25, 50, 100, 200, 400, 800],
  estimatesShutter: true,
};
