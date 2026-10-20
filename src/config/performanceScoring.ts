/**
 * Performance Scoring Configuration
 *
 * A match is rated in the five areas of the game the pre-match card compares
 * (GAME_AREA_LABELS) plus Clutch, the key moments the player chose their way through.
 * Each area scores what happened in it, not how it was played: the share of its points
 * the player won, mapped onto 0-100 so that breaking even with this opponent scores
 * about 50 (`PerformanceRange`). The overall score is their weighted average, so a
 * close match rates C and a one-sided one rates A, S, D or F.
 *
 * Small samples are pulled toward an even share (`priorPoints` of even points added),
 * so one approach won or one key moment lost doesn't decide an area.
 *
 * Measure changes with src/test/analysis/performanceRatingProbe.ts.
 */

import { GAME_AREA_LABELS, type GameArea } from '../core/gameAreas';

/** Everything a match is rated on. */
export type PerformanceArea = GameArea | 'clutch';

export const PERFORMANCE_AREAS: PerformanceArea[] = [
  'serve',
  'return',
  'baseline',
  'net',
  'coverage',
  'clutch',
];

/** The one name each area goes by: the pre-match card's five, and Clutch. */
export const PERFORMANCE_AREA_LABELS: Record<PerformanceArea, string> = {
  ...GAME_AREA_LABELS,
  clutch: 'Clutch',
};

/** A share of points (0-1) mapped linearly onto 0-100, clamped: `zero` scores 0, `full` 100. */
export interface PerformanceRange {
  zero: number;
  full: number;
}

/** Rallies this long or longer test getting to the ball: Coverage reads them. */
export const LONG_RALLY_LENGTH = 5;

/**
 * The share each area needs for 0 and for 100, centred on what a close match produces
 * in the engine (performanceRatingProbe, matches within a few points of even): the
 * server wins about 59% of points, an approach about two in three, and a key moment
 * picked at random about 40%, so choosing well scores above 50.
 */
export const PERFORMANCE_RANGES: Record<PerformanceArea, PerformanceRange> = {
  // Service points won.
  serve: { zero: 0.28, full: 0.88 },
  // Return points won.
  return: { zero: 0.13, full: 0.73 },
  // Rally points won (past serve and return).
  baseline: { zero: 0.2, full: 0.8 },
  // Points won when the player came to the net, out of every time they did.
  net: { zero: 0.38, full: 0.98 },
  // Long rallies won, and the share of rally points lost to pressure that the opponent lost.
  coverage: { zero: 0.2, full: 0.8 },
  // Key moments and break points won.
  clutch: { zero: 0.14, full: 0.74 },
};

/** Even points added to a share before it's scored, so a handful of points stays near 50. */
export const PERFORMANCE_PRIOR_POINTS: Record<PerformanceArea, number> = {
  serve: 2,
  return: 2,
  baseline: 2,
  net: 2,
  coverage: 2,
  clutch: 2,
};

/**
 * Coverage blends two shares: long rallies won, and the share of rally points lost to
 * a winner or forced error that went against the opponent (who was run off the court).
 */
export const COVERAGE_BLEND = { longRallies: 0.5, outplayed: 0.5 };

/** Clutch blends key moments won with break points won (saved and converted). */
export const CLUTCH_BLEND = { keyMoments: 0.65, breakPoints: 0.35 };

/**
 * How much each area counts toward the overall score and toward the currency pool.
 * They sum to 1. Serve and return cover every point between them, while Baseline and
 * Coverage both read the rallies, so the service contests carry the most: weighted
 * evenly, a big server who won on serve rated well below a returner with the same
 * share of points. Net play counts in full only once the player has come in
 * `NET_FULL_WEIGHT_APPROACHES` times; below that its weight shrinks in proportion and
 * the others share the rest, so a baseliner isn't marked down for staying back.
 */
export const PERFORMANCE_WEIGHTS: Record<PerformanceArea, number> = {
  serve: 0.25,
  return: 0.25,
  baseline: 0.2,
  net: 0.1,
  coverage: 0.08,
  clutch: 0.12,
};

export const NET_FULL_WEIGHT_APPROACHES = 8;

// ============================================================================
// GRADES
// ============================================================================

export type PerformanceGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/** The lowest overall score for each grade, best first. Anything lower is F. */
export const GRADE_THRESHOLDS: Array<{ grade: PerformanceGrade; min: number }> = [
  { grade: 'S', min: 90 },
  { grade: 'A', min: 75 },
  { grade: 'B', min: 60 },
  { grade: 'C', min: 45 },
  { grade: 'D', min: 30 },
];

export function performanceGrade(score: number): PerformanceGrade {
  return GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? 'F';
}

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================
export const PERFORMANCE_THRESHOLDS = {
  excellent: 75, // Above this = excellent performance boost
  good: 60, // Above this = good performance boost
  average: 45, // Above this = average performance boost
  // Below 45 = bad (no boost)
};
