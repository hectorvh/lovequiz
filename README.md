# Love Quiz

A mobile-first couple's trivia game: Fernanda answers three pre-written question
groups, builds a reciprocal quiz for Hector, and the session closes with a photo
and a combined "punishments owed" tally.

Built from `couple-quiz-game-spec.md`.

## Running it

```bash
npm install
npm run dev
```

The game is fully playable with no backend. Without Supabase credentials it runs
in **local mode**: every answer, flag and photo persists to `localStorage`, no
network calls are made, and a small notice appears at the bottom of the screen.

```bash
npm run build      # typecheck + production build
npm run typecheck  # types only
```

## Trivia content

`src/data/questions.ts` holds the real 24 questions (8 per group, in all four
languages), transcribed from `fernanda-questions-multilingual.md`.

```bash
npm run verify-questions
```

That script re-parses the markdown and asserts that all four languages agree on
which option carries the ✅ and that the position matches the `correctIndex` in
the data file. Run it after any content edit. Group sizes are data-driven, so
adding or removing questions needs no code changes.

Two small edits were made while transcribing: a few Spanish accents were
corrected (`espero` → `esperó`, `entro` → `entró`, `Con que` → `Con qué`), and
the redundant `su ... de Hector` in the animated-movie question was tidied. The
facts, options and answers are untouched.

Still worth a look before the real run: the closing message in `summary.message`
in each `src/i18n/*.json`.

Clear the site data (or use **Reiniciar todo el progreso** in Settings) before
Fernanda plays, so test runs don't leave stale hearts and punishments behind.

## Connecting Supabase (PostgreSQL)

The game stays in **local mode** until both env vars are set. Writes still
happen only at group boundaries; `localStorage` remains the live source of
truth, and Postgres keeps a durable copy (including each replay as a new run).

1. Create a project at [supabase.com](https://supabase.com) (this provisions PostgreSQL).
2. Open **SQL Editor**, paste and run `supabase/schema.sql`. That creates the
   tables (`answers`, `group_summaries`, `reciprocal_quiz_questions`, `photos`,
   `game_state`), grants for the anon key, RLS policies, and the public
   `photos` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in **Project URL** and **anon
   public** key from **Project Settings → API**.
4. Restart `npm run dev` so Vite loads the new env.

There is no authentication, by design — the app assumes one shared device. The
policies therefore allow anonymous read/write, so the project URL and anon key
are the only things protecting the data. Keep them out of public repos.

Every remote write is best-effort — a failure logs a warning and the game
continues on the local mirror. Replays insert a new `run_id` rather than
overwriting previous rows.

## Layout

```
src/
  screens/     one file per screen; QuestionPlay is shared by Fernanda's
               groups and Hector's quiz
  components/  layout shell, counters, timer, collage, modals
  state/       gameStore.ts (Zustand + persist), persistence.ts
  lib/         supabaseClient, db, distance, caricatureApi, audio, sfx
  i18n/        es / en / fr / de
  data/        questions.ts
public/
  audio/accidentally-in-love.mp3, audio/viviendo-de-noche.mp3
  images/collage/01–12.jpg
```
