import { test, expect, type Page } from '@playwright/test';
import { startNewGame, dismissWalkthrough } from './helpers';

/**
 * Night is the one slot with a single legal action, and the UI says so by dimming
 * everything and lifting Sleep out of the dimming.
 *
 * That lift is pure CSS stacking, which is exactly the kind of thing that breaks
 * silently: `.night-exempt` raises the tile to z-index 20 to clear the overlay at
 * z-index 10, so any positioned ancestor with its own z-index traps it and the
 * tile goes dark with everything else. The walkthrough work did precisely that by
 * giving the action hub `relative z-0`, and nothing caught it.
 */

/** Burns one time slot with a Quick Sim training session. */
async function trainOnce(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Training' }).click();
  await page.getByRole('button', { name: /^Train Serve,/ }).click();
  await page.getByRole('button', { name: /Quick Sim/ }).click();
  await page.getByRole('button', { name: 'Back to Menu' }).click();
}

/** Morning -> Night is three slots, so three sessions at 20 energy each. */
async function advanceToNight(page: Page): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('button', { name: /Sleep/ })).toBeHidden();
    await trainOnce(page);
  }
  await expect(page.getByRole('button', { name: /Sleep/ })).toBeVisible();
}

test('night dims the menu and leaves Sleep lit', async ({ page }) => {
  await startNewGame(page);
  await dismissWalkthrough(page);
  await advanceToNight(page);

  // The two slot-consuming actions are gone for the night.
  await expect(page.getByRole('button', { name: /Training/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Play Match/ })).toBeDisabled();

  const sleep = page.getByRole('button', { name: /Sleep/ });
  await expect(sleep).toBeEnabled();
  await expect(sleep).toHaveClass(/night-exempt/);

  // The tile must actually clear the overlay rather than merely being labelled
  // exempt: z-index 20 against the overlay's 10.
  const sleepZ = await sleep.evaluate((el) => getComputedStyle(el).zIndex);
  expect(sleepZ, 'Sleep tile should sit above the night overlay').toBe('20');

  // ...which only holds if no ancestor boxes it into its own stacking context.
  // This is the regression: the action hub used to be an unpositioned grid.
  const hubZ = await page
    .getByTestId('action-hub')
    .evaluate((el) => getComputedStyle(el).zIndex);
  expect(hubZ, 'action hub must not create a stacking context outside the tutorial').toBe('auto');
});

test('the walkthrough still stacks above the page while it runs', async ({ page }) => {
  // The spotlight lift and the night lift use the same mechanism, so removing the
  // one must not cost the other.
  await startNewGame(page);

  const hub = page.getByTestId('action-hub');
  await expect(page.getByTestId('tutorial-callout')).toBeVisible();

  // Step 3 of 4 spotlights the action hub, which is when it should be raised.
  const callout = page.getByTestId('tutorial-callout');
  await callout.getByRole('button', { name: 'Next' }).click();
  await callout.getByRole('button', { name: 'Next' }).click();
  await expect(hub).toHaveAttribute('data-spotlit', 'true');

  // Polled rather than read once: the spotlight carries transition-all, and
  // z-index is an animatable integer, so a single read lands mid-flight on
  // whatever step the interpolation is on.
  await expect
    .poll(() => hub.evaluate((el) => getComputedStyle(el).zIndex))
    .toBe('60');
});
