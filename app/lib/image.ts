// Client-side image helpers. Photos are downscaled BEFORE storage so the local
// DB stays small and (later) uploads are cheap.

export async function downscaleImage(file: File, maxDim = 1080, quality = 0.82): Promise<Blob> {
  const bitmap = await blobToBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap) (bitmap as ImageBitmap).close?.();
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', quality),
  );
}

/**
 * Rotate an image blob by a number of 90° clockwise quarter-turns, baking the
 * rotation into the pixels so it displays right everywhere (feed, share card,
 * table chat) without orientation metadata. Returns a new JPEG blob.
 */
export async function rotateImage(blob: Blob, quarterTurns = 1, quality = 0.82): Promise<Blob> {
  const turns = ((quarterTurns % 4) + 4) % 4;
  const bitmap = await blobToBitmap(blob);
  if (turns === 0) {
    if ('close' in bitmap) (bitmap as ImageBitmap).close?.();
    return blob;
  }
  const sw = bitmap.width;
  const sh = bitmap.height;
  const swap = turns === 1 || turns === 3;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? sh : sw;
  canvas.height = swap ? sw : sh;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(bitmap, -sw / 2, -sh / 2);
  if ('close' in bitmap) (bitmap as ImageBitmap).close?.();
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', quality),
  );
}

async function blobToBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
