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
        resultName: 'Couch Time',
        resultText: "Keith's on the couch. You sit down. Something is on TV. Neither of you choose it. It's fine.",
        moodChange: 12,
        energyRestored: 5,
        relationshipGain: 2,
      },
      {
        resultName: 'Bad Movie Time',
        resultText: "One hour of something with a 14% rating. You laugh more than you expected.",
        moodChange: 15,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Couch Therapy',
        resultText: "Keith nods. You keep talking. It helps more than you'd like to admit.",
        statChanges: { focus: 1 },
        moodChange: 18,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Friendship Check-In',
        resultText: "Keith checks in. You're doing okay, you tell him. He nods like he already knew.",
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
        resultName: 'Good Coffee',
        resultText: "Overpriced. Worth it. An hour disappears.",
        statChanges: { forehand: 1 },
        moodChange: 8,
        energyRestored: 5,
        relationshipGain: 2,
      },
      {
        resultName: 'The Debate Continues',
        resultText: "You argue about technique again. Nobody wins. Both of you improve.",
        statChanges: { shotVariety: 1, anticipation: 1 },
        moodChange: 10,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Napkin Tactics',
        resultText: "Jen diagrams something on a napkin. The waiter is used to it now.",
        statChanges: { placement: 1, backhand: 1 },
        moodChange: 12,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: "Jen's Latest Formula",
        resultText: "She hands you a small jar. This one smells like grapefruit. You feel faster somehow.",
        statChanges: { placement: 2, anticipation: 1, shotVariety: 1 },
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
        resultName: 'Coach Has Notes',
        resultText: "He has seventeen things to go over. You absorb three of them. They're the right three.",
        statChanges: { serve: 1 },
        moodChange: 5,
        relationshipGain: 2,
      },
      {
        resultName: 'Short Film Review',
        resultText: "Thirty minutes of tape. He only pauses it twelve times. A personal best.",
        statChanges: { serve: 1, anticipation: 1 },
        moodChange: 8,
        relationshipGain: 2,
      },
      {
        resultName: 'Whiteboard Session',
        resultText: "He brought markers. Multiple colours. The arrows are ambitious.",
        statChanges: { placement: 1, focus: 1, serve: 1 },
        moodChange: 10,
        relationshipGain: 3,
      },
      {
        resultName: 'Open Floor',
        resultText: "For once, you get to ask the questions. He actually answers them.",
        statChanges: { serve: 2, placement: 1, anticipation: 1 },
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
        resultName: 'Near the Water Fountain',
        resultText: "Jordan says something. You say something. Nobody wins. You both feel it anyway.",
        statChanges: { focus: 1 },
        moodChange: 3,
        relationshipGain: 2,
      },
      {
        resultName: 'Smoothie Trash Talk',
        resultText: "Forty-five minutes of useful insults. Your backhand is genuinely exposed.",
        statChanges: { offensive: 1, anticipation: 1 },
        moodChange: 6,
        relationshipGain: 2,
      },
      {
        resultName: 'Wall Drills',
        resultText: "Nobody officially wins. Both of you walk away better.",
        statChanges: { offensive: 1, defensive: 1, focus: 1 },
        moodChange: 8,
        relationshipGain: 3,
      },
      {
        resultName: 'Sparring Session',
        resultText: "Jordan pushes you to places you didn't know you could go. Objectively awful and great.",
        statChanges: { offensive: 2, defensive: 1, focus: 1 },
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
        resultName: 'Morning Run',
        resultText: "Early. Quiet. Neither of you talk much. That's fine.",
        statChanges: { speed: 1 },
        moodChange: 10,
        relationshipGain: 2,
      },
      {
        resultName: 'Hitting Session',
        resultText: "Private court. Alex pushes you. You push back.",
        statChanges: { agility: 1, return: 1 },
        moodChange: 12,
        relationshipGain: 3,
      },
      {
        resultName: 'Dinner After',
        resultText: "You both needed this more than you realized.",
        statChanges: { recovery: 1 },
        moodChange: 15,
        energyRestored: 5,
        relationshipGain: 3,
      },
      {
        resultName: 'Just Sitting Together',
        resultText: "Nothing specific happens. That's the whole point.",
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
