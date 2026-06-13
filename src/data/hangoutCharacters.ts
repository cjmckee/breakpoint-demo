/**
 * Hangout Character Configuration
 * Defines which characters have the threshold-based relationship system
 * and the repeatable hangout benefits at each tier.
 */

import type { StatBoosts } from '../types/game';

export interface HangoutTierConfig {
  /** Title shown in the result modal for a repeatable hangout */
  resultName: string;
  /** Flavor text shown in the result modal */
  resultText: string;
  /** Stat changes applied to the player */
  statChanges?: StatBoosts;
  /** Mood change applied (can be negative) */
  moodChange: number;
  /** Net energy change after the flat HANGOUT_ENERGY_COST is applied.
   *  Positive means the activity partially restores energy (e.g. relaxing with Keith).
   *  This stacks with the base cost so actual energy delta = energyChange - HANGOUT_ENERGY_COST. */
  energyRestored?: number;
  /** Relationship points gained from a repeatable hangout */
  relationshipGain: number;
}

export interface HangoutCharacterConfig {
  /** The three tier thresholds [tier1, tier2, tier3] — tier 0 starts at any met relationship */
  thresholds: readonly [number, number, number];
  /** Story event IDs for each tier threshold (fired on first hangout at that tier) */
  tierEventIds: readonly [string, string, string, string];
  /** Repeatable hangout config for tiers 0–3 */
  tiers: readonly [HangoutTierConfig, HangoutTierConfig, HangoutTierConfig, HangoutTierConfig];
}

/** Flat energy cost for any repeatable hangout (threshold events set their own via effects.energyChange) */
export const HANGOUT_ENERGY_COST = 10;

