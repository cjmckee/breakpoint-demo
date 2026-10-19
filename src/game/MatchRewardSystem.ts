/**
 * Match Reward System
 *
 * Calculates rewards based on match performance across multiple categories.
 * Performance scores drive experience, drop rate scaling and the currency payout
 * (CurrencyIncome.matchPayout) — no direct stat awards.
 */

import type { MatchStatistics } from '../types/index';
import type {
  MatchReward,
  PerformanceRewardBreakdown,
  ExperienceBreakdown,
  Ability,
} from '../types/game';
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
  CLUTCH_BLEND,
  COVERAGE_BLEND,
  NET_FULL_WEIGHT_APPROACHES,
  PERFORMANCE_AREAS,
  PERFORMANCE_PRIOR_POINTS,
  PERFORMANCE_RANGES,
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_WEIGHTS,
  type PerformanceArea,
} from '../config/performanceScoring';
import { getRandomItem, getItemsByTier } from '../data/items';
import { AbilitySystem } from './AbilitySystem';
import { matchPayout } from './CurrencyIncome';

import { random } from '../core/random';
export class MatchRewardSystem {
  /**
   * Main entry point: Calculate all rewards from a completed match
   */
  static calculateRewards(
    matchStatistics: MatchStatistics,
    opponentTier: OpponentTier,
    isWin: boolean,
    abilityDropBonus: number = 0,
  ): MatchReward {
    // 1. Calculate performance scores for each category
    const performance = this.analyzePerformance(matchStatistics);

    // 2. Calculate performance drop multiplier (0.5–1.5× based on overall score)
    const dropMultiplier = this.calculateDropMultiplier(performance.overallScore);

    // 3. Roll for ability drops (win only), scaled by performance.
    //    EffectKey.ABILITY_DROP_BONUS scales the performance multiplier rather than
    //    adding to it. Added, its worth would depend on how well you played — +30%
    //    after a bad match, +10% after a great one — while the item card shows a
    //    flat "+15%". Multiplying makes the number on the card the number you get.
    const abilities = isWin
      ? this.rollAbilityDrops(opponentTier, dropMultiplier * (1 + abilityDropBonus))
      : [];

    // 4. Roll for item drops, scaled by performance
    const items = this.rollItemDrops(opponentTier, isWin, dropMultiplier);

    // 5. Calculate mood, experience, and XP breakdown
    const { moodChange, experience, experienceBreakdown } = this.calculateMoodAndExp(
      opponentTier,
      isWin,
      performance.overallScore,
    );

    return {
      moodChange,
      experience,
      experienceBreakdown,
      abilitiesGained: abilities,
      itemsGained: items,
      performanceBreakdown: performance,
      currency: matchPayout(performance, isWin),
    };
  }

