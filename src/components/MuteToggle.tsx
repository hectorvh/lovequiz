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
      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-lg backdrop-blur transition active:scale-95 hover:bg-black/50"
    >
      <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
