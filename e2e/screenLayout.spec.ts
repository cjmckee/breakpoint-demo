import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame } from './helpers';

/**
 * Screens share one document, so anything that is not reset on navigation leaks
 * from one screen into the next.
 *
 * The bug this was written for: Match Setup's Preview button sits at the bottom of
 * a long page, and Pre-match opened at that same offset — title and the header
 * Start button above the viewport, the player dropped mid-way down two stat lists.
 * Nothing in the model is wrong when that happens, so only a driven browser sees it.
 */

const SAVE = 'save-day7-1';

const scrollY = (page: Page): Promise<number> => page.evaluate(() => window.scrollY);

test('the opponent preview opens at the top of the page', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-match').click();

  const preview = page.getByTestId('preview-match');
  await preview.scrollIntoViewIfNeeded();
  expect(await scrollY(page), 'Preview should need a scroll to reach').toBeGreaterThan(0);
  await preview.click();

  await expect(page.getByTestId('start-match-header')).toBeInViewport();
  expect(await scrollY(page)).toBe(0);
  expect((await readGame(page)).gamePhase.type).toBe('match_setup');
});
