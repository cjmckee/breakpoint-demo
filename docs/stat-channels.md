# Stat channels — four ways a stat reaches a shot, and what each one buys

**Status:** measurement, plus one change it argues for
**Scope:** whether the multiple paths from a stat to a shot outcome produce distinguishable
behaviour, or only make stat effects harder to measure
**Harness:** [`src/test/analysis/statChannels.ts`](../src/test/analysis/statChannels.ts)

---

## Summary

1. **There are not four channels. There are three, plus two the list leaves out.** `bonus` is not a
   separate mechanism — `(1 + statBonus(s, B)/100)` and `statModifier(s, B/100)` are the same
   function, verified to the sixth decimal. Meanwhile shot *selection* (which shots get hit) and the
   out-of-quality systems (fatigue, pressure, momentum) each carry more stat value than either of
   the two small quality channels, and neither is in the list.
2. **The bonus channel is below the measurement floor.** At 8000 randomized pairings per
   configuration, deleting it entirely moves no stat's value by more than +0.23 point-win-%, against
   a control column that moves ±0.17 by re-running the identical config. Only `spin` shows anything
   at all, and it is one noise band from zero.
3. **The band channel is real, and it is real for four stats.** `anticipation` +1.07,
   `tactics` +1.03, `speed` +0.60, `strength` +0.43 point-win-% per +10. Every other stat reads
   inside the control. For `anticipation` and `tactics` that is roughly 40% of the stat's whole
   value, so this is not a channel to fold away.
4. **The threshold channel is the only one that can express a stat acting on the opponent's shot**
   — and half of it is inert. `tactics` +0.59, `speed` +0.54, `anticipation` +0.40 all measure;
   the ace-resistance term on `return` (+0.06) and the net-coverage term on `net` (+0.14) do not.
5. **Eleven of fourteen stats get all of their shot-quality value from one channel.** The variety
   the multi-channel design is supposed to buy is concentrated in three mental/physical supports.
6. **The measurement cost is real but bounded.** The channels are cheap to separate *if you ablate
   them*; they are impossible to separate by staring at `statSensitivity` output, because that
   harness reports one number per stat with every channel summed into it.

---

## 1. The channels

In the order the engine applies them:

| # | channel | where | shape |
|---|---|---|---|
| 1 | **composite** | `PlayerProfile.getStatForShot` — `SHOT_COMPOSITE_WEIGHTS`, `SERVE_QUALITY_WEIGHTS`, `SERVE_ACCURACY_WEIGHTS`, `RETURN_COMPOSITE_WEIGHTS` | additive, weights sum to 1, keyed on shot family |
| 2 | **band** | `ShotCalculator.calculateModifiers` — `STAT_MODIFIER_BANDS`, `SERVE_MODIFIER_BANDS` | multiplicative, centered on `NEUTRAL_STAT`, gated on a shot classification *or a live context flag* |
| 3 | **bonus** | same function — `STAT_BONUS_BANDS`, `SERVE_SPIN_BANDS` | multiplicative, centered on `NEUTRAL_STAT`, gated on a shot classification |
| 4 | **threshold** | `ShotCalculator.calculateQualityRequirements` — `OPPONENT_STAT_ADJUSTMENTS`, `SHOOTER_STAT_ADJUSTMENTS` | moves the bar, not the shot |

And the two that are not on the list but carry more than 3 and 4 combined:

| # | channel | where | what it does |
|---|---|---|---|
| 5 | **selection** | `ShotSelector` | `forehand`/`backhand` set the wing ratio; `spin` sets the tactical-shot rate; `placement` sets the drop-shot rate. Changes *which shots happen*, not how well they go. |
| 6 | **state** | pressure, momentum, fatigue | `focus` and `stamina` reach a shot only here. Neither has any band, bonus or threshold entry. |

### 2 and 3 are the same function

```
statModifier(s, band)  = 1 + ((s − 50)/50) × band × MODIFIER_SPREAD
statBonus(s, band)     =     ((s − 50)/50) × band × MODIFIER_SPREAD

finalAdjustment includes (1 + spinBonus/100)
  = 1 + ((s − 50)/50) × band × MODIFIER_SPREAD / 100
  = statModifier(s, band/100)
```

`STAT_BONUS_BANDS.spin = 10` *is* a modifier band of `0.10`; `placement = 7.5` is `0.075`. Checked
numerically across the range — identical to the sixth decimal at every stat value. The two tables
land in the same product in `calculateModifiers` and are multiplied together. The only thing that
distinguishes them is that `modifiers.spinBonus` is separately read by the `SIDE_SPIN` ability
effect in `applyAbilityEffects`.

---

## 2. Method

`statChannels.ts`, three parts.

