import { supabase } from './supabase';
import type { NewShot, Shot } from './types';
import type { Settings } from '../cameras';

export async function listShots(rollId: string): Promise<Shot[]> {
  const { data, error } = await supabase
    .from('film_shots')
    .select('*')
    .eq('roll_id', rollId)
    .order('frame_number', { ascending: true });
  if (error) throw error;
  return data as Shot[];
}

export async function createShot(input: NewShot): Promise<Shot> {
  const { data, error } = await supabase
    .from('film_shots').insert(input).select().single();
  if (error) throw error;
  return data as Shot;
}

export async function updateShot(id: string, patch: Partial<Shot>): Promise<Shot> {
  const { data, error } = await supabase
    .from('film_shots').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Shot;
}

/** One past the highest frame logged, capped at the roll's capacity. */
export function nextFrameNumber(shots: Shot[], capacity: number): number {
  const highest = shots.reduce((max, s) => Math.max(max, s.frame_number), 0);
  return Math.min(highest + 1, capacity);
}

/**
 * Settings from the most recent frame. The Log a shot screen pre-fills with
 * these, because consecutive frames usually share settings and re-entering
 * them every time would kill the habit.
 */
export function lastSettings(shots: Shot[]): Settings | null {
  if (shots.length === 0) return null;
  const latest = shots.reduce((a, b) => (a.frame_number > b.frame_number ? a : b));
  return latest.settings;
}
