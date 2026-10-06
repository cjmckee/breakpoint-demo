/**
 * CurrencyIncome — what training sessions and matches pay.
 *
 * Pure: rates come from config/economy.ts, and careerSim calls these same
 * functions, so the career the economy was calibrated on and the game pay the
 * same amounts. Payouts are whole units: the wallet never holds fractions.
 */

import type { StatName } from '../types';
import type { CurrencyAmounts, PerformanceRewardBreakdown } from '../types/game';
import {
  CURRENCIES,
  INCOME_SCALE,
  MATCH_PAYOUT,
  STAT_RECIPES,
  TRAINING_PAYOUT,
} from '../config/economy';

/** Split `units` across currencies in proportion to `weights` (fractions kept). */
export function splitUnits(units: number, weights: CurrencyAmounts): CurrencyAmounts {
  const total = CURRENCIES.reduce((sum, c) => sum + Math.max(0, weights[c] ?? 0), 0);
  const out: CurrencyAmounts = {};
  if (total <= 0) return out;
  for (const c of CURRENCIES) {
    const w = Math.max(0, weights[c] ?? 0);
    if (w > 0) out[c] = (units * w) / total;
  }
  return out;
}

/**
 * Round fractional amounts to whole units without losing or inventing any:
 * the total rounds once, and the units go to the largest remainders. A
 * 13.2-unit payout pays 13, wherever the fractions fell.
 */
export function roundAmounts(amounts: CurrencyAmounts): CurrencyAmounts {
  const exact = CURRENCIES.map((c) => ({ c, v: Math.max(0, amounts[c] ?? 0) }));
  const target = Math.round(exact.reduce((sum, e) => sum + e.v, 0));
  const floors = exact.map((e) => ({ c: e.c, n: Math.floor(e.v), rem: e.v - Math.floor(e.v) }));
  let left = target - floors.reduce((sum, f) => sum + f.n, 0);
  // Ties go to the earlier currency, so the same payout always rounds the same way.
  for (const f of [...floors].sort((a, b) => b.rem - a.rem)) {
    if (left <= 0) break;
    f.n++;
    left--;
  }
  const out: CurrencyAmounts = {};
  for (const f of floors) if (f.n > 0) out[f.c] = f.n;
  return out;
}

function sum(...parts: CurrencyAmounts[]): CurrencyAmounts {
  const out: CurrencyAmounts = {};
  for (const c of CURRENCIES) {
    const v = parts.reduce((s, p) => s + (p[c] ?? 0), 0);
    if (v !== 0) out[c] = v;
  }
  return out;
}

/** Training rates with the income scale folded in; careerSim passes tuned copies. */
export type TrainingRates = typeof TRAINING_PAYOUT & { scale: number };
export type MatchRates = typeof MATCH_PAYOUT;

const GAME_TRAINING_RATES: TrainingRates = { ...TRAINING_PAYOUT, scale: INCOME_SCALE };
const GAME_MATCH_RATES: MatchRates = MATCH_PAYOUT;

function evenly(units: number): CurrencyAmounts {
  const out: CurrencyAmounts = {};
  for (const c of CURRENCIES) out[c] = units / CURRENCIES.length;
  return out;
}

/**
 * A training session on `anchor` with `reps` clean reps pays
 * (base + perRep × reps) × INCOME_SCALE × (1 + payoutBonus) units: the general
 * share spread evenly, the Mind share as Mind, the rest in the anchor's recipe
 * ratio. So serve training pays mostly Power, return mostly Quickness.
 *
 * @param payoutBonus  from items (EffectKey.TRAINING_STAT_UPGRADE_CHANCE): +0.1 pays 10% more.
 * @param p            the game's rates unless a harness is sweeping them.
 */
export function trainingPayout(
  anchor: StatName,
  reps: number,
  payoutBonus: number = 0,
  p: TrainingRates = GAME_TRAINING_RATES,
): CurrencyAmounts {
  const units = (p.base + p.perRep * Math.max(0, reps)) * p.scale * (1 + payoutBonus);
  const general = units * p.generalShare;
  const mind = units * p.mindShare;
  return roundAmounts(
    sum(evenly(general), { mind }, splitUnits(units - general - mind, STAT_RECIPES[anchor])),
  );
}

/** One line of a match's pay: where it came from and what it paid. */
export interface PayoutLine {
  label: string;
  amounts: CurrencyAmounts;
}

/**
 * Split `total` whole units across exact parts by largest remainder, so the
 * rounded parts add up to the total. The total is the rounding of the parts'
 * sum, so it never needs more than one extra unit per part.
 */
function apportion(total: number, parts: number[]): number[] {
  const floors = parts.map((v) => Math.floor(v));
  let left = total - floors.reduce((s, v) => s + v, 0);
  const order = parts.map((v, i) => ({ i, rem: v - Math.floor(v) })).sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

/** The performance pool, area by area, in fractional units. */
function poolLines(perf: PerformanceRewardBreakdown, p: MatchRates): PayoutLine[] {
  const pool = p.pool * (perf.overallScore / 100);
  const areas =
    perf.servingScore +
    perf.returningScore +
    perf.rallyScore +
    perf.netPlayScore +
    perf.mentalScore;
  if (pool <= 0 || areas <= 0) return [];
  const share = (score: number): number => (pool * score) / areas;
  return [
    { label: 'Serving', amounts: { power: share(perf.servingScore) } },
    { label: 'Returning', amounts: { quickness: share(perf.returningScore) } },
    { label: 'Rallies', amounts: { technique: share(perf.rallyScore) } },
    {
      label: 'Net play',
      amounts: {
        quickness: share(perf.netPlayScore) / 2,
        technique: share(perf.netPlayScore) / 2,
      },
    },
    { label: 'Mental game', amounts: { mind: share(perf.mentalScore) } },
  ];
}

/**
 * A match pays its result's base (a loss 2 of each currency and 5 Mind, a win
 * 3 and 6) plus a performance pool of pool × overall/100, split by how each
 * area went: a good serving day pays in Power, which buys serve.
 */
export function matchPayout(
  perf: PerformanceRewardBreakdown,
  won: boolean,
  p: MatchRates = GAME_MATCH_RATES,
): CurrencyAmounts {
  return sum(
    won ? p.base.won : p.base.lost,
    roundAmounts(sum(...poolLines(perf, p).map((l) => l.amounts))),
  );
}

/**
 * A match's pay line by line — the base for winning or losing, then what each
 * area of the match earned — in whole units that add up to matchPayout exactly.
 * Areas that paid nothing are left out.
 */
export function matchPayoutLines(
  perf: PerformanceRewardBreakdown,
  won: boolean,
  p: MatchRates = GAME_MATCH_RATES,
): PayoutLine[] {
  const exact = poolLines(perf, p);
  const pooled = roundAmounts(sum(...exact.map((l) => l.amounts)));
  const rounded: CurrencyAmounts[] = exact.map(() => ({}));
  for (const c of CURRENCIES) {
    const holders = exact.flatMap((line, i) => (line.amounts[c] ? [i] : []));
    const parts = apportion(
      pooled[c] ?? 0,
      holders.map((i) => exact[i].amounts[c] ?? 0),
    );
    holders.forEach((i, k) => {
      if (parts[k] > 0) rounded[i][c] = parts[k];
    });
  }
  return [
    { label: won ? 'Won match' : 'Lost match', amounts: { ...(won ? p.base.won : p.base.lost) } },
    ...exact
      .map((line, i) => ({ label: line.label, amounts: rounded[i] }))
      .filter((line) => Object.keys(line.amounts).length > 0),
  ];
}
