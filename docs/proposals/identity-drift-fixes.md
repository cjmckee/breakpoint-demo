# Identity drift: proposals

**Status:** applied. Every engine change is a config value; the defaults are the package below,
and any step can be undone with `tuneRun` to compare. Diagnosis: [`research/identity-drift.md`](../research/identity-drift.md).

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

## Before the package ("today" below)

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

Seven changes. Club is left alone wherever a change can be gated on level. Each row adds to the
one above.

| step | change                                                                                          | OVR fit Club / Regional / Tour / World |
| ---- | ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| —    | today                                                                                           | 76 / 63 / 59 / 50%                     |
| A    | support stats measured from the match level above 50 (`SUPPORT_NEUTRAL.followLevelFrom` 50)     | 76 / 62 / 64 / 59%                     |
| B    | + specialty amplification capped at 15 of excess; returns read forehand and backhand            | 82 / – / 69 / –                        |
| C    | + speed, anticipation and tactics adjustments and bands halved                                  | 84 / – / 74 / –                        |
| D    | + support bands narrow with level (`SUPPORT_NEUTRAL.scaleBands` 1), focus included              | 84 / 75 / 78 / 77%                     |
| E    | + outcome curves and winner floors follow the level (`scaleContests`, `scaleWinnerFloors` 1)    | 93 / 91 / 91 / 92%                     |
| F    | + the net stat earns the net player's edge (approach reads more net, smaller fixed edge)        | 93 / 95 / 93 / 92%                     |
| G    | + OVR weights by measured value, core heaviest (`STAT_CATEGORY_WEIGHTS`, `STAT_WEIGHTS_WITHIN`) | **94 / 98 / 96 / 96%**                 |

E and F come from asking why net and stamina were worth so little, rather than weighing them
less in OVR. See "Net and stamina" below. Rows E and F are scored with G's weights from the
first version, rows A-D with today's.

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
- **E. Contests and winner floors follow the level.** Above the neutral point, every outcome
  curve's steepness is scaled by 50 / neutral (`SUPPORT_NEUTRAL.scaleContests`), and so is the
  fixed part of every winner floor, the 65% that `WINNER_FLOOR_RETRIEVAL_WEIGHT` leaves absolute
  (`scaleWinnerFloors`). With both, an even match at level 80 is a scaled copy of one at 50:
  qualities, bars and the gaps between them all grow by the same factor, and the curves read the
  gaps in proportion. Contests alone shorten high-level rallies (4.1 → 3.4 shots a point at level 80) and stamina loses its job again. The floors bring the rallies back (3.9) because winners
  stop coming easier as the career goes on.
- **F. Net earns its edge.** `SHOT_COMPOSITE_WEIGHTS.approach` reads net 0.35 → 0.5 (wing
  0.5 → 0.4, placement 0.15 → 0.1). The passer's fixed at-net difficulty
  (`DIFFICULTY_SCORE_FACTORS.opponentPosition.at_net`) 8 → 0, and the volleyer's own coverage
  (`OPPONENT_STAT_ADJUSTMENTS.netCoverage`) 0.2 → 0.6, so more of the bar the pass faces comes
  from the net player's rating and less from standing there.
- **G. OVR weights** (sum 1), refit on the sim after A-F:

  | stat         | today | first version | proposed |
  | ------------ | ----- | ------------- | -------- |
  | serve        | 0.09  | 0.12          | 0.144    |
  | forehand     | 0.09  | 0.09          | 0.072    |
  | backhand     | 0.09  | 0.08          | 0.062    |
  | return       | 0.09  | 0.09          | 0.082    |
  | net          | 0.09  | 0.04          | 0.041    |
  | slice        | 0.05  | 0.05          | 0.050    |
  | spin         | 0.05  | 0.05          | 0.050    |
  | placement    | 0.05  | 0.05          | 0.060    |
  | speed        | 0.083 | 0.08          | 0.100    |
  | stamina      | 0.083 | 0.03          | 0.040    |
  | strength     | 0.083 | 0.07          | 0.070    |
  | focus        | 0.05  | 0.08          | 0.077    |
  | anticipation | 0.05  | 0.08          | 0.077    |
  | tactics      | 0.05  | 0.09          | 0.077    |
  | **core**     | 0.45  | 0.42          | **0.40** |

  As config: category weights core 0.40, technical 0.16, physical 0.21 and mental 0.23, split
  within each category by `STAT_WEIGHTS_WITHIN`: serve 14, forehand 7, backhand 6, return 8 and
  net 4; slice 5, spin 5 and placement 6; speed 10, stamina 4 and strength 7; mental even. These
  are the measured values under A-F (the mean over the four bands), rounded. Core is still the
  heaviest category and serve the heaviest stat. OVR feeds the engine (match level, 40% of ace
  resistance), so G is measured in the sim, not just re-scored.

