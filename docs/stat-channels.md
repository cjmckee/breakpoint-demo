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

### Over U(25, 90) — the harness default. `±95%` on `full` is 0.18.

| stat | full | control | composite | band | threshold |
|---|---|---|---|---|---|
| anticipation | +2.79 | +0.06 | **+1.56** | **+1.12** | **+0.42** |
| return | +2.67 | +0.08 | *−1.17* | −0.16 | +0.06 |
| serve | +2.52 | +0.09 | *−1.75* | +0.06 | −0.09 |
| speed | +2.48 | −0.16 | **+1.01** | **+0.62** | **+0.44** |
| tactics | +2.22 | +0.04 | **+0.50** | **+0.90** | **+0.55** |
| focus | +1.98 | −0.03 | +0.43 | −0.11 | −0.03 |
| spin | +1.37 | +0.07 | **+1.13** | +0.39 | +0.03 |
| strength | +1.37 | −0.10 | **+0.90** | **+0.43** | −0.09 |
| placement | +1.35 | −0.10 | **+0.45** | +0.04 | −0.15 |
| forehand | +1.18 | −0.12 | *−0.20* | −0.18 | −0.14 |
| backhand | +1.17 | −0.00 | *−0.24* | −0.13 | −0.15 |
| stamina | +1.11 | −0.02 | +0.24 | −0.16 | −0.06 |
| net | +0.54 | +0.03 | **+0.44** | −0.12 | +0.15 |
| slice | +0.39 | +0.00 | *−0.15* | −0.06 | +0.08 |

*Italic* composite cells are the primary-role artifact from §2 — not ablations.

**Where the unaccounted value goes.** `focus` measures +1.98 with only +0.26 accounted across all
three channels; the rest is the pressure modifier and momentum mitigation. `stamina` measures +1.11
with nothing accounted — it is the fatigue system, entirely. `forehand`, `backhand`, `placement`
and `slice` are primary stats whose composite column is not an ablation, plus whatever
`ShotSelector` frequency is worth to them.

### Over U(25, 50) — the shipped ladder. `±95%` on `full` is 0.39.

| stat | full (25-50) | full (25-90) | composite | band | threshold |
|---|---|---|---|---|---|
| anticipation | +3.03 | +2.79 | **+1.66** | **+1.18** | −0.09 |
| return | +2.90 | +2.67 | *−1.84* | −0.12 | −0.06 |
| speed | +2.72 | +2.48 | **+1.02** | **+0.64** | **+1.01** |
| serve | +2.71 | +2.52 | *−2.25* | +0.02 | +0.45 |
| tactics | +2.12 | +2.22 | +0.09 | **+0.58** | **+0.55** |
| placement | +1.72 | +1.35 | **+0.54** | +0.20 | **+0.55** |
| forehand | +1.67 | +1.18 | *−0.28* | +0.18 | +0.24 |
| strength | +1.63 | +1.37 | **+1.00** | +0.30 | **+0.58** |
| focus | +1.61 | +1.98 | +0.30 | +0.25 | −0.08 |
| spin | +1.37 | +1.37 | **+0.95** | −0.30 | −0.11 |
| backhand | +1.32 | +1.17 | *−0.49* | −0.34 | −0.33 |
| stamina | +1.04 | +1.11 | +0.49 | −0.10 | +0.11 |
| net | +0.77 | +0.54 | **+0.47** | −0.08 | +0.12 |
| slice | +0.14 | +0.39 | −0.06 | −0.07 | −0.04 |

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
`stat-consolidation-plan.md` is not an artifact of measuring at 60.

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
- **`OPPONENT_STAT_ADJUSTMENTS.return` and `.netCoverage`** measure as noise in both populations at
  0.12 and 0.20. Either they want to be bigger or they want to not exist.
- **The first serve at tier 1.** Ten points of in-rate across the whole implemented game, against
  twenty-eight for the second serve, and a non-monotonic early ladder.
- **Sample-size defaults.** `tier1Probe` part C defaults to N=40 and `statInContext` to N=120; both
  are an order of magnitude under what their designs need. Raising the defaults would stop them
  reporting noise as findings.
