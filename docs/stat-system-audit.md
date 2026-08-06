# Stat system audit — what the stats actually do

**Status:** findings plus the changes that followed from them
**Scope:** whether stats scale across the 0-100 range, at the ratings the game actually ships
**Supersedes:** the first version of this document, whose section 4 is withdrawn — see section 5

---

## Summary

1. **Every harness in this repo was measuring content that doesn't exist.** The original audit ran
   uniform-50 to uniform-90 builds. The starting player is OVR 20 and the whole of tier 1 spans
   OVR 25-49. Nothing implemented reaches 50. Every conclusion below is re-measured at the real
   ratings.
2. **The support-stat modifiers double-counted skill.** They were anchored so only a 100-stat
   player was neutral, and they multiply, so a uniform-20 build produced quality 30-40% below its
   primary stat. That collided with `RELATIVE_QUALITY_REQUIREMENTS` and left several shots with
   success rates that did not improve with level at all.
3. **The return did not scale from OVR 20 to 50** — flat at ~48% in-play across the entire
   implemented game, on the most-hit shot at 44% of rally shots. The first serve was flat at
   ~41% over the same span. Same mechanism in both.
4. **Winner rates inverted with skill.** An expert's most reliable point-ender was the drop shot
   (75% of attempts) and second was the defensive slice (45%), while the passing shot managed 11%,
   the volley 3% and the return 0.3%. Shot quality is bounded at 100; winner midpoints were not.
5. **The "rating tax" in the previous version is withdrawn.** Its own falsification test fails:
   pinning `matchLevel` does not remove the effect it predicts. Consolidation may still be right,
   but on frequency grounds alone.
6. **`matchLevel` barely matters, and anchoring it to a tier changes nothing measurable.** Tested
   four anchors at two rating bands, and a tier-anchored progression sweep. The one place it earns
   its keep is scaling `MIN_QUALITY_FLOORS`.

---

## 1. Method

Five harnesses, all in `src/test/analysis/`:

| Harness | What it measures |
|---|---|
| `shotMixProbe.ts` | Which shots each playstyle actually hits; the approach→net funnel |
| `statSensitivity.ts` | Marginal value of every stat, two independent designs |
| `anchorProbe.ts` | What `matchLevel` controls; the rating-tax falsification |
| `tier1Probe.ts` | The shipped tier-1 ladder: serve behaviour, matchups, point endings, progression |
| `shotCurve.ts` | Per-shot scaling across the 0-100 range |
| `serveCurve.ts` | Why the first serve was flat below OVR 40 |

```
npm run build:node
node dist/src/test/analysis/tier1Probe.js
node dist/src/test/analysis/shotCurve.js
```

Some parts need temporary seams (an env-readable `matchLevel` anchor, a modifier-stack
compressor). Those are documented in the file headers of `anchorProbe.ts`, `tier1Probe.ts` and
`shotCurve.ts` rather than committed — the simulation should not read `process.env`.

Point win rate is used throughout rather than match win rate: at ~120 points per BO3 it is roughly
10× less noisy for the same runtime. A uniform-50 control lands at +0.14, which is the noise floor.
Cells of 150 BO3 carry about ±0.7 at 95%.

---

## 2. The content the game actually has

This is the correction that reframes everything else.

| group | opponents | OVR |
|---|---|---|
| player start | `DEFAULT_PLAYER_STATS`, all 20s | **20** |
| practice | Danny Park, Marta Ruiz, Rick Tanaka, Big Steve, Lin Chen | 25–29 |
| team storyline | Chet Vale, Rich Soil, Martia Estrella, Reginald Werther, Olivia Gulp | 29–41 |
| Riverside Open | Keith, Chris, Max, Jordan | 36–45 |

Practice opponents scale with `getScaledOpponentStats` (+2 per tier win, capped at +20), so Danny
Park reaches OVR 45 and Lin Chen 49. `matchLevel` for a new player therefore runs 22.5–32.5, and
for a fully trained tier-1 player tops out around 47.

