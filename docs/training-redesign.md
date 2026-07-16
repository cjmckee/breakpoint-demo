# Training System Redesign — Anchor + Minigame

Status: **design + serve POC**
Scope of this cut: **bronze tier only** (every stat grant is a flat **+1**). Higher tiers are
deferred until the base loop feels good.

---

## 1. Why we're changing it

The old system offered 4 of 10 fixed **bundles**, each granting +1 to a hardcoded set of ~4
stats. Those bundles did two jobs at once:

- **Anti-degeneracy** — you literally can't pump one stat because it's always packaged with
  three others.
- **(Accidentally) anti-agency** — forehand is welded to placement/spin/strength forever, so you
  can't build a *specific* kind of player.

The redesign splits those jobs apart. The player expresses their build by **choosing a core stat
to anchor on**, and a light **minigame** decides how many supporting stats ride along and which
ones. Nothing is permanently coupled.

## 2. The loop (bronze)

1. **Pick a core anchor** — one of the 5 core stats (`serve`, `forehand`, `backhand`, `return`,
   `slice`). This grants **+1 to that core** and selects the themed minigame. *This is the build
   choice* — a serve-&-volley player picks Serve; a grinder picks Backhand/Return.
2. **Play the themed minigame** — **three pass/fail attempts**. Each attempt has a success window
   that **moves**, so you can't muscle-memory one spot. **You bank one support per success (0–3)** —
   all three reps always play out; a miss just doesn't score.
3. **Draw `successes` supports** from that core's **themed support pool** (see §4), avoiding stats
   you were just handed last session so it stays fresh. Each support is **+1**.
4. **Quick Sim** button auto-resolves to **1** support for grind days.

Net result: **+1 to +4 stat points** per session (1 guaranteed core + 0–3 supports), all flat +1s,
themed and directional but never a fixed bundle. Even a whiffed session (0 supports) still advances
the core you chose, so it's never wasted.

### Why the anchor carries the identity

We deliberately **do not model archetype** in the support draw. The support pool for each core is
themed to *that shot and the tendencies around it*, so choosing the core that matters to your game
naturally pulls in the stats that game uses. Archetype coherence is an emergent result of the
player's anchor choices, not something the system solves for them.

## 3. Scoring — three attempts, count the successes

The minigame is **three attempts**, each a binary pass/fail. You bank **one support per success**,
and they do **not** have to be consecutive — all three reps always play out, a miss just doesn't
score. So supports = number of passes (**0–3**). Quick Sim resolves to **1**.

There's no partial credit within an attempt. The **success window moves each attempt** (a different
meter position, or a different ball spawn for Return), so the player re-times/re-aims every rep
instead of grooving one motion.

The shared machinery is `useMinigameRounds` (runs the three rounds and totals the passes) plus a
per-minigame window generator (`movingBands`, or per-ball randomization for the catch game). Every
minigame reports its success count via `onComplete(successes: number)`; only the interaction skin
differs, so the round loop and the support draw are **one shared pipeline**. The core anchor's **+1
is granted separately and is always guaranteed** — this scoring governs only the 0–3 supports.

## 4. Per-core themed support pools

Each core draws its 1–3 supports from a pool of thematically related non-core stats — the shots and
attributes that orbit that stroke. Draw is a random themed subset (biased away from last session's
picks), never the whole pool.

| Core anchor | Minigame | Themed support pool |
| --- | --- | --- |
| **Serve** | Toss & Strike (power/placement meter) | strength, placement, overhead, volley, offensive, spin |
| **Forehand** | Rally rhythm | spin, strength, placement, offensive, speed, stamina |
| **Backhand** | Load & fire | spin, placement, defensive, anticipation, agility, recovery |
| **Return** | Read & catch | anticipation, speed, agility, defensive, focus, recovery |
| **Slice** | Touch / carve | dropShot, volley, shotVariety, focus, defensive, placement |

Two properties fall out of these pools, both intended:

- **Full coverage** — all 15 non-core stats appear in at least one pool, so nothing is a dead stat,
  but each is thematically gated behind the core(s) it belongs to (`shotVariety` lives only under
  Slice, which reads right).
- **Pool, not bundle** — Serve gives `strength + placement` today, `overhead + offensive`
  tomorrow. Coherent flavor, zero permanent coupling.

## 5. The five minigames

All run the three-attempt scoring in §3. Each mirrors what its shot *is*, and each has a moving
success window so timing has to be re-earned every rep:

- **Serve — Toss & Strike:** the toss oscillates on a vertical meter; strike while the ball is in
  the (moving) window.
- **Forehand — Rally rhythm:** the ball rallies across the baseline; swing while it's in the
  (moving) strike zone.
- **Backhand — Load & fire:** hold to load; release while the charge is in the (moving) green
  window. Overshoot = miss.
- **Return — Read & catch:** three returns drop from random spots in a box; click/tap each ball
  before it reaches the floor. Tests moving to the ball plus reaction, with the fall giving timing
  leeway.
- **Slice — Touch / carve:** the contact ring breathes; tap while it's sized between the two
  (moving) target rings.

All five are built and playable. Inputs are pointer/touch-first (see §8).

## 6. Diminishing returns (deferred)

At bronze everything is a flat +1, so there's nothing to shrink point-wise. When we need DR we add
it *adjacent* to the point, never to the point itself:

- **Rising energy cost** — the point stays +1, but a high stat costs more energy to train, so
  grinding one stat burns your day faster (opportunity-cost DR). This is the intended everyday
  lever.
- **Soft-cap eligibility** — a stat past a threshold drops out of the support pool and can only be
  raised by anchoring it. Late-game backstop.

Neither ships in the first cut; starting flat-cost while the anchor+minigame feel is tuned.

## 7. How it slots into the codebase

Following the core/state/component separation in CLAUDE.md:

- **Core logic (`src/game/AnchorTrainingSystem.ts`)** — pure, no React. Holds `CORE_ANCHORS`
  config (anchor → minigame id + support pool + labels), `resolveSupports()` (themed draw with
  recent-repeat avoidance, 0–3), and `buildAnchorTrainingResult()` producing a `TrainingResult`.
- **Round machinery (`src/components/training/`)** — `useMinigameRounds` (the shared three-attempt
  controller), `minigameWindows` (`movingBands`), and `MinigameShell`
  (frame, `RoundPips`, `SupportResult`, `MinigameActionButton`).
- **State (`gameStore`)** — reuses the existing `applyTrainingResult()` + `advanceTime()` actions.
  The redesign only changes *how a `TrainingResult` is produced*, not how it's applied, so stat
  application, mood/energy, history, challenges, and analytics all keep working unchanged.
- **Components** — `AnchorTraining.tsx` (anchor picker + minigame host) and the five minigames in
  `src/components/training/`. Wired into the existing `'training'` screen route.

`StatBoosts` stays the flat-map boost format the whole downstream pipeline already consumes, so the
result modal (`StatBoostList`) renders the gains with no changes.

## 8. Input & mobile

The minigames are **pointer/touch-first**. Timing-sensitive actions fire on **`pointerdown`** (the
moment of press) rather than click/tap-release, so reaction and timing are measured fairly on a
phone. The backhand hold uses **pointer capture** + `pointercancel` so an interrupted touch can't
leave the charge stuck. `touch-none`/`select-none` stop a press from scrolling or selecting. The
Space key stays as a desktop convenience layered on top.
