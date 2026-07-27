import { supabase } from './supabase';
import { frameCapacity, getCamera, type CameraId } from '../cameras';
import type { Roll, RollStatus } from './types';

export async function listRolls(): Promise<Roll[]> {
  const { data, error } = await supabase
    .from('film_rolls')
    .select('*')
    .order('loaded_at', { ascending: false });
  if (error) throw error;
  return data as Roll[];
}

/** Rolls still in a camera — what the Shelf screen shows. */
export async function activeRolls(): Promise<Roll[]> {
  const { data, error } = await supabase
    .from('film_rolls')
    .select('*')
    .eq('status', 'shooting')
    .order('loaded_at', { ascending: false });
  if (error) throw error;
  return data as Roll[];
}

export async function getRoll(id: string): Promise<Roll> {
  const { data, error } = await supabase
    .from('film_rolls').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Roll;
}

export async function createRoll(input: {
  camera_id: CameraId;
  film_stock: string;
  box_iso: number;
  iso_set: number;
  exposures: number;
}): Promise<Roll> {
  const camera = getCamera(input.camera_id);
  const { data, error } = await supabase
    .from('film_rolls')
    .insert({
      ...input,
      frame_capacity: frameCapacity(camera, input.exposures),
      status: 'shooting' satisfies RollStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Roll;
}

export async function updateRoll(id: string, patch: Partial<Roll>): Promise<Roll> {
  const { data, error } = await supabase
    .from('film_rolls').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Roll;
}

/** How many stops the film was pushed (+) or pulled (-). 0 when box speed. */
export function pushPullStops(roll: Pick<Roll, 'box_iso' | 'iso_set'>): number {
  return Math.log2(roll.iso_set / roll.box_iso);
}
