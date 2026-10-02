# Stat currency — earning attribute points and spending them on stats

**Status:** design direction agreed (§8); calibration and pricing still open (§9)
**Scope:** replacing direct stat grants with typed currencies the player spends: what it does to
balance, what it makes possible, and what it would take to build
**Harnesses:** [`allocationProbe.ts`](../../src/test/analysis/allocationProbe.ts),
[`statIncome.ts`](../../src/test/analysis/statIncome.ts)

---

## Summary

1. **Today's training choices already decide power, not just shape.** Spending a budget the way
   training spreads it, with anchors chosen _evenly_, performs the same as `+1` to every stat in
   turn (41% of points against Jordan either way). But a player who trains like an identity ends
   up in a 20-point spread. In the career sim the net rusher wins 77% of points against the
   tier-1 bosses by day 40 and the baseliner 57%, because the net, serve and return anchors draw
   anticipation, tactics and speed as supports (§9).
2. **Free allocation at a flat price is a solved game.** A player who puts the same 280 points into
   the five strongest stats wins **62%** of points against Jordan instead of 41%. Under an iid model
   that is roughly 98% of best-of-one matches instead of 5%. The rest of tier 1 collapses with it.
3. **Escalating cost alone does not fix it.** A cost that steps up every 20 points cuts the min-max
   edge from +21 to +2–7 points of point-win % (two runs), but the five-stat build still wins. The
   stats are not equally valuable (anticipation is worth ~7× slice per +10), and a curve applied to
   every stat equally cannot correct for that.
4. **Price bands by stat value do fix it.** Strong stats priced ×1.5, weak ones ×0.75, on top of
   the curve: the five-stat build lands level with an even spread (35.5% v 34.9%), and a
   value-aware greedy spender gains only +3.
5. **The groundstroke baseliner is a trap build, and archetypes don't save it.** With real
   specialties on both sides of the net, a styled baseliner wins ~43% of points. An even spread
   wins ~53%, and a net rusher ~66%. Specialties add only +1–2 to any identity. The cause is
   narrow: `slice` is a dead stat at tier 1, and the build buys neither serve nor return. Swapping
   slice for serve brings it to ~51% (§3.4).
6. **Design (§6):** four typed currencies. Each recipe's length is its price band. Training pays
   currency in its anchor's recipe ratio, so forehand training pays what a serve costs. Matches
   pay Mind plus currencies by what went well. The shop sells items and abilities, with on-court
   abilities costing currency plus XP.
7. **The 40-day career sim (§9) sizes the economy, and found two problems:**
   - **Pure anchor supply starves identities.** Any recipe that needs a currency the identity's
     anchors never pay becomes a hard wall: the counterpuncher can't buy speed without Power, and
     can't buy anticipation or tactics without Mind. The fix is a 20% general share on every
     session, a 10% Mind share, Mind-led matches and a 2:1 exchange.
   - **Escalating prices front-load progression.** At income ×2.2 the currency player leads today's
     player at day 10 (38% v 32%) and trails at day 40 (60% v 65%). Income has to grow over the
     career.
8. **Slice is fixed in the sim** ([`slice-at-tier-1.md`](../research/slice-at-tier-1.md)).
   +20 slice is now worth 1.7–2.6× what it was at tier 1. Match texture is unchanged. It does not
   rescue the baseliner identity on its own.

---

## 1. How stats are earned today

Every permanent stat change goes through `PlayerManager.applyStatBoosts`, which adds a flat amount
and clamps at 100. Five sources call it:

| source               | grant                                                    | who chooses the stat                                                 |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| anchor training      | `+1` anchor core, `+1` to 0–3 supports (rarely `+2`)     | player picks the core; supports drawn at random from a 4-stat pool   |
| story events         | 127 of 173 outcomes carry `statChanges`, median net `+4` | the author; the player picks between options at best                 |
| challenges           | 225 points across the templates                          | the author                                                           |
| shop `stat_increase` | `+1–5` to 1–4 stats in one category, costs XP            | random roll; the player picks from four offers a day                 |
| abilities            | none: every ability has empty `statBoosts`               | n/a (`addAbility` / `upgradeAbility` still apply them, to no effect) |

