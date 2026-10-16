# XP, abilities and gear

**Status:** measured, not applied. The option is a config value, off by default
(`ABILITY_LEVEL_PRICE.xpOnlyFrom`, `src/config/economy.ts`), so it can be switched on as is.

## Where XP goes today

XP comes from matches (win or loss, plus a performance bonus) and challenges. It has two jobs:
lifetime XP sets the player's level, which pays specialization points, and the spendable balance
buys from the shop: gear, consumables and abilities. An ability costs both XP and currency
(`ABILITY_PRICES`: common 15 units + 70 XP, uncommon 28 + 140, rare 40 + 250; a level costs
the base × (1.5 + 0.75 × level)).

`careerSim LEDGER=1` follows 10 careers per identity with the patient spender, which buys stats
and abilities but no gear. This table and the X1/X2 tables below were measured at commit 93adf1f,
before the shop offered abilities by season (05b0b87).

| career day      | XP earned | XP on abilities | XP unspent  | ability levels bought |
| --------------- | --------- | --------------- | ----------- | --------------------- |
| 31, end of Club | ~850      | 130-320         | 520-760     | 1.4-2.9               |
| 72, Regional    | ~2,100    | 300-510         | 1,600-1,800 | 3.1-4.0               |
| 112, Tour       | ~3,600    | 390-840         | 2,900-3,200 | 3.5-5.9               |
| 160, World      | ~5,350    | 540-980         | 4,500-4,800 | 4.1-6.5               |

XP piles up, and so does the gap between XP earned and anything to spend it on. Currency isn't
what limits abilities either: they take 100-170 of a career's 5,500 units (2-3%). What limits
them is the shop's two offers a day and how much a level is worth.

## The option: currency buys an ability, XP grows it

From the first owned level on, a level costs XP only, at `xpOnlyScale` × today's XP price. Learning
an ability still costs currency and XP, so the first level stays a currency decision; levelling is
an XP decision, and XP competes with gear for it.

| at day 160, per identity | today       | X1: XP only, ×1 | X2: XP only, ×2 |
| ------------------------ | ----------- | --------------- | --------------- |
| ability levels bought    | 4.1-6.5     | 16.8-21.4       | 12.8-16.0       |
| XP unspent               | 4,500-4,800 | 360-1,000       | 310-470         |

What it does to strength, from `careerSim PAR=1` (the opponent OVR each build beats half the time,
mean of the four identities, ±1-2):

| career day | today | X1   | X2   |
| ---------- | ----- | ---- | ---- |
| 72         | 54.5  | 54.5 | 54.8 |
| 112        | 65.5  | 66.3 | 66.0 |
| 152        | 75.0  | 77.3 | 76.0 |

- **It gives XP a job without breaking the pacing.** Levels add 1-2 OVR of strength by the end of
  World, after the stat curve has flattened. That's where the pacing plan wanted late growth to come
  from (`mid-late-progression.md` §2.1: "late-game growth should lean on them").
- **It doesn't touch the stat budget.** Abilities take 2-3% of currency today, so moving levels off
  currency frees almost nothing for stats.
- **Recommendation: X2.** At double the XP price, levels still use nearly all the XP, but slowly
  enough that gear (100-300 XP an item) is a real choice against them, which the career model
  doesn't play and a player would.

## Abilities by season (applied)

`abilityLadder` plays each on-court ability alone, at level 1, on every identity's career build for
a slot (its own abilities removed), against team match 3's shape at that season's target. Mean
point-win gain over the four identities, N=300 per cell, ±0.5-1:

| ability                 | rarity   | Club | Regional | Tour     | World    |
| ----------------------- | -------- | ---- | -------- | -------- | -------- |
| Pressure Cooker         | rare     | +1.3 | +1.2     | +1.7     | +2.1     |
| All-Court Maestro       | rare     | +0.7 | +1.4     | +1.0     | +2.1     |
| Speed Demon             | uncommon | +0.4 | +1.3     | +1.2     | +1.8     |
| Serve Cannon            | uncommon | +1.1 | +1.2     | +1.3     | +1.2     |
| Rangy Return            | common   | +1.0 | +1.7     | +1.3     | +1.1     |
| Slider                  | common   | +0.4 | +0.8     | +0.9     | +1.5     |
| Heavy Hitter            | common   | +0.8 | +0.6     | +0.7     | +0.9     |
| Spin Master             | common   | ~0   | +0.1-0.5 | ~0.2     | ~0.4     |
| Baseliner, momentum 2.4 | common   | ~0   | +0.1-0.5 | ~0.2     | ~0.4     |
| Baseliner, momentum 4   | common   | ~+1  | ~+1      | +0.3-0.4 | +0.3-0.4 |
| Netcrasher, Soft Hands  | common   | ~0   | +0.3     | -0.3     | +0.3     |
| Overhead Smash          | common   | 0    | 0        | 0        | 0        |

- **Rarity now reads in the right order** at every season (rares and uncommons ahead of commons),
  and the abilities the first research found dead (Slider, Speed Demon, All-Court Maestro) work.