Two consequences. Every absolute constant in the system was calibrated at ~70 and is being applied
30 to 50 points below that. And the previous audit's stat table — 1400 randomized builds at
uniform-50 to uniform-90 — described a regime no player will see for a long time.

---

## 3. Scaling failures

### 3.1 The modifier stack double-counted skill

Shot quality is `primaryStat × finalAdjustment`, where `finalAdjustment` is the product of up to
eight modifiers. Every one was shaped "0 stat = 0.8×, 100 stat = 1.0×" — only a maxed player was
neutral. Because they multiply, a uniform-20 build compounded three or four sub-1 factors:

| shot | finalAdjustment at L=20 | at L=85 |
|---|---|---|
| overhead | 0.605 | 1.198 |
| passing shot | 0.637 | 1.074 |
| return | 0.691 | 0.932 |
| forehand | 0.822 | 0.961 |
| slice backhand | 0.873 | 1.220 |

The primary stat already carries skill at that shot. Multiplying by more stat-derived factors
squares the skill dependence, and it hits aggressive shots hardest because they trigger more
sub-1 branches — so beginners were worst at exactly the shots that were already hardest.

### 3.2 and 3.3 The first serve and the return were flat

The serve-in roll is `accuracy = composite × finalAdjustment + variance` against
`midpoint = OVR × 62/70 = 0.886 × OVR`. For a uniform build the composite equals OVR, so:

```
margin = L × finalAdjustment − L × 0.886 = L × (finalAdjustment − 0.886)
```

Both terms scale with L, so the product barely moves until `finalAdjustment` crosses 0.886 — at
roughly L=41.

| L | finalAdj | accuracy | midpoint | margin | p(in) |
|---|---|---|---|---|---|
| 20 | 0.711 | 14.3 | 17.7 | **−3.5** | 43.6% |
| 30 | 0.786 | 23.7 | 26.6 | **−2.9** | 44.7% |
| 40 | 0.868 | 34.9 | 35.4 | −0.5 | 49.1% |
| 50 | 0.956 | 47.6 | 44.3 | +3.3 | 56.2% |
| 70 | 1.000 | 70.2 | 62.0 | +8.2 | 64.8% |

The second serve is the control that proves the mechanism: its ratio is 32/70 = 0.457, below
`finalAdjustment` everywhere, and it scaled correctly from the bottom (66.9% → 95.3%).

The return has the same shape for the same reason — its `RELATIVE_QUALITY_REQUIREMENTS` multiplier
is 0.75, inside the band `finalAdjustment` travels:

| L | 20 | 30 | 40 | 50 | 60 | 70 | 85 |
|---|---|---|---|---|---|---|---|
| p(in play) | 47.9% | 47.7% | 47.8% | 47.8% | 50.8% | 55.1% | 64.0% |

Flat across the entire implemented game, on 44% of all rally shots.

**The general rule:** any shot whose requirement multiplier lands inside the range
`finalAdjustment` travels is flat until the crossover. Returns and passing shots (0.75) were worst,
then power (0.70), angle (0.65), volley/approach/overhead (0.60). Slice (0.35), lob (0.30) and
defensive slice (0.25) sit below the band and scaled fine — which is why a beginner's only working
shots were slices and lobs.

### 3.4 Absolute constants inside a relative system

`MIN_QUALITY_FLOORS` (20/15/10) is absolute. At tier 1 it stopped being a backstop and became the
operative requirement: a 20-quality ball asks `0.50 × 20 = 10` for a groundstroke, which the
neutral floor raised to 15 — a 50% higher bar than the relative system computed.

Two mirror players at quality L, neutral groundstroke:

| L | midpoint | margin | p(in play) | expected rally |
|---|---|---|---|---|
| 20 | 15 *(floored)* | 5 | 60% | 2.5 |
| 30 | 15 *(floored)* | 15 | 77% | 4.3 |
| 70 | 35 | 35 | 94% | 16.7 |

`MINIMUM_WINNER_THRESHOLDS` is also absolute, and testing showed it **should stay that way**:
scaling it with match level takes tier-1 winners from 7% of points to 40% and makes rallies
*shorter*, which is the exact failure it exists to prevent.

