/**
 * Core TypeScript interfaces for the simplified tennis RPG
 * All types needed for the new match simulation architecture
 */

// =======================
// PLAYER STATS SYSTEM
// =======================

/**
 * Complete player statistics (20 total stats, 0-100 range)
 */
export interface PlayerStats {
  technical: TechnicalStats;
  physical: PhysicalStats;
  mental: MentalStats;
}

export interface TechnicalStats {
  serve: number;        // Serve power and accuracy
  forehand: number;     // Forehand groundstroke effectiveness
  backhand: number;     // Backhand groundstroke effectiveness
  volley: number;       // Net play effectiveness
  overhead: number;     // Overhead/smash shots
  dropShot: number;     // Drop shot placement and execution
  slice: number;        // Slice shot effectiveness (defensive shots)
  return: number;       // Return of serve capability
  spin: number;         // Topspin application affecting ball physics
  placement: number;    // Shot placement accuracy and court targeting
}

export interface PhysicalStats {
  speed: number;        // Court movement speed and foot speed
  stamina: number;      // Overall endurance and energy reserves
  strength: number;     // Shot power and physical strength
  agility: number;      // Quick directional changes and balance
  recovery: number;     // Recovery between points, after tough rallies
}

export interface MentalStats {
  focus: number;        // Concentration under pressure and key moments
  anticipation: number; // Reading opponent shots and positioning
  shotVariety: number;  // Tactical shot selection and strategic options
  offensive: number;    // Aggressive play style effectiveness
  defensive: number;    // Defensive play style effectiveness
}

// =======================
// SHOT SYSTEM
// =======================

/**
 * All possible shot types in tennis simulation
 * All shots have forehand and backhand representations except serve and overhead
 */
export type ShotType =
  // Serves (no forehand/backhand distinction)
  | 'serve_first'
  | 'serve_second'

  // Basic groundstrokes
  | 'forehand'
  | 'backhand'

  // Power shots
  | 'forehand_power'
  | 'backhand_power'

  // Approach shots
  | 'forehand_approach'
  | 'backhand_approach'

  // Volleys
  | 'volley_forehand'
  | 'volley_backhand'
  | 'half_volley_forehand'
  | 'half_volley_backhand'

  // Overheads (no forehand/backhand distinction)
  | 'overhead'
  | 'defensive_overhead'

  // Drop shots
  | 'drop_shot_forehand'
  | 'drop_shot_backhand'

  // Angle shots
  | 'angle_shot_forehand'
  | 'angle_shot_backhand'

  // Slice shots
  | 'slice_forehand'
  | 'slice_backhand'
  | 'defensive_slice_forehand'
  | 'defensive_slice_backhand'

  // Returns
  | 'return_forehand'
  | 'return_backhand'
  | 'return_forehand_power'
  | 'return_backhand_power'

  // Lobs
  | 'lob_forehand'
  | 'lob_backhand'

  // Passing shots
  | 'passing_shot_forehand'
  | 'passing_shot_backhand';

/**
 * Context for shot difficulty calculation
 * Note: Ball characteristics (speed, height, time) are tracked in BallQuality
 * Note: Opponent position is passed separately to shot calculator
 */
export interface ShotContext {
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  pressure: 'low' | 'medium' | 'high';
  courtPosition: 'baseline' | 'net' | 'defensive';
  rallyLength: number;
}

// =======================
// SHOT SELECTION SYSTEM
// =======================

/**
 * Court position for both shooter and opponent
 * Unified type that handles positioning on court
 */
export type CourtPosition =
  | 'well_positioned'     // Centered, ready, good coverage
  | 'slightly_off'        // A bit off center or slightly back
  | 'way_out_wide'        // Pushed wide to deuce or ad side
  | 'way_back_deep'       // Pushed behind baseline
  | 'at_net'              // At the net (player or opponent)
  | 'recovering';         // In transition, moving to position

/**
 * Simplified incoming ball characteristics
 * Used to determine shot difficulty and options
 */
export interface BallQuality {
  spin: 'flat' | 'topspin' | 'slice' | 'heavy_topspin';
  timeAvailable: 'plenty' | 'normal' | 'rushed';
  baseQuality: number; // 0-100, combines speed/placement/depth
}

/**
 * Shot preference based on forehand/backhand stat differential
 */
export interface ShotPreference {
  forehandProbability: number; // 0.3-0.7 based on stat differential
  preferredSide: 'forehand' | 'backhand' | 'balanced';
  runAroundBackhand: boolean; // If FH much stronger, run around BH
  strongShotStat: number; // The better stat value
  weakShotStat: number; // The weaker stat value
}

