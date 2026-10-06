# Currency build plan

How the stat-currency design ([`stat-currency-progression.md`](./stat-currency-progression.md))
lands in the game, as a stack of PRs. The stack merges to `main` together, after tinkering and
testing on the feature branches; each PR is reviewed on its own.

## Principles

- **Playable at every step.** Each PR leaves the game playable end to end, so the stack can be
  played and tested at any layer. That is why spending lands before the sources switch: until
  step 3, training and story still grant stats directly, and the new screen can be tried with
  currency granted from the debug panel.
- **One copy of the economy.** Recipes, the step curve, ability prices and income rates move into
  game code in step 1. `careerSim` and the other harnesses import them, so the model and the game
  cannot drift.
- **No backwards compatibility** (CLAUDE.md). A save migration adds an empty wallet; stats stay
  as they are.
- **Test ids** on every new surface, per the CLAUDE.md conventions.

## The stack

```
main
 └─ 0  research: simulation changes, harnesses, docs        claude/player-stat-progression-research-utbqgo
     └─ 1  currency core                                     claude/currency-1-core
         └─ 2  spending: Development screen                  claude/currency-2-spending
             └─ 3  training and matches pay currency         claude/currency-3-income
                 └─ 4  story and challenges pay currency     claude/currency-4-content
                     └─ 5  shop and abilities                claude/currency-5-shop
                         └─ 6  surfaces, tutorial, e2e       claude/currency-6-polish
```

### 0. Research (exists)

This branch: net rush, specialty amplification, momentum rhythm, the ability retune and its engine
fixes (serves now get ability effects), the shop's rarity rules, the Apologist's drives, and the
harnesses and docs that justify them. Already playable; no currency yet.

### 1. Currency core

- Types: `Currency`, `CurrencyAmounts`, `Player.wallet`.
- `src/config/economy.ts`: recipes, price step curve, training payout, match payout, ability
  prices per rarity, income scale. Values as calibrated in `careerSim`.
- `src/game/StatDevelopment.ts` (pure): `priceOf`, `canAfford`, `planCost`, `purchase(player,
plan)` returning `OperationResult<Player>`, `applyCurrency(wallet, delta)` with the clamp at
  zero for losses.
- Store: `wallet` on the player, migration to a new store version, `migrationCheck` entry.
- Debug panel: grant currency.
- Harnesses import the economy from game code; `statEconomy.ts` becomes a re-export.
- Checks: a `currencyCheck` in `npm test` (prices, plan cost, clamp, purchase validation).

### 2. Spending

- Store: `purchaseStats(plan)`, validated whole and applied at once; `checkChallengeCompletion()`
  after a purchase (a purchase can satisfy a `statThreshold`).
- **Development screen**, from the paper prototype: stats by category, recipe chips and price
  band, +1 builds a pending plan, undo, confirm with the permanence warning. Opens from the main
  menu and the wallet chip.
- `StatusBar` wallet chip with an unspent indicator.

### 3. Training and matches pay currency

- `AnchorTrainingSystem`: no stat boosts; `TrainingResult.currencyGained` in the anchor's recipe
  ratio plus the general and Mind shares, scaled by reps. Support pools go.
- `MatchRewardSystem`: currency per match by performance (Mind share plus the per-area split).
- `TrainingResultModal`: currency earned, and "what this buys" as one-tap +1s.
- `MatchSummaryModal`: currency earned.

### 4. Story and challenges pay currency

- Apply the content conversion: story `statChanges` and challenge `statBoosts` become `currency`,
  penalties as losses clamped at zero. The dry run
  ([`content-conversion-dry-run.md`](./content-conversion-dry-run.md)) is the review copy; the
  script writes the change.
- Types: `StoryEventOutcome.effects.currency`, challenge `reward.currency`.
- `StoryEventResultModal`, `ChallengeRewardChips`, `ChallengeRewardModal`, `StatBoostList` render
  currency.

### 5. Shop and abilities

- Remove `stat_increase` items and their pricing.
- Abilities priced in their effect's currency by rarity plus XP, levels escalating; off-court
  abilities XP only.
- Shop cards show currency + XP.

### 6. Surfaces, tutorial, e2e

- `AnchorTraining` card shows the currencies an anchor pays and the stats they feed.
- Tutorial: a spending step; the training step reworded.
- Glossary and encyclopedia: the currencies and price bands.
- e2e: Development screen spec, training → spend flow, story penalty clamp; update specs that
  read stat gains from training or story.
- Docs: CLAUDE.md patterns, README.

## Verification at each step

`npm run typecheck:node`, `npm test`, Prettier, and from step 3 a `careerSim` run against the
game's own economy config to confirm income still keeps players on pace with the story matches.
