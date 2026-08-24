import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, ScreenTitle } from '../components/ui';
import { useGameStore } from '../state/gameStore';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER, type Tally } from '../types';

function OwedColumn({ heading, tally }: { heading: string; tally: Tally }) {
  const { t } = useTranslation();
  const owesNothing = PUNISHMENT_ORDER.every((key) => tally.punishments[key] === 0);

  return (
    <div className="rounded-2xl border border-card-line bg-white p-3.5">
      <h3 className="font-display mb-2 text-center text-sm font-semibold text-wine">{heading}</h3>

      <p className="mb-2 text-center text-[11px] tracking-wide text-ink-soft uppercase">
        {t('summary.hearts')}
      </p>
      <p className="font-display mb-3 text-center text-2xl font-semibold text-wine">
        {tally.hearts} <span aria-hidden>💗</span>
      </p>

      {owesNothing ? (
        <p className="text-center text-[12px] text-ink-soft">{t('summary.nothingOwed')}</p>
      ) : (
        <ul className="space-y-1.5">
          {PUNISHMENT_ORDER.map((key) => (
            <li key={key} className="flex items-center gap-2 text-[12.5px] text-ink">
              <span aria-hidden>{PUNISHMENT_EMOJI[key]}</span>
              <span className="flex-1 truncate">{t(`punishments.${key}`)}</span>
              <span className="font-display font-semibold text-wine">
                {tally.punishments[key]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FinalSummary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tallies = useGameStore((s) => s.tallies);

  return (
    <div className="pt-2">
      <ScreenTitle title={t('summary.title')} />

      <Card>
        <p className="mb-5 text-center text-[13.5px] leading-relaxed text-ink-soft">
          {t('summary.message')}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <OwedColumn heading={t('summary.fernandaOwes')} tally={tallies.fernanda} />
          <OwedColumn heading={t('summary.hectorOwes')} tally={tallies.hector} />
        </div>

        <p className="font-display mt-5 text-center text-base font-semibold text-wine italic">
          {t('summary.closing')}
        </p>

        <div className="mt-5">
          <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
        </div>
      </Card>
    </div>
  );
}
