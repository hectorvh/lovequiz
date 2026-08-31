import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { skipToNextTrack } from '../lib/audio';
import { useGameStore } from '../state/gameStore';
import { chromeButtonClass } from './ui';

/** Wait long enough to catch a double tap without making pause feel sluggish. */
const DOUBLE_CLICK_MS = 280;

export default function MuteToggle() {
  const { t } = useTranslation();
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const clicksRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onClick = () => {
    clicksRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    if (clicksRef.current >= 2) {
      clicksRef.current = 0;
      timerRef.current = null;
      if (!mutedRef.current) skipToNextTrack();
      return;
    }

    timerRef.current = window.setTimeout(() => {
      clicksRef.current = 0;
      timerRef.current = null;
      toggleMuted();
    }, DOUBLE_CLICK_MS);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={muted ? t('common.unmute') : t('common.mute')}
      aria-pressed={muted}
      className={chromeButtonClass}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-[28.8px] w-[28.8px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 9.5h3L11.5 5.5v13L7 14.5H4z" />
        {muted ? (
          <path d="M16 9.5l5 5m0-5l-5 5" />
        ) : (
          <>
            <path d="M15 9.4a3.6 3.6 0 010 5.2" />
            <path d="M17.7 7a7.2 7.2 0 010 10" />
          </>
        )}
      </svg>
    </button>
  );
}
