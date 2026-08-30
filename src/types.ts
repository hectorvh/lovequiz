export type Locale = 'es' | 'en' | 'fr' | 'de';

export const LOCALES: Locale[] = ['es', 'en', 'fr', 'de'];

/** The three pre-written groups Fernanda plays, plus the reciprocal quiz Hector plays. */
export type GroupId = '1' | '2' | '3' | 'hector';

export const FERNANDA_GROUPS = ['1', '2', '3'] as const satisfies readonly GroupId[];

/** Groups are keyed by number internally but always shown to the player as A / B / C. */
export const GROUP_LETTERS: Record<'1' | '2' | '3', string> = { '1': 'A', '2': 'B', '3': 'C' };

export type Player = 'fernanda' | 'hector';

export type PunishmentKey = 'beso' | 'baile' | 'masaje' | 'secreto';

/** Fixed round-robin order: 1 -> 2 -> 3 -> 4 -> 1 ... */
export const PUNISHMENT_ORDER: PunishmentKey[] = ['beso', 'baile', 'masaje', 'secreto'];

export const PUNISHMENT_EMOJI: Record<PunishmentKey, string> = {
  beso: '💋',
  baile: '💃',
  masaje: '🤲',
  secreto: '🔒',
};

/** A question ready to render, already resolved to a single locale. */
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface AnswerRecord {
  groupId: GroupId;
  questionId: string;
  /** null means the question timer expired with no selection. */
  selectedIndex: number | null;
  isCorrect: boolean;
  punishmentAssigned: PunishmentKey | null;
  answeredAt: string;
}

export interface Tally {
  hearts: number;
  punishments: Record<PunishmentKey, number>;
}

export const emptyTally = (): Tally => ({
  hearts: 0,
  punishments: { beso: 0, baile: 0, masaje: 0, secreto: 0 },
});

/** One of the questions Fernanda writes for Hector. Stored verbatim, never translated. */
export interface ReciprocalQuestion {
  id: string;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: 'A' | 'B' | 'C' | 'D';
  createdAt: string;
}

export const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

/** Fernanda writes three answers for Hector; D is kept empty for stored compatibility. */
export const RECIPROCAL_OPTION_KEYS = ['A', 'B', 'C'] as const;
export type ReciprocalOptionKey = (typeof RECIPROCAL_OPTION_KEYS)[number];

export function playQuestionFromReciprocal(q: ReciprocalQuestion): Question {
  const options = RECIPROCAL_OPTION_KEYS.map((key) => q.options[key] ?? '');
  const correctIndex = RECIPROCAL_OPTION_KEYS.indexOf(q.correctOption as ReciprocalOptionKey);
  return {
    id: q.id,
    text: q.questionText,
    options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
  };
}

export interface StoredPhoto {
  id: string;
  storagePath: string;
  caricatureStoragePath: string | null;
  createdAt: string;
  /** Populated for local-fallback photos so Settings can still offer a download. */
  localDataUrl?: string;
  localCaricatureDataUrl?: string;
}

export const isFernandaGroup = (id: string): id is '1' | '2' | '3' =>
  id === '1' || id === '2' || id === '3';

export const playerForGroup = (groupId: GroupId): Player =>
  groupId === 'hector' ? 'hector' : 'fernanda';

export const groupLetter = (groupId: GroupId): string =>
  isFernandaGroup(groupId) ? GROUP_LETTERS[groupId] : '';
