import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  FERNANDA_GROUPS,
  PUNISHMENT_ORDER,
  emptyTally,
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
import { STORE_KEY, flushGroupToDatabase } from './persistence';
import { setGameFlag, type GroupCommit } from '../lib/db';

/** Flag writes are best-effort: the local store stays the source of truth. */
const pushFlag = (key: string, value: boolean) => void setGameFlag(key, value);

export interface QuizDraftItem {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: 'A' | 'B' | 'C' | 'D' | null;
}

export const RECIPROCAL_QUIZ_LENGTH = 6;

export const emptyDraftItem = (): QuizDraftItem => ({
  questionText: '',
  options: { A: '', B: '', C: '', D: '' },
  correctOption: null,
});

interface InProgressGroup {
  answers: AnswerRecord[];
  bonusDistanceMeters: number | null;
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

  reciprocalQuiz: ReciprocalQuestion[];
  reciprocalQuizSaved: boolean;
  quizDraft: QuizDraftItem[];

  photoTaken: boolean;
}

interface GameActions {
  setLocale: (locale: Locale) => void;
  toggleMuted: () => void;

  startGroup: (groupId: GroupId) => void;
  answerQuestion: (groupId: GroupId, question: Question, selectedIndex: number | null) => PunishmentKey | null;
  recordBonusDistance: (groupId: GroupId, meters: number) => void;
  completeGroup: (groupId: GroupId) => Promise<void>;

  setQuizDraftItem: (index: number, item: QuizDraftItem) => void;
  saveReciprocalQuizLocally: (questions: ReciprocalQuestion[]) => void;

  setPhotoTaken: (taken: boolean) => void;

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
  reciprocalQuiz: [],
  reciprocalQuizSaved: false,
  quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
  photoTaken: false,
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
          if (alreadyPlaying) return state;

          const previous = state.answers[groupId];
          if (!previous) {
            return {
              inProgress: {
                ...state.inProgress,
                [groupId]: { answers: [], bonusDistanceMeters: null },
              },
            };
          }

          const player = playerForGroup(groupId);
          const remainingAnswers = { ...state.answers };
          delete remainingAnswers[groupId];

          return {
            tallies: {
              ...state.tallies,
              [player]: subtractTally(state.tallies[player], computeTally(previous)),
            },
            completedGroups: state.completedGroups.filter((id) => id !== groupId),
            answers: remainingAnswers,
            inProgress: {
              ...state.inProgress,
              [groupId]: { answers: [], bonusDistanceMeters: null },
            },
          };
        }),

      answerQuestion: (groupId, question, selectedIndex) => {
        const state = get();
        const player = playerForGroup(groupId);
        const current = state.inProgress[groupId] ?? { answers: [], bonusDistanceMeters: null };

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

        set({
          answers: { ...state.answers, [groupId]: inProgress.answers },
          bonusDistances: {
            ...state.bonusDistances,
            [groupId]: inProgress.bonusDistanceMeters,
          },
          completedGroups: state.completedGroups.includes(groupId)
            ? state.completedGroups
            : [...state.completedGroups, groupId],
          inProgress: remaining,
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
          hearts: groupTally.hearts,
          punishments: groupTally.punishments,
          bonusDistanceMeters: inProgress.bonusDistanceMeters,
          completedAt: new Date().toISOString(),
        };

        await flushGroupToDatabase(commit);
      },

      setQuizDraftItem: (index, item) =>
        set((state) => {
          const quizDraft = [...state.quizDraft];
          quizDraft[index] = item;
          return { quizDraft };
        }),

      saveReciprocalQuizLocally: (questions) => {
        set({ reciprocalQuiz: questions, reciprocalQuizSaved: true });
        pushFlag('reciprocal_quiz_saved', true);
      },

      setPhotoTaken: (taken) => {
        set({ photoTaken: taken });
        pushFlag('photo_taken', taken);
      },

      /**
       * UI-level only: wipes the answer detail held on this device. Supabase
       * rows are never touched, and completion flags stay intact so the menu
       * gating and the final summary keep working.
       */
      clearAnswersLocally: () => set({ answers: {}, bonusDistances: {}, inProgress: {} }),

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
          reciprocalQuiz: [],
          reciprocalQuizSaved: false,
          quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
          photoTaken: false,
        });
      },
    }),
    { name: STORE_KEY, version: 1 },
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
