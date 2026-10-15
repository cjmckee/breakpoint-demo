# Identity drift: why even identities end up 40 points apart

**Measurement baseline:** the engine as of the progression PR stack (#135-#144), career builds
from `careerSim BUILDS=` (20 careers per identity, flat pay, focus from day 41). Every figure is
point-win % of best-of-three matches. The opponents are "the common opponent": the five Club
team-match shapes moved to the day's mean OVR, with that season's specialty tier. N=120-150
matches per cell, so ± about 1. Probe: `driftProbe` (`who`, `swap`, `paths`, `value`).

## The question

At Club the four career identities are even: 4.7 points of point-win separate the best from the
worst. Against the Tour and World practice rosters (`bandCheck`), the net rusher wins 90-100%
of matches and the baseliner 0-30%. Is that the builds (what each identity buys) or the engine
(what the stats and specialties do as ratings rise)? And which stats are over- or under-paid?

## Findings

### 1. The spread opens up as soon as Club ends

| day (season)      | big server | counter | net rusher | baseliner | spread |
| ----------------- | ---------- | ------- | ---------- | --------- | ------ |
| 31 (Club, TM5)    | 50.7       | 52.4    | 54.3       | 49.6      | 4.7    |
| 64 (Regional TM3) | 53.3       | 49.5    | 68.2       | 41.0      | 27.2   |
| 104 (Tour TM3)    | 47.5       | 49.3    | 74.5       | 35.9      | 38.6   |
| 144 (World TM3)   | 37.8       | 52.0    | 76.0       | 42.8      | 38.2   |

The Tour plays like a serve-and-return game with no rallies. Day 104:

| identity   | hold | break | aces (of serve points) | points reaching 5+ shots | rallies won |
| ---------- | ---- | ----- | ---------------------- | ------------------------ | ----------- |
| big server | 91%  | 3%    | 43%                    | 9%                       | 40%         |
| counter    | 14%  | 87%   | 2%                     | 31%                      | 49%         |
| net rusher | 97%  | 73%   | 38%                    | 11%                      | 72%         |
| baseliner  | 23%  | 33%   | 6%                     | 20%                      | 57%         |

The baseliner **wins its rallies** (57%); it loses because 80% of points are over before a rally
starts. Hold rate follows the serve, and break rate follows the return composite (`return` 0.5,
`anticipation` 0.25, `speed` 0.15, `slice` 0.1).

### 2. Builds: off-identity stats lag further every season

careerSim's players grow their key stats about 2.5 times as fast as everything else
(`KEY_W` 0.8-1.2 against `OFF_W` 0.25-0.55). So the gap between key and off stats grows in a
straight line: about 14 points at Club, about 38 on the Tour (key stats 80-88, serve or return
45-48). Any contest that compares stats directly (the ace roll, the return) turns that into a
win-rate gap that grows with it.

Day 104, as the first serve and the return actually read the stats:

| identity   | first-serve quality composite | return composite | sum |
| ---------- | ----------------------------- | ---------------- | --- |
| net rusher | 72                            | 60               | 132 |
| big server | 81                            | 47               | 128 |
| counter    | 50                            | 76               | 125 |
| baseliner  | 58                            | 53               | 111 |

The net rusher is the only identity whose key stats cover both contests: `speed` and
`anticipation` are net stats and also two-fifths of the return composite.

**Raising the baseliner's serve and return to the four identities' average is worth +6 to +13
point-win** at every day measured, under every engine variant below. It's the steadiest effect
in this study.

### 3. Specialties: serve and return paths grow, groundstroke paths are dead

Point-win lost when one path is removed:

| path                           | day 31 | day 64 | day 104 |
| ------------------------------ | ------ | ------ | ------- |
| `rt_sneaky_beaky` (net rusher) | −1.3   | −10.9  | −17.9   |
| `rt_extinguisher` (counter)    | −4.1   | −12.0  | −16.6   |
| `rt_redliner` (baseliner)      | −0.9   | −7.5   | −15.3   |
| `fs_bomber` (big server)       | −4.9   | −7.7   | −6.7    |
| `ss_kicker` (big server)       | −1.8   | −5.7   | −7.4    |
| `fh_laserbeam` (baseliner)     | +1.1   | +0.1   | −0.1    |
| `bh_bazooka` (baseliner)       | −0.6   | −2.1   | +0.1    |
| `bh_samurai` (counter)         | −1.3   | +2.7   | +2.6    |

Removing all of an identity's specialties costs it 6-10 points at Club, but 15-42 by the Tour.
The net rusher's package is worth 42: it puts three of its four specialties on serve and return
phases. The baseliner's package is one return path plus two groundstroke paths that do nothing.

Why the serve and return paths grow: `SPECIALTY_AMPLIFY` adds `byTier × (stat − 30)` to the
phase's stat. Both factors rise with the career: tier I → III multiplies by 0.5 → 1.0, and the
stat goes from about 45 to about 85. At Club a specialty adds about +7. On the Tour it adds
+50. A return composite of 60 plays as 90, which pins return quality at the 100 ceiling. Return
quality between about 70 and 100 is what decides breaks.

### 4. Stats: over- and under-paid

What +5 is worth (point-win) on each identity's own build (`value` section). It's not
per-currency; prices are similar at a given level.

| stat         | day 64  | day 104 | day 144 | read                                                                                                             |
| ------------ | ------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| return       | 0.7-3.4 | 0.1-2.3 | 0.6-1.1 | **over** for anyone below the level: the most valuable stat in the game for the identities that don't buy it     |
| anticipation | 1.3-3.1 | 0.1-2.4 | 0.7-2.9 | **over**: part of the return composite, plus a read bonus on every shot                                          |
| speed        | 1.7-2.5 | 0.3-1.1 | 1.3-2.9 | **over**: return composite, coverage, rushed shots (`0.6 + 0.4 × speed/100`)                                     |
| serve        | 0.8-2.4 | 0-0.7   | 0.7-1.9 | right for low servers; saturates at about 80 for big servers (quality pinned at 100)                             |
| forehand     | 0.2-0.9 | 0-0.5   | 0.7-1.9 | **under** for its own builds: rallies are a fifth of points                                                      |
| backhand     | 0-0.8   | 0-1.0   | 0.1-0.5 | **under**, as forehand                                                                                           |
| stamina      | 0-0.1   | 0-0.1   | 0-0.7   | **dead** at every level in best of three; it may earn its keep in World's best of five, which isn't measured yet |
| strength     | 0-0.9   | 0-1.1   | 0.4-0.7 | **under**                                                                                                        |
| net          | 0-0.1   | 0-0.6   | 0-1.1   | fine: worth something only to players who come forward                                                           |

So the stats that win at high level (return, anticipation, speed, serve) are the ones a
baseliner doesn't buy. The ones it does buy (groundstrokes, stamina, strength, slice, spin) are
the least valuable.

### 5. OVR misreads strength, and the engine reads OVR

OVR weights a stat by its category (core 0.45, physical 0.25, technical and mental 0.15 each).
It gives stamina and strength 0.083 each and anticipation and tactics 0.05 each, almost the
reverse of what they're worth in a match (finding 4). On day 104 the baseliner has the highest
OVR (66) and the lowest point-win (36); the net rusher has 62 and 75.

OVR is not only a display number. `getMatchLevel` (the mean of the two OVRs) sets every quality
threshold, and the returner's OVR is 40% of ace resistance. So inflated OVR does protect the
baseliner somewhat, and changing the OVR weights will move the simulation. It's worth fixing,
as a separate piece of work: derive the weights from measured value (`statChannels`-style
regression) and re-run this probe.

## Levers measured

Tour spread (best − worst point-win), day 104 unless noted:

| change                                                          | spread | net rusher | others                   |
| --------------------------------------------------------------- | ------ | ---------- | ------------------------ |
| today                                                           | 38.6   | 74.5       | 36-49                    |
| raise the rally quality ceiling to 130 (and the return ceiling) | 39-40  | 75         | no change: dead end      |
| level-relative contests (sigmoid steepness × 40 / level)        | 35.2   | 71         | small: dead end          |
| halve the support adjustments (speed, tactics, anticipation)    | 31.7   | 76         | no change for net rusher |
| net-point dials (`at_net` 10 → 3, `netCoverage` 0.2 → 0.1)      | 24.2   | 70         | no change: dead end      |
| **serve and return kept up** (careerSim `FUND_W=0.7,0.9`)       | 32.5   | 76.2       | 43.7-48.3 (within 4.6)   |
| … plus amplification excess capped at 15 (`excessCap`)          | 23.9   | 70.5       | 46.6-52.0                |
| … plus amplification excess capped at 10                        | 22.0   | 67.7       | 45.7-51.7                |
| … plus no amplification at all                                  | 14.0   | 63.3       | 49.3-51.9                |

The two levers that work are the two halves of the problem: off-identity serve and return
lagging (builds), and specialty amplification compounding with tier and stat (engine). Together
they bring the three non-net identities within about 6 points of each other on the Tour.

**The net rusher stays an outlier** under every variant, 12-20 points clear. What remains is its
shape: it is the only identity whose key stats feed both the serve and the return, and its
`rt_sneaky_beaky` turns returns into net points (break 76% with a lower return composite than
the counter's). That needs its own change. See the proposal.

## Proposal

Measured proposals, with the package and its Club check:
[`proposals/identity-drift-fixes.md`](../proposals/identity-drift-fixes.md).

## Reproducing

```
npx tsx src/test/analysis/driftProbe.ts                              # all sections, 4 days, ~1 h
H2H=0 DAYS=104 SECTIONS=who,swap npx tsx src/test/analysis/driftProbe.ts
TUNE='SPECIALTY_AMPLIFY.excessCap=15' PROBE=driftProbe DAYS=104 SECTIONS=who \
  npx tsx src/test/analysis/tuneRun.ts
FUND_W=0.7,0.9 BUILDS=/tmp/fund.json RUNS=20 npx tsx src/test/analysis/careerSim.ts
BUILDS_FILE=/tmp/fund.json DAYS=104 SECTIONS=who npx tsx src/test/analysis/driftProbe.ts
```
