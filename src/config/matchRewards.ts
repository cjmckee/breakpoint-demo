/**
 * Match Reward Configuration
 *
 * Controls reward multipliers, drop rates, and stat boost amounts.
 * All values are easily tunable to balance progression.
 */

import type { StatBoosts } from '../types/game';
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
    excellent: { serve: 1, strength: 1, placement: 1 },
    good: { serve: 1, strength: 1 },
    average: { serve: 1 },
    bad: {},
  },
  returning: {
    excellent: { return: 1, anticipation: 1, agility: 1 },
    good: { return: 1, anticipation: 1 },
    average: { return: 1 },
    bad: {},
  },
  rallying: {
    excellent: { forehand: 1, backhand: 1, stamina: 1, spin: 1 },
    good: { stamina: 1, spin: 1, backhand: 1 },
    average: { stamina: 1, spin: 1 },
    bad: {},
  },
  netPlay: {
    excellent: { volley: 1, agility: 1, offensive: 1 },
    good: { volley: 1, agility: 1 },
    average: { volley: 1 },
    bad: {},
  },
  mental: {
    excellent: { focus: 1, offensive: 1, defensive: 1 },
    good: { focus: 1, shotVariety: 1 },
    average: { focus: 1 },
    bad: {},
  },
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
