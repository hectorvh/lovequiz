import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HeartCounter from '../components/HeartCounter';
import PunishmentCounters from '../components/PunishmentCounters';
import TimerBar from '../components/TimerBar';
import { Card, PrimaryButton, Tag } from '../components/ui';
import { GROUP_WITH_BONUS, questionsForIds } from '../data/questions';
import { playSfx } from '../lib/sfx';
import { addTally, computeTally, selectGroupAnswers, useGameStore } from '../state/gameStore';
import {
  PUNISHMENT_EMOJI,
  groupLetter,
  isFernandaGroup,
  playQuestionFromReciprocal,
  playerForGroup,
  type GroupId,
  type PunishmentKey,
  type Question,
} from '../types';
import BonusMapQuestion from './BonusMapQuestion';

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
  const reciprocalQuiz = useGameStore((s) => s.reciprocalQuiz);
  const startGroup = useGameStore((s) => s.startGroup);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const recordBonusDistance = useGameStore((s) => s.recordBonusDistance);
  const completeGroup = useGameStore((s) => s.completeGroup);

  const isValidGroup = rawGroupId === 'hector' || isFernandaGroup(rawGroupId ?? '');
  const groupId = (rawGroupId ?? '1') as GroupId;
  const player = playerForGroup(groupId);
  const tally = useGameStore((s) => s.tallies[player]);
  const committedAnswers = useGameStore((s) => s.answers[groupId]);
  const groupAnswers = useGameStore(selectGroupAnswers(groupId));
  const groupHearts = useMemo(() => computeTally(groupAnswers ?? []).hearts, [groupAnswers]);
  const punishmentCounts = useMemo(() => {
    if (!committedAnswers?.length) return tally.punishments;
    return addTally(tally, computeTally(groupAnswers ?? [])).punishments;
  }, [committedAnswers, groupAnswers, tally]);
  const durationMs = useGameStore((s) => s.questionDurationSeconds) * 1000;

  const questionIds = useGameStore((s) => s.inProgress[groupId]?.questionIds);

  const questions: Question[] = useMemo(() => {
    if (groupId === 'hector') {
      // Fernanda's own wording, always rendered as written — never translated.
      return reciprocalQuiz.map(playQuestionFromReciprocal);
    }
    if (isFernandaGroup(groupId) && questionIds?.length) {
      return questionsForIds(groupId, locale, questionIds);
    }
    return [];
  }, [groupId, locale, reciprocalQuiz, questionIds]);

  // Resume from however many answers are already banked for this group.
  const [cursor, setCursor] = useState(
    () => useGameStore.getState().inProgress[groupId]?.answers.length ?? 0,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated());
  const cursorSynced = useRef(false);

  useEffect(() => {
    const unsub = useGameStore.persist.onFinishHydration(() => setHydrated(true));
    if (useGameStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isValidGroup) {
      navigate('/menu', { replace: true });
      return;
    }
    startGroup(groupId);
  }, [hydrated, groupId, isValidGroup, navigate, startGroup]);

  useEffect(() => {
    cursorSynced.current = false;
    setShowBonus(false);
    setFeedback(null);
    setFinishing(false);
  }, [groupId, questionIds?.join('|')]);

  useEffect(() => {
    if (questions.length === 0) return;
    const answered = useGameStore.getState().inProgress[groupId]?.answers.length ?? 0;
    if (groupId === GROUP_WITH_BONUS && answered >= questions.length) {
      setShowBonus(true);
      setCursor(Math.max(0, questions.length - 1));
      cursorSynced.current = true;
      return;
    }
    setCursor(Math.min(answered, Math.max(0, questions.length - 1)));
    cursorSynced.current = true;
  }, [groupId, questions.length, questionIds?.join('|')]);

  useEffect(() => {
    if (!hydrated) return;
    if (
      groupId === 'hector' &&
      isValidGroup &&
      reciprocalQuiz.length === 0
    ) {
      navigate('/menu', { replace: true });
    }
  }, [hydrated, groupId, isValidGroup, reciprocalQuiz.length, navigate]);

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

    if (isCorrect) playSfx('correct', false);
    else playSfx(selectedIndex === null ? 'timeout' : 'incorrect', false);

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
    return <BonusMapQuestion onContinue={(meters) => void finishGroup(meters)} />;
  }

  if (!question) {
    if (!hydrated || questions.length === 0) return null;
    if (hasBonus) return <BonusMapQuestion onContinue={(meters) => void finishGroup(meters)} />;
    return null;
  }

  const heading =
    groupId === 'hector' ? t('play.hectorTitle') : t('play.group', { n: groupLetter(groupId) });

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      <div className="min-h-0 flex-[17]" />
      <Card className="flex w-full min-h-0 max-h-full shrink flex-col overflow-hidden !p-[5%]">
        <div className="mb-2 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-1">
          <span />
          <div className="justify-self-center">
            <Tag
              className={
                groupId === 'hector'
                  ? 'px-2.5 py-1 text-[11px] tracking-normal'
                  : 'px-3 py-1.5 text-[15.4px] tracking-normal'
              }
            >
              {heading}
            </Tag>
          </div>
          <span className="font-display justify-self-end text-[1rem] font-semibold tabular-nums text-ink-soft">
            {t('play.progress', { current: cursor + 1, total: questions.length })}
          </span>
        </div>

        <div className="mb-2 min-h-8 shrink-0">
          <HeartCounter hearts={groupHearts} />
        </div>

        <div className="mb-2 shrink-0">
          <PunishmentCounters counts={punishmentCounts} highlight={feedback?.punishment} />
        </div>

        <div className="mb-2 shrink-0">
          <TimerBar
            durationMs={durationMs}
            running={feedback === null}
            resetKey={question.id}
            onTimeout={() => resolve(null)}
          />
        </div>

        <p className="font-display mb-2 shrink-0 text-[clamp(1.045rem,2.75vh,1.32rem)] leading-snug text-ink">
          {question.text}
        </p>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {question.options.map((option, index) => {
            const isChosen = feedback?.selectedIndex === index;
            const isRight = index === question.correctIndex;

            let tone = 'border-card-line bg-white hover:border-wine';
            if (feedback) {
              if (feedback.isCorrect && isRight) tone = 'border-good bg-good-bg text-[#204623]';
              else if (isChosen) tone = 'border-bad bg-bad-bg text-[#5c1416]';
              else tone = 'border-card-line bg-white opacity-45';
            }

            return (
              <button
                key={`${question.id}-${index}`}
                type="button"
                disabled={feedback !== null}
                onClick={() => resolve(index)}
                className={`rounded-xl border-[1.5px] px-3 py-[clamp(0.45rem,1.4vh,0.75rem)] text-left text-[clamp(0.88rem,1.98vh,1.045rem)] leading-snug text-ink transition ${tone}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {feedback ? (
          <div
            className={`animate-rise mt-2 shrink-0 rounded-xl px-3 py-2 text-[12px] leading-snug ${
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
            ) : feedback.punishment ? (
              <span className="mt-0.5 block font-semibold">
                {t('play.punishmentAdded', {
                  name: `${PUNISHMENT_EMOJI[feedback.punishment]} ${t(
                    `punishments.${feedback.punishment}Full`,
                  ).replace(/\n/g, ' ')}`,
                })}
              </span>
            ) : null}
          </div>
        ) : null}

        {feedback ? (
          <div className="mt-2 shrink-0">
            <PrimaryButton onClick={goNext} disabled={finishing}>
              {isLastQuestion && !hasBonus ? t('play.finish') : t('common.continue')}
            </PrimaryButton>
          </div>
        ) : null}
      </Card>
      <div className="min-h-0 flex-[23]" />
    </div>
  );
}
