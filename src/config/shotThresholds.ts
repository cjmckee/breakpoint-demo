/**
 * Shot Quality Threshold Configuration
 *
 * All tunable values for the relative quality threshold system.
 * Adjust these values to fine-tune match realism and difficulty.
 */

import type { ShotType, CourtPosition, CourtSurface } from '../types/index.js';

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
  'volley_forehand_power': 0.70,
  'volley_backhand_power': 0.70,
  'half_volley_forehand': 0.65,
  'half_volley_backhand': 0.65,

  // Overheads (offensive, moderate requirement)
  'overhead': 0.60,
  'defensive_overhead': 0.70,

  // Drop shots (moderate-low requirement)
  'drop_shot_forehand': 0.45,
  'drop_shot_backhand': 0.45,

  // Angle shots (moderate-high requirement)
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
  defensive: 60,    // Even perfect setup, defensive shot needs 60+ quality to win
  neutral: 55,      // Regular shots need 55+ quality to be winners
  offensive: 50,    // Power shots can win with 50+ quality (lower floor, high reward)
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
    winner: 3.5,        // Need 3.5x the requirement for winner (very hard)
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Neutral shots: regular groundstrokes, volleys
  neutral: {
    inPlay: 1.0,        // Base requirement
    winner: 2.5,        // Need 2.5x the requirement for winner (raised from 2.0)
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Offensive shots: power shots, overheads, passing shots, angles
  offensive: {
    inPlay: 1.0,        // Base requirement
    winner: 1.8,        // Need 1.8x the requirement for winner (raised from 1.5)
    forcedError: 0.7,   // Below 70% = forced error
  },
};

/**
 * Serve baseline requirements (absolute thresholds)
 *
 * Serves don't have incoming shots, so use absolute thresholds.
 * inPlayThreshold: Quality needed to get serve in. Scaled by the SERVER's own
 *   overall rating (not the match level), so serve consistency depends on how
 *   the serve fits the server's own game — never on who is standing across the net.
 */
export const SERVE_BASELINE = {
  serve_first: {
    inPlayThreshold: 62,      // Scaled by serverOVR/70. ~62% first serves in at stat parity
  },
  serve_second: {
    inPlayThreshold: 32,      // Scaled by serverOVR/70. ~90% second serves in at parity → ~4-6% DFs
  },
};

/**
 * The serve-vs-return contest that decides aces.
 *
 * Ace resistance is a returner-side value: a blend of the returner's overall
 * rating (better overall players are harder to ace, without depending on any
 * single stat) and their return composite (return + anticipation + speed via
 * RETURN_COMPOSITE_WEIGHTS). The server's own rating never moves this bar —
 * that previously let any stat sitting above the two-player average dominate.
 *
 *   resistance   = ovrBlend × returnerOVR + (1 − ovrBlend) × returnComposite
 *   aceThreshold = aceBase + resistance × acePerResistance × surfaceMultiplier
 */
export const SERVE_CONTEST = {
  /** Weight of returner's overall rating vs their return composite in resistance */
  resistanceOvrBlend: 0.4,
  serve_first: { aceBase: 35, acePerResistance: 1.0 },
  serve_second: { aceBase: 45, acePerResistance: 1.0 }, // second-serve aces rarer
};

/**
 * Serve quality and serve accuracy are separate rolls from separate composites.
 *
 * QUALITY is how hurtful the ball is when it lands: raw serve technique,
 * strength for pace, an aggressive mindset, spin for movement. It feeds the
 * ace contest and how hard the return is.
 *
 * ACCURACY is whether it lands: technique, placement, focus, and spin for
 * net-clearance margin. It feeds the serve-in roll (and is degraded by the
 * same fatigue/pressure modifiers, so tired servers spray).
 *
 * A power build (high serve/strength, low placement/focus) hits huge serves
 * that miss more; a precise build lands everything but stings less.
 * Weights within each entry must sum to 1 so uniform-stat players keep their rating.
 */
export const SERVE_QUALITY_WEIGHTS = {
  serve_first: { serve: 0.60, strength: 0.20, offensive: 0.10, spin: 0.10 },
  serve_second: { serve: 0.55, spin: 0.25, strength: 0.10, placement: 0.10 },
};

export const SERVE_ACCURACY_WEIGHTS = {
  serve_first: { serve: 0.45, placement: 0.25, focus: 0.15, spin: 0.15 },
  serve_second: { serve: 0.35, placement: 0.25, spin: 0.25, focus: 0.15 },
};

/**
 * Composite stat weights for return quality and ace resistance.
 *
 * Returning is reading the serve (anticipation) and getting to it (speed)
 * as much as the return technique itself.
 * Weights must sum to 1 so uniform-stat players keep their rating.
 */
