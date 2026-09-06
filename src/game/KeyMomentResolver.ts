/**
 * Key Moment Resolver
 * Handles calculating success probability and resolving key moment outcomes.
 * Uses tactical counter system: options are strong/weak against specific archetypes.
 */

import { TacticalOption, SecondaryEffect, StatWeights } from '../data/tacticalOptions';
import { getMatchup } from '../data/postures';
import type { ArchetypeType } from '../data/archetypes';
import { PointType } from '../types';
import type { StatName } from '../types';
import { PlayerStats, EffectKey } from '../types/game';
import { KEY_MOMENT } from '../config/shotThresholds';

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
    context?: Partial<KeyMomentContext>,
    activeEffects?: Record<string, number>
  ): number {
    // Calculate weighted player stat
    const playerScore = this.calculateWeightedStat(
      playerStats,
      option.playerStatWeights
    );

    // Calculate weighted opponent stat
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      this.resolveOpponentWeights(option, opponentStats)
    );

    // Base probability with stat differential
    const differential = playerScore - opponentScore;
    let probability = KEY_MOMENT.baseChance + (differential * KEY_MOMENT.statMultiplier);

    // Apply the posture matchup
    const matchup = getMatchup(option.posture, opponentArchetype);
    if (matchup === 'strong') {
      probability += KEY_MOMENT.counterBonus;
    } else if (matchup === 'weak') {
      probability += KEY_MOMENT.weakPenalty;
    }

    // Apply context modifiers if provided
    if (context) {
      probability = this.applyContextModifiers(
        probability,
        context,
        this.getStatValue(playerStats, 'focus'),
        activeEffects
      );
    }

    // Apply ability effects to key moment probability
    // CLUTCH_PERFORMANCE value IS the flat % bonus (no multiplier)
    if (activeEffects) {
      probability += activeEffects[EffectKey.CLUTCH_PERFORMANCE] ?? 0;
    }

    return Math.max(
      KEY_MOMENT.minProbability,
      Math.min(KEY_MOMENT.maxProbability, probability)
    );
  }

  /**
   * Resolve a key moment with a tactical choice
   */
  static resolveKeyMoment(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption,
    opponentArchetype: ArchetypeType,
    context?: Partial<KeyMomentContext>,
    activeEffects?: Record<string, number>
  ): KeyMomentResult {
    const playerScore = this.calculateWeightedStat(
      playerStats,
      option.playerStatWeights
    );
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      this.resolveOpponentWeights(option, opponentStats)
    );
    const baseProbability = this.calculateSuccessProbability(
      playerStats,
      opponentStats,
      option,
      opponentArchetype,
      context,
      activeEffects
    );
    const finalProbability = baseProbability;

    const matchup = getMatchup(option.posture, opponentArchetype);
    const isCounter = matchup === 'strong';
    const isWeakChoice = matchup === 'weak';

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
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      this.resolveOpponentWeights(option, opponentStats)
    );
    const diff = playerScore - opponentScore;

    if (diff > 10) return 'advantage';
    if (diff < -10) return 'disadvantage';
    return 'even';
  }

  /**
   * Get weighted scores for both players for UI display.
   * Returns { playerScore, opponentScore } for comparing matchup strength.
   */
  static getWeightedScores(
    playerStats: PlayerStats,
    opponentStats: PlayerStats,
    option: TacticalOption
  ): { playerScore: number; opponentScore: number } {
    const playerScore = this.calculateWeightedStat(playerStats, option.playerStatWeights);
    const opponentScore = this.calculateWeightedStat(
      opponentStats,
      this.resolveOpponentWeights(option, opponentStats)
    );
    return { playerScore: Math.round(playerScore), opponentScore: Math.round(opponentScore) };
  }

  /**
   * Opponent weights for an option, after weakness targeting.
   *
   * An option flagged targetsWeakerWing aims at whichever wing is actually weaker,
   * so the `backhand` term becomes `forehand` when the forehand is the lower of
   * the two. Everything else is returned untouched.
   */
  private static resolveOpponentWeights(
    option: TacticalOption,
    opponentStats: PlayerStats
  ): StatWeights {
    if (!option.targetsWeakerWing) {
      return option.opponentStatWeights;
    }

    const weakerWing: StatName =
      this.getStatValue(opponentStats, 'forehand') < this.getStatValue(opponentStats, 'backhand')
        ? 'forehand'
        : 'backhand';

    const swap = (stat: StatName): StatName => (stat === 'backhand' ? weakerWing : stat);
    const weights = option.opponentStatWeights;
    return {
      primary: swap(weights.primary),
      primaryWeight: weights.primaryWeight,
      secondary: weights.secondary.map((s) => ({ ...s, stat: swap(s.stat) })),
    };
  }

  /**
   * Calculate weighted stat value from stat weights
   */
  private static calculateWeightedStat(
    stats: PlayerStats,
    weights: StatWeights
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
  private static getStatValue(stats: PlayerStats, statName: StatName): number {
    const normalizedName = statName.toLowerCase().replace(/_/g, '');

    const categories = ['core', 'technical', 'physical', 'mental'] as const;

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
   *
   * All four channels are two-sided: good conditions add, bad conditions subtract.
   * Pressure is scored against the player's focus (see KEY_MOMENT.pressureVsFocusScale)
   * so that a big occasion rewards a composed player instead of taxing everyone.
   */
  static getContextModifiers(
    context: Partial<KeyMomentContext>,
    playerFocus: number,
    activeEffects?: Record<string, number>
  ): {
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

    // Pressure: scored against focus, so the moment is a test rather than a toll.
    // Focus above the pressure of the moment is an edge; below it, a penalty.
    // MENTAL_RESILIENCE buys effective focus, which is what makes a player clutch.
    let pressure = 0;
    if (context.pressure !== undefined) {
      const resilience = activeEffects?.[EffectKey.MENTAL_RESILIENCE] ?? 0;
      const effectiveFocus = playerFocus + resilience * KEY_MOMENT.resilienceToFocus;
      pressure = Math.max(
        -KEY_MOMENT.pressureClamp,
        Math.min(KEY_MOMENT.pressureClamp, (effectiveFocus - context.pressure) * KEY_MOMENT.pressureVsFocusScale)
      );
    }

    // Momentum: -10 to +10 (linear across full range)
    const momentum = context.momentum !== undefined
      ? (context.momentum / 100) * 10
      : 0;

    // Energy: +5 when fully fresh down to -10 when empty, neutral at KEY_MOMENT.energyNeutral.
    // The penalty curve below neutral is steeper than the bonus above it — running
    // on empty should cost more than being fresh pays.
    let energy = 0;
    if (context.energy !== undefined) {
      energy = context.energy >= KEY_MOMENT.energyNeutral
        ? ((context.energy - KEY_MOMENT.energyNeutral) / (100 - KEY_MOMENT.energyNeutral)) * KEY_MOMENT.energyMaxBonus
        : -((KEY_MOMENT.energyNeutral - context.energy) / KEY_MOMENT.energyNeutral) * KEY_MOMENT.energyMaxPenalty;
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
   * Momentum, mood and pressure each contribute up to ±10 and energy -10..+5,
   * so conditions can swing a key moment by roughly ±35.
   */
  private static applyContextModifiers(
    baseProbability: number,
    context: Partial<KeyMomentContext>,
    playerFocus: number,
    activeEffects?: Record<string, number>
  ): number {
    // MENTAL_RESILIENCE is folded into the pressure term inside getContextModifiers,
    // so the modifiers the UI displays are exactly the ones applied here.
    return baseProbability + this.getContextModifiers(context, playerFocus, activeEffects).total;
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
