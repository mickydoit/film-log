export type CameraId = 'olympus-xa' | 'pentax-17';

export type Zone = { label: string; range: string };

export type SelectControl = {
  id: string;
  label: string;
  type: 'select';
  values: string[];
  hint?: string;
};

export type ZoneControl = {
  id: string;
  label: string;
  type: 'zone';
  values: Zone[];
  hint?: string;
};

export type StopsControl = {
  id: string;
  label: string;
  type: 'stops';
  values: number[];
  hint?: string;
};

export type ToggleControl = {
  id: string;
  label: string;
  type: 'toggle';
  hint?: string;
};

export type Control = SelectControl | ZoneControl | StopsControl | ToggleControl;

export type SettingValue = string | number | boolean;
export type Settings = Record<string, SettingValue>;

export type CameraSpec = {
  id: CameraId;
  name: string;
  year: number;
  /** 'half' doubles the frame count of a roll. */
  format: 'full' | 'half';
  lens: string;
  /** Controls the photographer physically sets. */
  controls: Control[];
  /** Human-readable list of what the camera decides for you. */
  cameraDecides: string[];
  /** Film-speed dial positions. */
  isoValues: number[];
  /** Whether the app should compute a likely shutter speed for this camera. */
  estimatesShutter: boolean;
};
