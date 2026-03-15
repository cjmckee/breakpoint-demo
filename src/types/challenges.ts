/**
 * Challenge System Type Definitions
 * Comprehensive types for player challenges
 */

import type { StatName } from './index';
import type { Modifiers } from './game';
import type { Item } from './items';

// ============================================================================
// CHALLENGE REQUIREMENTS
// ============================================================================

/**
 * Base requirement interface
 */
interface BaseRequirement {
  type: string;
  description: string;
}

/**
 * Stat threshold requirement
 * Complete when player's stat reaches the target value
 */
export interface StatThresholdRequirement extends BaseRequirement {
  type: 'statThreshold';
  statName: StatName;
  targetValue: number;
}

/**
 * Match stat requirement
 * Complete when player achieves X of something during a match
 * (e.g., hit 2 aces, win 3 rally exchanges longer than 10 shots)
 */
export interface MatchStatRequirement extends BaseRequirement {
  type: 'matchStat';
  matchStatType: 'aces' | 'winners' | 'longRallies' | 'netPoints' | 'breakPoints';
  targetCount: number;
  // For accumulated stats across multiple matches
  cumulative?: boolean;
}

/**
 * Ability unlock requirement
 * Complete when player has the specified ability
 */
export interface AbilityUnlockRequirement extends BaseRequirement {
  type: 'abilityUnlock';
  abilityName: string;
}

/**
 * Match count requirement
 * Complete when player wins X matches
 */
export interface MatchCountRequirement extends BaseRequirement {
  type: 'matchCount';
  targetWins: number;
  matchType?: 'friendly' | 'tournament' | 'league'; // Optional filter
}

/**
 * Relationship level requirement
 * Complete when relationship with character reaches target level
 */
export interface RelationshipLevelRequirement extends BaseRequirement {
  type: 'relationshipLevel';
  characterId: string;
  characterName: string;
  targetLevel: number;
}

/**
 * Union of all requirement types
 */
export type ChallengeRequirement =
  | StatThresholdRequirement
  | MatchStatRequirement
  | AbilityUnlockRequirement
  | MatchCountRequirement
  | RelationshipLevelRequirement;

// ============================================================================
// CHALLENGE PROGRESS
// ============================================================================

/**
 * Progress for stat threshold requirement
 */
export interface StatThresholdProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
}

/**
 * Progress for match stat requirement
 */
export interface MatchStatProgress {
  currentCount: number;
  targetCount: number;
  percentage: number;
}

/**
 * Progress for ability unlock requirement
 */
export interface AbilityUnlockProgress {
  hasAbility: boolean;
}

/**
 * Progress for match count requirement
 */
export interface MatchCountProgress {
  currentWins: number;
  targetWins: number;
  percentage: number;
}

/**
 * Progress for relationship level requirement
 */
export interface RelationshipLevelProgress {
  currentLevel: number;
  targetLevel: number;
  percentage: number;
}

/**
 * Progress tracking for a specific requirement
 */
export type RequirementProgress =
  | { type: 'statThreshold'; progress: StatThresholdProgress }
  | { type: 'matchStat'; progress: MatchStatProgress }
  | { type: 'abilityUnlock'; progress: AbilityUnlockProgress }
  | { type: 'matchCount'; progress: MatchCountProgress }
  | { type: 'relationshipLevel'; progress: RelationshipLevelProgress };

/**
 * Overall progress for a challenge
 */
export interface ChallengeProgress {
  requirementProgress: RequirementProgress[];
  isComplete: boolean;
  completionPercentage: number;
}

// ============================================================================
// CHALLENGE REWARDS
// ============================================================================

/**
 * Rewards for completing a challenge
 */
export interface ChallengeReward {
  modifiers?: Modifiers; // Stat boosts and additional effects
  abilities?: string[]; // Ability names to grant
  items?: Item[]; // Items to grant
  relationshipChanges?: Record<string, number>; // Character ID -> change amount
  experience?: number; // XP reward
}

// ============================================================================
// CHALLENGE STATUS
// ============================================================================

/**
 * Challenge completion status
 */
export type ChallengeStatus = 'active' | 'completed' | 'claimed';

// ============================================================================
// MAIN CHALLENGE INTERFACE
// ============================================================================

/**
 * Complete challenge definition
 */
export interface Challenge {
  id: string;
  name: string;
  description: string;

  // Requirements to complete
  requirements: ChallengeRequirement[];

  // Rewards for completion
  reward: ChallengeReward;

  // Current status
  status: ChallengeStatus;

  // Progress tracking
  progress: ChallengeProgress;

  // Metadata
  assignedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  claimedAt?: string; // ISO timestamp

  // Source information (optional)
  source?: {
    type: 'story' | 'automatic' | 'manual';
    eventId?: string; // If from story event
  };
}

// ============================================================================
// CHALLENGE TEMPLATE
// ============================================================================

/**
 * A reusable challenge definition that can be instantiated into a Challenge.
 * Templates define the static configuration; runtime state (status, progress,
 * timestamps) is added when the challenge is created via ChallengeManager.
 */
export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  requirements: ChallengeRequirement[];
  reward: ChallengeReward;
}
