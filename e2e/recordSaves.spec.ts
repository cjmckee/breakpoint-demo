import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSave, readGame, setMatchSpeed, triggerStoryEvent } from './helpers';
import { drainToIdle, runBot } from './bot';
// The career model's mean builds: a player's spending rather than the bot's,
// which buys whatever is affordable top to bottom.
import type { CareerBuilds } from '../src/test/analysis/bandSlots';
import { SEASON_SCHEDULES } from '../src/data/seasons';

/**
 * Records the season-start saves: one per career identity on Regional's first
 * morning, for Regional playtests (the bundled save is a day-7 Club player).
 *
 * Opt-in, not part of the suite: `RECORD_SAVES=1 npx playwright test
 * e2e/recordSaves.spec.ts --project=chromium`. Re-record when the store shape
 * changes, the career builds are regenerated, or the Club ending does.
 *
 * Each identity's stats and specialties are its mean career build on the last
 * Club day (careerBuilds.json), arranged through the handle, as the progression
 * plan says to: the bot's own spending is not a player's. The promotion itself is
 * played: the Riverside Open's victory ceremony runs, and the bot plays out the
 * evening and sleeps, so the season starts the way it does for a player.
 * Keith and Jen are met with a hangout ready, so a Regional spec can check
 * that a Club hangout isn't spent there.
 */

// Until Regional is written the game ends at the Club epilogue (contentEnd.spec), so
// there is no Regional to play. This lifts itself when the season is written.
test.skip(!SEASON_SCHEDULES[2], 'Regional is not written yet: the game ends after Club');

const IDENTITIES = ['bigServer', 'counter', 'netRusher', 'baseliner'] as const;
/** The last Club day the career builds record (the Riverside Open final). */
const CLUB_LAST_DAY = 39;

const builds = JSON.parse(
  readFileSync(new URL('../src/test/analysis/careerBuilds.json', import.meta.url), 'utf8'),
) as CareerBuilds;

for (const identity of IDENTITIES) {
  test(`record the Regional day-1 save for the ${identity}`, async ({ page }) => {
    test.skip(!process.env.RECORD_SAVES, 'records saves only when RECORD_SAVES=1');
    test.setTimeout(120_000);

    const career = builds.identities[identity];
    const build = career.days[CLUB_LAST_DAY];
    expect(build, `careerBuilds.json has no day ${CLUB_LAST_DAY}`).toBeDefined();

    await loadSave(page, 'save-day7-1', 7);
    await setMatchSpeed(page, 'instant');
    await page.evaluate(
      ({ stats, profile, day }) => {
        const handle = window.__test__;
        if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
        const state = handle.game.getState();
        if (!state.player) throw new Error('the save has no player');
        handle.game.setState({
          player: {
            ...state.player,
            stats,
            archetypeProfile: { ...profile, specializationPoints: 0 },
            experience: 700,
            totalExperienceEarned: 880,
            level: 3,
            flags: {
              ...state.player.flags,
              hangoutUnlocked_keith: true,
              hangoutUnlocked_jen: true,
            },
          },
          calendar: { ...state.calendar, currentDay: day, currentTimeSlot: 0, scheduledEvents: [] },
          relationships: { ...state.relationships, keith: 30, jen: 30 },
          hangoutThresholdsSeen: {},
        });
      },
      { stats: build.stats, profile: career.profile, day: CLUB_LAST_DAY + 1 },
    );

    await triggerStoryEvent(page, 'riverside_open_victory');
    await drainToIdle(page);
    await runBot(page, { untilDay: CLUB_LAST_DAY + 2 });

    const game = await readGame(page);
    expect(game.player?.tier, 'the ceremony should promote to Regional').toBe(2);
    expect(game.calendar.currentSeason).toBe(2);

    const save = await page.evaluate(() => window.__test__!.game.getState().exportSave());
    writeFileSync(
      new URL(`../src/debug/saves/save-regional-day1-${identity}.json`, import.meta.url),
      `${JSON.stringify(JSON.parse(save), null, 2)}\n`,
    );
  });
}