export const RETURN_COMPOSITE_WEIGHTS = {
  return: 0.60,
  anticipation: 0.25,
  speed: 0.15,
};

/**
 * Composite stat weights for rally shots, keyed by shot family.
 *
 * `primary` weights the shot's own mapped stat (forehand, volley, ...);
 * remaining keys are flat stat names blended in. Only stats NOT already
 * expressed through shot modifiers are added here (focus drives the pressure
 * modifier, offensive/defensive/shotVariety drive mental shot bonuses, speed/
 * agility already help against rushed balls), so nothing double-counts.
 * primary + rest must sum to 1 so uniform-stat players keep their rating.
 */
export const SHOT_COMPOSITE_WEIGHTS: Record<string, { primary: number; [stat: string]: number }> = {
  groundstroke: { primary: 0.80, strength: 0.10, spin: 0.10 },
  powerGroundstroke: { primary: 0.70, strength: 0.25, spin: 0.05 },
  volley: { primary: 0.70, agility: 0.20, anticipation: 0.10 },
  overhead: { primary: 0.70, strength: 0.15, agility: 0.15 },
  dropShot: { primary: 0.70, placement: 0.20, spin: 0.10 },
  slice: { primary: 0.75, spin: 0.15, placement: 0.10 },
  angle: { primary: 0.70, spin: 0.15, agility: 0.15 },
  lob: { primary: 0.70, anticipation: 0.15, agility: 0.15 },
  passing: { primary: 0.65, speed: 0.20, agility: 0.15 },
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
  // Kept small: these apply to EVERY rally shot, so they compound across the
  // rally and then across the match. Large values turn small stat gaps into
  // near-certain match outcomes.
  defensive: 0.12,   // Defensive stat makes winners harder
  speed: 0.12,       // Speed helps cover court
  return: 0.12,      // Return stat makes aces harder, serves only
};

/**
 * Shooter stat adjustments
 *
 * How the SHOOTER's own stats reduce incoming shot difficulty.
 * Formula: (shooterStat - 50) × multiplier, subtracted from inPlay requirement.
 *
 * Example: shooter anticipation 90 → (90-50) × 0.15 = -6 to threshold (easier to keep in play)
 * Example: shooter anticipation 10 → (10-50) × 0.15 = +6 to threshold (harder)
 */
export const SHOOTER_STAT_ADJUSTMENTS = {
  anticipation: 0.10,  // Reading the incoming ball makes responding easier
};

/**
 * Shot quality modifiers for the targeted mental-stat bonuses.
 * Applied inside calculateMentalModifier.
 */
export const MENTAL_SHOT_BONUSES = {
  /** Tactical-shot bonus range from shotVariety stat: 0.95 → 1.10 over 0-100 */
  variety: { base: 0.95, perStat: 0.15 / 100 },
  /** Defensive-shot bonus range from defensive stat: 1.00 → 1.10 over 0-100 */
  defense: { base: 1.00, perStat: 0.10 / 100 },
  /** Offensive-shot bonus range from offensive stat: 0.8 → 1.10 over 0-100 */
  offense: { base: 0.8, perStat: 0.30 / 100 },
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
  first: 12,    // ±12 quality variance on first serve (widened for more natural spread)
  second: 6,    // ±6 quality variance on second serve
};

/**
 * Return variance (quality randomness)
 *
 * Applied as ±variance to return quality.
 * Adds realistic variation to returns instead of constant quality values.
 */
export const RETURN_VARIANCE = 10;  // ±10 quality variance on returns

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
  base: 9,              // Base ±9 variance on all rally shots (widened for upset potential)
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
  serve: 1.0,     // Serve quality should center around the serve stat, not above it
  return: 1.20,   // Max 120% total modifier for returns
  rally: 1.25,    // Max 125% total modifier for rally shots
};

/**
 * Probability steepness for sigmoid outcome curves
 *
 * Controls how gradually outcomes transition around thresholds.
 * Lower steepness = wider transition band = more gradual scaling.
 *
 * A steepness of 0.12 creates a ~30-point transition zone
 * where probability goes from ~3% to ~97%.
 */
export const PROBABILITY_STEEPNESS = {
  serve: {
    inPlay: 0.08,      // ~45-point band for serve fault/in
    ace: 0.08,          // ~45-point band for aces (very gradual)
  },
  rally: {
    // Deliberately flat: rally shots are repeated contests, so per-shot edges
    // compound. Flat curves keep small stat gaps from deciding whole matches.
    winner: 0.07,       // ~50-point band for winners
    inPlay: 0.08,       // ~45-point band for keeping in play
    forcedError: 0.10,  // ~36-point band for forced vs unforced
  },
};

