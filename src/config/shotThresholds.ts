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
 * Outcome multipliers for determining winners and forced errors
 *
 * winner: Need this multiple of in-play requirement to hit winner
 * forcedError: Below this multiple of requirement = forced error (vs unforced)
 */
export const OUTCOME_MULTIPLIERS = {
  winner: 2.5,        // Need 2.5x the requirement for winner (harder to hit winners)
  forcedError: 0.7,   // Below 70% of requirement = forced error
};

/**
 * Serve baseline requirements (absolute thresholds)
 *
 * Serves don't have incoming shots, so use absolute thresholds.
 * inPlayThreshold: Quality needed to get serve in
 * aceMultiplier: Multiplied by opponent's return stat to determine ace threshold
 */
export const SERVE_BASELINE = {
  serve_first: {
    inPlayThreshold: 50,      // Need 50+ quality to get first serve in
    aceMultiplier: 1.20,      // Ace if quality > (opponent return × 1.20)
    // Example: vs return:85 → need 102 quality for ace (very rare)
  },
  serve_second: {
    inPlayThreshold: 40,      // Easier to get second serve in
    aceMultiplier: 1.30,      // Much harder to ace on second serve
    // Example: vs return:85 → need 110.5 quality for ace (impossible!)
  },
  kick_serve: {
    inPlayThreshold: 45,      // Between first and second
    aceMultiplier: 1.25,      // Slightly harder to ace than first serve
  },
};

/**
 * Opponent stat adjustments
 *
 * How opponent's stats affect quality requirements.
 * Formula: (opponentStat - 50) × multiplier
 */
export const OPPONENT_STAT_ADJUSTMENTS = {
  defensive: 0.10,   // Defensive stat makes winners harder
  speed: 0.05,       // Speed helps cover court
  return: 0.15,      // Return stat makes aces harder (serves only)
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
  first: 12,    // ±12 quality variance on first serve
  second: 6,    // ±6 quality variance on second serve
};

/**
 * Serve stat bonuses
 *
 * Which stats bonus serve quality and by how much.
 * First serve: offensive, strength-based
 * Second serve: consistency, spin-based
 *
 * IMPORTANT: These are multipliers applied to physicalModifier, not direct additions.
 * Keep them small to avoid quality hitting 100 constantly.
 */
export const SERVE_BONUSES = {
  first: {
    offensive: 0.08,    // offensive stat × 0.08 bonus (80 offensive = +6.4% modifier)
    strength: 0.06,     // strength stat × 0.06 bonus (85 strength = +5.1% modifier)
    spin: 0.04,         // spin stat × 0.04 bonus (70 spin = +2.8% modifier)
  },
  second: {
    consistency: 0.10,  // consistency (playStyle) × 0.10 bonus
    spin: 0.08,         // spin stat × 0.08 bonus
    defensive: 0.05,    // defensive stat × 0.05 bonus
  },
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
