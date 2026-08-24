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
    <div className="grid grid-cols-4 gap-1.5">
      {PUNISHMENT_ORDER.map((key) => (
        <div
          key={key}
          aria-label={`${t(`punishments.${key}`)}: ${counts[key]}`}
          className={`flex flex-col items-center rounded-xl border bg-white px-1 py-1.5 text-center transition ${
            highlight === key ? 'scale-105 border-wine bg-bad-bg' : 'border-card-line'
          }`}
        >
          <div className="text-base leading-none" aria-hidden>
            {PUNISHMENT_EMOJI[key]}
          </div>
          <div className="font-display text-base font-semibold leading-tight text-wine">
            {counts[key]}
          </div>
        </div>
      ))}
    </div>
  );
}
