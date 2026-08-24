/**
 * Photos served from public/images (copied to dist/images on build).
 * The collage draws a random twelve from this pool of 24 on load and again
 * every 15s.
 */
export const COLLAGE_POOL: string[] = Array.from(
  { length: 24 },
  (_, i) => `/images/pool-${String(i + 1).padStart(2, '0')}.jpg`,
);
