/**
 * Hangout Character Configuration
 * Defines which characters have the threshold-based relationship system
 * and tier events unlocked at each relationship milestone.
 */

export interface HangoutCharacterConfig {
  /** The three tier thresholds [tier1, tier2, tier3] — tier 0 starts at any met relationship */
  thresholds: readonly [number, number, number];
  /** Story event IDs for each tier threshold (fired on first hangout at that tier) */
  tierEventIds: readonly [string, string, string, string];
}

/** Energy cost for initiating a hangout tier event */
export const HANGOUT_ENERGY_COST = 10;

/** The five key characters with the full threshold + tier event system */
export const HANGOUT_CHARACTERS: Record<string, HangoutCharacterConfig> = {
  keith: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'keith_hangout_tier0',
      'keith_hangout_tier1',
      'keith_hangout_tier2',
      'keith_hangout_tier3',
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
  },

  coach_gonzalez: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'coach_hangout_tier0',
      'coach_hangout_tier1',
      'coach_hangout_tier2',
      'coach_hangout_tier3',
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
  },

  alex_romance: {
    thresholds: [25, 50, 75],
    tierEventIds: [
      'alex_hangout_tier0',
      'alex_hangout_tier1',
      'alex_hangout_tier2',
      'alex_hangout_tier3',
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

/**
 * Returns true if the character has an unlocked tier event that hasn't been seen yet.
 * Used to determine whether the hang out option should be shown for this character.
 */
export function hasUnseenTierEvent(
  characterId: string,
  relationshipValue: number,
  hangoutThresholdsSeen: Record<string, number[]>
): boolean {
  const seenForChar = hangoutThresholdsSeen[characterId] ?? [];
  const currentTier = getHangoutTier(characterId, relationshipValue);
  return !seenForChar.includes(currentTier);
}
