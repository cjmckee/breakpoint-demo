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
     session, a 10% Mind share and Mind-led matches.
   - **No exchange is needed.** A realistic player spends surplus currency on its weaker stats
     instead of trading it. Dropping the exchange makes players stronger at the same income
     (§9.8).
   - **Income ×1.2 tracks today's player at all five team matches** (§9.8). Growth over tier 1 is
     at most a few percent. The "income must grow" findings in §9.3 and §9.7 came from players
     that traded currency away at a loss.
   - **Mind is an ability budget.** A baseliner banks ~60 Mind by day 31 that no stat it wants
     uses. That stockpile is what Mind-priced abilities should be sized against.
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

### 3.6 The real recipes

§3.1–3.3 priced stats with multipliers. `allocationProbe` now has `CURVES=recipes`, which buys
through the actual §6.1 recipes at the actual step prices (`statEconomy.ts`, shared with
`careerSim`).

The budget is in currency units, shaped like the training each strategy would do:

- 70% in proportion to what its own recipes need;
- 30% even, the general and Mind shares.

Whatever a strategy cannot use goes on the weakest stat it can still afford. 860 units buys about
the same even spread as 280 flat points. The slice change is in, and the greedy spender uses the
re-measured value table.

| budget 860, recipes | stat points bought | v Big Steve | v Olivia | v Jordan |
| ------------------- | ------------------ | ----------- | -------- | -------- |
| spread              | 274                | **68.9**    | **48.0** | **38.5** |
| training            | 263                | 68.2        | 46.0     | 37.4     |
| top5                | 168                | 61.8        | 44.9     | 38.5     |
| top3                | 148                | 57.3        | 39.9     | 31.8     |
| greedy              | 231                | 66.9        | 46.1     | 37.5     |

- **The real recipes hold the min-max line.** Nothing beats an even spread. The five-stat build
  matches it against Jordan and trails against the other two. The greedy spender, buying the
  best value per unit of real price, does no better.
- **They also tax specialisation.** Identity builds against the spread control (mean point-win
  % across the three opponents, PART B, archetypes on):

  | build               | styled | v spread (51.3) |
  | ------------------- | ------ | --------------- |
  | netRusher           | 49.0   | −2.3            |
  | counter             | 45.4   | −5.9            |
  | bigServer           | 43.9   | −7.4            |
  | baseliner (grind)   | 40.5   | −10.8           |
  | baseliner (+ serve) | 43.7   | −7.6            |

  A build that concentrates on six stats pushes them into the ×2 and ×3 price steps while a
  spread stays at ×1 and ×2. So it buys 17–33% fewer stat points for the same currency. Under the
  multiplier bands (§3.3) the identity builds were within a few points of spread. Under the real
  recipes they all trail it.

  The career sim's realistic player softens this: it puts about a third of its weight on non-key stats, so it ends up much nearer a spread (§9.6). But a player who commits hard to a
  playstyle is now paying for it. Whether that is the intended feel is open (§10).

- **The baseliner is still the weakest identity**, as in §3.4, and swapping slice for serve still
  recovers part of the gap (40.0 → 43.7).

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

| risk                                                              | mitigation                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solvable min-max (§3.1)                                           | recipe length carries the price band (§3.3); re-derive the bands whenever `statChannels` moves                                                    |
| Trap stats, with no respec to recover from them (§3.4)            | fix or price `slice` first. A plan-then-confirm screen with undo before confirm. The bands are visible on every recipe                            |
| Training no longer shows a stat bump (decision 2)                 | the result modal leads with "what this buys": the cheapest affordable upgrade for the anchor's stat, as a one-tap spend                           |
| Extra step after every training: decision fatigue                 | "spend later" is the default. Buying is a separate screen, not a gate on the training loop                                                        |
| Four currencies plus XP plus specialization points                | each one does a distinct job: currencies buy stats and on-court abilities; XP buys items and the XP share of abilities; spec points buy behaviour |
| Hoarding: players never spend, then lose                          | unspent-currency indicator (the `activeIndicators` system); prompt on the pre-match screen                                                        |
| Price table becomes a maintained balance artefact                 | live next to `shotThresholds.ts` and add an `economyCheck` invariant, e.g. band order matches the measured value                                  |
| Content conversion: 127 story `statChanges`, 29 challenge rewards | mechanical: map each stat to its recipe's currencies. Script it, then hand-review the outliers                                                    |

---

## 6. The design, with decisions applied

Decisions from review: typed currencies (XP sits alongside, never alone), no direct stat grant
from training, no stat respec (playstyle respec stays as it is), bands shown openly, no stat caps
for now, and the shop sells items and abilities only. The rest of this section is the design
those decisions leave.

### 6.1 Currencies and recipes

There are four currencies: Power, Quickness, Technique and Mind. Each +1 to a stat costs its
recipe, multiplied by the step curve: ×1 below 40, ×2 in the 40s and 50s, ×3 in the 60s and 70s,
×4 from 80. A recipe's length _is_ its price band: cheap 2, standard 3, premium 4. That gives
ratios of 0.67 / 1 / 1.33, close to the measured bands. Players learn a stat's value from how
long its recipe is, which decision 4 allows.

| stat         | band     | recipe                             |
| ------------ | -------- | ---------------------------------- |
| serve        | premium  | 3 Power · 1 Technique              |
| return       | premium  | 2 Quickness · 1 Technique · 1 Mind |
| anticipation | premium  | 3 Mind · 1 Quickness               |
| speed        | premium  | 3 Quickness · 1 Power              |
| tactics      | premium  | 3 Mind · 1 Technique               |
| forehand     | standard | 2 Power · 1 Technique              |
| backhand     | standard | 2 Technique · 1 Quickness          |
| placement    | standard | 2 Technique · 1 Mind               |
| strength     | standard | 3 Power                            |
| spin         | standard | 2 Technique · 1 Power              |
| focus        | cheap    | 2 Mind                             |
| stamina      | cheap    | 1 Power · 1 Quickness              |
| net          | cheap    | 1 Quickness · 1 Technique          |
| slice        | cheap    | 2 Technique (see §3.4)             |

