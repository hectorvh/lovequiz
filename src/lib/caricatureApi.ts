/**
 * Asks the Supabase `caricature` Edge Function to turn a photo into a cartoon
 * via Gemini. Callers must treat rejection as non-blocking: keep and save the
 * original photo, show a soft notice, and carry on.
 */

import { supabase } from './supabaseClient';

export interface CaricatureResult {
  blob: Blob;
  dataUrl: string;
  isReal: boolean;
}

const MAX_EDGE = 1280;
const TIMEOUT_MS = 55_000;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the captured photo'));
    img.src = dataUrl;
  });
}

/** Shrinks the capture so the Edge Function payload stays reasonable. */
async function toJpegBase64(photoDataUrl: string): Promise<string> {
  const img = await loadImage(photoDataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function decodeImage(base64: string, mimeType: string): CaricatureResult {
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return {
    blob: new Blob([bytes], { type: mimeType }),
    dataUrl,
    isReal: true,
  };
}

export async function generateCaricature(photoDataUrl: string): Promise<CaricatureResult> {
  if (!supabase) throw new Error('supabase-unavailable');

  const imageBase64 = await toJpegBase64(photoDataUrl);

  const { data, error } = await supabase.functions.invoke<{
    caricatureBase64?: string;
    mimeType?: string;
    error?: string;
  }>('caricature', {
    body: { imageBase64 },
    timeout: TIMEOUT_MS,
  });

  if (error) throw error;
  if (data?.error || !data?.caricatureBase64) {
    throw new Error(data?.error ?? 'empty-caricature');
  }

  return decodeImage(data.caricatureBase64, data.mimeType || 'image/jpeg');
}
