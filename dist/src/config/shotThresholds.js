export const RELATIVE_QUALITY_REQUIREMENTS = {
    'serve_first': 0.50,
    'serve_second': 0.50,
    'kick_serve': 0.50,
    'forehand': 0.50,
    'backhand': 0.50,
    'forehand_power': 0.70,
    'backhand_power': 0.70,
    'forehand_approach': 0.60,
    'backhand_approach': 0.60,
    'volley_forehand': 0.60,
    'volley_backhand': 0.60,
    'half_volley_forehand': 0.65,
    'half_volley_backhand': 0.65,
    'overhead': 0.60,
    'defensive_overhead': 0.70,
    'drop_shot_forehand': 0.45,
    'drop_shot_backhand': 0.45,
    'short_angle_forehand': 0.65,
    'short_angle_backhand': 0.65,
    'angle_shot_forehand': 0.65,
    'angle_shot_backhand': 0.65,
    'slice_forehand': 0.35,
    'slice_backhand': 0.35,
    'defensive_slice_forehand': 0.25,
    'defensive_slice_backhand': 0.25,
    'return_forehand': 0.75,
    'return_backhand': 0.75,
    'return_forehand_power': 0.85,
    'return_backhand_power': 0.85,
    'topspin_forehand': 0.55,
    'topspin_backhand': 0.55,
    'down_the_line_forehand': 0.55,
    'down_the_line_backhand': 0.55,
    'cross_court_forehand': 0.50,
    'cross_court_backhand': 0.50,
    'lob_forehand': 0.30,
    'lob_backhand': 0.30,
    'passing_shot_forehand': 0.75,
    'passing_shot_backhand': 0.75,
};
export const MIN_QUALITY_FLOORS = {
    offensive: 20,
    neutral: 15,
    defensive: 10,
};
export const MINIMUM_WINNER_THRESHOLDS = {
    defensive: 55,
    neutral: 50,
    offensive: 45,
};
export const OUTCOME_MULTIPLIERS = {
    defensive: {
        inPlay: 1.0,
        winner: 3.0,
        forcedError: 0.7,
    },
    neutral: {
        inPlay: 1.0,
        winner: 2.0,
        forcedError: 0.7,
    },
    offensive: {
        inPlay: 1.0,
        winner: 1.5,
        forcedError: 0.7,
    },
};
export const SERVE_BASELINE = {
    serve_first: {
        inPlayThreshold: 45,
        aceMultiplier: 1.10,
    },
    serve_second: {
        inPlayThreshold: 35,
        aceMultiplier: 1.20,
    },
    kick_serve: {
        inPlayThreshold: 40,
        aceMultiplier: 1.15,
    },
};
export const OPPONENT_STAT_ADJUSTMENTS = {
    defensive: 0.25,
    speed: 0.10,
    return: 0.20,
};
export const POSITION_ADJUSTMENTS = {
    'well_positioned': +3,
    'slightly_off': +0,
    'way_out_wide': -8,
    'way_back_deep': -5,
    'recovering': -3,
    'at_net': +10,
};
export const SERVE_VARIANCE = {
    first: 8,
    second: 4,
};
export const RETURN_VARIANCE = 6;
export const RALLY_SHOT_VARIANCE = {
    base: 4,
    qualityMultiplier: 6,
};
export const SERVE_BONUSES = {
    first: {
        offensive: { multiplier: 0.08, maxBonus: 0.05 },
        strength: { multiplier: 0.06, maxBonus: 0.04 },
        spin: { multiplier: 0.04, maxBonus: 0.03 },
    },
    second: {
        consistency: { multiplier: 0.10, maxBonus: 0.06 },
        spin: { multiplier: 0.08, maxBonus: 0.05 },
        defensive: { multiplier: 0.05, maxBonus: 0.03 },
    },
};
export const TOTAL_MODIFIER_CAPS = {
    serve: 1.15,
    return: 1.20,
    rally: 1.25,
};
export function getShotCategory(shotType) {
    const shotStr = shotType.toString();
    if (shotStr.includes('power') ||
        shotStr.includes('overhead') ||
        shotStr.includes('passing_shot') ||
        shotStr.includes('short_angle')) {
        return 'offensive';
    }
    if (shotStr.includes('slice') ||
        shotStr.includes('lob') ||
        shotStr.includes('defensive')) {
        return 'defensive';
    }
    return 'neutral';
}
