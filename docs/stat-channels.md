# Stat channels — how a stat reaches a shot, and what each path buys

**Status:** measurement, plus the change it argued for (applied)
**Scope:** whether the multiple paths from a stat to a shot outcome produce distinguishable
behaviour, and whether any of it measures at the ratings the game actually ships
**Harness:** [`src/test/analysis/statChannels.ts`](../src/test/analysis/statChannels.ts)

---

## Summary

1. **There were four channels; there are now three, and two more the list never mentioned.**
   `bonus` was not a separate mechanism — `(1 + statBonus(s, B)/100)` and `statModifier(s, B/100)`
   are the same function. It has been folded into the bands. Meanwhile shot *selection* (which
   shots get hit) and the out-of-quality systems (fatigue, pressure, momentum) each carry more stat
   value than the two small quality channels, and neither was in the list.
2. **The band channel is real, and real for four stats.** `anticipation` +1.12, `tactics` +0.90,
   `speed` +0.62, `strength` +0.43 point-win-% per +10. Everything else reads inside the control.
3. **The threshold channel is the only one that can express a stat acting on the opponent's shot,
   and it matters more at low ratings than high ones** — `speed` +0.44 across OVR 25-90 against
   **+1.01** across 25-50. Its adjustments are absolute point offsets against a bar that is a
   fraction of incoming quality, so they weigh more when incoming quality is 25 than when it is 80.
4. **Eleven of fourteen stats take all of their shot-quality value from the composite alone.**
5. **Measuring at 25-50 costs 4.7× the samples for the same confidence.** At N=8000 the interval is
   ±0.18 over U(25,90) and ±0.39 over U(25,50), because the regressor's spread shrinks with the
   band. This is the single most useful number for planning any future stat measurement.
6. **Nothing collapses at shipped ratings.** Every stat that measured over the wide range still
   measures over 25-50, in the same order, with one exception: `slice` falls to +0.14 ± 0.40, which
   is zero. It remains worth +1.86 to a build made for it.

---

## 1. The channels

In the order the engine applies them:

| # | channel | where | shape |
|---|---|---|---|
| 1 | **composite** | `PlayerProfile.getStatForShot` — `SHOT_COMPOSITE_WEIGHTS`, `SERVE_QUALITY_WEIGHTS`, `SERVE_ACCURACY_WEIGHTS`, `RETURN_COMPOSITE_WEIGHTS` | additive, weights sum to 1, keyed on shot family |
| 2 | **band** | `ShotCalculator.calculateModifiers` — `STAT_MODIFIER_BANDS`, `SERVE_MODIFIER_BANDS` | multiplicative, centered on `NEUTRAL_STAT`, gated on a shot classification *or a live context flag* |
| 3 | **threshold** | `ShotCalculator.calculateQualityRequirements` — `OPPONENT_STAT_ADJUSTMENTS`, `SHOOTER_STAT_ADJUSTMENTS` | moves the bar, not the shot |

And the two that were not on the list but carry more than 2 and 3 combined:

| # | channel | where | what it does |
|---|---|---|---|
| 4 | **selection** | `ShotSelector` | `forehand`/`backhand` set the wing ratio; `spin` sets the tactical-shot rate; `placement` sets the drop-shot rate. Changes *which shots happen*, not how well they go. |
| 5 | **state** | pressure, momentum, fatigue | `focus` and `stamina` reach a shot only here. Neither has any band or threshold entry. |

### The bonus channel, and why it is gone

There used to be a fourth quality channel: `STAT_BONUS_BANDS` and `SERVE_SPIN_BANDS`, spin and
placement expressed as percentage-point bonuses. It was the band channel in different units.

```
statModifier(s, band)  = 1 + ((s − 50)/50) × band × MODIFIER_SPREAD
statBonus(s, band)     =     ((s − 50)/50) × band × MODIFIER_SPREAD

finalAdjustment included (1 + spinBonus/100)
  = 1 + ((s − 50)/50) × band × MODIFIER_SPREAD / 100
  = statModifier(s, band/100)
```

Identical to the sixth decimal at every stat value, and both landed in the same product in
`calculateModifiers`. It also measured as nothing: deleting it entirely moved no stat's value by
more than +0.23 point-win-% against a control column that moved ±0.17 by re-running the identical
config. At uniform 90 — top of the scale, every gate as open as it gets — the spin bonus multiplied
quality by 1.030 and the placement bonus by 1.017.

