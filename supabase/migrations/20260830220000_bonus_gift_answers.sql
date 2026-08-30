-- ============================================================================
--  Group B gift-reto answers
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL → New query)
--  on an existing project. Safe to re-run.
-- ============================================================================

create table if not exists bonus_gift_answers (
  id          bigint generated always as identity primary key,
  -- Same uuid as the group_summaries / answers rows for that playthrough.
  run_id      uuid not null default gen_random_uuid(),
  group_id    text not null default '2',
  answer_text text not null,
  created_at  timestamptz not null default now()
);

create index if not exists bonus_gift_answers_run_idx
  on bonus_gift_answers (run_id);
create index if not exists bonus_gift_answers_created_idx
  on bonus_gift_answers (created_at desc);

grant select, insert, update, delete on bonus_gift_answers to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter table bonus_gift_answers enable row level security;

drop policy if exists anon_all_bonus_gift_answers on bonus_gift_answers;
create policy anon_all_bonus_gift_answers on bonus_gift_answers
  for all to anon, authenticated using (true) with check (true);
