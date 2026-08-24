import { PHOTO_BUCKET, isSupabaseEnabled, supabase } from './supabaseClient';
import type {
  AnswerRecord,
  GroupId,
  Player,
  PunishmentKey,
  ReciprocalQuestion,
  StoredPhoto,
} from '../types';

export interface DbResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

const skipped: DbResult<never> = { ok: false, error: 'local-mode' };

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export interface GroupCommit {
  player: Player;
  groupId: GroupId;
  answers: AnswerRecord[];
  hearts: number;
  punishments: Record<PunishmentKey, number>;
  bonusDistanceMeters: number | null;
  completedAt: string;
}

/**
 * Called once, at the end of a question group — never per question.
 * Writes the group's answer rows plus its aggregate summary row.
 */
export async function commitGroup(commit: GroupCommit): Promise<DbResult> {
  if (!supabase) return skipped;
  try {
    const rows = commit.answers.map((a) => ({
      player: commit.player,
      group_id: a.groupId,
      question_id: a.questionId,
      selected_option: a.selectedIndex,
      is_correct: a.isCorrect,
      punishment_assigned: a.punishmentAssigned,
      answered_at: a.answeredAt,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('answers').insert(rows);
      if (error) throw error;
    }

    const { error: summaryError } = await supabase.from('group_summaries').insert({
      player: commit.player,
      group_id: commit.groupId,
      hearts_earned: commit.hearts,
      punishments_by_type: commit.punishments,
      bonus_distance_meters: commit.bonusDistanceMeters,
      completed_at: commit.completedAt,
    });
    if (summaryError) throw summaryError;

    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function saveReciprocalQuiz(questions: ReciprocalQuestion[]): Promise<DbResult> {
  if (!supabase) return skipped;
  try {
    const { error } = await supabase.from('reciprocal_quiz_questions').insert(
      questions.map((q) => ({
        question_text: q.questionText,
        options: q.options,
        correct_option: q.correctOption,
        created_at: q.createdAt,
      })),
    );
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function fetchReciprocalQuiz(): Promise<DbResult<ReciprocalQuestion[]>> {
  if (!supabase) return skipped;
  try {
    const { data, error } = await supabase
      .from('reciprocal_quiz_questions')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const questions: ReciprocalQuestion[] = (data ?? []).map((row) => ({
      id: String(row.id),
      questionText: row.question_text as string,
      options: row.options as ReciprocalQuestion['options'],
      correctOption: row.correct_option as ReciprocalQuestion['correctOption'],
      createdAt: row.created_at as string,
    }));
    return { ok: true, data: questions };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function setGameFlag(key: string, value: boolean): Promise<DbResult> {
  if (!supabase) return skipped;
  try {
    const { error } = await supabase
      .from('game_state')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

const extensionFor = (blob: Blob) => (blob.type === 'image/png' ? 'png' : 'jpg');

export async function uploadPhoto(
  original: Blob,
  caricature: Blob | null,
): Promise<DbResult<StoredPhoto>> {
  if (!supabase) return skipped;
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalPath = `original/${stamp}.${extensionFor(original)}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(originalPath, original, { contentType: original.type, upsert: false });
    if (uploadError) throw uploadError;

    let caricaturePath: string | null = null;
    if (caricature) {
      caricaturePath = `caricature/${stamp}.${extensionFor(caricature)}`;
      const { error: caricatureError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(caricaturePath, caricature, {
          contentType: caricature.type,
          upsert: false,
        });
      // A failed caricature upload must not lose the original.
      if (caricatureError) caricaturePath = null;
    }

    const { data, error } = await supabase
      .from('photos')
      .insert({ storage_path: originalPath, caricature_storage_path: caricaturePath })
      .select()
      .single();
    if (error) throw error;

    return {
      ok: true,
      data: {
        id: String(data.id),
        storagePath: data.storage_path as string,
        caricatureStoragePath: data.caricature_storage_path as string | null,
        createdAt: data.created_at as string,
      },
    };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function listPhotos(): Promise<DbResult<StoredPhoto[]>> {
  if (!supabase) return skipped;
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return {
      ok: true,
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        storagePath: row.storage_path as string,
        caricatureStoragePath: row.caricature_storage_path as string | null,
        createdAt: row.created_at as string,
      })),
    };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Signed URL for downloading a stored photo, valid for an hour. */
export async function getPhotoUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

export { isSupabaseEnabled };
