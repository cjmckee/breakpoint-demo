# Stat system audit — what the 20 stats actually do

**Status:** findings, no code changes made
**Scope:** all 20 stats, shot-mix by playstyle, the rating→threshold coupling, consolidation candidates
**Companion to:** [`core-stat-volley-proposal.md`](./core-stat-volley-proposal.md) — this document supersedes that
proposal's section 2 measurements and materially changes its conclusion.

All figures below were produced on `4bb6218` (main at time of writing) using three
harnesses added alongside this doc:

| Harness | What it measures |
|---|---|
| `src/test/analysis/shotMixProbe.ts` | Which shots each playstyle actually hits; the approach→net funnel; lob outcomes |
| `src/test/analysis/statSensitivity.ts` | Marginal value of every stat, two independent ways |
| `src/test/analysis/breakEvenProbe.ts` | Tests the rating-tax hypothesis (section 4) |

```
npm run build:node
node dist/src/test/analysis/shotMixProbe.js
node dist/src/test/analysis/statSensitivity.js
node dist/src/test/analysis/breakEvenProbe.js
```

---

## Summary

1. **Seven of the twenty stats have no measurable effect on match outcomes** across 1400
   randomized builds: `slice`, `volley`, `recovery`, `overhead`, `dropShot`, `agility`,
   `shotVariety`.
2. **The `CoreStats` docstring is wrong.** "The 5 most impactful stats that drive match
   outcomes" — the actual top five are `serve`, `anticipation`, `return`, `speed`, `focus`.
   Two of those are cores. `forehand` ranks 13th; `slice` ranks 14th.
3. **There is a rating tax.** `matchLevel` is the mean of both players' `overallRating`, and
   every quality threshold scales off it — so raising a stat raises the bar on every shot you
   hit. A stat pays off only if its shot frequency clears a break-even point (~6% for a core
   stat, ~2.1% for a technical one). This is the root cause of finding 1.
4. **Slice is not a weak stat, it is a conditional one.** Dead in a build that doesn't slice
   (−1.06 point-win%), and the best non-serve investment available in one that does (+2.51).
   Volley is the genuinely flat stat — it barely moves whether or not you build for it.
5. **Consolidation is the fix, and it is mechanically motivated**, not just ergonomic: merging
   two 1%-frequency stats into one 2% stat more than doubles its value, because the rating tax
   is paid once instead of twice.

---

## 1. Method

Two things make these numbers trustworthy in ways the earlier proposal's were not.

**Raw `shotType`, not `statUsed`.** The proposal's figures were taken through
`ShotCalculator.getPrimaryStatName()`, which was mis-ordered until PR #81. `shotMixProbe`
tallies the shot type directly, so it is unaffected either way.

**Point win rate, not match win rate.** At ~120 points per BO3 match, point win rate is roughly
10× less noisy for the same runtime. A uniform-50 vs uniform-50 control lands at **+0.14**,
which is the noise floor for every Part A figure below.

`statSensitivity` runs two independent designs because each has a different blind spot:

- **Part A — one-at-a-time.** Take one stat 50→90, hold the other nineteen at 50, play an
  opponent with an identical archetype. Clean and controlled, but only measures the stat in one
  build context.
- **Part B — randomized population.** 1400 matches in which every player gets independently
  random stats *and* a randomly drawn archetype, then regress point-win margin on each stat
  difference. Because the stats are randomized independently, the univariate slope is an
  unbiased estimate of each stat's marginal value across the whole build space.

The two agree closely, which is the main reason to believe either.

---

## 2. Shot mix responds to playstyle — very asymmetrically

60 BO3 matches per build, uniform-60 player vs uniform-60 unspecialized opponent, hard court,
player's own rally shots only (serves excluded).

