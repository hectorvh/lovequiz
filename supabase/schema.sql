-- ============================================================================
--  Couple Quiz Game — Supabase schema
--  Run this once in the Supabase SQL editor, then create a PUBLIC storage
--  bucket named "photos".
--
--  There is no authentication in this app (single shared device, by design),
--  so the policies below deliberately allow anonymous access. Keep the project
--  URL and anon key private — that is the only thing protecting this data.
-- ============================================================================

create table if not exists answers (
  id                  bigint generated always as identity primary key,
  player              text not null check (player in ('fernanda', 'hector')),
  group_id            text not null,
  question_id         text not null,
  -- 0-based index of the chosen option; null means the 5s timer expired.
  selected_option     smallint,
  is_correct          boolean not null,
  punishment_assigned text check (punishment_assigned in ('beso', 'baile', 'masaje', 'secreto')),
  answered_at         timestamptz not null default now()
);

create index if not exists answers_player_group_idx on answers (player, group_id);

create table if not exists group_summaries (
  id                    bigint generated always as identity primary key,
  player                text not null check (player in ('fernanda', 'hector')),
  group_id              text not null,
  hearts_earned         integer not null default 0,
  punishments_by_type   jsonb not null default '{}'::jsonb,
  -- Only set for group 3: distance in metres from the bonus map guess.
  bonus_distance_meters double precision,
  completed_at          timestamptz not null default now()
);

create table if not exists reciprocal_quiz_questions (
  id             bigint generated always as identity primary key,
  -- Stored verbatim in whichever language Fernanda wrote it. Never translated.
  question_text  text not null,
  options        jsonb not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  created_at     timestamptz not null default now()
);

create table if not exists photos (
  id                      bigint generated always as identity primary key,
  storage_path            text not null,
  caricature_storage_path text,
  created_at              timestamptz not null default now()
);

-- Key/value flags: all_groups_complete, hector_quiz_complete,
-- reciprocal_quiz_saved, photo_taken.
create table if not exists game_state (
  key        text primary key,
  value      boolean not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Policies: open access for the anon key, no login flow.
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
--  Storage: create the bucket, then allow anonymous read/write on it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists anon_photos_all on storage.objects;
create policy anon_photos_all on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'photos')
  with check (bucket_id = 'photos');