So it was folded into `STAT_MODIFIER_BANDS` as `shape: 0.10` (spin, on spin shots) and
`precision: 0.075` (placement, on placement shots), with the serve entries moving into
`SERVE_MODIFIER_BANDS` as `spin: 0.03` / `0.05`. The two tables never co-occurred on a single shot —
no serve is in `spinShots` — so multiplying where the old code added is exactly equivalent, not
approximately. `ShotModifiers.spinBonus` / `.placementBonus` became `.spinModifier` /
`.placementModifier`, and `applyAbilityEffects` recovers the old percentage for `SIDE_SPIN` as
`(spinModifier − 1) × 100`.

Verified neutral two ways: PART M is unchanged within noise, and every stat's PART A value moved by
less than ±0.11 against a ±0.18 interval.

---

## 2. Method

`statChannels.ts`, three parts.

**PART S — static.** Arithmetic on the config tables, no simulation. What is +10 in a stat worth in
points of shot quality through each channel, and what has to be true for the channel to pay at all.
No sampling, so no noise; it bounds what PART A could ever detect.

**PART M — measured dynamic range.** Every band is centered on `NEUTRAL_STAT`, so a uniform-50
player multiplies by exactly 1.000 on every shot. Running uniform players at other ratings reads
the channel's whole range straight off the shots — whatever the product differs from 1.0 *is* the
band channel's entire contribution.

**PART A — ablation.** The randomized-population regression `statSensitivity` Part B uses:
independently random stats, random archetypes, random pairings, regress point-win margin on each
stat difference. Run once per configuration with one channel zeroed each time; `full − ablated` is
that channel's contribution. The build population is drawn from a seeded PRNG and reused verbatim
across configurations, so every column regresses on an identical design matrix.

A **control** column ablates nothing. It is the same shipped config measured twice, so it reports
what zero looks like — any channel column smaller than the control is a mechanism that could be
deleted unmeasurably. This is the column that makes the rest of the table readable, and it belongs
in any ablation harness added later.

`LO`/`HI` bound the stat draw. The default `U(25, 90)` matches `statSensitivity` Part B; `LO=25
HI=50` asks the same question about the shipped ladder.

### The build population, and the hole that was in it

The harness originally drew **both** sides from `profileForArchetype` — the five archetype presets.
Those are not legacy debt: they are how every authored opponent in the game is built
(`data/opponents.ts`, `teamMatches.ts`, `welcomeEvents.ts`, and the practice/tournament paths in
`gameStore`), and the shipped roster is exactly uniform across them, four opponents each. What was
wrong is that they were used for the *player* side too, and a player does not have an archetype
preset. A player picks a broad identity and spends one specialization point per level across six
phases, three paths each, up to tier III.

Measured with `populationProbe`, the symmetric preset draw reached:

| | preset draw (old) | real draw (now) |
|---|---|---|
| specialty paths reached | **13 of 18** | 18 of 18 |
| tier III specialties | **0.0%** | 5.4% |
| never sampled | `fs_sniper`, `fs_curveball`, `ss_pancake`, `ss_gambler`, `bh_bazooka` | — |

`fs_curveball` is the one that bites: it carries the game's only `SLICE_PREFERENCE_FOREHAND`, so a
preset-only population makes `slice` a backhand-only stat before any measurement begins. And no
tier-III effect in the game was ever exercised.

The player side is now drawn by `drawPlayerProfile`, which spends points the way `gameStore` does —
`POINTS=6 MAX_TIER=3` for a mid-game build, `POINTS=3 MAX_TIER=1` for the shipped ladder, where
`upgradePhase` blocks every upgrade below player tier 2. `POP=presets` restores the old draw.

**It changed almost nothing.** Every stat moved less than the ±0.18 interval except `stamina`
(−0.34). The ordering, the channel attributions and the `slice`/`net` results all survive. That is
worth stating plainly: the hole was real, and closing it confirmed the earlier conclusions rather
than overturning them.

One residual mismatch, left in deliberately: the harness leaves one opponent in six unspecialized,
and no shipped opponent is. It costs a little opponent identity and buys a rough baseline row.

```
npm run build:node
N=8000 PARTS=SMA node dist/src/test/analysis/statChannels.js            # wide
N=8000 PARTS=A LO=25 HI=50 node dist/src/test/analysis/statChannels.js  # shipped ladder
```

