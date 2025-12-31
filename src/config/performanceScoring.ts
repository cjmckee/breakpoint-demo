/**
 * Performance Scoring Configuration
 *
 * All weights are easily adjustable to balance gameplay.
 * These weights determine how match statistics translate to 0-100 performance scores.
 */

// ============================================================================
// SERVING PERFORMANCE WEIGHTS
// ============================================================================
export const SERVING_WEIGHTS = {
  // Ace contribution (per ace)
  acePoints: 2,
  aceCap: 20,

  // Double fault penalty (per fault)
  doubleFaultPenalty: -3,
  doubleFaultCap: -20,

  // First serve percentage (0-100 maps directly)
  firstServePercentWeight: 1.0,

  // First serve points won (ratio * weight)
  firstServeWinWeight: 20,
  firstServeWinCap: 20,

  // Service hold bonus
  serviceHoldWeight: 15,
  serviceHoldCap: 15,
};

// ============================================================================
// RETURN PERFORMANCE WEIGHTS
// ============================================================================
export const RETURN_WEIGHTS = {
  // Break points converted
  breakPointConversionPoints: 10,
  breakPointConversionCap: 30,

  // Return points won (normalized from 20-50% range to 0-60 points)
  returnWinMinRate: 0.2,   // 20% return win rate = 0 points
  returnWinMaxRate: 0.5,   // 50% return win rate = 60 points
  returnWinMaxPoints: 60,

  // Return winners
  returnWinnerPoints: 5,
  returnWinnerCap: 20,
};

// ============================================================================
// RALLY PERFORMANCE WEIGHTS
// ============================================================================
export const RALLY_WEIGHTS = {
  // Unforced error penalty
  unforcedErrorWeight: -200,  // (errorRate * weight)
  unforcedErrorBase: 50,      // Base points before penalty applied

  // Long rally success
  longRallyBonus: 20,
  longRallyThreshold: 6,  // Rallies with 6+ shots

  // Winner to error ratio bonuses
  winnerErrorRatioExcellent: 1.5,
  winnerErrorRatioExcellentBonus: 20,
  winnerErrorRatioGood: 1.0,
  winnerErrorRatioGoodBonus: 10,

  // Stamina (longest rally performance)
  staminaBonus: 15,
};

// ============================================================================
// NET PLAY PERFORMANCE WEIGHTS
// ============================================================================
export const NET_PLAY_WEIGHTS = {
  // Net points won
  netPointWonPoints: 5,
  netPointWonCap: 50,

  // Volley success rate weight
  volleySuccessWeight: 40,

  // Approach shot success
  approachShotPoints: 3,
  approachShotCap: 30,
};

// ============================================================================
// MENTAL PERFORMANCE WEIGHTS
// ============================================================================
export const MENTAL_WEIGHTS = {
  // Key moments won
  keyMomentPoints: 10,
  keyMomentCap: 40,

  // Break points saved (when serving)
  breakPointSavePoints: 5,
  breakPointSaveCap: 20,

  // Clutch performance (comeback bonus)
  clutchComebackBonus: 20,

  // Pressure points weight (from PlayerPerformance)
  pressurePerformanceWeight: 0.25,  // Divide by 4 to normalize to 0-25 range
};

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================
export const PERFORMANCE_THRESHOLDS = {
  excellent: 75,  // Above this = excellent performance boost
  good: 60,       // Above this = good performance boost
  average: 45,    // Above this = average performance boost
  // Below 45 = bad (no boost)
};
