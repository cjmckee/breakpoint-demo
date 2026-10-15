# Identity drift: proposals

**Status:** proposal, measured, nothing applied. Every engine change is a config value, off by
default, reproducible with `tuneRun`. Diagnosis: [`research/identity-drift.md`](../research/identity-drift.md).

## Direction

1. **OVR tracks the chance to win.** It's the yardstick progression is balanced against (bands,
   `bandCheck`, rosters), so a higher OVR should mean a better player whatever the build.
2. **Core stats carry the most weight**, in the sim and so in OVR. Serve and return help every
   player and rise with every good player. A baseliner and a big server both live on core
   stats, just different ones.
3. **Support stats matter, in proportion.** Speed and anticipation can be important. They
   shouldn't be worth ten times a forehand.

## The measure

`statLadder` plays random pairings at each level of the career (every stat uniform in the band,
specialties to the season's cap, authored opponents at the season's tier) and fits point-win
margin on all 14 stat differences at once. Each stat's coefficient is what +10 of it is worth
with the others held equal. Two numbers summarise a band:

- **OVR fit:** how much of the predictable result OVR explains, as a share of what the 14 stats
  explain together. 100% means OVR is as good a predictor as the full stat line.
- **Core / others:** the mean value of a core stat against the mean of the rest.

N=6000-8000 pairings per band, so ±0.35-0.45 point-win per stat. The bands are Club U(25,50), Regional
U(40,70), Tour U(55,85) and World U(65,95).

## Today

| point-win per +10 | Club        | Regional    | Tour        | World           |
| ----------------- | ----------- | ----------- | ----------- | --------------- |
| serve             | 3.36        | 5.75        | 3.73        | 1.62            |
| forehand          | 1.60        | 0.84        | **0.41**    | **0.08**        |
| backhand          | 1.22        | 0.56        | **0.18**    | **0.25**        |
| return            | 3.63        | 4.30        | 3.57        | 1.46            |
| net               | 1.12        | 0.86        | 0.57        | 0.96            |
| slice             | 1.52        | 1.66        | 1.47        | 2.35            |
| spin              | 1.63        | 1.89        | 1.62        | 1.41            |
| placement         | 1.28        | 1.63        | 1.41        | 3.20            |
| speed             | 2.97        | 3.34        | 4.36        | **4.97**        |
| stamina           | 1.04        | 0.23        | −0.01       | 0.20            |
| strength          | 1.75        | 2.34        | 1.68        | 0.66            |
| focus             | 2.16        | 2.59        | 1.71        | 1.68            |
| anticipation      | 3.76        | 4.24        | 3.31        | 2.59            |
| tactics           | 1.90        | 2.57        | 1.45        | 2.38            |
| **core / others** | 2.19 / 2.00 | 2.46 / 2.28 | 1.69 / 1.89 | **0.87 / 2.16** |
| **OVR fit**       | 76%         | 63%         | 59%         | **50%**         |

OVR asks for core ×1.47 the rest. The sim gives ×1.1 at Club and ×0.4 at World. By World,
speed is worth sixty times a forehand, and OVR explains half of what the stats do.

## Why: five mechanisms

Measured on uniform players with `rallyMixProbe` unless noted.

1. **Support stats are measured from an absolute 50.** The bands (`statModifier`), the threshold
   adjustments, rushed balls and focus under pressure all read `stat − 50`. At Club every stat is
   below 50, so they're small penalties both players share. On the Tour they're large bonuses
   that keep growing with the career, while a primary stat's effect doesn't.
2. **Support bands multiply quality.** The same ±10% band moves an 80-quality shot twice as far
   as a 40 one. A primary stat adds the same points at any level. So every band's value doubles
   from Club to Tour by construction.
3. **The shot selector goes defensive at high level.** A ball at or above `thresholds.high`
   (`matchLevel + 5`) forces a defensive slice or a lob. Because of 1 and 2, quality outgrows the
   level: a uniform-40 player's rally shots come out at about 37, a uniform-80 player's at 86-88.
   At level 80 the rally mix is **0.83 lobs and 0.68 defensive slices per point** against 0.25
   and 0.14 at level 40. Those shots read placement and slice, not forehand or backhand.
4. **Specialty amplification pins groundstrokes at the ceiling.** `byTier × (stat − 30)` with no
   cap turns a tier III forehand of 85 into 140, so more forehand changes nothing.
