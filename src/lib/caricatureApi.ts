/**
 * Caricature generation — STUB.
 *
 * Real Gemini wiring is out of scope for this pass. `generateCaricature` keeps
 * the shape a real call would have (async, may reject, returns a Blob), so the
 * body can be swapped for a fetch to Gemini without touching TakePhoto.
 *
 * The stub applies a posterise + saturation pass on a canvas so the result is
 * visibly different from the original, making the flow easy to demo.
 */

export interface CaricatureResult {
  blob: Blob;
  dataUrl: string;
  /** False while the stub is in place, so the UI can label it honestly. */
  isReal: boolean;
}

const POSTERIZE_LEVELS = 5;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the captured photo'));
    img.src = dataUrl;
  });
}

async function stubCaricature(photoDataUrl: string): Promise<CaricatureResult> {
  const img = await loadImage(photoDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.filter = 'saturate(1.7) contrast(1.25)';
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const step = 255 / (POSTERIZE_LEVELS - 1);
  for (let i = 0; i < frame.data.length; i += 4) {
    frame.data[i] = Math.round(frame.data[i] / step) * step;
    frame.data[i + 1] = Math.round(frame.data[i + 1] / step) * step;
    frame.data[i + 2] = Math.round(frame.data[i + 2] / step) * step;
  }
  ctx.putImageData(frame, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  );
  if (!blob) throw new Error('Could not encode the caricature');

  return { blob, dataUrl: canvas.toDataURL('image/jpeg', 0.9), isReal: false };
}

/**
 * Callers must treat rejection as non-blocking: keep and save the original
 * photo, show a soft notice, and carry on.
 */
export async function generateCaricature(photoDataUrl: string): Promise<CaricatureResult> {
  return stubCaricature(photoDataUrl);
}
