# Couple Quiz Game — Specification Document

**Type:** Web app (mobile-first, also usable on desktop)
**Purpose:** An interactive trivia game built by Hector for Fernanda (Fer), where she answers three pre-written question groups about their relationship, can create a reciprocal quiz for Hector, and the session ends with a photo + caricature and a combined "punishments owed" summary.
**Languages:** Spanish, English, French, German (UI and trivia questions). Fernanda's self-authored quiz for Hector is stored and displayed only in the language she wrote it in.

---

## 1. Global elements (present across all screens unless noted)

- **Background music**: one MP3 track, starts on Screen 1, plays independently of screen transitions, persists until muted.
- **Mute button**: top-left, toggles music + sound effects. Persists across the whole session.
- **Language selector**: top-right, icon-based, switches all UI/system text and trivia question text between ES / EN / FR / DE at any time, without losing progress.
- **Photo collage background**: 3×4 grid (12 photos), floating/alternating zoom-in/zoom-out animation split into two groups: photos (1,3,5,7,9,11) and (2,4,6,8,10,12). Shown at 0% opacity for the 1.5s intro, then persists as a 50%-opacity background on subsequent screens.

---

## 2. Screen 1 — Intro

1. Music starts.
2. Photo collage plays intro animation for 1.5s at 0% opacity, then settles to 50% opacity as background.
3. Sequenced on-screen messages (auto-advancing):
   - "Hola Fernanda" — 2s
   - "Este es un juego que Hector preparó para ti!" — 2s
   - "y adivina de qué se trata" — 1.5s
   - "de PREGUNTAS!" — 1.5s
4. **Skip button** (bottom-right): jumps directly to Screen 2.
5. Auto-advances to Screen 2 after the last message.

---

## 3. Screen 2 — Instructions

Same background/collage, language selector, mute button.

Sequenced messages:
- "Tienes 5 segundos para responder cada pregunta" — 2s
- "por cada pregunta correcta ganarás un corazón" — 2s
- "por cada pregunta incorrecta te ganarás uno de los 4 posibles castigos:" — 2s
- "Los castigos son acumulables y al final tendrás que pagarlos todooooos!" — 2s

**Skip button** (bottom-right): jumps to Screen 3.

---

## 4. Screen 3 — Main Menu

Text: "Por favor selecciona un grupo de preguntas"

- Three circular buttons labeled 1, 2, 3 → each opens Screen 4 (Fernanda's Questions) for the corresponding group.
- **"Crea tu propio cuestionario para Hector" button**:
  - Disabled/opaque until all 3 question groups are completed by Fernanda.
  - While disabled, tapping shows a popup: "Finaliza todas las preguntas para poder hacer tu propio cuestionario."
  - Once enabled, opens Screen 8 (Quiz Creation for Hector). After Fernanda saves her quiz, this button's label changes to "Que Hector empiece el juego" and now opens Screen 9 (Hector's Questions).
- **"Respuestas" (Results) button**:
  - Disabled/opaque until at least one question group is completed.
  - While disabled, tapping shows a popup: "Finaliza todas las preguntas para poder ver tus resultados."
  - Once any group is finished, opens Screen 7 (Results), showing results for whichever groups are completed so far.
  - **Does not require Hector's reciprocal quiz to be completed.**
- **Settings (gear icon) button** (bottom corner):
  - Opens a PIN popup requesting a 4-digit code.
  - Correct PIN: **1996** (hardcoded client-side; treated as a soft lock, not real security — confirmed acceptable).
  - On correct entry, opens Screen 11 (Settings).
- **Photo button** (camera icon):
  - Only appears/enabled once **both** Fernanda's 3 groups **and** Hector's reciprocal quiz are completed.
  - Opens Screen 10 (Take Photo).

---

## 5. Screen 4 — Fernanda's Questions (Group 1, 2, or 3)

- Loads the selected group's question set (see Section 12 for content).
- **Punishment counters** (4 total, one per punishment type): displayed as icon+count boxes, always visible during play.
- **Heart counter**: displayed as a bar of hearts at the top, one heart added per correct answer.
- Both counters are **cumulative across all 3 groups** (not reset between groups).
- **Per-question flow**:
  1. Question + 4 answer options appear.
  2. A 5-second timer bar depletes right-to-left.
  3. If the user selects an answer before time runs out: timer stops, answer is evaluated immediately (correct/incorrect shown).
  4. **If the timer reaches 0 with no selection**: the question is automatically marked incorrect, and the next punishment in the round-robin is assigned (same as any wrong answer).
