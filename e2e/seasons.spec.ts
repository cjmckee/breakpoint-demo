import { test, expect } from '@playwright/test';
import {
  startNewGame,
  dismissWalkthrough,
  setMatchSpeed,
  triggerStoryEvent,
  readGame,
} from './helpers';
import { drainToIdle, runBot } from './bot';

/**
 * A promotion starts the next tier's season the following morning.
 *
 * Each tier is one season, written on season days, so the status bar's
 * "S2 · Day 1" is the player-facing half of a contract the story leans on: if
 * the calendar queued the season but never began it (or began it on the
 * promotion day itself, leaving that afternoon on "Day 0"), every later season's
 * `minDay` would be off. The Node season check pins the arithmetic; this pins
 * that the store action a real promotion runs, and the night's sleep the player
 * actually clicks, wire it together, and that the screen agrees.
 */
test('a promotion begins season 2 on the next morning', async ({ page }) => {
  await startNewGame(page);
  await dismissWalkthrough(page);
  await setMatchSpeed(page, 'instant');

  const before = await readGame(page);
  const promotionDay = before.calendar.currentDay;

  // The Riverside Open's victory ceremony is the promotion a winner gets.
  await triggerStoryEvent(page, 'riverside_open_victory');
  await drainToIdle(page);

  const promoted = await readGame(page);
  expect(promoted.player?.tier, 'the ceremony should promote to Regional').toBe(2);
  expect(promoted.calendar.currentSeason, 'the promotion day stays in season 1').toBe(1);
  expect(promoted.calendar.upcomingSeason).toEqual({ season: 2, startDay: promotionDay + 1 });

  // Play out the rest of the day through the menu, the way a player would.
  await runBot(page, { untilDay: promotionDay + 1 });

  const morning = await readGame(page);
  expect(morning.calendar.currentDay, 'one sleep should be one day').toBe(promotionDay + 1);
  expect(morning.calendar.currentSeason).toBe(2);
  expect(morning.calendar.seasonStartDay).toBe(promotionDay + 1);
  expect(morning.calendar.upcomingSeason).toBeNull();
  await expect(page.getByTestId('status-calendar')).toContainText('S2 · Day 1');
});
