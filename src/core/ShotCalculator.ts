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
import { PointType } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { getQualityThresholds, getMatchLevel } from '../utils/qualityThresholds.js';
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
  PROBABILITY_STEEPNESS,
  sigmoidProbability,
  getShotCategory,
  FATIGUE_MODIFIER,
  MOMENTUM_MODIFIER,
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
  spinShots: ['slice_forehand', 'slice_backhand'],
  placementShots: ['drop_shot_forehand', 'drop_shot_backhand', 'angle_shot_forehand', 'angle_shot_backhand', 'lob_forehand', 'lob_backhand'],
  netShots: ['volley_forehand', 'volley_backhand', 'half_volley_forehand', 'half_volley_backhand'],
  defensiveShots: ['defensive_slice_forehand', 'defensive_slice_backhand', 'defensive_overhead', 'return_forehand', 'return_backhand'],
} as const;

export class ShotCalculator {
  /** Current match level, set at start of calculateShotSuccess for use by internal methods */
  private currentMatchLevel: number = 50;

  /**
   * Calculate shot success using relative quality threshold system
   * Every stat point from 0-100 has proportional impact
   *
   * @param shooterProfile - Player taking the shot
   * @param shotType - Type of shot being attempted
   * @param context - Shot context (difficulty, pressure, etc.)
   * @param opponentProfile - Opponent player (required for defensive stats, return stat)
   * @param opponentPosition - Opponent's court position (required for threshold adjustments)
   * @param incomingShot - Previous shot (for incoming quality and ball characteristics), undefined for serves
   * @param tacticalOpportunity - Optional tactical situation evaluation
   * @param matchFatigue - Shooter's current match fatigue (0-100)
   * @param momentum - Momentum from shooter's perspective (-100 to +100, positive = favorable)
   */
  public calculateShotSuccess(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    context: ShotContext,
    opponentProfile: PlayerProfile,
    opponentPosition: CourtPosition,
    incomingShot?: ShotDetail,
    tacticalOpportunity?: TacticalOpportunity,
    matchFatigue: number = 0,
    momentum: number = 0,
    activeEffects?: Record<string, number>
  ): ShotResult {
    console.log('Calculating shot success for', shotType);
    console.log('Incoming shot quality:', incomingShot?.quality);
    // Step 1: Get primary stat for this shot type
    const primaryStat = shooterProfile.getStatForShot(shotType);

    // Log serve stat for debugging
    if (shotType.includes('serve')) {
      console.log('🎾 SERVE CALCULATION START');
      console.log('  Serve stat (primary):', primaryStat);
      console.log('  Player name:', shooterProfile.name);
      console.log('  Player energy:', shooterProfile.energy);
    }

    // Step 2: Derive ball quality from incoming shot (if available)
    const matchLevel = getMatchLevel(shooterProfile.overallRating, opponentProfile.overallRating);
    this.currentMatchLevel = matchLevel;
    const ballQuality = incomingShot ? this.calculateBallQuality(incomingShot, matchLevel) : undefined;

    // Step 3: Calculate all modifiers
    const modifiers = this.calculateModifiers(
      shooterProfile,
      shotType,
      context,
      incomingShot,
      ballQuality,
      tacticalOpportunity,
      opponentPosition,
      matchFatigue,
      momentum
    );

    // Log modifiers for serves
    if (shotType.includes('serve')) {
      console.log('  Modifiers:', {
        spinBonus: modifiers.spinBonus.toFixed(3),
        placementBonus: modifiers.placementBonus.toFixed(3),
        physicalModifier: modifiers.physicalModifier.toFixed(3),
        mentalModifier: modifiers.mentalModifier.toFixed(3),
        difficultyModifier: modifiers.difficultyModifier.toFixed(3),
        pressureModifier: modifiers.pressureModifier.toFixed(3),
        rallyLengthModifier: modifiers.rallyLengthModifier.toFixed(3),
        finalAdjustment: modifiers.finalAdjustment.toFixed(3),
        serveVariance: modifiers.serveVariance?.toFixed(1) || 'N/A',
      });
    }

    // Step 3: Apply modifiers to get shot quality
    let quality = this.applyModifiers(primaryStat, modifiers);

    // Step 3b: Apply ability additional effects
    if (activeEffects) {
      quality = this.applyAbilityEffects(quality, shotType, modifiers, activeEffects);
    }

    // Log quality calculation for serves
    if (shotType.includes('serve')) {
      console.log('  Base quality (stat × finalAdjustment):', (primaryStat * modifiers.finalAdjustment).toFixed(1));
      console.log('  Final quality (after variance):', quality.toFixed(1));
    }

    // Step 4: Determine outcome based on shot type
    let outcome: PointType;
    let thresholds: QualityThresholds;

    if (shotType.includes('serve')) {
      // Special handling for serves (no incoming shot)
      const serveOutcome = this.determineServeOutcome(
        quality,
        shotType as 'serve_first' | 'serve_second',
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

    // Calculate outcome probabilities for debugging transparency
    const outcomeProbabilities = shotType.includes('serve')
      ? {
          serveIn: sigmoidProbability(quality, thresholds.inPlay, PROBABILITY_STEEPNESS.serve.inPlay),
          ace: sigmoidProbability(quality, thresholds.winner, PROBABILITY_STEEPNESS.serve.ace),
        }
      : {
          winner: sigmoidProbability(quality, thresholds.winner, PROBABILITY_STEEPNESS.rally.winner),
          inPlay: sigmoidProbability(quality, thresholds.inPlay, PROBABILITY_STEEPNESS.rally.inPlay),
          forcedError: sigmoidProbability(quality, thresholds.forcedError, PROBABILITY_STEEPNESS.rally.forcedError),
        };

    console.log(`Shot quality: ${quality.toFixed(1)} | Outcome: ${outcome}`);

    return {
      success: outcome === PointType.ACE || outcome === PointType.WINNER || outcome === PointType.IN_PLAY,
      outcome,
      quality,
      shotType,
      statUsed: this.getPrimaryStatName(shotType),
      modifiers,
      thresholds,
      outcomeProbabilities,
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
    console.log('Sigmoid midpoint calculation for', shotType);
    // Get base multiplier for this shot type
    const baseMultiplier = RELATIVE_QUALITY_REQUIREMENTS[shotType];
    const baseRequirement = incomingQuality * baseMultiplier;

    // Apply minimum floor
    const shotCategory = getShotCategory(shotType);
    const minFloor = MIN_QUALITY_FLOORS[shotCategory];
    let inPlayReq = baseRequirement;

    // Opponent defensive stat adjustment
    const defensiveAdj = (opponentStats.mental.defensive - 50) * OPPONENT_STAT_ADJUSTMENTS.defensive;
    inPlayReq += defensiveAdj;

    // Opponent speed adjustment
    const speedAdj = (opponentStats.physical.speed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;
    inPlayReq += speedAdj;

    // Position adjustment
    const positionAdj = POSITION_ADJUSTMENTS[opponentPosition];
    inPlayReq += positionAdj;

    inPlayReq = Math.max(inPlayReq, minFloor);

    // Get category-specific outcome multipliers
    const multipliers = OUTCOME_MULTIPLIERS[shotCategory];

    // Calculate winner threshold with minimum floor
    const calculatedWinner = inPlayReq * multipliers.winner;
    const winnerThreshold = Math.max(
      calculatedWinner,
      MINIMUM_WINNER_THRESHOLDS[shotCategory]
    );

    console.log(`  Incoming: ${incomingQuality.toFixed(1)} × ${baseMultiplier.toFixed(2)} = ${baseRequirement.toFixed(1)} base | Adjustments: def ${defensiveAdj >= 0 ? '+' : ''}${defensiveAdj.toFixed(1)}, spd ${speedAdj >= 0 ? '+' : ''}${speedAdj.toFixed(1)}, pos ${positionAdj >= 0 ? '+' : ''}${positionAdj.toFixed(1)} | Floor: ${minFloor}`);
    console.log(`  Sigmoid midpoints → inPlay: ${inPlayReq.toFixed(1)} | winner: ${winnerThreshold.toFixed(1)} | forcedError: ${(inPlayReq * multipliers.forcedError).toFixed(1)}`);

    // Calculate derived thresholds
    return {
      winner: winnerThreshold,
      inPlay: inPlayReq * multipliers.inPlay,
      forcedError: inPlayReq * multipliers.forcedError,
    };
  }

  /**
   * Determine outcome using sigmoid probability curves
   *
   * Each threshold is the midpoint of a probability curve rather than
   * a hard cutoff. This creates gradual transitions between outcome types,
   * making every stat point matter proportionally.
   */
  private determineOutcome(
    quality: number,
    thresholds: QualityThresholds
  ): PointType {
    const pWinner = sigmoidProbability(quality, thresholds.winner, PROBABILITY_STEEPNESS.rally.winner);
    if (Math.random() < pWinner) {
      console.log(`  Outcome cascade → winner? ${(pWinner * 100).toFixed(1)}% chance → hit! WINNER`);
      return PointType.WINNER;
    }

    const pInPlay = sigmoidProbability(quality, thresholds.inPlay, PROBABILITY_STEEPNESS.rally.inPlay);
    if (Math.random() < pInPlay) {
      console.log(`  Outcome cascade → winner? ${(pWinner * 100).toFixed(1)}% chance → miss | inPlay? ${(pInPlay * 100).toFixed(1)}% chance → hit! IN_PLAY`);
      return PointType.IN_PLAY;
    }

    const pForcedError = sigmoidProbability(quality, thresholds.forcedError, PROBABILITY_STEEPNESS.rally.forcedError);
    if (Math.random() < pForcedError) {
      console.log(`  Outcome cascade → winner? ${(pWinner * 100).toFixed(1)}% → miss | inPlay? ${(pInPlay * 100).toFixed(1)}% → miss | forcedError? ${(pForcedError * 100).toFixed(1)}% → hit! FORCED_ERROR`);
      return PointType.FORCED_ERROR;
    }

    console.log(`  Outcome cascade → winner? ${(pWinner * 100).toFixed(1)}% → miss | inPlay? ${(pInPlay * 100).toFixed(1)}% → miss | forcedError? ${(pForcedError * 100).toFixed(1)}% → miss → UNFORCED_ERROR`);
    return PointType.UNFORCED_ERROR;
  }

  /**
   * Handle serve outcome using sigmoid probability curves
   *
   * Instead of hard threshold comparisons, each threshold is the midpoint
   * of a probability curve. Quality near the threshold gives ~50% chance,
   * quality well above/below gives near-certain outcomes.
   */
  private determineServeOutcome(
    serveQuality: number,
    serveType: 'serve_first' | 'serve_second',
    opponentReturnStat: number
  ): { outcome: PointType; thresholds: QualityThresholds } {
    const baseline = SERVE_BASELINE[serveType];

    // Scale ace threshold base relative to match level
    // At matchLevel 70, matches original hard-coded values; at 30, much lower so aces are possible
    const scaledAceBase = this.currentMatchLevel * (baseline.aceThresholdBase / 70);

    // Calculate ace threshold: scaled base + (opponent return × multiplier)
    const aceThreshold = scaledAceBase + (opponentReturnStat * baseline.aceReturnMultiplier);

    // Sigmoid probability for serve being in
    const pServeIn = sigmoidProbability(serveQuality, baseline.inPlayThreshold, PROBABILITY_STEEPNESS.serve.inPlay);

    const thresholds: QualityThresholds = {
      winner: aceThreshold,
      inPlay: baseline.inPlayThreshold,
      forcedError: 0,
    };

    // Roll for serve in
    if (Math.random() >= pServeIn) {
      console.log(`  Serve cascade → in? ${(pServeIn * 100).toFixed(1)}% chance → miss! FAULT`);
      return { outcome: PointType.FAULT, thresholds };
    }

    // Sigmoid probability for ace
    const pAce = sigmoidProbability(serveQuality, aceThreshold, PROBABILITY_STEEPNESS.serve.ace);
    if (Math.random() < pAce) {
      console.log(`  Serve cascade → in? ${(pServeIn * 100).toFixed(1)}% → hit | ace? ${(pAce * 100).toFixed(1)}% chance → hit! ACE`);
      return { outcome: PointType.ACE, thresholds };
    }

    console.log(`  Serve cascade → in? ${(pServeIn * 100).toFixed(1)}% → hit | ace? ${(pAce * 100).toFixed(1)}% → miss → IN_PLAY`);
    return { outcome: PointType.IN_PLAY, thresholds };
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
    opponentPosition?: CourtPosition,
    matchFatigue: number = 0,
    momentum: number = 0
  ): ShotModifiers {
    const stats = shooterProfile.stats;
    const playStyle = shooterProfile.playStyle;

    // Spin bonus for shots that benefit from spin
    let spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);

    // Placement bonus for precision shots
    const placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);

    // Physical modifiers (speed, agility, strength)
    let physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical, ballQuality);

    // Mental modifiers (focus, anticipation, shot variety)
    let mentalModifier = this.calculateMentalModifier(context, stats.mental, playStyle, opponentPosition);

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
    } else if (shotType === 'serve_second') {
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
    const ballQualityModifier = this.getBallQualityModifier(ballQuality, stats.physical, this.currentMatchLevel);
    const tacticalModifier = this.getTacticalModifier(shotType, tacticalOpportunity, opponentPosition);

    // Match-level modifiers
    const fatigueModifier = this.getFatigueModifier(matchFatigue);
    const momentumModifier = this.getMomentumModifier(momentum, stats.mental.focus);

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
      tacticalModifier *
      fatigueModifier *
      momentumModifier;

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
      fatigueModifier,
      momentumModifier,
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
    physical: PlayerStats['physical'],
    ballQuality?: BallQuality
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

    // Agility helps with net shots and quick reactions (check ballQuality for time pressure)
    const isRushed = ballQuality?.timeAvailable === 'rushed';
    if (SHOT_CLASSIFICATIONS.netShots.includes(shotType as any) || isRushed) {
      // 0 agility = 0.85x, 100 agility = 1.15x
      const agilityModifier = 0.85 + (physical.agility / 100) * 0.3;
      modifier *= agilityModifier;
    }

    return modifier;
  }

  /**
   * Calculate mental modifiers using sliding scales
   * Note: Opponent position is now tracked separately and doesn't use context
   */
  private calculateMentalModifier(
    context: ShotContext,
    mental: PlayerStats['mental'],
    playStyle: PlayStyle,
    opponentPosition?: CourtPosition
  ): number {
    let modifier = 1.0;

    // Anticipation helps when opponent is well-positioned (at net or excellent position)
    if (opponentPosition === 'at_net' || opponentPosition === 'well_positioned') {
      // 0 anticipation = 0.8x, 100 anticipation = 1.0x
      const anticipationModifier = 0.8 + (mental.anticipation / 100) * 0.2;
      modifier *= anticipationModifier;
    }

    // Shot variety helps with tactical shots
    // Note: This check isn't great, but we'll keep it for now
    const varietyModifier = 0.9 + (mental.shotVariety / 100) * 0.2;
    modifier *= varietyModifier;

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
   * Get match-level fatigue modifier
   * Fatigue 0 = 1.0x (no effect), fatigue 100 = 0.8x (20% penalty)
   */
  private getFatigueModifier(fatigue: number): number {
    return 1.0 - (fatigue / 100) * (1.0 - FATIGUE_MODIFIER.minModifier);
  }

  /**
   * Get momentum modifier based on current momentum and focus stat
   * Positive momentum gives a bonus, negative gives a penalty
   * Focus stat mitigates negative momentum effects
   */
  private getMomentumModifier(momentum: number, focusStat: number): number {
    if (momentum >= 0) {
      return 1.0 + (momentum / 100) * MOMENTUM_MODIFIER.maxBonus;
    }

    const rawPenalty = (-momentum / 100) * MOMENTUM_MODIFIER.maxPenalty;
    const mitigation = 1.0 - (focusStat / 100) * MOMENTUM_MODIFIER.focusMitigation;
    return 1.0 - rawPenalty * mitigation;
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
   * Apply ability additional effects to shot quality.
   * Small additive bonuses for specific shot types based on equipped abilities.
   */
  private applyAbilityEffects(
    quality: number,
    shotType: ShotType,
    modifiers: ShotModifiers,
    effects: Record<string, number>
  ): number {
    let bonus = 0;

    // pace: power shots hit harder
    const pace = effects['pace'] ?? 0;
    if (pace > 0 && shotType.includes('power')) {
      bonus += pace * 2;
    }

    // side_spin: enhanced spin effectiveness
    const sideSpin = effects['side_spin'] ?? 0;
    if (sideSpin > 0 && modifiers.spinBonus > 0) {
      bonus += sideSpin * modifiers.spinBonus * 0.15;
    }

    // touch: drop shots and volleys
    const touch = effects['touch'] ?? 0;
    if (touch > 0 && (shotType.includes('drop_shot') || shotType.includes('volley'))) {
      bonus += touch * 2;
    }

    // smash_power: overhead shots
    const smashPower = effects['smash_power'] ?? 0;
    if (smashPower > 0 && shotType.includes('overhead')) {
      bonus += smashPower * 3;
    }

    // perfect_timing: reduces pressure penalty impact
    const perfectTiming = effects['perfect_timing'] ?? 0;
    if (perfectTiming > 0 && modifiers.pressureModifier < 1) {
      // Recover some of the quality lost to pressure
      const pressureLoss = (1 - modifiers.pressureModifier) * quality;
      bonus += pressureLoss * perfectTiming * 0.03;
    }

    return Math.min(100, Math.max(0, quality + bonus));
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
    if (shotType.includes('drop')) return 'dropShot';
    if (shotType.includes('slice')) return 'slice';
    if (shotType.includes('return')) return 'return';
    if (shotType.includes('angle') || shotType.includes('lob')) return 'placement';

    return 'placement';
  }

  /**
   * Calculate ball quality from previous shot result and type
   * Derives spin, timeAvailable, and baseQuality from shot characteristics
   *
   * Ball quality represents the incoming ball's properties:
   * - spin: How the ball is spinning (affects bounce and trajectory)
   * - timeAvailable: How much time the opponent has to react
   * - baseQuality: Overall quality/difficulty of the incoming shot
   *
   * This is public so other components (like PointSimulator) can use it
   * to derive ball quality for RallyState
   */
  public calculateBallQuality(previousShot: ShotDetail, matchLevel: number = this.currentMatchLevel): BallQuality {
    const { shotType, quality } = previousShot;
    const thresholds = getQualityThresholds(matchLevel);

    // Derive spin from shot type
    let spin: BallQuality['spin'];
    if (shotType.includes('slice') || shotType.includes('defensive_slice')) {
      spin = 'slice';
    } else if (shotType.includes('topspin') || shotType.includes('kick')) {
      spin = quality >= thresholds.high ? 'heavy_topspin' : 'topspin';
    } else if (shotType.includes('power') || shotType.includes('serve_first')) {
      spin = 'flat';
    } else {
      spin = 'topspin'; // Default for most groundstrokes
    }

    // Derive time available from shot quality and type - ENHANCED
    let timeAvailable: BallQuality['timeAvailable'];

    // Power shots and aces give very little time
    if (shotType.includes('power') || shotType.includes('passing_shot')) {
      timeAvailable = quality >= thresholds.high ? 'rushed' : 'normal';
    }
    // Lobs give lots of time (high, arcing trajectory)
    else if (shotType.includes('lob')) {
      timeAvailable = 'plenty'; // Always plenty of time for lobs
    }
    // Drop shots also give time but opponent must cover distance
    else if (shotType.includes('drop_shot')) {
      timeAvailable = 'plenty'; // Short ball with time but requires movement
    }
    // Slice shots are slower, give more time
    else if (shotType.includes('slice') || shotType.includes('defensive')) {
      timeAvailable = 'plenty';
    }
    // Approach shots and volleys are typically aggressive
    else if (shotType.includes('approach') || shotType.includes('volley')) {
      timeAvailable = quality >= thresholds.high ? 'rushed' : 'normal';
    }
    // General quality-based determination
    else if (quality >= thresholds.exceptional) {
      timeAvailable = 'rushed'; // Elite shot
    } else if (quality < thresholds.average) {
      timeAvailable = 'plenty'; // Weak shot
    } else {
      timeAvailable = 'normal';
    }

    // Base quality is the shot quality with some randomness
    // Add shot-type specific modifiers
    let qualityModifier = 0;

    // Lobs and drop shots reduce perceived quality (easier to handle)
    if (shotType.includes('lob') && quality < thresholds.high) qualityModifier -= 5;
    if (shotType.includes('drop_shot') && quality < thresholds.good) qualityModifier -= 5;

    // Angle shots and passing shots increase difficulty
    if (shotType.includes('angle') || shotType.includes('passing')) qualityModifier += 5;

    const randomVariance = (Math.random() - 0.5) * 10; // ±5 points
    const baseQuality = Math.max(0, Math.min(100, quality + randomVariance + qualityModifier));

    return {
      spin,
      timeAvailable,
      baseQuality,
    };
  }

  /**
   * Get modifier based on incoming ball quality
   * High quality incoming shots are harder to handle
   */
  private getBallQualityModifier(
    ballQuality: BallQuality | undefined,
    physical: PlayerStats['physical'],
    matchLevel: number
  ): number {
    if (!ballQuality) return 1.0; // No penalty if not tracking ball quality

    const thresholds = getQualityThresholds(matchLevel);
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

    // High quality incoming shots are difficult (relative to match level)
    if (ballQuality.baseQuality >= thresholds.high) {
      modifier *= 0.85;
    } else if (ballQuality.baseQuality >= thresholds.good) {
      modifier *= 0.95;
    } else if (ballQuality.baseQuality < thresholds.weak) {
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
    if (shotType.includes('drop')) {
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
    explanation += `\nNOTE: Outcome determined by sigmoid probability curves around midpoints (varies by opponent)\n`;

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