Equipment and story items add stats as a match-time overlay (`EffectAggregator`), not permanently.
They are outside this proposal.

**Income.** Energy allows ~2.5 training sessions a day (20 per session, 50 back from sleep, 20 from
a daytime rest), and a session pays ~3 points. The day-39 save recorded in `characterSim.ts` sits at
649 total base stats against a 294 start: **~9 points a day** from every source together. The whole
tier-1 roster tops out at OVR 47, which is roughly +380 over a new player.

**Cost.** Flat everywhere except the shop, where `calculateStatIncreaseCost` scales by
`max(6, value/8)`. That does nothing below 48, which covers all of tier 1. "Slightly in shop"
is accurate.

**Where choice lives now.** Mostly in the anchor pick. Supports are random by design, from pools
balanced so no stat comes free with every build (see the `CORE_ANCHORS` header). Story authors
lean on stamina: it is the most-granted stat in story content (+83), ahead of tactics (+61) and
speed (+55). Backhand gets the least (+19).

**Stat goals.** 24 challenge requirements are `statThreshold` (e.g. `serve >= 40`). In a spend
economy those become goals the player can buy outright.

---

## 2. What the proposal could mean: three forks

The idea of "spend Strength and Technique to buy serve power" can be built in three ways, and
they differ by an order of magnitude in cost.

**A. Currencies in front of the existing 14 stats.** The player earns Power / Quickness / Technique
/ Mind and spends them on `serve`, `forehand` and the rest. The simulation is untouched: everything
under `src/core/` still reads the same `PlayerStats`. Only the economy and the UI change.
**This is the fork the rest of this document assumes.**

**B. The attributes become the stats.** Shots derive directly from Strength, Quickness and so on.
That rewrites `PlayerProfile.getStatForShot`, every composite table and every harness baseline
in `docs/`. Not recommended: it throws away the calibration recorded in the three research docs, for
an effect the composites already produce (below).

**C. Finer purchasable skills** such as "serve power" separate from "serve accuracy". Two notes:

- The engine already makes that split, through composites rather than separate stats. First-serve
  _quality_ is `serve 0.6 + strength 0.2 + tactics 0.1 + spin 0.1`; first-serve _accuracy_ is
  `serve 0.45 + placement 0.25 + focus 0.15 + spin 0.15` (`SERVE_QUALITY_WEIGHTS`,
  `SERVE_ACCURACY_WEIGHTS`). A player who buys strength already buys serve power.
- Splitting stats runs into the consolidation finding in
  [`stat-system-audit.md` §5](../research/stat-system-audit.md): a stat pays in proportion to how
  often it is used, and a 1–2% stat measures as noise. Halving `serve` gives two weaker stats, not
  more choice.

The user-facing version of C can still ship on top of A: the spend screen can _describe_ a
purchase as "serve power" when it buys strength. That costs nothing.

---

## 3. Balance — measured

`allocationProbe.ts`: every build starts as the uniform-20 new player and spends the same budget.
Results are point-win % against fixed tier-1 opponents, BO3, 250 matches per cell, with no
archetypes on either side. **Noise is about ±1.5**, not the ±0.6 a point count suggests:
identical configs re-run moved by up to 2.7 (`step20` `top5` v Jordan: 46.6, then 43.9), because
points inside a match share a form roll. Read differences under ~3 as ties. A budget of 280 is about a month of play. Strategies:

- `spread`: +1 to every stat in turn.
- `training`: the spread anchor training produces, with anchors chosen evenly.
- `core`: the five core stats only.
- `top5`: serve, return, speed, anticipation, tactics, the highest-value stats at tier 1 per
  [`stat-channels.md`](../research/stat-channels.md).
- `greedy`: each purchase goes to the best value per unit cost at that moment, using the same
  table. This is an upper bound on min-maxing, since it treats value as linear.
- Identity builds: six stats each, the way a player choosing a style would spend.

### 3.1 Flat price: free allocation is a solved game

