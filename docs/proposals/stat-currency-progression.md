# Stat currency — earning attribute points and spending them on stats

**Status:** investigation, not yet a decision. Measurements below; open questions in §8
**Scope:** replacing direct stat grants with generic points the player spends: what it does to
balance, what it makes possible, and what it would take to build
**Harnesses:** [`allocationProbe.ts`](../../src/test/analysis/allocationProbe.ts),
[`statIncome.ts`](../../src/test/analysis/statIncome.ts)

---

## Summary

1. **Today a player's build choices barely change how strong they are.** Spending the same budget
   the way anchor training spreads it performs the same as `+1` to every stat in turn (41% of points
   against Jordan either way). Training choice decides _shape_, almost never _power_. That is
   healthy, but it is also why choice feels low-stakes.
2. **Free allocation at a flat price is a solved game.** A player who puts the same 280 points into
   the five strongest stats wins **62%** of points against Jordan instead of 41%. Under an iid model
   that is roughly 98% of best-of-one matches instead of 5%. The rest of tier 1 collapses with it.
3. **Escalating cost alone does not fix it.** A cost that steps up every 20 points cuts the min-max
   edge from +21 to +2–7 points of point-win % (two runs), but the five-stat build still wins. The stats are
   not equally valuable (anticipation is worth ~7× slice per +10), and a curve applied to every stat
   equally cannot correct for that.
4. **Price bands by stat value do fix it.** Strong stats priced ×1.5, weak ones ×0.75, on top of
   the curve: the five-stat build lands level with an even spread (35.5% v 34.9%), and a
   value-aware greedy spender gains only +3. Identity builds (big server, counterpuncher, net
   rusher) end up within 4 points of each other.
5. **Free allocation would put a sim imbalance in front of players.** The groundstroke baseliner
   trails every other identity by ~10 points of point-win % under every pricing model. Today random
   support draws hide this. With a spend screen, players would find it within a week.
6. **Recommendation:** go ahead, but with typed currencies whose recipes carry the price bands (§6,
   option D). Keep the anchor core `+1` direct so training still pays off visibly. Treat the price
   table as a balance contract re-derived from `statChannels`, the same as `shotThresholds.ts`.

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

### 3.4 What this exposes: the baseliner gap

`baseliner` (forehand, backhand, spin, strength, stamina, slice) trails by about 10 points under
every model, flat included. That is not a pricing artefact. Groundstroke stats are mid-value at
tier 1 and `slice` is worth nothing there (+0.48, inside noise; see
[`stat-channels.md` §10](../research/stat-channels.md)). Two caveats:

- The probe runs without archetypes. A real baseliner has `fh_*` / `bh_*` specialties that shift
  shot mix toward the wings, so their stats are used more. `statInContext` is the harness for that.
- Today this is invisible: random supports and author-chosen story rewards spread everyone toward
  the middle. **A spend screen makes the simulation's value table player-facing.** Whatever is
  under-valued becomes a trap option. That is the strongest argument for doing the
  `statInContext` run before building UI.

### 3.5 Second-order effects

- **OVR inflation and deflation.** OVR is display plus `matchLevel`, and opponents do not scale
  with the player's OVR (`getScaledOpponentStats` scales on tier wins). So skewed builds are not
  punished by matchmaking. They will, however, show OVRs that mislead: `top5` reads 40, the same as
  `spread`, while playing like a 50.
- **Challenge thresholds.** Under a spend model, `serve >= 40` turns from "train serve a lot" into
  "buy serve to 40". That is fine, and arguably clearer. But the reward has to be worth more than
  the purchase cost, or players skip the challenge.
- **Shop.** The shop already has the right shape (XP in, stats out, a value-scaled price). It would
  sell currency instead. Otherwise it becomes a second, cheaper route to the same stats that ignores
  the price bands.

---

## 4. What this lets us do that we can't today

- **Diminishing returns per stat.** `CLAUDE.md` asks for diminishing returns at high stats. Today
  that can only be done by changing every grant site. With a spend model, it is one cost function.
- **Price as a balance dial.** If a stat is under- or over-valued, its price band can move without
  touching any content or simulation constant. Today the levers are sim constants (which move
  everything) or re-authoring rewards.
- **Player-directed builds that hold together.** "I'm a serve-and-volleyer" becomes a plan the
  player executes, rather than a hope that the support draw goes their way.
- **Content stays valid when stats change.** Story events would reward "2 Mind" rather than
  `anticipation: 2`, so a stat rename or consolidation no longer touches 127 `statChanges` sites.
- **Saving toward a goal.** Banking currency for a threshold (40 serve unlocks X) creates
  mid-length goals. This pairs with `statThreshold` challenges and any future stat-gated abilities.
- **Hooks for other systems:**
  - Archetype specialties could discount their phase's stats, tying the decision layer to the
    stats.
  - Coaches and relationships could offer discounts or currency conversions.
  - Equipment could carry "+10% Technique income".
