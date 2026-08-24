import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  FERNANDA_GROUPS,
  PUNISHMENT_ORDER,
  emptyTally,
  isFernandaGroup,
  playerForGroup,
  type AnswerRecord,
  type GroupId,
  type Locale,
  type Player,
  type PunishmentKey,
  type Question,
  type ReciprocalQuestion,
  type Tally,
} from '../types';
import { pickGroupSticker, type GroupStickerRef } from '../data/groupStickers';
import { ensurePlayQuestionIds } from '../data/questions';
import {
  DEFAULT_QUESTION_DURATION_SECONDS,
  MAX_QUESTION_DURATION_SECONDS,
  MIN_QUESTION_DURATION_SECONDS,
} from '../config';
import { STORE_KEY, flushGroupToDatabase } from './persistence';
import { setGameFlag, type GroupCommit } from '../lib/db';

/** Flag writes are best-effort: the local store stays the source of truth. */
const pushFlag = (key: string, value: boolean) => void setGameFlag(key, value);

export interface QuizDraftItem {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: 'A' | 'B' | 'C' | 'D' | null;
}

export const RECIPROCAL_QUIZ_LENGTH = 3;

export const emptyDraftItem = (): QuizDraftItem => ({
  questionText: '',
  options: { A: '', B: '', C: '', D: '' },
  correctOption: null,
});

interface InProgressGroup {
  answers: AnswerRecord[];
  bonusDistanceMeters: number | null;
  /** Play order for this session. Fernanda groups: 5 unique IDs from the group's 8. */
  questionIds: string[];
}

interface GameState {
  locale: Locale;
  muted: boolean;

  /** Next index into PUNISHMENT_ORDER, per player. Never reset between groups. */
  punishmentPointer: Record<Player, number>;
  /** Cumulative across every group that player has played. */
  tallies: Record<Player, Tally>;

  completedGroups: GroupId[];
  /** Committed answers, kept as a local mirror of what went to Supabase. */
  answers: Record<string, AnswerRecord[]>;
  bonusDistances: Record<string, number | null>;
  /** Live answers for a group still being played, so a refresh doesn't lose them. */
  inProgress: Record<string, InProgressGroup>;
  /** Play-order IDs kept after a group finishes, so results match what was asked. */
  playedQuestionIds: Record<string, string[]>;
  /** Sticker chosen once when a Fernanda group is completed, so the menu does not re-roll. */
  groupStickers: Record<string, GroupStickerRef>;

  reciprocalQuiz: ReciprocalQuestion[];
  reciprocalQuizSaved: boolean;
  quizDraft: QuizDraftItem[];

  photoTaken: boolean;
  questionDurationSeconds: number;
}

interface GameActions {
  setLocale: (locale: Locale) => void;
  toggleMuted: () => void;

  startGroup: (groupId: GroupId) => void;
  answerQuestion: (groupId: GroupId, question: Question, selectedIndex: number | null) => PunishmentKey | null;
  recordBonusDistance: (groupId: GroupId, meters: number) => void;
  completeGroup: (groupId: GroupId) => Promise<void>;
  ensureGroupStickers: () => void;

  setQuizDraftItem: (index: number, item: QuizDraftItem) => void;
  saveReciprocalQuizLocally: (questions: ReciprocalQuestion[]) => void;

  setPhotoTaken: (taken: boolean) => void;
  setQuestionDurationSeconds: (seconds: number) => void;

  clearAnswersLocally: () => void;
  resetPhotoGate: () => void;
  resetAllProgress: () => void;
}

export type GameStore = GameState & GameActions;

const initialState: GameState = {
  locale: 'es',
  muted: false,
  punishmentPointer: { fernanda: 0, hector: 0 },
  tallies: { fernanda: emptyTally(), hector: emptyTally() },
  completedGroups: [],
  answers: {},
  bonusDistances: {},
  inProgress: {},
  playedQuestionIds: {},
  groupStickers: {},
  reciprocalQuiz: [],
  reciprocalQuizSaved: false,
  quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
  photoTaken: false,
  questionDurationSeconds: DEFAULT_QUESTION_DURATION_SECONDS,
};

