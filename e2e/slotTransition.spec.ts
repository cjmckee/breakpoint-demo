import { test, expect } from '@playwright/test';
import { loadSave, readGame } from './helpers';
import { TimeSlot } from '../src/types/game';

/**
 * The beat between time slots: training moves the clock while its result opens, so the
 * beat waits for the result to be dismissed and then plays over the next slot.
 *
 * Specs run without it (SlotTransition skips under webdriver), so this one opts in
 * with `?transitions`.
 */
test('training waits for its result, then the slot beat plays', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await page.goto('/?transitions');
  await expect(page.getByTestId('action-training')).toBeVisible();
  const before = await readGame(page);
  expect(before.calendar.currentTimeSlot).toBe(TimeSlot.MORNING);

  await page.getByTestId('action-training').click();
  await page.locator('[data-testid="training-offer"] [data-drill]').first().click();
  await page.getByTestId('training-quick-sim').click();

  // The clock has moved, but the result is still the morning's.
  await expect(page.getByTestId('training-result-dismiss')).toBeVisible();
  expect((await readGame(page)).calendar.currentTimeSlot).toBe(TimeSlot.AFTERNOON);
  const beat = page.getByTestId('slot-transition');
  await expect(beat).toHaveCount(0);

  await page.getByTestId('training-result-dismiss').click();
  await expect(beat).toBeVisible();
  await expect(beat).toHaveAttribute('data-from', String(TimeSlot.MORNING));
  await expect(beat).toHaveAttribute('data-to', String(TimeSlot.AFTERNOON));
  await expect(beat).toHaveAttribute('aria-label', 'Afternoon');

  // A second, then the afternoon is back.
  await expect(beat).toBeHidden({ timeout: 3_000 });
});
