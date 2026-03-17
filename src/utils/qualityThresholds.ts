/**
 * Relative Quality Thresholds
 *
 * Replaces hard-coded quality thresholds (>= 70, >= 80, etc.) with values
 * that scale to the match level. This ensures low-stat matches have the same
 * dynamic range of outcomes as high-stat matches.
 *
 * matchLevel = average of both players' overallRating
 *
 * Calibrated so at matchLevel ~70, thresholds match the original hard-coded values.
 */

/** Tunable calibration constants */
const CALIBRATION = {
  exceptional: { scale: 1.15, offset: 4.5 },  // ~85 at ML=70, ~39 at ML=30
  high:        { scale: 1.0,  offset: 5 },     // ~75 at ML=70, ~35 at ML=30
  good:        { scale: 0.85, offset: 2 },      // ~62 at ML=70, ~28 at ML=30
  average:     { scale: 0.70, offset: 1 },      // ~50 at ML=70, ~22 at ML=30
  weak:        { scale: 0.42, offset: 0 },      // ~29 at ML=70, ~13 at ML=30
};

export interface RelativeThresholds {
  /** Top ~10% quality — exceptional shots (replaces >= 85-90) */
  exceptional: number;
  /** Top ~25% quality — strong shots (replaces >= 70-80) */
  high: number;
  /** Above average quality (replaces >= 60-65) */
  good: number;
  /** Middle of the range (replaces >= 50) */
  average: number;
  /** Below average — poor shots (replaces < 30-40) */
  weak: number;
}

/**
 * Generate quality thresholds relative to the match level.
 *
 * @param matchLevel Average overallRating of both players (0-100)
 */
export function getQualityThresholds(matchLevel: number): RelativeThresholds {
  return {
    exceptional: matchLevel * CALIBRATION.exceptional.scale + CALIBRATION.exceptional.offset,
    high:        matchLevel * CALIBRATION.high.scale        + CALIBRATION.high.offset,
    good:        matchLevel * CALIBRATION.good.scale        + CALIBRATION.good.offset,
    average:     matchLevel * CALIBRATION.average.scale     + CALIBRATION.average.offset,
    weak:        matchLevel * CALIBRATION.weak.scale        + CALIBRATION.weak.offset,
  };
}

/**
 * Compute match level from two players' overall ratings.
 */
export function getMatchLevel(player1OverallRating: number, player2OverallRating: number): number {
  return (player1OverallRating + player2OverallRating) / 2;
}
