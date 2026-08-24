import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PHOTO_COUNT = 12;
const INTRO_MS = 1500;

const photos = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/images/collage/${String(i + 1).padStart(2, '0')}.jpg`,
);

/**
 * 3x4 grid of the couple's photos, fixed behind every screen. Two alternating
 * groups (odd- and even-indexed) drift in and out of a subtle zoom.
 *
 * Runs at full opacity for the first 1.5s of the intro, then settles to 50%
 * for the rest of the session.
 */
export default function PhotoCollageBackground() {
  const { pathname } = useLocation();
  const [dimmed, setDimmed] = useState(() => pathname !== '/');

  useEffect(() => {
    if (dimmed) return;
    const timer = window.setTimeout(() => setDimmed(true), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [dimmed]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="grid h-full w-full grid-cols-3 grid-rows-4 transition-opacity duration-1000 ease-out"
        style={{ opacity: dimmed ? 0.5 : 1 }}
      >
        {photos.map((src, index) => {
          const isOddGroup = index % 2 === 0;
          return (
            <div key={src} className="overflow-hidden">
              <img
                src={src}
                alt=""
                loading={index < 6 ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover ${
                  isOddGroup ? 'animate-drift-a' : 'animate-drift-b'
                }`}
                style={{ animationDelay: `${(index % 6) * 0.55}s` }}
              />
            </div>
          );
        })}
      </div>
      <div
        className="absolute inset-0 bg-night transition-opacity duration-1000 ease-out"
        style={{ opacity: dimmed ? 0.55 : 0.3 }}
      />
    </div>
  );
}
