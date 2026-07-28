import { supabase } from './supabase';
import { getCamera } from '../cameras';
import { estimateShutter } from './exposure';
import { toBase64 } from './imaging';
import { signedScanUrl } from './scans';
import type { Critique, Roll, Shot } from './types';

/** Ask the Edge Function to critique a frame. The Groq key stays server-side. */
export async function requestCritique(shot: Shot, roll: Roll): Promise<Critique> {
  if (!shot.scan_path) throw new Error('This frame has no scan yet.');

  const url = await signedScanUrl(shot.scan_path);
  const blob = await (await fetch(url)).blob();
  const camera = getCamera(roll.camera_id);

  let estimatedShutter: string | null = null;
  if (camera.estimatesShutter && shot.light && typeof shot.settings.aperture === 'string') {
    estimatedShutter = estimateShutter({
      aperture: shot.settings.aperture,
      iso: roll.iso_set,
      light: shot.light,
      compensationEv: shot.settings.backlight === true ? 1.5 : 0,
    }).label;
  }

  const { data, error } = await supabase.functions.invoke('film-critique', {
    body: {
      imageBase64: await toBase64(blob),
      context: {
        camera: camera.name,
        cameraDecides: camera.cameraDecides,
        filmStock: roll.film_stock,
        boxIso: roll.box_iso,
        isoSet: roll.iso_set,
        settings: shot.settings,
        light: shot.light,
        estimatedShutter,
        shotAt: shot.shot_at,
      },
    },
  });

  if (error) throw error;
  if ((data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data as Critique;
}