**PART S — static.** Arithmetic on the config tables, no simulation. What is +10 in a stat worth in
points of shot quality through each channel, and what has to be true for the channel to pay at all.
No sampling, so no noise; it bounds what PART A could ever detect.

**PART M — measured dynamic range.** Every band and bonus is centered on `NEUTRAL_STAT`, so a
uniform-50 player multiplies by exactly 1.000 on every shot. Running uniform players at other
ratings reads the channel's whole range straight off the shots — whatever the product differs from
1.0 *is* the entire contribution of bands and bonuses.

**PART A — ablation.** The randomized-population regression `statSensitivity` Part B uses:
independently random stats, random archetypes, random pairings, regress point-win margin on each
stat difference. Run once per configuration with one channel zeroed each time; `full − ablated` is
that channel's contribution. The build population is drawn from a seeded PRNG and reused verbatim
across configurations, so every column regresses on an identical design matrix.

A **control** column ablates nothing. It is the same shipped config measured twice, so it reports
what zero looks like — any channel column smaller than the control is a mechanism that could be
deleted unmeasurably. This is the column that makes the rest of the table readable, and it belongs
in any ablation harness added later.

```
npm run build:node
N=8000 PARTS=SMA node dist/src/test/analysis/statChannels.js
```

### Two limits worth stating

**The composite column only measures a stat in its SUPPORT role.** The ablation pushes support
weight onto whichever stat is primary, so primary stats go *up* and their column is not an ablation
of them at all — that is why `serve` reads −1.84 and `return` −1.14. There is no ablation that
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
| return | threshold | 1.20 | opponent's stat, serves only |
| speed / tactics | threshold | 1.20 | opponent's stat, every rally shot |
| spin | bonus | 1.10 | spin shots (slice/drop/defensive slice) |
| anticipation | band | 1.10 | opponent at net / well positioned |
| strength | band | 1.10 | power shots |
| anticipation | threshold | 1.00 | own stat, every rally shot |
| placement | bonus | 0.82 | placement shots (drop/angle/lob) |
| spin | band | 0.82 | tactical shots |
| stamina | — | — | **no shot-quality channel at all** |

The composite is an order of magnitude ahead of everything else before gating is even considered,
and then the gates cut further: measured against the shot mix, `spinShots` is ~5.8% of an
unspecialized player's rally shots and `placementShots` ~9.2%, so the two bonus entries pay
1.10 and 0.82 quality points on roughly one shot in twelve.

---

## 4. PART M — the band+bonus channel's whole range

Uniform players, so the composite base rating equals the level exactly.

| level | support × | quality Δ | phys × | ment × | spin × | place × |
|---|---|---|---|---|---|---|
| 20 | 0.830 | −3.41 | 0.942 | 0.894 | 0.986 | 0.997 |
| 30 | 0.886 | −3.42 | 0.962 | 0.930 | 0.992 | 0.998 |
| 50 | 1.000 | +0.00 | 1.000 | 1.000 | 1.000 | 1.000 |
| 70 | 1.133 | +9.32 | 1.042 | 1.073 | 1.009 | 1.004 |
| 90 | 1.306 | +27.53 | 1.082 | 1.151 | 1.030 | 1.017 |

Two readings.

**In aggregate the band channel is not small** — ×0.83 to ×1.31 is a wide range, and the mental
factor (`tactics` + `anticipation` + `spin` touch) carries most of it. But that is every support
stat moving at once from 25 to 90; per stat per +10 it is the ~1.0 point-win-% PART A measures.

**The bonus columns are the whole answer to the bonus channel.** At uniform 90 — the top of the
scale, every gate as open as it gets — spin's bonus multiplies quality by 1.030 and placement's by
1.017. At tier-1 ratings they are 0.986 and 0.997. That is the entire mechanism.

A third reading, noted rather than acted on: the product is not symmetric about 50 (0.830 at L=20
against 1.306 at L=90), because a product of centered linear factors is convex. This is the residue
of the double-count [`stat-system-audit.md` §3.1](./stat-system-audit.md) removed — much smaller
than the 0.605 it started at, and arguably correct now that the bands express build shape, but it
still costs a uniform-20 player 3.4 quality points for being uniformly low.

---

## 5. PART A — measured contribution per channel

8000 randomized pairings per configuration, seed 7. Units: point-win-% per +10 stat.
`±95%` on `full` is 0.18; the `control` column is the empirical noise floor.

