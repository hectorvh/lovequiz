import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  FERNANDA_GROUPS,
  PUNISHMENT_ORDER,
  RECIPROCAL_OPTION_KEYS,
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
  type ReciprocalOptionKey,
  type Tally,
} from '../types';
import { pickUniquePositiveSticker, type GroupStickerRef } from '../data/groupStickers';
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
  abcCongratsShown: boolean;
}

interface GameActions {
  setLocale: (locale: Locale) => void;
  toggleMuted: () => void;

  startGroup: (groupId: GroupId) => void;
  restartGroup: (groupId: GroupId) => void;
  answerQuestion: (groupId: GroupId, question: Question, selectedIndex: number | null) => PunishmentKey | null;
  recordBonusDistance: (groupId: GroupId, meters: number) => void;
  completeGroup: (groupId: GroupId) => Promise<void>;
  ensureGroupStickers: () => void;

  setQuizDraftItem: (index: number, item: QuizDraftItem) => void;
  saveReciprocalQuizLocally: (questions: ReciprocalQuestion[]) => void;
  beginNewReciprocalQuiz: () => void;

  setPhotoTaken: (taken: boolean) => void;
  setQuestionDurationSeconds: (seconds: number) => void;

  clearAnswersLocally: () => void;
  resetPhotoGate: () => void;
  resetAllProgress: () => void;
  markAbcCongratsShown: () => void;
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
  abcCongratsShown: false,
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

export function addTally(base: Tally, amount: Tally): Tally {
  return {
    hearts: base.hearts + amount.hearts,
    punishments: {
      beso: base.punishments.beso + amount.punishments.beso,
      baile: base.punishments.baile + amount.punishments.baile,
      masaje: base.punishments.masaje + amount.punishments.masaje,
      secreto: base.punishments.secreto + amount.punishments.secreto,
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
       * Replaying a finished group keeps the previous answers, sticker and
       * totals until the new run is completed, so backing out does not lose
       * the last saved result.
       */
      startGroup: (groupId) => {
        set((state) => {
          const alreadyPlaying = state.inProgress[groupId];
          const questionCount = alreadyPlaying?.questionIds?.length ?? 0;
          const answeredCount = alreadyPlaying?.answers.length ?? 0;
          const resumeMidRun = questionCount > 0 && answeredCount < questionCount;
          const pendingBonus =
            groupId === '3' &&
            questionCount > 0 &&
            answeredCount >= questionCount &&
            alreadyPlaying?.bonusDistanceMeters == null;
          if (resumeMidRun || pendingBonus) return state;

          const questionIds = isFernandaGroup(groupId)
            ? ensurePlayQuestionIds(groupId, undefined, [])
            : state.reciprocalQuiz.map((question) => question.id);

          return {
            inProgress: {
              ...state.inProgress,
              [groupId]: { answers: [], bonusDistanceMeters: null, questionIds },
            },
          };
        });
      },

      restartGroup: (groupId) => {
        set((state) => {
          const questionIds = isFernandaGroup(groupId)
            ? ensurePlayQuestionIds(groupId, undefined, [])
            : state.reciprocalQuiz.map((question) => question.id);

          return {
            inProgress: {
              ...state.inProgress,
              [groupId]: { answers: [], bonusDistanceMeters: null, questionIds },
            },
          };
        });
      },

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

        const isReplay = (state.answers[groupId]?.length ?? 0) > 0;

        const tally = state.tallies[player];
        const nextTally: Tally = isReplay
          ? tally
          : {
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

        const usedPositiveFiles = FERNANDA_GROUPS.filter((id) => id !== groupId)
          .map((id) => state.groupStickers[id])
          .filter((ref): ref is GroupStickerRef => ref?.kind === 'positive')
          .map((ref) => ref.file);
        const sticker = isFernandaGroup(groupId)
          ? pickUniquePositiveSticker(usedPositiveFiles)
          : null;

        const previous = state.answers[groupId];
        const groupTally = computeTally(inProgress.answers);
        const nextTallies =
          previous && previous.length > 0
            ? {
                ...state.tallies,
                [player]: addTally(
                  subtractTally(state.tallies[player], computeTally(previous)),
                  groupTally,
                ),
              }
            : state.tallies;

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
          tallies: nextTallies,
        });

        const completed = get().completedGroups;
        if (groupId === 'hector') pushFlag('hector_quiz_complete', true);
        if (FERNANDA_GROUPS.every((id) => completed.includes(id))) {
          pushFlag('all_groups_complete', true);
        }

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
        const next: Record<string, GroupStickerRef> = { ...state.groupStickers };
        const used = new Set<string>();
        let changed = false;

        for (const groupId of FERNANDA_GROUPS) {
          if (!state.completedGroups.includes(groupId)) continue;
          const current = next[groupId];
          if (current?.kind === 'positive' && !used.has(current.file)) {
            used.add(current.file);
            continue;
          }
          const sticker = pickUniquePositiveSticker(used);
          if (!sticker) continue;
          next[groupId] = sticker;
          used.add(sticker.file);
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
          const { hector: _hectorSticker, ...otherStickers } = state.groupStickers;
          return {
            reciprocalQuiz: questions,
            reciprocalQuizSaved: true,
            quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
            completedGroups: state.completedGroups.filter((id) => id !== 'hector'),
            answers: otherAnswers,
            bonusDistances: otherBonus,
            inProgress: otherProgress,
            playedQuestionIds: otherPlayed,
            groupStickers: otherStickers,
            tallies: { ...state.tallies, hector: emptyTally() },
          };
        });
        pushFlag('reciprocal_quiz_saved', true);
        pushFlag('hector_quiz_complete', false);
      },

