# Identity drift: proposals

**Status:** proposal, measured, nothing applied. Every engine change below is a config value,
reproducible in memory with `tuneRun`; every economy change is a `careerSim` switch.
Diagnosis: [`research/identity-drift.md`](../research/identity-drift.md).

**Measurement baseline.** The engine as of the progression stack (#135-#144). Career builds:
`careerSim BUILDS=` (20 careers per identity, flat pay, focus from day 41). Matches: the
identity's mean build against the common opponent (the five Club team-match shapes moved to the
day's mean OVR, with that season's specialty tier), N=120 best of three per cell, so ± about 1
point-win. "Spread" is the strongest identity's point-win minus the weakest's. The days are
Club TM5 (31), Regional TM3 (64), Tour TM3 (104) and World TM3 (144).

## The problem in one table

| day         | big server | counter | net rusher | baseliner | spread |
| ----------- | ---------- | ------- | ---------- | --------- | ------ |
| 31 Club     | 50.7       | 52.4    | 54.3       | 49.6      | 4.7    |
| 64 Regional | 53.3       | 49.5    | 68.2       | 41.0      | 27.2   |
| 104 Tour    | 47.5       | 49.3    | 74.5       | 35.9      | 38.6   |
| 144 World   | 37.8       | 52.0    | 76.0       | 42.8      | 38.2   |

Club is fine. Each season after it opens the gap further. **Goal:** keep the Tour and World
spread inside about 15 (a bad matchup, not a wall) without moving Club.

## Recommendation

Apply P1 and P2 together, ship P5 alongside them, and follow up with P3, P4 and P6 in that
order:

| #   | proposal                                       | kind    | measured effect                                                                                        | Club        |
| --- | ---------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| P1  | Returns are groundstrokes (return composite)   | config  | baseliner break 33 → 62% on the Tour; spread 38.6 → 27.1                                               | unchanged   |
| P2  | Bound specialty amplification (`excessCap` 15) | config  | with P1: spread 22.9 Tour, 22.2 World                                                                  | 9/9 on band |
| P3  | Trim speed and anticipation support            | config  | with P1+P2: spread 17.5 Tour, 19.9 World                                                               | 9/9 on band |
| P4  | Give groundstrokes a job at high level         | engine  | target: groundstroke curve on the Tour as steep as at Club                                             | to measure  |
| P5  | Show the player where points go                | UI      | contest bars predict hold (r 0.81) and break (r 0.86); a sim tip is right 7/8 only when one stat leads | —           |
| P6  | OVR weights from measured value                | config  | OVR v point-win r −0.66 → +0.82 (in-sample)                                                            | re-measure  |
| —   | Serve and return pricing or grants (economy)   | economy | absorbed by the build shape: +0 to +5.6 (ceiling +7.8)                                                 | —           |

The combined package (P1 + P2 + P3) takes the spread from 4.7 / 27.2 / 38.6 / 38.2 to
**2.0 / 16.5 / 17.5 / 19.9** and keeps every Club story opponent on band. The net rusher is still
first by 10-15; that remainder is P4's job (see "What's left").

---

## P1. Returns are groundstrokes

**Change.** `RETURN_COMPOSITE_WEIGHTS` from return 0.5, anticipation 0.25, speed 0.15, slice 0.1
to **return 0.3, forehand 0.15, backhand 0.15, anticipation 0.15, speed 0.15, slice 0.1**. A
return is a forehand or backhand hit off a serve. Today the composite ignores both, so a
baseliner with 86 groundstrokes returns like a 53.

**Why it is the first lever.** Grants and pricing for serve and return get absorbed (see
"Economy" below). This changes what the stats a player already buys are worth, so it can't be
absorbed.

| day | baseliner break %, today → P1 | baseliner point-win | net rusher point-win | spread      |
| --- | ----------------------------- | ------------------- | -------------------- | ----------- |
| 31  | 50.6 → 59.5                   | 49.6 → 51.9         | 54.3 → 54.1          | 4.7 → 3.7   |
| 64  | 33.7 → 60.2                   | 41.0 → 47.6         | 68.2 → 65.2          | 27.2 → 19.3 |
| 104 | 33.0 → 61.9                   | 35.9 → 43.3         | 74.5 → 70.4          | 38.6 → 27.1 |
| 144 | 48.9 → 66.2                   | 42.8 → 46.8         | 76.0 → 73.2          | 38.2 → 33.5 |