| shot family | no spec | broad `net_attacker`<br>(no phase pts) | `net_downhill` T3 | `net_downhill` T3<br>+ `fs_bomber` T2 | `net_apologist` T3 | `bh_samurai` T3 | `bh_samurai` T3<br>+ `fh_survivor` T3 |
|---|---|---|---|---|---|---|---|
| return | 44.19% | 44.78% | 46.19% | 46.28% | 45.55% | 44.23% | 43.60% |
| groundstroke | 30.03% | 30.68% | 24.82% | 24.39% | 31.53% | 21.55% | 21.16% |
| groundstroke (power) | 3.22% | 2.74% | 2.38% | 1.94% | 4.04% | 2.93% | 3.30% |
| approach (groundstroke) | 9.88% | 9.45% | 15.00% | 15.10% | 7.88% | 9.90% | 9.70% |
| **slice** | **0.34%** | 0.29% | 0.13% | 0.24% | 0.30% | **8.90%** | **9.65%** |
| defensive slice | 1.27% | 1.44% | 1.25% | 1.25% | 0.97% | 1.66% | 1.78% |
| **volley** | **1.28%** | 1.44% | **1.61%** | **2.08%** | 0.84% | 1.31% | 1.47% |
| half-volley | 0.02% | 0.02% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% |
| overhead | 0.84% | 0.72% | 1.25% | 1.27% | 0.80% | 0.88% | 0.67% |
| lob | 3.81% | 3.77% | 3.59% | 3.48% | 3.62% | 4.27% | 4.37% |
| passing | 4.67% | 4.06% | 3.43% | 3.57% | 3.92% | 3.72% | 3.57% |
| angle | 0.31% | 0.38% | 0.26% | 0.35% | 0.30% | 0.41% | 0.44% |
| drop shot | 0.15% | 0.24% | 0.08% | 0.04% | 0.25% | 0.25% | 0.28% |
| **net family** (v+hv+oh) | 2.14% | 2.17% | 2.86% | 3.35% | 1.64% | 2.18% | 2.14% |
| points reaching net | 1.80% | 1.72% | 2.39% | 2.67% | 1.45% | 1.89% | 1.66% |
| *n* (rally shots) | 6556 | 5840 | 6092 | 7065 | 6406 | 6283 | 6114 |

**Slice swings 26× with playstyle. Volley swings 1.6×.**

This is the single most important correction to the volley proposal. Its "slice 3.09% vs volley
1.13%" compares two *unspecialized* players and concludes slice is barely used. What that
actually measures is that a player who has not chosen to slice does not slice. Give someone the
slice identity and it becomes a 9% shot — the third-most-used family in their game, ahead of
lobs and passing shots.

Volley has no equivalent gear. Stacking every net effect in the game
(`net_approach_bias=16`, `serve_and_volley_bias=10`, `putaway_volley_bias=8`) reaches 2.08%.

### 2.1 Why volley frequency cannot be raised from where the proposal wants to raise it

