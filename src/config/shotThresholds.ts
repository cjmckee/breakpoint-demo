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
 * The match level MIN_QUALITY_FLOORS is calibrated at.
 *
 * The floors are absolute values inside an otherwise relative system, so at low
 * levels they stop being a backstop and become the operative requirement: a
 * 20-quality ball asks 0.50 x 20 = 10 for a groundstroke, which the neutral
 * floor raises to 15 — a 50% higher bar than the relative system computed, from
 * a constant chosen for play around 70. Scaling them by matchLevel keeps them
 * doing their intended job (stopping requirements collapsing toward zero after
 * long degraded rallies) at every level rather than only at this one.
 *
 * MINIMUM_WINNER_THRESHOLDS deliberately does NOT scale — see its own note.
 */
export const FLOOR_CALIBRATION_LEVEL = 70;

/**
 * Minimum winner threshold per shot type — an absolute quality floor a shot must
 * approach before it can be an outright winner, regardless of how weak the
 * incoming ball was.
 *
 * Per-shot rather than per-category, because with three category values
 * (50/55/60) this floor binds for nearly every shot at mid level and flattens
 * the whole shot set together: at level 40 a player produced ~36 quality against
 * floors 10-24 points above it, and PROBABILITY_STEEPNESS.rally.winner is
 * deliberately flat, so everything landed between 16% and 28% winners. Shot
 * choice stopped mattering exactly in the middle of the range.
 *
 * Spreading the floors per shot restores that differentiation without touching
 * the sigmoid: at level 40 winner rates now run from 0.5% (defensive slice) to
 * 22% (overhead). Sweeping steepness from 0.05 to 0.16 barely moved the fit —
 * this was never a steepness problem.
 *
 * Values above 100 are legitimate. These are sigmoid midpoints, not hard cutoffs,
 * so a floor of 111 means "vanishingly rare at every level" rather than
 * "impossible" — which is the intent for a defensive slice.
 *
 * These stay absolute rather than scaling with match level. Scaling them was
 * measured and is worse than leaving them alone: at tier-1 levels it takes
 * winners from 7% of points to 40% and makes rallies shorter, the exact failure
 * this floor exists to prevent.
 */
/**
 * Global offset applied to every winner floor — the single dial for how often
 * points end in a winner rather than an error, without disturbing the ordering
 * the table sets. Negative values mean more winners.
 *
 * Measured across the ladder with the current tables and retrieval blend
 * (winners as a share of points):
 *
 *   offset     new player (20)   Jordan (46)   uniform 55   uniform 70
 *        0                4.3%         15.1%        17.6%        30.3%
 *       -8                7.1%         20.4%        24.2%        37.5%
 *      -16                9.4%         27.7%        30.5%        41.5%
 *
 * For reference, the three per-category floors this table replaced gave
 * 11.7% / 34.2% / 37.3% / 40.4% — more winners everywhere, but with almost no
 * differentiation between shots in the middle of the range.
 */
export const WINNER_FLOOR_OFFSET = 0;

/**
 * How far the winner floor follows the opponent instead of standing still.
 *
 * A purely absolute floor makes the shot economy change character with level,
 * because shot quality rises roughly with the stat while the floor does not.
 * Measured against a same-level opponent, a forehand went from 1.2% winners at
 * level 20 to 23.4% at level 85 — the floor acts as a step, and once quality
 * clears it every shot starts winning. That is the concern the two-player
 * average was originally reaching for.
 *
 * Scaling the floor fully with the opponent is the opposite failure: it flattens
 * progression, since a same-level opponent's retrieval rises in step with the
 * shooter's quality and the two cancel. So this is a blend. 0 is a fixed floor;
 * 1 follows the opponent completely.
 *
 * Anchored to the OPPONENT only — never the shooter, and never the two-player
 * average — so improving your own stats can never raise your own winner bar.
 *
 * Measured, winners as a share of points:
 *
 *   weight    new player (20)   Jordan (46)   uniform 55   uniform 70
 *        0               2.0%         13.2%        21.7%        36.7%
 *     0.35               5.3%         16.6%        19.9%        30.5%
 *     0.50               7.1%         16.2%        19.7%        23.1%
 *
 * And per-shot against a same-level opponent, forehand winners by level
 * (20/30/40/60/85): 1.2/2.5/4.9/18.9/23.4 at weight 0, versus 6.5/7.4/8.2/
 * 11.4/20.0 at weight 0.5 — the same game at every level rather than a
 * different one. Progression is still paid: against a PINNED level-30
 * opponent, a forehand at weight 0.5 goes 3.5% to 89.7% as the shooter climbs
 * 20 to 85, ahead of the 1.1% to 74.0% a fixed floor gives.
 */
