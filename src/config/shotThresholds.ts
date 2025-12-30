/**
 * Shot Quality Threshold Configuration
 *
 * All tunable values for the relative quality threshold system.
 * Adjust these values to fine-tune match realism and difficulty.
 */

import type { ShotType, CourtPosition } from '../types/index.js';

/**
 * Relative quality requirements for each shot type
 *
 * Value represents the percentage of incoming shot quality needed to succeed.
 * Lower = easier to execute (defensive shots)
 * Higher = riskier to execute (offensive shots)
 *
 * Example: forehand = 0.50 means you need 50% of opponent's shot quality to keep rally alive
 */
export const RELATIVE_QUALITY_REQUIREMENTS: Record<ShotType, number> = {
  // Serves (not used in relative calculation, but included for completeness)
  'serve_first': 0.50,
  'serve_second': 0.50,
  'kick_serve': 0.50,

  // Basic groundstrokes (neutral, moderate requirement)
  'forehand': 0.50,
  'backhand': 0.50,

  // Power shots (offensive, high requirement = risky)
  'forehand_power': 0.70,
  'backhand_power': 0.70,

  // Approach shots (moderate-high requirement)
  'forehand_approach': 0.60,
  'backhand_approach': 0.60,

  // Volleys (moderate requirement, need decent execution)
  'volley_forehand': 0.60,
  'volley_backhand': 0.60,
  'half_volley_forehand': 0.65,
  'half_volley_backhand': 0.65,

  // Overheads (offensive, moderate requirement)
  'overhead': 0.60,
  'defensive_overhead': 0.70,

  // Drop shots (moderate-low requirement)
  'drop_shot_forehand': 0.45,
  'drop_shot_backhand': 0.45,

  // Angle shots (moderate-high requirement)
  'short_angle_forehand': 0.65,
  'short_angle_backhand': 0.65,
  'angle_shot_forehand': 0.65,
  'angle_shot_backhand': 0.65,

  // Slice shots (defensive, low requirement = forgiving)
  'slice_forehand': 0.35,
  'slice_backhand': 0.35,
  'defensive_slice_forehand': 0.25,
  'defensive_slice_backhand': 0.25,

  // Returns (high requirement - returning serve is hard!)
  'return_forehand': 0.75,
  'return_backhand': 0.75,
  'return_forehand_power': 0.85,
  'return_backhand_power': 0.85,

  // Topspin shots (neutral)
  'topspin_forehand': 0.55,
  'topspin_backhand': 0.55,

  // Directional shots (neutral)
  'down_the_line_forehand': 0.55,
  'down_the_line_backhand': 0.55,
  'cross_court_forehand': 0.50,
  'cross_court_backhand': 0.50,

  // Lobs (defensive, low requirement)
  'lob_forehand': 0.30,
  'lob_backhand': 0.30,

  // Passing shots (offensive, high requirement)
  'passing_shot_forehand': 0.75,
  'passing_shot_backhand': 0.75,
};

/**
 * Minimum quality floors by shot category
 *
 * Even against terrible incoming shots, you still need minimum quality.
 * Prevents requirements from becoming impossibly low.
 */
export const MIN_QUALITY_FLOORS = {
  offensive: 20,    // Power shots, passing shots, etc.
  neutral: 15,      // Regular groundstrokes
  defensive: 10,    // Slices, lobs, defensive shots
};

/**
 * Minimum winner thresholds by shot category
 *
 * Even against very weak incoming shots, you need minimum quality to hit a winner.
 * This prevents situations where after long rallies with degraded quality,
 * the first shot hit becomes an automatic winner.
 *
 * Example: After a quality-26 shot, defensive slice would normally only need
 * quality 30 to win. With floor of 55, it now needs quality 55+ to be a winner.
 */
export const MINIMUM_WINNER_THRESHOLDS = {
  defensive: 55,    // Even perfect setup, defensive shot needs 55+ quality to win
  neutral: 50,      // Regular shots need 50+ quality to be winners
  offensive: 45,    // Power shots can win with 45+ quality (lower floor, high reward)
};