5. **Speed and anticipation reach every shot through up to six channels:** the return composite,
   threshold adjustments, two bands, rushed balls, and the volley, lob, passing, angle and
   drop composites. Forehand reaches only the drives it's chosen for.

Proof that 1-3 are what kills the forehand: at level 80, +15 on both groundstrokes is worth +0.8
point-win today and **+6.4** with fix A alone (speed +15: +5.4 → +8.1).

## The package

Five changes. Club is left alone wherever a change can be gated on level. Each row adds to the
one above.

| step | change                                                                                          | OVR fit Club / Regional / Tour / World |
| ---- | ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| —    | today                                                                                           | 76 / 63 / 59 / 50%                     |
| A    | support stats measured from the match level above 50 (`SUPPORT_NEUTRAL.followLevelFrom` 50)     | 76 / 62 / 64 / 59%                     |
| B    | + specialty amplification capped at 15 of excess; returns read forehand and backhand            | 82 / – / 69 / –                        |
| C    | + speed, anticipation and tactics adjustments and bands halved                                  | 84 / – / 74 / –                        |
| D    | + support bands narrow with level (`SUPPORT_NEUTRAL.scaleBands` 1), focus included              | 84 / 75 / 78 / 77%                     |
| E    | + OVR weights by measured value, core heaviest (`STAT_CATEGORY_WEIGHTS`, `STAT_WEIGHTS_WITHIN`) | **94 / 94 / 93 / 95%**                 |

In detail:

- **A. Support stats measured from the match level.** Below a match level of 50 (all of Club),
  nothing changes. Above it, every support stat counts by how far it sits above or below the level
  being played. Fixes 1 and, with D, 2 and 3.
- **B. Specialty cap and groundstroke returns.** `SPECIALTY_AMPLIFY.excessCap` 15: Club players
  sit within 18 of 30, so this barely touches Club. `RETURN_COMPOSITE_WEIGHTS`: return 0.5 → 0.3,
  forehand 0 → 0.15, backhand 0 → 0.15, anticipation 0.25 → 0.15, speed 0.15, slice 0.1. A return
  is a forehand or backhand off a serve.
- **C. Support trim.** `OPPONENT_STAT_ADJUSTMENTS` tactics and speed 0.12 → 0.06,
  `SHOOTER_STAT_ADJUSTMENTS.anticipation` 0.1 → 0.05, `STAT_MODIFIER_BANDS` reactions
  0.15 → 0.075, reading 0.1 → 0.05 and courtCoverage 0.1 → 0.05. This is your P3 direction.
- **D. Bands narrow with level.** Above the neutral point, a support band's effect is scaled by
  50 / neutral, so in points of quality it stays what it is at 50. The same goes for focus under
  pressure, stamina in long rallies, focus's momentum mitigation and rhythm steadiness.
- **E. OVR weights** (sum 1):

  | stat         | today | proposed |
  | ------------ | ----- | -------- |
  | serve        | 0.09  | 0.12     |
  | forehand     | 0.09  | 0.09     |
  | backhand     | 0.09  | 0.08     |
  | return       | 0.09  | 0.09     |
  | net          | 0.09  | 0.04     |
  | slice        | 0.05  | 0.05     |
  | spin         | 0.05  | 0.05     |
  | placement    | 0.05  | 0.05     |
  | speed        | 0.083 | 0.08     |
  | stamina      | 0.083 | 0.03     |
  | strength     | 0.083 | 0.07     |
  | focus        | 0.05  | 0.08     |
  | anticipation | 0.05  | 0.08     |
  | tactics      | 0.05  | 0.09     |
  | **core**     | 0.45  | **0.42** |

  As config: category weights core 0.42, technical 0.15, physical 0.18 and mental 0.25, split
  within each category by `STAT_WEIGHTS_WITHIN`: serve 12, forehand 9, backhand 8, return 9 and
  net 4; speed 8, stamina 3 and strength 7; focus 8, anticipation 8 and tactics 9; technical
  even. These are the measured values under A-D (the mean over the four bands), rounded with core
  kept heaviest. The unrounded fit scores 96-99%; the rounding costs 1-3 points of fit. **Net**
  is worth little except to players who come forward, and **stamina** almost nothing in best of
  three, so both drop. OVR feeds the engine (match level, 40% of ace resistance), so E is measured
  in the sim, not just re-scored.

