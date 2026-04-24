/**
 * Match Reward Configuration
 *
 * Controls reward multipliers, drop rates, and experience scaling.
 * All values are easily tunable to balance progression.
 */

import { AbilityRarity } from '../types/game';

// ============================================================================
// MATCH ENERGY COST
// ============================================================================
export const DEFAULT_MATCH_ENERGY_COST = 50;

// ============================================================================
// KEY MOMENTS PER MATCH
// ============================================================================
export const DEFAULT_KEY_MOMENTS_PER_MATCH = 16;

// ============================================================================
// OPPONENT TIER TYPE
// ============================================================================
export type OpponentTier = 1 | 2 | 3 | 4;

export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'bad';

// ============================================================================
// TIER MULTIPLIERS
// ============================================================================
export const TIER_REWARD_MULTIPLIERS: Record<OpponentTier, {
  win: number;
  loss: number;
}> = {
  1: { win: 1, loss: 1 },     // Club Player
  2: { win: 2, loss: 1 },     // Regional Competitor
  3: { win: 3, loss: 1 },     // Tour Professional
  4: { win: 4, loss: 2 },     // World Champion
};

// ============================================================================
// ABILITY DROP RATES (% chance per rarity)
// ============================================================================
export const ABILITY_DROP_RATES: Record<OpponentTier, Record<AbilityRarity, number>> = {
  1: {
    [AbilityRarity.COMMON]: 5,
    [AbilityRarity.UNCOMMON]: 0,
    [AbilityRarity.RARE]: 0,
    [AbilityRarity.LEGENDARY]: 0
  },
  2: {
    [AbilityRarity.COMMON]: 10,
    [AbilityRarity.UNCOMMON]: 3,
    [AbilityRarity.RARE]: 0,
    [AbilityRarity.LEGENDARY]: 0
  },
  3: {
    [AbilityRarity.COMMON]: 15,
    [AbilityRarity.UNCOMMON]: 8,
    [AbilityRarity.RARE]: 2,
    [AbilityRarity.LEGENDARY]: 0
  },
  4: {
    [AbilityRarity.COMMON]: 20,
    [AbilityRarity.UNCOMMON]: 12,
    [AbilityRarity.RARE]: 5,
    [AbilityRarity.LEGENDARY]: 1
  },
};

// ============================================================================
// ITEM DROP RATES (% chance)
// ============================================================================
export const ITEM_DROP_RATES: Record<OpponentTier, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 20,
};

// Win multiplier for item drops (multiply base rate by this on win)
export const ITEM_DROP_WIN_MULTIPLIER = 1.5;

// ============================================================================
// BASE EXPERIENCE & MOOD REWARDS
// ============================================================================
export const BASE_EXPERIENCE = {
  win: 40,
  loss: 20,
};

export const BASE_MOOD = {
  win: 15,
  loss: -10,
};

// Performance bonus to mood (added based on overall performance score)
export const MOOD_PERFORMANCE_BONUS: Record<PerformanceLevel, number> = {
  excellent: 10,
  good: 5,
  average: 0,
  bad: -5,
};

// ============================================================================
// PERFORMANCE-SCALED EXPERIENCE
// ============================================================================

// Max additional XP awarded for performance (on top of base win/loss XP).
// At overallScore=100 the player earns this many bonus XP before tier scaling.
// At overallScore=0 the player earns 0 bonus XP.
// Formula: experience = BASE_EXPERIENCE + round(overallScore * (MAX / 100) * tierMultiplier)
export const PERFORMANCE_EXP_MAX_BONUS = 60;

// ============================================================================
// PERFORMANCE-SCALED DROP RATES
// ============================================================================

// Multiplier range applied to ability and item drop rates based on overall score.
// Score 0 → MIN multiplier, Score 100 → MAX multiplier (linear interpolation).
// Formula: dropMultiplier = MIN + (overallScore / 100) * (MAX - MIN)
export const PERFORMANCE_DROP_MULTIPLIER_MIN = 0.5;
export const PERFORMANCE_DROP_MULTIPLIER_MAX = 1.5;
