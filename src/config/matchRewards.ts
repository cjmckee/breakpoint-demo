/**
 * Match Reward Configuration
 *
 * Controls reward multipliers, drop rates, and stat boost amounts.
 * All values are easily tunable to balance progression.
 */

import type { StatBoosts } from '../types/game';

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
// STAT BOOST AMOUNTS (All whole numbers, max +3)
// ============================================================================
export const STAT_BOOST_AMOUNTS: Record<PerformanceLevel, number> = {
  excellent: 3,
  good: 2,
  average: 1,
  bad: 0,
};

// Define which stats get boosted for each category at each performance level
export const CATEGORY_STAT_BOOSTS: Record<string, Record<PerformanceLevel, StatBoosts>> = {
  serving: {
    excellent: { serve: 3, strength: 2, placement: 1 },
    good: { serve: 2, strength: 1 },
    average: { serve: 1 },
    bad: {},
  },
  returning: {
    excellent: { return: 3, anticipation: 2, agility: 1 },
    good: { return: 2, anticipation: 1 },
    average: { return: 1 },
    bad: {},
  },
  rallying: {
    excellent: { forehand: 2, backhand: 2, stamina: 2 },
    good: { forehand: 2, backhand: 2, stamina: 1 },
    average: { forehand: 1, backhand: 1 },
    bad: {},
  },
  netPlay: {
    excellent: { volley: 3, agility: 2, offensive: 1 },
    good: { volley: 2, agility: 1 },
    average: { volley: 1 },
    bad: {},
  },
  mental: {
    excellent: { focus: 3, offensive: 1, defensive: 1 },
    good: { focus: 2, shotVariety: 1 },
    average: { focus: 1 },
    bad: {},
  },
};

// ============================================================================
// ABILITY DROP RATES (% chance per rarity)
// ============================================================================
export const ABILITY_DROP_RATES: Record<OpponentTier, {
  common: number;
  uncommon: number;
  rare: number;
  legendary: number;
}> = {
  1: { common: 5, uncommon: 0, rare: 0, legendary: 0 },
  2: { common: 10, uncommon: 3, rare: 0, legendary: 0 },
  3: { common: 15, uncommon: 8, rare: 2, legendary: 0 },
  4: { common: 20, uncommon: 12, rare: 5, legendary: 1 },
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
  win: 50,
  loss: 25,
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