### After the package

| point-win per +10 | Club        | Regional    | Tour        | World       |
| ----------------- | ----------- | ----------- | ----------- | ----------- |
| serve             | 3.58        | 4.67        | 4.31        | 3.53        |
| forehand          | 2.80        | 1.94        | 2.12        | 2.22        |
| backhand          | 2.54        | 1.62        | 1.76        | 1.76        |
| return            | 2.43        | 2.23        | 2.37        | 2.12        |
| net               | 1.21        | 0.60        | 0.52        | 0.72        |
| slice             | 1.62        | 1.49        | 1.31        | 1.42        |
| spin              | 2.06        | 1.72        | 1.92        | 1.17        |
| placement         | 1.58        | 1.83        | 1.84        | 1.55        |
| speed             | 2.38        | 2.70        | 2.59        | 3.03        |
| stamina           | 0.64        | 0.66        | 0.19        | 0.45        |
| strength          | 1.72        | 1.97        | 2.84        | 2.07        |
| focus             | 1.97        | 2.40        | 3.03        | 2.94        |
| anticipation      | 2.56        | 2.59        | 2.47        | 2.49        |
| tactics           | 1.59        | 2.81        | 2.37        | 2.90        |
| **core / others** | 2.51 / 1.79 | 2.21 / 2.02 | 2.21 / 2.06 | 2.07 / 2.00 |
| **OVR fit**       | **94%**     | **94%**     | **93%**     | **95%**     |

The correlation between a stat's value and its OVR weight goes from 0.04 / −0.05 / −0.02 / −0.42
to **0.86 / 0.88 / 0.87 / 0.90**. Speed and anticipation sit at 1.1-1.4 times forehand, no longer
5-60 times. Serve is the most valuable stat at every level.

### Checks

- **Club.** `bandCheck`: all 9 Club story opponents stay on band (today 7). Two practice
  opponents read +2.6 and +2.8 over, as they did before (±2.9). The Club identity spread is 3.9
  (today 4.7).
- **Identities** (`driftProbe`, career builds, the gap between the best and worst identity's
  point-win):

  | day         | big server | counter | net rusher | baseliner | spread      |
  | ----------- | ---------- | ------- | ---------- | --------- | ----------- |
  | 31 Club     | 50.1       | 48.3    | 52.2       | 49.1      | 4.7 → 3.9   |
  | 64 Regional | 54.4       | 46.8    | 62.3       | 50.3      | 27.2 → 15.5 |
  | 104 Tour    | 53.9       | 45.6    | 65.3       | 49.9      | 38.6 → 19.7 |
  | 144 World   | 54.0       | 42.1    | 64.4       | 51.7      | 38.2 → 22.3 |

  The baseliner is fixed: 36 → 50 point-win on the Tour. The counter is now last and the net
  rusher still first. See "What's left".

- **Tests.** `npm test` passes with every switch at its default.

## What's left: specialties

With the package, OVR explains 93-95% of what the stats do. Measured on the identities' own
builds, though, it explains much less (correlation 0.29). The rest is the specialty layer. On the
Tour (day 104), without any specialties the identities sit at 43.8 (big server), 34.0 (counter),
35.3 (net rusher) and 31.1 (baseliner). Their packages then add 10, 12, **30** and 19.

| point-win lost when one path is removed (Tour)      | value     |
| --------------------------------------------------- | --------- |
| return paths (extinguisher, sneaky beaky, redliner) | 10-13     |
| first serve (bomber)                                | 5.5-6.8   |
| net (downhill)                                      | 5.4       |
| second serve (kicker)                               | 1.9-3.8   |
| forehand (laserbeam, survivor)                      | 0-2.9     |
| backhand (bazooka, samurai), net apologist          | −0.3 to 3 |

The net rusher has specialised the four most valuable phases; the counter has one valuable phase
and three cheap ones. **Next proposal:** bring specialty phases toward parity. Each path at a
given tier should be worth about the same (target: 5-8 at tier III), by tuning each path's
`tierEffects` and amplification share, measured with `driftProbe SECTIONS=paths`. This is a
separate pass with its own data, not part of this package.

## Follow-ups the package needs

- **Re-fit the Regional, Tour and World practice rosters** (`bandCheck FIT=1`). Their stat blocks
  were fitted to today's engine.
- **Re-run `careerSim PAR=1`.** The season bands (§2.2 of the progression proposal) are in OVR
  terms, and OVR's weights change.