/**
 * Hearts and punishments a set of answers contributed. Used both to undo a
 * replay and to show a single group's score.
 *
 * Not a store selector on purpose: it builds a new object every call, which
 * would break Zustand v5's requirement that selectors return stable
 * references. Call it on an array pulled from the store instead.
 */
export function computeTally(answers: AnswerRecord[]): Tally {
  const tally = emptyTally();
  for (const answer of answers) {
    if (answer.isCorrect) tally.hearts += 1;
    else if (answer.punishmentAssigned) tally.punishments[answer.punishmentAssigned] += 1;
  }
  return tally;
}

function subtractTally(from: Tally, amount: Tally): Tally {
  return {
    hearts: Math.max(0, from.hearts - amount.hearts),
    punishments: {
      beso: Math.max(0, from.punishments.beso - amount.punishments.beso),
      baile: Math.max(0, from.punishments.baile - amount.punishments.baile),
      masaje: Math.max(0, from.punishments.masaje - amount.punishments.masaje),
      secreto: Math.max(0, from.punishments.secreto - amount.punishments.secreto),
    },
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLocale: (locale) => set({ locale }),

      toggleMuted: () => set((state) => ({ muted: !state.muted })),

      /**
       * Replaying a finished group rolls back its previous hearts and
       * punishments first, so cumulative totals can't be inflated by a retry.
       * The round-robin pointer intentionally does not rewind.
       */
      startGroup: (groupId) =>
        set((state) => {
          const alreadyPlaying = state.inProgress[groupId];
          if (alreadyPlaying?.questionIds?.length) return state;

          const questionIds = isFernandaGroup(groupId)
            ? ensurePlayQuestionIds(
                groupId,
                alreadyPlaying?.questionIds,
                alreadyPlaying?.answers.map((answer) => answer.questionId) ?? [],
              )
            : alreadyPlaying?.questionIds?.length
              ? alreadyPlaying.questionIds
              : state.reciprocalQuiz.map((question) => question.id);

          if (alreadyPlaying) {
            const keptAnswers = questionIds.flatMap((id) => {
              const row = alreadyPlaying.answers.find((answer) => answer.questionId === id);
              return row ? [row] : [];
            });
            return {
              inProgress: {
                ...state.inProgress,
                [groupId]: { ...alreadyPlaying, questionIds, answers: keptAnswers },
              },
            };
          }

          const previous = state.answers[groupId];
          if (!previous) {
            return {
              inProgress: {
                ...state.inProgress,
                [groupId]: { answers: [], bonusDistanceMeters: null, questionIds },
              },
            };
          }

          const player = playerForGroup(groupId);
          const remainingAnswers = { ...state.answers };
          delete remainingAnswers[groupId];
          const remainingPlayed = { ...state.playedQuestionIds };
          delete remainingPlayed[groupId];
          const remainingStickers = { ...state.groupStickers };
          delete remainingStickers[groupId];

          return {
            tallies: {
              ...state.tallies,
              [player]: subtractTally(state.tallies[player], computeTally(previous)),
            },
            completedGroups: state.completedGroups.filter((id) => id !== groupId),
            answers: remainingAnswers,
            playedQuestionIds: remainingPlayed,
            groupStickers: remainingStickers,
            inProgress: {
              ...state.inProgress,
              [groupId]: { answers: [], bonusDistanceMeters: null, questionIds },
            },
          };
        }),

      answerQuestion: (groupId, question, selectedIndex) => {
        const state = get();
        const player = playerForGroup(groupId);
        const current = state.inProgress[groupId] ?? {
          answers: [],
          bonusDistanceMeters: null,
          questionIds: [],
        };

        if (current.answers.some((a) => a.questionId === question.id)) return null;

        const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;

        let punishment: PunishmentKey | null = null;
        let pointer = state.punishmentPointer[player];
        if (!isCorrect) {
          punishment = PUNISHMENT_ORDER[pointer];
          pointer = (pointer + 1) % PUNISHMENT_ORDER.length;
        }

        const record: AnswerRecord = {
          groupId,
          questionId: question.id,
          selectedIndex,
          isCorrect,
          punishmentAssigned: punishment,
          answeredAt: new Date().toISOString(),
        };

        const tally = state.tallies[player];
        const nextTally: Tally = {
          hearts: tally.hearts + (isCorrect ? 1 : 0),
          punishments: punishment
            ? { ...tally.punishments, [punishment]: tally.punishments[punishment] + 1 }
            : { ...tally.punishments },
        };

        set({
          punishmentPointer: { ...state.punishmentPointer, [player]: pointer },
          tallies: { ...state.tallies, [player]: nextTally },
          inProgress: {
            ...state.inProgress,
            [groupId]: { ...current, answers: [...current.answers, record] },
          },
        });

        return punishment;
      },

      recordBonusDistance: (groupId, meters) =>
        set((state) => {
          const current = state.inProgress[groupId] ?? {
            answers: [],
            bonusDistanceMeters: null,
            questionIds: [],
          };
          return {
            inProgress: {
              ...state.inProgress,
              [groupId]: { ...current, bonusDistanceMeters: meters },
            },
          };
        }),

      completeGroup: async (groupId) => {
        const state = get();
        const inProgress = state.inProgress[groupId];
        if (!inProgress) return;

        const player = playerForGroup(groupId);
        const remaining = { ...state.inProgress };
        delete remaining[groupId];

        const questionIds =
          inProgress.questionIds?.length > 0
            ? inProgress.questionIds
            : inProgress.answers.map((answer) => answer.questionId);

        const correctCount = inProgress.answers.filter((answer) => answer.isCorrect).length;
        const sticker = isFernandaGroup(groupId) ? pickGroupSticker(correctCount) : null;

        set({
          answers: { ...state.answers, [groupId]: inProgress.answers },
          playedQuestionIds: { ...state.playedQuestionIds, [groupId]: questionIds },
          bonusDistances: {
            ...state.bonusDistances,
            [groupId]: inProgress.bonusDistanceMeters,
          },
          completedGroups: state.completedGroups.includes(groupId)
            ? state.completedGroups
            : [...state.completedGroups, groupId],
          inProgress: remaining,
          groupStickers: sticker
            ? { ...state.groupStickers, [groupId]: sticker }
            : state.groupStickers,
        });

        const completed = get().completedGroups;
        if (groupId === 'hector') pushFlag('hector_quiz_complete', true);
        if (FERNANDA_GROUPS.every((id) => completed.includes(id))) {
          pushFlag('all_groups_complete', true);
        }

        const groupTally = computeTally(inProgress.answers);
        const commit: GroupCommit = {
          player,
          groupId,
          answers: inProgress.answers,
          questionIds,
          hearts: groupTally.hearts,
          punishments: groupTally.punishments,
          bonusDistanceMeters: inProgress.bonusDistanceMeters,
          completedAt: new Date().toISOString(),
        };

        await flushGroupToDatabase(commit);
      },

      ensureGroupStickers: () => {
        const state = get();
        let next = state.groupStickers;
        let changed = false;

        for (const groupId of FERNANDA_GROUPS) {
          if (!state.completedGroups.includes(groupId) || next[groupId]) continue;
          const answers = state.answers[groupId];
          if (!answers?.length) continue;
          const sticker = pickGroupSticker(answers.filter((answer) => answer.isCorrect).length);
          if (!sticker) continue;
          if (!changed) next = { ...state.groupStickers };
          next[groupId] = sticker;
          changed = true;
        }

        if (changed) set({ groupStickers: next });
      },

      setQuizDraftItem: (index, item) =>
        set((state) => {
          const quizDraft = [...state.quizDraft];
          quizDraft[index] = item;
          return { quizDraft };
        }),

      saveReciprocalQuizLocally: (questions) => {
        // Replaces the in-session quiz so Hector plays the new set. Older
        // rows in Supabase are left alone — we only ever insert.
        set((state) => {
          const { hector: _hectorAnswers, ...otherAnswers } = state.answers;
          const { hector: _hectorBonus, ...otherBonus } = state.bonusDistances;
          const { hector: _hectorProgress, ...otherProgress } = state.inProgress;
          const { hector: _hectorPlayed, ...otherPlayed } = state.playedQuestionIds;
          return {
            reciprocalQuiz: questions,
            reciprocalQuizSaved: true,
            quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
            completedGroups: state.completedGroups.filter((id) => id !== 'hector'),
            answers: otherAnswers,
            bonusDistances: otherBonus,
            inProgress: otherProgress,
            playedQuestionIds: otherPlayed,
            tallies: { ...state.tallies, hector: emptyTally() },
          };
        });
        pushFlag('reciprocal_quiz_saved', true);
        pushFlag('hector_quiz_complete', false);
      },

      setPhotoTaken: (taken) => {
        set({ photoTaken: taken });
        pushFlag('photo_taken', taken);
      },

      setQuestionDurationSeconds: (seconds) =>
        set({
          questionDurationSeconds: Math.min(
            MAX_QUESTION_DURATION_SECONDS,
            Math.max(MIN_QUESTION_DURATION_SECONDS, Math.round(seconds)),
          ),
        }),

      /**
       * UI-level only: wipes the answer detail held on this device. Supabase
       * rows are never touched, and completion flags stay intact so the menu
       * gating and the final summary keep working.
       */
      clearAnswersLocally: () =>
        set({ answers: {}, bonusDistances: {}, inProgress: {}, playedQuestionIds: {} }),

      resetPhotoGate: () => {
        set({ photoTaken: false });
        pushFlag('photo_taken', false);
      },

      resetAllProgress: () => {
        pushFlag('all_groups_complete', false);
        pushFlag('hector_quiz_complete', false);
        pushFlag('reciprocal_quiz_saved', false);
        pushFlag('photo_taken', false);
        set({
          punishmentPointer: { fernanda: 0, hector: 0 },
          tallies: { fernanda: emptyTally(), hector: emptyTally() },
          completedGroups: [],
          answers: {},
          bonusDistances: {},
          inProgress: {},
          playedQuestionIds: {},
          groupStickers: {},
          reciprocalQuiz: [],
          reciprocalQuizSaved: false,
          quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
          photoTaken: false,
        });
      },
    }),
    {
      name: STORE_KEY,
      version: 5,
      migrate: (persisted) => {
        const state = persisted as GameState;
        const draft = Array.isArray(state.quizDraft) ? state.quizDraft : [];
        const inProgress = Object.fromEntries(
          Object.entries(state.inProgress ?? {}).map(([id, group]) => [
            id,
            {
              answers: group.answers ?? [],
              bonusDistanceMeters: group.bonusDistanceMeters ?? null,
              questionIds: group.questionIds ?? [],
            },
          ]),
        );
        const duration = Number(state.questionDurationSeconds);
        return {
          ...state,
          inProgress,
          playedQuestionIds: state.playedQuestionIds ?? {},
          groupStickers: state.groupStickers ?? {},
          questionDurationSeconds:
            Number.isFinite(duration) && duration > 0
              ? Math.min(
                  MAX_QUESTION_DURATION_SECONDS,
                  Math.max(MIN_QUESTION_DURATION_SECONDS, Math.round(duration)),
                )
              : DEFAULT_QUESTION_DURATION_SECONDS,
          quizDraft: [
            ...draft.slice(0, RECIPROCAL_QUIZ_LENGTH),
            ...Array.from(
              { length: Math.max(0, RECIPROCAL_QUIZ_LENGTH - draft.length) },
              emptyDraftItem,
            ),
          ],
        };
      },
    },
  ),
);

export const selectAllGroupsComplete = (state: GameStore) =>
  FERNANDA_GROUPS.every((id) => state.completedGroups.includes(id));

export const selectAnyGroupComplete = (state: GameStore) =>
  FERNANDA_GROUPS.some((id) => state.completedGroups.includes(id));

export const selectHectorQuizComplete = (state: GameStore) =>
  state.completedGroups.includes('hector');

/** Stable-reference selector for one group's answers, committed or in progress. */
export const selectGroupAnswers =
  (groupId: GroupId) =>
  (state: GameStore): AnswerRecord[] | undefined =>
    state.answers[groupId] ?? state.inProgress[groupId]?.answers;

export const isDraftItemComplete = (item: QuizDraftItem) =>
  item.questionText.trim().length > 0 &&
  item.correctOption !== null &&
  (['A', 'B', 'C', 'D'] as const).every((key) => item.options[key].trim().length > 0);
