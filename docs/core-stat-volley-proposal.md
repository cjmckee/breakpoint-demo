# Proposal: swap `slice` for `volley` as the fifth core stat

**Status:** proposal, not implemented
**Scope:** `CoreStats` / `TechnicalStats` membership, training anchors, rating weights, sim shot mapping

---

## Summary

The structural argument for this swap is strong: the archetype tree has a `net`
phase with three specialties and no core stat behind it, while `slice` is a core
stat with no phase, applied to shots that are themselves forehand and backhand
variants.

The measured argument runs the other way: in simulation, slice decides ~2.7% of a
player's rally shots and volley ~1.0%. Promoting volley triples its weight in
`overallRating` while it remains the least-used of the candidate stats.

**Recommendation: do the swap, but only together with raising net-play frequency.**
On its own it makes the "cores are the most impactful stats" invariant *worse*, not
better. The two changes are separable in code but not in design.

---

## 1. The structural case

`GamePhase` (`src/types/archetype.ts:15`) defines six decision contexts:

```
first_serve · second_serve · return · forehand · backhand · net
```

`CoreStats` (`src/types/index.ts:24`) defines five stats:

```
serve · forehand · backhand · return · slice
```

Collapse the two serve phases into one and the lists align exactly — except at the
last slot, where phases say `net` and cores say `slice`. Every phase has a core
stat behind it but `net`; every core stat has a phase but `slice`.

That gap is visible in the tree today: `net_downhill`, `net_opportunist`, and
`net_apologist` are fully specced net specialties whose underlying stat sits in
the technical bucket at a third of the weight, while a player can pour training
into `slice` and find no phase that expresses it.

Second point, which is the stronger one: **slice is a modifier on the wings, not a
shot of its own.** The four shot types it drives are `slice_forehand`,
`slice_backhand`, `defensive_slice_forehand`, `defensive_slice_backhand` — all
forehands and backhands. Volley's six (`volley_*`, `volley_*_power`,
`half_volley_*`) are a genuinely distinct phase of the point, played from a
different court position, selected by a different branch of `ShotSelector`
("SPECIAL CASE: Shooter at net — must volley", `ShotSelector.ts:72`).

---

## 2. What the simulation actually does today

Measured over 30 best-of-3 matches between uniform-60 players on hard court,
counting only the player's own rally shots (n = 3,422):

| Shot family | Deciding stat | Share of rally shots |
|---|---|---|
| groundstrokes (incl. approach, power) | `core.forehand` / `core.backhand` | 86.56% |
| angle / lob / passing | `technical.placement` | 9.09% |
| **slice** | **`core.slice`** | **2.69%** |
| **volley** | **`technical.volley`** | **0.96%** |
| overhead | `technical.overhead` | 0.50% |
| drop shot | `technical.dropShot` | 0.20% |

Quality for each is a composite (`config/shotThresholds.ts:226-229`):

```
slice:  { primary: 0.75, spin: 0.15, placement: 0.10 }
volley: { primary: 0.70, agility: 0.20, anticipation: 0.10 }
```

### Net play does not respond much to specialization

A tier-3 `net_downhill` specialist with `broad: net_attacker`, against a uniform
opponent, compared to the default profile:

| | approach shots | volley | overhead |
|---|---|---|---|
| default profile | 9.47% | 1.02% | 0.74% |
| net specialist | 13.47% | 1.36% | 1.04% |

The archetype clearly works — approaches rise 42% — but the conversion into actual
volleys is small. **Approach shots are groundstrokes**, scored on
`core.forehand`/`core.backhand`, so most of what a net specialist gains today is
already priced into the wings. Volley itself stays near 1%.

This is the crux. Volley is rare partly *because* it is unsupported: it has no
training anchor, no core weight, and no reason to build, so nobody gets to net,
so it stays rare. The swap breaks that loop only if the frequency lever moves too.

---

## 3. Prerequisite: `statUsed` is wrong for every non-groundstroke

`ShotCalculator.getPrimaryStatName()` (`src/core/ShotCalculator.ts:870`) tests the
wings before the shot families:

```ts
if (shotType.includes('forehand')) return 'forehand';   // 'volley_forehand' matches here
if (shotType.includes('backhand')) return 'backhand';   // 'slice_backhand' matches here
if (shotType.includes('volley'))   return 'volley';     // unreachable
if (shotType.includes('slice'))    return 'slice';      // unreachable
if (shotType.includes('drop'))     return 'dropShot';   // unreachable
```

Every `volley_*`, `slice_*`, `drop_shot_*`, and `half_volley_*` shot reports
`statUsed` as forehand or backhand. Confirmed empirically: across 6,195 rally
shots the tally returned zero slice and zero volley despite 180 slice and 77
volley shots being hit. Only `overhead`, `serve`, and `return` — the shot types
with no wing suffix — report correctly.

`MatchOrchestrator.ts:534` has a second, coarser copy of the same mapping that
only distinguishes serve/forehand/backhand and defaults everything else to
`'forehand'`.

This is display-only — shot *quality* comes from
`PlayerProfile.getRallyCompositeSpec()`, which maps correctly — so no balance is
affected. But it means the match feed has never once told a player that their
slice or volley did anything, which is part of why slice-as-core reads as
invisible. **Fix this first, regardless of whether the swap happens.** Promoting
volley to core while the UI still labels every volley "Backhand" would waste the
change.

---

## 4. What the swap would touch

### Type and rating layer

| File | Change |
|---|---|
| `src/types/index.ts:24` | move `slice` → `TechnicalStats`, `volley` → `CoreStats` |
| `src/core/PlayerProfile.ts:64` | none — averages `Object.values(stats.core)`, rename-safe |
| `src/utils/playerStats.ts:11` | **hardcodes** `stats.core.slice` and `stats.technical.volley`; must swap |