### After the package

| point-win per +10 | Club        | Regional    | Tour        | World       |
| ----------------- | ----------- | ----------- | ----------- | ----------- |
| serve             | 3.85        | 4.46        | 3.50        | 3.14        |
| forehand          | 2.86        | 1.76        | 1.85        | 1.40        |
| backhand          | 2.18        | 1.88        | 1.37        | 1.41        |
| return            | 2.37        | 2.02        | 2.06        | 1.81        |
| net               | 1.60        | 1.29        | 0.70        | 1.14        |
| slice             | 1.25        | 1.54        | 0.98        | 1.33        |
| spin              | 1.77        | 1.87        | 1.24        | 1.24        |
| placement         | 1.75        | 1.83        | 1.50        | 1.86        |
| speed             | 2.67        | 2.53        | 2.50        | 2.43        |
| stamina           | 0.46        | 1.24        | 1.49        | 1.58        |
| strength          | 1.54        | 2.14        | 2.46        | 1.40        |
| focus             | 1.86        | 2.11        | 2.22        | 2.32        |
| anticipation      | 2.42        | 2.27        | 2.08        | 2.11        |
| tactics           | 1.41        | 2.38        | 2.00        | 2.43        |
| **core / others** | 2.57 / 1.68 | 2.28 / 1.99 | 1.90 / 1.83 | 1.78 / 1.86 |
| **OVR fit**       | **94%**     | **98%**     | **96%**     | **96%**     |

N=4000 pairings per band (±0.5-0.6). The correlation between a stat's value and its OVR weight
goes from 0.04 / −0.05 / −0.02 / −0.42 today to **0.84 / 0.95 / 0.92 / 0.86**. Speed and
anticipation sit at 0.9-1.7 times forehand, no longer 5-60 times. Serve is the most valuable stat
at every level. Stamina now grows with the career (0.5 → 1.6 from Club to World), as it should
when longer, harder matches come later. Core per stat beats the rest through the Tour and falls
just under it at World, where the forehand and backhand are the stats still under their weight.

## Net and stamina

The first version weighed both less in OVR because the sim paid them little. The better question
is why, and how much of it is a bug.

**Stamina was a bug.** Fatigue read absolute stamina, so by the Tour every player had enough not
to tire: end-of-match fatigue was about 0 at level 80. Measured from the match's neutral point
(D) it comes back (18 at level 80), and it took E to keep it, since flatter contests alone
shortened the rallies that make players tired. Stamina is now worth 1.2-1.6 per +10 past Club,
from 0.2-0.7. It's still the cheapest stat at Club, where best of three is short and nobody tires.

**Net is mostly how often it's used, and partly a bug.** `rallyMixProbe SECTIONS=net` traces the
player's net points: how they end, the passer's modifiers, and the net player's bars.

- **Usage.** A player with no net identity is at the net on 3-5% of points; a serve-volleyer on
  15-20%. Playstyle owns that number by design, and a stat used on one point in twenty can't be
  worth what the serve is.
- **The position did the stat's job.** At even stats, coming forward won 80-89% of net points. The
  passer's ball came out at about half their stat: fixed penalties for the opponent being at the
  net, whoever that opponent was. So −15 net cost 8-19 points of net points won and +15 added only
  4-6.
- **The overhead stopped reading the stat at high level.** At level 80 its quality hit the 100
  cap on 40-60% of swings, against a winner floor that had risen only 57 → 69 since level 40. A
  net-65 and a net-95 volleyer smashed alike. E lifts the floor with the level (91 at level 80).
- **To its users, net was already worth its keep.** For a serve-volleyer at level 80, +15 on net,
  serve or return each added about 2 points of point-win.

F moves the edge from the position to the rating, and puts more of the approach, which everyone
hits about 0.3 times a point, on the net stat. Net's mean value goes 0.58 → 1.18 per +10.
Pushing it further would mean every player coming forward more often. That's a playstyle decision,
not a tuning one, so it isn't proposed here.

## Checks

- **Club.** `bandCheck`: 8 of 9 Club story opponents stay on band (today 7). Martia Estrella
  (team match 3) reads +2.4 over, and three practice opponents +2.2 to +2.5 (today two, +2.6 and
  +2.8; the noise at N=60 is ±2.9). The Club identity spread is 2.9 (today 4.7).
- **Identities** (`driftProbe`, career builds, the gap between the best and worst identity's
  point-win):

  | day         | big server | counter | net rusher | baseliner | spread      |
  | ----------- | ---------- | ------- | ---------- | --------- | ----------- |
  | 31 Club     | 51.4       | 52.5    | 52.9       | 54.3      | 4.7 → 2.9   |
  | 64 Regional | 53.9       | 46.9    | 63.6       | 52.1      | 27.2 → 16.7 |
  | 104 Tour    | 54.8       | 46.4    | 64.8       | 49.4      | 38.6 → 18.4 |
  | 144 World   | 52.6       | 44.7    | 61.0       | 49.4      | 38.2 → 16.3 |

  The baseliner is fixed: 36 → 49 point-win on the Tour. The counter is now last and the net
  rusher still first. See "What's left". OVR against the field now predicts the identities'
  point-win at r 0.61 (today −0.66).

