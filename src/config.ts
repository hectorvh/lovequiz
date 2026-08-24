/**
 * Defaults and bounds for the per-question countdown.
 * The live value lives in the game store so Settings can change it.
 */
export const DEFAULT_QUESTION_DURATION_SECONDS = 30;
export const MIN_QUESTION_DURATION_SECONDS = 5;
export const MAX_QUESTION_DURATION_SECONDS = 120;

/** Kept for callers that still want a compile-time default in milliseconds. */
export const QUESTION_DURATION_MS = DEFAULT_QUESTION_DURATION_SECONDS * 1000;
export const QUESTION_DURATION_SECONDS = DEFAULT_QUESTION_DURATION_SECONDS;

export const RECIPROCAL_QUIZ_LENGTH = 3;

/** Soft lock on Play and Settings. Compared client-side on this shared device. */
export const GAME_PIN = '1996';
