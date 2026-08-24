import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HeartCounter from '../components/HeartCounter';
import PunishmentCounters from '../components/PunishmentCounters';
import { Card, PrimaryButton, ScreenTitle } from '../components/ui';
import { computeTally, selectGroupAnswers, useGameStore } from '../state/gameStore';
import { groupLetter, isFernandaGroup, playerForGroup, type GroupId } from '../types';

export default function PartialResults() {
  const { groupId: rawGroupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const groupId = (rawGroupId ?? '1') as GroupId;
  const player = playerForGroup(groupId);
  const groupAnswers = useGameStore(selectGroupAnswers(groupId));
  const groupTally = useMemo(() => computeTally(groupAnswers ?? []), [groupAnswers]);
  const totals = useGameStore((s) => s.tallies[player]);

  const title = isFernandaGroup(groupId)
    ? t('partial.title', { n: groupLetter(groupId) })
    : t('partial.titleHector');

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
      <ScreenTitle title={title} />

      <Card>
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {t('partial.heartsThisGroup')}
        </p>
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

        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {t('partial.punishmentsTotal')}
        </p>
        <PunishmentCounters counts={totals.punishments} />

        <div className="mt-6">
          <PrimaryButton onClick={() => navigate('/menu')}>{t('common.continue')}</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