/**
 * Tactical opportunity evaluation from current situation
 */
export interface TacticalOpportunity {
  attackOpportunity: 'none' | 'low' | 'medium' | 'high';
  netApproachSuitable: boolean;
  winnerAttemptSuitable: boolean;
  defensiveRequired: boolean;
  tacticalShotSuitable: boolean; // drop shot, lob, angle
  recommendedAggression: number; // 0-100
}

/**
 * Complete rally state for shot selection
 */
export interface RallyState {
  rallyLength: number;
  lastShotQuality: number; // 0-100 from previous ShotResult
  lastShotType: ShotType;
  shooterPosition: CourtPosition;
  opponentPosition: CourtPosition;
  ballQuality: BallQuality; // Incoming ball characteristics
  matchLevel: number; // Average overallRating of both players, for relative thresholds
}

/**
 * Quality thresholds for determining shot outcomes
 */
export interface QualityThresholds {
  winner: number;         // Quality needed for winner
  inPlay: number;         // Quality needed to succeed
  forcedError: number;    // Below this = forced error (vs unforced)
}

/**
 * Result of a shot attempt
 */
export interface ShotResult {
  success: boolean;
  outcome: PointType;
  quality: number; // 0-100
  shotType: ShotType;
  statUsed: keyof PlayerStats['technical'] | keyof PlayerStats['physical'] | keyof PlayerStats['mental'];
  modifiers: ShotModifiers;
  thresholds?: QualityThresholds;
  /** Sigmoid probabilities at time of outcome determination (for debugging) */
  outcomeProbabilities?: {
    winner?: number;
    inPlay?: number;
    forcedError?: number;
    ace?: number;
    serveIn?: number;
  };
}

/**
 * Modifiers applied to shot calculation
 */
export interface ShotModifiers {
  spinBonus: number;
  placementBonus: number;
  physicalModifier: number;
  mentalModifier: number;
  difficultyModifier: number;
  pressureModifier: number;
  rallyLengthModifier: number;
  finalAdjustment: number;
  serveVariance?: number;   // Serve-specific variance applied
  returnVariance?: number;  // Return-specific variance applied
  rallyVariance?: number;   // Rally-specific variance applied (based on incoming shot quality)
  fatigueModifier: number;   // Match-level fatigue penalty (1.0 = fresh, 0.8 = exhausted)
  momentumModifier: number;  // Momentum quality modifier (0.95 to 1.05)
}

// =======================
// POINT SIMULATION
// =======================

/**
 * Detailed information about a single shot in a point
 */
export interface ShotDetail {
  shotType: ShotType;
  shooter: 'server' | 'returner';
  success: boolean;
  quality: number;
  outcome: PointType;
  errorType?: 'forced' | 'unforced'; // Deprecated: use outcome instead
  statUsed: string;
  modifiers: ShotModifiers;
  timestamp: number;
  shotNumber: number;
  context: ShotContext;
  thresholds?: QualityThresholds; // NEW: for transparency and match analysis
}

export enum PointType {
  ACE = 'ace',
  WINNER = 'winner',
  FORCED_ERROR = 'forced_error',
  UNFORCED_ERROR = 'unforced_error',
  DOUBLE_FAULT = 'double_fault',
  FAULT = 'fault', // Serve fault (first or second serve that doesn't end the point)
  IN_PLAY = 'in_play'
}

/**
 * Result of simulating a single point
 */
export interface PointResult {
  server: 'player' | 'opponent';
  winner: 'server' | 'returner';
  shots: ShotDetail[];
  rallyLength: number;
  keyShot?: ShotDetail; // The decisive shot
  pointType: PointType;
  duration: number; // seconds
  statistics: PointStatistics;
  serveType: 'first' | 'second'; // Which serve started the rally (if second, first was a fault)
}

/**
 * Statistics for a single point
 */
export interface PointStatistics {
  totalShots: number;
  winnerCount: number;
  errorCount: number;
  netApproaches: number;
  rallyExchanges: number;
  pressureMoments: number;
  dominantShot?: ShotType;
}

// =======================
// TENNIS SCORING
// =======================

/**
 * Tennis game score (within a set)
 */
export interface GameScore {
  server: number;    // Points won by server in current game
  returner: number;  // Points won by returner in current game
  advantage?: 'server' | 'returner' | null;
  isDeuce: boolean;
}

/**
 * Tennis set score
 */
