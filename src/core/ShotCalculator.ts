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
  TechnicalStats,
  PhysicalStats,
  MentalStats,
  BallQuality,
  TacticalOpportunity,
  CourtPosition,
  QualityThresholds,
  ShotDetail,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import {
  RELATIVE_QUALITY_REQUIREMENTS,
  MIN_QUALITY_FLOORS,
  MINIMUM_WINNER_THRESHOLDS,
  OUTCOME_MULTIPLIERS,
  SERVE_BASELINE,
  OPPONENT_STAT_ADJUSTMENTS,
  POSITION_ADJUSTMENTS,
  SERVE_VARIANCE,
  RETURN_VARIANCE,
  RALLY_SHOT_VARIANCE,
  SERVE_BONUSES,
  TOTAL_MODIFIER_CAPS,
  getShotCategory,
} from '../config/shotThresholds.js';

/**
 * Sliding scale ranges for different shot difficulties and contexts
 * NOTE: Winner determination now uses quality thresholds, not probability
 */
const SHOT_RANGES = {
  // Pressure modifier ranges (multiplier based on focus stat)
  pressureModifiers: {
    low: { min: 1.0, max: 1.05 },      // Slight bonus for high focus under low pressure
    medium: { min: 0.75, max: 1.0 },   // Scaling pressure impact
    high: { min: 0.4, max: 1.15 },     // Elite focus players can thrive under pressure
  },

  // Rally length fatigue ranges (multiplier based on stamina stat)
  rallyLengthModifiers: {
    short: { min: 1.0, max: 1.0 },     // 0-5 shots, no fatigue effect
    medium: { min: 0.90, max: 1.0 },   // 6-10 shots
    long: { min: 0.80, max: 1.0 },     // 11-15 shots
    extreme: { min: 0.75, max: 1.0 },  // 16+ shots
  },
} as const;

/**
 * Shot type classifications for applying bonuses
 */
const SHOT_CLASSIFICATIONS = {
  powerShots: ['serve_first', 'forehand_power', 'backhand_power', 'return_forehand_power', 'return_backhand_power', 'overhead', 'passing_shot_forehand', 'passing_shot_backhand'],
  spinShots: ['topspin_forehand', 'topspin_backhand', 'kick_serve', 'slice_forehand', 'slice_backhand'],
  placementShots: ['drop_shot_forehand', 'drop_shot_backhand', 'angle_shot_forehand', 'angle_shot_backhand', 'down_the_line_forehand', 'down_the_line_backhand', 'cross_court_forehand', 'cross_court_backhand', 'lob_forehand', 'lob_backhand', 'short_angle_forehand', 'short_angle_backhand'],
  netShots: ['volley_forehand', 'volley_backhand', 'half_volley_forehand', 'half_volley_backhand'],
  defensiveShots: ['defensive_slice_forehand', 'defensive_slice_backhand', 'defensive_overhead', 'return_forehand', 'return_backhand'],
} as const;

