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
  aceCap: 25,

  // Double fault penalty (per fault)
  doubleFaultPenalty: -3,
  doubleFaultCap: -20,

  // First serve percentage — normalized from 40-75% range to 0-35 points.
  // Prevents first serve % from dominating the entire score.
  firstServePercentMin: 40,       // 40% first serve = 0 points
  firstServePercentMax: 75,       // 75% first serve = max points
  firstServePercentMaxPoints: 35,

  // First serve points won (ratio * weight)
  firstServeWinWeight: 20,
  firstServeWinCap: 20,

  // Service hold bonus
  serviceHoldWeight: 20,
  serviceHoldCap: 20,
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
  // Rally win rate (won / played when shot count > 2) — primary metric (0-50 points).
  // Directly measures how well the player performs once a rally develops.
  // Normalized from 30-70% range so 50% (perfectly even) = 25pts, 70%+ = 50pts.
  rallyWinRateMinRate: 0.30,
  rallyWinRateMaxRate: 0.70,
  rallyWinRateMaxPoints: 50,

  // Consistency: unforced error rate penalty (0-30 points).
  // 50 + (errorRate × -200) before clamping to 0-30.
  unforcedErrorWeight: -200,
  unforcedErrorBase: 50,
  unforcedErrorMaxPoints: 30,

  // Aggression: winner rate normalized from 5-15% of total points (0-20 points).
  winnerRateMinRate: 0.05,
  winnerRateMaxRate: 0.15,
  winnerRateMaxPoints: 20,
};

// ============================================================================
// NET PLAY PERFORMANCE WEIGHTS
// ============================================================================
export const NET_PLAY_WEIGHTS = {
  // Net point win rate — primary metric (0-75 points)
  netWinRateMaxPoints: 75,

  // Volume bonus for actively attacking net (2 pts per net point won, up to 25)
  netVolumePoints: 2,
  netVolumeCap: 25,

  // Volume scaling threshold: below this many total net points, the whole score is
  // scaled down linearly. Prevents rarely-approaching players from scoring high
  // just because they won the 1-2 net points they did play.
  netVolumeScaleThreshold: 10,
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