export interface SetScore {
  player: number;    // Games won by player in current set
  opponent: number;  // Games won by opponent in current set
  tiebreak?: TiebreakScore;
  winner?: 'player' | 'opponent';
  isComplete: boolean;
}

/**
 * Tiebreak scoring (if implemented)
 */
export interface TiebreakScore {
  server: number;
  returner: number;
  winner?: 'server' | 'returner';
}

/**
 * Complete match score
 */
export interface MatchScore {
  sets: SetScore[];
  currentGame: GameScore;
  currentServer: 'player' | 'opponent';
  isMatchComplete: boolean;
  winner?: 'player' | 'opponent';
  matchFormat: MatchFormat;
}

/**
 * Match format configuration
 */
export interface MatchFormat {
  bestOfSets: number; // 1, 3, or 5
  gamesPerSet: number; // Usually 6
  enableTiebreaks: boolean;
  tiebreakAt: number; // Usually 6-6
}

// =======================
// MATCH SIMULATION
// =======================

/**
 * Current state of the match
 */
/** Per-player fatigue state tracked across the match (0 = fresh, 100 = exhausted) */
export interface PlayerMatchFatigue {
  player: number;
  opponent: number;
}

export interface MatchState {
  score: MatchScore;
  currentServer: 'player' | 'opponent';
  courtSurface: CourtSurface;
  momentum: number; // -100 to +100 (positive favors player)
  pressure: 'low' | 'medium' | 'high';
  matchLength: number; // minutes elapsed
  pointsPlayed: number;
  isKeyMoment: boolean;
  fatigue: PlayerMatchFatigue;
}

/**
 * Court surface types
 */
export type CourtSurface = 'hard' | 'clay' | 'grass' | 'carpet';

/**
 * Complete match simulation result
 */
export interface MatchResult {
  matchId: string;
  winner: 'player' | 'opponent';
  finalScore: string;
  duration: number; // minutes
  courtSurface: CourtSurface;

  // Detailed data
  pointResults: PointResult[];
  scoreProgression: ScoreSnapshot[];
  statistics: MatchStatistics;

  // Performance analysis
  playerPerformance: PlayerPerformance;
  opponentPerformance: PlayerPerformance;

  // Match summary
  summary: MatchSummary;
}

/**
 * Score at a specific moment in time
 */
export interface ScoreSnapshot {
  timestamp: number;
  gameScore: GameScore;
  setScore: SetScore;
  currentServer: 'player' | 'opponent';
  momentum: number;
}

/**
 * Comprehensive match data for rally analysis by sub-agent
 * Includes all shots, contexts, player stats, and outcomes
 */
export interface MatchAnalysisData {
  // Match metadata
  matchId: string;
  timestamp: number;
  courtSurface: CourtSurface;
  matchFormat: MatchFormat;

  // Player information
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

  // Match outcome
  winner: 'player' | 'opponent';
  finalScore: string;
  duration: number;

  // Complete point-by-point data
  points: PointAnalysisData[];

  // Aggregate statistics
  statistics: MatchStatistics;

  // Score progression
  scoreProgression: ScoreSnapshot[];
}

/**
 * Detailed data for a single point including all shots and context
 */
export interface PointAnalysisData {
  pointNumber: number;
  server: 'player' | 'opponent';
  winner: 'player' | 'opponent';
  pointType: PointType;
  serveType: 'first' | 'second';
  rallyLength: number;
  duration: number;

  // All shots in this point
  shots: ShotDetail[];

  // Key shot that decided the point
  keyShot?: ShotDetail;

  // Point statistics
  statistics?: PointStatistics;

  // Match state when point started
  matchState: {
    pressure: 'low' | 'medium' | 'high';
    momentum: number;
    isKeyMoment: boolean;
    gameScore: GameScore;
    setScore: SetScore;
  };
}

// =======================
// STATISTICS & ANALYTICS
// =======================

/**
 * Complete match statistics
 */
export interface MatchStatistics {
  // Basic totals
  totalPoints: { player: number; opponent: number };
  pointsWon: {
    player: { serve: number; return: number };
    opponent: { serve: number; return: number };
  };

  // Shot breakdown
  winners: { player: number; opponent: number };
  errors: { player: number; opponent: number };
  unforcedErrors: { player: number; opponent: number };
  forcedErrors: { player: number; opponent: number };
  aces: { player: number; opponent: number };
  doubleFaults: { player: number; opponent: number };

