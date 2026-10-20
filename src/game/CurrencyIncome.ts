/**
 * CurrencyIncome — what training sessions and matches pay.
 *
 * Pure: rates come from config/economy.ts, and careerSim calls these same
 * functions, so the career the economy was calibrated on and the game pay the
 * same amounts. Payouts are whole units: the wallet never holds fractions.
 */

import type { StatName } from '../types';
import type { DrillId } from '../minigames/types';
import type { Currency, CurrencyAmounts, PerformanceRewardBreakdown } from '../types/game';
import {
  CONTENT_SCALE,
  CURRENCIES,
  MATCH_PAYOUT,
  STAT_RECIPES,
  TRAINING_MIXES,
} from '../config/economy';
import { GAME_AREA_WEIGHTS } from '../core/gameAreas';
import {
  PERFORMANCE_AREAS,
  PERFORMANCE_AREA_LABELS,
  type PerformanceArea,
} from '../config/performanceScoring';

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

export type MatchRates = typeof MATCH_PAYOUT;

const GAME_MATCH_RATES: MatchRates = MATCH_PAYOUT;

/**
 * A mix with its secondary currency (the one it pays least of) swapped for
 * `focus`. The main currency is untouched, so the drill played still decides
 * most of what a session pays; focusing on the main currency makes it all main.
 */
export function focusedMix(mix: CurrencyAmounts, focus?: Currency): CurrencyAmounts {
  if (!focus) return mix;
  const held = CURRENCIES.filter((c) => (mix[c] ?? 0) > 0);
  const secondary = held.reduce((least, c) => ((mix[c] ?? 0) < (mix[least] ?? 0) ? c : least));
  const out: CurrencyAmounts = { ...mix };
  const moved = out[secondary] ?? 0;
  delete out[secondary];
  out[focus] = (out[focus] ?? 0) + moved;
  return out;
}

/**
 * A training session on `drill` pays its mix (TRAINING_MIXES) once, plus once
 * more per clean rep — whole units, the same currencies every time — doubled
 * when the session's double-gains roll lands. From silver, a `focus` swaps the
 * mix's secondary currency (focusedMix); the total paid is the same.
 *
 * @param mixes  the game's mixes unless a harness is sweeping them.
 */
export function trainingPayout(
  drill: DrillId,
  reps: number,
  doubled: boolean = false,
  mixes: Record<DrillId, CurrencyAmounts> = TRAINING_MIXES,
  focus?: Currency,
): CurrencyAmounts {
  const times = (Math.max(0, Math.floor(reps)) + 1) * (doubled ? 2 : 1);
  const mix = focusedMix(mixes[drill], focus);
  const out: CurrencyAmounts = {};
  for (const c of CURRENCIES) {
    const n = mix[c] ?? 0;
    if (n > 0) out[c] = n * times;
  }
  return out;
}

/**
 * What a stat grant in authored content (a story outcome, a challenge reward)
 * is worth in currency: each point through its stat's recipe at CONTENT_SCALE,
 * gains and penalties netted per currency, every non-zero currency at least 1.
 * A negative result is a loss; applyCurrency clamps it at zero.
 *
 * The authored content was converted with this once (see
 * docs/proposals/content-conversion-dry-run.md); the save migration uses it
 * for challenges a save already holds.
 */
export function contentCurrency(grant: Partial<Record<StatName, number>>): CurrencyAmounts {
  const raw: Record<Currency, number> = { power: 0, quickness: 0, technique: 0, mind: 0 };
  for (const [stat, points] of Object.entries(grant) as Array<[StatName, number]>) {
    for (const [c, n] of Object.entries(STAT_RECIPES[stat]) as Array<[Currency, number]>) {
      raw[c] += points * n * CONTENT_SCALE;
    }
  }
  const out: CurrencyAmounts = {};
  for (const c of CURRENCIES) {
    if (raw[c] === 0) continue;
    out[c] = Math.sign(raw[c]) * Math.max(1, Math.round(Math.abs(raw[c])));
  }
  return out;
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

/**
 * The currencies an area of the match pays, in proportion: the recipes of the stats
 * it's rated on (GAME_AREA_WEIGHTS), weighted as the area weighs them. Clutch pays
 * MATCH_PAYOUT.clutch.
 */
export function areaCurrencyMix(
  area: PerformanceArea,
  p: MatchRates = GAME_MATCH_RATES,
): CurrencyAmounts {
  if (area === 'clutch') return p.clutch;
  const out: CurrencyAmounts = {};
  for (const [stat, weight] of Object.entries(GAME_AREA_WEIGHTS[area]) as Array<
    [StatName, number]
  >) {
    for (const [c, n] of Object.entries(STAT_RECIPES[stat]) as Array<[Currency, number]>) {
      out[c] = (out[c] ?? 0) + weight * n;
    }
  }
  return out;
}

/** The performance pool, area by area, in fractional units. */
function poolLines(perf: PerformanceRewardBreakdown, p: MatchRates): PayoutLine[] {
  const pool = p.pool * (perf.overallScore / 100);
  // Each area's slice is what it added to the overall score.
  const added = PERFORMANCE_AREAS.map((a) => perf.areas[a] * perf.weights[a]);
  const total = added.reduce((s, v) => s + v, 0);
  if (pool <= 0 || total <= 0) return [];
  return PERFORMANCE_AREAS.map((area, i) => ({
    label: PERFORMANCE_AREA_LABELS[area],
    amounts: splitUnits((pool * added[i]) / total, areaCurrencyMix(area, p)),
  }));
}

/**
 * A match pays its result's base (MATCH_PAYOUT: a loss 1 Power, 1 Quickness,
 * 2 Technique and 1 Mind, a win one more of each) plus a performance pool of
 * pool × overall/100, split by how each area went and paid in the currencies that
 * buy its stats: a good serving day pays in Power, which buys serve.
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