/**
 * Outcome multipliers for determining winners and forced errors
 *
 * Different shot categories have different winner multipliers:
 * - Defensive shots: EASY to keep in play, HARD to hit winners (high multiplier)
 * - Offensive shots: HARDER to keep in play, EASIER to hit winners (low multiplier)
 * - Neutral shots: Balanced
 *
 * This creates realistic shot dynamics: defensive slices extend rallies but rarely win,
 * power shots are risky but can win points if executed well.
 */
export const OUTCOME_MULTIPLIERS = {
  // Defensive shots: slices, lobs, defensive overheads
  defensive: {
    inPlay: 1.0,        // Base requirement (easiest to keep in play)
    winner: 3.0,        // Need 3x the requirement for winner (hard but possible)
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Neutral shots: regular groundstrokes, volleys
  neutral: {
    inPlay: 1.0,        // Base requirement
    winner: 2.0,        // Need 2x the requirement for winner (moderate)
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Offensive shots: power shots, overheads, passing shots, angles
  offensive: {
    inPlay: 1.0,        // Base requirement
    winner: 1.5,        // Need 1.5x the requirement for winner (high reward)
    forcedError: 0.7,   // Below 70% = forced error
  },
};

/**
 * Serve baseline requirements (absolute thresholds)
 *
 * Serves don't have incoming shots, so use absolute thresholds.
 * inPlayThreshold: Quality needed to get serve in
 * aceThresholdBase: Minimum quality for ace (ensures ace is always harder than inPlay)
 * aceReturnMultiplier: Additional difficulty based on opponent return stat
 *   Final ace threshold = aceThresholdBase + (opponentReturn × aceReturnMultiplier)
 */
export const SERVE_BASELINE = {
  serve_first: {
    inPlayThreshold: 30,      // Need 30+ quality to get first serve in (achievable with stats 25-50)
    aceThresholdBase: 55,     // Minimum quality for ace (ensures ace is always harder than getting serve in)
    aceReturnMultiplier: 0.5, // Additional difficulty based on opponent return
    // Example: vs return:25 → need 55 + 12.5 = 67.5 for ace
    // Example: vs return:50 → need 55 + 25 = 80 for ace
  },
  serve_second: {
    inPlayThreshold: 20,      // Easier to get second serve in
    aceThresholdBase: 70,     // Much higher base for second serve aces (very rare)
    aceReturnMultiplier: 0.6, // Additional difficulty based on opponent return
    // Example: vs return:25 → need 70 + 15 = 85 for ace (difficult)
    // Example: vs return:50 → need 70 + 30 = 100 for ace (nearly impossible)
  },
  kick_serve: {
    inPlayThreshold: 25,      // Between first and second
    aceThresholdBase: 60,     // Between first and second serve
    aceReturnMultiplier: 0.55,
    // Example: vs return:50 → need 60 + 27.5 = 87.5 for ace
  },
};

/**
 * Opponent stat adjustments
 *
 * How opponent's stats affect quality requirements.
 * Formula: (opponentStat - 50) × multiplier
 *
 * Increased from previous values to make high-stat opponents meaningfully harder to beat.
 * Example: opponent defensive 90 → (90-50) × 0.25 = +10 to winner threshold
 */
export const OPPONENT_STAT_ADJUSTMENTS = {
  defensive: 0.25,   // Defensive stat makes winners harder (increased from 0.10)
  speed: 0.10,       // Speed helps cover court (increased from 0.05)
  return: 0.20,      // Return stat makes aces harder, serves only (increased from 0.15)
};

/**
 * Position adjustments
 *
 * How opponent's court position affects quality requirements.
 * Positive = harder to hit winners (well positioned)
 * Negative = easier to hit winners (out of position)
 */
export const POSITION_ADJUSTMENTS: Record<CourtPosition, number> = {
  'well_positioned': +3,      // Opponent ready and centered
  'slightly_off': +0,         // Neutral
  'way_out_wide': -8,         // Opponent pushed wide (easier to win)
  'way_back_deep': -5,        // Opponent behind baseline
  'recovering': -3,           // Opponent in transition
  'at_net': +10,              // Very hard to pass opponent at net
};

/**
 * Serve variance (quality randomness)
 *
 * Applied as ±variance to serve quality.
 * High variance = high risk/reward (first serve)
 * Low variance = consistent (second serve)
 *
 * IMPORTANT: This is added AFTER all modifiers are applied.
 * Keep reasonable to avoid constant 100 quality or negative quality.
 */
export const SERVE_VARIANCE = {
  first: 8,     // ±8 quality variance on first serve (reduced from 12)
  second: 4,    // ±4 quality variance on second serve (reduced from 6)
};

/**
 * Return variance (quality randomness)
 *
 * Applied as ±variance to return quality.
 * Adds realistic variation to returns instead of constant quality values.
 */
export const RETURN_VARIANCE = 6;  // ±6 quality variance on returns

/**
 * Rally shot variance (quality randomness)
 *
 * Applied as ±variance to all rally shots (not serves/returns).
 * Base variance + additional variance based on incoming shot quality.
 * High quality incoming shots make it harder to respond consistently.
 *
 * Formula: baseVariance + (incomingQuality / 100) * qualityMultiplier
 * Example: vs quality 80 shot → 4 + (80/100) * 6 = 4 + 4.8 = ±8.8 variance
 */
export const RALLY_SHOT_VARIANCE = {
  base: 4,              // Base ±4 variance on all rally shots
  qualityMultiplier: 6, // Additional variance based on incoming shot quality
};  // Creates realistic errors independent of fatigue

/**
 * Serve stat bonuses
 *
 * Which stats bonus serve quality and by how much.
 * First serve: offensive, strength-based
 * Second serve: consistency, spin-based
 *
 * IMPORTANT: These are multipliers applied to physicalModifier, not direct additions.
 * Each bonus is capped individually to prevent extreme stacking.
 * Keep them small to avoid quality hitting 100 constantly.
 */
export const SERVE_BONUSES = {
  first: {
    offensive: { multiplier: 0.08, maxBonus: 0.05 },   // Max 5% bonus from offensive
    strength: { multiplier: 0.06, maxBonus: 0.04 },    // Max 4% bonus from strength
    spin: { multiplier: 0.04, maxBonus: 0.03 },        // Max 3% bonus from spin
  },
  second: {
    consistency: { multiplier: 0.10, maxBonus: 0.06 }, // Max 6% bonus from consistency
    spin: { multiplier: 0.08, maxBonus: 0.05 },        // Max 5% bonus from spin
    defensive: { multiplier: 0.05, maxBonus: 0.03 },   // Max 3% bonus from defensive
  },
};

/**
 * Total modifier caps
 *
 * Maximum total modifier allowed after all bonuses are combined.
 * Prevents exponential stacking of multiple bonuses.
 *
 * Example: serve stat 75 × 115% cap = 86.25 max (before variance)
 */
export const TOTAL_MODIFIER_CAPS = {
  serve: 1.15,    // Max 115% total modifier for serves (prevents constant 100 quality)
  return: 1.20,   // Max 120% total modifier for returns
  rally: 1.25,    // Max 125% total modifier for rally shots
};

/**
 * Helper function to categorize shot types
 *
 * Used to determine which minimum quality floor to apply.
 */
export function getShotCategory(shotType: ShotType): 'offensive' | 'neutral' | 'defensive' {
  const shotStr = shotType.toString();

  // Offensive shots
  if (
    shotStr.includes('power') ||
    shotStr.includes('overhead') ||
    shotStr.includes('passing_shot') ||
    shotStr.includes('short_angle')
  ) {
    return 'offensive';
  }

  // Defensive shots
  if (
    shotStr.includes('slice') ||
    shotStr.includes('lob') ||
    shotStr.includes('defensive')
  ) {
    return 'defensive';
  }

  // Everything else is neutral
  return 'neutral';
}
