import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, ScreenTitle, introTypeClass } from '../components/ui';
import { useGameStore } from '../state/gameStore';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER, type Tally } from '../types';

function OwedColumn({ heading, tally }: { heading: string; tally: Tally }) {
  const { t } = useTranslation();
  const owesNothing = PUNISHMENT_ORDER.every((key) => tally.punishments[key] === 0);

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-card-line bg-white p-3">
      <h3 className={`${introTypeClass} mb-2 text-center text-[1.15rem] leading-tight text-wine`}>
        {heading}
      </h3>

      <p className={`${introTypeClass} mb-2 text-center text-[1.15rem] leading-tight text-wine`}>
        {tally.hearts} <span aria-hidden>❤️</span>
      </p>

      {owesNothing ? (
        <p className={`${introTypeClass} flex-1 text-center text-[0.95rem] leading-tight text-ink-soft`}>
          {t('summary.nothingOwed')}
        </p>
      ) : (
        <ul className="flex flex-col justify-center space-y-2">
          {PUNISHMENT_ORDER.map((key) => (
            <li key={key} className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden className="w-6 shrink-0 text-center text-xl leading-none">
                {PUNISHMENT_EMOJI[key]}
              </span>
              <span className={`${introTypeClass} min-w-0 flex-1 text-[0.82rem] leading-tight text-ink`}>
                {t(`punishments.${key}`)}
              </span>
              <span className={`${introTypeClass} w-5 shrink-0 text-right text-[1.05rem] leading-none text-ink`}>
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
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-[20%] z-10 -translate-y-1/2 px-4">
        <div className="mx-auto max-w-md [&>div]:mb-0">
          <ScreenTitle title={t('summary.title')} className="!mb-0 !text-[2.25rem]" />
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="grid min-w-0 grid-cols-2 gap-2.5">
            <OwedColumn heading={t('summary.fernandaOwes')} tally={tallies.fernanda} />
            <OwedColumn heading={t('summary.hectorOwes')} tally={tallies.hector} />
          </div>

          <div className="mt-8">
            <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