export const WINNER_FLOOR_RETRIEVAL_WEIGHT = 0.35;

/** Opponent retrieval at which the blended floor equals its table value. */
export const WINNER_FLOOR_RETRIEVAL_REF = 50;

export const MINIMUM_WINNER_THRESHOLDS: Record<ShotType, number> = {
  // Serves resolve through determineServeOutcome and never read this.
  'serve_first': 50,
  'serve_second': 50,

  // Put-aways — the lowest bar in the game
  'overhead': 57,
  'defensive_overhead': 80,

  // Power shots
  'forehand_power': 61,
  'backhand_power': 61,
  'volley_forehand_power': 61,
  'volley_backhand_power': 61,
  'return_forehand_power': 68,
  'return_backhand_power': 68,

  // Passing shots and volleys finish points from open positions
  'passing_shot_forehand': 66,
  'passing_shot_backhand': 66,
  'volley_forehand': 67,
  'volley_backhand': 67,
  'half_volley_forehand': 75,
  'half_volley_backhand': 75,

  // Touch and angle
  'drop_shot_forehand': 70,
  'drop_shot_backhand': 70,
  'angle_shot_forehand': 81,
  'angle_shot_backhand': 81,

  // Rally balls — a clean groundstroke can win, but it is not a put-away
  'forehand': 80,
  'backhand': 80,
  'forehand_approach': 85,
  'backhand_approach': 85,

  // Defensive shots should almost never be the winning shot
  'slice_forehand': 93,
  'slice_backhand': 93,
  'return_forehand': 114,
  'return_backhand': 114,
  'lob_forehand': 100,
  'lob_backhand': 100,
  'defensive_slice_forehand': 105,
  'defensive_slice_backhand': 105,
};

/**
 * Outcome multipliers for determining winners and forced errors
 *
 * Categories set how easy a shot is to keep in play and where the forced/unforced
 * error line falls. Winner difficulty is per-shot — see WINNER_REQUIREMENTS.
 */
