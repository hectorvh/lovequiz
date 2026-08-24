import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, PrimaryButton, ScreenTitle, Tag } from '../components/ui';
import { saveReciprocalQuiz } from '../lib/db';
import {
  RECIPROCAL_QUIZ_LENGTH,
  isDraftItemComplete,
  useGameStore,
  type QuizDraftItem,
} from '../state/gameStore';
import { OPTION_KEYS, type OptionKey, type ReciprocalQuestion } from '../types';

export default function QuizCreation() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const quizDraft = useGameStore((s) => s.quizDraft);
  const setQuizDraftItem = useGameStore((s) => s.setQuizDraftItem);
  const saveReciprocalQuizLocally = useGameStore((s) => s.saveReciprocalQuizLocally);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const item = quizDraft[step];
  const complete = isDraftItemComplete(item);
  const isLastStep = step === RECIPROCAL_QUIZ_LENGTH - 1;

  const update = (patch: Partial<QuizDraftItem>) =>
    setQuizDraftItem(step, { ...item, ...patch });

  const setOption = (key: OptionKey, value: string) =>
    update({ options: { ...item.options, [key]: value } });

  const save = async () => {
    if (saving) return;
    setSaving(true);

    const now = new Date().toISOString();
    const questions: ReciprocalQuestion[] = quizDraft.map((draft, index) => ({
      id: `reciprocal-${index + 1}`,
      questionText: draft.questionText.trim(),
      options: {
        A: draft.options.A.trim(),
        B: draft.options.B.trim(),
        C: draft.options.C.trim(),
        D: draft.options.D.trim(),
      },
      correctOption: draft.correctOption ?? 'A',
      createdAt: now,
    }));

    // Stored verbatim, in whichever language Fernanda wrote it.
    saveReciprocalQuizLocally(questions);
    await saveReciprocalQuiz(questions);
    navigate('/menu', { replace: true });
  };

  const canSaveAll = quizDraft.every(isDraftItemComplete);

  return (
    <div className="pt-2">
      <ScreenTitle eyebrow={t('create.subtitle')} title={t('create.title')} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Tag>{t('create.step', { n: step + 1 })}</Tag>
          <div className="flex gap-1">
            {quizDraft.map((draft, index) => (
              <span
                key={index}
                className={`h-1.5 w-5 rounded-full ${
                  index === step
                    ? 'bg-wine'
                    : isDraftItemComplete(draft)
                      ? 'bg-gold'
                      : 'bg-card-line'
                }`}
              />
            ))}
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {t('create.questionLabel')}
        </label>
        <textarea
          value={item.questionText}
          onChange={(event) => update({ questionText: event.target.value })}
          placeholder={t('create.questionPlaceholder')}
          rows={2}
          className="mb-4 w-full resize-none rounded-xl border-[1.5px] border-card-line bg-white px-3.5 py-2.5 text-[14.5px] text-ink outline-none placeholder:text-ink-soft/50 focus:border-wine"
        />

        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {t('create.markCorrect')}
        </p>

        <div className="space-y-2.5">
          {OPTION_KEYS.map((key) => {
            const isCorrect = item.correctOption === key;
            return (
              <div
                key={key}
                className={`flex items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3 py-2 transition ${
                  isCorrect ? 'border-good bg-good-bg' : 'border-card-line'
                }`}
              >
                <button
                  type="button"
                  onClick={() => update({ correctOption: key })}
                  aria-label={`${t('create.markCorrect')} ${key}`}
                  aria-pressed={isCorrect}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition ${
                    isCorrect
                      ? 'border-good bg-good text-white'
                      : 'border-card-line text-ink-soft'
                  }`}
                >
                  {isCorrect ? '✓' : key}
                </button>
                <input
                  value={item.options[key]}
                  onChange={(event) => setOption(key, event.target.value)}
                  placeholder={t('create.answerPlaceholder', { letter: key })}
                  className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-soft/50"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] leading-snug text-ink-soft">{t('create.notTranslated')}</p>

        {!complete ? (
          <p className="mt-2 text-[11.5px] leading-snug text-bad">{t('create.incomplete')}</p>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {isLastStep ? (
            <PrimaryButton onClick={() => void save()} disabled={!canSaveAll || saving}>
              {t('create.saveAll')}
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setStep((s) => s + 1)} disabled={!complete}>
              {t('common.continue')}
            </PrimaryButton>
          )}

          <GhostButton onClick={() => (step === 0 ? navigate('/menu') : setStep((s) => s - 1))}>
            {t('common.back')}
          </GhostButton>
        </div>
      </Card>
    </div>
  );
}