export class ShotCalculator {
  /**
   * Calculate shot success using relative quality threshold system
   * Every stat point from 0-100 has proportional impact
   *
   * @param shooterProfile - Player taking the shot
   * @param shotType - Type of shot being attempted
   * @param context - Shot context (difficulty, pressure, etc.)
   * @param opponentProfile - Opponent player (required for defensive stats, return stat)
   * @param opponentPosition - Opponent's court position (required for threshold adjustments)
   * @param incomingShot - Previous shot (for incoming quality), undefined for serves
   * @param ballQuality - Optional incoming ball characteristics (legacy, prefer incomingShot)
   * @param tacticalOpportunity - Optional tactical situation evaluation
   */
  public calculateShotSuccess(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext,
    opponentProfile: PlayerProfile,
    opponentPosition: CourtPosition,
    incomingShot?: ShotDetail,
    ballQuality?: BallQuality,
    tacticalOpportunity?: TacticalOpportunity
  ): ShotResult {
    console.log('Calculating shot success for', shotType);
    console.log('Incoming shot quality:', incomingShot?.quality);
    // Step 1: Get primary stat for this shot type
    const primaryStat = shooterProfile.getStatForShot(shotType);

    // Step 2: Calculate all modifiers
    const modifiers = this.calculateModifiers(
      shooterProfile,
      shotType,
      context,
      incomingShot,
      ballQuality,
      tacticalOpportunity,
      opponentPosition
    );

    // Step 3: Apply modifiers to get shot quality
    const quality = this.applyModifiers(primaryStat, modifiers);

    // Step 4: Determine outcome based on shot type
    let outcome: 'winner' | 'in_play' | 'forced_error' | 'unforced_error' | 'error';
    let thresholds: QualityThresholds;

    if (shotType.includes('serve')) {
      // Special handling for serves (no incoming shot)
      const serveOutcome = this.determineServeOutcome(
        quality,
        shotType as 'serve_first' | 'serve_second' | 'kick_serve',
        opponentProfile.stats.technical.return
      );
      outcome = serveOutcome.outcome;
      thresholds = serveOutcome.thresholds;
    } else {
      if (!incomingShot) {
        throw new Error('Incoming shot is required for non-serve shots to calculate quality thresholds.');
      }
      
      // Regular shots use relative quality system
      const incomingQuality = incomingShot.quality;

      thresholds = this.calculateQualityRequirements(
        incomingQuality,
        shotType,
        opponentProfile.stats,
        opponentPosition
      );

      outcome = this.determineOutcome(quality, thresholds);
    }

    console.log('Shot quality:', quality.toFixed(1), 'Outcome:', outcome);
    console.log('Quality thresholds:', thresholds);

    return {
      success: outcome === 'winner' || outcome === 'in_play',
      outcome,
      quality,
      shotType,
      statUsed: this.getPrimaryStatName(shotType),
      modifiers,
      thresholds,
    };
  }

  /**
   * Calculate quality requirements based on incoming shot (relative quality system)
   */
  private calculateQualityRequirements(
    incomingQuality: number,
    shotType: ShotType,
    opponentStats: PlayerStats,
    opponentPosition: CourtPosition
  ): QualityThresholds {
    // Get base multiplier for this shot type
    const baseMultiplier = RELATIVE_QUALITY_REQUIREMENTS[shotType];
    const baseRequirement = incomingQuality * baseMultiplier;

    // Apply minimum floor
    const shotCategory = getShotCategory(shotType);
    const minFloor = MIN_QUALITY_FLOORS[shotCategory];
    let inPlayReq = Math.max(baseRequirement, minFloor);

    // Opponent defensive stat adjustment
    const defensiveAdj = (opponentStats.mental.defensive - 50) * OPPONENT_STAT_ADJUSTMENTS.defensive;
    inPlayReq += defensiveAdj;

    // Opponent speed adjustment
    const speedAdj = (opponentStats.physical.speed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;
    inPlayReq += speedAdj;

    // Position adjustment
    const positionAdj = POSITION_ADJUSTMENTS[opponentPosition];
    inPlayReq += positionAdj;

    // Get category-specific outcome multipliers
    const multipliers = OUTCOME_MULTIPLIERS[shotCategory];

    // Calculate winner threshold with minimum floor
    const calculatedWinner = inPlayReq * multipliers.winner;
    const winnerThreshold = Math.max(
      calculatedWinner,
      MINIMUM_WINNER_THRESHOLDS[shotCategory]
    );

    // Calculate derived thresholds
    return {
      winner: winnerThreshold,
      inPlay: inPlayReq * multipliers.inPlay,
      forcedError: inPlayReq * multipliers.forcedError,
    };
  }

  /**
   * Determine outcome based on quality vs thresholds
   */
  private determineOutcome(
    quality: number,
    thresholds: QualityThresholds
  ): 'winner' | 'in_play' | 'forced_error' | 'unforced_error' {
    if (quality >= thresholds.winner) return 'winner';
    if (quality >= thresholds.inPlay) return 'in_play';
    if (quality >= thresholds.forcedError) return 'forced_error';
    return 'unforced_error';
  }

  /**
   * Handle serve outcome (special case with no incoming shot)
   */
  private determineServeOutcome(
    serveQuality: number,
    serveType: 'serve_first' | 'serve_second' | 'kick_serve',
    opponentReturnStat: number
  ): { outcome: 'winner' | 'in_play' | 'error'; thresholds: QualityThresholds } {
    const baseline = SERVE_BASELINE[serveType];

    // Check if serve is in
    const serveIn = serveQuality >= baseline.inPlayThreshold;

    if (!serveIn) {
      return {
        outcome: 'error',
        thresholds: {
          winner: opponentReturnStat * baseline.aceMultiplier,
          inPlay: baseline.inPlayThreshold,
          forcedError: 0, // Not applicable for serves
        },
      };
    }

    // Check for ace
    const aceThreshold = opponentReturnStat * baseline.aceMultiplier;
    const isAce = serveQuality >= aceThreshold;

    return {
      outcome: isAce ? 'winner' : 'in_play',
      thresholds: {
        winner: aceThreshold,
        inPlay: baseline.inPlayThreshold,
        forcedError: 0,
      },
    };
  }

  /**
   * Calculate all modifiers that affect shot success
   */
  private calculateModifiers(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext,
    incomingShot?: ShotDetail,
    ballQuality?: BallQuality,
    tacticalOpportunity?: TacticalOpportunity,
    opponentPosition?: CourtPosition
  ): ShotModifiers {
    const stats = shooterProfile.stats;
    const playStyle = shooterProfile.playStyle;

    // Spin bonus for shots that benefit from spin
    let spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);

    // Placement bonus for precision shots
    const placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);

