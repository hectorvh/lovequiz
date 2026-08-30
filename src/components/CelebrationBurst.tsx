import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#d9a441', '#7a2340', '#f7ece7', '#4c7a4f', '#e3cfc6', '#f4dcdb'];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
  spark: boolean;
}

/**
 * Short burst of sparks and confetti. Unmounts itself after the animation.
 */
export default function CelebrationBurst({ onDone }: { onDone?: () => void }) {
  const [alive, setAlive] = useState(true);
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 56 }, (_, id) => ({
        id,
        left: 6 + Math.random() * 88,
        delay: Math.random() * 0.45,
        duration: 3.1 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 140,
        rotate: Math.random() * 540 - 270,
        color: COLORS[id % COLORS.length],
        spark: id % 4 === 0,
      })),
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAlive(false);
      onDone?.();
    }, 4600);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  if (!alive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={piece.spark ? 'celebrate-spark' : 'celebrate-confetti'}
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--drift' as string]: `${piece.drift}px`,
            ['--spin' as string]: `${piece.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
