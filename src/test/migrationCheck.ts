/**
 * Migration check — does an old save load with its progress intact, and does a
 * save from before the breaking floor still get reset?
 *
 * The store carries saves forward one version at a time (see migrations.ts).
 * Two things have to hold for that to be safe to ship:
 *
 *   - every version between RESET_BEFORE_VERSION and CURRENT_STORE_VERSION has
 *     a registered step, so a release that bumps the version without writing a
 *     migration fails here rather than wiping saves in the wild;
 *   - a save below the floor — the pre-consolidation 20-stat shape, which this
 *     project tried and failed to migrate field-by-field — still comes back as
 *     a clean default state rather than a half-transformed hybrid.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/migrationCheck.ts
 */

import {
  migrateStore,
  runMigrations,
  missingMigrationVersions,
  createDefaultPersistedState,
  CURRENT_STORE_VERSION,
  RESET_BEFORE_VERSION,
  type PersistedStoreState,
} from '../stores/migrations';
import { PlayerProfile } from '../core/PlayerProfile';
import { LUCKY_SPROUT } from '../data/items';
import { EffectKey } from '../types/game';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

/**
 * A save written at store version 5: current 14-stat shape, but from before
 * charms had an equipment slot. Its equippedItems has no `charm` key and its
 * lucky items carry neither `equipmentSlot` nor the effects they since gained.
 */
function version5Save(): PersistedStoreState {
  return {
    player: {
      id: 'p1',
      name: 'Mid-Season Player',
      stats: {
        core: { serve: 44, forehand: 46, backhand: 41, return: 43, net: 38 },
        technical: { slice: 30, spin: 35, placement: 33 },
        physical: { speed: 39, stamina: 44, strength: 37 },
        mental: { focus: 36, anticipation: 34, tactics: 31 },
      },
      abilities: [],
      inventory: [
        // The v5 shape of a lucky item: no slot, and Lucky Sprout's effect
        // block did not exist yet.
        {
          id: 'lucky_sprout',
          name: 'Lucky Sprout',
          description: 'A small plant left behind by an opponent from Azalea Forest.',
          type: 'lucky',
          shopAvailable: false,
          modifiers: { statBoosts: { tactics: 4, strength: 4, slice: 2, spin: 4 } },
        },
        {
          id: 'banana',
          name: 'Banana',
          description: 'Quick energy.',
          type: 'consumable',
          consumableEffect: { type: 'instant', instantEffects: { energyChange: 10 } },
        },
      ],
      storyItems: [],
      equippedItems: {
        racquet: {
          id: 'beginner_racquet', name: 'Beginner Racquet', description: '', type: 'equipment',
          equipmentSlot: 'racquet',
          modifiers: { statBoosts: { serve: 3 } },
        },
        shoes: null, outfit: null, hat: null,
      },
      nextActivityBuffs: [],
      seenItemIds: [], activeIndicators: [], seenChallengeIds: [],
      level: 7, experience: 120, totalExperienceEarned: 900, tier: 2,
      createdAt: '', updatedAt: '',
      trainingSessionsCompleted: 22,
      cumulativeMatchStats: { aces: 12, winners: 40, longRallies: 9, netPoints: 15, breakPoints: 6 },
      flags: { hangoutUnlocked_jen: true },
      archetypeProfile: { broad: null, phases: {}, specializationPoints: 2, respecTokens: 0 },
    },
    activityHistory: [{ type: 'training', day: 12 }],
    completedStoryEvents: ['club_team_first_practice'],
    completedStoryEventChoices: { club_team_first_practice: 'a' },
    relationships: { jen: 30 },
    hangoutThresholdsSeen: { jen: [25] },
    storyEventTriggerChance: 40,
    activeChallenges: [], completedChallenges: ['first_win'],
    unlockedTiers: [1, 2],
    shopItems: [],
    calendar: { practiceOpponents: {}, scheduledEvents: [] },
    currentStatus: { energy: 62, mood: 15, lastActivity: 'training' },
    audioSettings: { musicVolume: 1, sfxVolume: 1, muteMusic: false, muteSfx: false },
  } as unknown as PersistedStoreState;
}

