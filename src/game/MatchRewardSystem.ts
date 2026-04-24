/**
 * Match Reward System
 *
 * Calculates rewards based on match performance across multiple categories.
 * Performance scores drive experience and drop rate scaling — no direct stat awards.
 */

import type { MatchStatistics } from '../types/index';
import type { MatchReward, PerformanceRewardBreakdown, ExperienceBreakdown, Ability } from '../types/game';
import type { Item } from '../types/items';
import { AbilityRarity } from '../types/game';
import type { OpponentTier, PerformanceLevel } from '../config/matchRewards';
import {
  TIER_REWARD_MULTIPLIERS,
  ABILITY_DROP_RATES,
  ITEM_DROP_RATES,
  ITEM_DROP_WIN_MULTIPLIER,
  BASE_EXPERIENCE,
  BASE_MOOD,
  MOOD_PERFORMANCE_BONUS,
  PERFORMANCE_EXP_MAX_BONUS,
  PERFORMANCE_DROP_MULTIPLIER_MIN,
  PERFORMANCE_DROP_MULTIPLIER_MAX,
} from '../config/matchRewards';
import {
  SERVING_WEIGHTS,
  RETURN_WEIGHTS,
  RALLY_WEIGHTS,
  NET_PLAY_WEIGHTS,
  MENTAL_WEIGHTS,
  OVERALL_SCORE_WEIGHTS,
  PERFORMANCE_THRESHOLDS,
} from '../config/performanceScoring';
import { getRandomItem, getItemsByTier } from '../data/items';
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

    // 2. Calculate performance drop multiplier (0.5–1.5× based on overall score)
    const dropMultiplier = this.calculateDropMultiplier(performance.overallScore);

    // 3. Roll for ability drops (win only), scaled by performance
    const abilities = isWin
      ? this.rollAbilityDrops(opponentTier, dropMultiplier)
      : [];

    // 4. Roll for item drops, scaled by performance
    const items = this.rollItemDrops(opponentTier, isWin, dropMultiplier);

    // 5. Calculate mood, experience, and XP breakdown
    const { moodChange, experience, experienceBreakdown } = this.calculateMoodAndExp(
      opponentTier,
      isWin,
      performance.overallScore
    );

    return {
      moodChange,
      experience,
      experienceBreakdown,
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
      servingScore   * OVERALL_SCORE_WEIGHTS.serving +
      returningScore * OVERALL_SCORE_WEIGHTS.returning +
      rallyScore     * OVERALL_SCORE_WEIGHTS.rallying +
      netPlayScore   * OVERALL_SCORE_WEIGHTS.netPlay +
      mentalScore    * OVERALL_SCORE_WEIGHTS.mental
    );

    console.log('=== PERFORMANCE ANALYSIS SUMMARY ===');
    console.log(`Serving:   ${servingScore.toFixed(1)} × ${OVERALL_SCORE_WEIGHTS.serving} = ${(servingScore * OVERALL_SCORE_WEIGHTS.serving).toFixed(1)}`);
    console.log(`Returning: ${returningScore.toFixed(1)} × ${OVERALL_SCORE_WEIGHTS.returning} = ${(returningScore * OVERALL_SCORE_WEIGHTS.returning).toFixed(1)}`);
    console.log(`Rally:     ${rallyScore.toFixed(1)} × ${OVERALL_SCORE_WEIGHTS.rallying} = ${(rallyScore * OVERALL_SCORE_WEIGHTS.rallying).toFixed(1)}`);
    console.log(`Net Play:  ${netPlayScore.toFixed(1)} × ${OVERALL_SCORE_WEIGHTS.netPlay} = ${(netPlayScore * OVERALL_SCORE_WEIGHTS.netPlay).toFixed(1)}`);
    console.log(`Mental:    ${mentalScore.toFixed(1)} × ${OVERALL_SCORE_WEIGHTS.mental} = ${(mentalScore * OVERALL_SCORE_WEIGHTS.mental).toFixed(1)}`);
    console.log(`OVERALL:   ${overallScore.toFixed(1)}`);

    return {
      servingScore,
      returningScore,
      rallyScore,
      netPlayScore,
      mentalScore,
      overallScore,
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

    // First serve percentage — normalized from min-max range so it doesn't dominate.
    // e.g. 40% → 0pts, 57.5% → 15pts, 75% → 30pts
    const firstServePct = stats.firstServePercentage.player;
    const firstServeScore = Math.min(
      w.firstServePercentMaxPoints,
      Math.max(0, (firstServePct - w.firstServePercentMin) /
        (w.firstServePercentMax - w.firstServePercentMin) * w.firstServePercentMaxPoints)
    );

    // First serve points won rate
    const totalServePoints = stats.pointsWon.player.serve + stats.pointsWon.opponent.return;
    const firstServeWinRate = totalServePoints > 0
      ? stats.firstServePointsWon.player / totalServePoints
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

    console.log('=== SERVING SCORE BREAKDOWN ===');
    console.log(`Aces: ${stats.aces.player} × ${w.acePoints} = ${aceBonus.toFixed(1)} (cap ${w.aceCap})`);
    console.log(`Double faults: ${stats.doubleFaults.player} × ${w.doubleFaultPenalty} = ${dfPenalty.toFixed(1)} (cap ${w.doubleFaultCap})`);
    console.log(`First serve %: ${firstServePct.toFixed(1)}% → ${firstServeScore.toFixed(1)}pts (range ${w.firstServePercentMin}-${w.firstServePercentMax}%, max ${w.firstServePercentMaxPoints}pts)`);
    console.log(`First serve win rate: ${(firstServeWinRate * 100).toFixed(1)}% → ${firstServeWinBonus.toFixed(1)}pts (cap ${w.firstServeWinCap})`);
    console.log(`Hold rate: ${breakPointsSaved}/${breakPointsFaced} saved = ${(holdRate * 100).toFixed(1)}% → ${holdBonus.toFixed(1)}pts (cap ${w.serviceHoldCap})`);
    console.log(`SERVING TOTAL: ${total.toFixed(1)} → clamped: ${Math.max(0, Math.min(100, total)).toFixed(1)}`);

    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate return performance score (0-100)
   */
  private static calculateReturningScore(stats: MatchStatistics): number {
    const w = RETURN_WEIGHTS;

    // Break point conversion rate — rewards actually winning your break chances.
    // e.g. 0/3 BP = 0pts, 2/4 BP = 15pts, 3/3 BP = 30pts
    const bpOpportunities = stats.breakPointOpportunities.player;
    const bpConversionRate = bpOpportunities > 0
      ? stats.breakPointsConverted.player / bpOpportunities
      : 0;
    const breakPointBonus = bpConversionRate * w.breakPointConversionRatePoints;

    // Small bonus for creating break point opportunities (volume of pressure)
    const bpCreatedBonus = Math.min(
      w.breakOpportunityCap,
      bpOpportunities * w.breakOpportunityPoints
    );

    // Return points won (normalized from 25-50% range to 0-50 points)
    const returnPointsWon = stats.pointsWon.player.return;
    const totalOpponentServePoints = stats.pointsWon.opponent.serve + stats.pointsWon.player.return;
    const returnWinRate = totalOpponentServePoints > 0
      ? returnPointsWon / totalOpponentServePoints
      : 0;
    const normalizedReturnScore = Math.min(
      w.returnWinMaxPoints,
      Math.max(0, (returnWinRate - w.returnWinMinRate) / (w.returnWinMaxRate - w.returnWinMinRate) * w.returnWinMaxPoints)
    );

    const total = breakPointBonus + bpCreatedBonus + normalizedReturnScore;

    console.log('=== RETURNING SCORE BREAKDOWN ===');
    console.log(`Break point conversion: ${stats.breakPointsConverted.player}/${bpOpportunities} = ${(bpConversionRate * 100).toFixed(1)}% → ${breakPointBonus.toFixed(1)}pts (max ${w.breakPointConversionRatePoints})`);
    console.log(`Break opportunities created: ${bpOpportunities} × ${w.breakOpportunityPoints} = ${bpCreatedBonus.toFixed(1)}pts (cap ${w.breakOpportunityCap})`);
    console.log(`Return win rate: ${returnPointsWon}/${totalOpponentServePoints} = ${(returnWinRate * 100).toFixed(1)}% → ${normalizedReturnScore.toFixed(1)}pts (range ${w.returnWinMinRate * 100}-${w.returnWinMaxRate * 100}%, max ${w.returnWinMaxPoints}pts)`);
    console.log(`RETURNING TOTAL: ${total.toFixed(1)} → clamped: ${Math.max(0, Math.min(100, total)).toFixed(1)}`);

    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate rally performance score (0-100)
   */
  private static calculateRallyScore(stats: MatchStatistics): number {
    const w = RALLY_WEIGHTS;

    // Rally win rate — primary metric (0-50 points).
    // Only counts points where the rally extended past serve + return (shot count > 2).
    // Normalized so 50% = 25pts (you're trading evenly), 70%+ = 50pts.
    const rallyPointsPlayed = stats.rallyPointsPlayed.player;
    const rallyWinRate = rallyPointsPlayed > 0
      ? stats.rallyPointsWon.player / rallyPointsPlayed
      : 0.5; // no rallies → neutral
    const rallyWinScore = Math.min(
      w.rallyWinRateMaxPoints,
      Math.max(0, (rallyWinRate - w.rallyWinRateMinRate) /
        (w.rallyWinRateMaxRate - w.rallyWinRateMinRate) * w.rallyWinRateMaxPoints)
    );

    // Consistency: unforced error rate penalty (0-30 points).
    const totalPoints = stats.totalPoints.player + stats.totalPoints.opponent;
    const unforcedErrorRate = totalPoints > 0
      ? stats.unforcedErrors.player / totalPoints
      : 0;
    const consistencyScore = Math.min(
      w.unforcedErrorMaxPoints,
      Math.max(0, w.unforcedErrorBase + (unforcedErrorRate * w.unforcedErrorWeight))
    );

    // Aggression: winner rate normalized from 5-25% of total points (0-20 points).
    const winnerRate = totalPoints > 0 ? stats.winners.player / totalPoints : 0;
    const aggressionScore = Math.min(
      w.winnerRateMaxPoints,
      Math.max(0, (winnerRate - w.winnerRateMinRate) /
        (w.winnerRateMaxRate - w.winnerRateMinRate) * w.winnerRateMaxPoints)
    );

    const total = rallyWinScore + consistencyScore + aggressionScore;

    console.log('=== RALLY SCORE BREAKDOWN ===');
    console.log(`Rally win rate: ${stats.rallyPointsWon.player}/${rallyPointsPlayed} = ${(rallyWinRate * 100).toFixed(1)}% → ${rallyWinScore.toFixed(1)}pts (range ${w.rallyWinRateMinRate * 100}-${w.rallyWinRateMaxRate * 100}%, max ${w.rallyWinRateMaxPoints}pts)`);
    console.log(`Unforced errors: ${stats.unforcedErrors.player}/${totalPoints} total pts = ${(unforcedErrorRate * 100).toFixed(1)}% error rate → ${consistencyScore.toFixed(1)}pts (formula: ${w.unforcedErrorBase} + ${unforcedErrorRate.toFixed(3)} × ${w.unforcedErrorWeight}, max ${w.unforcedErrorMaxPoints}pts)`);
    console.log(`Winner rate: ${stats.winners.player}/${totalPoints} = ${(winnerRate * 100).toFixed(1)}% → ${aggressionScore.toFixed(1)}pts (range ${w.winnerRateMinRate * 100}-${w.winnerRateMaxRate * 100}%, max ${w.winnerRateMaxPoints}pts)`);
    console.log(`RALLY TOTAL: ${total.toFixed(1)} → clamped: ${Math.max(0, Math.min(100, total)).toFixed(1)}`);

    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate net play performance score (0-100)
   */
  private static calculateNetPlayScore(stats: MatchStatistics): number {
    const w = NET_PLAY_WEIGHTS;

    const totalNetPoints = stats.netPointsWon.player + stats.netPointsWon.opponent;

    if (totalNetPoints === 0) {
      console.log('=== NET PLAY SCORE BREAKDOWN ===');
      console.log('No net points played → score: 0');
      return 0;
    }

    // Net point win rate — primary metric (0-75 points).
    const netWinRate = stats.netPointsWon.player / totalNetPoints;
    const netWinRateScore = netWinRate * w.netWinRateMaxPoints;

    // Volume bonus — small reward for actively attacking net (0-25 points).
    const volumeBonus = Math.min(
      w.netVolumeCap,
      stats.netPointsWon.player * w.netVolumePoints
    );

    // Scale the entire score by volume. Below the threshold, a player who only
    // approached a handful of times scores low regardless of their success rate —
    // net play just wasn't a meaningful part of their match.
    const volumeScale = Math.min(1, totalNetPoints / w.netVolumeScaleThreshold);

    const total = (netWinRateScore + volumeBonus) * volumeScale;

    console.log('=== NET PLAY SCORE BREAKDOWN ===');
    console.log(`Net win rate: ${stats.netPointsWon.player}/${totalNetPoints} = ${(netWinRate * 100).toFixed(1)}% → ${netWinRateScore.toFixed(1)}pts (max ${w.netWinRateMaxPoints})`);
    console.log(`Volume bonus: ${stats.netPointsWon.player} won × ${w.netVolumePoints} = ${volumeBonus.toFixed(1)}pts (cap ${w.netVolumeCap})`);
    console.log(`Volume scale: ${totalNetPoints}/${w.netVolumeScaleThreshold} = ${volumeScale.toFixed(2)} (pre-scale total: ${(netWinRateScore + volumeBonus).toFixed(1)})`);
    console.log(`NET PLAY TOTAL: ${total.toFixed(1)} → clamped: ${Math.max(0, Math.min(100, total)).toFixed(1)}`);

    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate mental performance score (0-100)
   */
  private static calculateMentalScore(stats: MatchStatistics): number {
    const w = MENTAL_WEIGHTS;

    // Key moment win rate — primary mental metric (0-70 points).
    // e.g. 3/5 key moments won = 60% rate = 42pts, 5/5 = 70pts, 0/5 = 0pts.
    const totalKeyMoments = stats.keyMomentsWon.player + stats.keyMomentsWon.opponent;
    const keyMomentWinRate = totalKeyMoments > 0
      ? stats.keyMomentsWon.player / totalKeyMoments
      : 0.5; // no key moments occurred → neutral
    const keyMomentScore = keyMomentWinRate * w.keyMomentWinRatePoints;

    // Break points saved (when serving) — bonus for holding under pressure (0-30 points).
    const breakPointsFaced = stats.breakPointOpportunities.opponent;
    const breakPointsSaved = breakPointsFaced - stats.breakPointsConverted.opponent;
    const breakPointSaveBonus = Math.min(
      w.breakPointSaveCap,
      breakPointsSaved * w.breakPointSavePoints
    );

    const total = keyMomentScore + breakPointSaveBonus;

    console.log('=== MENTAL SCORE BREAKDOWN ===');
    console.log(`Key moments: ${stats.keyMomentsWon.player}/${totalKeyMoments} = ${(keyMomentWinRate * 100).toFixed(1)}% → ${keyMomentScore.toFixed(1)}pts (max ${w.keyMomentWinRatePoints})`);
    console.log(`Break points saved: ${breakPointsSaved}/${breakPointsFaced} → ${breakPointSaveBonus.toFixed(1)}pts (${w.breakPointSavePoints}pts each, cap ${w.breakPointSaveCap})`);
    console.log(`MENTAL TOTAL: ${total.toFixed(1)} → clamped: ${Math.max(0, Math.min(100, total)).toFixed(1)}`);

    return Math.max(0, Math.min(100, total));
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
   * Calculate the drop rate multiplier from overall performance score.
   * Linearly interpolates between MIN and MAX based on 0–100 score.
   */
  private static calculateDropMultiplier(overallScore: number): number {
    return PERFORMANCE_DROP_MULTIPLIER_MIN +
      (overallScore / 100) * (PERFORMANCE_DROP_MULTIPLIER_MAX - PERFORMANCE_DROP_MULTIPLIER_MIN);
  }

  /**
   * Roll for ability drops (only on win), scaled by performance
   */
  private static rollAbilityDrops(tier: OpponentTier, dropMultiplier: number): Ability[] {
    const abilities: Ability[] = [];
    const dropRates = ABILITY_DROP_RATES[tier];

    console.log('Ability drop rates:', dropRates, 'dropMultiplier:', dropMultiplier.toFixed(2));

    // Roll for each rarity tier
    for (const [rarity, rate] of Object.entries(dropRates)) {
      const scaledRate = rate * dropMultiplier;
      const roll = Math.random() * 100;
      if (scaledRate > 0 && roll < scaledRate) {
        console.log(`Rolled ability drop: ${rarity} (rate ${scaledRate.toFixed(2)}%, roll ${roll.toFixed(2)}%)`);
        const ability = AbilitySystem.getRandomAbilityByRarity(rarity as AbilityRarity);
        if (ability) {
          abilities.push(ability);
        }
      }
    }

    return abilities;
  }

  /**
   * Roll for item drops, scaled by performance
   */
  private static rollItemDrops(tier: OpponentTier, isWin: boolean, dropMultiplier: number): Item[] {
    const baseRate = ITEM_DROP_RATES[tier];
    const winModifier = isWin ? ITEM_DROP_WIN_MULTIPLIER : 0.5;
    const finalRate = baseRate * winModifier * dropMultiplier;

    const roll = Math.random() * 100;

    if (roll < finalRate) {
      const availableItems = getItemsByTier(tier);
      const item = getRandomItem(availableItems);

      console.log(`[Match Rewards] Item dropped! ${item.name} (${roll.toFixed(2)}% < ${finalRate.toFixed(2)}%)`);

      return [item];
    }

    console.log(`[Match Rewards] No item drop (${roll.toFixed(2)}% >= ${finalRate.toFixed(2)}%)`);
    return [];
  }

  /**
   * Calculate mood and experience rewards.
   * Experience = flat base (win/loss) + performance bonus scaled by tier multiplier.
   */
  private static calculateMoodAndExp(
    tier: OpponentTier,
    isWin: boolean,
    overallScore: number
  ): { moodChange: number; experience: number; experienceBreakdown: ExperienceBreakdown } {
    const baseMood = isWin ? BASE_MOOD.win : BASE_MOOD.loss;
    const performanceLevel = this.getPerformanceLevel(overallScore);
    const moodBonus = MOOD_PERFORMANCE_BONUS[performanceLevel];

    const base = isWin ? BASE_EXPERIENCE.win : BASE_EXPERIENCE.loss;
    const tierMultiplier = TIER_REWARD_MULTIPLIERS[tier][isWin ? 'win' : 'loss'];
    const performanceBonus = Math.round((overallScore / 100) * PERFORMANCE_EXP_MAX_BONUS * tierMultiplier);
    const total = base + performanceBonus;

    console.log(`=== EXPERIENCE BREAKDOWN ===`);
    console.log(`Base (${isWin ? 'win' : 'loss'}): ${base}`);
    console.log(`Performance bonus: overallScore ${overallScore.toFixed(1)} × ${PERFORMANCE_EXP_MAX_BONUS} × tier ${tierMultiplier} = ${performanceBonus}`);
    console.log(`Total XP: ${total}`);

    return {
      moodChange: baseMood + moodBonus,
      experience: total,
      experienceBreakdown: {
        base,
        performanceBonus,
        tierMultiplier,
        total,
      },
    };
  }
}
