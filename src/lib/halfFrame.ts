export type Rect = { x: number; y: number; width: number; height: number };

/**
 * A lab scanning half-frame film returns two portrait frames side by side,
 * so a pair reads as a distinctly landscape image. A single half-frame is
 * portrait. Anything roughly square is ambiguous and treated as a single.
 */
export function looksLikeFramePair(width: number, height: number): boolean {
  return width / height >= 1.2;
}

/** Split down the middle, full height. Odd widths lose the centre column. */
export function splitGeometry(width: number, height: number): [Rect, Rect] {
  const half = Math.floor(width / 2);
  return [
    { x: 0, y: 0, width: half, height },
    { x: width - half, y: 0, width: half, height },
  ];
}

/** Consecutive frame numbers for the pieces produced by one scan file. */
export function assignFrameNumbers(startFrame: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => startFrame + i);
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file'));
    };
    img.src = url;
  });
}

function crop(img: HTMLImageElement, rect: Rect): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser');
  ctx.drawImage(
    img, rect.x, rect.y, rect.width, rect.height,
    0, 0, rect.width, rect.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      0.9,
    );
  });
}

/** Cut a paired scan into its two half-frames, left first. */
export async function splitImage(file: File): Promise<[Blob, Blob]> {
  const img = await loadImage(file);
  const [left, right] = splitGeometry(img.naturalWidth, img.naturalHeight);
  return [await crop(img, left), await crop(img, right)];
}

export { loadImage };