### 3.5 Winner rates inverted with skill

Shot quality is bounded — it clamps at 100, and `TOTAL_MODIFIER_CAPS.rally = 1.25` holds it near
there from about L=60 up. Winner midpoints were `inPlayReq × a per-category multiplier`, unbounded.
At L=85 every shot produced 96-99 quality, so winner rates were decided entirely by the product of
the requirement multiplier and the category multiplier:

| shot | quality | winner midpoint | p(win) |
|---|---|---|---|
| drop shot | 99.0 | 83.1 | **75.3%** |
| defensive slice | 98.9 | 102.0 | **44.6%** |
| overhead | 98.9 | 106.0 | 37.8% |
| power | 99.0 | 121.3 | 17.4% |
| passing | 98.8 | 129.0 | 10.8% |
| volley | 96.0 | 147.3 | 2.7% |
| return | 95.3 | **179.1** | 0.3% |

A midpoint of 179 on a 0-100 scale is unreachable by construction. The category multiplier was
applied on top of a requirement that already ranged 0.25 to 0.85, so it never expressed shot intent
at all. Getting better actively removed a player's ability to end points with the shots meant to
end them.

---

## 4. What the low end actually played like

Even matchups between weak players were already even on points — 49.1% for a new player against
Danny Park, 49.8% for a trained mirror. The gap was texture:

| build | OVR | ace | DF | winner | forced | unforced | ends on return | rally ≥4 |
|---|---|---|---|---|---|---|---|---|
| new player | 20 | 2.1 | 28.0 | 7.0 | 32.1 | 30.8 | 38.6 | **12.9%** |
| Big Steve | 28 | 2.8 | 24.8 | 12.8 | 32.9 | 26.7 | 35.5 | 18.3% |
| Jordan | 46 | 1.7 | 16.9 | 31.3 | 35.0 | 15.0 | 29.2 | 23.9% |
| uniform 70 | 70 | 4.0 | 6.6 | 27.8 | 47.8 | 13.8 | 39.7 | 31.8% |

91% of tier-1 points ended in an error, which is right for beginners. But 87% never reached four
shots and 28% never got a ball in play at all. Weak players weren't hitting worse shots — they were
missing roughly half of them.

---

## 5. The rating tax — withdrawn

The previous version claimed `matchLevel` imposes a tax: raising a stat raises `overallRating`,
raises `matchLevel`, raises every threshold, so a stat only pays if its shot frequency clears a
break-even point. It offered its own falsification: pin `matchLevel` and the slice sign flip should
disappear. It doesn't.

| config | slice→90, never slices | slice→90, slice specialist |
|---|---|---|
| baseline | −1.15 | +0.46 |
| `matchLevel` pinned | −0.53 | +0.91 |
| serve-in midpoint pinned | **+0.03** | +1.72 |
| both pinned | −0.40 | +0.48 |

Every cell sits within about one noise band of the others, and three of four have the
"never slices" case indistinguishable from zero. Re-run at tier-1 magnitudes (slice 20→40 against
a uniform-20 opponent) the picture is the same: −1.15 / +1.78 shipped, +0.02 / −0.46 pinned.

The break-even arithmetic was also built on a false premise. It treated these thresholds as the
bar a shot must clear. They are not — the rally bar is `calculateQualityRequirements`, which has
never referenced `matchLevel`, not even in the commit that introduced the system. The only success
bar `matchLevel` ever touched was the serve, and `eaa71a4` removed it deliberately.

What survives is duller and needs no tax: **a stat pays roughly in proportion to how often you use
it.** At 1.6% usage the payoff is indistinguishable from zero. Consolidation may still be right;
the argument for it is frequency, not a tax. The claim that merging two 1% stats "more than
doubles" their value is unsupported — it gives you a 2% stat, linearly.

---

## 6. What `matchLevel` is worth

Every `getQualityThresholds(matchLevel)` call sits in the labelling layer: the incoming ball's
`spin` and `timeAvailable`, the difficulty multiplier, and shot-selection gating. Anchoring it
four different ways barely moves outcomes.