### Two limits worth stating

**The composite column only measures a stat in its SUPPORT role.** The ablation pushes support
weight onto whichever stat is primary, so primary stats go *up* and their column is not an ablation
of them at all — that is why `serve` reads −1.75 and `return` −1.17. There is no ablation that
isolates a primary stat, because removing it removes the shot.

**Two pieces of the threshold channel are unreachable.** `WINNER_FLOOR_RETRIEVAL_WEIGHT` (opponent
speed/tactics scaling the winner floor) and `MODIFIER_SPREAD` are primitive exports rather than
object properties, so the in-place zeroing cannot touch them. The threshold column understates
itself slightly.

---

## 3. PART S — what a channel pays when its gate is open

Points of shot quality per +10 stat, at rating 55. Abridged; run the harness for all rows.

| stat | channel | when active | gate |
|---|---|---|---|
| forehand / backhand / net / slice / placement | composite | **8.00** | primary slot, w=0.50–0.80 |
| serve | composite | **6.00** | 4 shot families @ w=0.35–0.60 |
| return | composite | **6.00** | 1 shot family @ w=0.60 |
| net | threshold | 2.00 | opponent's stat, only while at net |
| speed | band | 1.65 | net shot or rushed ball |
| tactics | band | 1.65 | any offensive or defensive shot |
| return / speed / tactics | threshold | 1.20 | opponent's stat |
| spin | band | 1.10 | spin shots (slice/drop/defensive slice) |
| anticipation | band | 1.10 | opponent at net / well positioned |
| strength | band | 1.10 | power shots |
| anticipation | threshold | 1.00 | own stat, every rally shot |
| placement / spin | band | 0.82 | placement shots / tactical shots |
| stamina | — | — | **no shot-quality channel at all** |

The composite is an order of magnitude ahead before gating is even considered, and then the gates
cut further: measured against the shot mix, `spinShots` is ~5.8% of an unspecialized player's rally
shots and `placementShots` ~9.2%.

---

## 4. PART M — the band channel's whole range

Uniform players, so the composite base rating equals the level exactly.

| level | support × | quality Δ | phys × | ment × | spin × | place × |
|---|---|---|---|---|---|---|
| 20 | 0.828 | −3.43 | 0.941 | 0.894 | 0.986 | 0.997 |
| 30 | 0.888 | −3.36 | 0.963 | 0.931 | 0.992 | 0.998 |
| 50 | 1.000 | +0.00 | 1.000 | 1.000 | 1.000 | 1.000 |
| 70 | 1.129 | +9.05 | 1.039 | 1.072 | 1.009 | 1.004 |
| 90 | 1.297 | +26.69 | 1.080 | 1.149 | 1.027 | 1.016 |

In aggregate the band channel is not small — ×0.83 to ×1.30 — and the mental factor (`tactics` +
`anticipation` + `spin` touch) carries most of it. But that is every support stat moving at once
from 25 to 90; per stat per +10 it is the ~1.0 point-win-% PART A measures.

Noted rather than acted on: the product is not symmetric about 50 (0.828 at L=20 against 1.297 at
L=90), because a product of centered linear factors is convex. This is the residue of the
double-count [`stat-system-audit.md` §3.1](./stat-system-audit.md) removed — far smaller than the
0.605 it started at, but it still costs a uniform-20 player 3.4 quality points for being uniformly
low.

---

## 5. PART A — measured contribution per channel

8000 randomized pairings per configuration, seed 7. Units: point-win-% per +10 stat.
`control` is the empirical noise floor.

### Over U(25, 90), real build population. `±95%` on `full` is 0.18.

| stat | full | control | composite | band | threshold |
|---|---|---|---|---|---|
| anticipation | +2.85 | +0.04 | **+1.48** | **+0.97** | **+0.34** |
| return | +2.75 | +0.01 | *−1.22* | −0.31 | −0.17 |
| serve | +2.50 | −0.01 | *−1.74* | −0.01 | +0.03 |
| speed | +2.45 | +0.01 | **+1.14** | **+0.57** | **+0.31** |
| tactics | +2.22 | −0.05 | **+0.58** | **+1.07** | **+0.47** |
| focus | +1.83 | +0.02 | **+0.50** | −0.06 | −0.07 |
| placement | +1.58 | +0.02 | **+0.51** | +0.11 | −0.09 |
| spin | +1.31 | −0.10 | **+0.89** | +0.25 | −0.09 |
| strength | +1.24 | −0.04 | **+0.99** | **+0.41** | −0.02 |
| forehand | +1.03 | −0.04 | *−0.24* | −0.13 | −0.14 |
| stamina | +1.02 | −0.01 | +0.19 | −0.07 | −0.06 |
| backhand | +0.96 | +0.00 | *−0.30* | −0.18 | −0.04 |
| net | +0.79 | +0.07 | **+0.55** | −0.03 | +0.05 |
| slice | +0.52 | −0.06 | *−0.17* | +0.09 | +0.02 |

