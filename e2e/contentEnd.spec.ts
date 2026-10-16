import { test, expect } from '@playwright/test';
import {
  loadSave,
  markStoryEventsCompleted,
  readGame,
  setMatchSpeed,
  triggerStoryEvent,
} from './helpers';
import { drainToIdle, runBot } from './bot';
import { CONTENT_END_EVENT, SEASON_SCHEDULES } from '../src/data/seasons';

/**
 * The game stops where the writing does. After the Club ending, a promoted player
 * whose season isn't written gets an end screen in place of the menu, rather than
 * an empty calendar to train through. This catches the gate opening early (before
 * the closing event plays), never closing, or leaking through the keyboard
 * shortcuts, which bypass the menu. It lifts on its own once the season is
 * written, so it only runs while Regional is unwritten.
 */
test.skip(Boolean(SEASON_SCHEDULES[2]), 'Regional is written: there is no end screen to reach');

test('the Club ending stops at the end screen', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 7);
  await setMatchSpeed(page, 'instant');
  // The Riverside Open as a player reaches its final: the opening ceremony played.
  await markStoryEventsCompleted(page, ['riverside_open_opening_ceremony']);
  await triggerStoryEvent(page, 'riverside_open_victory');
  await drainToIdle(page);

  // Promoted, but the closing event hasn't played: the rest of the day is still there.
  const promoted = await readGame(page);
  expect(promoted.player?.tier, 'the ceremony should promote to Regional').toBe(2);
  expect(promoted.completedStoryEvents).not.toContain(CONTENT_END_EVENT);
  await expect(page.getByTestId('action-rest')).toBeVisible();

  const log = await runBot(page, { untilDay: promoted.calendar.currentDay + 3 });
  expect(log.contentEnded, 'the bot should stop at the end screen, not play on').toBe(true);
  const ended = await readGame(page);
  expect(ended.completedStoryEvents).toContain(CONTENT_END_EVENT);
  expect(ended.calendar.currentDay).toBe(promoted.calendar.currentDay + 1);

  await expect(page.getByTestId('content-end')).toBeVisible();
  await expect(page.getByTestId('action-training')).toHaveCount(0);
  // The menu's shortcuts are gone with it.
  await page.keyboard.press('t');
  expect((await readGame(page)).gamePhase.type).toBe('idle');
});

test('a promoted player who has seen the epilogue is held there, and can start over', async ({
  page,
}) => {
  // A Regional player, as an already-promoted save is once the epilogue has played.
  await loadSave(page, 'save-regional-day1-baseliner', 41);
  await markStoryEventsCompleted(page, [CONTENT_END_EVENT]);
  await expect(page.getByTestId('content-end')).toBeVisible();

  // Deleting a career takes a second click.
  await page.getByTestId('content-end-new-career').click();
  await page.getByTestId('content-end-cancel').click();
  await expect(page.getByTestId('content-end')).toBeVisible();
  expect((await readGame(page)).player).not.toBeNull();

  await page.getByTestId('content-end-new-career').click();
  await page.getByTestId('content-end-confirm').click();
  const fresh = await readGame(page);
  expect(fresh.gamePhase.type).toBe('player_creation');
  expect(fresh.player).toBeNull();
  await expect(page.locator('#player-name')).toBeVisible();
});
