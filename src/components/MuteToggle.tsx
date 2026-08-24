import { useTranslation } from 'react-i18next';
import { useGameStore } from '../state/gameStore';

export default function MuteToggle() {
  const { t } = useTranslation();
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? t('common.unmute') : t('common.mute')}
      aria-pressed={muted}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-[#faf1e8] opacity-60 backdrop-blur transition active:scale-95 hover:bg-black/50"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
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
