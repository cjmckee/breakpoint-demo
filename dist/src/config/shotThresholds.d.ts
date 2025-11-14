import type { ShotType, CourtPosition } from '../types/index.js';
export declare const RELATIVE_QUALITY_REQUIREMENTS: Record<ShotType, number>;
export declare const MIN_QUALITY_FLOORS: {
    offensive: number;
    neutral: number;
    defensive: number;
};
export declare const MINIMUM_WINNER_THRESHOLDS: {
    defensive: number;
    neutral: number;
    offensive: number;
};
export declare const OUTCOME_MULTIPLIERS: {
    defensive: {
        inPlay: number;
        winner: number;
        forcedError: number;
    };
    neutral: {
        inPlay: number;
        winner: number;
        forcedError: number;
    };
    offensive: {
        inPlay: number;
        winner: number;
        forcedError: number;
    };
};
export declare const SERVE_BASELINE: {
    serve_first: {
        inPlayThreshold: number;
        aceMultiplier: number;
    };
    serve_second: {
        inPlayThreshold: number;
        aceMultiplier: number;
    };
    kick_serve: {
        inPlayThreshold: number;
        aceMultiplier: number;
    };
};
export declare const OPPONENT_STAT_ADJUSTMENTS: {
    defensive: number;
    speed: number;
    return: number;
};
export declare const POSITION_ADJUSTMENTS: Record<CourtPosition, number>;
export declare const SERVE_VARIANCE: {
    first: number;
    second: number;
};
export declare const RETURN_VARIANCE = 6;
export declare const RALLY_SHOT_VARIANCE: {
    base: number;
    qualityMultiplier: number;
};
export declare const SERVE_BONUSES: {
    first: {
        offensive: {
            multiplier: number;
            maxBonus: number;
        };
        strength: {
            multiplier: number;
            maxBonus: number;
        };
        spin: {
            multiplier: number;
            maxBonus: number;
        };
    };
    second: {
        consistency: {
            multiplier: number;
            maxBonus: number;
        };
        spin: {
            multiplier: number;
            maxBonus: number;
        };
        defensive: {
            multiplier: number;
            maxBonus: number;
        };
    };
};
export declare const TOTAL_MODIFIER_CAPS: {
    serve: number;
    return: number;
    rally: number;
};
export declare function getShotCategory(shotType: ShotType): 'offensive' | 'neutral' | 'defensive';