At OVR 50-90:

| anchor | 90 v 40 pt-win% | mean rally | ≤2-shot |
|---|---|---|---|
| mean (shipped) | 99.1 | 1.57 | 96.7% |
| shooter | 98.8 | 1.51 | 96.5% |
| receiver | 99.8 | 1.54 | 97.3% |
| fixed 70 | 99.0 | 1.54 | 96.5% |

At real tier-1 ratings, new player (20) v Jordan (46): 14.5% mean, 14.8% shooter, 18.4% receiver,
14.0% fixed. The anchor moves it by at most four points.

### Tier-anchored match level

Tested directly: pin `matchLevel` to a tier-1 constant of 32 so the bar stops rising as the player
improves, and sweep a player from OVR 20 to 50 against fixed opponents.

| player OVR | vs Big Steve (28), mean anchor | tier-anchored | vs Jordan (46), mean | tier-anchored |
|---|---|---|---|---|
| 20 | 31.8% | 40.1% | 9.0% | 10.4% |
| 30 | 50.2% | 55.4% | 16.1% | 15.5% |
| 40 | 71.3% | 70.1% | 37.5% | 39.0% |
| 50 | 91.2% | 87.5% | 56.5% | 53.5% |

The curves are the same within noise. The reward for improving inside a tier is already steep and
anchor-independent — 31.8% to 91.2% of points against a fixed opponent — because it comes from the
relative quality system and the stat gap, not from where the threshold scale is pinned. If matches
feel like they get harder as the game goes on, the cause is `getScaledOpponentStats` and tier
progression, not the threshold anchor.

So a tier table is not worth adding: it would be a hardcoded constant buying no measurable
behaviour. The one place `matchLevel` does earn its keep is scaling `MIN_QUALITY_FLOORS`, where it
is doing exactly the job it was invented for.

---

## 7. Changes made

| commit | change |
|---|---|
| `c4abfd9` | Broad archetype wired into behaviour; `spinShots` typo fixed |
| `d50e7db` | Support-stat modifiers centered on a neutral stat of 50 |
| `31afb15` | `MIN_QUALITY_FLOORS` scales with match level |
| `39464ed` | Winner difficulty set per shot instead of per category |
| *(this change)* | Winner floors set per shot; mid-level differentiation restored |

### Result on the shipped ladder

| build | OVR | 1st in% before → after | DF% before → after |
|---|---|---|---|
| new player | 20 | 40.9 → 42.7 | 27.8 → 25.6 |
| Danny Park | 25 | 42.2 → 50.4 | 24.9 → 18.2 |
| Big Steve | 28 | 41.1 → 47.4 | 23.1 → 20.6 |
| Olivia Gulp | 41 | 41.7 → 52.3 | 20.6 → 14.5 |
| Jordan | 46 | 41.3 → 55.9 | 18.5 → 11.5 |
| uniform 70 | 70 | 61.5 → 64.6 | 6.0 → 3.2 |

### Result on texture

New player, mirror match:

| | before | after |
|---|---|---|
| rally ≥4 shots | 12.9% | **25.3%** |
| ends on return | 38.6% | 29.1% |
| unforced errors | 30.8% | 24.5% |
| winners | 7.0% | 11.7% |
| double faults | 28.0% | 22.0% |

Still a beginner's error rate — about 86% of points end in a mistake — but the ball goes back and
forth now.

### Result on winners

Winner rate at L=85, before → after:

| overhead | power | passing | volley | drop | forehand | slice | lob | def. slice | return |
|---|---|---|---|---|---|---|---|---|---|
| 37.8 → **47.8** | 17.4 → **40.4** | 10.8 → **30.2** | 2.7 → **29.7** | 75.3 → 24.3 | 7.4 → 22.5 | 7.7 → 7.8 | 22.1 → 6.0 | 44.6 → **3.7** | 0.3 → 0.1 |

Across the ladder, winners now rise with level instead of peaking mid-range: 11.7% of points for a
new player, 34.2% for Jordan, 40.4% at uniform 70, 52.2% at uniform 85.