| budget 280, flat | OVR | max stat | v Big Steve (30) | v Olivia (42) | v Jordan (47) |
| ---------------- | --- | -------- | ---------------- | ------------- | ------------- |
| spread           | 40  | 40       | 68.2             | 48.8          | 39.2          |
| training         | 40  | 49       | 71.5             | 48.6          | 41.6          |
| core             | 45  | 76       | 67.2             | 53.4          | 45.4          |
| **top5**         | 40  | 76       | **84.8**         | **69.7**      | **61.8**      |
| greedy           | 42  | 100      | 85.3             | 67.7          | 59.5          |

`training` ≈ `spread`. Today's build choice does not change power, which supports summary point 1.
`top5` is +21 to +23 points over it at the same OVR. Rough match-win conversion (iid points, BO1):
41% → ~5%, 50% → 50%, 55% → ~80%, 60% → ~96%. A player who reads one table would sweep tier 1
weeks early.

`core` gains little despite the highest OVR. OVR weights core at 0.45, but three of the five core
stats (forehand, backhand, net) are mid-to-low value at tier 1. **OVR stops being a good proxy
for strength as soon as players choose stats freely.**

At budget 140 (about two weeks) the shape is the same: `top5` beats `spread` by +9 / +12 / +12.

### 3.2 Escalating cost: helps, but does not fix it

`step20`: each +1 costs 1 below 40, 2 in the 40s and 50s, 3 in the 60s and 70s, 4 from 80.

| budget 280, step20 | stat points bought | v Big Steve | v Olivia | v Jordan |
| ------------------ | ------------------ | ----------- | -------- | -------- |
| spread             | 280                | 69.4        | 48.9     | 41.8     |
| training           | 267                | 68.6        | 48.3     | 38.9     |
| **top5**           | 190                | 69.6        | 50.8     | **43.9** |
| greedy             | 230                | 70.8        | 51.1     | 44.5     |

The edge shrinks from +22 to +2 in this run (+7 in an earlier one), and concentrating still wins: the curve charges every
stat the same, while the stats are not worth the same. A steeper `step15` curve narrows it further
but **buys far fewer stat points**: 12% fewer for an even spread, up to half for a focused build. Income would need retuning
upward to compensate, which gives back part of the effect.

### 3.3 Price bands by value: removes the dominant strategy

`banded`: `step20` × a per-stat band. Premium ×1.5 (anticipation, return, serve, speed, tactics),
standard ×1, cheap ×0.75 (focus, stamina, net, slice).

| budget 280, banded | stat points bought | v Big Steve | v Olivia | v Jordan |
| ------------------ | ------------------ | ----------- | -------- | -------- |
| spread             | 253                | 63.8        | 44.2     | 34.9     |
| training           | 241                | 64.5        | 43.9     | 34.2     |
| top5               | 143                | 60.0        | 43.0     | 35.5     |
| greedy             | 240                | 67.1        | 45.9     | **38.2** |
| bigServer          | 194                | 57.6        | 40.9     | 34.1     |
| counter            | 168                | 58.7        | 42.7     | 33.2     |
| netRusher          | 168                | 59.3        | 39.9     | 30.6     |
| baseliner          | 212                | 50.5        | 32.1     | **23.1** |

`top5` is now level with `spread`. The best a spreadsheet player can find is +3. Under flat
pricing the same identity builds spread from 33 (baseliner) to 52 (net rusher) against Jordan.
Banded, the three that are not baseliner sit in a 4-point band. **That is the outcome we want:
the player chooses an identity, not a power level.**

Overall power is ~5 points lower than flat spread at the same budget. To keep today's pacing,
income needs ~10–15% more currency than today's stat points.

### 3.4 The baseliner gap, re-tested with archetypes on

In §3.1 the groundstroke baseliner (forehand, backhand, spin, strength, stamina, slice) trailed
every other identity. That run had no archetypes on either side, so `allocationProbe` PART B
re-runs the identities with their behaviour switched on:

- the player carries a broad identity and four tier-I specialties that match the build;
- every opponent plays its authored archetype (Big Steve and Jordan `serve_volley`, Olivia
  `aggressive`).

