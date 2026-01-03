/**
 * Challenge Manager
 * Pure business logic for the challenge system
 */

import type { Player, GameCalendar } from '../types/game';
import type {
  Challenge,
  ChallengeRequirement,
  ChallengeProgress,
  ChallengeReward,
  RequirementProgress,
  StatThresholdProgress,
  MatchStatProgress,
  AbilityUnlockProgress,
  MatchCountProgress,
  RelationshipLevelProgress,
} from '../types/challenges';
import type { PlayerStats } from '../types';
import { PlayerManager } from './PlayerManager';

export class ChallengeManager {
  /**
   * Create a new challenge
   */
  static createChallenge(config: {
    id: string;
    name: string;
    description: string;
    requirements: ChallengeRequirement[];
    reward: ChallengeReward;
    source?: Challenge['source'];
  }): Challenge {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      requirements: config.requirements,
      reward: config.reward,
      status: 'active',
      progress: {
        requirementProgress: [],
        isComplete: false,
        completionPercentage: 0,
      },
      assignedAt: new Date().toISOString(),
      source: config.source,
    };
  }

  /**
   * Check if a specific requirement is met
   */
  static checkRequirement(
    requirement: ChallengeRequirement,
    player: Player,
    gameState: {
      relationships: Record<string, number>;
      calendar: GameCalendar;
      matchStats?: {
        aces?: number;
        winners?: number;
        longRallies?: number;
        netPoints?: number;
        breakPoints?: number;
      };
    }
  ): boolean {
    switch (requirement.type) {
      case 'statThreshold': {
        const statValue = this.getStatValue(player.stats, requirement.statName);
        return statValue >= requirement.targetValue;
      }

      case 'matchStat': {
        if (!gameState.matchStats) return false;
        const currentCount = gameState.matchStats[requirement.matchStatType] || 0;
        return currentCount >= requirement.targetCount;
      }

      case 'abilityUnlock': {
        return player.abilities.some((ability) => ability.name === requirement.abilityName);
      }

      case 'matchCount': {
        const matchesWon = player.matchesWon || 0;
        return matchesWon >= requirement.targetWins;
      }

      case 'relationshipLevel': {
        const currentLevel = gameState.relationships[requirement.characterId] || 0;
        return currentLevel >= requirement.targetLevel;
      }

      default:
        return false;
    }
  }

  /**
   * Calculate progress for a specific requirement
   */
  static calculateRequirementProgress(
    requirement: ChallengeRequirement,
    player: Player,
    gameState: {
      relationships: Record<string, number>;
      calendar: GameCalendar;
      matchStats?: {
        aces?: number;
        winners?: number;
        longRallies?: number;
        netPoints?: number;
        breakPoints?: number;
      };
    }
  ): RequirementProgress {
    switch (requirement.type) {
      case 'statThreshold': {
        const currentValue = this.getStatValue(player.stats, requirement.statName);
        const percentage = Math.min(100, (currentValue / requirement.targetValue) * 100);
        const progress: StatThresholdProgress = {
          currentValue,
          targetValue: requirement.targetValue,
          percentage,
        };
        return { type: 'statThreshold', progress };
      }

      case 'matchStat': {
        const currentCount = gameState.matchStats?.[requirement.matchStatType] || 0;
        const percentage = Math.min(100, (currentCount / requirement.targetCount) * 100);
        const progress: MatchStatProgress = {
          currentCount,
          targetCount: requirement.targetCount,
          percentage,
        };
        return { type: 'matchStat', progress };
      }

      case 'abilityUnlock': {
        const hasAbility = player.abilities.some((ability) => ability.name === requirement.abilityName);
        const progress: AbilityUnlockProgress = {
          hasAbility,
        };
        return { type: 'abilityUnlock', progress };
      }

      case 'matchCount': {
        const currentWins = player.matchesWon || 0;
        const percentage = Math.min(100, (currentWins / requirement.targetWins) * 100);
        const progress: MatchCountProgress = {
          currentWins,
          targetWins: requirement.targetWins,
          percentage,
        };
        return { type: 'matchCount', progress };
      }

      case 'relationshipLevel': {
        const currentLevel = gameState.relationships[requirement.characterId] || 0;
        const percentage = Math.min(100, (currentLevel / requirement.targetLevel) * 100);
        const progress: RelationshipLevelProgress = {
          currentLevel,
          targetLevel: requirement.targetLevel,
          percentage,
        };
        return { type: 'relationshipLevel', progress };
      }

      default:
        throw new Error(`Unknown requirement type: ${(requirement as any).type}`);
    }
  }

  /**
   * Update progress for a challenge
   */
  static updateProgress(
    challenge: Challenge,
    player: Player,
    gameState: {
      relationships: Record<string, number>;
      calendar: GameCalendar;
      matchStats?: {
        aces?: number;
        winners?: number;
        longRallies?: number;
        netPoints?: number;
        breakPoints?: number;
      };
    }
  ): ChallengeProgress {
    // Calculate progress for each requirement
    const requirementProgress = challenge.requirements.map((req) =>
      this.calculateRequirementProgress(req, player, gameState)
    );

    // Check if all requirements are met
    const allMet = challenge.requirements.every((req) =>
      this.checkRequirement(req, player, gameState)
    );

    // Calculate overall completion percentage
    const totalPercentage = requirementProgress.reduce((sum, rp) => {
      switch (rp.type) {
        case 'statThreshold':
        case 'matchStat':
        case 'matchCount':
        case 'relationshipLevel':
          return sum + rp.progress.percentage;
        case 'abilityUnlock':
          return sum + (rp.progress.hasAbility ? 100 : 0);
        default:
          return sum;
      }
    }, 0);
    const completionPercentage = totalPercentage / challenge.requirements.length;

    return {
      requirementProgress,
      isComplete: allMet,
      completionPercentage,
    };
  }

  /**
   * Check if a challenge is complete
   */
  static isComplete(challenge: Challenge): boolean {
    return challenge.progress.isComplete;
  }

  /**
   * Apply challenge rewards to player
   */
  static applyRewards(challenge: Challenge, player: Player): Player {
    let updatedPlayer = { ...player };

    // Apply stat boosts from modifiers
    if (challenge.reward.modifiers?.statBoosts) {
      updatedPlayer = PlayerManager.applyStatBoosts(updatedPlayer, challenge.reward.modifiers.statBoosts);
    }

    // Grant abilities
    if (challenge.reward.abilities) {
      for (const abilityName of challenge.reward.abilities) {
        updatedPlayer = PlayerManager.addAbility(updatedPlayer, abilityName);
      }
    }

    // Grant items
    if (challenge.reward.items) {
      const { ItemManager } = require('./ItemManager');
      for (const item of challenge.reward.items) {
        updatedPlayer = ItemManager.addItem(updatedPlayer, item);
      }
    }

    // Grant experience
    if (challenge.reward.experience) {
      updatedPlayer = {
        ...updatedPlayer,
        experience: updatedPlayer.experience + challenge.reward.experience,
      };
    }

    return updatedPlayer;
  }

  /**
   * Helper to get stat value from nested PlayerStats structure
   */
  private static getStatValue(stats: PlayerStats, statName: string): number {
    if (statName in stats.technical) {
      return stats.technical[statName as keyof typeof stats.technical];
    }
    if (statName in stats.physical) {
      return stats.physical[statName as keyof typeof stats.physical];
    }
    if (statName in stats.mental) {
      return stats.mental[statName as keyof typeof stats.mental];
    }
    return 0;
  }
}
