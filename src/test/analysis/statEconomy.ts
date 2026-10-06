/**
 * Stat economy — the game's own economy (config/economy.ts and
 * game/StatDevelopment.ts), with the mutable helpers the harnesses spend with.
 * Recipes and the step curve are not copied here, so the career sim always
 * pays what the game charges.
 *
 * STEP_FROM overrides where the price steps start, for this process only.
 */

import type { Currency, CurrencyAmounts, Wallet } from '../../types/game';
import { CURRENCIES, PRICE_STEP, STAT_RECIPES } from '../../config/economy';
import { canAfford, priceOf, stepMultiplier, unitsOf } from '../../game/StatDevelopment';

if (process.env.STEP_FROM) PRICE_STEP.from = Number(process.env.STEP_FROM);

export type { Currency, Wallet };
export type Amounts = CurrencyAmounts;
export { CURRENCIES, canAfford, priceOf, stepMultiplier, unitsOf };
export const RECIPES = STAT_RECIPES;

export const pay = (w: Wallet, p: Amounts): void => {
  for (const [c, n] of Object.entries(p) as Array<[Currency, number]>) w[c] -= n;
};
export const earn = (w: Wallet, a: Amounts, scale = 1): void => {
  for (const [c, n] of Object.entries(a) as Array<[Currency, number]>) w[c] += n * scale;
};
/** Split `units` across a recipe in its own ratio. */
export const inRatio = (recipe: Amounts, units: number): Amounts => {
  const total = unitsOf(recipe);
  const out: Amounts = {};
  for (const [c, n] of Object.entries(recipe) as Array<[Currency, number]>)
    out[c] = (units * n) / total;
  return out;
};
