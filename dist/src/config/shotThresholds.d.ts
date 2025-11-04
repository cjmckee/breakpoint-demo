import type { ShotType, CourtPosition } from '../types/index.js';
export declare const RELATIVE_QUALITY_REQUIREMENTS: Record<ShotType, number>;
export declare const MIN_QUALITY_FLOORS: {
    offensive: number;
    neutral: number;
    defensive: number;
};
export declare const OUTCOME_MULTIPLIERS: {
    winner: number;
    forcedError: number;
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
export declare const SERVE_BONUSES: {
    first: {
        offensive: number;
        strength: number;
        spin: number;
    };
    second: {
        consistency: number;
        spin: number;
        defensive: number;
    };
};
export declare function getShotCategory(shotType: ShotType): 'offensive' | 'neutral' | 'defensive';