/**
 * Sigmoid probability function
 *
 * Returns probability (0-1) of clearing a threshold given a quality value.
 * At quality = threshold, returns 0.5 (50%).
 * Quality well above threshold approaches 1.0.
 * Quality well below threshold approaches 0.0.
 */
export function sigmoidProbability(quality: number, threshold: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (quality - threshold)));
}

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
    shotStr.includes('drop_shot')
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

// =======================
// RALLY & DIFFICULTY
// =======================

/** Rally length limits and point duration estimation */
export const RALLY_CONFIG = {
  /** Maximum shots in a rally before forcing an outcome */
  maxLength: 30,
  /** Estimated seconds per shot for point duration calculation */
  durationPerShot: 2.5,
  /** Duration multiplier for rallies exceeding longRallyThreshold */
  longRallyCostMultiplier: 1.5,
  /** Shot count above which longRallyCostMultiplier applies */
  longRallyThreshold: 10,
};

/**
 * Difficulty score contributions for calculateShotDifficulty.
 * Higher positive values = harder shot, negative = easier.
 */
export const DIFFICULTY_SCORE_FACTORS = {
  /** Shooter's court position impact on difficulty */
  shooterPosition: {
    way_out_wide: 30,
    way_back_deep: 30,
    recovering: 20,
    slightly_off: 10,
    well_positioned: 0,
    at_net: 10,   // volleying is a reaction shot — not a free putaway
  } as Record<CourtPosition, number>,

  /** Incoming ball quality thresholds (relative to match level) */
  ballQuality: {
    exceptional: 25,
    high: 15,
  },

  /** Time pressure from incoming ball */
  timePressure: {
    rushed: 20,
    plenty: -10,
  },

  /** Spin difficulty bonus */
  spin: {
    heavy_topspin: 10,
  },

  /** Opponent's court position impact on difficulty */
  opponentPosition: {
    at_net: 8,
    well_positioned: 5,
    way_out_wide: -15,
    way_back_deep: -15,
    recovering: 0,
    slightly_off: 0,
  } as Record<CourtPosition, number>,

  /** Rally length fatigue: adds difficulty in long rallies */
  rallyFatigue: {
    /** Shot count for higher fatigue bonus */
    threshold1: 15,
    /** Difficulty bonus above threshold1 */
    bonus1: 10,
    /** Shot count for lower fatigue bonus */
    threshold2: 10,
    /** Difficulty bonus above threshold2 */
    bonus2: 5,
  },
};

/**
 * Maps cumulative difficulty score to a difficulty level.
 * Score below 'normal' → easy, below 'hard' → normal, below 'extreme' → hard, else extreme.
 */
export const DIFFICULTY_THRESHOLDS = {
  normal: 30,
  hard: 60,
};

// =======================
// MATCH-DAY FORM
// =======================

/**
 * Per-match form roll: a flat quality offset rolled once per player at the
 * start of each match (uniform in ±variance), applied to every shot.
 *
 * This is where match-level upsets come from. Tennis scoring amplifies tiny
 * per-point edges into near-certain match outcomes (a 55% point winner takes
 * ~90% of matches), so per-shot randomness alone can never produce upsets.
 * A good form day for the weaker player closes a small stat gap; it barely
 * dents a large one — better players win consistently, underdogs stay alive.
 */
export const MATCH_FORM = {
  variance: 8,
};

// =======================
// MATCH FATIGUE & MOMENTUM
// =======================

/** Match fatigue accumulation and recovery constants */
export const MATCH_FATIGUE = {
  /** Base fatigue gained per rally shot */
  basePerShot: 0.6,
  /** Extra fatigue per shot in rallies longer than 8 shots */
  longRallyExtra: 0.2,
  /** Rally length threshold for extra fatigue */
  longRallyThreshold: 8,
  /** Minimum fatigue rate as fraction of base (stamina 100 player) */
  minFatigueRate: 0.3,
  /** Base recovery per point (before recovery stat scaling) */
  baseRecoveryPerPoint: 0.08,
  /** Max recovery per point (recovery stat 100) */
  maxRecoveryPerPoint: 0.25,
  /** Starting fatigue factor from low energy: (100 - energy) * this */
  energyToFatigueFactor: 0.3,
};

/** Fatigue quality modifier: linear from 1.0 (fatigue=0) to minModifier (fatigue=100) */
export const FATIGUE_MODIFIER = {
  minModifier: 0.80, // 20% max penalty at total exhaustion
};

