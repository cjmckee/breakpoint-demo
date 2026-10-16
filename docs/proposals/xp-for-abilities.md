# XP for abilities

**Status:** measured, not applied. The option is a config value, off by default
(`ABILITY_LEVEL_PRICE.xpOnlyFrom`, `src/config/economy.ts`), so it can be switched on as is.

## Where XP goes today

XP comes from matches (win or loss, plus a performance bonus) and challenges. It has two jobs:
lifetime XP sets the player's level, which pays specialization points, and the spendable balance
buys from the shop: gear, consumables and abilities. An ability costs both XP and currency
(`ABILITY_PRICES`: common 15 units + 70 XP, uncommon 28 + 140, rare 40 + 250; a level costs
the base × (1.5 + 0.75 × level)).

`careerSim LEDGER=1` follows 10 careers per identity with the patient spender, which buys stats
and abilities but no gear:

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

## What it needs first

- **Ability balance.** The career model buys levels of abilities that do almost nothing (Speed Demon,
  All-Court Maestro), and the strongest abilities are commons. With XP levels, players reach level
  5 far more often, so the level curve and rarity budgets matter more. That's the next pass.

## Reproducing

```
LEDGER=1 RUNS=10 DAYS=160 CHECK=160 npx tsx src/test/analysis/careerSim.ts
TUNE='ABILITY_LEVEL_PRICE.xpOnlyFrom=1;ABILITY_LEVEL_PRICE.xpOnlyScale=2' PROBE=careerSim LEDGER=1 RUNS=10 DAYS=160 CHECK=160 npx tsx src/test/analysis/tuneRun.ts
TUNE='ABILITY_LEVEL_PRICE.xpOnlyFrom=1;ABILITY_LEVEL_PRICE.xpOnlyScale=2' PROBE=careerSim PAR=1 RUNS=10 N=100 DAYS=152 CHECK=41,72,112,152 npx tsx src/test/analysis/tuneRun.ts
```
