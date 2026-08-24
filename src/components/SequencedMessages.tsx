import { useEffect, useState } from 'react';

export interface SequenceStep {
  text: string;
  ms: number;
}

/**
 * Plays timed messages one at a time, each replacing the last. Switching
 * language mid-sequence swaps the copy without disturbing the timing.
 */
export default function SequencedMessages({
  steps,
  onComplete,
}: {
  steps: SequenceStep[];
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const step = steps[index];
    if (!step) return;

    const timer = window.setTimeout(() => {
      if (index === steps.length - 1) onComplete();
      else setIndex((current) => current + 1);
    }, step.ms);

    return () => window.clearTimeout(timer);
    // Timing is driven by position in the sequence, not by the translated text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, steps.length]);

  const current = steps[index];

  return (
    <div className="grid min-h-[55dvh] place-items-center px-2 text-center">
      <p
        key={index}
        className="animate-rise font-display text-3xl leading-tight font-semibold text-[#faf1e8] italic drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]"
      >
        {current?.text}
      </p>
    </div>
  );
}