- **Punishment assignment logic**: strict round-robin across all 4 punishment types, in the order 1 → 2 → 3 → 4 → 1 → 2 → 3 → 4 ..., **accumulated across all 3 groups combined** (the sequence does not reset between groups).
- Punishment types (fixed icons/labels):
  1. "Beso 💋" (Beso Francés)
  2. "Baile 💃" (Baile sexy)
  3. "Masaje 🤲" (Masaje Hot)
  4. "Secreto 🔒" (Secreto Vergonzoso)
- **Group 3 only** includes one **bonus map question** at the end (see Section 5.1). It does not count toward the heart/punishment tally in any way — correct or incorrect, it has **no scoring effect and no penalty**.
- On completing all questions in the group (bonus question included, for Group 3), the app proceeds to Screen 6 (Partial Results for that group).
- Answers, with timestamps, are written to the database at the end of the group (see Section 13 — Persistence).

### 5.1 Bonus map question (Group 3 only)

- Prompt: "Selecciona en el mapa donde vive Héctor actualmente."
- Map: Leaflet (or equivalent), terrain layer, **no labels** (no country, city, street, or place names).
- Zoom level: wide enough to show the whole world initially; user can pan/zoom freely.
- User taps a point on the map, then confirms with an "Aceptar" button.
- App computes the distance in meters from the selected point to fixed coordinates **51.93828946997965, 7.591595632371097**, and displays the result.
- This question does not affect hearts or punishments and has no time limit stated (confirm if a 5s timer should still apply, or if it's untimed — not specified; recommend untimed since it's explicitly excluded from scoring).

---

## 6. Screen 5 — (reserved / merged into Screen 4 question flow)

*(No separate screen; per-question correct/incorrect feedback is shown inline within Screen 4 before advancing to the next question.)*

---

## 7. Screen 6 — Partial Results (end of a question group)

Shown immediately after finishing a group's questions (and, for Group 3, after the bonus question).

- Displays the group's total hearts (correct answers) and punishments earned, using heart icons (not numbers) and punishment icons with counts.
- Shows all 4 punishment types with their current icons/counts.
- Returns to Screen 3 (Main Menu) via a button.

---

## 8. Screen 7 — Results (full history, accessible from Main Menu)

- Lists each completed question group (e.g., "Resultados A", "Resultados B", "Resultados C").
- Selecting a group shows the list of questions in that group with the answer given and whether it was correct or incorrect — for Fernanda's answers, and also for Hector's answers once he has played his quiz.
- **Accessible as soon as at least one group is completed — does not require Hector's reciprocal quiz to exist.**
- "Regresar" (back) button returns to Screen 3.

---

## 9. Screen 8 — Quiz Creation (Fernanda creates 6 questions for Hector)

- Only reachable once all 3 of Fernanda's groups are completed.
- 6-question creation flow, one question at a time:
  - Text field for the question.
  - 4 small text fields for answers A/B/C/D.
  - A checkmark/radio button next to each answer to mark the single correct answer.
  - "Continuar" button: **disabled/blocked** until the question text and all 4 answers are filled in and exactly one correct answer is marked.
  - "Regresar" button (bottom-left): goes back to edit the previous question.
- After the 6th question, a "Guardar" button saves all 6 Q&A pairs to the database and returns to Screen 3, where the creation button becomes "Que Hector empiece el juego."
- **Language**: this content is stored and displayed exactly as Fernanda writes it — it is **not** translated into the other 3 languages, regardless of the currently selected UI language.

---

## 10. Screen 9 — Hector's Questions

- Same structure as Screen 4 (Fernanda's Questions): heart counter, 4 punishment counters, 5-second timer per question, round-robin punishment logic, immediate feedback + "Continuar" button per question.
- Punishment/heart counters for Hector are tracked separately from Fernanda's (confirm: separate tally, since he is "paying" his own punishments against Fernanda's questions of him — recommend explicit confirmation, as the original text does not fully clarify whether Hector's punishments are visually/logically separate from Fernanda's or unified).
- After all 6 questions, results are saved to the database and become viewable in Screen 7 (Results).
- Completing this screen is a **prerequisite for the Photo screen (Screen 10)** to unlock on the Main Menu.

---

## 11. Screen 10 — Take Photo

- Unlocked on the Main Menu once **both** Fernanda's 3 groups **and** Hector's 6-question quiz are complete.
- Opens the device camera; user can switch between front/back camera.
- Takes a photo; sends it to the Gemini API to generate a caricature/cartoon version.
  - Gemini API integration to be configured near the end of development.
  - **If the caricature generation fails or there's no connection**, the original photo is still kept/saved (no caricature is a non-blocking failure).