  /**
   * Rate the match area by area: each area is the share of its points the player won,
   * pulled toward even on a small sample and mapped onto 0-100 (PERFORMANCE_RANGES).
   */
  static analyzePerformance(stats: MatchStatistics): PerformanceRewardBreakdown {
    const share = (area: PerformanceArea, won: number, played: number): number => {
      const prior = PERFORMANCE_PRIOR_POINTS[area];
      return (won + prior / 2) / (played + prior);
    };
    const score = (area: PerformanceArea, s: number): number => {
      const { zero, full } = PERFORMANCE_RANGES[area];
      return Math.max(0, Math.min(100, ((s - zero) / (full - zero)) * 100));
    };

    // A double fault is a service point lost and a return point won, though pointsWon
    // credits no one with the return.
    const servePlayed =
      stats.pointsWon.player.serve + stats.pointsWon.opponent.return + stats.doubleFaults.player;
    const returnPlayed =
      stats.pointsWon.opponent.serve + stats.pointsWon.player.return + stats.doubleFaults.opponent;
    const outplayed = stats.rallyPointsOutplayed;
    const bpPlayed = stats.breakPointOpportunities.player + stats.breakPointOpportunities.opponent;
    const bpWon =
      stats.breakPointsConverted.player +
      (stats.breakPointOpportunities.opponent - stats.breakPointsConverted.opponent);
    const keyMoments = stats.keyMomentsWon.player + stats.keyMomentsWon.opponent;

    const areas: Record<PerformanceArea, number> = {
      serve: score('serve', share('serve', stats.pointsWon.player.serve, servePlayed)),
      return: score(
        'return',
        share('return', stats.pointsWon.player.return + stats.doubleFaults.opponent, returnPlayed),
      ),
      baseline: score(
        'baseline',
        share('baseline', stats.rallyPointsWon.player, stats.rallyPointsPlayed.player),
      ),
      net: score('net', share('net', stats.netPointsWon.player, stats.netPointsPlayed.player)),
      coverage: score(
        'coverage',
        COVERAGE_BLEND.longRallies *
          share('coverage', stats.longRallyPointsWon.player, stats.longRallyPointsPlayed) +
          COVERAGE_BLEND.outplayed *
            share('coverage', outplayed.opponent, outplayed.player + outplayed.opponent),
      ),
      clutch: score(
        'clutch',
        CLUTCH_BLEND.keyMoments * share('clutch', stats.keyMomentsWon.player, keyMoments) +
          CLUTCH_BLEND.breakPoints * share('clutch', bpWon, bpPlayed),
      ),
    };

    // Net play counts in full only for a player who came in often enough.
    const raw: Record<PerformanceArea, number> = {
      ...PERFORMANCE_WEIGHTS,
      net:
        PERFORMANCE_WEIGHTS.net *
        Math.min(1, stats.netPointsPlayed.player / NET_FULL_WEIGHT_APPROACHES),
    };
    const total = PERFORMANCE_AREAS.reduce((sum, a) => sum + raw[a], 0);
    const weights = Object.fromEntries(PERFORMANCE_AREAS.map((a) => [a, raw[a] / total])) as Record<
      PerformanceArea,
      number
    >;
    const overallScore = PERFORMANCE_AREAS.reduce((sum, a) => sum + areas[a] * weights[a], 0);

    console.log(
      '[Performance]',
      PERFORMANCE_AREAS.map((a) => `${a} ${areas[a].toFixed(0)}`).join(', '),
      `→ overall ${overallScore.toFixed(1)}`,
    );

    return { areas, weights, overallScore };
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
    return (
      PERFORMANCE_DROP_MULTIPLIER_MIN +
      (overallScore / 100) * (PERFORMANCE_DROP_MULTIPLIER_MAX - PERFORMANCE_DROP_MULTIPLIER_MIN)
    );
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
      const roll = random() * 100;
      if (scaledRate > 0 && roll < scaledRate) {
        console.log(
          `Rolled ability drop: ${rarity} (rate ${scaledRate.toFixed(2)}%, roll ${roll.toFixed(2)}%)`,
        );
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

    const roll = random() * 100;

    if (roll < finalRate) {
      const availableItems = getItemsByTier(tier);
      const item = getRandomItem(availableItems);

      console.log(
        `[Match Rewards] Item dropped! ${item.name} (${roll.toFixed(2)}% < ${finalRate.toFixed(2)}%)`,
      );

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
    overallScore: number,
  ): { moodChange: number; experience: number; experienceBreakdown: ExperienceBreakdown } {
    const baseMood = isWin ? BASE_MOOD.win : BASE_MOOD.loss;
    const performanceLevel = this.getPerformanceLevel(overallScore);
    const moodBonus = MOOD_PERFORMANCE_BONUS[performanceLevel];

    const base = isWin ? BASE_EXPERIENCE.win : BASE_EXPERIENCE.loss;
    const tierMultiplier = TIER_REWARD_MULTIPLIERS[tier][isWin ? 'win' : 'loss'];
    const performanceBonus = Math.round(
      (overallScore / 100) * PERFORMANCE_EXP_MAX_BONUS * tierMultiplier,
    );
    const total = base + performanceBonus;

    console.log(`=== EXPERIENCE BREAKDOWN ===`);
    console.log(`Base (${isWin ? 'win' : 'loss'}): ${base}`);
    console.log(
      `Performance bonus: overallScore ${overallScore.toFixed(1)} × ${PERFORMANCE_EXP_MAX_BONUS} × tier ${tierMultiplier} = ${performanceBonus}`,
    );
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
