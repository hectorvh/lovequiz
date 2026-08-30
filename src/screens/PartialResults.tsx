import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HeartCounter from '../components/HeartCounter';
import PunishmentCounters from '../components/PunishmentCounters';
import { Card, PrimaryButton, ScreenTitle } from '../components/ui';
import { computeTally, selectGroupAnswers, useGameStore } from '../state/gameStore';
import { playerForGroup, type GroupId } from '../types';

export default function PartialResults() {
  const { groupId: rawGroupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const groupId = (rawGroupId ?? '1') as GroupId;
  const player = playerForGroup(groupId);
  const groupAnswers = useGameStore(selectGroupAnswers(groupId));
  const groupTally = useMemo(() => computeTally(groupAnswers ?? []), [groupAnswers]);
  const totals = useGameStore((s) => s.tallies[player]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-[20%] z-10 -translate-y-1/2 px-4">
        <div className="mx-auto max-w-md [&>div]:mb-0">
          <ScreenTitle title={t('partial.title')} className="!mb-0" />
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col items-center justify-center">
        <Card className="w-full -translate-y-[8vh]">
          {groupTally.hearts === 0 ? (
            <p className="mb-4 text-sm text-ink-soft">{t('partial.noHearts')}</p>
          ) : (
            <div className="mb-4">
              <HeartCounter hearts={groupTally.hearts} />
            </div>
          )}

          <p className="mb-3 text-sm text-ink-soft">
            {t('partial.runningTotal', { n: totals.hearts })}
          </p>

          <PunishmentCounters counts={totals.punishments} />

          <div className="mt-6">
            <PrimaryButton onClick={() => navigate('/menu', { state: { celebrate: true } })}>
              {t('common.continue')}
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