/** Momentum quality modifier */
export const MOMENTUM_MODIFIER = {
  /** Max bonus from positive momentum (+100) */
  maxBonus: 0.10,
  /** Max penalty from negative momentum (-100) */
  maxPenalty: 0.10,
  /** Focus stat mitigation: at focus 100, negative penalty reduced by this fraction */
  focusMitigation: 0.5,
};

/** Momentum bank configuration for key moment system */
export const MOMENTUM_BANK = {
  /** Max absolute value the bank can reach */
  clamp: 60,
  /** Decay multiplier per point (moves bank toward 0) */
  decay: 0.95,
  /** Blend weight for recent form component */
  blendRecent: 0.6,
  /** Blend weight for persistent bank component */
  blendBank: 0.4,
  /** Per-point-type momentum bumps */
  bump: {
    ace: 8,
    winner: 5,
    doubleFault: 6,
    unforcedError: 3,
    forcedError: 4,
  } as Record<string, number>,
};

/** Pressure bank configuration for key moment system */
export const PRESSURE_BANK = {
  /** Max absolute value the bank can reach */
  clamp: 40,
  /** Decay multiplier per point */
  decay: 0.90,
};

// =======================
// COURT SURFACE EFFECTS
// =======================

/**
 * How each court surface changes simulation mechanics.
 *
 * - serveQualityMultiplier:       multiplies final serve quality (>1 = serves more dominant)
 * - rallyPaceMultiplier:          multiplies final rally-shot quality (>1 = shots penetrate more)
 * - netApproachBonus:             multiplicative nudge on ShotSelector.shouldApproachNet probability
 * - defensiveAdjustmentMultiplier: scales OPPONENT_STAT_ADJUSTMENTS.defensive impact in calculateQualityRequirements
 * - returnAdjustmentMultiplier:   scales the return-based ace threshold bump in determineServeOutcome
 */
export interface SurfaceEffects {
  serveQualityMultiplier: number;
  rallyPaceMultiplier: number;
  netApproachBonus: number;
  defensiveAdjustmentMultiplier: number;
  returnAdjustmentMultiplier: number;
}

export const SURFACE_EFFECTS: Record<CourtSurface, SurfaceEffects> = {
  // Baseline — reference balance that existing tuning is calibrated against.
  hard: {
    serveQualityMultiplier: 1.00,
    rallyPaceMultiplier: 1.00,
    netApproachBonus: 0.00,
    defensiveAdjustmentMultiplier: 1.00,
    returnAdjustmentMultiplier: 1.00,
  },
  // Slow surface: serves weaker, rallies longer, defense rewarded, net play risky.
  clay: {
    serveQualityMultiplier: 0.94,
    rallyPaceMultiplier: 0.97,
    netApproachBonus: -0.35,
    defensiveAdjustmentMultiplier: 1.25,
    returnAdjustmentMultiplier: 1.15,
  },
  // Fast surface: serves dominant, rallies shorter, net play rewarded, defense less effective.
  grass: {
    serveQualityMultiplier: 1.05,
    rallyPaceMultiplier: 1.03,
    netApproachBonus: 0.40,
    defensiveAdjustmentMultiplier: 0.85,
    returnAdjustmentMultiplier: 0.85,
  },
  // Also fast but slightly toned down from grass.
  carpet: {
    serveQualityMultiplier: 1.04,
    rallyPaceMultiplier: 1.02,
    netApproachBonus: 0.35,
    defensiveAdjustmentMultiplier: 0.75,
    returnAdjustmentMultiplier: 0.75,
  },
};

// =======================
// SHOT TYPE HELPERS
// =======================

/**
 * Shot types that express tactical creativity (drop, angle, lob, passing).
 * Targeted by shotVariety bonus in calculateMentalModifier.
 */
export function isTacticalShot(shotType: ShotType): boolean {
  const s = shotType.toString();
  return (
    s.includes('drop_shot') ||
    s.includes('angle_shot') ||
    s.includes('lob') ||
    s.includes('passing_shot')
  );
}

/**
 * Shot types that are fundamentally defensive (slice, lob, defensive_*).
 * Targeted by defensive stat bonus in calculateMentalModifier.
 */
export function isDefensiveShot(shotType: ShotType): boolean {
  const s = shotType.toString();
  return (
    s.includes('slice') ||
    s.includes('lob') ||
    s.includes('defensive_')
  );
}

/**
 * Shot types that are fundamentally offensive (first serve, *_power, overhead)
 */
export function isOffensiveShot(shotType: ShotType): boolean {
  const s = shotType.toString();
  return (
    s.includes('serve_first') ||
    s.includes('_power') ||
    s.includes('overhead') || 
    s.includes('_approach')
  );
}