- **Stamina's job.** It's worth about nothing in best of three at every level. Measure best of five
  (the World finale) and heat venues before deciding whether it needs more weight in the sim or
  less in OVR. E already gives it 0.03.
- **Net.** It's worth little except to net players. That's arguably right; OVR now says so (0.04).

## Player feedback (unchanged from the first version)

These were measured on today's sim; re-measure after the package.

- **Contest bars.** Your serve against their return, and your return against their serve, from the
  composites the engine uses. They predict hold (r 0.81) and break (r 0.86), while OVR predicted
  point-win at r −0.66 across identities. Show them before and after a match, and as a
  before → after preview on the Development screen.
- **Where the points went.** Points lost by phase (on serve, on return, in rallies, at the net),
  against this opponent rather than the results screen's fixed ranges.
- **A simulated tip, only when sure.** +15 counterfactuals name a true top-3 stat 7 times in 8
  when one stat clearly leads (Tour), and are a coin flip when several are close (Club). Show one
  only when the leading stat clearly beats the next.

## Economy (unchanged): why grants and pricing alone don't fix drift

A player who builds toward a shape absorbs free or cheap serve and return points: they stop
buying what they were given. On the Tour, the baseliner's point-win was 35.9 today, 34.6 with
catch-up pricing, 35.2 with gentle match sharpness, 41.5 with strong sharpness, and 43.7 if the
player simply keeps serve and return up. The package does better (49.9) by making the stats the
baseliner already buys count.

## Reproducing

```
npx tsx src/test/analysis/statLadder.ts                        # today, all bands
PKG='SUPPORT_NEUTRAL.followLevelFrom=50;SPECIALTY_AMPLIFY.excessCap=15;RETURN_COMPOSITE_WEIGHTS.return=0.3;RETURN_COMPOSITE_WEIGHTS.forehand=0.15;RETURN_COMPOSITE_WEIGHTS.backhand=0.15;RETURN_COMPOSITE_WEIGHTS.anticipation=0.15;RETURN_COMPOSITE_WEIGHTS.speed=0.15;OPPONENT_STAT_ADJUSTMENTS.tactics=0.06;OPPONENT_STAT_ADJUSTMENTS.speed=0.06;SHOOTER_STAT_ADJUSTMENTS.anticipation=0.05;STAT_MODIFIER_BANDS.reactions=0.075;STAT_MODIFIER_BANDS.reading=0.05;STAT_MODIFIER_BANDS.courtCoverage=0.05;SUPPORT_NEUTRAL.scaleBands=1;STAT_CATEGORY_WEIGHTS.core=0.42;STAT_CATEGORY_WEIGHTS.technical=0.15;STAT_CATEGORY_WEIGHTS.physical=0.18;STAT_CATEGORY_WEIGHTS.mental=0.25;STAT_WEIGHTS_WITHIN.core.serve=12;STAT_WEIGHTS_WITHIN.core.forehand=9;STAT_WEIGHTS_WITHIN.core.backhand=8;STAT_WEIGHTS_WITHIN.core.return=9;STAT_WEIGHTS_WITHIN.core.net=4;STAT_WEIGHTS_WITHIN.physical.speed=8;STAT_WEIGHTS_WITHIN.physical.stamina=3;STAT_WEIGHTS_WITHIN.physical.strength=7;STAT_WEIGHTS_WITHIN.mental.focus=8;STAT_WEIGHTS_WITHIN.mental.anticipation=8;STAT_WEIGHTS_WITHIN.mental.tactics=9'
TUNE="$PKG" PROBE=statLadder N=6000 npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=driftProbe H2H=0 DAYS=31,64,104,144 SECTIONS=who npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=driftProbe DAYS=104 SECTIONS=swap,paths npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=bandCheck ONLY=club- N=60 npx tsx src/test/analysis/tuneRun.ts
OVR_W=serve:0.12,forehand:0.09,... npx tsx src/test/analysis/statLadder.ts   # score OVR weights only
LEVELS=40,80 npx tsx src/test/analysis/rallyMixProbe.ts            # mechanisms 1-3 (shot mix, +15 boosts)
TUNE='SUPPORT_NEUTRAL.followLevelFrom=50' LEVELS=80 PROBE=rallyMixProbe npx tsx src/test/analysis/tuneRun.ts
```
