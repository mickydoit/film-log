import type { CameraId, Settings } from '../cameras';
import type { LightId } from './exposure';

export type RollStatus = 'shooting' | 'finished' | 'developing' | 'scanned';

export type Roll = {
  id: string;
  camera_id: CameraId;
  film_stock: string;
  box_iso: number;
  iso_set: number;
  exposures: number;
  frame_capacity: number;
  status: RollStatus;
  loaded_at: string;
  finished_at: string | null;
  lab: string | null;
  dev_notes: string | null;
};

export type Critique = {
  exposure: CritiqueSection;
  focus: CritiqueSection;
  motion: CritiqueSection;
  depth_of_field: CritiqueSection;
  overall: string;
  next_time: string[];
};

export type CritiqueSection = {
  verdict: string;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
};

export type Shot = {
  id: string;
  roll_id: string;
  frame_number: number;
  settings: Settings;
  light: LightId | null;
  shot_at: string;
  subject: string | null;
  scan_path: string | null;
  ai_critique: Critique | null;
  my_notes: string | null;
};

export type NewShot = Omit<Shot, 'id' | 'scan_path' | 'ai_critique' | 'my_notes'>;
