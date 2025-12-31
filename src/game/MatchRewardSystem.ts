/**
 * Match Reward System
 *
 * Calculates rewards based on match performance across multiple categories.
 * All scoring formulas use configurable weights for easy balancing.
 */

import type { MatchStatistics } from '../types/index';
import type { MatchReward, PerformanceRewardBreakdown, StatBoosts, Ability } from '../types/game';
import type { Item } from '../types/items';
import { AbilityRarity } from '../types/game';
import type { OpponentTier, PerformanceLevel } from '../config/matchRewards';
import {
  TIER_REWARD_MULTIPLIERS,
  CATEGORY_STAT_BOOSTS,
  ABILITY_DROP_RATES,
  ITEM_DROP_RATES,
  ITEM_DROP_WIN_MULTIPLIER,
  BASE_EXPERIENCE,
  BASE_MOOD,
  MOOD_PERFORMANCE_BONUS,
} from '../config/matchRewards';
import {
  SERVING_WEIGHTS,
  RETURN_WEIGHTS,
  RALLY_WEIGHTS,
  NET_PLAY_WEIGHTS,
  MENTAL_WEIGHTS,
  PERFORMANCE_THRESHOLDS,
} from '../config/performanceScoring';
import { AbilitySystem } from './AbilitySystem';

export class MatchRewardSystem {
  /**
   * Main entry point: Calculate all rewards from a completed match
   */
  static calculateRewards(
    matchStatistics: MatchStatistics,
    opponentTier: OpponentTier,
    isWin: boolean
  ): MatchReward {
    // 1. Calculate performance scores for each category
    const performance = this.analyzePerformance(matchStatistics);

    // 2. Calculate stat boosts based on performance
    const statBoosts = this.calculateStatBoosts(
      performance,
      opponentTier,
      isWin
    );

    // 3. Roll for ability drops (win only)
    const abilities = isWin
      ? this.rollAbilityDrops(opponentTier)
      : [];

    // 4. Roll for item drops
    const items = this.rollItemDrops(opponentTier, isWin);

    // 5. Calculate mood and experience
    const { moodChange, experience } = this.calculateMoodAndExp(
      opponentTier,
      isWin,
      performance.overallScore
    );

    return {
      statBoosts,
      moodChange,
      experience,
      abilitiesGained: abilities,
      itemsGained: items,
      performanceBreakdown: performance,
    };
  }

  /**
   * Analyze performance using configurable weights
   */
  private static analyzePerformance(
    stats: MatchStatistics
  ): PerformanceRewardBreakdown {
    const servingScore = this.calculateServingScore(stats);
    const returningScore = this.calculateReturningScore(stats);
    const rallyScore = this.calculateRallyScore(stats);
    const netPlayScore = this.calculateNetPlayScore(stats);
    const mentalScore = this.calculateMentalScore(stats);

    const overallScore = (
      servingScore +
      returningScore +
      rallyScore +
      netPlayScore +
      mentalScore
    ) / 5;

    return {
      servingScore,
      returningScore,
      rallyScore,
      netPlayScore,
      mentalScore,
      overallScore,
      rewardedCategories: {},  // Filled in by calculateStatBoosts
    };
  }