### Over U(25, 50), tier-1 build constraints. `±95%` on `full` is 0.40.

`POINTS=3 MAX_TIER=1` — a club player, where `upgradePhase` caps every specialty at tier I.

| stat | full (25-50) | full (25-90) | composite | band | threshold |
|---|---|---|---|---|---|
| return | +3.19 | +2.75 | *−1.94* | +0.03 | +0.02 |
| serve | +3.16 | +2.50 | *−1.66* | +0.05 | +0.31 |
| speed | +2.99 | +2.45 | **+1.49** | **+0.70** | **+0.65** |
| anticipation | +2.87 | +2.85 | **+1.29** | **+0.73** | **+0.57** |
| tactics | +2.25 | +2.22 | +0.14 | **+0.51** | **+0.56** |
| spin | +1.65 | +1.31 | **+1.71** | +0.31 | **+0.44** |
| placement | +1.60 | +1.58 | **+0.56** | −0.22 | +0.11 |
| forehand | +1.43 | +1.03 | *−0.73* | −0.19 | −0.06 |
| focus | +1.39 | +1.83 | +0.13 | −0.60 | −0.33 |
| **net** | **+1.35** | +0.79 | **+0.74** | +0.25 | **+0.44** |
| strength | +1.22 | +1.24 | **+0.60** | **+0.47** | −0.35 |
| backhand | +1.15 | +0.96 | *−0.71* | −0.34 | −0.03 |
| stamina | +0.67 | +1.02 | −0.03 | +0.11 | +0.01 |
| slice | −0.24 | +0.52 | −0.95 | −0.76 | −0.87 |

**Measurement baseline.** Both tables were taken *after* `NET_APPROACH_BASE` rose from 0.12 to
0.20 (see §12). At the wide range that change moved nothing outside the ±0.18 interval. At tier-1
it moved `net` from +0.77 to **+1.35** — the largest single move in the table and the one predicted
by the mechanism, since more approaches means the `net` stat is paid more often exactly where the
shipped content sits. `net` is now mid-table at tier-1 rather than second-last, which strengthens
the core-slot case at the ratings that ship.

The tier-1 `slice` and `backhand` cells also moved by more than 0.7, but the tier-1 **control**
column swings that far on its own (slice reads −0.24 full against +0.53 control in the same run), so
those are not resolved at this sample size and should not be read as effects.

*Italic* composite cells are the primary-role artifact from §2 — not ablations.

**Where the unaccounted value goes.** `focus` measures +1.98 with only +0.26 accounted across all
three channels; the rest is the pressure modifier and momentum mitigation. `stamina` measures +1.11
with nothing accounted — it is the fatigue system, entirely. `forehand`, `backhand`, `placement`
and `slice` are primary stats whose composite column is not an ablation, plus whatever
`ShotSelector` frequency is worth to them.

### Over U(25, 50), tier-1 build constraints. `±95%` on `full` is 0.40.

`POINTS=3 MAX_TIER=1` — a club player, where `upgradePhase` caps every specialty at tier I.

| stat | full (25-50) | full (25-90) | composite | band | threshold |
|---|---|---|---|---|---|
| anticipation | +3.27 | +2.87 | **+1.71** | **+1.40** | **+0.72** |
| return | +2.96 | +2.61 | *−1.83* | −0.05 | +0.05 |
| serve | +2.81 | +2.50 | *−2.04* | −0.31 | −0.15 |
| speed | +2.72 | +2.55 | **+1.24** | +0.35 | **+1.13** |
| tactics | +2.32 | +2.34 | +0.30 | **+0.80** | **+0.80** |
| backhand | +1.90 | +1.01 | *−0.09* | +0.25 | **+0.42** |
| placement | +1.77 | +1.51 | **+0.41** | +0.20 | −0.06 |
| strength | +1.60 | +1.21 | **+0.96** | **+0.55** | +0.10 |
| forehand | +1.48 | +1.09 | *−0.76* | +0.10 | **+0.39** |
| spin | +1.36 | +1.23 | **+1.24** | +0.08 | +0.30 |
| focus | +1.06 | +1.98 | −0.32 | −0.13 | −0.26 |
| stamina | +0.90 | +0.77 | **+0.38** | +0.20 | +0.19 |
| net | +0.77 | +0.68 | **+0.23** | −0.40 | +0.27 |
| slice | +0.48 | +0.50 | +0.18 | −0.21 | +0.14 |

