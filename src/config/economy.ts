/**
 * The stat-currency economy: what stats cost, what activities pay, and what
 * abilities cost. One copy, read by the game and by the analysis harnesses
 * (careerSim and friends), so the model the balance was measured on and the
 * game cannot drift apart.
 *
 * Design and calibration: docs/proposals/stat-currency-progression.md,
 * docs/research/simulation-findings.md.
 */

import type { Currency, CurrencyAmounts, OpponentTier } from '../types/game';
import type { StatName } from '../types';
import type { DrillId } from '../minigames/types';

export const CURRENCIES: readonly Currency[] = ['power', 'quickness', 'technique', 'mind'];

export const CURRENCY_LABELS: Record<Currency, string> = {
  power: 'Power',
  quickness: 'Quickness',
  technique: 'Technique',
  mind: 'Mind',
};

/**
 * What one stat point costs at the ×1 step, by stat. A recipe's length is its
 * price band: cheap (2 units), standard (3), premium (4).
 */
export const STAT_RECIPES: Record<StatName, CurrencyAmounts> = {
  serve: { power: 3, technique: 1 },
  return: { quickness: 2, technique: 1, mind: 1 },
  anticipation: { mind: 3, quickness: 1 },
  speed: { quickness: 3, power: 1 },
  tactics: { mind: 3, technique: 1 },
  forehand: { power: 2, technique: 1 },
  backhand: { technique: 2, quickness: 1 },
  placement: { technique: 2, mind: 1 },
  strength: { power: 3 },
  spin: { technique: 2, power: 1 },
  focus: { mind: 2 },
  stamina: { power: 1, quickness: 1 },
  net: { quickness: 1, technique: 1 },
  slice: { technique: 2 },
};

/**
 * The price step: a recipe costs ×1 below `from`, and one step more every
 * `width` points after (×2 in the 40s–50s, ×3 in the 60s–70s, ×4 from 80).
 */
export const PRICE_STEP = { from: 40, width: 20 };

/**
 * Scales story and challenge grants (CONTENT_SCALE). Calibrated so a career
 * keeps pace with the story team matches through day 31 (careerSim). Training
 * and matches pay the literal amounts below.
 */
export const INCOME_SCALE = 1.2;

/**
 * What each drill pays per clean rep: two of its main currency and one of a
 * secondary. A session pays its mix × (reps + 1), so even a session with no
 * clean reps pays one mix. Four currencies make six pairs, one drill each, so
 * every currency is in three drills and a roll of three drills offers each
 * currency in all but about one slot in twenty. Across the six, the supply
 * (P 28%, Q 22%, T 28%, M 22%) sits close to what the stat recipes demand
 * (P 26%, Q 21%, T 30%, M 23%).
 */
export const TRAINING_MIXES: Record<DrillId, CurrencyAmounts> = {
  rally_rhythm: { power: 2, technique: 1 },
  split_step: { power: 2, quickness: 1 },
  corner_paint: { technique: 2, quickness: 1 },
  touch_slice: { technique: 2, mind: 1 },
  read_return: { quickness: 2, mind: 1 },
  toss_and_strike: { mind: 2, power: 1 },
};

/**
 * A match pays a base by result, the same however it went, plus a performance
 * pool of pool × overall/100 split by the per-area scores (serving → Power,
 * returning → Quickness, rally → Technique, net → Quickness and Technique,
 * mental → Mind). The base means every match pays some of every currency; the
 * pool means how you played still decides most of the difference. Amounts are
 * literal units — INCOME_SCALE does not apply.
 */
export const MATCH_PAYOUT = {
  base: {
    lost: { power: 2, quickness: 2, technique: 2, mind: 5 },
    won: { power: 3, quickness: 3, technique: 3, mind: 6 },
  },
  pool: 20,
};

/**
 * Story and challenge stat grants convert to currency at this rate per stat
 * point through the stat's recipe (CurrencyIncome.contentCurrency).
 */
export const CONTENT_SCALE = INCOME_SCALE;

export type AbilityPriceRarity = 'common' | 'uncommon' | 'rare';

/**
 * Abilities cost a fixed amount per rarity in the currency their effect draws
 * on, plus XP. Levels cost more (ABILITY_LEVEL_PRICE). Legendaries are never sold.
 */
export const ABILITY_PRICES: Record<AbilityPriceRarity, { units: number; xp: number }> = {
  common: { units: 15, xp: 70 },
  uncommon: { units: 28, xp: 140 },
  rare: { units: 40, xp: 250 },
};

/**
 * What a level costs once the ability is owned: level n → n+1 costs the base ×
 * (step + perLevel × n). From `xpOnlyFrom` owned levels on, a level costs XP
 * only, at `xpOnlyScale` × its XP price: currency buys the ability, XP grows it.
 * Infinity charges currency for every level.
 */
export const ABILITY_LEVEL_PRICE = {
  step: 1.5,
  perLevel: 0.75,
  xpOnlyFrom: Infinity,
  xpOnlyScale: 1,
};

/**
 * How the shop's ability offers split by rarity, by the player's tier. Each
 * season opens a rarity: commons at Club, uncommons from Regional, rares from the
 * Tour (mid-late-progression.md §5), so a stronger ability is something to grow
 * into rather than a lucky day-7 roll.
 */
export const ABILITY_OFFER_WEIGHTS: Record<OpponentTier, Record<AbilityPriceRarity, number>> = {
  1: { common: 1, uncommon: 0, rare: 0 },
  2: { common: 0.6, uncommon: 0.4, rare: 0 },
  3: { common: 0.5, uncommon: 0.35, rare: 0.15 },
  4: { common: 0.5, uncommon: 0.35, rare: 0.15 },
};

/** The rarity a roll in [0, 1) picks for an offer at this tier. */
export function offerRarity(roll: number, tier: OpponentTier): AbilityPriceRarity {
  let left = roll;
  for (const [rarity, weight] of Object.entries(ABILITY_OFFER_WEIGHTS[tier])) {
    left -= weight;
    if (left < 0) return rarity as AbilityPriceRarity;
  }
  return 'common';
}

/** What taking an ability of this rarity from `currentLevel` to the next costs. */
export function abilityLevelPrice(
  rarity: AbilityPriceRarity,
  currentLevel: number,
): { units: number; xp: number } {
  const base = ABILITY_PRICES[rarity];
  const p = ABILITY_LEVEL_PRICE;
  const scale = currentLevel === 0 ? 1 : p.step + p.perLevel * currentLevel;
  if (currentLevel >= p.xpOnlyFrom) {
    return { units: 0, xp: Math.round(base.xp * scale * p.xpOnlyScale) };
  }
  return { units: Math.round(base.units * scale), xp: Math.round(base.xp * scale) };
}

/**
 * The currency each on-court ability is priced in: shot power is Power, touch
 * and spin are Technique, movement is Quickness, the mental game is Mind. An
 * ability not listed here (an off-court one: mood, events, energy, XP,
 * minigames) costs XP only.
 */
export const ABILITY_CURRENCY: Readonly<Record<string, Currency>> = {
  heavy_hitter: 'power',
  overhead_smash: 'power',
  serve_cannon: 'power',
  spin_master: 'technique',
  soft_hands: 'technique',
  baseliner: 'technique',
  netcrasher: 'technique',
  rangy_return: 'quickness',
  slider: 'quickness',
  speed_demon: 'quickness',
  all_court_maestro: 'quickness',
  clutch: 'mind',
  mental_fortitude: 'mind',
  pressure_cooker: 'mind',
  iron_will: 'mind',
};
