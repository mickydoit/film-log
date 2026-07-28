import { supabase } from './supabase';
import { downscale } from './imaging';

const BUCKET = 'film-scans';

/** Store a scan and return its storage path. */
export async function uploadScan(
  rollId: string, frameNumber: number, blob: Blob,
): Promise<string> {
  const small = await downscale(blob);
  const path = `${rollId}/${String(frameNumber).padStart(3, '0')}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, small, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** The bucket is private, so images are always fetched through a signed URL. */
export async function signedScanUrl(path: string, seconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
