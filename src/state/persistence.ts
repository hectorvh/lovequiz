import type { Locale, StoredPhoto } from '../types';
import { LOCALES } from '../types';
import { commitGroup, type GroupCommit } from '../lib/db';

/** Zustand persist key. In-progress answers live here so a refresh mid-group is safe. */
export const STORE_KEY = 'fer-quiz-state-v1';

/** Local mirror of photos, used when Supabase storage isn't configured. */
const LOCAL_PHOTOS_KEY = 'fer-quiz-photos-v1';

/**
 * Read the saved locale straight from storage so i18next can initialise with
 * the right language before React mounts, avoiding a flash of Spanish.
 */
export function readPersistedLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { locale?: string } };
    const locale = parsed.state?.locale;
    return LOCALES.includes(locale as Locale) ? (locale as Locale) : null;
  } catch {
    return null;
  }
}

/**
 * Flush one finished group to Supabase. Failures are swallowed on purpose: the
 * local mirror already holds the answers, so a dead network must never block
 * the player from continuing.
 */
export async function flushGroupToDatabase(commit: GroupCommit): Promise<boolean> {
  const result = await commitGroup(commit);
  if (!result.ok && result.error && result.error !== 'local-mode') {
    console.warn(`[persistence] group ${commit.groupId} not saved remotely:`, result.error);
  }
  return result.ok;
}

export function readLocalPhotos(): StoredPhoto[] {
  try {
    const raw = localStorage.getItem(LOCAL_PHOTOS_KEY);
    return raw ? (JSON.parse(raw) as StoredPhoto[]) : [];
  } catch {
    return [];
  }
}

export function appendLocalPhoto(photo: StoredPhoto) {
  try {
    localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify([photo, ...readLocalPhotos()]));
  } catch (error) {
    console.warn('[persistence] could not cache photo locally:', error);
  }
}

export function clearLocalPhotos() {
  localStorage.removeItem(LOCAL_PHOTOS_KEY);
}
