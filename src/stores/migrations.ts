/**
 * Store migrations — run on every rehydration and importSave.
 *
 * Each migration function transforms the persisted state from version N to N+1.
 * Add a new function and increment CURRENT_VERSION when adding new migrations.
 *
 * CURRENT_VERSION must match the `version` field in the persist config.
 */

import type { Player, GameCalendar, CurrentStatus, ActivityResult, ShopItem, OpponentTier, Modifiers } from '../types/game';
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

export const CURRENT_STORE_VERSION = 4;

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
// Version 3 → 4 — the 20-stat shape collapses to 14
// ----------------------------------------------------------------------------

/**
 * Which old stats fund each surviving stat. A merged stat is the AVERAGE of its
 * parents, which is how `src/data/opponents.ts` and every authored roster were
 * rewritten, so a save migrated this way keeps the rating it had.
 *
 * Stats absent from this table (serve, forehand, backhand, return, spin,
 * strength, focus, anticipation) kept their name and value. `slice` is the one
 * pure move: it was core, it is now technical, and the number does not change.
 */
const STAT_MERGES: Record<string, readonly string[]> = {
  net: ['volley', 'overhead'],
  speed: ['speed', 'agility'],
  stamina: ['stamina', 'recovery'],
  placement: ['placement', 'dropShot', 'shotVariety'],
  tactics: ['offensive', 'defensive'],
};

/** Every stat name that existed in the 20-stat shape and does not in the 14. */
const RETIRED_STATS = [
  'volley', 'overhead', 'dropShot', 'agility', 'recovery',
  'shotVariety', 'offensive', 'defensive',
] as const;

type NumberMap = Record<string, number | undefined>;

/** A save is pre-consolidation if any bucket still carries a retired stat. */
function hasLegacyStats(buckets: NumberMap[]): boolean {
  return buckets.some(b => b && RETIRED_STATS.some(k => typeof b[k] === 'number'));
}

/**
 * Collapse one flat stat map onto the 14-stat names.
 *
 * `mode: 'level'` is for a player's own ratings — the merged value is the mean
 * of its parents, and a parent that is missing does not dilute the mean.
 *
 * `mode: 'delta'` is for the StatBoosts carried by items and buffs. Those are
 * increments, so the mean is taken over ALL parents with a missing one counted
 * as zero: raising old `volley` by 5 while leaving `overhead` alone raised the
 * player's net game by 2.5, and that is what the boost has to be worth now, or
 * migrating would quietly buff every piece of equipment in the game.
 */
function collapseStats(flat: NumberMap, mode: 'level' | 'delta'): NumberMap {
  const out: NumberMap = { ...flat };

  for (const [target, parents] of Object.entries(STAT_MERGES)) {
    const values = parents.map(p => flat[p]).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) continue;
    const sum = values.reduce((a, b) => a + b, 0);
    const divisor = mode === 'level' ? values.length : parents.length;
    const merged = sum / divisor;
    out[target] = mode === 'level'
      ? Math.max(0, Math.min(100, Math.round(merged)))
      : merged;
  }

  for (const dead of RETIRED_STATS) delete out[dead];
  return out;
}

/** Remap a StatBoosts map in place-free fashion; undefined passes through. */
function migrateBoosts(boosts: NumberMap | undefined): NumberMap | undefined {
  if (!boosts) return boosts;
  return collapseStats(boosts, 'delta');
}

function migrateModifiers(mods: Modifiers | undefined): Modifiers | undefined {
  if (!mods) return mods;
  return { ...mods, statBoosts: migrateBoosts(mods.statBoosts as NumberMap) as Modifiers['statBoosts'] };
}

function migrateItem<T extends { modifiers?: Modifiers }>(item: T | null): T | null {
  if (!item) return item;
  if (!item.modifiers) return item;
  return { ...item, modifiers: migrateModifiers(item.modifiers) };
}

