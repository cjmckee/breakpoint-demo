/**
 * Store migrations — run on rehydration and on importSave.
 *
 * Two knobs, deliberately separate:
 *
 *   CURRENT_STORE_VERSION — bump for any change to the persisted shape. A save
 *     below it is carried forward one step at a time by MIGRATIONS, so a normal
 *     release keeps everyone's progress.
 *
 *   RESET_BEFORE_VERSION — the breaking floor. A save below it is discarded and
 *     replaced with a fresh default state. Raise it only when a change is too
 *     invasive to migrate; ordinary version bumps leave it alone.
 *
 * The floor sits at 5, where the 20 → 14 stat consolidation settled. Migrating
 * across that boundary was tried once and kept surfacing corners after shipping
 * — opponent stat snapshots embedded in scheduled events, fractional item
 * boosts from an unrounded average — so pre-consolidation saves stay reset.
 *
 * To add a migration:
 *   1. bump CURRENT_STORE_VERSION
 *   2. add a MIGRATIONS entry keyed by the version it produces (NO_CHANGE when
 *      the old shape loads correctly as-is)
 *   3. add coverage to src/test/migrationCheck.ts
 *
 * A version with no entry is a bug, not a pass-through: `npm test` fails on the
 * gap, and at runtime such a save resets rather than loading half-shaped.
 */

import type { Player, GameCalendar, CurrentStatus, ActivityResult, ShopItem, OpponentTier } from '../types/game';
import type { Challenge } from '../types/challenges';
import type { EquipmentSlot, Item } from '../types/items';
import { TimeManager } from '../game/TimeManager';
import { ALL_ITEMS } from '../data/items';

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
//    which adds a key to Player.equippedItems that older saves don't carry.
export const CURRENT_STORE_VERSION = 6;

/** Saves below this version are wiped instead of migrated. See the header. */
export const RESET_BEFORE_VERSION = 5;

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

// ----------------------------------------------------------------------------
// Migration steps
// ----------------------------------------------------------------------------

/** Transforms a save one version forward. Must be pure and idempotent-safe. */
type MigrationFn = (state: PersistedStoreState) => PersistedStoreState;

/**
 * Marker for a version bump that needs no state change — a new field with a
 * safe default, a rename that only touches non-persisted code. Registering it
 * is how a release says "yes, this was considered" instead of leaving a gap.
 */
export const NO_CHANGE = 'no-change';

const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['racquet', 'shoes', 'outfit', 'hat', 'charm'];

/**
 * A lucky item persisted before charms had a slot carries no `equipmentSlot`,
 * and ItemManager refuses to equip an item whose slot doesn't match — so those
 * items would sit in the inventory granting nothing, permanently. Re-reading
 * each one from the catalogue by id restores the slot, and picks up the effects
 * the four effect-less charms gained in the same release. Ids no longer in the
 * catalogue are left untouched.
 */
function refreshLuckyItem(item: Item): Item {
  if (item.type !== 'lucky') return item;
  return ALL_ITEMS.find((candidate) => candidate.id === item.id) ?? item;
}

/** 5 → 6: add the `charm` slot and make held lucky items equippable into it. */
function migrate5to6(state: PersistedStoreState): PersistedStoreState {
  const player = state.player;
  if (!player) return state;

  const equippedItems = { ...player.equippedItems };
  for (const slot of EQUIPMENT_SLOTS) {
    if (equippedItems[slot] === undefined) equippedItems[slot] = null;
  }

  return {
    ...state,
    player: {
      ...player,
      equippedItems,
      inventory: player.inventory.map(refreshLuckyItem),
    },
  };
}

/** Keyed by the version each step produces: MIGRATIONS[n] takes n-1 → n. */
const MIGRATIONS: Readonly<Record<number, MigrationFn | typeof NO_CHANGE>> = {
  6: migrate5to6,
};

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

export type MigrationOutcome =
  /** Already on the current version; returned untouched. */
  | { status: 'current'; state: PersistedStoreState }
  /** Carried forward from an older version with progress intact. */
  | { status: 'migrated'; state: PersistedStoreState; fromVersion: number }
  /** Not loadable — `state` is a fresh default game, not the caller's save. */
  | { status: 'reset'; state: PersistedStoreState; reason: string };

function resetOutcome(reason: string): MigrationOutcome {
  return { status: 'reset', state: createDefaultPersistedState(), reason };
}

/** Cheap shape check at the storage boundary — the fields every save carries. */
function isPersistedStoreState(value: unknown): value is PersistedStoreState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'calendar' in value &&
    'currentStatus' in value
  );
}

/**
 * Versions between the floor and current that have no registered step. Always
 * empty in a correct build; migrationCheck asserts it so a forgotten migration
 * fails the release instead of wiping saves in the wild.
 */
export function missingMigrationVersions(): number[] {
  const missing: number[] = [];
  for (let version = RESET_BEFORE_VERSION + 1; version <= CURRENT_STORE_VERSION; version++) {
    if (MIGRATIONS[version] === undefined) missing.push(version);
  }
  return missing;
}

/**
 * Bring a persisted save up to CURRENT_STORE_VERSION, reporting what happened.
 *
 * Callers that own the save being loaded (rehydration) can take the reset state
 * as-is; callers merging a save into a game already in progress (importSave)
 * should refuse on 'reset' rather than blow away the current game.
 */
export function runMigrations(persistedState: unknown, fromVersion: number): MigrationOutcome {
  if (!isPersistedStoreState(persistedState)) {
    return resetOutcome('persisted state is missing or not a save');
  }

  if (fromVersion > CURRENT_STORE_VERSION) {
    return resetOutcome(
      `save is from a newer build (version ${fromVersion}, this build reads ${CURRENT_STORE_VERSION})`
    );
  }

  if (fromVersion < RESET_BEFORE_VERSION) {
    return resetOutcome(
      `save version ${fromVersion} predates the breaking change at version ${RESET_BEFORE_VERSION}`
    );
  }

  if (fromVersion === CURRENT_STORE_VERSION) {
    return { status: 'current', state: persistedState };
  }

  let state = persistedState;
  for (let version = fromVersion + 1; version <= CURRENT_STORE_VERSION; version++) {
    const step = MIGRATIONS[version];

    if (step === undefined) {
      return resetOutcome(`no migration registered for store version ${version}`);
    }

    if (step === NO_CHANGE) continue;

    try {
      state = step(state);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return resetOutcome(`migration to version ${version} failed: ${detail}`);
    }
  }

  return { status: 'migrated', state, fromVersion };
}

/**
 * Rehydration entry point for the persist middleware: the migrated state, or a
 * fresh default game when the save can't be carried forward.
 */
export function migrateStore(persistedState: unknown, fromVersion: number): PersistedStoreState {
  const outcome = runMigrations(persistedState, fromVersion);

  if (outcome.status === 'reset') {
    console.warn(`[store] save reset — ${outcome.reason}`);
  } else if (outcome.status === 'migrated') {
    console.log(`[store] save migrated from version ${outcome.fromVersion} to ${CURRENT_STORE_VERSION}`);
  }

  return outcome.state;
}