- **Tests.** `npm test` passes with every switch at its default.

## Specialty parity (applied)

With the package, OVR explains 93-95% of what the stats do, but on the identities' own builds the
specialty layer still decides a lot. Measured on the Tour (day 104), before this pass, the
identities' packages added 10 (big server), 12 (counter), **30** (net rusher) and 19 (baseliner).

**What a path is worth.** `specialtySynergyProbe TIER=` plays each of the 18 paths alone on an even
player at each season's level and tier, against the same player without it (N=400, ±1):

| point-win from one path       | Regional, tier II | Tour, tier III | World, tier III |
| ----------------------------- | ----------------- | -------------- | --------------- |
| return paths, before          | 7.5-10.0          | 11.1-13.2      | 9.1-10.4        |
| first serve paths, before     | 5.5-7.0           | 8.7-10.1       | 6.4-8.5         |
| forehand and backhand, before | 2.3-3.8           | 2.4-5.2        | 0.1-3.5         |
| net and second serve, before  | 1.3-3.6           | 3.6-6.6        | 2.0-5.4         |
| **every path, after**         | **2.3-6.6**       | **4.8-8.9**    | **1.7-6.3**     |

**Why they differed.** Most of a path's value is its stat boost (`SPECIALTY_AMPLIFY`), and the same
+15 on the phase stat is worth +10.2 on the return and +7.4 on the first serve, which play every
point, against +4.2-4.9 on a wing and +2.0 on net. Two paths also worked against their own boost:
Samurai levelled into more backhand slices, which read the slice stat, and Opportunist rarely hit
the volleys a net boost lands on.

**What changed.**

- `SPECIALTY_AMPLIFY.phaseWeight` scales each phase's boost by what its stat is worth: first serve
  0.61, second serve 1.1, return 0.62, forehand 1.21, backhand 1.37, net 1.5.
- Samurai's boost carries into its backhand slices (`samuraiSliceShare` 0.6), and Opportunist's into
  its approach (`opportunistApproachShare` 0.3), as the Apologist's already did into its drives.
- Tier II and III effects only, so tier I plays as before: Sneaky Beaky charges a little less as it
  levels (it was the strongest path at every tier), Samurai levels into rally tolerance rather than
  more slice, Opportunist comes in more, and Pancake's second serve gets more bite.
- Club stays on band: all nine story opponents. Three practice opponents moved more than 2 off their
  band and were refitted (James Whitfield, Nadia Volkov, Thomas Lund).

**The identities**, against the common opponent (point-win %):

| day         | big server | counter | net rusher | baseliner | spread      |
| ----------- | ---------- | ------- | ---------- | --------- | ----------- |
| 64 Regional | 54.3       | 46.0    | 61.8       | 52.4      | 16.7 → 15.8 |
| 104 Tour    | 54.1       | 46.6    | 61.0       | 50.3      | 18.4 → 14.4 |
| 144 World   | 55.3       | 45.7    | 57.5       | 53.0      | 16.3 → 11.8 |

**What's still open**, with the data:

- **The net rusher's specialties compound.** Without specialties it plays at 36.4, level with the
  counter (36.1). Its paths are worth 2-7 each on their own, but they all add to how often it comes
  forward (approach, serve-volley and chip-and-charge biases), so the package is worth 24.6. Its
  net weight is not the cause (net rusher 61.4 at weight 1.0, 62.2 at 0.7). Scaling serve-volley and
  chip-and-charge back (`NET_RUSH.serveVolleyPerBias` 5 → 3, `chipChargePerBias` 2 → 1.2) takes the
  Regional spread from 15.8 to 9.9, but it changes how Club's serve-volley opponents play, so it isn't
  applied. A softer option is to let stacked approach biases saturate, which leaves one path alone
  unchanged.
- **Stat boosts saturate on a build that already has the stat.** The baseliner's forehand and
  backhand paths are worth about 6 each on an even player, but about 1 on its own build, whose
  wings sit at 82-89: the shot is near the quality ceiling already. Paths that change behaviour keep
  paying however high the stats go.
- **The counter's build doesn't fit its paths.** It takes a forehand path (Survivor) with a forehand
  of 44, and Samurai with a slice of 51, so those two are worth under 3 together. Against Tour and
  World practice opponents it wins 15-48% while the others win 28-90%. A player who picks those paths
  would buy forehand and slice; the career model's counter does not.

## Follow-ups (done)

