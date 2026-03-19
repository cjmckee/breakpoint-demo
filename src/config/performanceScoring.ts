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

  // First serve percentage — normalized from 40-75% range to 0-30 points.
  // Prevents first serve % from dominating the entire score.
  firstServePercentMin: 40,       // 40% first serve = 0 points
  firstServePercentMax: 75,       // 75% first serve = max points
  firstServePercentMaxPoints: 30,

  // First serve points won (ratio * weight)
  firstServeWinWeight: 15,
  firstServeWinCap: 15,

  // Service hold bonus
  serviceHoldWeight: 15,
  serviceHoldCap: 15,
};

// ============================================================================
// RETURN PERFORMANCE WEIGHTS
// ============================================================================
export const RETURN_WEIGHTS = {
  // Break point conversion rate (converted / opportunities) — up to 30 points.
  // Rewards actually winning the break chances you create.
  breakPointConversionRatePoints: 30,

  // Small bonus for creating break opportunities (volume of pressure applied)
  breakOpportunityPoints: 3,
  breakOpportunityCap: 20,

  // Return points won (normalized from 25-50% range to 0-50 points)
  returnWinMinRate: 0.25,  // 25% return win rate = 0 points
  returnWinMaxRate: 0.50,  // 50% return win rate = 50 points
  returnWinMaxPoints: 50,
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
  // Net point win rate — primary metric (0-60 points)
  netWinRateMaxPoints: 60,

  // Volume bonus for actively attacking net (2 pts per net point won, up to 20)
  netVolumePoints: 2,
  netVolumeCap: 20,

  // Minimum total net points before scoring kicks in.
  // Players who rarely approach get a neutral 50 (not penalized for playing their game).
  minNetPointsForScore: 3,
};

// ============================================================================
// MENTAL PERFORMANCE WEIGHTS
// ============================================================================
export const MENTAL_WEIGHTS = {
  // Key moment win rate (won / total key moments, scaled to 0-70 points).
  // This is the primary mental metric — winning the moments that actually
  // decide sets is the best single measure of mental performance.
  keyMomentWinRatePoints: 70,

  // Break points saved (when serving) — secondary bonus for holding under pressure.
  breakPointSavePoints: 5,
  breakPointSaveCap: 30,
};

// ============================================================================
// OVERALL PERFORMANCE CATEGORY WEIGHTS
// ============================================================================
// Weights must sum to 1.0.
// Rallying is weighted most — it's the dominant skill in modern baseline tennis.
// Net play is weighted least — many players reasonably avoid the net.
export const OVERALL_SCORE_WEIGHTS = {
  serving: 0.22,
  returning: 0.22,
  rallying: 0.30,
  netPlay: 0.10,
  mental: 0.16,
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