  // Service statistics
  firstServePercentage: { player: number; opponent: number };
  secondServePercentage: { player: number; opponent: number };
  firstServePointsWon: { player: number; opponent: number };
  secondServePointsWon: { player: number; opponent: number };
  breakPointOpportunities: { player: number; opponent: number };
  breakPointsConverted: { player: number; opponent: number };

  // Rally statistics
  averageRallyLength: number;
  longestRally: number;
  averageRallyLengthWon: { player: number; opponent: number };
  longestRallyWon: { player: number; opponent: number };
  netPointsWon: { player: number; opponent: number };

  // Rally points where the rally extended beyond serve + return (shot count > 2)
  rallyPointsPlayed: { player: number; opponent: number };
  rallyPointsWon: { player: number; opponent: number };

  // Shot type breakdown
  shotTypeStats: {
    [K in ShotType]?: {
      attempts: { player: number; opponent: number };
      successful: { player: number; opponent: number };
      winners: { player: number; opponent: number };
      errors: { player: number; opponent: number };
      unforcedErrors: { player: number; opponent: number };
      forcedErrors: { player: number; opponent: number };
    };
  };

  // Performance correlation
  statCorrelation: {
    [statName: string]: {
      expectedPerformance: number;
      actualPerformance: number;
      correlation: number; // -1 to 1
    };
  };

  // Key moments (interactive decision points)
  keyMomentsWon: { player: number; opponent: number };

  // Comeback tracking - largest game deficit the player faced
  largestDeficit?: {
    games: string;        // Set score at worst moment, e.g., "1-4"
    gameScore?: string;   // Game score if facing game point, e.g., "0-40"
    deficitSize: number;  // How many games behind (2+)
  };
}

/**
 * Individual player performance in match
 */
export interface PlayerPerformance {
  overallRating: number; // 0-100

  // Stat category performance
  technicalPerformance: number;
  physicalPerformance: number;
  mentalPerformance: number;

  // Specific stat effectiveness
  statEffectiveness: {
    [K in keyof PlayerStats['technical']]: number;
  } & {
    [K in keyof PlayerStats['physical']]: number;
  } & {
    [K in keyof PlayerStats['mental']]: number;
  };

  // Situational performance
  pressurePointsWon: number;
  longRallySuccess: number;
  netPlaySuccess: number;

  // Key moments
  bigPointsConverted: number;
  clutchPerformance: number;
}

/**
 * High-level match summary
 */
export interface MatchSummary {
  outcome: 'win' | 'loss';
  competitiveness: 'dominant' | 'comfortable' | 'close' | 'very_close';
  keyFactor: 'serving' | 'returning' | 'consistency' | 'power' | 'pressure' | 'fitness';
  bestStat: string;
  worstStat: string;
  recommendations: string[];
  highlights: string[];
}

// =======================
// PLAYER PROFILE
// =======================

/**
 * Complete player profile
 */
export interface PlayerProfile {
  id: string;
  name: string;
  stats: PlayerStats;

  // Current condition
  energy: number; // 0-100

  // Experience
  level: number;
  experience: number;
  matchesPlayed: number;
  matchesWon: number;

  // Computed properties
  overallRating: number;
  playStyle: PlayStyle;
  preferredSurface: CourtSurface;
}

/**
 * Play style derived from stats
 */
export interface PlayStyle {
  type: 'aggressive' | 'defensive' | 'all_court' | 'serve_volley' | 'counterpuncher';
  aggression: number; // 0-100
  netApproach: number; // 0-100
  consistency: number; // 0-100
  power: number; // 0-100
  description: string;
}

// =======================
// TRAINING SYSTEM
// =======================

/**
 * Training session result
 */
export interface TrainingResult {
  type: 'training';
  timestamp: string;

  // Training details
  trainingType: string;
  trainingName: string;
  sessionTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  // Costs and effects
  energyCost: number;
  timeSlotsUsed: number;

  // Stat improvements
  statBoosts: Partial<PlayerStats['technical'] & PlayerStats['physical'] & PlayerStats['mental']>;

  // Additional effects
  efficiency: number; // 0-100
  moodResult: number; // Effect on player mood
  abilityGained?: string;
  abilityLevel?: number;
  tierModification?: 'promoted' | 'demoted';
}

// =======================
// UTILITY TYPES
// =======================

/**
 * All possible stat names for easy reference
 */
export type StatName =
  | keyof TechnicalStats
  | keyof PhysicalStats
  | keyof MentalStats;

/**
 * Stat category types
 */
export type StatCategory = 'technical' | 'physical' | 'mental';

/**
 * Generic result type for operations
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}