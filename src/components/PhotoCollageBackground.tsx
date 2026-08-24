import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { COLLAGE_POOL } from '../data/collagePool';

const VISIBLE = 12;
const INTRO_MS = 1500;
const SHUFFLE_MS = 15000;

function shuffle<T>(input: T[]): T[] {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Twelve distinct photos, preferring ones that aren't currently on screen. */
function pickTwelve(exclude: string[] = []): string[] {
  const fresh = COLLAGE_POOL.filter((src) => !exclude.includes(src));
  const source = fresh.length >= VISIBLE ? fresh : COLLAGE_POOL;
  return shuffle(source).slice(0, VISIBLE);
}

/**
 * 3x4 grid of the couple's photos, fixed behind every screen. A random twelve
 * are drawn from the pool; two alternating cell groups drift in and out of a
 * subtle zoom, and every 15s the set is swapped with a slow crossfade.
 *
 * Runs at full opacity for the first 1.5s, then settles to 50% for the rest of
 * the session.
 */
export default function PhotoCollageBackground() {
  const { pathname } = useLocation();
  const [dimmed, setDimmed] = useState(() => pathname !== '/');

  const [shown, setShown] = useState<string[]>(() => pickTwelve());
  const [outgoing, setOutgoing] = useState<string[] | null>(null);
  const [cycle, setCycle] = useState(0);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (dimmed) return;
    const timer = window.setTimeout(() => setDimmed(true), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [dimmed]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = shownRef.current;
      setOutgoing(current);
      setShown(pickTwelve(current));
      setCycle((n) => n + 1);
    }, SHUFFLE_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="grid h-full w-full grid-cols-3 grid-rows-4 transition-opacity duration-1000 ease-out"
        style={{ opacity: dimmed ? 0.5 : 1 }}
      >
        {shown.map((src, cell) => (
          <div key={cell} className="relative">
            <div
              className={`absolute -inset-[4%] ${
                cell % 2 === 0 ? 'animate-drift-a' : 'animate-drift-b'
              }`}
              style={{ animationDelay: `${(cell % 6) * 0.85}s` }}
            >
              {outgoing ? (
                <img
                  src={outgoing[cell]}
                  alt=""
                  className="collage-feather absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <img
                key={`${cycle}-${src}`}
                src={src}
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