- **Tier caps.** For example, no stat above 50 in tier 1. That is a single check on purchase.
  Today it would need a clamp in `applyStatBoosts` that silently discards earned points.
- **Respec.** Refunding purchases is well-defined once purchases are recorded. Respec tokens already
  exist for the archetype tree, and the same tokens could cover stats.

---

## 5. Risks and costs

| risk                                                              | mitigation                                                                                                       |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Solvable min-max (§3.1)                                           | price bands (§3.3); re-derive them whenever `statChannels` moves                                                 |
| Under-valued stats become visible traps (§3.4)                    | fix the value table first (`statInContext`); band prices make up the rest                                        |
| Extra step after every training: decision fatigue                 | keep the anchor core `+1` direct; add "spend later" and a one-tap "suggested" spend                              |
| Lost immediate feedback ("+1 Serve!" becomes "+2 Technique")      | same: the direct core grant keeps the visible stat bump                                                          |
| A third currency next to XP and specialization points             | the shop sells currency for XP; XP stays the meta-currency; spec points stay separate (they buy behaviour)       |
| Hoarding: players never spend, then lose                          | unspent-points indicator (the `activeIndicators` system); prompt on the pre-match screen                         |
| Price table becomes a maintained balance artefact                 | live next to `shotThresholds.ts` and add an `economyCheck` invariant, e.g. band order matches the measured value |
| Content conversion: 127 story `statChanges`, 29 challenge rewards | mechanical: map each stat to its recipe's dominant currency. Script it, then hand-review the outliers            |

---

## 6. Options

All four use fork A. They differ in how much they replace.

**A. Hybrid, single currency.** Training keeps `+1` to the anchor core and pays Development Points
(DP) in place of random supports. Story events and challenges pay DP. Each stat has a price band
and a step curve.

- _Pros:_ smallest change. One number in the wallet. Measured in §3.3, since this is exactly the
  `banded` model.
- _Cons:_ loses the "Strength vs Technique" flavor. All activities feel the same apart from the
  amount they pay.

**B. Full single currency.** As A, but the anchor core also comes out of DP.

- _Pros:_ maximum freedom.
- _Cons:_ loses training's visible payoff. The anchor pick no longer means anything (any training
  pays DP), so the training screen loses its decision. Not recommended.

**C. Typed currencies, flat recipes.** This is the proposal as stated. Power / Quickness / Technique
/ Mind. Each stat has a recipe ("serve = 3 Power + 1 Technique"). Each activity pays the currencies
that fit it. Without price bands it carries the §3.1 problem, softened by however unevenly the
currencies are supplied.

**D. Typed currencies, recipes sized to the price bands (recommended).** As C, but the number of
units in a recipe _is_ the band: cheap 2, standard 3, premium 4 (ratios 0.67 / 1 / 1.33, close to
the measured bands). The step curve multiplies the recipe. The anchor core `+1` stays direct.

- _Pros:_ gets the flavor of C and the balance of A from one table. The player learns the band from
  the recipe length rather than from a hidden multiplier.

A first draft of the D recipe table, per +1 before the step multiplier:

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
| slice        | cheap    | 2 Technique                        |

Buying +1 of everything takes 11 Power, 9 Quickness, 13 Technique and 10 Mind. That is roughly
balanced, but Technique is the scarcest.

Supply would follow the anchors:

| source         | currencies paid                            |
| -------------- | ------------------------------------------ |
| serve training | Power, Technique                           |
| forehand       | Power, Technique                           |
| backhand       | Technique, Quickness                       |
| return         | Quickness, Mind                            |
| net            | Quickness, Technique                       |
| matches        | Mind (new: "you learn tactics by playing") |

Story events pay whatever fits their fiction.

The anchor pick still means something, because it decides which currencies come in. Currency
supply then quietly limits the most extreme builds, on top of the bands.

---

## 7. What would need to be built

### Types (`src/types/`)

- `AttributeCurrency = 'power' | 'quickness' | 'technique' | 'mind'`
- `CurrencyAmounts = Partial<Record<AttributeCurrency, number>>`
- `Player.wallet: Record<AttributeCurrency, number>`
- `Player.statPurchases`, needed only if respec ships. It records what was bought, so refunds are
  exact.

### Data and config

- `src/data/statRecipes.ts`: the §6 table.
- The step curve and tier caps live in config next to `shotThresholds.ts`.

### Core logic (`src/game/StatDevelopment.ts`, pure)

- `priceOf(stat, currentValue)` returns `CurrencyAmounts`.
- `canAfford(wallet, price)`.
- `purchase(player, stat)` returns `OperationResult<Player>`, with the tier-cap check.
- `refund(...)`, if respec ships.

### Sources rewritten to pay currency

