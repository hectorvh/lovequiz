/**
 * Single source of truth for the per-question countdown.
 *
 * Used by QuestionPlay to run the timer and by the Instructions screen to state
 * the limit, so changing it here updates the copy in all four languages too.
 */
export const QUESTION_DURATION_MS = 30_000;

export const QUESTION_DURATION_SECONDS = QUESTION_DURATION_MS / 1000;