---

## 8. Stat sensitivity, re-measured

`statSensitivity.ts` Part B, 1400 randomized builds, before and after the changes in section 7.
**Read this with section 2 in mind:** the harness randomizes stats across the whole 0-100 range, so
it describes a population the game does not yet contain. The tier-1-scale equivalent is
`tier1Probe.ts` part C.

| stat | bucket | before | after | |
|---|---|---|---|---|
| serve | core | +3.61 | +3.34 | strong |
| anticipation | mental | +2.99 | +3.11 | strong |
| return | core | +2.26 | **+2.65** | strong |
| focus | mental | +1.75 | +1.78 | strong |
| spin | technical | +1.69 | +1.53 | strong |
| speed | physical | +1.92 | +1.50 | strong |
| strength | physical | +1.37 | +1.22 | strong |
| forehand | core | +0.63 | **+1.17** | strong |
| placement | technical | +1.36 | +0.97 | strong |
| stamina | physical | +0.86 | +0.86 | strong |
| backhand | core | +1.07 | +0.82 | strong |
| defensive | mental | +0.75 | +0.73 | moderate |
| offensive | mental | +1.15 | +0.66 | moderate |
| agility | physical | +0.08 | +0.14 | **noise** |
| recovery | physical | +0.25 | +0.01 | **noise** |
| overhead | technical | +0.24 | −0.12 | **noise** |
| slice | core | +0.32 | −0.12 | **noise** |
| volley | technical | +0.31 | −0.24 | **noise** |
| dropShot | technical | +0.09 | −0.33 | **noise** |
| shotVariety | mental | +0.05 | −0.37 | **noise** |

Bucket totals: core +7.87 (was +7.88), mental +5.92 (was +6.69), physical +3.74 (was +4.48),
technical +1.82 (was +3.70).

Three things to take from this.

**The primary stats got their weight back.** `forehand` nearly doubled and `return` rose — exactly
what section 3 predicted from removing the double-count. Quality now tracks the stat that names the
shot.

**Support stats pay less, deliberately.** `placement`, `offensive` and `spin` all fell, and the
technical bucket halved. That is the trade the centering makes: support bands are now symmetric
around 50 instead of running 0→+20%, so they express build shape rather than a flat tax on being
low-rated. Whether technical at +1.82 total is too cheap is a live tuning question — it is one
constant, `MODIFIER_SPREAD`.

**The same seven stats are still noise**, unchanged by any of this: `agility`, `recovery`,
`overhead`, `slice`, `volley`, `dropShot`, `shotVariety`. None of the scaling fixes rescued them,
which is consistent with section 5 — their problem is that nobody hits those shots often enough for
the stat to matter, and no amount of curve-fixing changes a 1.6% usage rate. The consolidation
candidates from the first version of this document stand, on that basis alone.

---

### The mid-level hump

Setting winner difficulty per shot fixed the ordering at the top of the range but left a hump in
the middle: at L≈40 every shot landed between 16% and 28% winners, so shot choice stopped mattering
in the middle of the range.

The cause was `MINIMUM_WINNER_THRESHOLDS` having only three values (50/55/60). At L=40 a player
produces ~36 quality, so all three floors bind, and with a flat winner sigmoid a shot 17 points
under its midpoint still wins 24% of the time — every shot converged on the same rate.

Swept steepness from 0.05 to 0.16 against a target curve for all twelve shot families. **Steepness
is not the lever** — total fit error moved from 315 to 271 across that entire range, and the best
value (0.08) is barely different from the shipped 0.07. Fitting the floors per shot at the
unchanged 0.07 matches the best steepened fit (mean absolute error 2.39pp either way). So the
deliberate flatness stays and the floors carry the differentiation.

Winner rate at L=40, before and after:

| | overhead | power | passing | volley | drop | angle | forehand | approach | slice | lob | def. slice | return |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | 24.3 | 28.1 | 28.0 | 23.4 | 28.0 | 23.8 | 24.3 | 23.2 | 18.1 | 16.4 | 17.4 | 3.3 |
| after | 23.4 | 18.9 | 15.8 | 15.8 | 12.7 | 10.5 | 4.8 | 2.8 | 1.3 | 0.7 | 0.6 | 1.2 |

Spread at L=40 goes from about 12 points to 22.8. At L=20 everything stays between 0.1% and 6.8%.

### Making the floor follow the opponent

The floors above are absolute constants, which reintroduces the problem in a new place: shot quality
rises roughly with the stat while a fixed floor does not, so the floor acts as a step and the shot
economy changes character with level. Against a same-level opponent a forehand went from 1.2%
winners at level 20 to 23.4% at level 85 — good play at 25 and a different game at 60.

Scaling the floor fully with the opponent is the opposite failure: a same-level opponent's retrieval
rises in step with the shooter's quality, the two cancel, and progression flattens. So
`WINNER_FLOOR_RETRIEVAL_WEIGHT` blends between them, anchored to the **opponent's** speed and
defensive stats only — never the shooter's, never the two-player average — so improving your own
stats can never raise your own winner bar.

At 0.35, winners as a share of points: 5.3% for a new player, 16.6% for Jordan, 30.5% at uniform 70,
against 2.0 / 13.2 / 36.7 with a fixed floor. Per-shot the character steadies: forehand winners by
level (20/30/40/60/85) go from 1.2/2.5/4.9/18.9/23.4 to roughly 6.5/7.4/8.2/11.4/20.0 at weight 0.5.

Progression is still paid, and paid earlier. Against a **pinned** level-30 opponent a forehand goes
from 3.5% to 89.7% winners as the shooter climbs 20 to 85, ahead of the 1.1% to 74.0% a fixed floor
gives.

### A measurement error worth recording

Every per-shot curve in this document before this section used an opponent who tracked the shooter's
level. The opponent's `speed` and `defensive` feed `OPPONENT_STAT_ADJUSTMENTS`, so the bar rose at
the same time as the shot and the curves showed the two netted against each other. `shotCurve.ts`
now takes `OPP=<level>` to pin the opponent. The difference is not small: a forehand at level 85
reads 22.5% winners against a same-level opponent and 73.8% against a pinned level-30 one. Both are
real, but they answer different questions — what a match at level L looks like, versus what
improving buys you against a given opponent.

The side effect is fewer winners overall in the 25-50 band — as a share of points, Jordan (46) goes
from 34.2% to 13.2%. `WINNER_FLOOR_OFFSET` is the dial for that, and it does not disturb the
ordering; see its note for the measured curve at 0, −6 and −12.

---

## 9. Open questions

- **Where the winner curve should sit.** The floor table fixes which shots end points; the overall
  rate is `WINNER_FLOOR_OFFSET`, currently 0, giving 2.0% of points for a new player and 13.2% for
  Jordan. −12 gives 4.5% and 22.3%. This is a game-feel call rather than a measurement.
- **The top of the range is compressed.** `TOTAL_MODIFIER_CAPS.rally = 1.25` binds for most shots
  from L=60 up, so quality saturates near 99 and OVR 85 plays much like OVR 100. Not urgent while
  content stops at tier 1, but it caps what tier 3/4 can feel like.
- **The first serve still owes level less than it could.** It climbs now, but `SERVE_BASELINE`'s
  midpoint is still a fixed ratio of `overallRating`, so an unrelated stat still nudges a player's
  own serve-in bar. Comparing the accuracy roll against expected accuracy would remove that.
  `SERVE_BASELINE`'s comments also still quote figures ("~62% first serves in", "~4-6% DFs") that
  only hold near OVR 70.
- **Mismatch severity is now a deliberate choice.** Centering and the floor change both widened it
  — a new player takes 6.8% of points off Jordan, down from 14.5%. Accepted as correct for a
  20-point rating gap, but it is now a design decision rather than a side effect of miscalibrated
  constants.
- **Consolidation.** Still plausibly right on frequency grounds. Worth re-deciding against section
  8 rather than the withdrawn tax argument.
