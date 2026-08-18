/**
 * Migration check — does a stale save get reset instead of half-migrated?
 *
 * The store no longer migrates old persisted shapes field-by-field (see
 * migrations.ts for why: the 20 → 14 stat consolidation kept surfacing new
 * corners a granular migration missed after shipping — opponent snapshots
 * embedded in scheduled events, fractional item boosts from an unrounded
 * average). Any save below CURRENT_STORE_VERSION is discarded and replaced
 * with a fresh default state instead.
 *
 * This asserts that reset behavior: a save carrying old-shape garbage (20-stat
 * ratings, retired stat keys, whatever) comes back as an untouched, playable
 * default state — not a half-transformed hybrid — while a save that's already
 * current passes through unchanged.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/migrationCheck.ts
 */

import {
  migrateStore,
  createDefaultPersistedState,
  CURRENT_STORE_VERSION,
  type PersistedStoreState,
} from '../stores/migrations';
import { PlayerProfile } from '../core/PlayerProfile';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

/** A save carrying pre-consolidation garbage: 20-stat ratings, retired keys everywhere. */
function staleSave(): PersistedStoreState {
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
  console.log('\n╔══ MIGRATION CHECK — a stale save resets instead of half-migrating ══╗\n');

  console.log('── a save below CURRENT_STORE_VERSION is discarded ──');
  const stale = staleSave();
  const reset = migrateStore(stale, CURRENT_STORE_VERSION - 1);
  const fresh = createDefaultPersistedState();

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
  current.player = staleSave().player; // arbitrary non-null marker, shouldn't matter
  const passedThrough = migrateStore(current, CURRENT_STORE_VERSION);
  check('current-version state is returned as-is',
    JSON.stringify(passedThrough) === JSON.stringify(current));

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
