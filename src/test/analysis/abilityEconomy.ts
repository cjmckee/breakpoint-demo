/**
 * Ability economy — abilities as the career sim buys them.
 *
 * Decisions (stat-currency-progression.md §8): abilities cost a fixed price
 * per rarity in the currency their effect draws on, plus XP; levels cost more
 * as they rise; legendaries are never sold; how often a rarity is offered
 * depends on the rarity. The currency follows §6.4: shot power is Power, touch
 * and spin are Technique, movement is Quickness, the mental keys are Mind.
 *
 * Values are each ability's level-1 point-win gain on each career identity's
 * day-23 build, measured after the rarity retune (abilityProbe and
 * mentalAbilityProbe, N=600-1000, rhythm off; simulation-findings.md). A level
 * is worth value × ABILITY_LEVEL_MULTIPLIER[level].
 */

import { ABILITY_LEVEL_MULTIPLIER } from '../../config/shotThresholds';
import { ABILITY_PRICES } from '../../config/economy';
import type { Currency } from './statEconomy';

export type Rarity = 'common' | 'uncommon' | 'rare';
export type IdentityName = 'bigServer' | 'counter' | 'netRusher' | 'baseliner';

export interface BuyableAbility {
  id: string;
  rarity: Rarity;
  currency: Currency;
}

export const BUYABLE: BuyableAbility[] = [
  { id: 'heavy_hitter', rarity: 'common', currency: 'power' },
  { id: 'overhead_smash', rarity: 'common', currency: 'power' },
  { id: 'spin_master', rarity: 'common', currency: 'technique' },
  { id: 'soft_hands', rarity: 'common', currency: 'technique' },
  { id: 'baseliner', rarity: 'common', currency: 'technique' },
  { id: 'netcrasher', rarity: 'common', currency: 'technique' },
  { id: 'rangy_return', rarity: 'common', currency: 'quickness' },
  { id: 'slider', rarity: 'common', currency: 'quickness' },
  { id: 'serve_cannon', rarity: 'uncommon', currency: 'power' },
  { id: 'speed_demon', rarity: 'uncommon', currency: 'quickness' },
  { id: 'clutch', rarity: 'uncommon', currency: 'mind' },
  { id: 'all_court_maestro', rarity: 'rare', currency: 'quickness' },
  { id: 'mental_fortitude', rarity: 'rare', currency: 'mind' },
  { id: 'pressure_cooker', rarity: 'rare', currency: 'mind' },
  { id: 'iron_will', rarity: 'rare', currency: 'mind' },
];

/** Level-1 point-win gain, by identity (bigServer, counter, netRusher, baseliner). */
const VALUES: Record<string, [number, number, number, number]> = {
  heavy_hitter: [0.12, 0.6, 0.59, 1.32],
  overhead_smash: [0.97, 0.19, 0.48, 0.09],
  spin_master: [0.22, 0.65, 0.32, 1.09],
  soft_hands: [0.47, 0.09, 0.98, 0.03],
  baseliner: [0.87, 0.89, 0.43, 0.69],
  netcrasher: [0.62, 0.08, 1.05, 0.07],
  rangy_return: [0.41, 1.01, 0.93, 0.78],
  slider: [0.27, 0.65, 0.51, 0.58],
  serve_cannon: [1.56, 0.85, 1.22, 1.13],
  speed_demon: [1.02, 1.66, 1.07, 1.22],
  clutch: [1.47, 1.68, 1.82, 1.76],
  all_court_maestro: [1.54, 2.72, 1.43, 1.86],
  mental_fortitude: [2.38, 2.6, 2.86, 2.78],
  pressure_cooker: [2.23, 2.37, 2.55, 2.46],
  iron_will: [2.76, 2.66, 2.94, 0.88],
};
const IDENTITY_INDEX: Record<IdentityName, number> = {
  bigServer: 0,
  counter: 1,
  netRusher: 2,
  baseliner: 3,
};

const env = (k: string, d: number): number => Number(process.env[k] ?? d);

/** Currency units at level 1, by rarity. */
export const ABILITY_UNITS: Record<Rarity, number> = {
  common: env('ABILITY_UNITS_C', ABILITY_PRICES.common.units),
  uncommon: env('ABILITY_UNITS_U', ABILITY_PRICES.uncommon.units),
  rare: env('ABILITY_UNITS_R', ABILITY_PRICES.rare.units),
};
/** XP at level 1, by rarity. */
export const ABILITY_XP: Record<Rarity, number> = {
  common: ABILITY_PRICES.common.xp,
  uncommon: ABILITY_PRICES.uncommon.xp,
  rare: ABILITY_PRICES.rare.xp,
};
/** Shop offer weights by rarity, and offers per day. */
const OFFER_WEIGHTS: Array<[Rarity, number]> = [
  ['common', 0.5],
  ['uncommon', 0.35],
  ['rare', 0.15],
];
export const OFFERS_PER_DAY = env('ABILITY_OFFERS', 2);
const MAX_LEVEL = ABILITY_LEVEL_MULTIPLIER.length - 1;

/**
 * Price to go from `level` to `level + 1` (level 0 = buying it): the shop's own
 * escalation, base × (1.5 + 0.75 × level) once owned, applied to currency and XP.
 */
export function priceFor(a: BuyableAbility, level: number): { units: number; xp: number } {
  const scale = level === 0 ? 1 : 1.5 + 0.75 * level;
  return {
    units: Math.round(ABILITY_UNITS[a.rarity] * scale),
    xp: Math.round(ABILITY_XP[a.rarity] * scale),
  };
}

/** Point-win gained by going from `level` to `level + 1`, on this identity. */
export function valueGain(a: BuyableAbility, identity: IdentityName, level: number): number {
  if (level >= MAX_LEVEL) return 0;
  const base = VALUES[a.id][IDENTITY_INDEX[identity]];
  return base * (ABILITY_LEVEL_MULTIPLIER[level + 1] - ABILITY_LEVEL_MULTIPLIER[level]);
}

/** One day's offers, rarity first, then an ability of that rarity. */
export function dailyOffers(rng: () => number = Math.random): BuyableAbility[] {
  const out: BuyableAbility[] = [];
  for (let i = 0; i < OFFERS_PER_DAY; i++) {
    let roll = rng();
    const rarity = OFFER_WEIGHTS.find(([, w]) => (roll -= w) < 0)?.[0] ?? 'common';
    const pool = BUYABLE.filter((a) => a.rarity === rarity);
    out.push(pool[Math.floor(rng() * pool.length)]);
  }
  return out;
}