Buying +1 of everything takes 11 Power, 9 Quickness, 13 Technique and 10 Mind.

### 6.2 Training: currency only, lined up with the anchor

Per decision 2, training stops granting stats. A session pays currency in the **same ratio as
its anchor's recipe**, so the stat you trained is always the natural thing to buy. Neighbouring
stats come cheapest, because they share currencies:

| anchor   | pays, in ratio                     | also feeds                   |
| -------- | ---------------------------------- | ---------------------------- |
| serve    | 3 Power : 1 Technique              | strength, forehand, spin     |
| forehand | 2 Power : 1 Technique              | serve, strength, spin        |
| backhand | 2 Technique : 1 Quickness          | slice, placement, net        |
| return   | 2 Quickness : 1 Technique : 1 Mind | speed, anticipation, stamina |
| net      | 1 Quickness : 1 Technique          | speed, backhand, stamina     |

Session size scales with the minigame, just as supports do today: `(2 + 3 × reps)` units times
an income scale. The career sim (§9) calibrates that scale: ×1.2 through day 23 (about 10 units
for a two-rep session), but ×2.2 to keep pace by day 40, so the scale has to grow (§9.3).

The forehand row is what fixes the baseliner (§3.4). Two Power and one Technique is most of a serve.

**Not every session pays only its anchor.** The career sim shows that pure anchor supply walls
off whole recipes. The counterpuncher trains return and backhand and never earns Power, so speed
(3 Quickness · 1 Power) and stamina are unbuyable. The big server never earns Quickness. Each
session therefore splits three ways:

| share | what it pays                                     |
| ----- | ------------------------------------------------ |
| 70%   | the anchor's recipe ratio, as in the table above |
| 20%   | split evenly over all four currencies            |
| 10%   | Mind                                             |

**Mind is still the scarce currency**, and the currency of the two strongest stats (anticipation
and tactics). Most of it comes from:

- **Matches**, which pay `8 × (0.5 + overall/100)` units times the income scale. 60% of that is
  Mind; the rest is split by `MatchRewardSystem`'s per-area scores:
  - serving → Power;
  - returning → Quickness;
  - rally → Technique;
  - net → Quickness and Technique;
  - mental → Mind.

  So a match that went well on serve pays Power. Matches gain a stat purpose they lack today,
  where they pay XP only.

- **Story events,** whose fiction is often mental.

**No exchange.** An earlier version traded spare currency 2:1 for whatever the player was short
of. With a realistic spender it does nothing useful (§9.8). Prices are balanced enough that
surplus Power just buys strength or serve. A coach who converts currency could still exist as
flavor, but the economy should not depend on it.

`TRAINING_STAT_UPGRADE_CHANCE` and `TRAINING_BONUS_SUPPORT_CHANCE` (Lucky items) retarget to
"chance of +1 unit per unit" and "chance of a bonus rep".

### 6.3 Other sources

- Story events and challenges pay currency in place of `statChanges`. The conversion maps each
  stat to its recipe, so `anticipation: 2` becomes roughly 6 Mind and 2 Quickness. Each one is then
  rounded and hand-reviewed for fiction: a gym scene should pay Power, whatever the old stat was.
- Challenges with a `statThreshold` requirement stay as written. Their rewards must be worth more
  than buying the threshold outright, or the challenge is pointless.

### 6.4 The shop: items and abilities

`stat_increase` items are removed. What the shop sells:

- **Consumables and equipment:** XP only, as today.
- **On-court abilities:** currency matched to the effect, plus XP by rarity. The effect keys map
  cleanly:

  | effect                                                                     | currency  |
  | -------------------------------------------------------------------------- | --------- |
  | `pace`, `smash_power`                                                      | Power     |
  | `touch`, `side_spin`, `lob_quality`, `net_game`                            | Technique |
  | `reach`, `court_coverage`, `recovery_speed`                                | Quickness |
  | `clutch_performance`, `mental_resilience`, `perfect_timing`, momentum keys | Mind      |

  For example, Heavy Hitter (`pace`) costs Power and a common's XP. Serve Cannon (`smash_power`,
  `pace`) costs more Power and an uncommon's XP.

- **Off-court abilities:** XP only. These are the ones whose effects act outside the match
  (`crowd_favorite`, `spotlight`, `quick_recovery`, `iron_legs`, `grinder`, `dedicated`). They do
  not compete with stats, so they should not cost a stat currency.

This sets an exchange rate. Power spent on Heavy Hitter is Power not spent on strength, so an
ability's currency cost has to match what its effect is worth in a match. That needs the same
kind of measurement as the stat bands (§9).

---

### 6.5 How the recipes were built, and how balanced they are

The table in §6.1 was **drafted by hand**, in three steps:

1. **Band.** Each stat's band (cheap, standard or premium) comes from its tier-1 value in
   [`stat-channels.md` §5](../research/stat-channels.md), the U(25, 50) table. The five most
   valuable stats are premium, the four least valuable are cheap, and the rest are standard.
   This mirrors the price multipliers that removed the dominant strategy in §3.3.
2. **Length.** Cheap = 2 units, standard = 3, premium = 4.
3. **Currencies.** Each recipe's currencies are chosen by theme (serve is mostly Power), then
   checked so that buying +1 of everything needs roughly equal amounts of each:
   11 Power, 9 Quickness, 13 Technique and 10 Mind.

None of this was optimized. §3.3 tested price multipliers; §3.6 tests these recipes. Both
`careerSim` and `allocationProbe` pay them from one table, `src/test/analysis/statEconomy.ts`.

**Value per unit.** Point-win % per +10 stat, divided by recipe length. "Before" is the table the
bands were cut from; "after" is the re-measurement following the slice change
([`slice-at-tier-1.md` §5](../research/slice-at-tier-1.md)), ±0.39 per value.