Two milder weightings were measured too. One moves 0.075 each from return to forehand and
backhand (Tour spread 36.4). The other also takes 0.05 from anticipation (spread 28.7). The full
version is the one that moves the needle.

## P2. Bound specialty amplification

**Change.** `SPECIALTY_AMPLIFY.excessCap` 15: a specialty amplifies at most 15 points of stat
above 30, so its boost tops out at +7.5 / +11 / +15 by tier. Today the boost is
`byTier × (stat − 30)` with no ceiling: about +7 at Club, up to +50 on the Tour. It pins return
quality at 100, and return quality decides breaks.

| package            | 31  | 64   | 104  | 144  |
| ------------------ | --- | ---- | ---- | ---- |
| P1                 | 3.7 | 19.3 | 27.1 | 33.5 |
| P1 + cap 15        | 3.2 | 15.9 | 22.9 | 22.2 |
| P1 + cap 10        | 5.9 | 9.2  | 19.8 | 20.7 |
| (no amplification) | 7.6 | 13.0 | 19.3 | 23.4 |

**Cap 15, not 10.** Cap 10 starts to move Club: the big server goes 50.7 → 48.4 on day 31, and the
Club spread 4.7 → 5.9. Cap 15 leaves Club alone and gets most of cap 10's gain on the Tour.

**Club check** (`bandCheck`, N=60, effective OVR v target): all 9 Club story opponents stay on
band under P1+P2. Chet and Martia actually move from +2.4/+2.6 over to on band. The practice
roster stays within ±2.9, as today.

After P1+P2 the return paths are worth about the same for every identity (−9 to −11 point-win
when removed, from −15 to −19), and serve paths 2-5.

## P3. Trim speed and anticipation support

**Change.** Halve the support adjustments for speed, anticipation and tactics.
`OPPONENT_STAT_ADJUSTMENTS` tactics 0.12 → 0.06 and speed 0.12 → 0.06;
`SHOOTER_STAT_ADJUSTMENTS.anticipation` 0.1 → 0.05; `STAT_MODIFIER_BANDS` reactions
0.15 → 0.075, reading 0.1 → 0.05 and courtCoverage 0.1 → 0.05.

**Why.** On the Tour, speed and anticipation are the most valuable stats in the game. Each one
reaches every shot through absolute adjustments anchored at 50, and they're the net rusher's key
stats. Setting the net rusher's speed to the four-identity average costs it 6.1 point-win, and
its anticipation 5.3. Raising the baseliner's speed gains 9.2. The baseliner's speed curve runs
29.9 → 55.3 point-win from 30 to 100, against +3.6 for forehand and backhand together.

| package      | 31  | 64   | 104  | 144  | net rusher (104) | counter (104) |
| ------------ | --- | ---- | ---- | ---- | ---------------- | ------------- |
| P1 + P2      | 3.2 | 15.9 | 22.9 | 22.2 | 66.7             | 47.7          |
| P1 + P2 + P3 | 2.0 | 16.5 | 17.5 | 19.9 | 63.3             | 45.8          |

**Cost.** The counter also buys speed and anticipation, so it slips about 2. Club stays on band
(9/9). Halving is the only setting measured; sweep 0.6-0.8× before shipping. Also measured: the
rushed-shot multiplier (`RUSHED_SHOT.floor` 0.6 → 0.8) made no difference.

## P4. Give groundstrokes a job at high level

**Measured.** On the baseliner's own build, setting forehand and backhand together from 30 to 100
moves point-win by **+11.0 at Club and +3.6 on the Tour**, flat from 50 up. Over the same range,
serve moves it +19.0 and speed +25.4. Groundstroke specialties are worth about 0 at every tier.

On the Tour 80% of points end within four shots, and the baseliner already wins 57% of its
rallies. So the cheapest place for groundstrokes to matter is the first ball after the serve or
return, where points are actually decided. P1 does some of that for the return. The serve +1 is
the open part.

