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

## Cartoon photos (Gemini)

After a photo is taken, the app calls the `caricature` Edge Function, which
sends the JPEG to Gemini and returns a cartoon. If Gemini is down, times out,
or is not deployed, the **original photo is still saved** (Supabase Storage
when connected, otherwise localStorage) and a notice is shown.

1. Secret `GEMINI_API_KEY` is already set in **Edge Functions → Secrets**.
   Optional: `GEMINI_IMAGE_MODEL` (defaults to `gemini-2.5-flash-image`).
2. Deploy once from the repo root (JWT off — this app has no login):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy caricature --no-verify-jwt
```

The project ref is the subdomain of `https://<ref>.supabase.co`.

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
