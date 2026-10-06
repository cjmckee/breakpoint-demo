/**
 * StatDevelopment — buying stats with training currency.
 *
 * Pure: no store, no React. Prices come from config/economy.ts. A purchase is
 * a whole plan (a list of +1s, in order) validated and applied at once, so the
 * Development screen can show the cost of everything pending and confirm it in
 * one step.
 */

import type { OperationResult, PlayerStats, StatName } from '../types';
import type { Currency, CurrencyAmounts, Player, Wallet } from '../types/game';
import { CURRENCIES, CURRENCY_LABELS, PRICE_STEP, STAT_RECIPES } from '../config/economy';

const MAX_STAT = 100;

export const STAT_CATEGORY: Record<StatName, keyof PlayerStats> = {
  serve: 'core',
  forehand: 'core',
  backhand: 'core',
  return: 'core',
  net: 'core',
  slice: 'technical',
  spin: 'technical',
  placement: 'technical',
  speed: 'physical',
  stamina: 'physical',
  strength: 'physical',
  focus: 'mental',
  anticipation: 'mental',
  tactics: 'mental',
};

export const STAT_NAMES = Object.keys(STAT_CATEGORY) as StatName[];

export const isStatName = (value: unknown): value is StatName =>
  typeof value === 'string' && value in STAT_CATEGORY;

export function getStat(stats: PlayerStats, stat: StatName): number {
  return (stats[STAT_CATEGORY[stat]] as unknown as Record<StatName, number>)[stat];
}

/** A copy of `stats` with one stat set, clamped to 0-100. */
export function withStat(stats: PlayerStats, stat: StatName, value: number): PlayerStats {
  const category = STAT_CATEGORY[stat];
  return {
    ...stats,
    [category]: { ...stats[category], [stat]: Math.max(0, Math.min(MAX_STAT, value)) },
  };
}

export const emptyWallet = (): Wallet => ({ power: 0, quickness: 0, technique: 0, mind: 0 });

/** ×1 below PRICE_STEP.from, one step more every PRICE_STEP.width points after. */
export function stepMultiplier(value: number): number {
  const below = PRICE_STEP.from - PRICE_STEP.width;
  return 1 + Math.floor(Math.max(0, value - below) / PRICE_STEP.width);
}

/** What raising `stat` from `value` to `value + 1` costs. */
export function priceOf(stat: StatName, value: number): CurrencyAmounts {
  const m = stepMultiplier(value);
  const out: CurrencyAmounts = {};
  for (const [c, n] of Object.entries(STAT_RECIPES[stat]) as Array<[Currency, number]>) {
    out[c] = n * m;
  }
  return out;
}

/** Total units across currencies. */
export const unitsOf = (amounts: CurrencyAmounts): number =>
  CURRENCIES.reduce((sum, c) => sum + (amounts[c] ?? 0), 0);

/** The recipe's price band: cheap (2 units), standard (3), premium (4). */
export function priceBand(stat: StatName): 'cheap' | 'standard' | 'premium' {
  const units = unitsOf(STAT_RECIPES[stat]);
  return units <= 2 ? 'cheap' : units === 3 ? 'standard' : 'premium';
}

export function canAfford(wallet: Wallet, price: CurrencyAmounts): boolean {
  return CURRENCIES.every((c) => wallet[c] >= (price[c] ?? 0));
}

/**
 * Add a currency change to a wallet. Losses clamp each currency at zero: a
 * wallet with 40 that loses 60 ends at 0.
 */
export function applyCurrency(wallet: Wallet, delta: CurrencyAmounts): Wallet {
  const out = { ...wallet };
  for (const c of CURRENCIES) out[c] = Math.max(0, out[c] + (delta[c] ?? 0));
  return out;
}