function migrate3to4(state: PersistedStoreState): PersistedStoreState {
  const player = state.player;

  let nextPlayer = player;
  if (player?.stats) {
    let working: Player = player;
    const s = player.stats as unknown as Record<string, NumberMap>;

    // Only rewrite ratings if this really is a pre-consolidation save. Item and
    // shop boosts are remapped regardless — collapseStats is a no-op on a map
    // that carries no retired names, and a save can carry a stale item without
    // stale ratings if it was written mid-migration.
    if (hasLegacyStats([s.core, s.technical, s.physical, s.mental])) {
      const merged = collapseStats(
        { ...s.core, ...s.technical, ...s.physical, ...s.mental },
        'level',
      );
      const pick = <K extends string>(...keys: K[]): Record<K, number> =>
        Object.fromEntries(keys.map(k => [k, merged[k] ?? 25])) as Record<K, number>;

      working = {
        ...working,
        stats: {
          // `slice` moves core → technical; `net` takes the core slot it vacates.
          core: pick('serve', 'forehand', 'backhand', 'return', 'net'),
          technical: pick('slice', 'spin', 'placement'),
          physical: pick('speed', 'stamina', 'strength'),
          mental: pick('focus', 'anticipation', 'tactics'),
        },
      };
    }

    // EffectAggregator reads statBoosts off the PERSISTED item, not off the
    // catalogue, so an equipped racquet granting `volley` is dead weight until
    // these are remapped too.
    nextPlayer = {
      ...working,
      inventory: (working.inventory ?? []).map(i => migrateItem(i)!),
      storyItems: (working.storyItems ?? []).map(i => migrateItem(i)!),
      equippedItems: Object.fromEntries(
        Object.entries(working.equippedItems ?? {}).map(([slot, item]) => [slot, migrateItem(item)]),
      ) as Player['equippedItems'],
      nextActivityBuffs: (working.nextActivityBuffs ?? []).map(m => migrateModifiers(m)!),
    };
  }

  const shopItems = (state.shopItems ?? []).map((item) => {
    const withBoosts = item as ShopItem & { statBoosts?: NumberMap; nextActivityBuffs?: Modifiers };
    const next: ShopItem = { ...item };
    if (withBoosts.statBoosts) {
      (next as typeof withBoosts).statBoosts = migrateBoosts(withBoosts.statBoosts);
    }
    if (withBoosts.nextActivityBuffs) {
      (next as typeof withBoosts).nextActivityBuffs = migrateModifiers(withBoosts.nextActivityBuffs);
    }
    return next;
  });

  // activityHistory is deliberately left alone: it is a log of what happened
  // under the old system, and rewriting past training records to stat names
  // that did not exist at the time would make the history lie.
  return { ...state, player: nextPlayer, shopItems, calendar: migrateCalendar(state.calendar) };
}

/**
 * Collapse a flat PlayerStats-shaped blob from the 20-stat layout to 14, if it
 * still carries retired keys. Used both for the player's own ratings and for
 * opponent stat snapshots embedded in `calendar` — practice opponents
 * (regenerated each time slot, but can still be mid-slot when a save loads)
 * and story/team match metadata (scheduled days ahead, so a stale snapshot
 * can outlive the player's own migration by a long time — this is the "Jen
 * has 0 tactics" bug). All of them are flat PlayerStats blobs copied from
 * source data that has since moved to the 14-stat shape, so they collapse the
 * same way the player's own ratings do.
 */
function collapseEmbeddedStats(stats: unknown): unknown {
  if (!stats || typeof stats !== 'object') return stats;
  const s = stats as Record<string, NumberMap>;
  if (!s.core || !s.technical || !s.physical || !s.mental) return stats;
  if (!hasLegacyStats([s.core, s.technical, s.physical, s.mental])) return stats;

  const merged = collapseStats(
    { ...s.core, ...s.technical, ...s.physical, ...s.mental },
    'level',
  );
  const pick = <K extends string>(...keys: K[]): Record<K, number> =>
    Object.fromEntries(keys.map(k => [k, merged[k] ?? 25])) as Record<K, number>;

  return {
    core: pick('serve', 'forehand', 'backhand', 'return', 'net'),
    technical: pick('slice', 'spin', 'placement'),
    physical: pick('speed', 'stamina', 'strength'),
    mental: pick('focus', 'anticipation', 'tactics'),
  };
}

/** Remap the opponent stat snapshots embedded in `calendar`. See collapseEmbeddedStats. */
function migrateCalendar(calendar: PersistedStoreState['calendar']): PersistedStoreState['calendar'] {
  if (!calendar) return calendar;

  const practiceOpponents = Object.fromEntries(
    Object.entries(calendar.practiceOpponents ?? {}).map(([tier, opponent]) => [
      tier,
      opponent ? { ...opponent, stats: collapseEmbeddedStats(opponent.stats) } : opponent,
    ]),
  ) as GameCalendar['practiceOpponents'];

  const scheduledEvents = (calendar.scheduledEvents ?? []).map((event) => {
    const metadata = event.metadata as (Record<string, unknown> & { opponentStats?: unknown }) | undefined;
    if (!metadata?.opponentStats) return event;
    return {
      ...event,
      metadata: { ...metadata, opponentStats: collapseEmbeddedStats(metadata.opponentStats) },
    };
  });

  return { ...calendar, practiceOpponents, scheduledEvents };
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
  if (fromVersion < 4) state = migrate3to4(state);
  return state;
}