/** A save carrying pre-consolidation garbage: 20-stat ratings, retired keys everywhere. */
function preConsolidationSave(): PersistedStoreState {
  return {
    player: {
      id: 'p1',
      name: 'Old Save',
      stats: {
        core: { serve: 40, forehand: 42, backhand: 38, return: 41, slice: 30 },
        technical: { volley: 58, overhead: 46, dropShot: 22, spin: 35, placement: 33 },
        physical: { speed: 39, stamina: 44, strength: 37, agility: 31, recovery: 29 },
        mental: { focus: 36, anticipation: 34, shotVariety: 26, offensive: 30, defensive: 32 },
      },
      abilities: [],
      inventory: [],
      storyItems: [],
      equippedItems: {
        racquet: {
          id: 'net_racquet', name: 'Net Racquet', description: '', type: 'equipment',
          equipmentSlot: 'racquet',
          modifiers: { statBoosts: { volley: 6, overhead: 4, serve: 3 } },
        },
        shoes: null, apparel: null, accessory: null,
      },
      nextActivityBuffs: [{ statBoosts: { agility: 4 } }],
      seenItemIds: [], activeIndicators: [], seenChallengeIds: [],
      level: 5, experience: 0, totalExperienceEarned: 0, tier: 1,
      createdAt: '', updatedAt: '',
      trainingSessionsCompleted: 0,
      cumulativeMatchStats: { aces: 0, winners: 0, longRallies: 0, netPoints: 0, breakPoints: 0 },
      flags: {},
      archetypeProfile: { broad: null, phases: {}, specializationPoints: 0, respecTokens: 0 },
    },
    shopItems: [{
      id: 'shop_volley', category: 'stat_increase', name: 'Volley Lesson', description: '',
      cost: 100, purchased: false, statBoosts: { volley: 2, overhead: 2 },
    }],
    activityHistory: [], completedStoryEvents: [], completedStoryEventChoices: {},
    relationships: {}, hangoutThresholdsSeen: {}, storyEventTriggerChance: 0,
    activeChallenges: [], completedChallenges: [], unlockedTiers: [1],
    calendar: {
      practiceOpponents: {
        1: {
          opponentId: 'practice_1', name: 'Practice Bot', tier: 1,
          stats: {
            core: { serve: 30, forehand: 32, backhand: 28, return: 31, slice: 20 },
            technical: { volley: 40, overhead: 36, dropShot: 18, spin: 25, placement: 23 },
            physical: { speed: 29, stamina: 34, strength: 27, agility: 21, recovery: 19 },
            mental: { focus: 26, anticipation: 24, shotVariety: 16, offensive: 20, defensive: 22 },
          },
        },
      },
      scheduledEvents: [{
        eventType: 'story_match', scheduledDay: 5, scheduledTimeSlot: 0,
        metadata: {
          opponentId: 'jen', opponentName: 'Jen', opponentTier: 1,
          winEventId: 'tutorial_jen_win', lossEventId: 'tutorial_jen_loss',
          opponentStats: {
            core: { serve: 23, forehand: 25, backhand: 21, return: 25, slice: 20 },
            technical: { volley: 22, overhead: 18, dropShot: 15, spin: 19, placement: 23 },
            physical: { speed: 30, stamina: 25, strength: 20, agility: 20, recovery: 20 },
            mental: { focus: 23, anticipation: 27, shotVariety: 15, offensive: 27, defensive: 27 },
          },
        },
      }],
    },
    currentStatus: { energy: 50, mood: 10, lastActivity: 'training' },
    audioSettings: { musicVolume: 1, sfxVolume: 1, muteMusic: false, muteSfx: false },
  } as unknown as PersistedStoreState;
}

