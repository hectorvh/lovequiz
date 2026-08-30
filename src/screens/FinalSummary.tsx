import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, ScreenTitle, introTypeClass } from '../components/ui';
import { useGameStore } from '../state/gameStore';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER, type Tally } from '../types';

function OwedColumn({
  heading,
  headingClass,
  tally,
  prizeText,
}: {
  heading: string;
  headingClass: string;
  tally: Tally;
  prizeText?: string;
}) {
  const { t } = useTranslation();
  const owesNothing = PUNISHMENT_ORDER.every((key) => tally.punishments[key] === 0);

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-card-line bg-white p-3">
      <h3 className={`${introTypeClass} mb-3 text-center leading-tight text-wine ${headingClass}`}>
        {heading}
      </h3>

      {prizeText ? (
        <p className={`${introTypeClass} flex-1 text-center text-[1.425rem] leading-snug text-ink-soft`}>
          {prizeText}
        </p>
      ) : owesNothing ? (
        <p className={`${introTypeClass} flex-1 text-center text-[1.425rem] leading-tight text-ink-soft`}>
          {t('summary.nothingOwed')}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-2 gap-y-3">
          {PUNISHMENT_ORDER.map((key) => (
            <li key={key} className="flex flex-col items-center gap-1">
              <span aria-hidden className="text-[1.875rem] leading-none">
                {PUNISHMENT_EMOJI[key]}
              </span>
              <span className={`${introTypeClass} text-[1.575rem] leading-none text-ink`}>
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
            <OwedColumn
              heading={t('summary.fernandaOwes')}
              headingClass="text-[1.725rem]"
              tally={tallies.fernanda}
            />
            <OwedColumn
              heading={t('summary.hectorOwes')}
              headingClass="text-[1.84rem]"
              tally={tallies.hector}
              prizeText={t('summary.hectorPrize')}
            />
          </div>

          <div className="mt-8">
            <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
