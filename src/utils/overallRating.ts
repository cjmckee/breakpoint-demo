/**
 * Overall rating — the single definition.
 *
 * Lives in its own module because both the simulation (PlayerProfile) and the
 * UI helpers (playerStats) need it, and PlayerProfile should not depend on the
 * display-facing utilities to compute a number. There used to be two copies of
 * this function that had to be edited in lockstep whenever a stat moved bucket.
 */

import type { PlayerStats } from '../types/index.js';

/**
 * Relative weight of each stat category. Category weights rather than per-stat
 * weights, so the buckets can hold different numbers of stats — core carries
 * five (one per game phase) and the rest three each.
 */
export const STAT_CATEGORY_WEIGHTS = {
  core: 0.45,
  technical: 0.15,
  physical: 0.25,
  mental: 0.15,
} as const;

export function calculateOverallRating(stats: PlayerStats): number {
  const avg = (group: object): number => {
    const values = Object.values(group) as number[];
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };
  return Math.round(
    avg(stats.core) * STAT_CATEGORY_WEIGHTS.core +
    avg(stats.technical) * STAT_CATEGORY_WEIGHTS.technical +
    avg(stats.physical) * STAT_CATEGORY_WEIGHTS.physical +
    avg(stats.mental) * STAT_CATEGORY_WEIGHTS.mental
  );
}