  /**
   * Calculate serving performance score (0-100)
   */
  private static calculateServingScore(stats: MatchStatistics): number {
    const w = SERVING_WEIGHTS;

    // Aces contribution
    const aceBonus = Math.min(
      w.aceCap,
      stats.aces.player * w.acePoints
    );

    // Double fault penalty
    const dfPenalty = Math.max(
      w.doubleFaultCap,
      stats.doubleFaults.player * w.doubleFaultPenalty
    );

    // First serve percentage
    const firstServeScore = stats.firstServePercentage.player * w.firstServePercentWeight;

    // First serve points won
    const firstServeWins = stats.firstServePointsWon.player;
    const totalServePoints = stats.pointsWon.player.serve + stats.pointsWon.opponent.return;
    const firstServeWinRate = totalServePoints > 0
      ? firstServeWins / totalServePoints
      : 0;
    const firstServeWinBonus = Math.min(
      w.firstServeWinCap,
      firstServeWinRate * w.firstServeWinWeight
    );

    // Service hold bonus (based on break points faced vs saved)
    const breakPointsFaced = stats.breakPointOpportunities.opponent;
    const breakPointsSaved = breakPointsFaced - stats.breakPointsConverted.opponent;
    const holdRate = breakPointsFaced > 0 ? breakPointsSaved / breakPointsFaced : 1.0;
    const holdBonus = Math.min(w.serviceHoldCap, holdRate * w.serviceHoldWeight);

    const total = aceBonus + dfPenalty + firstServeScore + firstServeWinBonus + holdBonus;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate return performance score (0-100)
   */
  private static calculateReturningScore(stats: MatchStatistics): number {
    const w = RETURN_WEIGHTS;

    // Break points converted
    const breakPointBonus = Math.min(
      w.breakPointConversionCap,
      stats.breakPointsConverted.player * w.breakPointConversionPoints
    );

    // Return points won (normalized)
    const returnPointsWon = stats.pointsWon.player.return;
    const totalOpponentServePoints = stats.pointsWon.opponent.serve + stats.pointsWon.player.return;
    const returnWinRate = totalOpponentServePoints > 0
      ? returnPointsWon / totalOpponentServePoints
      : 0;

    // Normalize from 20-50% range to 0-60 points
    const normalizedReturnScore = Math.min(
      w.returnWinMaxPoints,
      Math.max(0, (returnWinRate - w.returnWinMinRate) / (w.returnWinMaxRate - w.returnWinMinRate) * w.returnWinMaxPoints)
    );

    // Return winners (from shot stats)
    // For now, estimate based on total winners proportional to return points
    const estimatedReturnWinners = Math.floor(
      stats.winners.player * (returnWinRate > 0 ? 0.3 : 0)
    );
    const returnWinnerBonus = Math.min(
      w.returnWinnerCap,
      estimatedReturnWinners * w.returnWinnerPoints
    );

    const total = breakPointBonus + normalizedReturnScore + returnWinnerBonus;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate rally performance score (0-100)
   */
  private static calculateRallyScore(stats: MatchStatistics): number {
    const w = RALLY_WEIGHTS;

    // Unforced error penalty
    const totalPoints = stats.totalPoints.player + stats.totalPoints.opponent;
    const unforcedErrorRate = totalPoints > 0
      ? stats.unforcedErrors.player / totalPoints
      : 0;
    const errorScore = w.unforcedErrorBase + (unforcedErrorRate * w.unforcedErrorWeight);

    // Long rally success
    const avgRallyWon = stats.averageRallyLengthWon.player;
    const longRallyBonus = avgRallyWon >= w.longRallyThreshold ? w.longRallyBonus : 0;

    // Winner to error ratio
    const winnerErrorRatio = stats.unforcedErrors.player > 0
      ? stats.winners.player / stats.unforcedErrors.player
      : stats.winners.player;

    let winnerErrorBonus = 0;
    if (winnerErrorRatio >= w.winnerErrorRatioExcellent) {
      winnerErrorBonus = w.winnerErrorRatioExcellentBonus;
    } else if (winnerErrorRatio >= w.winnerErrorRatioGood) {
      winnerErrorBonus = w.winnerErrorRatioGoodBonus;
    }

    // Stamina (longest rally performance)
    const staminaBonus = stats.longestRallyWon.player > stats.longestRallyWon.opponent
      ? w.staminaBonus
      : 0;

    const total = errorScore + longRallyBonus + winnerErrorBonus + staminaBonus;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate net play performance score (0-100)
   */
  private static calculateNetPlayScore(stats: MatchStatistics): number {
    const w = NET_PLAY_WEIGHTS;

    // Net points won
    const netPointBonus = Math.min(
      w.netPointWonCap,
      stats.netPointsWon.player * w.netPointWonPoints
    );

    // Volley success rate (estimated from net points vs attempts)
    // If we had more than 5 net points, assume reasonable volley attempts
    const volleyAttempts = stats.netPointsWon.player + stats.netPointsWon.opponent;
    const volleySuccess = volleyAttempts > 0
      ? stats.netPointsWon.player / volleyAttempts
      : 0;
    const volleySuccessBonus = volleySuccess * w.volleySuccessWeight;

    // Approach shot success (estimate from net points)
    const approachShots = Math.floor(stats.netPointsWon.player * 0.8); // Assume 80% of net points had approach
    const approachBonus = Math.min(
      w.approachShotCap,
      approachShots * w.approachShotPoints
    );

    const total = netPointBonus + volleySuccessBonus + approachBonus;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate mental performance score (0-100)
   */
  private static calculateMentalScore(
    stats: MatchStatistics
  ): number {
    const w = MENTAL_WEIGHTS;

    // Key moments (we don't have this in the stats yet, so skip for now)
    const keyMomentBonus = 0;

    // Break points saved (when serving)
    const breakPointsFaced = stats.breakPointOpportunities.opponent;
    const breakPointsSaved = breakPointsFaced - stats.breakPointsConverted.opponent;
    const breakPointSaveBonus = Math.min(
      w.breakPointSaveCap,
      breakPointsSaved * w.breakPointSavePoints
    );

    // Clutch performance (based on break points converted - offensive pressure)
    const clutchBonus = stats.breakPointsConverted.player > 0 ? w.clutchComebackBonus : 0;

    // Pressure points performance (use break points as proxy for pressure situations)
    const totalPressurePoints = stats.breakPointsConverted.player + breakPointsSaved;
    const pressureScore = totalPressurePoints * w.pressurePerformanceWeight;

    const total = keyMomentBonus + breakPointSaveBonus + clutchBonus + pressureScore;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Convert performance scores to stat boosts
   */
  private static calculateStatBoosts(
    performance: PerformanceRewardBreakdown,
    tier: OpponentTier,
    isWin: boolean
  ): StatBoosts {
    const multiplier = isWin
      ? TIER_REWARD_MULTIPLIERS[tier].win
      : TIER_REWARD_MULTIPLIERS[tier].loss;

    console.log('=== STAT BOOST CALCULATION ===');
    console.log('Tier:', tier, 'IsWin:', isWin, 'Multiplier:', multiplier);

    const allBoosts: StatBoosts = {};

    // For each performance category, determine level and add boosts
    const categories = {
      serving: performance.servingScore,
      returning: performance.returningScore,
      rallying: performance.rallyScore,
      netPlay: performance.netPlayScore,
      mental: performance.mentalScore,
    };

    for (const [category, score] of Object.entries(categories)) {
      const performanceLevel = this.getPerformanceLevel(score);
      const categoryBoosts = CATEGORY_STAT_BOOSTS[category][performanceLevel];

      console.log(`Category: ${category}, Score: ${score}, Level: ${performanceLevel}`);
      console.log('Base category boosts:', categoryBoosts);

      if (Object.keys(categoryBoosts).length > 0) {
        // Apply tier multiplier and merge boosts
        for (const [stat, value] of Object.entries(categoryBoosts)) {
          const boostedValue = Math.round(value * multiplier);
          console.log(`  ${stat}: ${value} * ${multiplier} = ${boostedValue}`);
          const statKey = stat as keyof StatBoosts;
          allBoosts[statKey] = (allBoosts[statKey] || 0) + boostedValue;
        }

        // Track which categories gave rewards (for UI display)
        performance.rewardedCategories[category as keyof typeof performance.rewardedCategories] = categoryBoosts;
      }
    }

    console.log('Final allBoosts:', allBoosts);
    return allBoosts;
  }

  /**
   * Determine performance level from score
   */
  private static getPerformanceLevel(score: number): PerformanceLevel {
    if (score >= PERFORMANCE_THRESHOLDS.excellent) return 'excellent';
    if (score >= PERFORMANCE_THRESHOLDS.good) return 'good';
    if (score >= PERFORMANCE_THRESHOLDS.average) return 'average';
    return 'bad';
  }

  /**
   * Roll for ability drops (only on win)
   */
  private static rollAbilityDrops(tier: OpponentTier): Ability[] {
    const abilities: Ability[] = [];
    const dropRates = ABILITY_DROP_RATES[tier];

    // Roll for each rarity tier
    for (const [rarity, rate] of Object.entries(dropRates)) {
      if (rate > 0 && Math.random() * 100 < rate) {
        const ability = AbilitySystem.getRandomAbilityByRarity(rarity as AbilityRarity);
        if (ability) {
          abilities.push(ability);
        }
      }
    }

    return abilities;
  }

  /**
   * Roll for item drops
   */
  private static rollItemDrops(tier: OpponentTier, isWin: boolean): Item[] {
    const baseRate = ITEM_DROP_RATES[tier];
    const finalRate = isWin ? baseRate * ITEM_DROP_WIN_MULTIPLIER : baseRate * 0.5;

    if (Math.random() * 100 < finalRate) {
      // TODO: Implement item system
      // For now, return empty array
      return [];
    }

    return [];
  }

  /**
   * Calculate mood and experience rewards
   */
  private static calculateMoodAndExp(
    tier: OpponentTier,
    isWin: boolean,
    overallScore: number
  ): { moodChange: number; experience: number } {
    const baseMood = isWin ? BASE_MOOD.win : BASE_MOOD.loss;
    const performanceLevel = this.getPerformanceLevel(overallScore);
    const moodBonus = MOOD_PERFORMANCE_BONUS[performanceLevel];

    const baseExp = isWin ? BASE_EXPERIENCE.win : BASE_EXPERIENCE.loss;
    const tierMultiplier = TIER_REWARD_MULTIPLIERS[tier][isWin ? 'win' : 'loss'];

    return {
      moodChange: baseMood + moodBonus,
      experience: Math.round(baseExp * tierMultiplier),
    };
  }
}
