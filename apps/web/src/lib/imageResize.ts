import { MAX_IMAGE_BYTES } from '@gearshare/shared';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_EDGE = 1600;
const QUALITY = 0.85;

export type ResizeErrorCode = 'type' | 'size' | 'decode';
export class ResizeError extends Error {
  constructor(public code: ResizeErrorCode) {
    super(`resize.${code}`);
  }
}

// Downscales to at most MAX_EDGE px on the long side and re-encodes as JPEG, so uploads are small
// and always under the size limit.
export async function resizeImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new ResizeError('type');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ResizeError('decode');
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ResizeError('decode');
  ctx.fillStyle = '#fff'; // flatten transparency, JPEG has no alpha
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  if (!blob) throw new ResizeError('decode');
  if (blob.size > MAX_IMAGE_BYTES) throw new ResizeError('size');
  return blob;
}