/** The five key characters with the full threshold + repeatable hangout system */
export const HANGOUT_CHARACTERS: Record<string, HangoutCharacterConfig> = {
  keith: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'keith_hangout_tier0',
      'keith_hangout_tier1',
      'keith_hangout_tier2',
      'keith_hangout_tier3',
    ],
    tiers: [
      {
        resultName: 'Recon Patrol',
        resultText: "Keith has the binoculars out again. You crouch behind a different bush this time. Progress.",
        moodChange: 12,
        energyRestored: 5,
        relationshipGain: 2,
      },
      {
        resultName: 'Dorm Dogs',
        resultText: "Keith fires up the grill. The sock is back on the smoke alarm. You eat too many hotdogs. No regrets.",
        moodChange: 15,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Sample Run',
        resultText: "Keith insists on trying a new ice cream shop. He samples nine flavors this time. The staff recognizes him.",
        statChanges: { focus: 1 },
        moodChange: 18,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'BFF Hangout',
        resultText: "Keith checks in. You're doing okay, you tell him. He pulls out the glitter trophy to make sure it's still valid.",
        statChanges: { focus: 1, recovery: 1 },
        moodChange: 22,
        energyRestored: 5,
        relationshipGain: 4,
      },
    ],
  },

  jen: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'jen_hangout_tier0',
      'jen_hangout_tier1',
      'jen_hangout_tier2',
      'jen_hangout_tier3',
    ],
    tiers: [
      {
        resultName: 'Park Workout',
        resultText: "Jen's idea of casual. Sprints, drills, and a hill. You can barely walk after.",
        statChanges: { speed: 1 },
        moodChange: 8,
        energyRestored: 0,
        relationshipGain: 2,
      },
      {
        resultName: 'Coaching the Kids',
        resultText: "Another Saturday with the kids. One of them asks if you're any good. You say yes. They don't believe you.",
        statChanges: { forehand: 1 },
        moodChange: 10,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Cat Visit',
        resultText: "Deuce bites your shoe again. Advantage sits on your lap for exactly thirty seconds. Progress.",
        statChanges: { focus: 1 },
        moodChange: 12,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Practice Set',
        resultText: "You and Jen hit for an hour. She wins. She always wins. But you're getting closer.",
        statChanges: { focus: 1, anticipation: 1 },
        moodChange: 15,
        energyRestored: 5,
        relationshipGain: 4,
      },
    ],
  },

  coach_gonzalez: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'coach_hangout_tier0',
      'coach_hangout_tier1',
      'coach_hangout_tier2',
      'coach_hangout_tier3',
    ],
    tiers: [
      {
        resultName: 'Court Discount',
        resultText: "Coach pulls some strings through a guy who knows a guy. Twelve percent off. Maybe thirteen.",
        statChanges: { serve: 1 },
        moodChange: 5,
        relationshipGain: 2,
      },
      {
        resultName: 'Machine Drills',
        resultText: "The ball machine is acting up again. It fires three balls at once. Excellent practice.",
        statChanges: { anticipation: 1, return: 1 },
        moodChange: 8,
        relationshipGain: 2,
      },
      {
        resultName: 'Coach Mixer',
        resultText: "Another evening with the coaches. You name an obscure player. They nod. You survive.",
        statChanges: { focus: 1, anticipation: 1 },
        moodChange: 10,
        relationshipGain: 3,
      },
      {
        resultName: 'Lob Practice',
        resultText: "Coach drills you on the Ultra Lob. The birds scatter. The baseline trembles. Beautiful.",
        statChanges: { defensive: 1, slice: 1 },
        moodChange: 12,
        relationshipGain: 3,
      },
    ],
  },

  jordan_rival: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'jordan_hangout_tier0',
      'jordan_hangout_tier1',
      'jordan_hangout_tier2',
      'jordan_hangout_tier3',
    ],
    tiers: [
      {
        resultName: 'Grudge Rally',
        resultText: "Jordan hits everything harder than necessary. You return it anyway. Neither of you says goodbye.",
        statChanges: { return: 1 },
        moodChange: 3,
        relationshipGain: 2,
      },
      {
        resultName: 'Ball Pickup Duty',
        resultText: "Jordan's practicing. You're fetching balls. You're learning more than you'd like to admit.",
        statChanges: { anticipation: 1, speed: 1 },
        moodChange: 6,
        relationshipGain: 2,
      },
      {
        resultName: 'Doubles Drill',
        resultText: "You and Jordan run doubles drills. Jordan doesn't compliment you. That's basically a compliment.",
        statChanges: { volley: 1, offensive: 1 },
        moodChange: 8,
        relationshipGain: 3,
      },
      {
        resultName: 'Net Session',
        resultText: "Jordan asks you to drill volleys again. They say 'thanks' under their breath. You pretend not to hear.",
        statChanges: { volley: 1, focus: 1 },
        moodChange: 10,
        relationshipGain: 3,
      },
    ],
  },

  alex_romance: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'alex_hangout_tier0',
      'alex_hangout_tier1',
      'alex_hangout_tier2',
      'alex_hangout_tier3',
    ],
    tiers: [
      {
        resultName: 'Food & TV Talk',
        resultText: "You grab food and argue about Love Lagoon for an hour. Alex's theories are getting wilder.",
        statChanges: { speed: 1 },
        moodChange: 10,
        relationshipGain: 2,
      },
      {
        resultName: 'Mall Trip',
        resultText: "You walk around the mall. Alex finds another terrible bet to make. You're happy to lose this one.",
        statChanges: { forehand: 1 },
        moodChange: 12,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Racquet Care',
        resultText: "Alex adjusts your string tension. The heart is still there. It still works.",
        statChanges: { forehand: 1, backhand: 1 },
        moodChange: 15,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Evening Walk',
        resultText: "You walk through the city together. It doesn't rain this time. It doesn't need to.",
        statChanges: { recovery: 1, focus: 1 },
        moodChange: 18,
        energyRestored: 8,
        relationshipGain: 4,
      },
    ],
  },
};

/**
 * Get the current hangout tier (0–3) for a character based on relationship value.
 * Tier 0 = below first threshold, tier 3 = above all thresholds.
 */
export function getHangoutTier(characterId: string, relationshipValue: number): number {
  const config = HANGOUT_CHARACTERS[characterId];
  if (!config) return 0;
  return config.thresholds.filter((t) => relationshipValue >= t).length;
}

/** Whether a character ID is part of the key hangout system */
export function isHangoutCharacter(characterId: string): boolean {
  return characterId in HANGOUT_CHARACTERS;
}
