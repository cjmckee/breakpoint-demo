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
2. **Play the themed minigame** (~3 seconds, mostly juice). Performance maps to a **count of 1–3**.
   You can never score zero supports.
3. **Draw `count` supports** from that core's **themed support pool** (see §4), avoiding stats you
   were just handed last session so it stays fresh. Each support is **+1**.
4. **Quick Sim** button auto-resolves the minigame to a count of **1** for grind days.

Net result: **+2 to +4 stat points** per session (1 core + 1–3 supports), all flat +1s, themed and
directional but never a fixed bundle.

### Why the anchor carries the identity

We deliberately **do not model archetype** in the support draw. The support pool for each core is
themed to *that shot and the tendencies around it*, so choosing the core that matters to your game
naturally pulls in the stats that game uses. Archetype coherence is an emergent result of the
player's anchor choices, not something the system solves for them.

## 3. Mostly-juice contract

Skill affects **count only**, never whether you get anything:

| Minigame performance | Support count |
| --- | --- |
| Flub / missed timing | **1** |
| Decent | **2** |
| Clean | **3** |
| Quick Sim (skip)     | **1** |

Every minigame, whatever its skin, implements the same result contract:

```ts
interface MinigameResult {
  score: number; // 0..1 performance, purely cosmetic beyond the band it lands in
  count: 1 | 2 | 3; // derived from score via scoreToCount()
}
```

So the count logic and the support draw are **one shared pipeline**; only the input skin differs
per core. Build one minigame fully, reskin the rest.

## 4. Per-core themed support pools

Each core draws its 1–3 supports from a pool of thematically related non-core stats — the shots and
attributes that orbit that stroke. Draw is a random themed subset (biased away from last session's
picks), never the whole pool.

| Core anchor | Minigame | Themed support pool |
| --- | --- | --- |
| **Serve** | Toss & Strike (power/placement meter) | strength, placement, overhead, volley, offensive, spin |
| **Forehand** | Rally rhythm | spin, strength, placement, offensive, speed, stamina |
| **Backhand** | Load & fire | spin, placement, defensive, anticipation, agility, recovery |
| **Return** | Read & react | anticipation, speed, agility, defensive, focus, recovery |
| **Slice** | Touch / carve | dropShot, volley, shotVariety, focus, defensive, placement |

Two properties fall out of these pools, both intended:

- **Full coverage** — all 15 non-core stats appear in at least one pool, so nothing is a dead stat,
  but each is thematically gated behind the core(s) it belongs to (`shotVariety` lives only under
  Slice, which reads right).
- **Pool, not bundle** — Serve gives `strength + placement` today, `overhead + offensive`
  tomorrow. Coherent flavor, zero permanent coupling.

## 5. The five minigames

All share the contract in §3. Each mirrors what its shot *is*:

- **Serve — Toss & Strike:** a rising power/placement meter; tap to strike near the sweet zone. One
  explosive committed strike.
- **Forehand — Rally rhythm:** tap in tempo to extend a rally; the longer you hold rhythm, the
  higher the count. The workhorse groundstroke.
- **Return — Read & react:** a serve incoming, react inside a short window. Returning is reflex.
- **Slice — Touch / carve:** steady a wobble and release with control. Finesse, not power.
- **Backhand — Load & fire:** time the contact point on a loading swing.

**Serve is the POC** in this cut; the other four exist in config and route to Quick Sim until their
minigames are built.

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
  config (anchor → minigame id + support pool + labels), `scoreToCount()`, `resolveSupports()`
  (themed draw with recent-repeat avoidance), and `buildTrainingResult()` producing a
  `TrainingResult`.
- **State (`gameStore`)** — reuses the existing `applyTrainingResult()` + `advanceTime()` actions.
  The redesign only changes *how a `TrainingResult` is produced*, not how it's applied, so stat
  application, mood/energy, history, challenges, and analytics all keep working unchanged.
- **Components (`src/components/AnchorTraining.tsx`, `src/components/training/ServeMinigame.tsx`)** —
  the anchor picker and the serve minigame. Wired into the existing `'training'` screen route.

`StatBoosts` stays the flat-map boost format the whole downstream pipeline already consumes, so the
result modal (`StatBoostList`) renders the gains with no changes.
