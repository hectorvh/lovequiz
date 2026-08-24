import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PHOTO_COUNT = 12;
const INTRO_MS = 1500;
const SHUFFLE_MS = 15000;

const photos = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/images/collage/${String(i + 1).padStart(2, '0')}.jpg`,
);

const identity = () => photos.map((_, i) => i);

/** Shuffle that keeps trying until most cells actually move, so the swap reads. */
function shuffled(current: number[]): number[] {
  const next = [...current];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  const moved = next.filter((value, i) => value !== current[i]).length;
  return moved >= next.length - 2 ? next : shuffled(current);
}

/**
 * 3x4 grid of the couple's photos, fixed behind every screen. Two alternating
 * groups (odd- and even-indexed cells) drift in and out of a subtle zoom, and
 * every 15s the photos trade places with a slow crossfade.
 *
 * Runs at full opacity for the first 1.5s, then settles to 50% for the rest of
 * the session.
 */
export default function PhotoCollageBackground() {
  const { pathname } = useLocation();
  const [dimmed, setDimmed] = useState(() => pathname !== '/');

  const [order, setOrder] = useState(identity);
  const [outgoing, setOutgoing] = useState<number[] | null>(null);
  const [cycle, setCycle] = useState(0);
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    if (dimmed) return;
    const timer = window.setTimeout(() => setDimmed(true), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [dimmed]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOutgoing(orderRef.current);
      setOrder(shuffled(orderRef.current));
      setCycle((current) => current + 1);
    }, SHUFFLE_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="grid h-full w-full grid-cols-3 grid-rows-4 transition-opacity duration-1000 ease-out"
        style={{ opacity: dimmed ? 0.5 : 1 }}
      >
        {order.map((photoIndex, cell) => (
          <div key={cell} className="relative">
            {/*
             * The zoom lives on this layer and overflows the cell slightly, so
             * feathered neighbours overlap and blend rather than leaving gaps.
             */}
            <div
              className={`absolute -inset-[4%] ${
                cell % 2 === 0 ? 'animate-drift-a' : 'animate-drift-b'
              }`}
              style={{ animationDelay: `${(cell % 6) * 0.85}s` }}
            >
              {outgoing ? (
                <img
                  src={photos[outgoing[cell]]}
                  alt=""
                  className="collage-feather absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <img
                key={cycle}
                src={photos[photoIndex]}
                alt=""
                loading={cell < 6 ? 'eager' : 'lazy'}
                className={`collage-feather absolute inset-0 h-full w-full object-cover ${
                  cycle > 0 ? 'animate-photo-in' : ''
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0 bg-night transition-opacity duration-1000 ease-out"
        style={{ opacity: dimmed ? 0.55 : 0.3 }}
      />
    </div>
  );
}