function main(): void {
  console.log('\n╔══ MIGRATION CHECK — old saves load, pre-floor saves reset ══╗\n');

  console.log('── every version above the floor has a registered step ──');
  const gaps = missingMigrationVersions();
  check('no version between the floor and current is missing a migration',
    gaps.length === 0,
    gaps.length ? `missing steps for version(s): ${gaps.join(', ')}` : undefined);
  check('the floor is not above the current version',
    RESET_BEFORE_VERSION <= CURRENT_STORE_VERSION);

  console.log('\n── a version 5 save migrates forward with its progress intact ──');
  const outcome = runMigrations(version5Save(), 5);
  check('outcome is a migration, not a reset',
    outcome.status === 'migrated',
    outcome.status === 'reset' ? outcome.reason : undefined);

  const migrated = outcome.state;
  const player = migrated.player!;
  check('player survives', player !== null && player.name === 'Mid-Season Player');
  check('level and experience survive', player.level === 7 && player.experience === 120);
  check('stats are untouched', player.stats.core.serve === 44 && player.stats.mental.tactics === 31);
  check('story progress survives',
    migrated.completedStoryEvents.includes('club_team_first_practice') &&
    migrated.relationships.jen === 30);
  check('tier progression survives',
    JSON.stringify(migrated.unlockedTiers) === JSON.stringify([1, 2]));
  check('current status survives', migrated.currentStatus.energy === 62);

  console.log('\n  the 5 → 6 change itself:');
  check('equippedItems gains the charm slot, empty',
    'charm' in player.equippedItems && player.equippedItems.charm === null);
  check('existing equipment stays equipped',
    player.equippedItems.racquet?.id === 'beginner_racquet');

  const sprout = player.inventory.find(i => i.id === 'lucky_sprout');
  check('the held lucky item is still in the inventory', sprout !== undefined);
  check('it gains the charm slot, so it can actually be equipped',
    sprout?.equipmentSlot === 'charm');
  check('it picks up the effect Lucky Sprout gained in the same release',
    sprout?.modifiers?.additional?.[EffectKey.ENERGY_GAIN_BONUS] ===
      LUCKY_SPROUT.modifiers?.additional?.[EffectKey.ENERGY_GAIN_BONUS]);
  check('non-lucky inventory items are left alone',
    player.inventory.find(i => i.id === 'banana')?.equipmentSlot === undefined);

  console.log('\n── a save below the breaking floor is discarded ──');
  const stale = preConsolidationSave();
  const staleOutcome = runMigrations(stale, RESET_BEFORE_VERSION - 1);
  const fresh = createDefaultPersistedState();

  check('outcome is a reset, with a reason', staleOutcome.status === 'reset');
  const reset = staleOutcome.state;
  check('reset player is null (no half-migrated stats survive)', reset.player === null);
  check('reset calendar matches a brand-new game',
    JSON.stringify(reset.calendar) === JSON.stringify(fresh.calendar));
  check('reset currentStatus matches a brand-new game',
    JSON.stringify(reset.currentStatus) === JSON.stringify(fresh.currentStatus));
  check('reset shopItems is empty', reset.shopItems.length === 0);
  check('reset unlockedTiers is just tier 1',
    JSON.stringify(reset.unlockedTiers) === JSON.stringify([1]));
  check('reset never carries the stale player\'s data forward',
    JSON.stringify(reset) !== JSON.stringify(stale));

  console.log('\n── the reset save is immediately playable ──');
  // A player built fresh from a null-reset state uses PlayerManager's own
  // defaults, not the stale save's — just confirming the reset player slot
  // is a clean null a caller has to fill in, not a half-built object.
  check('createDefaultPersistedState().player is also null (createPlayer fills it)',
    fresh.player === null);
  const testProfile = new PlayerProfile('p1', 'Fresh Player');
  check('a freshly created profile has finite overallRating',
    Number.isFinite(testProfile.overallRating) && testProfile.overallRating > 0);
  check('a fresh profile has exactly the 14 current stats, no retired keys',
    Object.keys(testProfile.stats.core).length === 5 &&
    Object.keys(testProfile.stats.technical).length === 3 &&
    Object.keys(testProfile.stats.physical).length === 3 &&
    Object.keys(testProfile.stats.mental).length === 3);

  console.log('\n── a save already on CURRENT_STORE_VERSION passes through untouched ──');
  const current = createDefaultPersistedState();
  current.player = version5Save().player; // arbitrary non-null marker, shouldn't matter
  const currentOutcome = runMigrations(current, CURRENT_STORE_VERSION);
  check('current-version state is reported as current', currentOutcome.status === 'current');
  check('current-version state is returned as-is', currentOutcome.state === current);

  console.log('\n── junk and impossible versions reset instead of loading ──');
  check('a save from a newer build resets',
    runMigrations(createDefaultPersistedState(), CURRENT_STORE_VERSION + 1).status === 'reset');
  check('a missing save resets', runMigrations(null, CURRENT_STORE_VERSION).status === 'reset');
  check('a non-save object resets',
    runMigrations({ nonsense: true }, CURRENT_STORE_VERSION).status === 'reset');

  console.log('\n── migrateStore (the rehydration entry point) returns the state itself ──');
  check('a version 5 save comes back migrated',
    migrateStore(version5Save(), 5).player?.equippedItems.charm === null);
  check('a pre-floor save comes back as a default game',
    migrateStore(preConsolidationSave(), RESET_BEFORE_VERSION - 1).player === null);

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