- Option to save the photo (and caricature, if generated) locally to the device.
- The original (and caricature, when available) is **always** saved to the database regardless of local-save choice.
- **One-time use**: once a photo has been taken, this screen cannot be used again until the game is reset from Settings (Screen 11).
- On completion, proceeds to Screen 12 (Thank You / Final Summary).

---

## 12. Screen 12 — Thank You / Final Summary *(new screen, added per confirmed requirement)*

- Shown immediately after the photo step completes.
- A closing "thank you for playing" message.
- Displays the **combined final totals** of punishments owed by **both** Fernanda and Hector (i.e., total hearts and total punishments per type, for each of them), so the couple has a clear final tally of what needs to be "paid."

---

## 13. Screen 11 — Settings

- Reached only via correct PIN entry (1996) from the Main Menu.
- **Options**:
  - **Delete answers (UI-level only)**: removes selected answers from what's displayed in the app UI. The underlying database records are **never deleted** — this is purely a UI-visibility action.
    - Note: per confirmed persistence behavior, this action also clears any answers currently held in browser-local state (see Section 14) for in-progress groups.
  - **Save photos to device**: browse photos stored in the database and download them locally.
  - **Reset game**: re-enables the Photo screen (Screen 10) for another photo session. (Exact scope of "reset" — e.g., whether it also resets question progress — should be confirmed; as described, resetting appears scoped specifically to allowing another photo to be taken.)

---

## 14. Data & Persistence

- **Database records**: every answer selection is logged with a timestamp, regardless of any later UI-level deletion.
- **Aggregates**: correct/incorrect counts and punishment counts per type are computed and stored at the end of each question group.
- **Photos**: original photo and (if generated) caricature are always stored in the database; local device save is optional and user-controlled.
- **Browser-side persistence**: in-progress answers within a question group persist in the browser (e.g., local/session storage) across page refresh or app close/reopen, so a player can resume where they left off.
- **Database commit timing**: answers are only written to the database at the **end of each question group** (not per-question), based on whatever is held in browser state at that point.
- **Clearing answers in Settings**: also wipes the browser-held UI state for in-progress/completed answers (the database copy is unaffected, per the UI-only deletion rule above).

---

## 15. Screen numbering summary (renumbered correlatively)

| # | Screen |
|---|--------|
| 1 | Intro |
| 2 | Instructions |
| 3 | Main Menu |
| 4 | Fernanda's Questions (Groups 1–3, incl. bonus map question in Group 3) |
| 6 | Partial Results (per group) |
| 7 | Results (full history) |
| 8 | Quiz Creation (Fernanda → Hector) |
| 9 | Hector's Questions |
| 10 | Take Photo |
| 11 | Settings (PIN-gated) |
| 12 | Thank You / Final Summary |

*(Screen 5 was folded into Screen 4's inline feedback and is not a separate screen.)*

---

## 16. Trivia content (Groups 1–3 + Hector's quiz answers)

Available in all 4 languages (ES/EN/FR/DE) for Fernanda's 3 pre-written groups. Content is personal/relationship trivia (dates, numbers, preferences about the couple) — full question/answer text to be maintained in a separate content/localization file rather than duplicated here, since translation will need human review for tone and accuracy given the personal nature of the content.

Punishment types (all 4 languages should localize label + emoji stays constant):
1. Beso 💋 (Beso Francés) — Kiss (French kiss)
2. Baile 💃 (Baile sexy) — Dance (sexy dance)
3. Masaje 🤲 (Masaje Hot) — Massage (hot massage)
4. Secreto 🔒 (Secreto Vergonzoso) — Secret (embarrassing secret)

---

## 17. Open items still worth confirming

These weren't blocking enough to hold up this draft, but are worth a quick confirmation before/while building:

1. Whether Hector's punishment/heart counters (Screen 9) are tracked as a fully separate tally from Fernanda's, or share the same visual counters.
2. Whether the bonus map question (Group 3) has a time limit or is untimed (recommended: untimed, since it's excluded from scoring).
3. Exact scope of the "Reset game" action in Settings — whether it resets only the photo-availability flag, or also question progress/results.
4. Order requirement for Fernanda's 3 groups — free order, or must be sequential (1 → 2 → 3)?
5. Sound effect cues (correct/incorrect/timeout) beyond the background music — none specified yet.
