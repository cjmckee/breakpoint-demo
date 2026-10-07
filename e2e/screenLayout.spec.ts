import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame } from './helpers';

/**
 * Screens share one document and one frame, so anything that is not reset or
 * shared on navigation leaks from one screen into the next.
 *
 * The bug this was written for: Match Setup's Preview button sits at the bottom of
 * a long page, and Pre-match opened at that same offset — title and the header
 * Start button above the viewport, the player dropped mid-way down two stat lists.
 * Nothing in the model is wrong when that happens, so only a driven browser sees it.
 * The same goes for the frame itself: positions are layout, invisible to the store.
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

/** Left edge and top of an element, rounded to whole pixels. */
async function corner(page: Page, testId: string): Promise<{ x: number; y: number }> {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box, `${testId} should be on screen`).not.toBeNull();
  return { x: Math.round(box!.x), y: Math.round(box!.y) };
}

test('the status bar and page title hold their place from screen to screen', async ({ page }) => {
  // Each screen used to place its own back button and pick its own width, so the
  // day/energy bar slid sideways on every navigation and vanished on the match
  // screens. A shared frame fixes that; this pins it.
  await loadSave(page, SAVE, 7);
  const menuCalendar = await corner(page, 'status-calendar');
  const menuEnergy = await page.getByTestId('status-energy').boundingBox();

  let standardTitle: { x: number; y: number } | null = null;
  for (const id of ['relationships', 'shop', 'development', 'challenges', 'training', 'match']) {
    await page.getByTestId(`action-${id}`).click();
    expect(await corner(page, 'status-calendar'), `status bar on ${id}`).toEqual(menuCalendar);
    // Development hides the wallet; the energy bar must not grow into its space.
    expect(await page.getByTestId('status-energy').boundingBox(), `energy on ${id}`).toEqual(
      menuEnergy,
    );

    const title = await corner(page, 'screen-title');
    standardTitle ??= title;
    expect(title, `title on ${id}`).toEqual(standardTitle);

    await page.getByTestId('screen-back').click();
    await expect(page.getByTestId('action-hub')).toBeVisible();
  }
});

test('switching Development tabs does not move the tabs', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-development').click();
  const onStats = await corner(page, 'development-tab-stats');
  await page.getByTestId('development-tab-specialties').click();
  await expect(page.getByTestId('development-tab-specialties')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(await corner(page, 'development-tab-stats')).toEqual(onStats);
});