| stat | full | control | composite | band | bonus | threshold |
|---|---|---|---|---|---|---|
| anticipation | +2.76 | +0.05 | **+1.45** | **+1.07** | −0.06 | **+0.40** |
| return | +2.68 | +0.04 | *−1.14* | −0.21 | −0.04 | +0.06 |
| speed | +2.53 | +0.01 | **+1.14** | **+0.60** | −0.06 | **+0.54** |
| serve | +2.47 | +0.12 | *−1.84* | +0.06 | −0.02 | −0.07 |
| tactics | +2.32 | +0.17 | **+0.59** | **+1.03** | +0.07 | **+0.59** |
| focus | +2.07 | +0.15 | +0.52 | +0.05 | +0.05 | +0.11 |
| spin | +1.37 | +0.09 | **+1.08** | +0.15 | +0.23 | −0.00 |
| strength | +1.37 | −0.09 | **+0.90** | **+0.43** | +0.07 | −0.07 |
| placement | +1.34 | −0.04 | +0.34 | −0.05 | +0.08 | −0.13 |
| forehand | +1.17 | −0.08 | *−0.16* | −0.19 | −0.11 | −0.14 |
| backhand | +1.11 | −0.02 | *−0.23* | −0.32 | −0.09 | −0.15 |
| stamina | +1.05 | −0.03 | +0.23 | −0.18 | −0.02 | −0.06 |
| net | +0.58 | +0.03 | **+0.55** | +0.00 | −0.03 | +0.14 |
| slice | +0.30 | −0.06 | −0.01 | −0.08 | −0.11 | −0.11 |

*Italic* composite cells are the primary-role artifact described in §2 — not ablations.

**The bonus column is the finding.** Fourteen stats, and the largest entry is `spin` at +0.23
against a control that reaches +0.17. Everything else is inside the noise. Resolving a +0.1 effect
at 95% confidence would need roughly 104,000 pairings per configuration — about half an hour of
simulation to confirm that a mechanism does nothing.

**The band column is real and narrow.** Four stats clear the control: `anticipation`, `tactics`,
`speed`, `strength`. For the first two it is ~40% of everything the stat is worth.

**The threshold column is real and narrower.** Three stats clear it. The two opponent-side entries
that were added to give conditional stats a job — `return` as ace resistance, `net` as net coverage
— both read inside the noise.

**Where the unaccounted value goes.** `focus` measures +2.07 with only +0.87 accounted across all
four channels; the rest is the pressure modifier and momentum mitigation. `stamina` measures +1.05
with nothing accounted — it is the fatigue system, entirely. `forehand`, `backhand`, `placement`
and `slice` are primary stats whose composite column is not an ablation, plus whatever `ShotSelector`
frequency is worth to them.

---

## 6. What this argues for

**Fold `STAT_BONUS_BANDS` into `STAT_MODIFIER_BANDS` and delete the bonus concept.** It is provably
the same function with the constant scaled by 100, it measures as nothing, and it costs a reader of
`calculateModifiers` a second mechanism to hold. `spin: 10 → 0.10`, `placement: 7.5 → 0.075`, the
same numbers in the same units as every other band. One consumer needs rework: `applyAbilityEffects`
reads `modifiers.spinBonus` for the `SIDE_SPIN` effect and would need the spin factor instead. Zero
behaviour change by construction — worth verifying with a PART A run either side.

**Keep the band channel, and know what it is for.** It is not "composite with extra steps": it
multiplies rather than adds, so a support amplifies a strong shot more than a weak one, and — the
part composite genuinely cannot do — it gates on *live context* (`ballQuality.timeAvailable`,
`courtPosition`, `opponentPosition`) rather than on shot family. Composite tables are static per
family. That is a real expressive difference, and it is worth spending on more stats than the four
currently using it.

**Keep the threshold channel; it is the only one that can express a stat degrading the opponent's
shot.** But `OPPONENT_STAT_ADJUSTMENTS.return` and `.netCoverage` do not currently measure, so if
they are meant to be the thing that makes a conditional stat pay, they are not doing it at their
present sizes.

**Stop expecting `statSensitivity` to answer channel questions.** It reports one number per stat
with all six channels summed into it. That is the right number for "is this stat worth having" and
it cannot answer "is this mechanism worth having" — those need the ablation, and the ablation needs
its control column.

---

## 7. Open

- **Is the band channel underused?** Four stats out of fourteen touch the one mechanism that can
  read live match context. `slice`, `net` and `placement` are all conditional stats that measure
  weakly, and all three are conditional in exactly the way a context gate expresses well.
- **The convexity in §4.** A uniform-20 player still loses 3.4 quality points to a channel that is
  supposed to be neutral for a balanced build. `MODIFIER_SPREAD` is the dial; the alternative is
  summing the band deviations rather than multiplying them.
- **`OPPONENT_STAT_ADJUSTMENTS.return` and `.netCoverage`** measure as noise at 0.12 and 0.20.
  Either they want to be bigger or they want to not exist.
