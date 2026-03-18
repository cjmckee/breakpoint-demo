/**
 * Tournament System Type Definitions
 * Defines types for multi-round tournaments with scheduled matches
 */

import type { PlayerStats, OpponentTier, TimeSlot } from './game';

// ============================================================================
// TOURNAMENT BRACKETS & STATUS
// ============================================================================

/**
 * Tournament bracket position
 */
export type TournamentBracket = 'winner' | 'loser';

/**
 * Tournament round status
 */
export type TournamentRoundStatus = 'pending' | 'scheduled' | 'completed' | 'skipped';

// ============================================================================
// TOURNAMENT OPPONENTS
// ============================================================================

/**
 * Tournament opponent configuration
 * Defines a specific character opponent for a tournament match
 */
export interface TournamentOpponent {
  characterId: string;          // Must match CHARACTERS registry
  name: string;                 // Display name
  stats: PlayerStats;           // Full stat profile
  tier: OpponentTier;           // Difficulty tier (1-4)
  description?: string;         // Bio/flavor text
}

// ============================================================================
// TOURNAMENT ROUNDS
// ============================================================================

/**
 * Single tournament round configuration
 * Each round has 4 associated story events based on bracket and outcome
 */
export interface TournamentRound {
  roundNumber: number;          // 1-indexed round number (e.g., 1, 2, 3, 4)
  opponent: TournamentOpponent;

  // Story event triggers (4 per round)
  prematchEventWinner: string;  // Event shown before match if in winner bracket
  prematchEventLoser: string;   // Event shown before match if in loser bracket
  winEventId: string;           // Event shown after winning
  lossEventId: string;          // Event shown after losing
}

// ============================================================================
// TOURNAMENT CONFIGURATION
// ============================================================================

/**
 * Complete tournament configuration
 * Defines an entire tournament structure with variable number of rounds
 */
export interface TournamentConfig {
  id: string;                   // Unique tournament ID (e.g., 'riverside_open')
  name: string;                 // Display name (e.g., 'Riverside Open')
  description: string;          // Tournament description

  // Tournament structure
  rounds: TournamentRound[];    // Array of rounds (flexible length)
  surface: 'hard' | 'clay' | 'grass' | 'carpet';

  // Prerequisites
  minPlayerTier?: OpponentTier;
  minMatchesPlayed?: number;
  requiredEvents?: string[];    // Story events that must be completed

  // Story events
  openingCeremonyEventId: string;  // Guaranteed event at start
  victoryEventId?: string;      // Event when all matches won
  eliminationEventId?: string;  // Event when eliminated (entered loser bracket)
  consolationEventId?: string;  // Event scheduled after tournament ends without winning (fires a few days later)
}

// ============================================================================
// ACTIVE TOURNAMENT STATE
// ============================================================================

/**
 * Active tournament state
 * Tracks player's progress through a tournament
 */
export interface ActiveTournament {
  tournamentId: string;
  tournamentName: string;

  // Bracket tracking
  currentBracket: TournamentBracket;
  currentRound: number;         // 0-based index into rounds array

  // Match tracking
  matchResults: {
    roundNumber: number;
    opponent: string;
    result: 'win' | 'loss';
    score: string;
  }[];

  // State flags
  isActive: boolean;
  isComplete: boolean;
  startedAt: string;            // ISO timestamp
  completedAt?: string;
}

/**
 * Tournament match metadata for ScheduledEvent
 */
export interface TournamentMatchMetadata {
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  opponentId: string;
  opponentName: string;
  bracket: TournamentBracket;
}
