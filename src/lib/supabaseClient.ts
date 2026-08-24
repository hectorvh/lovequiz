import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The app is fully playable without Supabase. When the env vars are absent we
 * run in "local mode": every write is a no-op and the Zustand store's local
 * mirror (persisted to localStorage) is the only source of truth.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = supabase !== null;

export const PHOTO_BUCKET = 'photos';
