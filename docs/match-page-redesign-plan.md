# Match Page Redesign — Implementation Plan

Redesign of the live match screen (`LiveMatchViewer` + `CourtVisualization` + `KeyMomentModal`).
Interactive target mockup: https://claude.ai/code/artifact/6050a532-6387-42e3-84a6-78ee0ceb9ed4

## Goals

- Make the **score clearer** and pull focus to score + stamina + momentum (the "cockpit").
- Surface fast-moving info the eye can't track on a 500ms/point scroll: **stat flashes**, **toasts**, an **animated court**.
- Make the **court** read as a tennis simulation instead of a static image.
- De-cramp **key moments**: compact resting cards + a hover modal for the reasoning.

## Agreed design decisions

- **Full cockpit reframe.** Hero scoreboard (big live point score, clear server indicator, set pips) + court as an animated centerpiece flanked by large **stamina tanks**; momentum as a center-out **tug-of-war** bar. Score + stamina + momentum are Tier 1.
- **Stats — both treatments.** One merged compare row per stat (you | stat | them, leader highlighted) that **flashes + shows the delta on change**, AND **notable-event toasts** (ace / winner / break / double fault). The match log is demoted to a quiet ticker.
- **Court animation** driven from existing per-point data; fall back to static polish if it's a large lift.
- **Key moment card.** Resting card = tactic + one-liner + effects + an **advantage chip** whose word (Disadvantage / Even / Advantage) and colour richness encode magnitude. On **hover**, a big modal opens split **left = the matchup** (plain-language good against / bad against + chip) and **right = the ratings** (yours and the opponent's, priority stat rendered large). The tiny header modifier chips become a **"how this moment tilts the point"** strip (per-factor + net effect), which stays visible above the hover modal.

## Data availability (confirmed — no new match math needed)

- Priority + supporting stats: `option.playerStatWeights.primary`/`.secondary` and `opponentStatWeights` (priority = `weights.primary`).
- Advantage chip: `KeyMomentResolver.getStatMatchup()` → `advantage|even|disadvantage`; `getWeightedScores()` gives the diff for colour-richness magnitude.
- Conditions strip: `getContextModifiers()` → per-factor momentum/energy/mood/pressure + `total` (net).
- "Good against" copy: `option.bestAgainstHint`.
- Gap → **author a `worstAgainstHint`** on `TacticalOption` for the "bad against" line (decided).

---

## Stage 0 — Shared plumbing

- `matchStore`: add structured `lastPointResult` (`SimplePointResult`) + `pointSeq`, set in `onPointComplete` (today only a narration string is kept). Feeds toasts (Stage 2) and court animation (Stage 4).
- Fix the **`matchHistory` never-populated bug** so the point/game/set SFX in `LiveMatchViewer` fire: populate `matchHistory` in `onScoreUpdate` from `lastPointResult`.
- Surface **stamina for both players** (from fatigue) and refresh momentum/energy on `MatchScore` right before `onScoreUpdate`, so the cockpit shows current values (removes a one-point display lag).
- Files: `stores/matchStore.ts`, `game/MatchOrchestrator.ts`, `types/keyMoments.ts`.

## Stage 1 — Cockpit (scoreboard + court + stamina/momentum)

- New `MatchCockpit`: hero scoreboard (big point score, server dot, set pips, games), momentum tug-of-war bar, large stamina tanks flanking the court.
- Restructure `LiveMatchViewer` so the cockpit is full-width Tier 1; log + stats sit below (reworked in Stage 2).
- Retire `CourtVisualization` (only `LiveMatchViewer` uses it).
- Files: `components/match/MatchCockpit.tsx` (new), `LiveMatchViewer.tsx`.
- Feedback refinements:
  - Momentum bar slightly **taller**.
  - **Set pips vary by match format** — best-of-1/3/5 → 1/2/3 pips (sets-to-win), not always 3.

## Stage 2 — Merged stats + flashes + toasts + log demotion

- Collapse the two stat cards into one compare table with leader highlight + flash/delta on change (reuse the `prevMatchStats` ref-diff pattern already in `LiveMatchViewer`'s audio effect).
- Toasts for ace / winner / break / double fault off `lastPointResult`.
- Demote `matchLog` to a compact ticker.
- Files: `LiveMatchViewer.tsx` (+ small `StatCompareRow` / `MatchToasts`).
- Feedback refinements:
  - **Flash colour reflects good/bad *for the player*, not a fixed colour**: +1 to a good stat (ace, winner, points won) or +1 to an opponent's bad stat (their double fault) flashes green; +1 to the player's double fault, or +1 to an opponent's winner/ace, flashes red.
  - The ticker keeps using the existing **flavour-text generator** (`narratePoint` / `matchLog`) — toasts are additive, they don't replace the narration.

## Stage 3 — Key moment card + tutorial + encyclopedia

- Rework `KeyMomentModal` decision phase: compact resting cards + hover modal (left matchup / right ratings, priority stat large) + the conditions strip.
- Feedback refinements to the advantage chip:
  - **Continuous colour scale, single fill style** (no pale-vs-solid variants): yellow = Even, interpolating to deeper green as the advantage grows (forest green for a large gap) and to deeper red for disadvantage (deep scarlet for a large gap). Drive the interpolation off the weighted-score diff.
  - In the hover modal, **move the advantage chip into the right (ratings) panel, between the You and Opponent rating blocks**, so it visually sits as the relationship between the two. The left panel is just good/bad against.
- Author `worstAgainstHint` for every tactic in `tacticalOptions.ts`.
- **Pressure-valence fix:** pressure is inverted vs momentum/energy/mood — reducing pressure (negative effect value) is good. `KeyMomentModal` colours effect chips with `value>0?green:red` in two spots (~L466 decision, ~L337 result), so `-3 Pressure` shows red (wrong). Add `isBeneficial(effect) = effect.type==='pressure' ? value<0 : value>0` and colour/icon by that. (The header conditions strip uses `getContextModifiers`, always ≤0 = genuine penalty, so red is correct there.)
- Tutorial (`data/tutorialSteps.ts`): the `options-matchup` step teaches the old `you X > Y them` — rewrite for the chip; decide how to teach the hover (likely auto-open the modal for one option during the tutorial). Update the live-match steps for the new cockpit/stats sections.
- Glossary (`data/glossary.ts`): rewrite "Stat Scores (you X · them Y)" and "Matchup Arrow (← ═ →)"; tweak "Momentum Bar" location wording. Check `Encyclopedia.tsx`.

## Stage 4 — Court animation (optional / fallback-ready)

- Animate ball + player tokens each point from `lastPointResult` (serve → a few exchanges → decisive shot on the winner's side, within the 500ms tick).
- Fallback if it balloons: static court with server highlight + point-outcome flash + momentum tint.
- Files: the court component from Stage 1.

---

Each stage is independently shippable and verifiable in the running app (via `/verify` or `/run`), with the mockup as the visual reference.
