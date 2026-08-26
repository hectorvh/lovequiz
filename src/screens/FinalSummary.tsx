import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, ScreenTitle, introTypeClass } from '../components/ui';
import { useGameStore } from '../state/gameStore';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER, type Tally } from '../types';

/** Same display face as the "Gracias por jugar" title. */
const summaryLabelClass = `${introTypeClass} text-2xl leading-tight text-[#faf1e8]`;

function OwedColumn({ heading, tally }: { heading: string; tally: Tally }) {
  const { t } = useTranslation();
  const owesNothing = PUNISHMENT_ORDER.every((key) => tally.punishments[key] === 0);

  return (
    <div className="rounded-2xl border border-card-line bg-white p-3.5">
      <h3 className={`${summaryLabelClass} mb-3 text-center !text-wine`}>{heading}</h3>

      <p className={`${summaryLabelClass} mb-3 text-center !text-wine`}>
        {tally.hearts} <span aria-hidden>❤️</span>
      </p>

      {owesNothing ? (
        <p className={`${summaryLabelClass} text-center !text-ink-soft`}>{t('summary.nothingOwed')}</p>
      ) : (
        <ul className="space-y-1.5">
          {PUNISHMENT_ORDER.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span aria-hidden className="text-2xl leading-none">
                {PUNISHMENT_EMOJI[key]}
              </span>
              <span className={`${introTypeClass} flex-1 truncate text-[1.05rem] leading-tight text-ink`}>
                {t(`punishments.${key}`)}
              </span>
              <span className={`${summaryLabelClass} !text-ink`}>{tally.punishments[key]}</span>
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
      <ScreenTitle title={t('summary.title')} className="!text-[2.25rem]" />

      <Card>
        <p className={`${summaryLabelClass} mb-5 text-center !text-ink-soft`}>
          {t('summary.message')}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <OwedColumn heading={t('summary.fernandaOwes')} tally={tallies.fernanda} />
          <OwedColumn heading={t('summary.hectorOwes')} tally={tallies.hector} />
        </div>

        <p className={`${summaryLabelClass} mt-5 text-center !text-wine`}>
          {t('summary.closing')}
        </p>

        <div className="mt-5">
          <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
        </div>
      </Card>
    </div>
  );
}
