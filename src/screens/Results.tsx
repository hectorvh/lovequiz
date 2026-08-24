import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, ScreenTitle } from '../components/ui';
import { getGroupQuestions } from '../data/questions';
import { formatKilometers } from '../lib/distance';
import { useGameStore } from '../state/gameStore';
import {
  FERNANDA_GROUPS,
  OPTION_KEYS,
  isFernandaGroup,
  type GroupId,
  type Question,
} from '../types';

const GROUP_LETTERS: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C' };

/**
 * Reads the local mirror that is written in the same step as the Supabase
 * commit. On this single shared device the mirror and the database always hold
 * the same rows, and the mirror keeps the screen usable offline.
 */
export default function Results() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const locale = useGameStore((s) => s.locale);
  const answers = useGameStore((s) => s.answers);
  const bonusDistances = useGameStore((s) => s.bonusDistances);
  const completedGroups = useGameStore((s) => s.completedGroups);
  const reciprocalQuiz = useGameStore((s) => s.reciprocalQuiz);

  const [selected, setSelected] = useState<GroupId | null>(null);

  const available = useMemo(
    () =>
      ([...FERNANDA_GROUPS, 'hector'] as GroupId[]).filter((id) =>
        completedGroups.includes(id),
      ),
    [completedGroups],
  );

  const questionsFor = (groupId: GroupId): Question[] => {
    if (groupId === 'hector') {
      return reciprocalQuiz.map((q) => ({
        id: q.id,
        text: q.questionText,
        options: OPTION_KEYS.map((key) => q.options[key]),
        correctIndex: OPTION_KEYS.indexOf(q.correctOption),
      }));
    }
    return isFernandaGroup(groupId) ? getGroupQuestions(groupId, locale) : [];
  };

  const labelFor = (groupId: GroupId) =>
    groupId === 'hector'
      ? t('results.hectorLabel')
      : t('results.groupLabel', { letter: GROUP_LETTERS[groupId] });

  if (selected) {
    const questions = questionsFor(selected);
    const rows = answers[selected] ?? [];
    const bonus = bonusDistances[selected];

    return (
      <div className="pt-2">
        <ScreenTitle title={labelFor(selected)} />

        <Card>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('results.cleared')}</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
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
                      {selected === 'hector' ? t('results.hectorAnswer') : t('results.yourAnswer')}:{' '}
                      <span className={row.isCorrect ? 'text-good' : 'text-bad'}>{given}</span>
                    </p>

                    {!row.isCorrect && question ? (
                      <p className="text-[12.5px] text-ink-soft">
                        {t('results.correctAnswer')}:{' '}
                        <span className="text-good">{question.options[question.correctIndex]}</span>
                      </p>
                    ) : null}

                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase ${
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
              {t('bonus.tag')}:{' '}
              {t('bonus.resultKm', { km: formatKilometers(bonus, i18n.language) })}
            </p>
          ) : null}

          <div className="mt-5">
            <GhostButton onClick={() => setSelected(null)}>{t('common.back')}</GhostButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <ScreenTitle title={t('results.title')} />

      <Card>
        {available.length === 0 ? (
          <p className="text-sm text-ink-soft">{t('results.empty')}</p>
        ) : (
          <>
            <p className="mb-3 text-[12.5px] text-ink-soft">{t('results.pick')}</p>
            <ul className="space-y-2.5">
              {available.map((groupId) => (
                <li key={groupId}>
                  <button
                    type="button"
                    onClick={() => setSelected(groupId)}
                    className="w-full rounded-xl border border-card-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink transition hover:border-wine active:scale-[0.99]"
                  >
                    {labelFor(groupId)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-5">
          <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
        </div>
      </Card>
    </div>
  );
}