- **Practice rosters re-fitted** (`bandCheck FIT=1`). Four opponents played 2.3-3.1 over their
  band on the new engine (Marcus Cole, Diego Vargas, Alex Novak, James Whitfield) and were moved
  onto it. Every other practice and story opponent was already on band.
- **Pacing re-run** (`careerSim PAR=1`). The mean OVR curve moved by under a point, so the season
  bands stand. Par minus OVR per identity is now within ±3 at every day (it was −11 to +13).
- **Stamina in best of five and heat** (`statLadder FORMAT=bo5`, `HEAT=1.3`), per +10:

  | stamina                  | Club | Regional | Tour | World    |
  | ------------------------ | ---- | -------- | ---- | -------- |
  | best of three            | 0.46 | 1.24     | 1.49 | 1.58     |
  | best of five             | 1.64 | 1.70     | 2.40 | **2.92** |
  | best of three, heat ×1.3 | 1.92 | 2.79     | 3.64 | **4.21** |

  Best of five makes stamina as valuable as serve at World (2.92 against 2.94). On a hot court it
  passes serve. OVR is fitted to best of three, so it reads a World best of five a
  little less well (fit 89%) and a hot court less again (79%). That's the late-match job the
  World season was meant to give stamina, so OVR stays as it is. Venues are sized by season in
  §5.1 of the progression proposal: heat is now the strongest condition past Club.

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
PKG='SUPPORT_NEUTRAL.followLevelFrom=50;SPECIALTY_AMPLIFY.excessCap=15;RETURN_COMPOSITE_WEIGHTS.return=0.3;RETURN_COMPOSITE_WEIGHTS.forehand=0.15;RETURN_COMPOSITE_WEIGHTS.backhand=0.15;RETURN_COMPOSITE_WEIGHTS.anticipation=0.15;RETURN_COMPOSITE_WEIGHTS.speed=0.15;OPPONENT_STAT_ADJUSTMENTS.tactics=0.06;OPPONENT_STAT_ADJUSTMENTS.speed=0.06;SHOOTER_STAT_ADJUSTMENTS.anticipation=0.05;SUPPORT_NEUTRAL.scaleBands=1;SUPPORT_NEUTRAL.scaleContests=1;SUPPORT_NEUTRAL.scaleWinnerFloors=1;SHOT_COMPOSITE_WEIGHTS.approach.primary=0.4;SHOT_COMPOSITE_WEIGHTS.approach.net=0.5;SHOT_COMPOSITE_WEIGHTS.approach.placement=0.1;DIFFICULTY_SCORE_FACTORS.opponentPosition.at_net=0;OPPONENT_STAT_ADJUSTMENTS.netCoverage=0.6;STAT_CATEGORY_WEIGHTS.core=0.40;STAT_CATEGORY_WEIGHTS.technical=0.16;STAT_CATEGORY_WEIGHTS.physical=0.21;STAT_CATEGORY_WEIGHTS.mental=0.23;STAT_WEIGHTS_WITHIN.core.serve=14;STAT_WEIGHTS_WITHIN.core.forehand=7;STAT_WEIGHTS_WITHIN.core.backhand=6;STAT_WEIGHTS_WITHIN.core.return=8;STAT_WEIGHTS_WITHIN.core.net=4;STAT_WEIGHTS_WITHIN.technical.slice=5;STAT_WEIGHTS_WITHIN.technical.spin=5;STAT_WEIGHTS_WITHIN.technical.placement=6;STAT_WEIGHTS_WITHIN.physical.speed=10;STAT_WEIGHTS_WITHIN.physical.stamina=4;STAT_WEIGHTS_WITHIN.physical.strength=7;STAT_MODIFIER_BANDS.reactions=0.075;STAT_MODIFIER_BANDS.reading=0.05;STAT_MODIFIER_BANDS.courtCoverage=0.05'
TUNE="$PKG" PROBE=statLadder N=4000 npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=driftProbe H2H=0 DAYS=31,64,104,144 SECTIONS=who npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=driftProbe DAYS=104 SECTIONS=swap,paths npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROBE=bandCheck ONLY=club- N=60 npx tsx src/test/analysis/tuneRun.ts
OVR_W=serve:0.12,forehand:0.09,... npx tsx src/test/analysis/statLadder.ts   # score OVR weights only
LEVELS=40,80 npx tsx src/test/analysis/rallyMixProbe.ts            # mechanisms 1-3 (shot mix, +15 boosts)
TUNE='SUPPORT_NEUTRAL.followLevelFrom=50' LEVELS=80 PROBE=rallyMixProbe npx tsx src/test/analysis/tuneRun.ts
TUNE="$PKG" PROFILE=serve_volley SECTIONS=net BOOST=net BY=-15 LEVELS=50,80 PROBE=rallyMixProbe npx tsx src/test/analysis/tuneRun.ts
```