**Proposal.** Investigate before changing anything. First find why the forehand curve goes flat
above 50 (the quality ceiling was tested and isn't it: lifting it changed nothing). Then give each
groundstroke specialty an effect on the serve +1 or return +1 ball. Target: the Tour groundstroke
curve at least as steep as at Club, and groundstroke paths worth 3+ point-win when removed.

## P5. Show the player where the points go

The answer to "why am I losing?" exists in the engine. Today the results screen scores each area
against fixed ranges (first serves in mapped from 40-75%, return points won from 25-50%). That
says how you did against a fixed bar, not against this opponent, and never which part of your
game lost it. Three ideas, measured for whether they'd tell the truth:

**a. Contest bars (recommended).** Two head-to-head bars on the pre-match screen and again on the
results screen. On the pre-match screen: your serve against their return, and your return against
their serve, from the composites the engine uses (`getStatForShot('serve_first')` and
`getReturnComposite()`). On the results screen: the points actually won on serve and on return,
next to those bars. They're cheap (no simulation) and they predict the match:

| relationship (16 builds: 4 identities × 4 days)              | r         |
| ------------------------------------------------------------ | --------- |
| your serve composite − their return composite → your hold %  | **0.81**  |
| your return composite − their serve composite → your break % | **0.86**  |
| serve gap + return gap → your point-win                      | 0.68      |
| your OVR − the field's mean OVR → your point-win             | **−0.66** |

A red "your return v their serve" bar points at return, speed and anticipation without saying
so: it's the comparison CLAUDE.md asks for ("show comparisons, don't describe them"). On the
Development screen, the same two bars can preview a purchase (before → after), so buying speed
visibly moves the return bar.

**b. Where the points went.** On the results screen, split the points lost by phase (on your
serve, on your return, in rallies, at the net), each against this opponent's share rather than a
fixed standard. It's all in the match's own point records (point type, server, shots, court
position). It tells the player which phase lost the match; the contest bars say which side of
their game that phase depends on.

**c. A coach's read from simulation (only when it's sure).** After a loss, re-simulate the
matchup with more of each stat and name the one that would have helped most. Measured against a
300-match ground truth, 8 trials per budget, at about 10 ms per best of three in Node:

| counterfactual | matchup                        | budget per stat | #1 is a true top-3 stat | top-3 overlap |
| -------------- | ------------------------------ | --------------- | ----------------------- | ------------- |
| +5             | Club baseliner v Olivia        | 10-40 matches   | 3-4 of 8                | 0.9-1.3 of 3  |
| +5             | Tour baseliner v Tour practice | 10-40 matches   | 2-4 of 8                | 1.0-1.5 of 3  |
| +15            | Club baseliner v Olivia        | 10-40 matches   | 4-5 of 8                | 1.0 of 3      |
| +15            | Tour baseliner v Tour practice | 20 matches      | **7 of 8**              | 2.0 of 3      |

A +5 read is noise. A +15 read is right when one stat clearly leads (on the Tour, serve +6.3
against the next best +3.6) and a coin flip when several are close (at Club, return +6.2,
anticipation +5.3 and serve +4.8). So: run it in a worker after a loss (14 stats × 20 matches is
about 3 seconds), and show a tip only when the leading stat beats the second by a clear margin.
Otherwise show nothing. That's honest, and it stays as a hint, not an instruction. a and b need
no simulation and should come first.

## P6. OVR weights from measured value

OVR weights a stat by category: core 0.09 each, stamina and strength 0.083, anticipation and
tactics 0.05. Weighting by what +5 is measured to be worth (the mean of the `value` tables on days
64, 104 and 144) gives:

| stat         | today | by value |
| ------------ | ----- | -------- |
| speed        | 0.083 | 0.150    |
| anticipation | 0.050 | 0.141    |
| return       | 0.090 | 0.137    |
| serve        | 0.090 | 0.099    |
| tactics      | 0.050 | 0.087    |
| placement    | 0.050 | 0.078    |
| slice        | 0.050 | 0.074    |
| forehand     | 0.090 | 0.045    |
| spin         | 0.050 | 0.044    |
| focus        | 0.050 | 0.044    |
| strength     | 0.083 | 0.043    |
| backhand     | 0.090 | 0.031    |
| stamina      | 0.083 | 0.015    |
| net          | 0.090 | 0.014    |

On the same 16 builds, OVR relative to the field tracks point-win at r = **−0.66 today** and
**+0.82 by value**. That's in-sample: the weights come from these builds' own value tables. It's
still the right direction.

