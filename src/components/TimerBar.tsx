import { useEffect, useRef, useState } from 'react';

/** The bar turns red for the final stretch of the countdown. */
const URGENT_SECONDS = 5;

interface TimerBarProps {
  durationMs: number;
  /** Set to false the moment an answer is picked to freeze the bar in place. */
  running: boolean;
  onTimeout: () => void;
  /** Change this to restart the countdown for a new question. */
  resetKey: string | number;
}

/** Depletes right-to-left: the fill is anchored left and shrinks towards it. */
export default function TimerBar({ durationMs, running, onTimeout, resetKey }: TimerBarProps) {
  const [ratio, setRatio] = useState(1);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setRatio(1);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;

    // setTimeout is authoritative for expiry: requestAnimationFrame stops
    // ticking in a hidden or throttled tab, which would leave the question
    // open forever. rAF only drives the visual depletion.
    const deadline = performance.now() + durationMs;
    const timer = window.setTimeout(() => onTimeoutRef.current(), durationMs);

    let frame = 0;
    const tick = (now: number) => {
      setRatio(Math.max(0, (deadline - now) / durationMs));
      if (now < deadline) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [running, resetKey, durationMs]);

  const seconds = Math.ceil((ratio * durationMs) / 1000);
  /** Tied to seconds left rather than a share of the bar, so it survives a duration change. */
  const urgent = seconds <= URGENT_SECONDS;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-line"
        role="timer"
        aria-label={`${seconds}s`}
      >
        <div
          className={`h-full rounded-full ${urgent ? 'bg-bad' : 'bg-gold'}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span
        className={`font-display w-6 text-right text-sm font-semibold tabular-nums ${
          urgent ? 'text-bad' : 'text-ink-soft'
        }`}
      >
        {seconds}
      </span>
    </div>
  );
}
