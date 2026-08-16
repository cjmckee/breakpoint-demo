/**
 * Migration check — does a save written before the stat consolidation survive?
 *
 * The 20 → 14 consolidation changed the shape of the one object every save is
 * built around. Without a migration the failure is silent rather than loud:
 * `PlayerProfile.createDefaultStats` uses `Object.assign`, so an old save keeps
 * its retired keys, gains the new ones at their 25 defaults, and reports a
 * plausible-looking rating that is not the one the player earned.
 *
 * This asserts the v3 → v4 migration end to end on a save carrying the things
 * that actually break: 20-stat ratings, an equipped item whose boosts name
 * retired stats, a pending consumable buff, and shop stock — plus the
 * calendar-embedded opponent snapshots that an earlier version of this
 * migration missed: a practice opponent and a scheduled story-match opponent
 * (the "Jen has 0 tactics" bug — her stats were snapshotted into `calendar`
 * before the consolidation, and the migration originally only touched `player`).
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/migrationCheck.ts
 */

import { migrateStore, CURRENT_STORE_VERSION, type PersistedStoreState } from '../stores/migrations';
import { PlayerProfile } from '../core/PlayerProfile';
import { calculateOverallRating } from '../utils/overallRating';

const RETIRED = ['volley', 'overhead', 'dropShot', 'agility', 'recovery',
  'shotVariety', 'offensive', 'defensive'] as const;

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

function near(label: string, actual: number, expected: number, tol = 0.001): void {
  check(label, Math.abs(actual - expected) <= tol, `expected ${expected}, got ${actual}`);
}

/** A v3 save: 20 stats, an equipped racquet, a pending buff, one shop item. */
function legacySave(): PersistedStoreState {
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
    currentStatus: {},
    audioSettings: { musicVolume: 1, sfxVolume: 1, muteMusic: false, muteSfx: false },
  } as unknown as PersistedStoreState;
}

