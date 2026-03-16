/**
 * Key Moment Resolver
 * Handles calculating success probability and resolving key moment outcomes.
 * Uses tactical counter system: options are strong/weak against specific archetypes.
 */

import { TacticalOption, SecondaryEffect } from '../data/tacticalOptions';
import type { ArchetypeType } from '../data/archetypes';
import { PointType } from '../types';
import { PlayerStats } from '../types/game';

/** Counter bonus when option is strongAgainst the opponent's archetype */
const COUNTER_BONUS = 15;

/** Penalty when option is weakAgainst the opponent's archetype */
const WEAK_PENALTY = -8;

/** Base chance before stat differential and counter bonuses */
const BASE_CHANCE = 35;

/** How much stat differential affects probability */
const STAT_MULTIPLIER = 0.4;

export type OutcomeType = 'critical-success' | 'success' | 'failure' | 'critical-failure';

export interface AppliedEffect {
  type: SecondaryEffect['type'];
  value: number; // Final value after critical multiplier
}

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
    outcome: PointType;
    shotType: string;
    shooter: 'player' | 'opponent';
  };
  appliedEffects: AppliedEffect[]; // Secondary effects that were applied
  isCounter: boolean; // Was this option strong against the opponent?
  isWeakChoice: boolean; // Was this option weak against the opponent?
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
    opponentArchetype: ArchetypeType,
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

    // Base probability with stat differential
    const differential = playerScore - opponentScore;
    let probability = BASE_CHANCE + (differential * STAT_MULTIPLIER);

    // Apply counter bonuses
    if (option.strongAgainst.includes(opponentArchetype)) {
      probability += COUNTER_BONUS;
    }
    if (option.weakAgainst.includes(opponentArchetype)) {
      probability += WEAK_PENALTY;
    }

    // Apply context modifiers if provided
    if (context) {
      probability = this.applyContextModifiers(probability, context);
    }

    // Clamp between 10% and 90%
    return Math.max(10, Math.min(90, probability));
  }

  /**
   * Resolve a key moment with a tactical choice
   */
  static resolveKeyMoment(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption,
    opponentArchetype: ArchetypeType,
    context?: Partial<KeyMomentContext>
  ): KeyMomentResult {
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
      opponentArchetype,
      context
    );
    const finalProbability = baseProbability;

    const isCounter = option.strongAgainst.includes(opponentArchetype);
    const isWeakChoice = option.weakAgainst.includes(opponentArchetype);

    // Roll for outcome (0-100)
    const roll = Math.random() * 100;

    // Calculate critical ranges
    const critSuccessRange = 10 + (finalProbability * 0.1);
    const critFailureRange = 10 + ((100 - finalProbability) * 0.1);
    const critFailureThreshold = 100 - critFailureRange;

    // Determine outcome type
    let outcome: OutcomeType;
    let shotOutcome;
    let pointWinner: 'player' | 'opponent';

    if (roll <= critSuccessRange) {
      outcome = 'critical-success';
      shotOutcome = option.shotOutcomes.success;
      pointWinner = 'player';
    } else if (roll >= critFailureThreshold) {
      outcome = 'critical-failure';
      shotOutcome = option.shotOutcomes.failure;
      pointWinner = 'opponent';
    } else if (roll <= finalProbability) {
      outcome = 'success';
      shotOutcome = option.shotOutcomes.success;
      pointWinner = 'player';
    } else {
      outcome = 'failure';
      shotOutcome = option.shotOutcomes.failure;
      pointWinner = 'opponent';
    }

    // Resolve secondary effects
    const appliedEffects = this.resolveSecondaryEffects(option, outcome);

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
      appliedEffects,
      isCounter,
      isWeakChoice,
    };
  }

  /**
   * Resolve secondary effects based on outcome.
   * Critical outcomes double effect values.
   */
  static resolveSecondaryEffects(
    option: TacticalOption,
    outcome: OutcomeType
  ): AppliedEffect[] {
    const isSuccess = outcome === 'success' || outcome === 'critical-success';
    const isCritical = outcome === 'critical-success' || outcome === 'critical-failure';
    const multiplier = isCritical ? 2 : 1;

    const effects: AppliedEffect[] = [];

    for (const effect of option.secondaryEffects) {
      let shouldApply = false;

      switch (effect.condition) {
        case 'always':
          shouldApply = true;
          break;
        case 'on_success':
          shouldApply = isSuccess;
          break;
        case 'on_failure':
          shouldApply = !isSuccess;
          break;
      }

      if (shouldApply) {
        effects.push({
          type: effect.type,
          value: effect.value * multiplier,
        });
      }
    }

    return effects;
  }

  /**
   * Get qualitative stat matchup indicator for UI.
   * Returns 'advantage' | 'even' | 'disadvantage' based on stat differential.
   */
  static getStatMatchup(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption
  ): 'advantage' | 'even' | 'disadvantage' {
    const playerScore = this.calculateWeightedStat(playerStats, option.playerStatWeights);
    const opponentScore = this.calculateWeightedStat(opponentStats, option.opponentStatWeights);
    const diff = playerScore - opponentScore;

    if (diff > 10) return 'advantage';
    if (diff < -10) return 'disadvantage';
    return 'even';
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
    const primaryValue = this.getStatValue(stats, weights.primary);
    let total = primaryValue * weights.primaryWeight;
    let totalWeight = weights.primaryWeight;

    for (const { stat, weight } of weights.secondary) {
      const value = this.getStatValue(stats, stat);
      total += value * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? total / totalWeight : 0;
  }

  /**
   * Get stat value by name
   */
  private static getStatValue(stats: PlayerStats, statName: string): number {
    const normalizedName = statName.toLowerCase().replace(/_/g, '');

    const categories = ['technical', 'physical', 'mental'] as const;

    for (const category of categories) {
      const categoryStats: Record<string, number> = { ...stats[category] };

      if (statName in categoryStats) {
        const value = categoryStats[statName];
        return typeof value === 'number' ? value : 0;
      }

      for (const key of Object.keys(categoryStats)) {
        if (key.toLowerCase().replace(/_/g, '') === normalizedName) {
          const value = categoryStats[key];
          return typeof value === 'number' ? value : 0;
        }
      }
    }

    console.warn(`Stat "${statName}" not found in PlayerStats`);
    return 0;
  }

  /**
   * Compute individual context modifiers for display and calculation.
   * Each modifier can contribute up to ±10% to success probability.
   */
  static getContextModifiers(context: Partial<KeyMomentContext>): {
    momentum: number;
    energy: number;
    mood: number;
    pressure: number;
    total: number;
  } {
    // Mood: -10 to +10 (linear across full range)
    const mood = context.mood !== undefined
      ? (context.mood / 100) * 10
      : 0;

    // Pressure: 0 to -10 (linear, always a penalty)
    const pressure = context.pressure !== undefined
      ? -(context.pressure / 100) * 10
      : 0;

    // Momentum: -10 to +10 (linear across full range)
    const momentum = context.momentum !== undefined
      ? (context.momentum / 100) * 10
      : 0;

    // Energy: 0 to -10 (scales from 100% down, not just below 50%)
    // Full energy = 0 penalty, empty = -10
    let energy = 0;
    if (context.energy !== undefined) {
      const energyPercent = context.energy / 100;
      // Gentle curve: low penalty above 70%, accelerates below 50%
      if (energyPercent < 0.7) {
        energy = -((0.7 - energyPercent) / 0.7) * 10;
      }
    }

    return {
      momentum: Math.round(momentum * 10) / 10,
      energy: Math.round(energy * 10) / 10,
      mood: Math.round(mood * 10) / 10,
      pressure: Math.round(pressure * 10) / 10,
      total: momentum + energy + mood + pressure,
    };
  }

  /**
   * Apply context modifiers to base probability.
   * Each factor contributes up to ±10% for a potential ±40% total swing.
   */
  private static applyContextModifiers(
    baseProbability: number,
    context: Partial<KeyMomentContext>
  ): number {
    const modifiers = this.getContextModifiers(context);
    return baseProbability + modifiers.total;
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