      beginNewReciprocalQuiz: () => {
        set((state) => {
          const { hector: _hectorAnswers, ...otherAnswers } = state.answers;
          const { hector: _hectorBonus, ...otherBonus } = state.bonusDistances;
          const { hector: _hectorProgress, ...otherProgress } = state.inProgress;
          const { hector: _hectorPlayed, ...otherPlayed } = state.playedQuestionIds;
          const { hector: _hectorSticker, ...otherStickers } = state.groupStickers;
          return {
            reciprocalQuiz: [],
            reciprocalQuizSaved: false,
            quizDraft: Array.from({ length: RECIPROCAL_QUIZ_LENGTH }, emptyDraftItem),
            completedGroups: state.completedGroups.filter((id) => id !== 'hector'),
            answers: otherAnswers,
            bonusDistances: otherBonus,
            inProgress: otherProgress,
            playedQuestionIds: otherPlayed,
            groupStickers: otherStickers,
            tallies: { ...state.tallies, hector: emptyTally() },
          };
        });
        pushFlag('reciprocal_quiz_saved', false);
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

      markAbcCongratsShown: () => set({ abcCongratsShown: true }),

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
          abcCongratsShown: false,
        });
      },
    }),
    {
      name: STORE_KEY,
      version: 7,
      migrate: (persisted, version) => {
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
          abcCongratsShown: version < 7 ? false : Boolean(state.abcCongratsShown),
          questionDurationSeconds:
            duration === 30
              ? DEFAULT_QUESTION_DURATION_SECONDS
              : Number.isFinite(duration) && duration > 0
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

/** Prefer the live run when a group is being replayed; otherwise the last saved answers. */
export const selectGroupAnswers =
  (groupId: GroupId) =>
  (state: GameStore): AnswerRecord[] | undefined =>
    state.inProgress[groupId]?.answers ?? state.answers[groupId];

export const isDraftItemComplete = (item: QuizDraftItem | undefined) => {
  if (!item) return false;
  return (
    item.questionText.trim().length > 0 &&
    item.correctOption !== null &&
    RECIPROCAL_OPTION_KEYS.includes(item.correctOption as ReciprocalOptionKey) &&
    RECIPROCAL_OPTION_KEYS.every((key) => item.options[key].trim().length > 0)
  );
};