The proposal's first suggested lever is to "raise the approach → net conversion in
`ShotSelector` so approaches actually lead to volleys." That conversion is already 1.0 — a
successful approach shot returns `'at_net'` unconditionally
([`PointSimulator.ts:717`](../src/core/PointSimulator.ts#L717)), and net players hold position;
only a lob of `>= good` quality ejects them
([`PointSimulator.ts:794`](../src/core/PointSimulator.ts#L794)).

The loss is downstream of arriving at the net, and it has two causes.

**Cause 1 — most approaches never get a second shot.** Of successful approaches by a
`net_downhill` T3 build:

| opponent's reply to the approach | share | |
|---|---|---|
| passing shot **missed** | 38.46% | point over, no volley |
| lob | 24.62% | → overhead, or ejection |
| the approach itself was a winner | 23.08% | point over, no volley |
| passing shot in play | 10.77% | → volley |
| lob **missed** | 3.08% | point over, no volley |

**~65% of successful approaches end the point before a net shot exists.** Two shots after the
approach, the player's next stroke is: point already over 46.15%, **overhead 13.85%, volley
7.69%**, back at the baseline 7.7%.

*(n = 65 approaches — the volley/overhead split is noisy at this sample size and flipped
between runs; the stable finding is the ~65% point-ending fraction and the fact that overhead
and volley are the same order of magnitude.)*

**Cause 2 — every lob becomes an overhead or an ejection, never a volley.** Bucketing lobs hit
at a net player by quality:

| lob quality | n | outright winner | net player's reply |
|---|---|---|---|
| weak (q < 45) | 125 | 0.00% | overhead 99.2% |
| medium (45–60) | 149 | 2.68% | overhead 84.6%, ejected 8.7% |
| good (60–75) | 25 | **20.00%** | ejected — lob/slice/approach from the baseline |
| great (q ≥ 75) | 3 | 33.33% | point over |

The system behaves as designed; the design is the problem.

Lobs are ~22% of replies to an approach, and the lob branch is a pure volley-suppressor: weak
lobs are smashed (scoring on `technical.overhead`), good lobs either win outright or push the
net player off the net. There is also a perverse detail — a *better* approach sets
`timeAvailable === 'rushed'`, which raises the defender's lob rate from 35% to 60%
([`ShotSelector.ts:83`](../src/core/ShotSelector.ts#L83)). Executing the approach well is what
prevents the volley.

---

## 3. Stat sensitivity

### Part B — marginal point-win% per +10 stat, 1400 randomized builds and playstyles

| stat | bucket | per +10 | 95% CI | verdict |
|---|---|---|---|---|
| serve | core | +3.61 | [+3.23, +3.99] | strong |
| anticipation | mental | +2.99 | [+2.58, +3.40] | strong |
| return | core | +2.26 | [+1.86, +2.67] | strong |
| speed | physical | +1.92 | [+1.50, +2.34] | strong |
| focus | mental | +1.75 | [+1.32, +2.18] | strong |
| spin | technical | +1.69 | [+1.28, +2.10] | strong |
| strength | physical | +1.37 | [+0.94, +1.79] | strong |
| placement | technical | +1.36 | [+0.93, +1.80] | strong |
| offensive | mental | +1.15 | [+0.70, +1.59] | strong |
| backhand | core | +1.07 | [+0.66, +1.48] | strong |
| stamina | physical | +0.86 | [+0.44, +1.28] | strong |
| defensive | mental | +0.75 | [+0.32, +1.18] | moderate |
| forehand | core | +0.63 | [+0.18, +1.07] | moderate |
| slice | core | +0.32 | [−0.11, +0.74] | **noise** |
| volley | technical | +0.31 | [−0.13, +0.75] | **noise** |
| recovery | physical | +0.25 | [−0.18, +0.68] | **noise** |
| overhead | technical | +0.24 | [−0.19, +0.67] | **noise** |
| dropShot | technical | +0.09 | [−0.33, +0.52] | **noise** |
| agility | physical | +0.08 | [−0.34, +0.51] | **noise** |
| shotVariety | mental | +0.05 | [−0.37, +0.48] | **noise** |

Bucket totals (sum of marginal effects per +10): core **+7.88**, mental **+6.69**, physical
**+4.48**, technical **+3.70**. Note that mental nearly matches core while carrying a third of
the rating weight (0.15 vs 0.45).

### Part A — point-win% from taking one stat 50 → 90, by playstyle

Control (uniform 50 v 50): **+0.14**.

| stat | bucket | unspecialized | aggressive | counterpuncher | serve_volley | mean |
|---|---|---|---|---|---|---|
| anticipation | mental | +8.51 | +14.79 | +13.52 | +12.94 | **+12.44** |
| speed | physical | +8.03 | +7.85 | +9.21 | +10.55 | +8.91 |
| return | core | +7.72 | +10.32 | +7.68 | +7.39 | +8.28 |
| serve | core | +5.87 | +5.03 | +9.97 | +9.42 | +7.57 |
| focus | mental | +4.84 | +5.79 | +6.22 | +9.85 | +6.67 |
| spin | technical | +5.04 | +4.24 | +9.96 | +6.25 | +6.37 |
| placement | technical | +3.13 | +5.21 | +6.46 | +7.84 | +5.66 |
| strength | physical | +8.15 | +2.91 | +1.99 | +8.85 | +5.48 |
| forehand | core | +3.04 | +5.60 | +7.57 | +1.73 | +4.49 |
| stamina | physical | +4.78 | +3.38 | +2.37 | +3.43 | +3.49 |
| backhand | core | +5.13 | +1.38 | +3.62 | +2.42 | +3.14 |
| offensive | mental | +0.87 | +6.11 | +0.71 | +2.80 | +2.63 |
| defensive | mental | +1.87 | +1.85 | +1.23 | +1.42 | +1.59 |
| volley | technical | −1.06 | +0.55 | +0.67 | +3.41 | +0.89 |
| overhead | technical | −3.54 | +1.50 | +1.24 | +3.32 | +0.63 |
| recovery | physical | +4.02 | −1.18 | −2.27 | +0.91 | +0.37 |
| dropShot | technical | −1.08 | +1.32 | −2.06 | +1.67 | −0.04 |
| shotVariety | mental | −4.37 | +0.42 | +2.83 | −0.48 | −0.40 |
| slice | core | +0.59 | −1.21 | −2.41 | +0.15 | −0.72 |
| agility | physical | +0.11 | −3.23 | −0.74 | +0.86 | −0.75 |

Per-cell noise here is larger than in Part B (40 matches per cell), so read the ordering rather
than individual values. The ordering matches Part B.

---

## 4. The rating tax — root cause

`matchLevel` is the mean of both players' `overallRating`
([`qualityThresholds.ts:53`](../src/utils/qualityThresholds.ts#L53)), and every quality
threshold scales linearly off it
([`qualityThresholds.ts:40`](../src/utils/qualityThresholds.ts#L40)). **Improving a stat raises
the bar you must clear on every shot you hit.**

Per +10 in one stat:

```
threshold rise = 10 × (bucketWeight / 5) / 2 × scale
   core      → 10 × 0.09 / 2 × 1.0 = +0.45   (on every shot)
   technical → 10 × 0.03 / 2 × 1.0 = +0.15   (on every shot)

quality gain = shotFrequency × primaryWeight × 10   (on the shots that use it)
```

Setting them equal gives a **break-even shot frequency of ~6% for a core stat and ~2.1% for a
technical one.** Below that, the stat costs more than it gives.

This predicts something falsifiable: the *same* stat should change sign purely as a function of
how often a build uses it. Tested (150 BO3 matches each, ~±0.7 at 95%):

| stat | context | Δ point-win% | |
|---|---|---|---|
| `slice` (core) | never slices (0.3% of shots) | **−1.06** | below break-even |
| `slice` (core) | `bh_samurai` T3 (~10% of shots) | **+2.51** | above break-even |
| `volley` (technical) | unspecialized (1.3%) | +1.14 | |
| `volley` (technical) | `net_downhill` T3 (2.0%) | +1.04 | |
| `return` (core) | 44% of shots | +10.33 | control, far above |
| `dropShot` (technical) | 0.15% of shots | +0.09 | control, far below |

Confirmed for slice: same +40 investment, opposite sign.

**Caveat, recorded honestly:** the arithmetic above predicted volley would be net-*negative*. It
measured mildly positive (+1.14 / +1.04). The tax neutralizes volley rather than inverting it,
so the break-even frequencies are somewhat pessimistic as stated. The slice sign flip is the
clean evidence; treat the exact break-even numbers as an approximation of the mechanism, not a
calibrated constant.

### Consequence for the volley proposal

Promoting `volley` from technical to core would **triple its rating tax** (0.15 → 0.45 threshold
rise per +10) while leaving its usage at ~2%. That moves it from marginally positive to
approximately break-even or worse. The swap makes volley *less* worth training than it is today,
which is the opposite of its stated goal.

---

## 5. Consolidation candidates

Consolidation is mechanically motivated, not merely ergonomic: merging two 1%-frequency stats
into one 2% stat more than doubles its value, because the tax is paid once instead of twice.

### Merge — high confidence

- **`overhead` → `volley`, as a single `net` stat.** Individually dead (+0.24, +0.31). Overhead
  is the *finisher* of net points (see the funnel in section 2.1), so a net player currently
  pays two rating taxes to be competent at one phase, while a baseliner pays one for forehand or
  backhand. Also fixes the `GamePhase`/`CoreStats` asymmetry that motivated the original
  proposal — the phase is `net`, so the stat should be `net`, not `volley`.
- **`recovery` → `stamina`.** `recovery` is dead (+0.25) and has exactly one read site in the
  simulation — fatigue recovery ([`MatchSimulator.ts:295`](../src/core/MatchSimulator.ts#L295)).
  It and stamina are two halves of one concept.
- **`agility` → `speed`.** `agility` is dead (+0.08). The code already averages the two
  literally: `const rushHandling = (physical.speed + physical.agility) / 2`
  ([`ShotCalculator.ts:969`](../src/core/ShotCalculator.ts#L969)).

### Delete or fold

- **`dropShot`** (+0.09, 0.15% of shots) — weakest stat in the game by both measures. Fold into
  `placement`.
- **`shotVariety`** (+0.05) — fires only on tactical shots (drop, angle, lob, passing), which
  `placement` is already the primary stat for. Redundant.

### Rebucket, don't merge

- **`placement` is misbucketed.** Primary stat for six shot types (angle, lob, passing × two
  wings) at ~8.8% frequency, and marginally more valuable than `forehand` (+1.36 vs +0.63) —
  while sitting at technical weight 0.03. A larger core/technical mismatch than the one the
  volley proposal is about.
- **`anticipation` may be doing too much.** The #2 stat in the game, sitting in mental at 0.03
  weight. It appears in `RETURN_COMPOSITE_WEIGHTS` at 0.25 *and* is a universal threshold
  reducer applied to every shot
  ([`ShotCalculator.ts:302`](../src/core/ShotCalculator.ts#L302)).

### Not a candidate

- **`slice` should stay.** It is the only "dead" stat that comes fully alive with the right
  build (+2.51 for a slice specialist). It is conditional, not weak — and it is the single most
  playstyle-expressive stat in the game (26× frequency swing). Demoting it to make room for
  `volley`, which has the smallest dynamic range of any shot stat, inverts the actual evidence.

A 20 → 15 reduction follows from the merges and deletions above. If the 4×5 grid is worth
preserving aesthetically, 4 buckets of 4 (16 stats) is reachable.

### Training-economy note

The spread problem compounds this. An anchor session grants +1 to the chosen core plus up to 3
supports drawn from a 6-stat pool
([`AnchorTrainingSystem.ts:140`](../src/game/AnchorTrainingSystem.ts#L140)). Each specific
support therefore accrues ~0.5/session against a core's 1.0 — roughly 20 sessions to move one
support stat by 10 points, and seven of the stats being spread into do not measurably affect
outcomes.

---

## 6. Bugs found during the audit

- **Typo in `SHOT_CLASSIFICATIONS.spinShots`** —
  [`ShotCalculator.ts:82`](../src/core/ShotCalculator.ts#L82) lists
  `'defemsove_slice_backhand'`. `defensive_slice_backhand` therefore never receives the spin
  bonus (up to +20% quality) while `defensive_slice_forehand` does. A live asymmetry between
  wings on a shot family that is ~1.5% of rally play.
- **The broad archetype is inert.** `aggregateArchetypeEffects`
  ([`archetypeTree.ts:338`](../src/data/archetypeTree.ts#L338)) iterates only `ALL_PHASES` and
  never reads `profile.broad`, despite its own docstring claiming "*including broad-archetype
  defaults*." Its only consumer is `buildPlayStyle`
  ([`PlayerProfile.ts:121`](../src/core/PlayerProfile.ts#L121)), which is explicitly
  display-only. Measured: a broad `net_attacker` with no phase points is statistically identical
  to an unspecialized player (section 2, columns 1 and 2). A player picks "Net Attacker" at the
  Coach Gonzalez event, watches the netApproach dial move, and plays exactly the same tennis.
- **`calculateOverallRating` is duplicated** between
  [`PlayerProfile.ts:64`](../src/core/PlayerProfile.ts#L64) and
  [`playerStats.ts:11`](../src/utils/playerStats.ts#L11), with the latter hardcoding stat names.
  Any bucket change has to touch both.

---

## 7. Suggested order of work

1. **Fix the broad-archetype wiring.** Small, correct regardless of any other decision here, and
   probably the largest felt gap for a player.
2. **Decide on the rating tax.** This is the biggest lever and it is upstream of every
   consolidation decision. If `matchLevel` were computed from a build-independent baseline
   rather than live `overallRating`, several currently-dead stats may come alive with no
   consolidation at all. Cheap to test with `statSensitivity.ts` in place.
3. **Fix the `spinShots` typo.**
4. **Re-measure**, then decide the merges in section 5 against fresh numbers.
5. **Revisit the volley proposal last.** As written it should not proceed; the `overhead`→`net`
   merge captures its legitimate structural insight without demoting the most expressive stat in
   the game.
