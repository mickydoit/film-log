import type { CameraId, CameraSpec, Settings } from './types';
import { olympusXA } from './olympus-xa';
import { pentax17 } from './pentax-17';

export * from './types';

export const CAMERAS: CameraSpec[] = [olympusXA, pentax17];

export function getCamera(id: CameraId): CameraSpec {
  const camera = CAMERAS.find(c => c.id === id);
  if (!camera) throw new Error(`Unknown camera: ${id}`);
  return camera;
}

/** Half-frame cameras fit two frames in the space of one 35mm exposure. */
export function frameCapacity(camera: CameraSpec, exposures: number): number {
  return camera.format === 'half' ? exposures * 2 : exposures;
}

/** The first position of every control — what a fresh roll starts on. */
export function defaultSettings(camera: CameraSpec): Settings {
  const settings: Settings = {};
  for (const control of camera.controls) {
    switch (control.type) {
      case 'select':
        settings[control.id] = control.values[0];
        break;
      case 'zone':
        settings[control.id] = control.values[0].label;
        break;
      case 'stops':
        settings[control.id] = control.values.includes(0) ? 0 : control.values[0];
        break;
      case 'toggle':
        settings[control.id] = false;
        break;
    }
  }
  return settings;
}
