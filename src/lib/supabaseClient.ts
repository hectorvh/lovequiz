import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/**
 * The app is fully playable without Supabase. When the env vars are absent we
 * run in "local mode": every write is a no-op and the Zustand store's local
 * mirror (persisted to localStorage) is the only source of truth.
 */
export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;

export const isSupabaseEnabled = supabase !== null;

export const PHOTO_BUCKET = 'photos';
