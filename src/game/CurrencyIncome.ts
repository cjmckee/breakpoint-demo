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
export type MatchRates = typeof MATCH_PAYOUT & { scale: number };

const GAME_TRAINING_RATES: TrainingRates = { ...TRAINING_PAYOUT, scale: INCOME_SCALE };
const GAME_MATCH_RATES: MatchRates = { ...MATCH_PAYOUT, scale: INCOME_SCALE };

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

/**
 * A match pays units × (0.5 + overall / 100) × INCOME_SCALE: the Mind share as
 * Mind, the rest split by how well each area went (serving → Power, returning
 * → Quickness, rally → Technique, net → Quickness and Technique, mental →
 * Mind). A good serving day pays in Power, which buys serve.
 */
export function matchPayout(
  perf: PerformanceRewardBreakdown,
  p: MatchRates = GAME_MATCH_RATES,
): CurrencyAmounts {
  const units = p.units * (0.5 + perf.overallScore / 100) * p.scale;
  const mind = units * p.mindShare;
  const area: CurrencyAmounts = {
    power: perf.servingScore,
    quickness: perf.returningScore + perf.netPlayScore / 2,
    technique: perf.rallyScore + perf.netPlayScore / 2,
    mind: perf.mentalScore,
  };
  const byArea = splitUnits(units - mind, area);
  // A match with no scored areas still pays its non-Mind share, evenly.
  const rest = Object.keys(byArea).length > 0 ? byArea : evenly(units - mind);
  return roundAmounts(sum({ mind }, rest));
}