The `control` column over this band reaches ±0.53, so treat anything under ~0.5 as unresolved.

**The ordering is stable.** Same top four, same bottom two, no stat changes character. The system
does not behave differently at the ratings that ship — it is measured worse there.

**The threshold channel grows at low ratings.** `speed` +0.44 → **+1.01**, `strength` −0.09 →
+0.58, `placement` −0.15 → +0.55. `OPPONENT_STAT_ADJUSTMENTS` are absolute point offsets applied to
a bar that is a fraction of incoming quality; when incoming quality is 25 instead of 80, ±1.2 points
of bar is a much larger share of it. Same absolute-constants-in-a-relative-system shape the audit
chased, working in this channel's favour rather than against it.

**`slice` is the one casualty.** +0.14 ± 0.40 over the shipped band — zero. It is not broken, it is
conditional; see §7.

---

## 6. Precision at 25-50, and what it costs

This is the practical answer to "can we measure stat usage where the game lives".

| population | ±95% on `full`, N=8000 | matches needed to reach ±0.18 |
|---|---|---|
| U(25, 90) | 0.18 | 8,000 |
| U(25, 50) | 0.39 | **~38,000** |

The regression's precision scales with the spread of the regressor. Narrowing the stat draw from a
65-point range to a 25-point range shrinks that spread by 0.385, so the standard error rises by
about 2.6× — observed 2.17×, the rest recovered from lower outcome variance. Matching wide-range
confidence therefore costs 4.7× the samples: roughly 38,000 pairings per configuration, about an
hour per column at current speed.

**The one-at-a-time designs are much worse off.** `tier1Probe` part C and `statInContext` bump one
stat and compare two cells, and their per-cell noise is what dominates. Two direct measurements of
that noise from this session:

- `statInContext` at N=150, tier-1 scale: `forehand` +1.91 against `backhand` +4.49. Those two
  should be near-identical, so the design is carrying about ±2.5 at that sample size — larger than
  most of the effects in the table.
- The same cells at N=1000: `forehand` +1.58, `backhand` +1.66. Agreement restored.

`tier1Probe` part C at N=60 reports `slice` 20→40 as +3.13 for a build that never slices and +0.00
for the specialist — the sign inversion the audit predicted, except both numbers are inside the
noise and the run says nothing at all. **Part C needs N≈1000 to mean anything, and it defaults
to 40.**

Practical guidance:

- For "what is this stat worth", use the randomized population (`statChannels` `full` column, or
  `statSensitivity` Part B) at N≥8000, and at `LO=25 HI=50` when the question is about shipped
  content.
- For "what is this stat worth to the build that uses it", use `statInContext` at N≥1000, not its
  default 120.
- For "is this mechanism worth having", use the ablation, and read the control column first.

---

## 7. Re-verification: serve, and net as a core stat

Both decisions were made before the fold. Both hold, and both were re-measured at 25-50.

### Serve

