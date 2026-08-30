import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ConfirmCreateQuizModal from '../components/ConfirmCreateQuizModal';
import { Card, GhostButton, PrimaryButton, ScreenTitle } from '../components/ui';
import { questionsForIds } from '../data/questions';
import { formatKilometers } from '../lib/distance';
import { useGameStore } from '../state/gameStore';
import {
  groupLetter,
  isFernandaGroup,
  playQuestionFromReciprocal,
  type GroupId,
  type Locale,
  type Question,
  type ReciprocalQuestion,
} from '../types';

/**
 * Reads the local mirror that is written in the same step as the Supabase
 * commit. On this single shared device the mirror and the database always hold
 * the same rows, and the mirror keeps the screen usable offline.
 */
export default function Results() {
  const { groupId: rawGroupId } = useParams<{ groupId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const locale = useGameStore((s) => s.locale);
  const answers = useGameStore((s) => s.answers);
  const playedQuestionIds = useGameStore((s) => s.playedQuestionIds);
  const bonusDistances = useGameStore((s) => s.bonusDistances);
  const completedGroups = useGameStore((s) => s.completedGroups);
  const reciprocalQuiz = useGameStore((s) => s.reciprocalQuiz);
  const restartGroup = useGameStore((s) => s.restartGroup);
  const beginNewReciprocalQuiz = useGameStore((s) => s.beginNewReciprocalQuiz);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);

  const groupId = rawGroupId as GroupId | undefined;
  if (!groupId || !completedGroups.includes(groupId)) {
    return <Navigate to="/menu" replace />;
  }

  const questions = questionsForGroup(
    groupId,
    locale,
    playedQuestionIds[groupId] ?? (answers[groupId] ?? []).map((row) => row.questionId),
    reciprocalQuiz,
  );
  const rows = answers[groupId] ?? [];
  const playOrder = playedQuestionIds[groupId] ?? rows.map((row) => row.questionId);
  const orderedRows = playOrder.flatMap((id) => {
    const row = rows.find((entry) => entry.questionId === id);
    return row ? [row] : [];
  });
  const resultRows = orderedRows.length > 0 ? orderedRows : rows;
  const bonus = bonusDistances[groupId];
  const title =
    groupId === 'hector'
      ? t('results.hectorLabel')
      : t('results.groupLabel', { letter: groupLetter(groupId) });

  return (
    <div className="pt-2">
      <ScreenTitle title={title} />

      <Card>
        <div className="mb-5 space-y-2">
          <PrimaryButton
            onClick={() => {
              restartGroup(groupId);
              navigate(`/play/${groupId}`);
            }}
          >
            {t('results.playAgain')}
          </PrimaryButton>
          {groupId === 'hector' ? (
            <PrimaryButton onClick={() => setCreateConfirmOpen(true)}>
              {t('menu.createQuiz')}
            </PrimaryButton>
          ) : null}
        </div>

        {resultRows.length === 0 ? (
          <p className="text-sm text-ink-soft">{t('results.cleared')}</p>
        ) : (
          <ul className="space-y-3">
            {resultRows.map((row) => {
              const question = questions.find((q) => q.id === row.questionId);
              const given =
                row.selectedIndex === null
                  ? t('results.noAnswer')
                  : (question?.options[row.selectedIndex] ?? '—');

              return (
                <li
                  key={row.questionId}
                  className="rounded-xl border border-card-line bg-white p-3.5"
                >
                  <p className="mb-2 text-[13.5px] leading-snug font-semibold text-ink">
                    {question?.text ?? row.questionId}
                  </p>

                  <p className="text-[12.5px] text-ink-soft">
                    {t('results.yourAnswer')}:{' '}
                    <span className={row.isCorrect ? 'text-good' : 'text-bad'}>{given}</span>
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[13px] font-semibold uppercase ${
                      row.isCorrect ? 'bg-good-bg text-good' : 'bg-bad-bg text-bad'
                    }`}
                  >
                    {row.isCorrect ? t('results.correct') : t('results.incorrect')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {typeof bonus === 'number' ? (
          <p className="mt-3 rounded-xl bg-card-line/40 px-3.5 py-2.5 text-[12.5px] text-ink-soft">
            {t('bonus.tag')}: {t('bonus.resultKm', { km: formatKilometers(bonus, i18n.language) })}
          </p>
        ) : null}

        <div className="mt-5">
          <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
        </div>
      </Card>

      {createConfirmOpen ? (
        <ConfirmCreateQuizModal
          onClose={() => setCreateConfirmOpen(false)}
          onConfirm={() => {
            beginNewReciprocalQuiz();
            setCreateConfirmOpen(false);
            navigate('/create-quiz');
          }}
        />
      ) : null}
    </div>
  );
}

function questionsForGroup(
  groupId: GroupId,
  locale: Locale,
  ids: string[],
  reciprocalQuiz: ReciprocalQuestion[],
): Question[] {
  if (groupId === 'hector') {
    const byId = new Map(
      reciprocalQuiz.map((q) => [q.id, playQuestionFromReciprocal(q)]),
    );
    return ids.flatMap((id) => {
      const question = byId.get(id);
      return question ? [question] : [];
    });
  }

  return isFernandaGroup(groupId) ? questionsForIds(groupId, locale, ids) : [];
}
