# Love Quiz

A mobile-first couple's trivia game: Fernanda plays three pre-written question
groups, writes a reciprocal quiz for Hector, then unlocks prizes (summary, 3D
models, gift hint, pizza). Built from `couple-quiz-game-spec.md`; the live app
has since grown past that doc.

Languages: Spanish, English, French, German. The name is always **Hector**.

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

PIN on Start and Settings: **1996** (client-side soft lock).

## How it plays

Start → PIN → intro → **menu**.

- **A / B / C**: Fernanda's groups. Each run draws **5 of 8** questions (3
  options, A/B/C). Timer default **20s**, max **30s** (Settings).
- After each Fernanda group, an untimed **reto**: A map guess, B gift text, C
  camera photo.
- **?**: create a 3-question quiz for Hector; after save, that tile starts his
  play.
- After **all four** groups (A, B, C, Hector): a congratulations popup, then
  **menu 2** (trophy on the first menu also opens it). Prizes unlock in order:
  1. Summary (hearts vs punishments)
  2. 3D models (Fer / Hector, dress and casual)
  3. Gift hint (Münster padlock)
  4. Pizza hint

## Trivia content

`src/data/questions.ts` holds the 24 questions (8 per group, in all four
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
   tables (`answers`, `group_summaries`, `reciprocal_quiz_questions`,
   `bonus_gift_answers`, `photos`, `game_state`), grants for the anon key, RLS
   policies, and the public `photos` storage bucket.
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

Photo capture is the **group C reto**, not a menu button. Cartoon generation is
**off** (`ENABLE_PHOTO_CARICATURE` in `src/config.ts`); the original JPEG is
saved (Supabase Storage when connected, otherwise localStorage).

To turn cartoons back on, set that flag to `true` and deploy the Edge Function:

1. Secret `GEMINI_API_KEY` in **Edge Functions → Secrets**.
   Optional: `GEMINI_IMAGE_MODEL` (defaults to `gemini-2.5-flash-image`).
2. Deploy once from the repo root (JWT off — this app has no login):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy caricature --no-verify-jwt
```

The project ref is the subdomain of `https://<ref>.supabase.co`. If Gemini is
down or not deployed, the original photo is still saved.

## Audio

A looping playlist of five tracks starts after the start screen. The speaker
button: single click pauses or resumes; double-click while playing skips to the
next track.

## Layout

```
src/
  screens/     one file per screen; QuestionPlay is shared by Fernanda's
               groups and Hector's quiz
  components/  layout shell, counters, timer, collage, modals
  state/       gameStore.ts (Zustand + persist), persistence.ts
  lib/         supabaseClient, db, distance, caricatureApi, audio, sfx
  i18n/        es / en / fr / de
  data/        questions.ts, models.ts, collagePool.ts
public/
  audio/       five MP3s (playlist in src/lib/audio.ts)
  images/      collage pool (pool-01–24.jpg)
  3d_models/   Draco GLBs (Fer / Hector, dress and casual)
  draco/       Three.js Draco decoder
```