Three columns per identity separate the stat build from the behaviour:

- `bare`: the identity's stats, no archetype;
- `styled`: the identity's stats plus the matching archetype. This is the real player;
- `styleOnly`: an even-spread stat build plus the identity's archetype.

Mean point-win % across the three opponents, budget 280, two runs each (±1.5):

| identity         | specialties                                  | bare  | styled    | styleOnly |
| ---------------- | -------------------------------------------- | ----- | --------- | --------- |
| even spread      | none                                         | 52–53 | —         | —         |
| netRusher        | downhill, bomber, sneaky beaky, kicker       | 63–64 | **65–66** | 52–53     |
| counter          | extinguisher, survivor, samurai, apologist   | 59–60 | **59**    | 53        |
| bigServer        | bomber, kicker, laserbeam, opportunist       | 53–54 | **53**    | 52–53     |
| baseliner, swing | laserbeam, bazooka, redliner, apologist      | 41–42 | **43**    | 52–53     |
| baseliner, grind | rpm overdrive, brick wall, extinguisher, ap. | 42–43 | **43–44** | 52–53     |

**The gap is real for a real baseliner.** With the archetype on, it still averages ~43%. That is
ten points below a player who spread the same points evenly, and 22 below the net rusher. It
would be a trap build.

**Archetypes do not rescue it, or anyone.** `styled` minus `bare` is +1 to +2 for every identity,
at the edge of noise. `styleOnly` sits on the spread control for every identity. At tier I,
specialties change how a player plays, not how well. That matches their design ("archetypes
change WHAT a player tries, never how well they execute"), but it means behaviour cannot cover
for a weak stat build.

**Opponents' archetypes change nothing material.** Re-running PART A with opponents on their
archetypes (`OPP_ARCH=1`) reproduces every row within noise (`top5` v Jordan 61.0, `spread` 40.1).
The §3.1–3.3 conclusions stand.

#### What the gap actually is

Each row swaps one stat out of the swing baseliner (styled, flat pricing):

| swap              | mean   | v Jordan |
| ----------------- | ------ | -------- |
| none              | 43     | 33       |
| slice → placement | 46     | 36       |
| slice → speed     | 48     | 39       |
| slice → return    | 49     | 38       |
| slice → serve     | **51** | **45**   |
| even spread       | 53     | 40       |

One swap closes most of the gap. Two things are going on, and neither means groundstrokes are
broken:

1. **`slice` is a dead stat at tier 1.** Moving it into almost anything is worth +3 or more.
   [`stat-channels.md` §10](../research/stat-channels.md) already records this, and four levers
   that did not fix it.
2. **Every point passes through the serve and the return.** Every identity that keeps up buys
   one of serve or return, and one of speed or anticipation. The baseliner buys none of them. The
   five groundstroke stats plus a serve stat play at spread level, and do better than spread
   against Jordan.

**What this means for the design.**

- The recipe table already steers toward the fix. Forehand training pays Power and Technique,
  which is exactly what serve costs (§6). A player who trains like a baseliner can afford a serve
  without changing training.
- `slice` needs either a sim fix or the cheapest price in the game. With bands shown openly
  (decision 4), a cheap price also tells the player it is low-value. That is honest, but it is a
  stat nobody should buy at tier 1, and players can't refund it (decision 3).
- Neither problem is visible today, because random supports and story rewards spread everyone
  toward the middle. **A spend screen makes the simulation's value table player-facing**, and
  there is no respec to recover from a bad pick. The sim's weakest stats need to be fixed or
  clearly priced before the screen ships.

### 3.5 Second-order effects

- **OVR inflation and deflation.** OVR is display plus `matchLevel`, and opponents do not scale
  with the player's OVR (`getScaledOpponentStats` scales on tier wins). So skewed builds are not
  punished by matchmaking. They will, however, show OVRs that mislead: `top5` reads 40, the same as
  `spread`, while playing like a 50.
- **Challenge thresholds.** Under a spend model, `serve >= 40` turns from "train serve a lot" into
  "buy serve to 40". That is fine, and arguably clearer. But the reward has to be worth more than
  the purchase cost, or players skip the challenge.
- **Shop.** If the shop kept selling stats it would be a second, cheaper route around the price
  bands. Per decision 6 it stops selling them (§6.4).

---

## 4. What this lets us do that we can't today

- **Diminishing returns per stat.** `CLAUDE.md` asks for diminishing returns at high stats. Today
  that can only be done by changing every grant site. With a spend model, it is one cost function.
- **Price as a balance dial.** If a stat is under- or over-valued, its recipe can change without
  touching any content or simulation constant. Today the levers are sim constants (which move
  everything) or re-authoring rewards.
- **Player-directed builds that hold together.** "I'm a serve-and-volleyer" becomes a plan the
  player executes, rather than a hope that the support draw goes their way.
- **Content stays valid when stats change.** Story events would reward "2 Mind" rather than
  `anticipation: 2`, so a stat rename or consolidation no longer touches 127 `statChanges` sites.
- **Saving toward a goal.** Banking currency for a threshold (40 serve unlocks X) creates
  mid-length goals. This pairs with `statThreshold` challenges and any future stat-gated abilities.
- **Abilities with a real price.** An on-court ability that costs Power competes with buying
  strength. That is a decision the shop cannot offer today, where abilities and stats both cost XP
  from one undifferentiated pool (§6.4).
- **Hooks for other systems:**
  - Archetype specialties could discount their phase's stats, tying the decision layer to the
    stats.
  - Coaches and relationships could offer discounts or currency conversions.
  - Equipment could carry "+10% Technique income".
- **Stat caps as a held lever** (decision 5). No stat above a tier ceiling, checked on purchase.
  Not shipping now. Today the same rule would need a clamp in `applyStatBoosts` that silently
  discards earned points.

---

## 5. Risks and costs

| risk                                                   | mitigation                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Solvable min-max (§3.1)                                | recipe length carries the price band (§3.3); re-derive the bands whenever `statChannels` moves |
| Trap stats, with no respec to recover from them (§3.4) | change, cumulative                                                                             | counter, day 40   | unspent at day 40 |
| -----------------------------------------------------  | ---------------                                                                                | ----------------- |
| none (matches 40% Mind)                                | not measured                                                                                   | Q 361, T 552      |
| Mind only: 15% training share, matches 60% Mind        | 51%                                                                                            | Q 263, T 382      |
| general share 20% (Mind share 10%) instead             | 58%                                                                                            | T 318             |
| + 2:1 exchange                                         | **60%**                                                                                        | ~17 units in all  |

With the exchange every identity's six stats come out level, within a point or two of each
other, and wallets end near empty.

### 9.2 Calibration

Full design (§6.2), income ×2.2. Mean point-win % against the three bosses:

| identity        | system   | day 10 | day 20 | day 30 | day 40 | total stats, day 40 |
| --------------- | -------- | ------ | ------ | ------ | ------ | ------------------- |
| netRusher       | today    | 36.1   | 48.7   | 64.7   | 76.9   | 658                 |
|                 | currency | 41.5   | 53.7   | 63.4   | 71.4   | 605                 |
| counter         | today    | 31.7   | 44.7   | 58.9   | 69.9   | 654                 |
|                 | currency | 39.0   | 51.8   | 58.6   | 63.2   | 605                 |
| bigServer       | today    | 32.6   | 41.5   | 52.4   | 60.5   | 654                 |
|                 | currency | 38.5   | 48.2   | 54.6   | 57.8   | 629                 |
| baseliner       | today    | 29.0   | 39.5   | 47.0   | 58.0   | 655                 |
|                 | currency | 33.3   | 41.6   | 48.1   | 52.7   | 668                 |
| baseliner+serve | today    | 29.5   | 38.2   | 47.5   | 57.4   | 653                 |
|                 | currency | 35.5   | 45.3   | 51.6   | 56.1   | 634                 |
| **mean**        | today    | 31.8   | 42.5   | 54.1   | 64.5   |                     |
|                 | currency | 37.6   | 48.1   | 55.3   | 60.2   |                     |

At ×2.0 the day-40 currency mean is 58.6, so each +0.1 of scale buys about +0.8 at day 40.

### 9.3 Escalating prices front-load progression

The currency player is ahead through day 20 and behind by day 40, at every income scale tried.
The step curve is the reason: below 40 a stat costs ×1, so the first weeks buy fast, and from 40
it costs ×2. Today's grants are flat, so today's curve is a straight line.

One income scale cannot match both ends. Two options:

- **Income that grows** with the content: opponent tier, player level, or session tier. This
  fits the game: a tier-2 practice match should teach more than a tier-1 one. It also makes the
  currency pace track the tier the player is in.
- **A gentler first step,** for example ×1.5 at 40 rather than ×2. This flattens the curve but
  gives back some of what the step curve does against min-maxing (§3.2).

The first is recommended. The step curve is doing balance work, and income is the free dial.

### 9.4 The identity spread survives

Under a planner, the day-40 spread across identities is 19 points under both systems (52.7–71.4
currency, 57.4–76.9 today). The earlier halving came from a naive round-robin spender. Recipe
lengths of 2 / 3 / 4 give price ratios of 0.67 / 1 / 1.33, while the measured value spread from
weakest to strongest stat is ~3×. So the net rusher, whose six stats include four premium ones,
still buys the most value per unit.

Widening the bands, say to 2 / 3 / 5, is the obvious dial. The other is the content: whether the
net rusher's 77% is too strong is a sim question, the same shape as the baseliner's weakness.

### 9.5 Slice and the baseliner

The career sim was re-run with the slice change on
([`slice-at-tier-1.md`](../research/slice-at-tier-1.md)), at income ×2.1. The baseliner moves from
an interpolated 51.9 to 52.5 at day 40. That is inside noise. The baseliner's gap is skipping
serve and return, as §3.4 found. The `baseliner+serve` row (56.1) is what fixes it, and the
forehand anchor's Power is what pays for that serve.

---

## 10. Next avenues

Updated priority order:

1. ~~Re-test the baseliner with archetypes on.~~ Done (§3.4).
2. ~~Calibrate income with a career sim.~~ First pass done (§9). Still to do: income growth by
   tier (§9.3).
3. ~~Decide `slice`.~~ Fixed in the sim.
4. **Income growth by tier.** Add it to `careerSim`, and extend the sim past day 40 into tier 2,
   once tier-2 content exists.
5. **Band width.** Re-run §3.3 and §9.4 with recipe lengths 2 / 3 / 5, through a `recipes` cost
   model in `allocationProbe`.
6. **Price abilities.** Measure each on-court ability's point-win value the way `statChannels`
   values a stat, and set its currency cost at the same exchange rate.
7. **Paper-prototype the Development screen and the training result's "what this buys".**
8. **Script the content conversion** of `statChanges` to currency, and review the diff for
   fiction.

```
npx tsx src/test/analysis/allocationProbe.ts                    # PART A, ~2 min at N=60
N=250 BUDGETS=280 CURVES=flat,step20,banded npx tsx src/test/analysis/allocationProbe.ts
N=250 PARTS=B BUDGETS=280 CURVES=flat,banded npx tsx src/test/analysis/allocationProbe.ts
N=250 PARTS=B BUDGETS=280 CURVES=flat ID='\+' npx tsx src/test/analysis/allocationProbe.ts
npx tsx src/test/analysis/statIncome.ts
RUNS=10 N=120 ALL_CHECKS=1 INCOME_SCALE=2.2 MATCH_MIND_SHARE=0.6 TRAIN_MIND_SHARE=0.1 \
  TRAIN_GENERAL_SHARE=0.2 EXCHANGE=2 npx tsx src/test/analysis/careerSim.ts   # ~10 min
```

**Measurement baseline:** §3 was taken on `a680f19`, before the slice change. §9 was taken
with the slice change off, apart from §9.5. The slice change moves slice and return values, so
the §3 figures that involve slice (the baseliner rows) are pre-change.
