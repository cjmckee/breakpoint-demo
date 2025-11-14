/**
 * Key Moment Resolver
 * Handles calculating success probability and resolving key moment outcomes
 * Based on player stats vs opponent stats
 */

import { TacticalOption } from '../data/tacticalOptions';
import { PlayerStats } from '../types/game';

export type OutcomeType = 'critical-success' | 'success' | 'failure' | 'critical-failure';

export interface KeyMomentResult {
  outcome: OutcomeType;
  roll: number; // 0-100
  threshold: number; // Success threshold
  playerScore: number; // Weighted player stat
  opponentScore: number; // Weighted opponent stat
  baseProbability: number; // Base success chance
  finalProbability: number; // After modifiers
  pointWinner: 'player' | 'opponent';
  shotOutcome: {
    outcome: string; // 'winner', 'ace', 'error', etc.
    shotType: string; // 'serve', 'forehand', etc.
    shooter: 'player' | 'opponent';
  };
}

export interface KeyMomentContext {
  mood: number; // -100 to 100
  pressure: number; // 0-100
  momentum: number; // -100 to 100
  energy: number; // 0-100
}

export class KeyMomentResolver {
  /**
   * Calculate success probability for a tactical option
   */
  static calculateSuccessProbability(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption,
    context?: Partial<KeyMomentContext>
  ): number {
    // Calculate weighted player stat
    const playerScore = this.calculateWeightedStat(
      playerStats,
      option.playerStatWeights
    );

    // Calculate weighted opponent stat
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      option.opponentStatWeights
    );

    // Base probability calculation
    // Formula: 30 + (playerScore - opponentScore) * 0.4
    // This gives a range of roughly 10-90% based on stat differential
    const differential = playerScore - opponentScore;
    let baseProbability = 30 + differential * 0.4;

    // Apply context modifiers if provided
    if (context) {
      baseProbability = this.applyContextModifiers(baseProbability, context);
    }