| stat         | recipe                    | units | value before | per unit | value after | per unit |
| ------------ | ------------------------- | ----- | ------------ | -------- | ----------- | -------- |
| focus        | 2 Mind                    | 2     | 1.06         | 0.53     | 1.60        | **0.80** |
| anticipation | 3 Mind · 1 Quick          | 4     | 3.27         | 0.82     | 3.12        | 0.78     |
| serve        | 3 Power · 1 Tech          | 4     | 2.81         | 0.70     | 2.62        | 0.66     |
| speed        | 3 Quick · 1 Power         | 4     | 2.72         | 0.68     | 2.62        | 0.66     |
| net          | 1 Quick · 1 Tech          | 2     | 0.77         | 0.39     | 1.31        | 0.66     |
| return       | 2 Quick · 1 Tech · 1 Mind | 4     | 2.96         | 0.74     | 2.52        | 0.63     |
| spin         | 2 Tech · 1 Power          | 3     | 1.36         | 0.45     | 1.79        | 0.60     |
| tactics      | 3 Mind · 1 Tech           | 4     | 2.32         | 0.58     | 2.32        | 0.58     |
| slice        | 2 Tech                    | 2     | 0.48         | 0.24     | 1.13        | 0.56     |
| strength     | 3 Power                   | 3     | 1.60         | 0.53     | 1.58        | 0.53     |
| placement    | 2 Tech · 1 Mind           | 3     | 1.77         | 0.59     | 1.55        | 0.52     |
| forehand     | 2 Power · 1 Tech          | 3     | 1.48         | 0.49     | 1.54        | 0.51     |
| backhand     | 2 Tech · 1 Quick          | 3     | 1.90         | 0.63     | 1.33        | 0.44     |
| stamina      | 1 Power · 1 Quick         | 2     | 0.90         | 0.45     | 0.64        | **0.32** |

- **Recipes roughly halve the value spread.** Per unit of currency, the stats vary by 21%
  (coefficient of variation). If every stat cost the same they would vary by 38%.
- **Two clear outliers.** At the noise level, a cheap stat's per-unit figure is good to about
  ±0.2, so only these stand out:
  - **Focus is underpriced** (0.80 per unit). It is also the only Mind-only recipe, which is
    where surplus Mind drains (§9.8). The candidate fix is standard: 2 Mind · 1 Quickness.
  - **Stamina is overpriced** (0.32). It works only through match fatigue, and fatigue costs
    little. [`stamina-at-tier-1.md`](../research/stamina-at-tier-1.md) investigates. A stronger
    fatigue penalty (×0.8 → ×0.6) roughly doubles its value, but costs tired players in every
    match, so it is a design decision. If the sim stays as it is, the candidate is a single unit
    (1 Power).
- **The slice fix moved two cells the right way.** Slice went from 0.24 to 0.56 and net from 0.39
  to 0.66, both into the pack.

**Which stats get bought.** Stat gain over the starting 21 by day 31, mean build, 30 careers per
identity per system, income ×1.2, patient player (§9.8). Each cell is today / currency.

| stat         | big server | counter | net rusher | baseliner | mean today | mean currency |
| ------------ | ---------- | ------- | ---------- | --------- | ---------- | ------------- |
| serve        | 24 / 24    | 9 / 9   | 23 / 24    | 9 / 9     | 16.2       | 16.5          |
| forehand     | 24 / 24    | 9 / 8   | 9 / 9      | 24 / 23   | 16.5       | 16.0          |
| backhand     | 10 / 9     | 25 / 23 | 10 / 9     | 25 / 25   | 17.5       | 16.5          |
| return       | 9 / 9      | 24 / 23 | 11 / 10    | 9 / 10    | 13.2       | 13.0          |
| net          | 10 / 9     | 10 / 9  | 24 / 25    | 10 / 10   | 13.5       | 13.2          |
| slice        | 18 / 10    | 19 / 17 | 12 / 11    | 25 / 27   | 18.5       | 16.2          |
| spin         | 26 / 24    | 13 / 9  | 19 / 10    | 20 / 23   | 19.5       | 16.5          |
| placement    | 23 / 25    | 24 / 15 | 27 / 24    | 24 / 12   | 24.5       | 19.0          |
| speed        | 12 / 12    | 20 / 23 | 20 / 25    | 12 / 9    | 16.0       | 17.2          |
| stamina      | 25 / 14    | 24 / 23 | 17 / 11    | 29 / 24   | 23.8       | 18.0          |
| strength     | 25 / 25    | 11 / 10 | 18 / 12    | 18 / 24   | 18.0       | 17.8          |
| focus        | 20 / 32    | 20 / 16 | 20 / 15    | 13 / 18   | 18.2       | 20.2          |
| anticipation | 16 / 16    | 27 / 24 | 24 / 24    | 23 / 17   | 22.5       | 20.2          |
| tactics      | 15 / 9     | 22 / 26 | 22 / 24    | 14 / 14   | 18.2       | 18.2          |

- **Every stat gets bought.** The lowest average is 13, for return and net, and those are each
  one identity's core stat that the others only top up.
- **Read this with care.** The sim's players buy by preference weight, not by price. So this
  table mostly reflects the player model. It shows that the economy can afford every shape a
  player wants, not that prices steer anyone. Whether prices steer is the min-maxer's question,
  answered in §3.6.
- **Where currency and today's system differ, it is today's supply that is skewed.**
  - Placement (24.5 today) and stamina (23.8) are over-supplied today. Placement sits in three
    training support pools, and stamina is story content's most-granted stat (§1). Under
    currency they drop to 19 and 18.
  - Focus rises (20.2), because it is the Mind drain. The big server, with focus as a key stat,
    reaches +32.

## 7. What would need to be built

### Types (`src/types/`)

