import { useTranslation } from 'react-i18next';

/** Hearts are always shown as icons, never as a bare number. */
export default function HeartCounter({ hearts }: { hearts: number }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-0.5" aria-label={`${t('play.hearts')}: ${hearts}`}>
      {hearts === 0 ? (
        <span className="text-lg opacity-30" aria-hidden>
          ❤️
        </span>
      ) : (
        Array.from({ length: hearts }, (_, i) => (
          <span key={i} className="animate-pop text-lg" aria-hidden>
            ❤️
          </span>
        ))
      )}
    </div>
  );
}
