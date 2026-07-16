/**
 * Store migrations — run on every rehydration and importSave.
 *
 * Each migration function transforms the persisted state from version N to N+1.
 * Add a new function and increment CURRENT_VERSION when adding new migrations.
 *
 * CURRENT_VERSION must match the `version` field in the persist config.
 */

import type { Player, GameCalendar, CurrentStatus, ActivityResult, TrainingSession, ShopItem, OpponentTier, Modifiers } from '../types/game';
import type { Challenge } from '../types/challenges';
import { createEmptyArchetypeProfile } from '../data/archetypeTree';

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
  currentTrainingSessions: TrainingSession[];
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

export const CURRENT_STORE_VERSION = 3;

// ----------------------------------------------------------------------------
// Version 0 → 1
// ----------------------------------------------------------------------------

function migrate0to1(state: PersistedStoreState): PersistedStoreState {
  let player = state.player;

  if (player) {
    // Ensure flags object exists (added after initial player structure)
    const flags: Record<string, boolean | number | string> = player.flags ?? {};

    // Backfill hangout unlock flags if the unlock event was already completed
    // before the flag system existed for these characters.
    const completedEvents: string[] = state.completedStoryEvents ?? [];
    if (completedEvents.includes('club_team_first_practice')) {
      if (!flags['hangoutUnlocked_keith']) flags['hangoutUnlocked_keith'] = true;
      if (!flags['hangoutUnlocked_jen']) flags['hangoutUnlocked_jen'] = true;
    }
    if (completedEvents.includes('coach_training_focus')) {
      if (!flags['hangoutUnlocked_coach_gonzalez']) flags['hangoutUnlocked_coach_gonzalez'] = true;
    }
    if (completedEvents.includes('rival_doubles_disaster')) {
      if (!flags['hangoutUnlocked_jordan_rival']) flags['hangoutUnlocked_jordan_rival'] = true;
    }
    if (completedEvents.includes('romance_coffee_date')) {
      if (!flags['hangoutUnlocked_alex_romance']) flags['hangoutUnlocked_alex_romance'] = true;
    }

    player = { ...player, flags };
  }

  return { ...state, player };
}

// ----------------------------------------------------------------------------
// Version 1 → 2 — add phase-based archetype profile
// ----------------------------------------------------------------------------

function migrate1to2(state: PersistedStoreState): PersistedStoreState {
  let player = state.player;

  if (player && !player.archetypeProfile) {
    // Existing saves predate the archetype system. Start with an empty profile;
    // the Coach Gonzalez event lets the player choose their broad archetype.
    player = { ...player, archetypeProfile: createEmptyArchetypeProfile() };
  }

  return { ...state, player };
}

// ----------------------------------------------------------------------------
// Version 2 → 3 — nextActivityBuffs becomes a stackable array
// ----------------------------------------------------------------------------

function migrate2to3(state: PersistedStoreState): PersistedStoreState {
  let player = state.player as (Player & { nextActivityBuffs?: unknown }) | null;

  if (player && !Array.isArray(player.nextActivityBuffs)) {
    const legacyBuff = player.nextActivityBuffs as Modifiers | null | undefined;
    player = {
      ...player,
      nextActivityBuffs: legacyBuff ? [legacyBuff] : [],
    };
  }

  return { ...state, player };
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Apply all migrations from `fromVersion` up to CURRENT_STORE_VERSION.
 * Pass `fromVersion = 0` when loading saves that pre-date versioning.
 */
export function migrateStore(
  persistedState: unknown,
  fromVersion: number
): PersistedStoreState {
  let state = persistedState as PersistedStoreState;
  if (fromVersion < 1) state = migrate0to1(state);
  if (fromVersion < 2) state = migrate1to2(state);
  if (fromVersion < 3) state = migrate2to3(state);
  return state;
}