- **Changed:** Serve Cannon's serve speed 1.5 → 2.5 (it was +0.6-0.9, under an uncommon's budget),
  and Pressure Cooker's perfect timing 14 → 10 (it reached +4-5 for the net rusher on the Tour).
- **The shop opens a rarity per season** (`ABILITY_OFFER_WEIGHTS`): commons only at Club, uncommons
  from Regional, rares from the Tour, as §5 of the progression plan has it. It used to sell rares
  from day 7. This makes Club a little harder for a player who bought an uncommon or a rare there.
- **Baseliner** rally momentum 2.4 → 4: about +1 at Club and Regional (it was 0-0.5), +0.3-0.4
  later.
- **Overhead Smash needs a new job.** It's worth 0 in every season, and no number fixes it. Its
  quality bonus can't help a shot that's already at the 100 cap, and lowering the overhead's
  winner bar instead (by 14 at level 1) still measured 0: the points an overhead would win, the net
  player was winning anyway. What would reach play is holding the net against a good lob, which
  today always sends the net player back to the baseline. That's new mechanics, so it isn't built.
- **Netcrasher, Soft Hands and Spin Master** are about +1 for the builds they suit (the net rusher,
  the counter) and near 0 for the rest, which is a common's budget. Scaling flat bonuses with the
  level was tried and changed nothing. Clutch, Mental Fortitude and Iron Will act through key
  moments, which this probe doesn't play (`mentalAbilityProbe` does, at Club).

## Gear, the other XP sink

Gear costs XP (`Math.pow(total boosts, 1.4) × 4`) and the shop sells every shop-listed piece from
day 7, whatever the player's tier. The best kit from each tier's pool (racquet, shoes, outfit,
hat, charm), on a player at that tier's level:

| best kit from the pool of | adds       | costs    |
| ------------------------- | ---------- | -------- |
| Club                      | +1 OVR     | 172 XP   |
| Regional                  | **+5 OVR** | 768 XP   |
| Tour                      | +6 OVR     | 986 XP   |
| World                     | +7 OVR     | 1,126 XP |

A Club player earns about 850 XP by the end of the season, so a Regional kit (+5 OVR) is within
reach before promotion. That's a third of a season's growth, and none of it is in the pacing:
`careerSim` buys no gear, so the bands in §2.2 assume a player without any.

**Measured** with a gear buyer in the career model (`careerSim GEAR=all|tier`): each day it takes
the shop's equipment offer that adds most to its key stats over what that slot holds, if the XP is
there, and plays its matches on the geared stats. Par, the opponent OVR a build beats half the
time, mean of the four identities, ±1:

| career day          | no gear | today's shop | shop gated by tier |
| ------------------- | ------- | ------------ | ------------------ |
| 31, end of Club     | 38.5    | 41.8 (+3)    | 39.5 (+1)          |
| 41, Regional starts | 42.8    | 46.0 (+3)    | 45.0 (+2)          |
| 72, Regional        | 54.2    | 59.0 (+5)    | 58.8 (+5)          |
| 112, Tour           | 66.2    | 69.2 (+3)    | 69.5 (+3)          |
| 152, World          | 75.8    | 77.8 (+2)    | 78.5 (+3)          |

Gear takes 1,700-2,300 of a career's XP and leaves 2,500-3,100 unspent, so it doesn't crowd out XP
levels for abilities.

**What it means.** The bands (§2.2 of the progression plan) assume no gear, but their margin was
calibrated on bronze's opponents, which were tuned by feel against players who could buy gear. So
the Club calibration already absorbs about +3 OVR of it. Past Club, gear adds +2 to +5, at most a
point or two beyond that. Gating the shop by tier changes Club (+3 → +1, so Club gets harder for a
player who shops) and barely touches the mid and late game.

**Recommendation:** leave the shop as it is. If Regional plays easy, raise its band targets by 1-2
OVR rather than gating gear. The options, for the record:

- **G1. Sell gear from the player's tier pool and below.** Makes Club harder; little effect later.
- **G2. Count gear in the pacing.** Done above: bands are within a point or two of right.
- **G3. Shrink the higher tiers' boosts** so a kit is about style and fit more than power.

## Reproducing

```
SLOT=regional-tm3 npx tsx src/test/analysis/abilityLadder.ts   # abilities in a season
GEAR=all PAR=1 RUNS=10 N=100 DAYS=152 CHECK=31,41,72,112,152 npx tsx src/test/analysis/careerSim.ts
LEDGER=1 RUNS=10 DAYS=160 CHECK=160 npx tsx src/test/analysis/careerSim.ts
TUNE='ABILITY_LEVEL_PRICE.xpOnlyFrom=1;ABILITY_LEVEL_PRICE.xpOnlyScale=2' PROBE=careerSim LEDGER=1 RUNS=10 DAYS=160 CHECK=160 npx tsx src/test/analysis/tuneRun.ts
TUNE='ABILITY_LEVEL_PRICE.xpOnlyFrom=1;ABILITY_LEVEL_PRICE.xpOnlyScale=2' PROBE=careerSim PAR=1 RUNS=10 N=100 DAYS=152 CHECK=41,72,112,152 npx tsx src/test/analysis/tuneRun.ts
```