export const OUTCOME_MULTIPLIERS = {
  // Defensive shots: slices, lobs, defensive overheads
  defensive: {
    inPlay: 1.0,        // Base requirement (easiest to keep in play)
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Neutral shots: regular groundstrokes, volleys
  neutral: {
    inPlay: 1.0,        // Base requirement
    forcedError: 0.7,   // Below 70% = forced error
  },

  // Offensive shots: power shots, overheads, passing shots, angles
  offensive: {
    inPlay: 1.0,        // Base requirement
    forcedError: 0.7,   // Below 70% = forced error
  },
};

/**
 * Winner requirement per shot type, as a multiple of the shot's in-play
 * requirement.
 *
 * This is per-shot rather than per-category because the in-play requirement it
 * multiplies already varies from 0.25 (defensive slice) to 0.85 (power return).
 * A single category multiplier on top of that produced an effective winner
 * difficulty ranging from 0.81 to 2.63 times incoming quality, in no relation
 * to which shots are supposed to end points.
 *
 * That mattered because shot quality is bounded — it clamps at 100, and
 * TOTAL_MODIFIER_CAPS.rally holds it near there from about level 60 up — while
 * these midpoints are not. At high levels every shot produces ~96-99 quality,
 * so the ordering of who wins points is decided entirely by this product. Under
 * the old category multipliers an expert's best point-ender was the drop shot
 * (75% winners) followed by the defensive slice (45%), while the passing shot
 * managed 11%, the volley 3% and the return 0.3%. Backwards end to end.
 *
 * Values are set from the intended winner rate at the top of the stat range:
 * shots meant to finish points (overhead, power, passing, volley, drop) climb
 * with level, while defensive shots (slice, lob, return) stay rare no matter
 * how good the player is. MINIMUM_WINNER_THRESHOLDS keeps them all rare at the
 * bottom, where it binds.
 */
export const WINNER_REQUIREMENTS: Record<ShotType, number> = {
  // Serves resolve through determineServeOutcome and never read this.
  'serve_first': 1.80,
  'serve_second': 1.80,

  // Neutral groundstrokes — a solid rally ball, not a finisher
  'forehand': 2.20,
  'backhand': 2.20,

  // Power shots — the primary point-enders
  'forehand_power': 1.65,
  'backhand_power': 1.65,

  // Approach shots set up the finish rather than being it
  'forehand_approach': 2.10,
  'backhand_approach': 2.10,

  // Volleys finish points; the power volley finishes harder
  'volley_forehand': 1.95,
  'volley_backhand': 1.95,
  'volley_forehand_power': 1.65,
  'volley_backhand_power': 1.65,
  'half_volley_forehand': 2.00,
  'half_volley_backhand': 2.00,

  // Overheads are the cleanest put-away in the game
  'overhead': 1.85,
  'defensive_overhead': 2.60,

  // Drop shots win, but not three times more often than a smash
  'drop_shot_forehand': 2.60,
  'drop_shot_backhand': 2.60,

  // Angles open the court and win outright reasonably often
  'angle_shot_forehand': 1.90,
  'angle_shot_backhand': 1.90,

  // Slices extend rallies — they should almost never be the winning shot
  'slice_forehand': 3.50,
  'slice_backhand': 3.50,
  'defensive_slice_forehand': 4.95,
  'defensive_slice_backhand': 4.95,

  // Returns are survival, not offence; the power return is a real weapon
  'return_forehand': 2.25,
  'return_backhand': 2.25,
  'return_forehand_power': 1.80,
  'return_backhand_power': 1.80,

  // Lobs reset the point
  'lob_forehand': 4.15,
  'lob_backhand': 4.15,

  // Passing shots are hit to win
  'passing_shot_forehand': 1.60,
  'passing_shot_backhand': 1.60,
};

/**
 * Serve-in consistency: where the serve-in midpoint sits relative to the serve
 * the player was going to hit anyway.
 *
 * The roll is the accuracy composite through the shot modifiers, plus variance
 * and match form. The midpoint is an affine function of the SAME expected
 * accuracy, so the margin between them is a property of the player's serve and
 * nothing else.
 *
 * This replaces a midpoint of `overallRating x inPlayThreshold / 70`. That was a
 * fixed proportion of overall rating while the roll carried finalAdjustment,
 * which climbs from about 0.71 at low stats to a cap of 1.0. The margin was
 * therefore `L x (finalAdjustment - 0.886)` — two terms both scaling with L,
 * nearly cancelling, so first-serve-in sat at 43-45% from OVR 20 to 30 and only
 * moved once finalAdjustment crossed 0.886 around OVR 41. It also meant training
 * any unrelated stat raised overallRating and so raised the player's own
 * serve-in bar: the last self-coupling left in the system.
 *
 * Constants are fitted to a target curve rather than to tennis broadcast
 * numbers, because 20 on this scale is a genuine beginner. First serves in run
 * roughly 45% at OVR 20 to 71% at OVR 90; second serves 50% to 95%, giving a
 * double-fault rate around 28% for a beginner falling to a couple of percent at
 * the top.
 *
 *   midpoint = base + perAccuracy x (accuracyComposite x finalAdjustment)
 */
export const SERVE_CONSISTENCY = {
  serve_first: { base: 5.1, perAccuracy: 0.817 },
  serve_second: { base: 11.3, perAccuracy: 0.376 },
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
 * Support-stat quality modifiers.
 *
 * Every one of these is a supporting stat layered on top of the shot's primary
 * stat, which already carries the player's skill at that shot. They are
 * therefore expressed as a symmetric band around NEUTRAL_STAT: a player whose
 * support stat sits at the neutral point multiplies by exactly 1.0, above it
 * they gain, below it they lose.
 *
 * This matters because the modifiers multiply. When they were anchored so that
 * only a 100-stat player was neutral, a low-stat player compounded three or
 * four sub-1 factors and produced quality far below their primary stat — a
 * uniform-20 player reached 0.605 on an overhead. That double-counted skill
 * (the primary stat had already accounted for it) and it collided with
 * RELATIVE_QUALITY_REQUIREMENTS, whose multipliers sit inside the same range,
 * leaving several shots with success rates that did not improve with level at
 * all. Centering removes the collision: quality tracks the primary stat, and
 * these express build SHAPE — which supports you have invested in relative to
 * the rest of your game.
 */
export const NEUTRAL_STAT = 50;

/**
 * Global scale on every support band. 1.0 keeps today's spread while centering
 * it; lower values make support stats matter less and the primary stat more.
 */
export const MODIFIER_SPREAD = 1.0;

/**
 * Half-width of each support band at MODIFIER_SPREAD 1. A band of 0.10 means
 * stat 0 multiplies by 0.90 and stat 100 by 1.10.
 */
export const STAT_MODIFIER_BANDS = {
  /** Speed, on defensive shots and defensive court position */
  speed: 0.10,
  /** Strength, on power shots */
  strength: 0.10,
  /** Agility, on net shots and rushed balls */
  agility: 0.15,
  /** Anticipation, when the opponent is at net or well positioned */
  anticipation: 0.10,
  /** Shot variety, on tactical shots (drop, angle, lob, passing) */
  variety: 0.075,
  /** Defensive, on defensive shots */
  defense: 0.05,
  /** Offensive, on offensive shots */
  offense: 0.15,
} as const;

/**
 * Spin and placement are applied as percentage-point bonuses rather than
 * multipliers, so their bands are in points: 10 means stat 0 gives −10% and
 * stat 100 gives +10%.
 */
export const STAT_BONUS_BANDS = {
  spin: 10,
  placement: 7.5,
} as const;

/** Support-stat multiplier: 1.0 at NEUTRAL_STAT, band-wide at the extremes. */
export function statModifier(stat: number, band: number): number {
  return 1 + ((stat - NEUTRAL_STAT) / NEUTRAL_STAT) * band * MODIFIER_SPREAD;
}

/** Support-stat percentage-point bonus: 0 at NEUTRAL_STAT. */
export function statBonus(stat: number, band: number): number {
  return ((stat - NEUTRAL_STAT) / NEUTRAL_STAT) * band * MODIFIER_SPREAD;
}

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
  /**
   * How strongly a player's mood skews their form roll toward positive/negative.
   * At mood = +/-100, the roll's center shifts by this fraction of variance
   * (e.g. 0.5 means a maxed-out mood biases the roll halfway toward that side,
   * without eliminating the chance of the opposite result).
   */
  moodInfluence: 0.5,
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
  /**
   * Starting fatigue factor from low energy.
   * Formula: Math.max(0, (energyFullStaminaThreshold - energy) * energyToFatigueFactor)
   * energy=0  → fatigue=20 → stamina=80
   * energy=50 → fatigue=0  → stamina=100
   */
  energyFullStaminaThreshold: 50,
  energyToFatigueFactor: 0.4,
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

/**
 * Event-driven momentum configuration (shared by MatchSimulator and MatchOrchestrator).
 *
 * Momentum is a single value in [-clamp, +clamp] on a player-positive scale
 * (>0 favours the player). Every point nudges it toward the point winner, and
 * it decays back toward 0 when nothing keeps feeding it. Game- and set-level
 * events (a break of serve, a set won) can seize or reset it — this is what
 * lets a "big moment" take over rather than momentum being a rolling point count.
 *
 * All magnitudes live on the same scale, so a key moment's authored momentum
 * reward (fed via MomentumEngine.applyDirect) reads on the bar instead of being
 * dwarfed by the incidental swing of simply winning the point.
 */
export const MOMENTUM = {
  /** Max absolute momentum value. */
  clamp: 100,
  /** Per-point decay toward 0 (applied before each point's bump). */
  decayPerPoint: 0.9,

  /**
   * Base per-point bump by how the point ended, applied toward the point winner.
   * Emphatic ends (aces, winners) and self-inflicted losses (double faults) move
   * the needle more than a grind-it-out error. Keyed by PointType string value.
   */
  bump: {
    ace: 12,
    winner: 10,
    double_fault: 11,
    forced_error: 8,
    unforced_error: 9,
    default: 8,
  } as Record<string, number>,

  /**
   * Multipliers on the per-point bump when the point carried stakes. A point
   * played on match point swings momentum far harder than a 15-0 point.
   * keyMoment stacks on top for interactive key-moment points.
   */
  clutchMultiplier: {
    breakPoint: 1.5,
    setPoint: 2.0,
    matchPoint: 2.5,
    keyMoment: 1.8,
  } as Record<string, number>,

  /**
   * Break of serve — the classic momentum takeover. Instead of nudging, a break
   * lerps momentum a large fraction of the way to a strong value in the breaker's
   * favour, so it can flip the sign outright even against a prior run of play.
   */
  breakOfServe: {
    target: 45,     // absolute momentum a break pulls toward (signed to the breaker)
    takeover: 0.5,  // fraction of the way to target (still flips through 0, a touch gentler)
  },

  /**
   * Set boundary — a partial reset. The scoreline resets each set, so momentum
   * mostly wipes and keeps only a small tilt toward whoever took the set.
   */
  setWon: {
    damp: 0.3,   // retain this fraction of pre-set momentum
    nudge: 12,   // small signed nudge toward the set winner
  },
};

/**
 * Stamina recovery on the natural breaks in a match, scaled by the recovery stat.
 *
 * Per-point recovery (MATCH_FATIGUE) models catching your breath between points;
 * this models the real rest windows — the changeover after each game and the
 * longer break between sets — where a high-recovery player claws back a chunk of
 * stamina. Recovered fatigue = base + (recovery/100) * scale.
 */
export const STAMINA_RECOVERY = {
  /** Fatigue removed at each changeover (game end), before recovery-stat scaling. */
  perGameBase: 2.0,
  /** Extra fatigue removed at a changeover at recovery stat 100. */
  perGameScale: 4.0,
  /** Fatigue removed at the end of a set, before recovery-stat scaling. */
  perSetBase: 8.0,
  /** Extra fatigue removed at the end of a set at recovery stat 100. */
  perSetScale: 10.0,
};

/**
 * How an aggressive key-moment win drains the opponent's stamina.
 *
 * When the player wins a key moment by spending their own energy on a bold
 * tactic, the opponent pays for it in fatigue — which feeds straight into their
 * shot quality on the following points (via the fatigue modifier). They recover
 * it on the next changeover like any other fatigue, so one moment stings without
 * permanently crippling them; a sustained aggressive stretch compounds.
 */
export const KEY_MOMENT_OPPONENT_DRAIN = {
  /** Opponent fatigue added per point of player energy spent on the winning tactic. */
  fatiguePerEnergySpent: 0.6,
  /** Multiplier applied when the key moment was a critical success. */
  criticalMultiplier: 2,
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