function main(): void {
  console.log('\n╔══ MIGRATION CHECK — v3 save through the stat consolidation ══╗\n');

  const before = legacySave();
  const after = migrateStore(before, 3);
  const player = after.player!;
  const stats = player.stats as unknown as Record<string, Record<string, number>>;

  console.log('── stat shape ──');
  check('CURRENT_STORE_VERSION is 4', CURRENT_STORE_VERSION === 4);
  check('core has exactly the 5 core stats',
    JSON.stringify(Object.keys(stats.core).sort()) ===
    JSON.stringify(['backhand', 'forehand', 'net', 'return', 'serve']));
  check('technical has exactly slice/spin/placement',
    JSON.stringify(Object.keys(stats.technical).sort()) ===
    JSON.stringify(['placement', 'slice', 'spin']));
  check('physical has exactly speed/stamina/strength',
    JSON.stringify(Object.keys(stats.physical).sort()) ===
    JSON.stringify(['speed', 'stamina', 'strength']));
  check('mental has exactly focus/anticipation/tactics',
    JSON.stringify(Object.keys(stats.mental).sort()) ===
    JSON.stringify(['anticipation', 'focus', 'tactics']));

  const allKeys = Object.values(stats).flatMap(b => Object.keys(b));
  check('no retired stat survives anywhere',
    RETIRED.every(k => !allKeys.includes(k)),
    `found: ${RETIRED.filter(k => allKeys.includes(k)).join(', ')}`);

  console.log('\n── merged values (mean of parents) ──');
  near('net = avg(volley 58, overhead 46) = 52', stats.core.net, 52);
  near('speed = avg(speed 39, agility 31) = 35', stats.physical.speed, 35);
  near('stamina = avg(stamina 44, recovery 29) = 37', stats.physical.stamina, 37);
  near('placement = avg(placement 33, dropShot 22, shotVariety 26) = 27',
    stats.technical.placement, 27);
  near('tactics = avg(offensive 30, defensive 32) = 31', stats.mental.tactics, 31);
  near('slice moved core → technical, value intact', stats.technical.slice, 30);
  near('serve untouched', stats.core.serve, 40);
  near('spin untouched', stats.technical.spin, 35);

  console.log('\n── live stat boosts follow the same mapping ──');
  const racquet = player.equippedItems.racquet!;
  const boosts = racquet.modifiers!.statBoosts as unknown as Record<string, number>;
  near('equipped racquet: net = (volley 6 + overhead 4)/2 = 5', boosts.net, 5);
  near('equipped racquet: serve boost passes through', boosts.serve, 3);
  check('equipped racquet: no retired keys left',
    RETIRED.every(k => !(k in boosts)), JSON.stringify(boosts));

  const buff = player.nextActivityBuffs[0].statBoosts as unknown as Record<string, number>;
  near('pending buff: agility 4 becomes speed 2', buff.speed, 2);

  const shop = after.shopItems[0] as unknown as { statBoosts: Record<string, number> };
  near('shop item: net = (volley 2 + overhead 2)/2 = 2', shop.statBoosts.net, 2);

  console.log('\n── the migrated save loads and plays ──');
  const profile = new PlayerProfile('p1', 'Old Save', player.stats);
  const loaded = profile.stats as unknown as Record<string, Record<string, number>>;
  check('PlayerProfile does not reintroduce defaults',
    loaded.core.net === 52 && Object.keys(loaded.core).length === 5,
    JSON.stringify(loaded.core));
  check('overallRating is a real number',
    Number.isFinite(profile.overallRating) && profile.overallRating > 0,
    String(profile.overallRating));
  check('every shot family produces finite quality',
    (['serve_first', 'serve_second', 'return_forehand', 'forehand', 'backhand',
      'volley_forehand', 'overhead', 'slice_backhand', 'drop_shot_forehand',
      'lob_forehand', 'angle_shot_forehand', 'passing_shot_backhand',
      'forehand_approach'] as const)
      .every(shot => Number.isFinite(profile.getStatForShot(shot))));

  console.log('\n── calendar-embedded opponents (the "Jen has 0 tactics" bug) ──');
  const practiceStats = after.calendar!.practiceOpponents![1]!.stats as unknown as Record<string, Record<string, number>>;
  const jenMeta = after.calendar!.scheduledEvents![0].metadata as unknown as { opponentStats: Record<string, Record<string, number>> };
  const jenStats = jenMeta.opponentStats;
  const embeddedKeys = [
    ...Object.values(practiceStats).flatMap(b => Object.keys(b)),
    ...Object.values(jenStats).flatMap(b => Object.keys(b)),
  ];
  check('no retired stat survives in practiceOpponents or scheduledEvents',
    RETIRED.every(k => !embeddedKeys.includes(k)),
    `found: ${RETIRED.filter(k => embeddedKeys.includes(k)).join(', ')}`);
  near('practice opponent: net = avg(volley 40, overhead 36) = 38', practiceStats.core.net, 38);
  near('practice opponent: tactics = avg(offensive 20, defensive 22) = 21', practiceStats.mental.tactics, 21);
  near('Jen (scheduled story match): net = avg(volley 22, overhead 18) = 20', jenStats.core.net, 20);
  near('Jen: tactics = avg(offensive 27, defensive 27) = 27 — was reading 0', jenStats.mental.tactics, 27);

  console.log('\n── the reset this prevents ──');
  // What the player WOULD have read had the migration not run: createDefaultStats
  // Object.assigns the old keys over the new defaults, so the merged stats fall
  // back to 25 and the retired ones ride along as phantoms.
  const unmigrated = new PlayerProfile('p1', 'Unmigrated', legacySave().player!.stats);
  const raw = unmigrated.stats as unknown as Record<string, Record<string, number>>;
  console.log(`  net:     migrated ${stats.core.net}, unmigrated ${raw.core.net}`);
  console.log(`  tactics: migrated ${stats.mental.tactics}, unmigrated ${raw.mental.tactics}`);
  console.log(`  OVR:     migrated ${calculateOverallRating(player.stats)}, unmigrated ${unmigrated.overallRating}`);
  check('unmigrated net really does collapse to the default',
    raw.core.net === 25, `got ${raw.core.net} — has createDefaultStats changed?`);
  check('migration recovers the net rating the player earned',
    stats.core.net === 52);
  check('unmigrated save carries phantom stats the UI would render',
    RETIRED.some(k => k in raw.technical || k in raw.mental || k in raw.physical));

  console.log('\n── idempotence ──');
  const twice = migrateStore(after, 3);
  check('running the migration again is a no-op',
    JSON.stringify(twice.player!.stats) === JSON.stringify(player.stats));
  check('running the migration again is a no-op for calendar too',
    JSON.stringify(twice.calendar) === JSON.stringify(after.calendar));

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