**Don't apply it before P1-P4.** Weights fitted to today's lopsided values would make OVR read the
imbalance faithfully instead of fixing it. Refit after the engine changes. OVR also feeds the
engine (`getMatchLevel` sets every quality threshold, and OVR is 40% of ace resistance), so a
reweight needs a `bandCheck` re-run of every roster.

## Economy: why pricing and grants don't fix this alone

careerSim models a player who builds toward a shape: key stats about 2.5 times as fast as the
rest. Three mechanisms for keeping serve and return up, measured on the Tour (day 104,
baseliner):

| mechanism                                                | serve / return | baseliner point-win |
| -------------------------------------------------------- | -------------- | ------------------- |
| today                                                    | 45 / 48        | 35.9                |
| catch-up pricing (cheapest step while 15 behind)         | 45 / 46        | 34.6                |
| match sharpness, 0.5 per match, while 15 behind          | 47 / 49        | 35.2                |
| match sharpness, 1 per match, while 10 behind            | 56 / 58        | 41.5                |
| the player keeps them up (`FUND_W` 0.7-0.9; upper bound) | 70 / 68        | 43.7                |

Free or cheap serve and return points replace points the player would have bought. Only a
mechanism strong enough to push past the player's own shape gets through. In the real game the
shape is a person's choice, and the strongest lever on that choice is P5: show them that serve
and return are where they lose. P1 makes the baseliner's own stats count for the return, which
does what a grant would without fighting the player.

## What's left

With P1+P2+P3 the net rusher is still 10-15 clear on the Tour and World (63-65 point-win against
46-53). Its key stats feed both the serve (serve, placement) and the return composite (speed,
anticipation). Its chip-and-charge is not the cause: switching chip-and-charge off costs it about 2. P4 should narrow this, because the identities it beats are the ones whose investment
(groundstrokes) is under-paid. Re-measure after P4 before touching the net rusher directly.

Untested: stamina (worth about 0 in every best of three measured) may matter in World's best of
five; measure it there.

## Reproducing

```
P1='RETURN_COMPOSITE_WEIGHTS.return=0.3;RETURN_COMPOSITE_WEIGHTS.forehand=0.15;RETURN_COMPOSITE_WEIGHTS.backhand=0.15;RETURN_COMPOSITE_WEIGHTS.anticipation=0.15;RETURN_COMPOSITE_WEIGHTS.speed=0.15'
P2='SPECIALTY_AMPLIFY.excessCap=15'
P3='OPPONENT_STAT_ADJUSTMENTS.tactics=0.06;OPPONENT_STAT_ADJUSTMENTS.speed=0.06;SHOOTER_STAT_ADJUSTMENTS.anticipation=0.05;STAT_MODIFIER_BANDS.reactions=0.075;STAT_MODIFIER_BANDS.reading=0.05;STAT_MODIFIER_BANDS.courtCoverage=0.05'
TUNE="$P1;$P2;$P3" PROBE=driftProbe H2H=0 DAYS=104 SECTIONS=who N=120 npx tsx src/test/analysis/tuneRun.ts
TUNE="$P1;$P2" PROBE=bandCheck ONLY=club- N=60 npx tsx src/test/analysis/tuneRun.ts
SHARPEN=1,10 BUILDS=/tmp/sharpen.json RUNS=20 npx tsx src/test/analysis/careerSim.ts
CATCHUP=15 BUILDS=/tmp/catchup.json RUNS=20 npx tsx src/test/analysis/careerSim.ts
BUILDS_FILE=/tmp/sharpen.json H2H=0 DAYS=104 SECTIONS=who npx tsx src/test/analysis/driftProbe.ts
STATS=serve,speed,anticipation H2H=0 DAYS=104 SECTIONS=stats npx tsx src/test/analysis/driftProbe.ts
IDS=baseliner CURVE=forehand+backhand,serve,speed DAYS=31,104 SECTIONS=curve N=150 \
  npx tsx src/test/analysis/driftProbe.ts                        # P4's curves
H2H=0 DAYS=31,64,104,144 SECTIONS=who npx tsx src/test/analysis/driftProbe.ts  # P5a's r values
DAY=104 BUMP=15 npx tsx src/test/analysis/coachReadProbe.ts         # P5c
DAY=31 BUMP=5 npx tsx src/test/analysis/coachReadProbe.ts
```

P6's weights are the mean of `SECTIONS=value` on days 64, 104 and 144 (gains below 0 counted as
0, maxed stats left out), normalised to sum to 1.
