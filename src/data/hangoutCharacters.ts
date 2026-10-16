/**
 * Hangout Character Configuration
 * Defines which characters have the threshold-based relationship system
 * and tier events unlocked at each relationship milestone.
 */

import type { OpponentTier } from '../types/game';
import { PrerequisiteChecker } from '../game/PrerequisiteChecker';
import { StoryEventRepository } from './storyEvents';

/**
 * One hangout scene: a story event, and the relationship it needs. A scene meant
 * for a later season says so with its event's `prerequisites.tier`.
 */
export interface HangoutScene {
  eventId: string;
  minRelationship: number;
}

export interface HangoutCharacterConfig {
  /** The bond track's milestones [tier1, tier2, tier3]; tier 0 is anywhere below the first. */
  thresholds: readonly [number, number, number];
  /**
   * The character's hangouts, in the order they play. Each is offered only once
   * every scene before it has been seen, so nothing is skipped: a Club scene
   * missed during Club is still offered at Regional, and comes before Regional's.
   */
  scenes: readonly HangoutScene[];
}

/** Energy cost for initiating a hangout tier event */
export const HANGOUT_ENERGY_COST = 10;

const CLUB_THRESHOLDS = [25, 50, 75] as const;

/** The Club scenes: one at first meeting and one at each bond milestone. */
function clubScenes(prefix: string): HangoutScene[] {
  return [0, ...CLUB_THRESHOLDS].map((minRelationship, tier) => ({
    eventId: `${prefix}_hangout_tier${tier}`,
    minRelationship,
  }));
}

/** The five key characters with the full threshold + scene system */
export const HANGOUT_CHARACTERS: Record<string, HangoutCharacterConfig> = {
  keith: { thresholds: CLUB_THRESHOLDS, scenes: clubScenes('keith') },
  jen: { thresholds: CLUB_THRESHOLDS, scenes: clubScenes('jen') },
  coach_gonzalez: { thresholds: CLUB_THRESHOLDS, scenes: clubScenes('coach') },
  jordan_rival: { thresholds: CLUB_THRESHOLDS, scenes: clubScenes('jordan') },
  alex_romance: { thresholds: CLUB_THRESHOLDS, scenes: clubScenes('alex') },
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
 * The character's next hangout: the first scene not yet seen, if the relationship
 * reaches it and its event belongs to the player's season. A later scene never
 * jumps the queue, so a scene the player didn't get to stays first in line.
 * `seen` holds the indexes of scenes already played.
 */
export function nextHangout(
  characterId: string,
  relationshipValue: number,
  hangoutScenesSeen: Record<string, number[]>,
  playerTier: OpponentTier,
): { index: number; eventId: string } | null {
  const config = HANGOUT_CHARACTERS[characterId];
  if (!config) return null;
  const seen = hangoutScenesSeen[characterId] ?? [];
  const index = config.scenes.findIndex((_, i) => !seen.includes(i));
  if (index === -1) return null;
  const scene = config.scenes[index];
  if (relationshipValue < scene.minRelationship) return null;
  const event = StoryEventRepository.getEventById(scene.eventId);
  if (!event || !PrerequisiteChecker.checkTierPrerequisites(playerTier, event.prerequisites.tier)) {
    return null;
  }
  return { index, eventId: scene.eventId };
}

/** Whether the character has a hangout to offer now (nextHangout). */
export function hasUnseenTierEvent(
  characterId: string,
  relationshipValue: number,
  hangoutScenesSeen: Record<string, number[]>,
  playerTier: OpponentTier,
): boolean {
  return nextHangout(characterId, relationshipValue, hangoutScenesSeen, playerTier) !== null;
}