    // Clamp between 5% and 95% (never impossible, never guaranteed)
    return Math.max(5, Math.min(95, baseProbability));
  }

  /**
   * Resolve a key moment with a tactical choice
   */
  static resolveKeyMoment(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption,
    context?: Partial<KeyMomentContext>
  ): KeyMomentResult {
    // Calculate success probability
    const playerScore = this.calculateWeightedStat(
      playerStats,
      option.playerStatWeights
    );
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      option.opponentStatWeights
    );
    const baseProbability = this.calculateSuccessProbability(
      playerStats,
      opponentStats,
      option,
      context
    );
    const finalProbability = baseProbability;

    // Roll for outcome (0-100)
    const roll = Math.random() * 100;

    // Determine outcome type
    let outcome: OutcomeType;
    let shotOutcome;
    let pointWinner: 'player' | 'opponent';

    if (roll <= 10) {
      // Critical failure (10% chance)
      outcome = 'critical-failure';
      shotOutcome = option.shotOutcomes.failure;
      pointWinner = 'opponent';
    } else if (roll <= finalProbability) {
      // Success
      if (roll <= finalProbability * 0.1) {
        // Critical success (10% of success rolls)
        outcome = 'critical-success';
      } else {
        outcome = 'success';
      }
      shotOutcome = option.shotOutcomes.success;
      pointWinner = 'player';
    } else if (roll >= 90) {
      // Critical failure at high end (10% chance)
      outcome = 'critical-failure';
      shotOutcome = option.shotOutcomes.failure;
      pointWinner = 'opponent';
    } else {
      // Regular failure
      outcome = 'failure';
      shotOutcome = option.shotOutcomes.failure;
      pointWinner = 'opponent';
    }

    return {
      outcome,
      roll,
      threshold: finalProbability,
      playerScore,
      opponentScore,
      baseProbability,
      finalProbability,
      pointWinner,
      shotOutcome,
    };
  }

  /**
   * Calculate weighted stat value from stat weights
   */
  private static calculateWeightedStat(
    stats: PlayerStats,
    weights: {
      primary: string;
      primaryWeight: number;
      secondary: Array<{ stat: string; weight: number }>;
    }
  ): number {
    // Get primary stat value
    const primaryValue = this.getStatValue(stats, weights.primary);
    let total = primaryValue * weights.primaryWeight;
    let totalWeight = weights.primaryWeight;

    // Add secondary stats
    for (const { stat, weight } of weights.secondary) {
      const value = this.getStatValue(stats, stat);
      total += value * weight;
      totalWeight += weight;
    }

    // Return weighted average
    return totalWeight > 0 ? total / totalWeight : 0;
  }

  /**
   * Get stat value by name (case-insensitive, handles camelCase/snake_case)
   */
  private static getStatValue(stats: PlayerStats, statName: string): number {
    // Normalize stat name (handle both camelCase and snake_case)
    const normalizedName = statName.toLowerCase().replace(/_/g, '');

    // Try exact match first
    if (statName in stats) {
      const value = (stats as any)[statName];
      return typeof value === 'number' ? value : 0;
    }

    // Try case-insensitive match
    for (const key of Object.keys(stats)) {
      if (key.toLowerCase().replace(/_/g, '') === normalizedName) {
        const value = (stats as any)[key];
        return typeof value === 'number' ? value : 0;
      }
    }

    // Stat not found
    console.warn(`Stat "${statName}" not found in PlayerStats`);
    return 0;
  }

  /**
   * Apply context modifiers to base probability
   */
  private static applyContextModifiers(
    baseProbability: number,
    context: Partial<KeyMomentContext>
  ): number {
    let modified = baseProbability;

    // Mood effect (-10 to +10)
    if (context.mood !== undefined) {
      const moodModifier = (context.mood / 100) * 10; // -10 to +10
      modified += moodModifier;
    }

    // Pressure effect (-5 to 0)
    // High pressure makes it harder
    if (context.pressure !== undefined) {
      const pressureModifier = -(context.pressure / 100) * 5; // -5 to 0
      modified += pressureModifier;
    }

    // Momentum effect (-5 to +5)
    if (context.momentum !== undefined) {
      const momentumModifier = (context.momentum / 100) * 5; // -5 to +5
      modified += momentumModifier;
    }

    // Energy effect (-10 to 0)
    // Low energy makes it harder
    if (context.energy !== undefined) {
      const energyPercent = context.energy / 100;
      if (energyPercent < 0.5) {
        const energyModifier = (energyPercent - 0.5) * 20; // -10 to 0
        modified += energyModifier;
      }
    }

    return modified;
  }

  /**
   * Get outcome description for UI
   */
  static getOutcomeDescription(result: KeyMomentResult): string {
    const { outcome, shotOutcome } = result;

    switch (outcome) {
      case 'critical-success':
        return `🌟 INCREDIBLE! ${this.formatShotOutcome(shotOutcome)}`;
      case 'success':
        return `✅ ${this.formatShotOutcome(shotOutcome)}`;
      case 'failure':
        return `❌ ${this.formatShotOutcome(shotOutcome)}`;
      case 'critical-failure':
        return `💥 DISASTER! ${this.formatShotOutcome(shotOutcome)}`;
    }
  }

  /**
   * Format shot outcome for display
   */
  private static formatShotOutcome(shotOutcome: {
    outcome: string;
    shotType: string;
    shooter: 'player' | 'opponent';
  }): string {
    const subject = shotOutcome.shooter === 'player' ? 'You' : 'Opponent';
    const action = shotOutcome.outcome.replace(/_/g, ' ');
    const shot = shotOutcome.shotType.replace(/_/g, ' ');

    return `${subject} ${action} on ${shot}`;
  }

  /**
   * Get outcome emoji for UI
   */
  static getOutcomeEmoji(outcome: OutcomeType): string {
    switch (outcome) {
      case 'critical-success':
        return '🌟';
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'critical-failure':
        return '💥';
    }
  }

  /**
   * Get outcome color for UI
   */
  static getOutcomeColor(outcome: OutcomeType): string {
    switch (outcome) {
      case 'critical-success':
        return '#FFD700'; // gold
      case 'success':
        return '#10B981'; // green
      case 'failure':
        return '#EF4444'; // red
      case 'critical-failure':
        return '#DC2626'; // dark red
    }
  }
}
