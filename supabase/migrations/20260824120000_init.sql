-- ============================================================================
--  Couple Quiz — PostgreSQL schema for Supabase
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--  Re-running is safe: tables, columns, indexes and policies use IF NOT EXISTS
--  / DROP POLICY IF EXISTS.
--
--  There is no login (one shared device). Policies allow the anon key to
--  read and write. Keep VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY private.
--
--  App env (.env.local):
--    VITE_SUPABASE_URL=https://<project-ref>.supabase.co
--    VITE_SUPABASE_ANON_KEY=<anon public key>
--  Leave both blank to stay in local mode (localStorage only).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------------

-- One row per answered question. Replays INSERT a new run; rows are never
-- updated or deleted from the app.
create table if not exists answers (
  id                  bigint generated always as identity primary key,
  -- Same uuid on every row of one completed playthrough (Fernanda group or Hector).
  run_id              uuid not null default gen_random_uuid(),
  player              text not null check (player in ('fernanda', 'hector')),
  group_id            text not null,
  -- Seed id (e.g. g1q3) or reciprocal question id. Fernanda groups store the
  -- 5 drawn questions, not all 8.
  question_id         text not null,
  -- 0-based option index; null means the timer expired with no selection.
  selected_option     smallint,
  is_correct          boolean not null,
  punishment_assigned text check (punishment_assigned in ('beso', 'baile', 'masaje', 'secreto')),
  answered_at         timestamptz not null default now()
);

alter table answers add column if not exists run_id uuid;
update answers set run_id = gen_random_uuid() where run_id is null;
alter table answers alter column run_id set default gen_random_uuid();
alter table answers alter column run_id set not null;

create index if not exists answers_player_group_idx on answers (player, group_id);
create index if not exists answers_question_idx on answers (group_id, question_id);
create index if not exists answers_run_idx on answers (run_id);

-- One row per completed group run. Replays insert another row (same group_id).
create table if not exists group_summaries (
  id                    bigint generated always as identity primary key,
  run_id                uuid not null default gen_random_uuid(),
  player                text not null check (player in ('fernanda', 'hector')),
  group_id              text not null,
  hearts_earned         integer not null default 0,
  punishments_by_type   jsonb not null default '{}'::jsonb,
  -- Play order for this run (5 of 8 for Fernanda groups; 3 for Hector).
  question_ids          jsonb not null default '[]'::jsonb,
  -- Only set for group 3: distance in metres from the bonus map guess.
  bonus_distance_meters double precision,
  completed_at          timestamptz not null default now()
);

alter table group_summaries add column if not exists run_id uuid;
alter table group_summaries add column if not exists question_ids jsonb;
update group_summaries set run_id = gen_random_uuid() where run_id is null;
update group_summaries set question_ids = '[]'::jsonb where question_ids is null;
alter table group_summaries alter column run_id set default gen_random_uuid();
alter table group_summaries alter column run_id set not null;
alter table group_summaries alter column question_ids set default '[]'::jsonb;
alter table group_summaries alter column question_ids set not null;

create unique index if not exists group_summaries_run_id_uidx on group_summaries (run_id);
create index if not exists group_summaries_player_group_idx
  on group_summaries (player, group_id, completed_at desc);

-- Fernanda's quiz for Hector. Each save is a new batch_id (3 questions).
-- Previous batches are kept; the app reads the newest batch_id.
create table if not exists reciprocal_quiz_questions (
  id             bigint generated always as identity primary key,
  question_text  text not null,
  options        jsonb not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  batch_id       uuid not null default gen_random_uuid(),
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now()
);

alter table reciprocal_quiz_questions add column if not exists batch_id uuid;
alter table reciprocal_quiz_questions add column if not exists sort_order smallint;
update reciprocal_quiz_questions
  set batch_id = gen_random_uuid()
  where batch_id is null;
update reciprocal_quiz_questions set sort_order = 0 where sort_order is null;
alter table reciprocal_quiz_questions alter column batch_id set default gen_random_uuid();
alter table reciprocal_quiz_questions alter column batch_id set not null;
alter table reciprocal_quiz_questions alter column sort_order set default 0;
alter table reciprocal_quiz_questions alter column sort_order set not null;

create index if not exists reciprocal_quiz_batch_idx
  on reciprocal_quiz_questions (created_at desc, batch_id, sort_order);

create table if not exists photos (
  id                      bigint generated always as identity primary key,
  storage_path            text not null,
  caricature_storage_path text,
  created_at              timestamptz not null default now()
);

-- Flags: all_groups_complete, hector_quiz_complete,
-- reciprocal_quiz_saved, photo_taken.
create table if not exists game_state (
  key        text primary key,
  value      boolean not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Privileges for the anon key (required when tables are created via SQL)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
--  Row Level Security: open for anon (shared device, no auth)
-- ---------------------------------------------------------------------------
alter table answers                   enable row level security;
alter table group_summaries           enable row level security;
alter table reciprocal_quiz_questions enable row level security;
alter table photos                    enable row level security;
alter table game_state                enable row level security;

drop policy if exists anon_all_answers on answers;
create policy anon_all_answers on answers
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_group_summaries on group_summaries;
create policy anon_all_group_summaries on group_summaries
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_reciprocal_quiz_questions on reciprocal_quiz_questions;
create policy anon_all_reciprocal_quiz_questions on reciprocal_quiz_questions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_photos on photos;
create policy anon_all_photos on photos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_game_state on game_state;
create policy anon_all_game_state on game_state
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
--  Storage bucket for camera originals + caricatures
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists anon_photos_all on storage.objects;
create policy anon_photos_all on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'photos')
  with check (bucket_id = 'photos');