- `AttributeCurrency = 'power' | 'quickness' | 'technique' | 'mind'`
- `CurrencyAmounts = Partial<Record<AttributeCurrency, number>>`
- `Player.wallet: Record<AttributeCurrency, number>`
- `AbilityItem` gains `currencyCost: CurrencyAmounts` next to its XP `cost`.
- No purchase ledger, since there is no stat respec.

### Data and config

- `src/data/statRecipes.ts`: the §6.1 table.
- Each anchor's payout ratio sits next to `CORE_ANCHORS`.
- Ability currency costs, derived from effect keys (§6.4) rather than hand-written per ability.
- The step curve lives in config, and so does an unused `STAT_CAP_BY_TIER` (decision 5: a lever,
  not shipped).

### Core logic (`src/game/StatDevelopment.ts`, pure)

- `priceOf(stat, currentValue)` returns `CurrencyAmounts`.
- `canAfford(wallet, price)`.
- `purchase(player, stat)` returns `OperationResult<Player>`.
- `planCost(player, plan)`, for the confirm-at-once screen.

### Sources rewritten to pay currency

| source                      | change                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AnchorTrainingSystem`      | no `statBoosts`. `TrainingResult` carries `currencyGained` in the anchor's ratio, scaled by reps. Support pools and `resolveSupports` are deleted |
| `StoryEventOutcome.effects` | `statChanges` becomes `currency` (127 sites; scripted conversion)                                                                                 |
| challenge rewards           | `modifiers.statBoosts` becomes `currency` (29 sites)                                                                                              |
| `ShopSystem`                | `createStatIncreaseItem` and `calculateStatIncreaseCost` are deleted. Ability items gain a currency cost                                          |
| match rewards               | new: Mind per match, scaled by performance, through `MatchRewardSystem`                                                                           |
| `PlayerManager`             | `applyStatBoosts` remains only for purchases. `addAbility` / `upgradeAbility` stop applying ability `statBoosts`, which are empty anyway          |

### Store (`gameStore.ts`)

- `purchaseStats(plan)`, which validates the whole plan and applies it at once.
- Wallet updates go into `applyTrainingResult`, story outcome application, `claimChallenge`,
  match rewards and the shop.
- `checkChallengeCompletion()` runs after a purchase, since a purchase can satisfy a `statThreshold`.
- Migration: backwards compatibility is not required. A new version adds `wallet` at zero, and the
  existing stats stay as they are. `migrationCheck` needs the entry.

### Screens

| screen                                                              | change                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Development** (new)                                               | Stats by category, current value, recipe chips showing the band, `+1` buttons that build a pending plan, undo, and a confirm that warns the purchase is permanent. Opens from the main menu, the wallet chip and the training result. Reuses `StatTile` / `PlayerStatsDisplay` |
| `StatusBar`                                                         | wallet chip, with an indicator when currency is unspent                                                                                                                                                                                                                        |
| `TrainingResultModal`                                               | currency earned, and what it buys now: "+1 Serve ready" as a one-tap spend                                                                                                                                                                                                     |
| `StoryEventResultModal`, `ChallengeRewardChips`, `ui/StatBoostList` | render currency                                                                                                                                                                                                                                                                |
| `Shop`                                                              | no stat tab. Ability cards show the currency + XP price                                                                                                                                                                                                                        |
| `AnchorTraining`                                                    | the anchor card shows the currencies it pays and the stats they feed                                                                                                                                                                                                           |
| `MatchSummaryModal`                                                 | Mind earned                                                                                                                                                                                                                                                                    |
| tutorial (`tutorialSteps.ts`)                                       | a new step for spending, and the training step reworded                                                                                                                                                                                                                        |
| `Encyclopedia` / `glossary.ts`                                      | entries for the currencies and price bands                                                                                                                                                                                                                                     |

Test ids, following the `CLAUDE.md` conventions:

- `dev-stat-${stat}` (with `data-value` and `data-affordable`)
- `dev-buy-${stat}`
- `dev-undo`
- `dev-confirm`
- `wallet-chip`

### Tests and harnesses

- `economyCheck`:
  - prices are monotonic in value;
  - recipe length matches the band;
  - a plan never exceeds the wallet;
  - each anchor's payout ratio matches its stat's recipe;
  - every on-court ability has a currency cost and every off-court one has none.
- A new e2e spec, `development.spec.ts`: train, open Development, plan, undo, confirm, check the
  stat. The training assertions in `trainingMinigame.spec.ts` and `bot.ts` need updating.
- `allocationProbe` has a `recipes` cost model (§3.6), and both harnesses pay from
  `statEconomy.ts`, so a recipe change reaches every measurement at once.

---

## 8. Decisions

Settled in review:

| #   | question                       | decision                                                                                    |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | single or typed currency       | **typed.** XP can combine with currencies, but never stands alone as a stat currency        |
| 2   | direct core `+1` from training | **no.** Training pays currency lined up with the anchor's upgrade and its neighbours (§6.2) |
| 3   | respec                         | **none for stats.** Playstyle respec stays as it is                                         |
| 4   | show the value bands           | **yes**, through recipe length                                                              |
| 5   | stat caps per tier             | **not now.** Held as a balance lever                                                        |
| 6   | shop                           | **items and abilities only.** Abilities cost currency + XP by what they do (§6.4)           |

Settled since:

- **Slice is fixed in the sim** ([`slice-at-tier-1.md`](../research/slice-at-tier-1.md)), via a
  chip-return composite, bonus-only bands on slices and stat-driven slice selection.
- **Matches pay Mind plus currencies by performance area** (§6.2).

Settled in the second review:

- **Stamina.** Nobody starts a match tired, and the gap between low- and high-stamina players
  widens, showing late in long matches. Applied; see
  [`stamina-at-tier-1.md` §6](../research/stamina-at-tier-1.md).
- **Specialisation (§3.6).** Intent: committing to a skill set should land at a reasonably
  similar win rate. A build that buys the cheapest stats will probably have the highest overall,
  but one that spends in line with its archetype should be able to match or beat it on win
  rate, despite lower overall stats. That needs more balance work. The measure is PART B of
  `allocationProbe CURVES=recipes` with archetypes on.
- **Focus** stays as it is for now.
- **Every investigation reports point, game (hold / break) and match win rates**
  (`src/test/analysis/matchTally.ts`). Match win rate swings on small edges. Game win rate,
  driven by serve and return stats, and point win rate show whether the stats are working.
  At tier 1 the returner is favoured: in an even match players hold only ~45–47% of service
  games, because of the double-fault rate.

Still open:

- **Income growth over the career** (§9.3). By tier, by level, or by session quality?
- **Whether the bands should widen** (§9.4). Recipe lengths of 2 / 3 / 4 are flatter than the
  measured value spread.

---

## 9. Career sim

[`careerSim.ts`](../../src/test/analysis/careerSim.ts) lives the same career twice: once under
today's grants, once under the §6 design. §9.6 is the current setup. §9.1–9.5 come from a first
pass that ran 40 days with a rigid planner. That planner levelled its identity's six stats and
never touched the other eight. It was useful for finding where the economy runs dry, but it is
not a realistic player.

### 9.1 Pure anchor supply starves identities

Rigid planner, income ×1.8, no general share, no exchange, matches 40% Mind. Wallet at day 40,
in units left unspent / units earned:

| identity  | Power    | Quickness     | Technique     | Mind    | stats it could not buy                      |
| --------- | -------- | ------------- | ------------- | ------- | ------------------------------------------- |
| counter   | 4 / 78   | **361** / 662 | **552** / 731 | 3 / 354 | anticipation, tactics (Mind), speed (Power) |
| netRusher | 16 / 429 | 20 / 534      | **305** / 563 | 3 / 295 | anticipation, tactics (Mind)                |
| bigServer | 4 / 1068 | 85 / 85       | 26 / 494      | 2 / 180 | focus, placement (Mind)                     |

The counterpuncher earned a fifth of its currency as Mind, and its plan needs about a third.
Raising Mind alone (a 15–25% training share, 60% of matches) let it buy tactics to 83–92, but it
stalled on speed and stamina. That was the Power wall, at 75 earned across 40 days.

| change, cumulative                              | counter, day 40 | unspent at day 40 |
| ----------------------------------------------- | --------------- | ----------------- |
| none (matches 40% Mind)                         | not measured    | Q 361, T 552      |
| Mind only: 15% training share, matches 60% Mind | 51%             | Q 263, T 382      |
| general share 20% (Mind share 10%) instead      | 58%             | T 318             |
| + 2:1 exchange                                  | **60%**         | ~17 units in all  |

With the exchange every identity's six stats come out level, within a point or two of each
other, and wallets end near empty.

### 9.2 Calibration

Rigid planner, full design (§6.2), income ×2.2, 40 days. Mean point-win % against the three
tier-1 bosses (Big Steve, Olivia, Jordan):

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

### 9.6 Day 23: a realistic player against team match 3

The rigid planner is replaced by a player modelled on how people actually build. It now runs on
the game's own calendar and is measured against the story.

**The player.** Each career draws its own preference weights:

- its identity's key stats at 0.8–1.2;
- every other stat at 0.25–0.55.

It spends on whichever stat is furthest behind that shape. That means mostly key stats, while
still shoring up weaknesses, so a baseliner keeps a serve. No two players of an identity build
the same way. Training adapts too:

- **Today's system:** the player trains the core stat furthest behind its shape.
- **Currency:** it trains for whatever its next few purchases are short of.

Either way it leans on its identity's anchors 30% of the time.

**The calendar.** It is `gameStore`'s fixed story schedule:

- story events take the slots their definitions say they take;
- the archetype arrives on day 11;
- team matches are played on their afternoons, best of three, on their surfaces.

The window ends on **day 23, team match 3 against Martia Estrella** (rating 36, serve-and-volley,
clay). That is the story beat between days 20 and 25. Days 15 (Chet Vale, 29) and 19 (Rich Soil, 34) are measured on the way.

A typical day-23 build under either system has key stats around 40 and the rest around 28. For
example, a baseliner at strength / backhand / forehand 42 with serve 29 and focus 28.

Readiness on the mean build, 200 best-of-three matches per cell, 20 careers per identity. Point-win
is good to about ±1.5 and match-win to about ±7.

| identity  | today: pt% / match% | currency ×1.0 | ×1.2          | ×1.4      | ×1.8      |
| --------- | ------------------- | ------------- | ------------- | --------- | --------- |
| bigServer | 44–46 / 31–34       | 41.3 / 24     | 44.8 / 34     | 47.1 / 41 | 52.8 / 61 |
| counter   | 46–47 / 37–41       | 43.7 / 28     | 44.9 / 31     | 49.5 / 48 | 52.1 / 57 |
| netRusher | 46–49 / 37–47       | 44.4 / 31     | 48.4 / 46     | 52.4 / 57 | 57.0 / 74 |
| baseliner | 43–47 / 25–40       | 39.5 / 16     | 45.3 / 33     | 45.2 / 32 | 50.5 / 51 |
| **mean**  | **46.0 / ~37**      | 42.2 / 25     | **45.9 / 36** | 48.6 / 45 | 53.1 / 61 |

"Today" is the range across the five runs, since every run re-simulates today's side.

What this says:

- **The story pitches team match 3 as a slight underdog fight.** A typical player wins about 37%
  of the time against Martia on day 23, under today's grants. That is the bar the currency
  system has to hit.
- **Income ×1.2 hits it.** That is `(2 + 3 × reps) × 1.2` units, about 10 for a two-rep session.
  It is where the first estimate in §6.2 landed, and day-23 stat totals match too (~470 v ~480).
- **The 40-day calibration needed ×2.2**, though with the rigid planner (§9.2). If that holds
  for the realistic player, the two numbers put the front-loading in §9.3 in figures: the income
  scale has to rise by roughly 80% between the third team match and the end of tier 1. Re-running
  day 31 and the Riverside Open with this player is the check. Paying more per match as the story advances is the natural place for that.
- **A realistic player narrows the identity spread.** At ×1.2 the four identities sit within
  3.6 points of each other, against 19 under the rigid planner (§9.4). Shoring up weaknesses
  pulls every build toward the middle. The baseliner and big server are still at the bottom.
- **No currency starves.** Wallets end each checkpoint within a few units of empty. The general
  share and the exchange cover what the identity's own anchors don't pay.
- **Matches pay a baseliner badly.** Match pay is 60% Mind, and a baseliner uses little Mind, so
  it trades most of it away at 2:1. Weighting match pay by the performance areas alone, with no
  fixed Mind share, would be fairer. That is worth a run before the match design is settled.

---

### 9.7 Through day 31: all five team matches

The same setup as §9.6, run to day 31 and measured at every team match. Mean point-win % of the
four identities against that day's opponent. "Today" is pooled over the three runs.

| day | opponent (rating)     | today | currency ×1.2 | ×1.4 | ×1.6 |
| --- | --------------------- | ----- | ------------- | ---- | ---- |
| 15  | Chet Vale (29)        | 48.4  | 49.0          | 50.9 | 52.8 |
| 19  | Rich Soil (34)        | 48.2  | 48.5          | 49.7 | 52.4 |
| 23  | Martia Estrella (36)  | 46.2  | 45.9          | 48.1 | 50.5 |
| 27  | Reginald Werther (38) | 47.0  | 45.8          | 47.5 | 50.6 |
| 31  | Olivia Gulp (41)      | 47.5  | 45.7          | 47.8 | 51.6 |

Match-win % for today's player against the same opponents: 45, 44, 36, 41, 42.

- **The story keeps pace with today's player.** A typical player is a slight underdog at every
  team match: 46–48% of points and 36–45% of matches. Team match 3 is the hardest of the five.
- **The parity scale drifts up slowly.** From about ×1.15 at day 15 to ×1.2 at day 23, ×1.35 at
  day 27 and ×1.4 at day 31. That is about 20% growth across the stretch, or roughly +5% per
  team match played.
- **The 80% figure in §9.6 was the rigid planner.** A realistic player keeps half its stats in
  the cheap ×1 band below 40 for longer, so the step curve bites less. Front-loading is real but
  mild.
- **The identity spread holds.** At ×1.4 on day 31 the four identities span 4.5 points (baseliner
  45.6 to net rusher 50.1), against 4.2 for today's player. The currency system neither widens nor
  narrows it.
- **A typical build on day 31,** currency ×1.4: key stats at 47–50, the rest at 31–33. A baseliner
  with strength, stamina and spin at 50 still has a serve of 32.

**Superseded by §9.8.** These figures used the impatient player, which traded currency away at
2:1 whenever its next stat was unaffordable. Its losses grew with every match's Mind, and that
is what made the parity scale drift.

---

### 9.8 Why the sim was trading, and what happens when it stops

The §9.6–9.7 player traded spare currency the moment the stat it wanted most was unaffordable.
Only after that would it look for something else to buy, and then only three stats down its
list. That was a leftover from the rigid planner, which would not buy outside its identity and
needed the exchange to avoid wasting currency.

Over 31 days at ×1.4 the trace shows:

- the baseliner trading 57 times and losing 94 units, mostly Mind traded for Power;
- the counterpuncher losing 69.

Three players replace it, none of which exchange:

- **patient** saves for the stat it most needs, but spends every currency that stat does not use
  on the weakest stat that does. A defensive player sitting on Power buys strength or serve. It
  will not push a stat more than 8 points past where its shape wants it. Past that, spare currency
  is banked.
- **patient, uncapped**: the same without the 8-point limit.
- **affordable** never saves: it buys the weakest stat it can afford right now.

Mean point-win % of the four identities against that day's team-match opponent, all at ×1.4:

| day | today | impatient + exchange | patient, uncapped | affordable | patient |
| --- | ----- | -------------------- | ----------------- | ---------- | ------- |
| 15  | 48.4  | 50.9                 | 52.2              | 52.4       | 52.1    |
| 19  | 47.9  | 49.7                 | 51.8              | 51.0       | 52.2    |
| 23  | 46.0  | 48.1                 | 49.2              | 50.2       | 48.9    |
| 27  | 47.1  | 47.5                 | 51.2              | 51.1       | 50.0    |
| 31  | 47.5  | 47.8                 | 50.1              | 51.3       | 49.6    |

- **The exchange was costing 1.8–3.5 points of point-win** by day 31. The baseliner gained most
  (45.6 → 48.6–50.5), because it was the one trading away the Mind its matches paid.
- **Saving barely pays.** The affordable player, which never saves, is as strong as either
  patient one. Prices are balanced enough that buying whatever helps now is close to optimal.
  That is good for the UI: a "spend what you have" flow is not a trap.
- **The cap shows where currency would pile up.** With it, spare currency the player has no use
  for stays in the wallet. By day 31 at ×1.4:
  - the baseliner banks **85 Mind**;
  - the big server banks ~30 Quickness;
  - the counterpuncher banks ~20 Technique.

  Uncapped, the baseliner pours that Mind into the one Mind-only recipe and ends with **focus 62**,
  its highest stat. Single-currency recipes (focus 2 Mind, slice 2 Technique, strength 3 Power)
  are where surplus drains.

**Recalibrated:** the patient player, capped, at the parity scale:

| day | opponent         | today | patient ×1.1 | patient ×1.2 |
| --- | ---------------- | ----- | ------------ | ------------ |
| 15  | Chet Vale        | 48.4  | 48.9         | 48.8         |
| 19  | Rich Soil        | 47.9  | 47.6         | 49.6         |
| 23  | Martia Estrella  | 46.0  | 45.9         | 46.2         |
| 27  | Reginald Werther | 47.1  | 45.9         | 46.6         |
| 31  | Olivia Gulp      | 47.5  | 44.9         | 46.5         |

Today's column is pooled over six runs. The patient ×1.2 match-win % reads 46, 50, 36, 40, 38,
against today's 45, 43, 36, 41, 42.

- **×1.2 holds within about a point at every team match.** That is about 10 units for a two-rep
  session. Day 31 sits a point low, so income might grow a few percent over tier 1, not the 20–80%
  the earlier sections suggested.
- **The Mind bank is an ability budget.** At ×1.2 the baseliner banks ~60 Mind by day 31. The
  other identities bank under 10, because they have Mind stats to buy. So Mind-priced abilities
  around 30–60 Mind at tier 1 would give a baseliner one or two over the stretch and make Mind
  matter to every build. That is the next calibration, with §6.4.
- **The identity spread is about 6 points at ×1.2 on day 31**: baseliner 43.8, net rusher 49.6.
  The baseliner sits lowest partly because its Mind is banked rather than spent. An ability would
  return that value.

---

### 9.9 On the game's own match engine

§9.6–9.8 ran matches through a hand-copied point loop. That loop leaves out changeover and
set-break recovery and the starting fatigue of a tired player
([`stamina-at-tier-1.md` §5](../research/stamina-at-tier-1.md)). `careerSim` now plays every
match through `MatchSimulator` and passes in the player's energy, so a team match after a day of
training starts tired. The rest is the §9.8 setup (patient player, no exchange).

Mean point-win % against each team-match opponent. "Today" is pooled over both runs:

| day | opponent         | today | currency ×1.2 | ×1.3 |
| --- | ---------------- | ----- | ------------- | ---- |
| 15  | Chet Vale        | 48.1  | 49.9          | 50.8 |
| 19  | Rich Soil        | 47.7  | 49.4          | 51.0 |
| 23  | Martia Estrella  | 44.4  | 45.7          | 47.2 |
| 27  | Reginald Werther | 45.8  | 46.0          | 47.4 |
| 31  | Olivia Gulp      | 46.4  | 44.7          | 46.5 |

- **Parity runs from about ×1.1 at the first team matches to ×1.3 at day 31.** That is the mild
  front-loading of §9.3 again, about 15–20% growth across tier 1, now on the real engine. The
  earlier "flat ×1.2" (§9.8) sat inside the old loop's error.
- **Recommendation:** start income at ×1.1 and step it up to ×1.3 by the fifth team match. About
  +5% per team match does it.
- **Every check is a slight underdog fight under both systems:** 32–43% match wins for today's player, 33–50% for currency at ×1.2.

---

### 9.10 Where the currency comes from, and where it goes

`careerSim LEDGER=1` books every unit a currency career earns to its source, and every unit it
spends to the stat it bought. Patient player, income ×1.2, real match engine, 30 careers per
identity, means per career.

**Time.** Through day 31 a player has 93 daytime slots:

| use                    | slots | share |
| ---------------------- | ----- | ----- |
| training               | 63    | 68%   |
| practice matches       | 6     | 6%    |
| team matches           | 5     | 5%    |
| story events           | 9     | 10%   |
| rest (short of energy) | 10    | 11%   |

Identity does not change the time budget, only which anchors get trained.

**Income.** About 875 units by day 31 (410 by day 15), whatever the identity:

| source             | units | share | per slot | per 10 energy |
| ------------------ | ----- | ----- | -------- | ------------- |
| training           | 627   | 72%   | ~10      | ~5            |
| story / challenges | 161   | 18%   | —        | —             |
| practice matches   | 47    | 5%    | ~8       | ~1.6          |
| team matches       | 41    | 5%    | ~8       | ~1.6          |

- **Training is the economy.** Matches pay about the same per slot as a training session, but a
  match costs 50 energy against training's 20. So per unit of energy a match pays a third as
  much.
- **Matches are not the Mind source §6.2 meant them to be.** 60% of match pay is Mind, but
  matches are only 10% of income: about 65 Mind of a career's 210–270. Most Mind comes from the
  training Mind share and general share (~100–150) and from story (~50).

**What players buy.** Share of spending on the identity's six key stats, and where the rest
went:

| identity  | on key stats | biggest buys                                        | rest of the spend                        |
| --------- | ------------ | --------------------------------------------------- | ---------------------------------------- |
| netRusher | 73%          | speed 15%, anticipation 14%, tactics 14%, serve 13% | every other stat 2–4%                    |
| counter   | 71%          | tactics 16%, anticipation, return, speed 13% each   | placement, serve, slice, focus 4–5%      |
| bigServer | 67%          | serve 14%, placement 12%, strength 11%, focus 11%   | anticipation 7%, speed 6%, others 2–5%   |
| baseliner | 59%          | spin, strength, backhand 11% each, forehand 10%     | anticipation 9%, tactics 7%, others 3–5% |

Every stat gets bought, and the least-bought gets about 2% (~20 units). Unspent at day 31 is
25–30 units, a normal evening's float, except for the baseliner, which sits on 61 Mind it has
no key stat for (§9.8).

**Training follows the currency, not the identity.** With adaptive training a player trains
whatever pays what its next purchases need, so anchors drift from the playstyle:

- the big server trains backhand 15 times in 63, for the Technique its placement and spin
  need;
- the counterpuncher trains serve 14 times, for the Power its speed and stamina need;
- the baseliner never trains serve or return.

That is the recipes working as designed (§6.2): each anchor pays its own recipe's currencies.
But it means a big server improves the backhand training it never wanted, while the stat it
gains comes from the shop of recipes. Whether training a shot should be the way to earn for an
unrelated stat is a design question (§10).

### 9.11 Doubling match pay

Decision: matches should pay more, and §9.10 showed they pay a third of training per energy.
First step, match pay doubled (`MATCH_UNITS` 8 → 16, now the careerSim default). Same setup as
§9.10; readiness on N=200 BO3 per cell, so match-win % moves about ±3.5 on noise.

**Income.** About +95 units a career (~+11%); matches go from 10% to 19% of income, training
from 72% to 65%. Three quarters of the extra is Mind (60% Mind share plus the mental area
score); Power, Quickness and Technique gain 10–20 units each. Time use does not change: the
sim's practice-match schedule is fixed, so this measures pay, not a shift in what players do.

**Where the extra Mind goes.** Counterpuncher and net rusher spend it (tactics, anticipation).
The big server banks 64 unspent Mind (was 11), the baseliner 125 (was 61).

**Readiness**, point / game / match-win % against the team-match opponent, 1× → 2×:

| identity  | day 15 Chet                         | day 23 Martia                       | day 31 Olivia                       |
| --------- | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| netRusher | 49.2 / 48.2 / 43 → 51.2 / 52.2 / 53 | 45.5 / 40.9 / 34 → 48.5 / 47.2 / 42 | 45.0 / 40.1 / 28 → 49.4 / 48.7 / 43 |
| counter   | 48.3 / 46.2 / 39 → 49.6 / 49.7 / 47 | 43.2 / 37.3 / 28 → 48.0 / 46.5 / 45 | 42.5 / 36.4 / 24 → 44.3 / 38.9 / 28 |
| bigServer | 48.0 / 46.4 / 40 → 49.2 / 48.2 / 42 | 41.4 / 33.6 / 23 → 45.4 / 41.4 / 34 | 41.5 / 32.8 / 18 → 41.1 / 32.6 / 19 |
| baseliner | 50.3 / 50.7 / 48 → 49.1 / 48.9 / 42 | 43.3 / 37.6 / 31 → 44.6 / 39.8 / 34 | 41.7 / 34.7 / 27 → 42.3 / 35.3 / 26 |

The identities with Mind-priced key stats gain most; the baseliner, which cannot spend Mind,
gains nothing; the spread between identities widens. Until abilities give Mind a sink, the
lever that helps every build is `MATCH_MIND_SHARE` (e.g. 0.3–0.4), which moves match pay into
the performance-weighted P/Q/T split instead.

---

## 10. Next avenues

Updated priority order:

1. ~~Re-test the baseliner with archetypes on.~~ Done (§3.4).
2. ~~Calibrate income with a career sim.~~ Done through all five team matches on the real match
   engine (§9.9): ×1.1 rising to ×1.3.
3. ~~Decide `slice`.~~ Fixed in the sim.
4. **Abilities as the Mind sink.** Give `careerSim` an ability purchase: price on-court abilities
   in currency per §6.4, scaled so the ~60 Mind a baseliner banks buys one or two. Then check
   that Mind earns its keep for every identity. Also extend the sim to the Riverside Open.
5. **The specialisation tax** (§3.6). Under the real recipes every six-stat identity trails an
   even spread by 2–11 points. Decide whether committing to a playstyle should cost that much.
   If not, the lever is the step curve (gentler steps, or steps measured from the player's
   average rather than from 20), not the recipes. `allocationProbe CURVES=recipes` measures it.
6. **Stamina** ([`stamina-at-tier-1.md`](../research/stamina-at-tier-1.md)): a stronger fatigue
   penalty, a 1-unit recipe, or an out-of-match job. Decide, then re-measure §6.5.
7. **Focus** to a standard recipe (2 Mind · 1 Quickness), so surplus Mind stops draining into it.
8. **Matches as an earner** (§9.10). Matches pay a third of training per unit of energy and only
   10% of income, so they fail as the Mind source. Raise match pay, or pay matches per point won
   rather than per match, then re-run the ledger.
9. **Training for currency rather than the shot** (§9.10). Decide whether anchors should keep
   paying in their recipe ratio, or whether every anchor should pay more evenly so players train
   the shots they care about.
10. **Price abilities.** Measure each on-court ability's point-win value the way `statChannels`
    values a stat, and set its currency cost at the same exchange rate.
11. **Paper-prototype the Development screen and the training result's "what this buys".**
12. **Script the content conversion** of `statChanges` to currency, and review the diff for
    fiction.

```
npx tsx src/test/analysis/allocationProbe.ts                    # PART A, ~2 min at N=60
N=250 BUDGETS=280 CURVES=flat,step20,banded npx tsx src/test/analysis/allocationProbe.ts
N=250 PARTS=B BUDGETS=280 CURVES=flat,banded npx tsx src/test/analysis/allocationProbe.ts
N=250 PARTS=B BUDGETS=280 CURVES=flat ID='\+' npx tsx src/test/analysis/allocationProbe.ts
N=250 BUDGETS=430,860 CURVES=recipes npx tsx src/test/analysis/allocationProbe.ts   # §3.6
N=250 PARTS=B BUDGETS=860 CURVES=recipes npx tsx src/test/analysis/allocationProbe.ts
npx tsx src/test/analysis/statIncome.ts
DAYS=31 CHECK=15,19,23,27,31 npx tsx src/test/analysis/careerSim.ts       # §9.9, ~10 min
SPEND=impatient EXCHANGE=2 DAYS=31 CHECK=15,19,23,27,31 INCOME_SCALE=1.4 \
  npx tsx src/test/analysis/careerSim.ts                                     # §9.7 as run
TRACE=baseliner INCOME_SCALE=1.2 npx tsx src/test/analysis/careerSim.ts   # one career, day by day
LEDGER=1 RUNS=30 DAYS=31 CHECK=31 npx tsx src/test/analysis/careerSim.ts  # §9.10, seconds
```

**Measurement baseline:** §3 was taken on `a680f19`, before the slice change. §9 was taken
with the slice change off, apart from §9.5. The slice change moves slice and return values, so
the §3 figures that involve slice (the baseliner rows) are pre-change.
