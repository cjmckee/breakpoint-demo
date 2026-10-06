/**
 * The stat-currency economy: what stats cost, what activities pay, and what
 * abilities cost. One copy, read by the game and by the analysis harnesses
 * (careerSim and friends), so the model the balance was measured on and the
 * game cannot drift apart.
 *
 * Design and calibration: docs/proposals/stat-currency-progression.md,
 * docs/research/simulation-findings.md.
 */

import type { Currency, CurrencyAmounts } from '../types/game';
import type { StatName } from '../types';

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
 * Scales every income source. Calibrated so a career keeps pace with the story
 * team matches through day 31 (careerSim).
 */
export const INCOME_SCALE = 1.2;

/**
 * A training session pays (base + perRep × reps) × INCOME_SCALE units:
 * generalShare split evenly across currencies, mindShare as Mind, the rest in
 * the anchor's recipe ratio.
 */
export const TRAINING_PAYOUT = {
  base: 2,
  perRep: 3,
  generalShare: 0.2,
  mindShare: 0.1,
};

/**
 * A match pays units × (0.5 + overall/100) × INCOME_SCALE, by the performance
 * breakdown's overall score: mindShare as Mind, the rest by the per-area scores
 * (serving → Power, returning → Quickness, rally → Technique, net → Quickness
 * and Technique, mental → Mind).
 */
export const MATCH_PAYOUT = {
  units: 16,
  mindShare: 0.6,
};

/**
 * Story and challenge stat grants convert to currency at this rate per stat
 * point through the stat's recipe (CurrencyIncome.contentCurrency).
 */
export const CONTENT_SCALE = INCOME_SCALE;

export type AbilityPriceRarity = 'common' | 'uncommon' | 'rare';

/**
 * Abilities cost a fixed amount per rarity in the currency their effect draws
 * on, plus XP. Level n → n+1 costs base × (1.5 + 0.75 × n). Legendaries are
 * never sold.
 */
export const ABILITY_PRICES: Record<AbilityPriceRarity, { units: number; xp: number }> = {
  common: { units: 15, xp: 70 },
  uncommon: { units: 28, xp: 140 },
  rare: { units: 40, xp: 250 },
};