/** The sum of two amounts. */
export function addAmounts(a: CurrencyAmounts, b: CurrencyAmounts): CurrencyAmounts {
  const out: CurrencyAmounts = {};
  for (const c of CURRENCIES) {
    const v = (a[c] ?? 0) + (b[c] ?? 0);
    if (v !== 0) out[c] = v;
  }
  return out;
}

/** The cost of a plan of +1s taken in order, each priced at the value it starts from. */
export function planCost(stats: PlayerStats, plan: readonly StatName[]): CurrencyAmounts {
  const raised: Partial<Record<StatName, number>> = {};
  let total: CurrencyAmounts = {};
  for (const stat of plan) {
    const value = getStat(stats, stat) + (raised[stat] ?? 0);
    total = addAmounts(total, priceOf(stat, value));
    raised[stat] = (raised[stat] ?? 0) + 1;
  }
  return total;
}

/**
 * Buy a plan of +1s: every stat raised, the whole cost paid, or nothing
 * changes. Fails if any stat would pass 100 or the wallet can't cover it.
 */
export function purchase(player: Player, plan: readonly StatName[]): OperationResult<Player> {
  const fail = (error: string): OperationResult<Player> => ({
    success: false,
    error,
    timestamp: Date.now(),
  });
  if (plan.length === 0) return fail('Nothing to buy');
  const invalid = plan.find((s) => !isStatName(s));
  if (invalid !== undefined) return fail(`Unknown stat: ${String(invalid)}`);

  const counts: Partial<Record<StatName, number>> = {};
  for (const stat of plan) counts[stat] = (counts[stat] ?? 0) + 1;
  for (const [stat, n] of Object.entries(counts) as Array<[StatName, number]>) {
    if (getStat(player.stats, stat) + n > MAX_STAT) {
      return fail(`${stat} can't go past ${MAX_STAT}`);
    }
  }

  const cost = planCost(player.stats, plan);
  if (!canAfford(player.wallet, cost)) {
    const short = CURRENCIES.filter((c) => player.wallet[c] < (cost[c] ?? 0));
    return fail(`Not enough ${short.map((c) => CURRENCY_LABELS[c]).join(' and ')}`);
  }

  let stats = player.stats;
  for (const [stat, n] of Object.entries(counts) as Array<[StatName, number]>) {
    stats = withStat(stats, stat, getStat(stats, stat) + n);
  }
  const wallet = { ...player.wallet };
  for (const c of CURRENCIES) wallet[c] -= cost[c] ?? 0;

  return {
    success: true,
    data: { ...player, stats, wallet, updatedAt: new Date().toISOString() },
    timestamp: Date.now(),
  };
}

/** Whether the player can afford at least one +1 right now (the menu's badge). */
export function canBuyAny(player: Player): boolean {
  return STAT_NAMES.some((stat) => {
    const value = getStat(player.stats, stat);
    return value < MAX_STAT && canAfford(player.wallet, priceOf(stat, value));
  });
}

/**
 * The +1s worth offering right after an activity paid `earned`: stats the
 * player can afford now, ranked by how much of their recipe the payout covers,
 * with `first` (the anchor just trained) ahead of the rest when affordable. So
 * a serve session suggests serve, then strength and forehand, not focus.
 */
export function suggestPurchases(
  player: Player,
  earned: CurrencyAmounts,
  first?: StatName,
  limit: number = 3,
): StatName[] {
  const overlap = (stat: StatName): number => {
    const recipe = STAT_RECIPES[stat];
    return (
      CURRENCIES.reduce((sum, c) => sum + (recipe[c] ?? 0) * (earned[c] ?? 0), 0) / unitsOf(recipe)
    );
  };
  const affordable = STAT_NAMES.filter((stat) => {
    const value = getStat(player.stats, stat);
    return value < MAX_STAT && canAfford(player.wallet, priceOf(stat, value)) && overlap(stat) > 0;
  });
  return affordable
    .sort((a, b) => Number(b === first) - Number(a === first) || overlap(b) - overlap(a))
    .slice(0, limit);
}
