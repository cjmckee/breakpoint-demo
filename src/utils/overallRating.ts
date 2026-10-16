/**
 * Overall rating — the single definition.
 *
 * Lives in its own module because both the simulation (PlayerProfile) and the
 * UI helpers (playerStats) need it, and PlayerProfile should not depend on the
 * display-facing utilities to compute a number. There used to be two copies of
 * this function that had to be edited in lockstep whenever a stat moved bucket.
 *
 * OVR is the yardstick progression is balanced against, so it should predict
 * who wins: each stat should weigh what it is worth in a match. `statLadder`
 * measures that (the share of the predictable result OVR explains, by level).
 */

import type { PlayerStats } from '../types';

/**
 * Relative weight of each stat category. Category weights rather than per-stat
 * weights, so the buckets can hold different numbers of stats — core carries
 * five (one per game phase) and the rest three each.
 */
export const STAT_CATEGORY_WEIGHTS = {
  core: 0.4,
  technical: 0.16,
  physical: 0.21,
  mental: 0.23,
};

/**
 * How a category's weight is shared between its stats: relative weights, so
 * equal numbers split it evenly. A stat's share of OVR is its category weight
 * × its relative weight / the category's total.
 *
 * Both tables are what each stat is measured to be worth (`statLadder`, the
 * mean over the four career bands), rounded. Serve pays on every point and is
 * the heaviest stat; net pays mostly to players who come forward.
 */
export const STAT_WEIGHTS_WITHIN = {
  core: { serve: 14, forehand: 7, backhand: 6, return: 8, net: 4 },
  technical: { slice: 5, spin: 5, placement: 6 },
  physical: { speed: 10, stamina: 4, strength: 7 },
  mental: { focus: 1, anticipation: 1, tactics: 1 },
};

/** A category's average, weighted by STAT_WEIGHTS_WITHIN (a plain mean when they're equal). */
function categoryAverage(group: object, within: object): number {
  const values = Object.values(group) as number[];
  const weights = Object.entries(group).map(([k]) => (within as Record<string, number>)[k] ?? 0);
  if (weights.every((w) => w === weights[0])) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  return values.reduce((sum, v, i) => sum + v * weights[i], 0) / total;
}

export function calculateOverallRating(stats: PlayerStats): number {
  const w = STAT_CATEGORY_WEIGHTS;
  const within = STAT_WEIGHTS_WITHIN;
  return Math.round(
    categoryAverage(stats.core, within.core) * w.core +
      categoryAverage(stats.technical, within.technical) * w.technical +
      categoryAverage(stats.physical, within.physical) * w.physical +
      categoryAverage(stats.mental, within.mental) * w.mental,
  );
}

/** Each stat's share of OVR, by name, summing to 1. */
export function ovrStatShares(): Record<string, number> {
  const out: Record<string, number> = {};
  const total = Object.values(STAT_CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
  for (const [category, weights] of Object.entries(STAT_WEIGHTS_WITHIN)) {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const [stat, w] of Object.entries(weights)) {
      out[stat] =
        (STAT_CATEGORY_WEIGHTS[category as keyof typeof STAT_CATEGORY_WEIGHTS] * w) / sum / total;
    }
  }
  return out;
}
