/**
 * Store migrations — run on every rehydration.
 *
 * The store does not carry old saves forward field-by-field. When the
 * persisted version doesn't match CURRENT_STORE_VERSION, migrateStore
 * discards it and returns a fresh default state instead of transforming it.
 *
 * This project tried granular migration for the 20 → 14 stat consolidation
 * and kept finding new corners it missed after shipping — opponent stat
 * snapshots embedded in scheduled events, fractional item boosts from an
 * unrounded average — each one only reachable by a real save hitting it.
 * Resetting is simpler, and costs nothing before the game has real players.
 *
 * Bump CURRENT_STORE_VERSION whenever a persisted-state shape change should
 * invalidate existing saves.
 */

import type { Player, GameCalendar, CurrentStatus, ActivityResult, ShopItem, OpponentTier } from '../types/game';
import type { Challenge } from '../types/challenges';
import { TimeManager } from '../game/TimeManager';

export interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

// Mirrors the partialize selection in gameStore — only persisted fields.
export interface PersistedStoreState {
  player: Player | null;
  calendar: GameCalendar;
  currentStatus: CurrentStatus;
  activityHistory: ActivityResult[];
  completedStoryEvents: string[];
  completedStoryEventChoices: Record<string, string>;
  relationships: Record<string, number>;
  hangoutThresholdsSeen: Record<string, number[]>;
  storyEventTriggerChance: number;
  activeChallenges: Challenge[];
  completedChallenges: string[];
  unlockedTiers: OpponentTier[];
  shopItems: ShopItem[];
  audioSettings: AudioSettings;
  // eventRecovery omitted — transient, always reset on load
}

// 6: lucky items moved from passive-in-inventory to the `charm` equipment slot,
//    which adds a key to Player.equippedItems that old saves don't carry.
export const CURRENT_STORE_VERSION = 6;

/** The state a brand-new game starts with. Also what a stale save resets to. */
export function createDefaultPersistedState(): PersistedStoreState {
  return {
    player: null,
    calendar: TimeManager.createCalendar(),
    currentStatus: { energy: 100, mood: 0, lastActivity: null },
    activityHistory: [],
    completedStoryEvents: [],
    completedStoryEventChoices: {},
    relationships: {},
    hangoutThresholdsSeen: {},
    storyEventTriggerChance: 40,
    activeChallenges: [],
    completedChallenges: [],
    unlockedTiers: [1],
    shopItems: [],
    audioSettings: { musicVolume: 0.5, sfxVolume: 0.7, muteMusic: false, muteSfx: false },
  };
}

/**
 * Bring a persisted store up to CURRENT_STORE_VERSION. Currently that means:
 * if it isn't already current, throw it away and start fresh.
 */
export function migrateStore(
  persistedState: unknown,
  fromVersion: number
): PersistedStoreState {
  if (fromVersion < CURRENT_STORE_VERSION) {
    return createDefaultPersistedState();
  }
  return persistedState as PersistedStoreState;
}
