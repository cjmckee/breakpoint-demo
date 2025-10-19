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
  drop_shot: number;    // Drop shot placement and execution
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
  shot_variety: number; // Tactical shot selection and strategic options
  offensive: number;    // Aggressive play style effectiveness
  defensive: number;    // Defensive play style effectiveness
}

// =======================
// SHOT SYSTEM
// =======================

/**
 * All possible shot types in tennis simulation
 */
export type ShotType =
  | 'serve_first'
  | 'serve_second'
  | 'forehand'
  | 'backhand'
  | 'forehand_winner'
  | 'backhand_winner'
  | 'forehand_approach'
  | 'backhand_approach'
  | 'volley_forehand'
  | 'volley_backhand'
  | 'half_volley'
  | 'overhead'
  | 'defensive_overhead'
  | 'drop_shot'
  | 'short_angle'
  | 'slice_forehand'
  | 'slice_backhand'
  | 'defensive_slice'
  | 'return_forehand'
  | 'return_backhand'
  | 'return_winner'
  | 'topspin_forehand'
  | 'topspin_backhand'
  | 'kick_serve'
  | 'angle_shot'
  | 'down_the_line'
  | 'cross_court'
  | 'lob'
  | 'passing_shot';

/**
 * Context for shot difficulty calculation
 */
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

/**
 * Result of a shot attempt
 */
export interface ShotResult {
  success: boolean;
  outcome: 'winner' | 'in_play' | 'error';
  quality: number; // 0-100
  shotType: ShotType;
  statUsed: keyof PlayerStats['technical'] | keyof PlayerStats['physical'] | keyof PlayerStats['mental'];
  modifiers: ShotModifiers;
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
  outcome: 'winner' | 'in_play' | 'error';
  statUsed: string;
  modifiers: ShotModifiers;
  timestamp: number;
  shotNumber: number;
  context: ShotContext;
}

/**
 * Result of simulating a single point
 */
export interface PointResult {
  winner: 'server' | 'returner';
  shots: ShotDetail[];
  rallyLength: number;
  keyShot?: ShotDetail; // The decisive shot
  pointType: 'ace' | 'winner' | 'forced_error' | 'unforced_error' | 'double_fault';
  duration: number; // seconds
  statistics: PointStatistics;
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
  server: number;    // Games won by server in current set
  returner: number;  // Games won by returner in current set
  tiebreak?: TiebreakScore;
  winner?: 'server' | 'returner';
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
export interface MatchState {
  score: MatchScore;
  currentServer: 'player' | 'opponent';
  courtSurface: CourtSurface;
  momentum: number; // -100 to +100 (positive favors player)
  pressure: 'low' | 'medium' | 'high';
  matchLength: number; // minutes elapsed
  pointsPlayed: number;
  isKeyMoment: boolean;
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
  aces: { player: number; opponent: number };
  doubleFaults: { player: number; opponent: number };

  // Service statistics
  firstServePercentage: { player: number; opponent: number };
  firstServePointsWon: { player: number; opponent: number };
  secondServePointsWon: { player: number; opponent: number };
  breakPointsConverted: { player: number; opponent: number };

  // Rally statistics
  averageRallyLength: number;
  longestRally: number;
  netPointsWon: { player: number; opponent: number };

  // Shot type breakdown
  shotTypeStats: {
    [K in ShotType]?: {
      attempts: { player: number; opponent: number };
      successful: { player: number; opponent: number };
      winners: { player: number; opponent: number };
      errors: { player: number; opponent: number };
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
  form: number; // 0-100 (recent performance)
  confidence: number; // 0-100

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