| source                      | change                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AnchorTrainingSystem`      | supports become currency, chosen from the anchor's pair. `TrainingResult` gains `currencyGained`, and `statBoosts` keeps only the core. `TRAINING_*` effect keys retarget to currency |
| `StoryEventOutcome.effects` | `statChanges` becomes `currency` (127 sites; scripted conversion)                                                                                                                     |
| challenge rewards           | `modifiers.statBoosts` becomes `currency` (29 sites)                                                                                                                                  |
| shop                        | `stat_increase` items become currency packs, priced in XP                                                                                                                             |
| match rewards               | new: a little Mind per match, scaled by performance, through `MatchRewardSystem`                                                                                                      |
| `PlayerManager`             | `applyStatBoosts` stays for the core grant and equipment. `addAbility` / `upgradeAbility` stop applying ability `statBoosts`, which are empty anyway                                  |

### Store (`gameStore.ts`)

- `purchaseStat(stat)`, plus optionally `purchaseStats(plan)` for a confirm-at-once flow.
- Wallet updates go into `applyTrainingResult`, story outcome application and `claimChallenge`.
- `checkChallengeCompletion()` runs after a purchase, since a purchase can satisfy a `statThreshold`.
- Migration: backwards compatibility is not required. A new version adds `wallet` at zero, and the
  existing stats stay as they are. `migrationCheck` needs the entry.

### Screens

| screen                                                              | change                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Development** (new)                                               | Stats by category, current value, next price as currency chips (greyed out if unaffordable), `+1` buttons, a pending plan with confirm/undo, OVR preview. Opens from the main menu, the wallet chip and the training result. Reuses `StatTile` / `PlayerStatsDisplay` |
| `StatusBar`                                                         | wallet chip, with an indicator when currency is unspent                                                                                                                                                                                                               |
| `TrainingResultModal`                                               | shows core `+1` and the currency earned, plus a "Spend now" button                                                                                                                                                                                                    |
| `StoryEventResultModal`, `ChallengeRewardChips`, `ui/StatBoostList` | render currency next to stat changes                                                                                                                                                                                                                                  |
| `Shop`                                                              | currency packs replace stat items                                                                                                                                                                                                                                     |
| `AnchorTraining`                                                    | the anchor card shows which currencies it pays, not the support pool                                                                                                                                                                                                  |
| tutorial (`tutorialSteps.ts`)                                       | a new step for spending, and the training step reworded                                                                                                                                                                                                               |
| `Encyclopedia` / `glossary.ts`                                      | entries for the currencies and price bands                                                                                                                                                                                                                            |

Test ids, following the `CLAUDE.md` conventions:

- `dev-stat-${stat}` (with `data-value` and `data-affordable`)
- `dev-buy-${stat}`
- `dev-confirm`
- `wallet-chip`

### Tests and harnesses

- `economyCheck`:
  - prices are monotonic in value;
  - recipe length matches the band;
  - a purchase never exceeds the wallet or the tier cap;
  - the shop pack price per unit stays above the training rate.
- A new e2e spec, `development.spec.ts`: train, open Development, buy, check the stat. The training
  assertions in `trainingMinigame.spec.ts` and `bot.ts` need updating.
- `allocationProbe` gains a `recipes` cost model once the table is settled.

---

## 8. Decisions needed

1. **Option A or D?** A single currency is the cheaper build. Typed currencies give the flavor the
   proposal asked for.
2. **Does training keep the direct core `+1`?** Recommended yes (§5).
3. **Respec:** never, via tokens (as in the archetype tree), or free within a day?
4. **Should prices show the value bands openly?** Under D the recipe length shows them. That is
   honest, but it tells players which stats matter.
5. **Tier caps on stats?** Cheap to add, and they bound how far a skewed build can get ahead of
   content.
6. **Does the shop keep selling stats directly?** Recommended no (§3.5).

---

## 9. Next avenues

This is a long-running investigation. Here is what each next step would settle, in priority order:

1. **Run `statInContext` for the four identity builds with their archetypes on.** This settles
   whether the baseliner gap (§3.4) is real for a real baseliner. If it is, it needs a sim fix
   before any spend UI ships, or the bands have to absorb it.
2. **Calibrate income with a career sim.** Run 40 days of play under options A and D and match the
   day-39 power level in `characterSim`. This settles the currency-per-session numbers and the
   +10–15% figure from §3.3.
3. **Measure archetype discounts.** Specialties discount their phase's stats. Test whether this
   narrows the identity spread further or re-opens min-maxing.
4. **Paper-prototype the Development screen**, including where the confirm step sits in the
   training loop.
5. **Script the content conversion** of `statChanges` to currency, and review the diff for
   outliers.

```
npx tsx src/test/analysis/allocationProbe.ts                    # ~2 min, N=60
N=250 BUDGETS=280 CURVES=flat,step20,banded npx tsx src/test/analysis/allocationProbe.ts
npx tsx src/test/analysis/statIncome.ts
```

**Measurement baseline:** taken on `a680f19`. A change to the simulation invalidates the
point-win figures and the price bands derived from them.
