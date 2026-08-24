import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HeartCounter from '../components/HeartCounter';
import PunishmentCounters from '../components/PunishmentCounters';
import TimerBar from '../components/TimerBar';
import { Card, PrimaryButton, Tag } from '../components/ui';
import { QUESTION_DURATION_MS } from '../config';
import { GROUP_WITH_BONUS, getGroupQuestions } from '../data/questions';
import { playSfx } from '../lib/sfx';
import { useGameStore } from '../state/gameStore';
import {
  OPTION_KEYS,
  PUNISHMENT_EMOJI,
  isFernandaGroup,
  playerForGroup,
  type GroupId,
  type PunishmentKey,
  type Question,
} from '../types';

/** Leaflet is only needed for group 3's closing question, so keep it out of the entry chunk. */
const BonusMapQuestion = lazy(() => import('./BonusMapQuestion'));

interface Feedback {
  selectedIndex: number | null;
  isCorrect: boolean;
  punishment: PunishmentKey | null;
}

/** Shared by Fernanda's three groups and by Hector's reciprocal quiz. */
export default function QuestionPlay() {
  const { groupId: rawGroupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const locale = useGameStore((s) => s.locale);
  const muted = useGameStore((s) => s.muted);
  const reciprocalQuiz = useGameStore((s) => s.reciprocalQuiz);
  const startGroup = useGameStore((s) => s.startGroup);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const recordBonusDistance = useGameStore((s) => s.recordBonusDistance);
  const completeGroup = useGameStore((s) => s.completeGroup);

  const isValidGroup = rawGroupId === 'hector' || isFernandaGroup(rawGroupId ?? '');
  const groupId = (rawGroupId ?? '1') as GroupId;
  const player = playerForGroup(groupId);
  const tally = useGameStore((s) => s.tallies[player]);

  const questions: Question[] = useMemo(() => {
    if (groupId === 'hector') {
      // Fernanda's own wording, always rendered as written — never translated.
      return reciprocalQuiz.map((q) => ({
        id: q.id,
        text: q.questionText,
        options: OPTION_KEYS.map((key) => q.options[key]),
        correctIndex: OPTION_KEYS.indexOf(q.correctOption),
      }));
    }
    return isFernandaGroup(groupId) ? getGroupQuestions(groupId, locale) : [];
  }, [groupId, locale, reciprocalQuiz]);

  // Resume from however many answers are already banked for this group.
  const [cursor, setCursor] = useState(
    () => useGameStore.getState().inProgress[groupId]?.answers.length ?? 0,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!isValidGroup) {
      navigate('/menu', { replace: true });
      return;
    }
    startGroup(groupId);
  }, [groupId, isValidGroup, navigate, startGroup]);

  useEffect(() => {
    if (isValidGroup && questions.length === 0) navigate('/menu', { replace: true });
  }, [isValidGroup, questions.length, navigate]);

  const question = questions[cursor];
  const hasBonus = groupId === GROUP_WITH_BONUS;
  const isLastQuestion = cursor === questions.length - 1;

  const finishGroup = async (bonusMeters: number | null) => {
    if (finishing) return;
    setFinishing(true);
    if (bonusMeters !== null) recordBonusDistance(groupId, bonusMeters);
    await completeGroup(groupId);
    navigate(`/partial-results/${groupId}`, { replace: true });
  };

  const resolve = (selectedIndex: number | null) => {
    if (feedback || !question) return;

    const punishment = answerQuestion(groupId, question, selectedIndex);
    const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;

    if (isCorrect) playSfx('correct', muted);
    else playSfx(selectedIndex === null ? 'timeout' : 'incorrect', muted);

    setFeedback({ selectedIndex, isCorrect, punishment });
  };

  const goNext = () => {
    setFeedback(null);
    if (!isLastQuestion) {
      setCursor((current) => current + 1);
      return;
    }
    if (hasBonus) {
      setShowBonus(true);
      return;
    }
    void finishGroup(null);
  };

  if (showBonus) {
    return (
      <Suspense fallback={<Card className="mt-2 !p-6 text-center text-sm text-ink-soft">…</Card>}>
        <BonusMapQuestion onContinue={(meters) => void finishGroup(meters)} />
      </Suspense>
    );
  }

  if (!question) return null;

  const heading =
    groupId === 'hector' ? t('play.hectorTitle') : t('play.group', { n: groupId });

  return (
    <div className="pt-2">
      <Card className="!p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Tag>{heading}</Tag>
          <span className="text-[11px] font-semibold text-ink-soft">
            {t('play.progress', { current: cursor + 1, total: questions.length })}
          </span>
        </div>

        <div className="mb-3 min-h-7">
          <HeartCounter hearts={tally.hearts} />
        </div>

        <div className="mb-4">
          <PunishmentCounters counts={tally.punishments} highlight={feedback?.punishment} />
        </div>

        <div className="mb-4">
          <TimerBar
            durationMs={QUESTION_DURATION_MS}
            running={feedback === null}
            resetKey={question.id}
            onTimeout={() => resolve(null)}
          />
        </div>

        <p className="font-display mb-4 text-xl leading-snug text-ink">{question.text}</p>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, index) => {
            const isChosen = feedback?.selectedIndex === index;
            const isRight = index === question.correctIndex;

            let tone = 'border-card-line bg-white hover:border-wine';
            if (feedback) {
              if (isRight) tone = 'border-good bg-good-bg text-[#204623]';
              else if (isChosen) tone = 'border-bad bg-bad-bg text-[#5c1416]';
              else tone = 'border-card-line bg-white opacity-45';
            }

            return (
              <button
                key={`${question.id}-${index}`}
                type="button"
                disabled={feedback !== null}
                onClick={() => resolve(index)}
                className={`rounded-xl border-[1.5px] px-3.5 py-3 text-left text-[14.5px] text-ink transition ${tone}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {feedback ? (
          <div
            className={`animate-rise mt-3.5 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed ${
              feedback.isCorrect ? 'bg-good-bg text-[#204623]' : 'bg-bad-bg text-[#5c1416]'
            }`}
          >
            <b className="block">
              {feedback.isCorrect
                ? t('play.correct')
                : feedback.selectedIndex === null
                  ? t('play.timeout')
                  : t('play.incorrect')}
            </b>
            {feedback.isCorrect ? (
              <span>{t('play.correctSub')}</span>
            ) : (
              <>
                <span>
                  {t('play.correctWas', { answer: question.options[question.correctIndex] })}
                </span>
                {feedback.punishment ? (
                  <span className="mt-1 block font-semibold">
                    {t('play.punishmentAdded', {
                      name: `${PUNISHMENT_EMOJI[feedback.punishment]} ${t(
                        `punishments.${feedback.punishment}Full`,
                      )}`,
                    })}
                  </span>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {feedback ? (
          <div className="mt-3.5">
            <PrimaryButton onClick={goNext} disabled={finishing}>
              {isLastQuestion && !hasBonus ? t('play.finish') : t('common.continue')}
            </PrimaryButton>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
