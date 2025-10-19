/**
 * ShotCalculator - Transparent shot success calculation
 *
 * This is the core of the new match simulation - every calculation
 * is transparent, documented, and directly based on player stats.
 * Uses sliding scales to respect every stat point.
 */

import type {
  ShotType,
  ShotContext,
  ShotResult,
  ShotModifiers,
  PlayerStats,
  PlayStyle,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';

/**
 * Sliding scale ranges for different shot difficulties and contexts
 */
const SHOT_RANGES = {
  // Base success rate ranges by difficulty (min% at stat 0, max% at stat 100)
  baseSuccessRates: {
    easy: { min: 45, max: 95 },
    normal: { min: 30, max: 90 },
    hard: { min: 15, max: 85 },
    extreme: { min: 5, max: 60 },
  },

  // Winner probability ranges by play style (min% at stat 0, max% at stat 100)
  winnerRates: {
    aggressive: { min: 3, max: 45 },
    balanced: { min: 2, max: 35 },
    defensive: { min: 1, max: 25 },
  },

  // Pressure modifier ranges (multiplier based on focus stat)
  pressureModifiers: {
    low: { min: 1.0, max: 1.05 },      // Slight bonus for high focus under low pressure
    medium: { min: 0.75, max: 1.0 },   // Scaling pressure impact
    high: { min: 0.4, max: 1.15 },     // Elite focus players can thrive under pressure
  },

  // Rally length fatigue ranges (multiplier based on stamina stat)
  rallyLengthModifiers: {
    short: { min: 1.0, max: 1.0 },     // 0-5 shots, no fatigue effect
    medium: { min: 0.85, max: 1.0 },   // 6-10 shots
    long: { min: 0.70, max: 1.0 },     // 11-20 shots
    extreme: { min: 0.50, max: 1.0 },  // 20+ shots
  },
} as const;

/**
 * Shot type classifications for applying bonuses
 */
const SHOT_CLASSIFICATIONS = {
  powerShots: ['serve_first', 'forehand_winner', 'backhand_winner', 'overhead', 'passing_shot'],
  spinShots: ['topspin_forehand', 'topspin_backhand', 'kick_serve', 'slice_forehand', 'slice_backhand'],
  placementShots: ['drop_shot', 'angle_shot', 'down_the_line', 'cross_court', 'lob'],
  netShots: ['volley_forehand', 'volley_backhand', 'half_volley'],
  defensiveShots: ['defensive_slice', 'defensive_overhead', 'return_forehand', 'return_backhand'],
} as const;

export class ShotCalculator {
  /**
   * Calculate shot success with full transparency using sliding scales
   * Every stat point from 0-100 has proportional impact
   */
  public calculateShotSuccess(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext
  ): ShotResult {
    // Step 1: Get primary stat for this shot type
    const primaryStat = shooterProfile.getStatForShot(shotType);

    // Step 2: Calculate all modifiers
    const modifiers = this.calculateModifiers(shooterProfile, shotType, context);

    // Step 3: Apply modifiers to base stat
    const adjustedStat = this.applyModifiers(primaryStat, modifiers);

    // Step 4: Calculate base success probability using sliding scale
    const baseSuccessRate = this.calculateBaseSuccessRate(adjustedStat, context.difficulty);
    const finalSuccessRate = Math.min(98, Math.max(2, baseSuccessRate));

    // Step 5: Determine outcome
    const outcome = this.determineOutcome(
      finalSuccessRate,
      adjustedStat,
      shooterProfile.playStyle,
      shotType
    );

    return {
      success: outcome.outcome !== 'error',
      outcome: outcome.outcome,
      quality: adjustedStat,
      shotType,
      statUsed: this.getPrimaryStatName(shotType),
      modifiers,
    };
  }

  /**
   * Calculate base success rate using sliding scale
   * Every stat point from 0-100 provides proportional improvement
   */
  private calculateBaseSuccessRate(statValue: number, difficulty: ShotContext['difficulty']): number {
    const range = SHOT_RANGES.baseSuccessRates[difficulty];

    // Linear interpolation: stat 0 = min%, stat 100 = max%
    const successRate = range.min + (statValue / 100) * (range.max - range.min);

    return successRate;
  }

  /**
   * Calculate all modifiers that affect shot success
   */
  private calculateModifiers(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext
  ): ShotModifiers {
    const stats = shooterProfile.stats;
    const playStyle = shooterProfile.playStyle;

    // Spin bonus for shots that benefit from spin
    const spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);

    // Placement bonus for precision shots
    const placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);

    // Physical modifiers (speed, agility, strength)
    const physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical);

    // Mental modifiers (focus, anticipation, shot variety)
    const mentalModifier = this.calculateMentalModifier(context, stats.mental, playStyle);

    // Situational modifiers
    const difficultyModifier = this.getDifficultyModifier(context.difficulty);
    const pressureModifier = this.getPressureModifier(context.pressure, stats.mental.focus);
    const rallyLengthModifier = this.getRallyLengthModifier(context.rallyLength, stats.physical.stamina);

    // Combine all modifiers into final adjustment
    const finalAdjustment =
      (1 + spinBonus / 100) *
      (1 + placementBonus / 100) *
      physicalModifier *
      mentalModifier *
      difficultyModifier *
      pressureModifier *
      rallyLengthModifier;

    return {
      spinBonus,
      placementBonus,
      physicalModifier,
      mentalModifier,
      difficultyModifier,
      pressureModifier,
      rallyLengthModifier,
      finalAdjustment,
    };
  }

  /**
   * Calculate spin bonus using sliding scale
   * 0 spin = 0% bonus, 100 spin = 20% bonus for spin shots
   */
  private calculateSpinBonus(shotType: ShotType, spinStat: number): number {
    if (!SHOT_CLASSIFICATIONS.spinShots.includes(shotType as any)) {
      return 0;
    }

    // Linear scaling: 0-20% bonus based on spin stat
    return (spinStat / 100) * 20; // 50 spin = 10% bonus, 75 spin = 15% bonus
  }

  /**
   * Calculate placement bonus using sliding scale
   * 0 placement = 0% bonus, 100 placement = 15% bonus for placement shots
   */
  private calculatePlacementBonus(shotType: ShotType, placementStat: number): number {
    if (!SHOT_CLASSIFICATIONS.placementShots.includes(shotType as any)) {
      return 0;
    }

    // Linear scaling: 0-15% bonus for precision shots
    return (placementStat / 100) * 15; // 60 placement = 9% bonus, 80 placement = 12% bonus
  }

  /**
   * Calculate physical modifiers using sliding scales
   */
  private calculatePhysicalModifier(
    shotType: ShotType,
    context: ShotContext,
    physical: PlayerStats['physical']
  ): number {
    let modifier = 1.0;

    // Speed helps with defensive shots and court coverage
    if (SHOT_CLASSIFICATIONS.defensiveShots.includes(shotType as any) ||
        context.courtPosition === 'defensive') {
      // 0 speed = 0.8x, 100 speed = 1.0x
      const speedModifier = 0.8 + (physical.speed / 100) * 0.2;
      modifier *= speedModifier;
    }

    // Strength helps with power shots
    if (SHOT_CLASSIFICATIONS.powerShots.includes(shotType as any)) {
      // 0 strength = 0.9x, 100 strength = 1.1x
      const strengthModifier = 0.9 + (physical.strength / 100) * 0.2;
      modifier *= strengthModifier;
    }

    // Agility helps with net shots and quick reactions
    if (SHOT_CLASSIFICATIONS.netShots.includes(shotType as any) ||
        context.timeAvailable === 'rushed') {
      // 0 agility = 0.85x, 100 agility = 1.15x
      const agilityModifier = 0.85 + (physical.agility / 100) * 0.3;
      modifier *= agilityModifier;
    }

    return modifier;
  }

  /**
   * Calculate mental modifiers using sliding scales
   */
  private calculateMentalModifier(
    context: ShotContext,
    mental: PlayerStats['mental'],
    playStyle: PlayStyle
  ): number {
    let modifier = 1.0;

    // Anticipation helps when opponent is well-positioned
    if (context.opponentPosition === 'excellent') {
      // 0 anticipation = 0.8x, 100 anticipation = 1.0x
      const anticipationModifier = 0.8 + (mental.anticipation / 100) * 0.2;
      modifier *= anticipationModifier;
    }

    // Shot variety helps with tactical shots
    const tacticalShots = [...SHOT_CLASSIFICATIONS.placementShots, 'drop_shot', 'lob'];
    if (tacticalShots.some(shot => context.toString().includes(shot))) {
      // 0 shot_variety = 0.9x, 100 shot_variety = 1.1x
      const varietyModifier = 0.9 + (mental.shot_variety / 100) * 0.2;
      modifier *= varietyModifier;
    }

    // Offensive/defensive alignment with shot selection
    if (playStyle.aggression > 70 && SHOT_CLASSIFICATIONS.powerShots.length > 0) {
      // Small bonus for playing to offensive strengths
      const offensiveModifier = 1.0 + (mental.offensive / 100) * 0.1;
      modifier *= offensiveModifier;
    }

    return modifier;
  }

  /**
   * Get difficulty modifier (static values)
   */
  private getDifficultyModifier(difficulty: ShotContext['difficulty']): number {
    const modifiers = {
      easy: 1.1,
      normal: 1.0,
      hard: 0.8,
      extreme: 0.6,
    };
    return modifiers[difficulty];
  }

  /**
   * Get pressure modifier using sliding scale based on focus stat
   */
  private getPressureModifier(pressure: ShotContext['pressure'], focusStat: number): number {
    const range = SHOT_RANGES.pressureModifiers[pressure];

    // Linear interpolation based on focus stat
    return range.min + (focusStat / 100) * (range.max - range.min);
  }

  /**
   * Get rally length modifier using sliding scale based on stamina
   */
  private getRallyLengthModifier(rallyLength: number, staminaStat: number): number {
    let range;

    if (rallyLength <= 5) {
      range = SHOT_RANGES.rallyLengthModifiers.short;
    } else if (rallyLength <= 10) {
      range = SHOT_RANGES.rallyLengthModifiers.medium;
    } else if (rallyLength <= 20) {
      range = SHOT_RANGES.rallyLengthModifiers.long;
    } else {
      range = SHOT_RANGES.rallyLengthModifiers.extreme;
    }

    // Linear interpolation based on stamina stat
    return range.min + (staminaStat / 100) * (range.max - range.min);
  }

  /**
   * Apply all modifiers to base stat (keeping it within 0-100 range)
   */
  private applyModifiers(baseStat: number, modifiers: ShotModifiers): number {
    return Math.min(100, Math.max(0, baseStat * modifiers.finalAdjustment));
  }

  /**
   * Determine final shot outcome using sliding scale for winner probability
   */
  private determineOutcome(
    successRate: number,
    adjustedStat: number,
    playStyle: PlayStyle,
    shotType: ShotType
  ): { outcome: 'winner' | 'in_play' | 'error' } {
    const roll = Math.random() * 100;

    // First check if shot is successful
    if (roll > successRate) {
      return { outcome: 'error' };
    }

    // Shot is successful - determine if it's a winner using sliding scale
    const playStyleCategory = this.getPlayStyleCategory(playStyle);
    const winnerRange = SHOT_RANGES.winnerRates[playStyleCategory];

    // Base winner probability using sliding scale
    const baseWinnerProbability = winnerRange.min + (adjustedStat / 100) * (winnerRange.max - winnerRange.min);

    // Apply shot type bonus for power shots
    const shotTypeBonus = SHOT_CLASSIFICATIONS.powerShots.includes(shotType as any) ? 1.3 : 1.0;
    const finalWinnerProbability = baseWinnerProbability * shotTypeBonus;

    if (roll < finalWinnerProbability) {
      return { outcome: 'winner' };
    }

    return { outcome: 'in_play' };
  }

  /**
   * Categorize play style for winner rate lookup
   */
  private getPlayStyleCategory(playStyle: PlayStyle): 'aggressive' | 'balanced' | 'defensive' {
    if (playStyle.aggression >= 70) return 'aggressive';
    if (playStyle.aggression <= 40) return 'defensive';
    return 'balanced';
  }

  /**
   * Get the primary stat name that influences a shot type
   */
  private getPrimaryStatName(shotType: ShotType): string {
    // Simplified mapping for display purposes
    if (shotType.includes('serve')) return 'serve';
    if (shotType.includes('forehand')) return 'forehand';
    if (shotType.includes('backhand')) return 'backhand';
    if (shotType.includes('volley')) return 'volley';
    if (shotType.includes('overhead')) return 'overhead';
    if (shotType.includes('drop')) return 'drop_shot';
    if (shotType.includes('slice')) return 'slice';
    if (shotType.includes('return')) return 'return';
    if (shotType.includes('angle') || shotType.includes('lob')) return 'placement';

    return 'placement'; // Default fallback
  }

  /**
   * Get detailed explanation of shot calculation (for debugging/verification)
   */
  public explainShotCalculation(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext
  ): string {
    const primaryStat = shooterProfile.getStatForShot(shotType);
    const modifiers = this.calculateModifiers(shooterProfile, shotType, context);
    const adjustedStat = this.applyModifiers(primaryStat, modifiers);
    const baseSuccessRate = this.calculateBaseSuccessRate(adjustedStat, context.difficulty);

    let explanation = `Shot Calculation for ${shotType}:\n`;
    explanation += `Primary Stat (${this.getPrimaryStatName(shotType)}): ${primaryStat}\n`;
    explanation += `Difficulty: ${context.difficulty} (×${modifiers.difficultyModifier})\n`;
    explanation += `Pressure: ${context.pressure} (×${modifiers.pressureModifier.toFixed(3)})\n`;
    explanation += `Rally Length: ${context.rallyLength} shots (×${modifiers.rallyLengthModifier.toFixed(3)})\n`;

    if (modifiers.spinBonus > 0) {
      explanation += `Spin Bonus: +${modifiers.spinBonus.toFixed(1)}%\n`;
    }
    if (modifiers.placementBonus > 0) {
      explanation += `Placement Bonus: +${modifiers.placementBonus.toFixed(1)}%\n`;
    }

    explanation += `Physical Modifier: ×${modifiers.physicalModifier.toFixed(3)}\n`;
    explanation += `Mental Modifier: ×${modifiers.mentalModifier.toFixed(3)}\n`;
    explanation += `Final Adjustment: ×${modifiers.finalAdjustment.toFixed(3)}\n`;
    explanation += `Adjusted Stat: ${adjustedStat.toFixed(1)}\n`;
    explanation += `Success Rate: ${baseSuccessRate.toFixed(1)}%\n`;

    return explanation;
  }

  /**
   * Show the impact of stat improvements (for training feedback)
   */
  public calculateStatImpact(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext,
    statImprovement: number
  ): { beforeRate: number; afterRate: number; improvement: number } {
    // Calculate current success rate
    const beforeStat = shooterProfile.getStatForShot(shotType);
    const beforeModifiers = this.calculateModifiers(shooterProfile, shotType, context);
    const beforeAdjusted = this.applyModifiers(beforeStat, beforeModifiers);
    const beforeRate = this.calculateBaseSuccessRate(beforeAdjusted, context.difficulty);

    // Calculate success rate after stat improvement
    const afterStat = Math.min(100, beforeStat + statImprovement);
    const afterAdjusted = this.applyModifiers(afterStat, beforeModifiers);
    const afterRate = this.calculateBaseSuccessRate(afterAdjusted, context.difficulty);

    return {
      beforeRate,
      afterRate,
      improvement: afterRate - beforeRate,
    };
  }
}