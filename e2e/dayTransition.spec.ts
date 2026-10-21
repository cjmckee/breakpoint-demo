import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame } from './helpers';
import { TimeSlot } from '../src/types/game';
import { TimeManager } from '../src/game/TimeManager';

/**
 * The card between days: it plays when the night's sleep turns the day over, shows
 * the new season day, and gets out of the way on its own or on a tap.
 *
 * Specs run without it (DayTransition skips under webdriver), so this one opts in
 * with `?transitions`.
 */

/** Loads the Day 7 save with transitions on, and puts it at night. */
async function nightWithTransitions(page: Page): Promise<void> {
  await loadSave(page, 'save-day7-1');
  await page.goto('/?transitions');
  await expect(page.getByTestId('action-training')).toBeVisible();
  // Scenario setup: the slots before night are not what this spec is about.
  await page.evaluate((night) => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    const { calendar } = handle.game.getState();
    handle.game.setState({ calendar: { ...calendar, currentTimeSlot: night } });
  }, TimeSlot.NIGHT);
}

test('sleeping plays the day card, which clears itself', async ({ page }) => {
  await nightWithTransitions(page);
  const before = await readGame(page);

  await page.getByTestId('action-rest').click();

  const card = page.getByTestId('day-transition');
  await expect(card).toBeVisible();
  const after = await readGame(page);
  expect(after.calendar.currentDay).toBe(before.calendar.currentDay + 1);
  await expect(card).toHaveAttribute('aria-label', `Day ${TimeManager.seasonDay(after.calendar)}`);

  // About two and a half seconds, then the morning is back.
  await expect(card).toBeHidden({ timeout: 4_000 });
});

test('a tap skips the day card', async ({ page }) => {
  await nightWithTransitions(page);
  await page.getByTestId('action-rest').click();

  const card = page.getByTestId('day-transition');
  await expect(card).toBeVisible();
  await card.click();
  await expect(card).toBeHidden({ timeout: 500 });
});
