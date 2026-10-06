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
import type { CoreStats, StatName } from '../types';

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
 * What each training pays per clean rep: two of its main currency and one of a
 * secondary. A session pays its mix × (reps + 1), so even a session with no
 * clean reps pays one mix. The five shots are five different mixes rather than
 * a mirror of their stat recipes — each is a way to steer what you earn.
 * Across the five, the supply (P 27%, Q 20%, T 33%, M 20%) sits close to what
 * the stat recipes demand (P 26%, Q 21%, T 30%, M 23%); matches pay most Mind.
 */
export const TRAINING_MIXES: Record<keyof CoreStats, CurrencyAmounts> = {
  serve: { power: 2, mind: 1 },
  forehand: { power: 2, technique: 1 },
  backhand: { technique: 2, quickness: 1 },
  return: { quickness: 2, mind: 1 },
  net: { technique: 2, mind: 1 },
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
 * on, plus XP. Level n → n+1 costs base × (1.5 + 0.75 × n). Legendaries are
 * never sold.
 */
export const ABILITY_PRICES: Record<AbilityPriceRarity, { units: number; xp: number }> = {
  common: { units: 15, xp: 70 },
  uncommon: { units: 28, xp: 140 },
  rare: { units: 40, xp: 250 },
};

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
