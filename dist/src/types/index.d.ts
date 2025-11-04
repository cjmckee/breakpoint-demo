export interface PlayerStats {
    technical: TechnicalStats;
    physical: PhysicalStats;
    mental: MentalStats;
}
export interface TechnicalStats {
    serve: number;
    forehand: number;
    backhand: number;
    volley: number;
    overhead: number;
    drop_shot: number;
    slice: number;
    return: number;
    spin: number;
    placement: number;
}
export interface PhysicalStats {
    speed: number;
    stamina: number;
    strength: number;
    agility: number;
    recovery: number;
}
export interface MentalStats {
    focus: number;
    anticipation: number;
    shot_variety: number;
    offensive: number;
    defensive: number;
}
export type ShotType = 'serve_first' | 'serve_second' | 'kick_serve' | 'forehand' | 'backhand' | 'forehand_power' | 'backhand_power' | 'forehand_approach' | 'backhand_approach' | 'volley_forehand' | 'volley_backhand' | 'half_volley_forehand' | 'half_volley_backhand' | 'overhead' | 'defensive_overhead' | 'drop_shot_forehand' | 'drop_shot_backhand' | 'short_angle_forehand' | 'short_angle_backhand' | 'angle_shot_forehand' | 'angle_shot_backhand' | 'slice_forehand' | 'slice_backhand' | 'defensive_slice_forehand' | 'defensive_slice_backhand' | 'return_forehand' | 'return_backhand' | 'return_forehand_power' | 'return_backhand_power' | 'topspin_forehand' | 'topspin_backhand' | 'down_the_line_forehand' | 'down_the_line_backhand' | 'cross_court_forehand' | 'cross_court_backhand' | 'lob_forehand' | 'lob_backhand' | 'passing_shot_forehand' | 'passing_shot_backhand';
export interface ShotContext {
    difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
    pressure: 'low' | 'medium' | 'high';
    courtPosition: 'baseline' | 'net' | 'defensive';
    rallyLength: number;
    opponentPosition: 'poor' | 'good' | 'excellent';
    timeAvailable: 'plenty' | 'normal' | 'rushed';
    ballHeight: 'low' | 'medium' | 'high';
    ballSpeed: 'slow' | 'medium' | 'fast';
}
export type CourtPosition = 'well_positioned' | 'slightly_off' | 'way_out_wide' | 'way_back_deep' | 'at_net' | 'recovering';
export interface BallQuality {
    spin: 'flat' | 'topspin' | 'slice' | 'heavy_topspin';
    timeAvailable: 'plenty' | 'normal' | 'rushed';
    baseQuality: number;
}
export interface ShotPreference {
    forehandProbability: number;
    preferredSide: 'forehand' | 'backhand' | 'balanced';
    runAroundBackhand: boolean;
    strongShotStat: number;
    weakShotStat: number;
}
export interface TacticalOpportunity {
    attackOpportunity: 'none' | 'low' | 'medium' | 'high';
    netApproachSuitable: boolean;
    winnerAttemptSuitable: boolean;
    defensiveRequired: boolean;
    tacticalShotSuitable: boolean;
    recommendedAggression: number;
}
export interface RallyState {
    rallyLength: number;
    lastShotQuality: number;
    lastShotType: ShotType;
    shooterPosition: CourtPosition;
    opponentPosition: CourtPosition;
    ballQuality: BallQuality;
}
export interface QualityThresholds {
    winner: number;
    inPlay: number;
    forcedError: number;
}
export interface ShotResult {
    success: boolean;
    outcome: 'winner' | 'in_play' | 'forced_error' | 'unforced_error' | 'error';
    quality: number;
    shotType: ShotType;
    statUsed: keyof PlayerStats['technical'] | keyof PlayerStats['physical'] | keyof PlayerStats['mental'];
    modifiers: ShotModifiers;
    thresholds?: QualityThresholds;
}
export interface ShotModifiers {
    spinBonus: number;
    placementBonus: number;
    physicalModifier: number;
    mentalModifier: number;
    difficultyModifier: number;
    pressureModifier: number;
    rallyLengthModifier: number;
    finalAdjustment: number;
    serveVariance?: number;
}
export interface ShotDetail {
    shotType: ShotType;
    shooter: 'server' | 'returner';
    success: boolean;
    quality: number;
    outcome: 'winner' | 'in_play' | 'error' | 'forced_error' | 'unforced_error';
    errorType?: 'forced' | 'unforced';
    statUsed: string;
    modifiers: ShotModifiers;
    timestamp: number;
    shotNumber: number;
    context: ShotContext;
    thresholds?: QualityThresholds;
}
export interface PointResult {
    winner: 'server' | 'returner';
    shots: ShotDetail[];
    rallyLength: number;
    keyShot?: ShotDetail;
    pointType: 'ace' | 'winner' | 'forced_error' | 'unforced_error' | 'double_fault';
    duration: number;
    statistics: PointStatistics;
    serveType: 'first' | 'second';
}
export interface PointStatistics {
    totalShots: number;
    winnerCount: number;
    errorCount: number;
    netApproaches: number;
    rallyExchanges: number;
    pressureMoments: number;
    dominantShot?: ShotType;
}
export interface GameScore {
    server: number;
    returner: number;
    advantage?: 'server' | 'returner' | null;
    isDeuce: boolean;
}
export interface SetScore {
    player: number;
    opponent: number;
    tiebreak?: TiebreakScore;
    winner?: 'player' | 'opponent';
    isComplete: boolean;
}
export interface TiebreakScore {
    server: number;
    returner: number;
    winner?: 'server' | 'returner';
}
export interface MatchScore {
    sets: SetScore[];
    currentGame: GameScore;
    currentServer: 'player' | 'opponent';
    isMatchComplete: boolean;
    winner?: 'player' | 'opponent';
    matchFormat: MatchFormat;
}
export interface MatchFormat {
    bestOfSets: number;
    gamesPerSet: number;
    enableTiebreaks: boolean;
    tiebreakAt: number;
}
export interface MatchState {
    score: MatchScore;
    currentServer: 'player' | 'opponent';
    courtSurface: CourtSurface;
    momentum: number;
    pressure: 'low' | 'medium' | 'high';
    matchLength: number;
    pointsPlayed: number;
    isKeyMoment: boolean;
}
export type CourtSurface = 'hard' | 'clay' | 'grass' | 'carpet';
export interface MatchResult {
    matchId: string;
    winner: 'player' | 'opponent';
    finalScore: string;
    duration: number;
    courtSurface: CourtSurface;
    pointResults: PointResult[];
    scoreProgression: ScoreSnapshot[];
    statistics: MatchStatistics;
    playerPerformance: PlayerPerformance;
    opponentPerformance: PlayerPerformance;
    summary: MatchSummary;
}
export interface ScoreSnapshot {
    timestamp: number;
    gameScore: GameScore;
    setScore: SetScore;
    currentServer: 'player' | 'opponent';
    momentum: number;
}
export interface MatchAnalysisData {
    matchId: string;
    timestamp: number;
    courtSurface: CourtSurface;
    matchFormat: MatchFormat;
    player: {
        name: string;
        stats: PlayerStats;
        playStyle: PlayStyle;
        overallRating: number;
    };
    opponent: {
        name: string;
        stats: PlayerStats;
        playStyle: PlayStyle;
        overallRating: number;
    };
    winner: 'player' | 'opponent';
    finalScore: string;
    duration: number;
    points: PointAnalysisData[];
    statistics: MatchStatistics;
    scoreProgression: ScoreSnapshot[];
}
export interface PointAnalysisData {
    pointNumber: number;
    server: 'player' | 'opponent';
    winner: 'player' | 'opponent';
    pointType: 'ace' | 'winner' | 'forced_error' | 'unforced_error' | 'double_fault';
    serveType: 'first' | 'second';
    rallyLength: number;
    duration: number;
    shots: ShotDetail[];
    keyShot?: ShotDetail;
    matchState: {
        pressure: 'low' | 'medium' | 'high';
        momentum: number;
        isKeyMoment: boolean;
        gameScore: GameScore;
        setScore: SetScore;
    };
}
export interface MatchStatistics {
    totalPoints: {
        player: number;
        opponent: number;
    };
    pointsWon: {
        player: {
            serve: number;
            return: number;
        };
        opponent: {
            serve: number;
            return: number;
        };
    };
    winners: {
        player: number;
        opponent: number;
    };
    errors: {
        player: number;
        opponent: number;
    };
    unforcedErrors: {
        player: number;
        opponent: number;
    };
    forcedErrors: {
        player: number;
        opponent: number;
    };
    aces: {
        player: number;
        opponent: number;
    };
    doubleFaults: {
        player: number;
        opponent: number;
    };
    firstServePercentage: {
        player: number;
        opponent: number;
    };
    secondServePercentage: {
        player: number;
        opponent: number;
    };
    firstServePointsWon: {
        player: number;
        opponent: number;
    };
    secondServePointsWon: {
        player: number;
        opponent: number;
    };
    breakPointOpportunities: {
        player: number;
        opponent: number;
    };
    breakPointsConverted: {
        player: number;
        opponent: number;
    };
    averageRallyLength: number;
    longestRally: number;
    averageRallyLengthWon: {
        player: number;
        opponent: number;
    };
    longestRallyWon: {
        player: number;
        opponent: number;
    };
    netPointsWon: {
        player: number;
        opponent: number;
    };
    shotTypeStats: {
        [K in ShotType]?: {
            attempts: {
                player: number;
                opponent: number;
            };
            successful: {
                player: number;
                opponent: number;
            };
            winners: {
                player: number;
                opponent: number;
            };
            errors: {
                player: number;
                opponent: number;
            };
            unforcedErrors: {
                player: number;
                opponent: number;
            };
            forcedErrors: {
                player: number;
                opponent: number;
            };
        };
    };
    statCorrelation: {
        [statName: string]: {
            expectedPerformance: number;
            actualPerformance: number;
            correlation: number;
        };
    };
}
export interface PlayerPerformance {
    overallRating: number;
    technicalPerformance: number;
    physicalPerformance: number;
    mentalPerformance: number;
    statEffectiveness: {
        [K in keyof PlayerStats['technical']]: number;
    } & {
        [K in keyof PlayerStats['physical']]: number;
    } & {
        [K in keyof PlayerStats['mental']]: number;
    };
    pressurePointsWon: number;
    longRallySuccess: number;
    netPlaySuccess: number;
    bigPointsConverted: number;
    clutchPerformance: number;
}
export interface MatchSummary {
    outcome: 'win' | 'loss';
    competitiveness: 'dominant' | 'comfortable' | 'close' | 'very_close';
    keyFactor: 'serving' | 'returning' | 'consistency' | 'power' | 'pressure' | 'fitness';
    bestStat: string;
    worstStat: string;
    recommendations: string[];
    highlights: string[];
}
export interface PlayerProfile {
    id: string;
    name: string;
    stats: PlayerStats;
    energy: number;
    form: number;
    confidence: number;
    level: number;
    experience: number;
    matchesPlayed: number;
    matchesWon: number;
    overallRating: number;
    playStyle: PlayStyle;
    preferredSurface: CourtSurface;
}
export interface PlayStyle {
    type: 'aggressive' | 'defensive' | 'all_court' | 'serve_volley' | 'counterpuncher';
    aggression: number;
    netApproach: number;
    consistency: number;
    power: number;
    description: string;
}
export interface TrainingResult {
    type: 'training';
    timestamp: string;
    trainingType: string;
    trainingName: string;
    sessionTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    energyCost: number;
    timeSlotsUsed: number;
    statBoosts: Partial<PlayerStats['technical'] & PlayerStats['physical'] & PlayerStats['mental']>;
    efficiency: number;
    moodResult: number;
    abilityGained?: string;
    abilityLevel?: number;
    tierModification?: 'promoted' | 'demoted';
}
export type StatName = keyof TechnicalStats | keyof PhysicalStats | keyof MentalStats;
export type StatCategory = 'technical' | 'physical' | 'mental';
export interface OperationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}
