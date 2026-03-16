/**
 * Key Moment Type Definitions
 * Integration layer between match engine and key moment system
 */

import { TacticalOption, KeyMomentType } from '../data/tacticalOptions';
import { KeyMomentResult } from '../game/KeyMomentResolver';
import { Ability, StatBoosts } from './game';
import { MatchStatistics } from './index';
import type { ArchetypeType } from '../data/archetypes';

/**
 * Key Moment Data
 * Represents a pause in the match for user decision
 */
export interface KeyMoment {
  id: string;
  type: KeyMomentType;
  situation: string; // e.g., "Break Point - 30-40"
  description: string; // Context description
  options: TacticalOption[]; // Available choices
  timestamp: number;
  opponentArchetype: ArchetypeType; // Opponent's play style archetype
  matchContext: {
    score: string; // Current score
    server: 'player' | 'opponent';
    momentum: number;
    pressure: number;
    energy: number;
    mood: number;
  };
}

/**
 * Key Moment Choice
 * User's selected option
 */
export interface KeyMomentChoice {
  keyMomentId: string;
  selectedOption: TacticalOption;
  timestamp: number;
}

/**
 * Key Moment Outcome
 * Result after resolving the choice
 */
export interface KeyMomentOutcome {
  keyMomentId: string;
  choice: KeyMomentChoice;
  result: KeyMomentResult;
  pointWon: boolean; // Did player win the point
  timestamp: number;
}

/**
 * Callback for when a key moment occurs
 * Returns a Promise that resolves when user makes a choice
 */
export type KeyMomentCallback = (keyMoment: KeyMoment) => Promise<TacticalOption>;

/**
 * Callback for score updates during match
 */
export type ScoreUpdateCallback = (score: MatchScore) => void;

/**
 * Callback for statistics updates during match
 */
export type StatsUpdateCallback = (stats: MatchStatistics) => void;

/**
 * Match score structure
 */
export interface MatchScore {
  sets: Array<{ player: number; opponent: number }>;
  currentSet: { player: number; opponent: number };
  currentGame: { player: number; opponent: number };
  server: 'player' | 'opponent';
  isComplete: boolean;
  winner?: 'player' | 'opponent';
  momentum?: number; // -100 to 100 (positive = player favor)
  energy?: number; // 0-100 current player energy
}

/**
 * Match configuration for interactive matches
 */
export interface InteractiveMatchConfig {
  playerStats: any; // PlayerProfile from core
  opponentStats: any; // PlayerProfile from core
  opponentName?: string; // Opponent's display name
  opponentTier?: number; // Opponent tier (1-4) for reward calculation
  playerAbilities?: Ability[]; // Player abilities to apply during match
  itemBoosts?: StatBoosts; // Stat boosts from equipped/passive items
  surface: 'hard' | 'clay' | 'grass' | 'carpet';

  // Game state context
  mood: number;
  energy: number;

  // Match type
  isTournamentMatch?: boolean; // True if this is a tournament match
  isStoryMatch?: boolean;      // True if this is a story-driven match

  // Callbacks
  onKeyMoment?: KeyMomentCallback;
  onKeyMomentResult?: (result: any) => void; // Called after key moment is resolved
  onScoreUpdate?: ScoreUpdateCallback;
  onStatsUpdate?: StatsUpdateCallback; // Called after each point with current statistics
  onPointComplete?: (result: PointResult) => void;
  onMatchComplete?: (finalScore: MatchScore) => void;

  // Options
  enableKeyMoments: boolean;
  keyMomentsPerMatch?: number; // Default: DEFAULT_KEY_MOMENTS_PER_MATCH
  matchFormat?: 'best-of-1' | 'best-of-3' | 'best-of-5'; // Default: best-of-3
}

/**
 * Point result from match engine
 */
export interface PointResult {
  winner: 'player' | 'opponent';
  outcome: string; // 'winner', 'ace', 'error', etc.
  shotType?: string;
  rallyLength?: number;
}

/**
 * Match state for tracking
 */
export interface MatchState {
  score: MatchScore;
  momentum: number; // -100 to 100 (positive = player favor)
  pressure: number; // 0-100
  keyMomentsTriggered: number;
  pointsPlayed: number;
  isInProgress: boolean;
}
