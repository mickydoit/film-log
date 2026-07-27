import { loadImage } from './halfFrame';

/**
 * Shrink an image so its longest edge is at most `maxEdge` px.
 * Keeps uploads fast and stays well inside Groq's 20MB request limit.
 */
export async function downscale(file: Blob, maxEdge = 1500): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));

  if (scale === 1 && file.type === 'image/jpeg') return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      0.85,
    );
  });
}

/** Base64 payload without the data: prefix — what the Groq API wants. */
export async function toBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
