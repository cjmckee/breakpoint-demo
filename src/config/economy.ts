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
 * every currency is in three drills and a slot offering four of the six always
 * offers every currency. Across the six, the supply
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
 * pool of pool × overall/100 split by what each area added to the overall. An
 * area pays the currencies that buy its stats (GAME_AREA_WEIGHTS through
 * STAT_RECIPES), so a good serving day pays mostly Power; Clutch pays `clutch`.
 * The base means every match pays some of every currency; the
 * pool means how you played still decides most of the difference. Amounts are
 * literal units — INCOME_SCALE does not apply.
 *
 * The base is small, so how the match went decides most of what it pays and a
 * player strong in one area sees it in that area's currencies; it leans to
 * Technique, which the most stats need. The pool is sized with careerSim LEDGER so
 * a career earns what it did when the base was most of a match's pay.
 */
export const MATCH_PAYOUT = {
  base: {
    lost: { power: 1, quickness: 1, technique: 2, mind: 1 },
    won: { power: 2, quickness: 2, technique: 3, mind: 2 },
  },
  pool: 30,
  clutch: { mind: 1 },
};

/**
 * Story and challenge stat grants convert to currency at this rate per stat
 * point through the stat's recipe (CurrencyIncome.contentCurrency).
 */
export const CONTENT_SCALE = INCOME_SCALE;

/**
 * What story outcomes and challenge rewards actually pay: their authored currency ×
 * `scale` (CurrencyIncome.storyPay). The authored amounts were sized against a
 * careerSim that paid story as a flat trickle; played as the game plays it
 * (storyStream), story paid about 3.5× that. A field rather than a constant so
 * careerSim can sweep it (STORY_PAY=…).
 */
export const STORY_PAY = { scale: 1 };

export type AbilityPriceRarity = 'common' | 'uncommon' | 'rare';

/**
 * Abilities cost XP plus `units` of currency per rarity. An on-court ability pays
 * them in the mix of the stats it works through (ABILITY_STATS); an off-court one
 * pays OFF_COURT_ABILITY_PRICE. Levels cost more (ABILITY_LEVEL_PRICE).
 * Legendaries are never sold.
 *
 * Sized to what an ability is worth in stats (abilityProbe, statValueProbe): on
 * the Club build it suits, a common adds about as much point-win as 18 units of
 * stats. Uncommons and rares were worth about 33 and 54 units on Club builds;
 * they're sold from Regional and the Tour, where stats cost ×2 and ×3
 * (PRICE_STEP), so they're priced at about that multiple.
 */
export const ABILITY_PRICES: Record<AbilityPriceRarity, { units: number; xp: number }> = {
  common: { units: 20, xp: 70 },
  uncommon: { units: 60, xp: 140 },
  rare: { units: 150, xp: 250 },
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
 * The stats each on-court ability works through. Its price is paid in their
 * recipes (STAT_RECIPES) added together, so a power shot costs mostly Power, a
 * movement ability Quickness and a key-moment ability Mind. An ability not listed
 * here is off-court (mood, events, energy, XP, minigames).
 */
export const ABILITY_STATS: Readonly<Record<string, readonly StatName[]>> = {
  heavy_hitter: ['forehand', 'strength'],
  overhead_smash: ['net', 'strength'],
  serve_cannon: ['serve', 'strength'],
  spin_master: ['spin', 'slice'],
  soft_hands: ['net', 'placement'],
  baseliner: ['forehand', 'backhand', 'stamina'],
  netcrasher: ['net', 'placement'],
  rangy_return: ['return', 'speed'],
  slider: ['speed', 'stamina'],
  speed_demon: ['speed', 'stamina', 'anticipation'],
  all_court_maestro: ['speed', 'anticipation', 'forehand', 'backhand', 'net'],
  clutch: ['focus', 'tactics'],
  mental_fortitude: ['focus'],
  pressure_cooker: ['focus', 'tactics', 'placement'],
  iron_will: ['focus', 'stamina'],
};

/** An off-court ability costs XP plus `share` of its rarity's units, in `currency`. */
export const OFF_COURT_ABILITY_PRICE: { currency: CurrencyAmounts; share: number } = {
  currency: { mind: 1 },
  share: 0.5,
};
