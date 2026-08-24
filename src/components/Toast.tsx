import { useEffect } from 'react';

export default function Toast({
  message,
  onDismiss,
  durationMs = 3200,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="animate-rise fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-night-2/95 px-4 py-3 text-center text-[13px] leading-snug text-[#faf1e8] shadow-xl backdrop-blur"
    >
      {message}
    </div>
  );
}
