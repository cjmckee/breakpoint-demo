/**
 * Stat economy — the currency design in docs/proposals/stat-currency-progression.md
 * §6.1, as the analysis harnesses pay it. One copy, so the career sim and the
 * allocation probe cannot drift apart: change a recipe or the step curve here
 * and every harness that buys stats pays the new price.
 */

import type { StatName } from '../../types';

export type Currency = 'power' | 'quickness' | 'technique' | 'mind';
export const CURRENCIES: Currency[] = ['power', 'quickness', 'technique', 'mind'];
export type Wallet = Record<Currency, number>;
export type Amounts = Partial<Wallet>;

export const RECIPES: Record<StatName, Amounts> = {
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
 * ×1 below STEP_FROM (default 40), then one step more every 20 points: at 40,
 * ×2 in the 40s-50s, ×3 in the 60s-70s, ×4 from 80. STEP_FROM=50 moves every
 * step up 10 points.
 */
const STEP_FROM = Number(process.env.STEP_FROM ?? 40);
export const stepMultiplier = (v: number): number =>
  1 + Math.floor(Math.max(0, v - (STEP_FROM - 20)) / 20);

export const priceOf = (stat: StatName, value: number): Amounts => {
  const m = stepMultiplier(value);
  const out: Amounts = {};
  for (const [c, n] of Object.entries(RECIPES[stat]) as Array<[Currency, number]>) out[c] = n * m;
  return out;
};
export const unitsOf = (a: Amounts): number => Object.values(a).reduce((x, y) => x + (y ?? 0), 0);
export const canAfford = (w: Wallet, p: Amounts): boolean =>
  (Object.entries(p) as Array<[Currency, number]>).every(([c, n]) => w[c] >= n);
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