`serveCurve` post-fold reproduces the audit's post-fix table within a point at every level
(45.8 / 49.5 / 53.1 / 57.9 / 62.0 / 64.9 / 70.3 first-serve-in at L=20/30/40/50/60/70/90 against
the audit's 45.7 / 50.1 / 53.8 / 56.3 / 60.6 / 63.9 / 70.0). `tier1Probe` part A on the shipped
ladder likewise: 45.2 / 49.7 / 47.7 / 52.6 / 54.7 / 66.3 first-in and 30.9 / 27.9 / 27.1 / 19.0 /
16.0 / 4.3 double-fault, new player through uniform 70. The serve anchoring survived the fold
intact.

Two things the tier-1 view shows that the wide view does not.

**The second serve carries nearly all the serve's progression at tier 1.** Across OVR 25-50 the
first serve moves 47.5% → 57.9% in, ten points; the second moves 55.8% → 83.7%, twenty-eight. What
a tier-1 player feels when their serve improves is almost entirely the double fault going away, not
the first serve landing.

**The ladder is not monotonic in the 25-30 band.** Lin Chen (OVR 29) reads 44.3% first-serve-in,
*below* the OVR-20 starting player's 45.2%, and Danny Park (26) reads 49.7% against Big Steve's
(29) 47.7%. That is build shape rather than a bug — `SERVE_ACCURACY_WEIGHTS` is
serve/placement/focus/spin, and these are authored rosters, not uniform builds — but it means early
opponents do not present as a smoothly rising serve challenge.

### Net as a core stat

The consolidation gated the core slot on approach frequency, measured at uniform 60. Re-measured
down the range:

| build | metric | L=25 | L=35 | L=45 | L=60 |
|---|---|---|---|---|---|
| net_downhill T3 | net arrival (rallies past the return) | 32.1% | 35.0% | 40.4% | 45.2% |
| net_downhill T3 | **`net`-stat share of rally shots (v+oh%)** | **10.6%** | **10.9%** | **10.3%** | **9.5%** |
| no specialization | net arrival | 10.6% | 12.1% | 13.2% | 14.3% |

Arrival is lower at tier 1 — 32% against 45% — because the approach lands less often (61% in at
L=25 against 72% at L=60). But **usage share, which is what the core slot was argued on, is flat to
slightly better at low ratings**: 10.6% at L=25 against 9.5% at L=60. The 11% figure in
the consolidation was argued on is not an artifact of measuring at 60.

Value, `statInContext` at tier-1 scale (30 → 45, N=1000, ±~0.8):

| stat | build | Δ pt-win% |
|---|---|---|
| net | no specialization | +0.58 |
| net | net_downhill T3 | **+1.58** |
| forehand | no specialization | +1.58 |
| backhand | no specialization | +1.66 |
| slice | max slice build | +1.86 |
| slice | no specialization | +0.54 |

**To a net player at shipped ratings, `net` is worth exactly what `forehand` is worth to everybody.**
That is the bar a core slot has to clear, and it clears it. `slice` reaching +1.86 in the build made
for it, against +0.14 in a random tier-1 population, is the same story one tier down — correctly
placed as technical rather than core.

---

## 8. Open

- **Is the band channel underused?** Four stats out of fourteen touch the one mechanism that can
  read live match context. `slice`, `net` and `placement` are all conditional stats that measure
  weakly, and all three are conditional in exactly the way a context gate expresses well.
- **The convexity in §4.** A uniform-20 player still loses 3.4 quality points to a channel that is
  supposed to be neutral for a balanced build. `MODIFIER_SPREAD` is the dial; the alternative is
  summing the band deviations rather than multiplying them.
- ~~**`OPPONENT_STAT_ADJUSTMENTS.return` and `.netCoverage`** measure as noise in both populations.~~
  **Resolved — see §9.**
- **The first serve at tier 1.** Ten points of in-rate across the whole implemented game, against
  twenty-eight for the second serve, and a non-monotonic early ladder.
- **Sample-size defaults.** `tier1Probe` part C defaults to N=40 and `statInContext` to N=120; both
  are an order of magnitude under what their designs need. Raising the defaults would stop them
  reporting noise as findings.


---

## 9. The two inert threshold entries, resolved

Both were flagged in §5 for measuring inside the control in every population. They turned out to
have nothing in common.

### `OPPONENT_STAT_ADJUSTMENTS.return` — deleted

It measured as noise because it was never read. Nothing in `src/` referenced it; ace resistance is
computed in `ShotCalculator` from `SERVE_CONTEST.resistanceOvrBlend` blended against
`getReturnComposite()`, and has been for as long as the serve contest has existed. The constant sat
in the table with a comment claiming a job it did not do — "Return stat makes aces harder, serves
only" — which is exactly the kind of thing that survives a rebalance because it reads as intentional.

Deleted. No behaviour change is possible, by construction.

### `OPPONENT_STAT_ADJUSTMENTS.netCoverage` — kept, and demoted from a dial

This one is wired in, and the randomized population was simply the wrong denominator: it only
applies while the opponent is standing at the net, and most random builds never come forward, so it
spends nearly every point switched off.

Asked properly — [`netCoverageProbe.ts`](../src/test/analysis/netCoverageProbe.ts), a
`net_downhill T3` attacker against a uniform-45 baseliner, sweeping the constant while the
attacker's `net` rating is 25 or 75 — the answer is that it barely matters either.

| netCoverage | passer wins @ attacker net 25 | @ net 75 | spread |
|---|---|---|---|
| 0.00 (off) | 52.0% | 6.6% | **+45.5pp** |
| 0.05 | 51.6% | 6.9% | +44.7pp |
| 0.10 | 51.4% | 7.0% | +44.4pp |
| **0.20 (shipped)** | 53.5% | 6.9% | **+46.7pp** |
| 0.30 | 54.0% | 6.0% | +48.0pp |

500 BO3 per cell; the spread carries roughly ±2pp. Switching the mechanism off entirely costs about
2.5pp of a 46pp effect — one standard error. A wider sweep to 0.50 and 1.00 adds nothing.

Two structural reasons it cannot do more:

- **Downward it hits a clamp.** `calculateQualityRequirements` computes
  `Math.max(POSITION_ADJUSTMENTS.well_positioned, at_net + coverage)`, so the whole range available
  to a weak volleyer is +10 down to +3. At `net` 25 the coverage term is `(25 − 50) × mult`, which
  reaches −7 at mult 0.28 and is clamped from there on. Every value above ~0.28 is identical.
- **Upward there is nothing left to win.** A net-75 attacker already takes 93% of net points. Raising
  the passer's bar further changes no outcomes.

So it stays — the effect is real, the intent is right, and deleting it would lose a couple of points
of differentiation for no gain — but it is documented at the constant as *not a tuning dial*. The
thing that actually makes a bad volleyer easy to pass is the volley composite: 45.5pp of the 46.7
total, with this mechanism switched off.

**The general lesson for the remaining open questions.** A conditional mechanism measured against a
population that rarely triggers it will always read as noise, and that reading says nothing about
whether it works. `statChannels` answers "what is this worth on average"; a targeted probe with the
gate held open answers "does this work at all". The two `net` results in this document — the stat
clearing a core slot, the threshold entry not earning its dial — came from asking the second
question after the first one came back empty.


---

## 10. `slice`, resolved — and four levers that do not help

`slice` measures +0.50 over U(25,90) and +0.48 over the shipped band, last of the fourteen in both.
The obvious hypotheses are both wrong, and the third one is the answer.

**Not rarity.** `populationProbe` puts slice at 10.1% of rally shots and 4.8% of the shot-quality
budget — *more* exposure than `net`, which measures higher. It is paid.

**Not a broken curve either, though it looked like one.** `shotCurve` against a same-level opponent,
across the whole 20-85 range:

| shot | p(in) | p(win) |
|---|---|---|
| defensive slice | 69.4% → 99.6% | **0.9% → 4.0%** |
| slice | 67.9% → 99.3% | 1.9% → 9.2% |
| forehand | 67.5% → 95.1% | 4.5% → 19.9% |

73% of all slice usage is the defensive slice, and that shot gains as much *reliability* per stat
point as a forehand does. What it cannot do is convert any of it into ending points: three points of
winner probability across the entire scale, against the forehand's fifteen. Its
`MINIMUM_WINNER_THRESHOLDS` is 105 on a scale that clamps at 100, scaled down only by the opponent's
retrieval.

That reads like something to fix. `sliceProbe` sweeps the two constants that control it, 3000 BO3
per cell, control ±0.6:

| lever | CONTROL | no specialization | bh_samurai T3 | max slice build |
|---|---|---|---|---|
| **shipped** | −0.06 | +0.77 | **+3.17** | **+4.67** |
| requirement 0.25 → 0.40 | +0.40 | +1.06 | +3.27 | +4.48 |
| requirement 0.25 → 0.55 | −0.34 | +0.66 | +3.76 | +4.61 |
| winner floor 105 → 85 | −0.15 | +0.90 | +2.96 | **+3.72** |
| winner floor 105 → 70 | −0.38 | +0.66 | +3.64 | **+3.79** |

Neither requirement change moves anything past the control. Both floor changes make slice *worse*
for the build that cares most — lowering the floor lowers it for the opponent too, and turning the
scramble shot into an occasional point-ender adds variance that dilutes the skill difference rather
than expressing it. This is the same failure the audit found when it first set the floor: at 44.6%
winners the defensive slice was an expert's second-best point-ender, which is exactly backwards.

**The shipped column is the finding.** To a build that commits to it, `slice` is worth +3.17 at
`bh_samurai` T3 and **+4.67 at the full slice build** — against unconditional cores measured the
same way at +4.5 to +5.2 (`serve` +5.01, `return` +5.23, `forehand` +5.15, `backhand` +4.69). And
that is *more* than `net` pays its own specialist: +2.31 at `net_downhill` T3.

So `slice` behaves exactly as a conditional technical stat should — near-zero to the builds that
ignore it, core-grade to the build made for it. The +0.50 population figure is an average over a
population that mostly does not slice, and it is the number that is misleading, not the stat.

**No change made.** The levers are recorded here so the next person does not re-derive them.

---

## 11. Do the bands read context? Mostly — once the shot record could tell us

The band channel's justification, after `bonus` was folded into it, is that it is the only mechanism
gating on live match state rather than shot family. `bandGateProbe` checks that over 85k rally shots
of the real build population.

The first run could not answer it. Two gates read state `ShotDetail` did not carry — `reactions` on
`ballQuality.timeAvailable`, `reading` on the opponent's `CourtPosition` — and an early version of
the probe modelled `reading` as at-net-only and reported 1.9%, which was wrong by a factor of
thirty. Both fields are now recorded on every shot, so every gate is exact:

| stat.band | size | OPEN% | CONTEXT% | when open | weighted |
|---|---|---|---|---|---|
| tactics.tactics | 0.150 | 44.9% | 0.0% | 1.65 | 0.742 |
| **anticipation.reading** | 0.100 | **65.3%** | **100.0%** | 1.10 | 0.719 |
| speed.courtCoverage | 0.100 | 59.6% | 2.3% | 1.10 | 0.656 |
| **speed.reactions** | 0.150 | 17.5% | **79.7%** | 1.65 | 0.288 |
| strength.power | 0.100 | 15.0% | 0.0% | 1.10 | 0.165 |
| spin.touch | 0.075 | 18.8% | 0.0% | 0.82 | 0.155 |
| spin.shape | 0.100 | 10.9% | 0.0% | 1.10 | 0.120 |
| placement.precision | 0.075 | 13.3% | 0.0% | 0.82 | 0.110 |

Six of the eight read nothing but shot type and could be expressed as composite weight with no
behavioural loss. But the two that do read context are the 2nd and 4th most valuable bands, and
together they are about a third of the channel by weight. **The channel earns its distinct existence
— on `anticipation` and `speed`, and on nothing else.**

That is the answer to the question this document opened with. The variety is real, it is narrower
than the config's shape implies, and it is concentrated in two stats.

---

## 12. Net frequency — a floor doing unmeasured work

`shouldApproachNet` computed `max(0.02, 0.12 + (netBias/100) × NET_APPROACH_BIAS_SCALE)`. The scale
(3.0) was sized against what a *specialist* reaches, and the bias applies additively, so a bias of
−12 subtracted 0.36 from a 0.12 base — three times the whole base. Every net-averse build landed on
the 0.02 floor, and that floor was a token epsilon nobody had measured.

The symptom was not confined to the archetype built to avoid the net. A plain **backhand** specialist
who had merely picked `baseliner` as their broad identity came forward on 3.4% of rallies past the
return — identical to `net_apologist`, because the broad nudge alone cleared the base.

Base 0.12 → **0.20**, floor 0.02 → **0.05**, both now named constants in config. Measured on
`matchAnatomy`'s CAME FORWARD / rallies past the return, uniform 45 mirror matches:

| build | before | after |
|---|---|---|
| no specialization | 15.1% | **20.4%** |
| net_apologist T3 (net-averse) | 3.4% | **7.1%** |
| bh_samurai T3 (baseliner) | 3.4% | **11.2%** |
| net_attacker (broad) | — | 27.0% |
| net_downhill T3 | 33.0% | 34.0% |

The specialist is essentially unchanged; the bug was only ever at the negative end. Cost, same
builds: rallies reaching 6+ shots 16.4% → 15.3% of points, winners 14.5% → 13.7%, unforced errors
17.1% → 18.2%. Coming forward more often shortens points and adds risk, which is what it should do.

One figure to watch: approaches are now **12.2% of an unspecialized player's rally shots**, up from
8.0%. That is a per-shot denominator rather than the per-rally one the target was set against, and
it is on the high side if the intent was per-shot.
