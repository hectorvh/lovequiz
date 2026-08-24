import { useTranslation } from 'react-i18next';

import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER, type PunishmentKey } from '../types';

export default function PunishmentCounters({
  counts,
  highlight,
}: {
  counts: Record<PunishmentKey, number>;
  highlight?: PunishmentKey | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2">
      {PUNISHMENT_ORDER.map((key) => (
        <div
          key={key}
          className={`rounded-xl border bg-white px-1 py-2 text-center transition ${
            highlight === key ? 'scale-105 border-wine bg-bad-bg' : 'border-card-line'
          }`}
        >
          <div className="text-base" aria-hidden>
            {PUNISHMENT_EMOJI[key]}
          </div>
          <div className="font-display text-lg font-semibold text-wine">{counts[key]}</div>
          <div className="text-[9px] tracking-wide text-ink-soft uppercase">
            {t(`punishments.${key}`)}
          </div>
        </div>
      ))}
    </div>
  );
}