Note the two `calculateOverallRating` implementations are duplicates of each
other. Worth consolidating while touching both.

### Simulation layer

| File | Change |
|---|---|
| `src/core/PlayerProfile.ts:323-332` | 4 slice entries → `stats.technical.slice`; 6 volley entries → `stats.core.volley` |
| `src/core/PlayerProfile.ts:437` | grass `preferredSurface` check reads `technical.volley` → `core.volley` |
| `src/core/PlayerProfile.ts:207,210,550,553` | default and random stat generation |
| `src/config/shotThresholds.ts:226-229` | none — composite weights are keyed by family name, not bucket |

### Training layer

| File | Change |
|---|---|
| `src/game/AnchorTrainingSystem.ts` | `CORE_ANCHORS.slice` → `.volley`; `CORE_ANCHOR_ORDER`; support pools (below) |
| `src/components/training/TouchSliceMinigame.tsx` | slice-themed; a volley anchor needs a net/reflex minigame or a reskin |
| `MinigameId` | `'touch_slice'` → e.g. `'net_reflex'` |

### Everything else

`src/game/PlayerManager.ts:277` (`serveVolley` composite), `src/game/ShopSystem.ts:17-18`
(`CORE_STATS`/`TECHNICAL_STATS`), `src/data/opponents.ts:522`,
`src/components/MainMenu.tsx:173` (`SLC` → `VOL`),
`src/components/PlayerStatsDisplay.tsx:60`, `src/test/analysis/playerFactory.ts`.

No change needed in `src/config/statIcons.ts` — both stats already have canonical
icons (✂️ and 🖐️) and the map is keyed by stat name, not bucket. The training
pentagon picks up the new core automatically from `CORE_ANCHOR_ORDER`.

---

## 5. Rebalanced support pools

Pools currently hold every support stat exactly twice (15 stats, 5 pools of 6, 30
slots). The swap breaks that: `volley` leaves the support set and `slice` enters
it. A worked solution that restores the invariant and stays thematic:

| Anchor | Support pool |
|---|---|
| Serve | strength, spin, placement, overhead, focus, offensive |
| Forehand | strength, spin, offensive, speed, stamina, shotVariety |
| Backhand | placement, stamina, **slice**, dropShot, agility, anticipation |
| Return | focus, speed, agility, anticipation, defensive, recovery |
| **Volley** | overhead, shotVariety, **slice**, dropShot, defensive, recovery |

Every support stat appears exactly twice; every pool holds six. Slice lands on
backhand (the slice backhand is its most iconic home) and volley (the slice
approach that sets up the net point) — which also means slice remains trainable
through two routes after losing its own anchor.

---

## 6. Balance impact

Core stats carry `0.45 / 5 = 0.09` each in `overallRating`; technical carry
`0.15 / 5 = 0.03`. The swap triples volley's weight and cuts slice's to a third.

For a uniform player, `overallRating` is unchanged. For a specialized one:

| Player | Before | After | Δ overall |
|---|---|---|---|
| slice 80, volley 30 | 8.1 | 5.1 | **−3.0** |
| slice 30, volley 80 | 5.1 | 8.1 | **+3.0** |

So roughly ±3 rating points at the extremes — modest, but it lands on existing
saves, and `matchLevel` (the average of both players' `overallRating`) shifts with
it, which nudges every quality threshold in the match.

**The invariant problem.** `CoreStats` is documented as "the 5 most impactful stats
that drive match outcomes" (`src/types/index.ts:21`). By usage, the swap moves a
2.69%-of-shots stat out of the core and a 0.96% stat in. Slice at 0.09 weight is
already a weak fit for that claim; volley at 0.09 would be a worse one.

This is why the frequency lever isn't optional. Candidates, in rough order of
directness:

1. Raise the approach → net conversion in `ShotSelector` so approaches actually
   lead to volleys rather than another groundstroke exchange.
2. Strengthen the `net` phase's `EffectKey` payouts so tier-3 specialization moves
   volley share meaningfully above 1%.
3. Surface effects — grass already nudges `preferredSurface` toward serve-volley
   but does little to shot selection.

A reasonable target: a net specialist should hit volleys on ~5% of their rally
shots, which would make volley comparable to slice today *and* make the specialty
legible in the match feed.

---

## 7. Risks and open questions

- **Slice becomes an unusually strong technical stat.** At 2.69% it would be the
  most-used technical stat by a wide margin — more than placement's individual
  contribution, and 13x dropShot. That's not incoherent, but it makes the
  technical bucket lopsided in a way worth acknowledging.
- **Save migration.** `CLAUDE.md` says backwards compatibility isn't required, so
  persisted saves can simply move the two values between buckets — but the values
  themselves should carry over rather than reset, or players lose earned progress.
- **The volley minigame doesn't exist.** `TouchSliceMinigame` is built around
  touch and low-bounce feel. A net anchor wants reaction and reflex, which is a
  different game, not a reskin. This is the largest single piece of work in the
  proposal.
- **Is slice worth keeping as a trainable identity at all?** Once it's technical,
  it can only be earned as a support draw. For a counterpuncher build that's a
  real loss, and it may argue for keeping a slice-flavored specialty somewhere in
  the backhand phase.

---

## 8. Recommended sequencing

1. Fix `getPrimaryStatName` ordering and the `MatchOrchestrator` duplicate.
   Independent, small, and makes everything after it observable.
2. Raise net-play frequency and measure until a net specialist is meaningfully
   above 1% volley share.
3. Build the volley minigame.
4. Perform the swap — types, mapping, pools, UI — in one commit, since a
   half-swapped state has no coherent meaning.

Steps 1 and 2 are worth doing even if the swap is ultimately rejected.