    // Physical modifiers (speed, agility, strength)
    let physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical);

    // Mental modifiers (focus, anticipation, shot variety)
    let mentalModifier = this.calculateMentalModifier(context, stats.mental, playStyle);

    // Serve-specific bonuses and variance
    let serveVariance = 0;
    if (shotType === 'serve_first') {
      // First serve: offensive, strength-based, high variance
      // Apply individual caps to prevent excessive stacking
      const offensiveBonus = Math.min(
        (stats.mental.offensive / 100) * SERVE_BONUSES.first.offensive.multiplier,
        SERVE_BONUSES.first.offensive.maxBonus
      );
      const strengthBonus = Math.min(
        (stats.physical.strength / 100) * SERVE_BONUSES.first.strength.multiplier,
        SERVE_BONUSES.first.strength.maxBonus
      );
      const spinBonusServe = Math.min(
        (stats.technical.spin / 100) * SERVE_BONUSES.first.spin.multiplier,
        SERVE_BONUSES.first.spin.maxBonus
      );

      physicalModifier *= (1 + offensiveBonus + strengthBonus);
      spinBonus += spinBonusServe * 100; // Convert to percentage

      // Variance for first serve
      serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.first;
    } else if (shotType === 'serve_second' || shotType === 'kick_serve') {
      // Second serve: consistency, spin-based, low variance
      // Apply individual caps
      const consistencyBonus = Math.min(
        (playStyle.consistency / 100) * SERVE_BONUSES.second.consistency.multiplier,
        SERVE_BONUSES.second.consistency.maxBonus
      );
      const spinBonusServe = Math.min(
        (stats.technical.spin / 100) * SERVE_BONUSES.second.spin.multiplier,
        SERVE_BONUSES.second.spin.maxBonus
      );
      const defensiveBonus = Math.min(
        (stats.mental.defensive / 100) * SERVE_BONUSES.second.defensive.multiplier,
        SERVE_BONUSES.second.defensive.maxBonus
      );

      mentalModifier *= (1 + consistencyBonus + defensiveBonus);
      spinBonus += spinBonusServe * 100;

      // Variance for second serve
      serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.second;
    }

    // Return-specific variance
    let returnVariance = 0;
    if (shotType.includes('return')) {
      returnVariance = (Math.random() - 0.5) * 2 * RETURN_VARIANCE;
    }

    // Rally shot variance (applies to all non-serve, non-return shots)
    let rallyVariance = 0;
    if (!shotType.includes('serve') && !shotType.includes('return') && incomingShot) {
      // Base variance + additional based on incoming shot quality
      const incomingQuality = incomingShot.quality;
      const totalVariance = RALLY_SHOT_VARIANCE.base +
        (incomingQuality / 100) * RALLY_SHOT_VARIANCE.qualityMultiplier;
      rallyVariance = (Math.random() - 0.5) * 2 * totalVariance;
    }

    // Situational modifiers
    const difficultyModifier = this.getDifficultyModifier(context.difficulty);
    const pressureModifier = this.getPressureModifier(context.pressure, stats.mental.focus);
    const rallyLengthModifier = this.getRallyLengthModifier(context.rallyLength, stats.physical.stamina);

    // Context-aware modifiers
    const ballQualityModifier = this.getBallQualityModifier(ballQuality, stats.physical);
    const tacticalModifier = this.getTacticalModifier(shotType, tacticalOpportunity, opponentPosition);

    // Combine all modifiers into final adjustment
    let finalAdjustment =
      (1 + spinBonus / 100) *
      (1 + placementBonus / 100) *
      physicalModifier *
      mentalModifier *
      difficultyModifier *
      pressureModifier *
      rallyLengthModifier *
      ballQualityModifier *
      tacticalModifier;

    // Apply total modifier cap based on shot type
    if (shotType.includes('serve')) {
      finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.serve);
    } else if (shotType.includes('return')) {
      finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.return);
    } else {
      finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.rally);
    }

    return {
      spinBonus,
      placementBonus,
      physicalModifier,
      mentalModifier,
      difficultyModifier,
      pressureModifier,
      rallyLengthModifier,
      finalAdjustment,
      serveVariance,
      returnVariance,
      rallyVariance,
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
    } else if (rallyLength <= 15) {
      range = SHOT_RANGES.rallyLengthModifiers.long;
    } else {
      range = SHOT_RANGES.rallyLengthModifiers.extreme;
    }

    // Linear interpolation based on stamina stat
    return range.min + (staminaStat / 100) * (range.max - range.min);
  }

  /**
   * Apply all modifiers to base stat (keeping it within 0-100 range)
   * Includes serve/return/rally variance if applicable
   */
  private applyModifiers(baseStat: number, modifiers: ShotModifiers): number {
    let quality = baseStat * modifiers.finalAdjustment;

    // Apply serve variance if present
    if (modifiers.serveVariance !== undefined) {
      quality += modifiers.serveVariance;
    }

    // Apply return variance if present
    if (modifiers.returnVariance !== undefined) {
      quality += modifiers.returnVariance;
    }

    // Apply rally variance if present
    if (modifiers.rallyVariance !== undefined) {
      quality += modifiers.rallyVariance;
    }

    return Math.min(100, Math.max(0, quality));
  }


  /**
   * Get the primary stat name that influences a shot type
   */
  private getPrimaryStatName(shotType: ShotType): keyof TechnicalStats | keyof PhysicalStats | keyof MentalStats {
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
   * Get modifier based on incoming ball quality
   * High quality incoming shots are harder to handle
   */
  private getBallQualityModifier(
    ballQuality: BallQuality | undefined,
    physical: PlayerStats['physical']
  ): number {
    if (!ballQuality) return 1.0; // No penalty if not tracking ball quality

    let modifier = 1.0;

    // Time pressure based on speed/agility
    if (ballQuality.timeAvailable === 'rushed') {
      // Players with high speed and agility handle rushed shots better
      const rushHandling = (physical.speed + physical.agility) / 2;
      // 0 speed/agility = 0.6x, 100 speed/agility = 1.0x
      modifier *= 0.6 + (rushHandling / 100) * 0.4;
    } else if (ballQuality.timeAvailable === 'plenty') {
      modifier *= 1.05; // Slight bonus for plenty of time
    }

    // High quality incoming shots are difficult
    if (ballQuality.baseQuality >= 80) {
      // Elite shot coming at us - harder to handle
      modifier *= 0.85;
    } else if (ballQuality.baseQuality >= 60) {
      modifier *= 0.95;
    } else if (ballQuality.baseQuality < 40) {
      // Weak incoming shot - easier to attack
      modifier *= 1.1;
    }

    return modifier;
  }

  /**
   * Get modifier based on tactical situation
   * Certain shots are harder/easier depending on opponent position
   */
  private getTacticalModifier(
    shotType: ShotType,
    tacticalOpportunity: TacticalOpportunity | undefined,
    opponentPosition: CourtPosition | undefined
  ): number {
    if (!tacticalOpportunity || !opponentPosition) return 1.0;

    let modifier = 1.0;

    // Passing shots are harder when opponent is at net (they can cover more)
    if (shotType.includes('passing_shot')) {
      if (opponentPosition === 'at_net') {
        modifier *= 0.8; // 20% harder when opponent well-positioned at net
      }
    }

    // Drop shots are easier when opponent is back
    if (shotType.includes('drop_shot')) {
      if (opponentPosition === 'way_back_deep') {
        modifier *= 1.2; // 20% easier when opponent is deep
      } else if (opponentPosition === 'at_net') {
        modifier *= 0.7; // Much harder when opponent at net
      }
    }

    // Power shots and winners are easier with high attack opportunity
    if (SHOT_CLASSIFICATIONS.powerShots.includes(shotType as any)) {
      if (tacticalOpportunity.attackOpportunity === 'high') {
        modifier *= 1.15;
      } else if (tacticalOpportunity.attackOpportunity === 'low') {
        modifier *= 0.95;
      }
    }

    // Defensive shots are more reliable when defensive is required
    if (SHOT_CLASSIFICATIONS.defensiveShots.includes(shotType as any)) {
      if (tacticalOpportunity.defensiveRequired) {
        modifier *= 1.1; // Defensive shots are what you should be hitting
      }
    }

    return modifier;
  }

  /**
   * Get detailed explanation of shot calculation (for debugging/verification)
   * NOTE: Simplified for threshold-based system
   */
  public explainShotCalculation(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext
  ): string {
    const primaryStat = shooterProfile.getStatForShot(shotType);
    const modifiers = this.calculateModifiers(shooterProfile, shotType, context);
    const quality = this.applyModifiers(primaryStat, modifiers);

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
    if (modifiers.serveVariance) {
      explanation += `Serve Variance: ${modifiers.serveVariance > 0 ? '+' : ''}${modifiers.serveVariance.toFixed(1)}\n`;
    }

    explanation += `Physical Modifier: ×${modifiers.physicalModifier.toFixed(3)}\n`;
    explanation += `Mental Modifier: ×${modifiers.mentalModifier.toFixed(3)}\n`;
    explanation += `Final Adjustment: ×${modifiers.finalAdjustment.toFixed(3)}\n`;
    explanation += `Final Quality: ${quality.toFixed(1)}\n`;
    explanation += `\nNOTE: Outcome determined by quality vs thresholds (varies by opponent)\n`;

    return explanation;
  }

  /**
   * Show the impact of stat improvements (for training feedback)
   * NOTE: Simplified for threshold-based system - shows quality improvement
   */
  public calculateStatImpact(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext,
    statImprovement: number
  ): { beforeRate: number; afterRate: number; improvement: number } {
    // Calculate current quality
    const beforeStat = shooterProfile.getStatForShot(shotType);
    const beforeModifiers = this.calculateModifiers(shooterProfile, shotType, context);
    const beforeQuality = this.applyModifiers(beforeStat, beforeModifiers);

    // Calculate quality after stat improvement
    const afterStat = Math.min(100, beforeStat + statImprovement);
    const afterQuality = this.applyModifiers(afterStat, beforeModifiers);

    return {
      beforeRate: beforeQuality,
      afterRate: afterQuality,
      improvement: afterQuality - beforeQuality,
    };
  }
}