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

## Connecting Supabase

1. Create a project, then run `supabase/schema.sql` in the SQL editor. It creates
   the five tables, opens up RLS for the anon key, and creates the `photos`
   storage bucket.
2. Copy `.env.example` to `.env.local` and fill in the URL and anon key.

There is no authentication, by design — the app assumes one shared device. The
policies therefore allow anonymous read/write, so the project URL and anon key
are the only things protecting the data. Keep them out of public repos.

Writes happen at group boundaries, never per question: in-progress answers live
in `localStorage` (so a mid-group refresh resumes exactly where she left off) and
flush to `answers` + `group_summaries` when a group completes. Every remote write
is best-effort — a failure logs a warning and the game continues on the local
mirror.

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
  audio/background.mp3
  images/collage/01–12.jpg
```

## Decisions and assumptions

Answered before building:

- **Hector's tallies are separate** from Fernanda's, each with its own
  round-robin punishment pointer. The final summary shows two columns.
- **The bonus map question is untimed** and unscored.
- **Groups can be played in any order**; all three buttons are always enabled.
- **Settings has two reset buttons**: one for the photo gate only, one for all
  progress.
- **Sound effects are wired but silent.** Drop `correct.mp3`, `incorrect.mp3` and
  `timeout.mp3` into `public/audio/sfx/` and they start playing with no code
  change (`src/lib/sfx.ts`).
- **Caricature generation is a stub** (`src/lib/caricatureApi.ts`) that posterises
  the photo on a canvas so the flow is demoable. Swap the body for a Gemini call;
  the signature already assumes it can reject, and callers treat failure as
  non-blocking.

Assumptions made where the spec was silent or self-contradictory — all worth a
second look:

- **Group theme names were removed.** The three groups are all mixed trivia about
  Hector and the couple with no per-group theme, so the invented subtitles
  ("Cómo empezamos" and friends) would have misdescribed the content. The play
  header and menu now just say "Grupo 1/2/3".
- **Collage opacity during the intro.** The spec document says 0% opacity for the
  first 1.5s, which would make it invisible; the build brief says full opacity.
  Implemented as full opacity for 1.5s, then 50% for the rest of the session.
- **Replaying a finished group** rolls back that group's hearts and punishments
  before restarting, so cumulative totals can't be inflated by a retry. The
  round-robin pointer intentionally does *not* rewind, since it's a sequence
  rather than a set.
- **"Eliminar respuestas"** clears the stored answer detail and any in-progress
  group, but leaves completion flags and tallies intact, so menu gating and the
  final summary keep working. Supabase rows are never touched.
- **Hector's quiz ends at `/partial-results/hector`**, matching Fernanda's groups.
- **The photo is committed immediately on capture** (upload + `photoTaken = true`)
  to honour "one-time use", so there's no retake. Settings re-opens the screen.
- **The bonus map distance is stored on the group summary**
  (`bonus_distance_meters`), not as a row in `answers`, to keep it out of the
  correct/incorrect history it has no place in.
- **Results reads the local mirror** rather than querying Supabase. On one shared
  device the mirror and the database hold the same rows, and this keeps the
  screen working offline.
- **Music autoplay**: browsers block audio until the user interacts, so a blocked
  `play()` is retried once on the first tap. The track may therefore start a
  moment after the intro rather than exactly on load.
- **The map** uses Esri's World Shaded Relief basemap, which is terrain with no
  place labels, at zoom 1 (whole world) initially.

## Leftovers from the earlier prototype

`quiz.html` is the previous standalone version and is no longer used by anything.
`audio/` and `photos/` are the original source assets; the app serves the copies
under `public/`. All three can be deleted once you're happy with the build.
