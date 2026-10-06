import { test, expect } from '@playwright/test';
import { grantCurrency, loadSave, readGame } from './helpers';
// The real pricing, so the expected cost cannot drift from the game's.
import { getStat, planCost } from '../src/game/StatDevelopment';

/**
 * Drives the Development screen: plan a few +1s, confirm, and check the model.
 *
 * The screen previews a cost and a remaining wallet; the purchase is a separate
 * computation in the store. These specs click like a player and then read the
 * store, so a preview that disagrees with what was actually charged fails here.
 */

const SAVE = 'save-day7-1';

test('a confirmed plan raises the stats and charges the plan cost', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await grantCurrency(page, { power: 40, quickness: 40, technique: 40, mind: 40 });
  const before = await readGame(page);
  const player = before.player!;

  await expect(page.getByTestId('action-development')).toBeVisible();
  await page.getByTestId('action-development').click();
  await expect(page.getByTestId('development-wallet')).toBeVisible();

  await page.getByTestId('development-plus-focus').click();
  await page.getByTestId('development-plus-focus').click();
  await page.getByTestId('development-plus-serve').click();
  await expect(page.getByTestId('development-stat-focus')).toHaveAttribute('data-planned', '2');

  // Undo drops the last +1, not the first.
  await page.getByTestId('development-undo').click();
  await expect(page.getByTestId('development-stat-serve')).toHaveAttribute('data-planned', '0');

  const plan = ['focus', 'focus'] as const;
  const cost = planCost(player.stats, plan);
  await expect(
    page.getByTestId('development-wallet').locator('[data-currency="mind"]'),
  ).toHaveAttribute('data-amount', String(Math.floor(player.wallet.mind - (cost.mind ?? 0))));

  await page.getByTestId('development-review').click();
  await expect(page.getByTestId('development-confirm-panel')).toBeVisible();
  await page.getByTestId('development-confirm').click();
  await expect(page.getByTestId('development-message')).toContainText('Bought 2');

  const after = (await readGame(page)).player!;
  expect(getStat(after.stats, 'focus')).toBe(getStat(player.stats, 'focus') + 2);
  expect(after.wallet.mind).toBe(player.wallet.mind - (cost.mind ?? 0));
  expect(after.wallet.power).toBe(player.wallet.power);
});

test('a +1 the wallet cannot cover is disabled', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-development').click();

  // The save starts with an empty wallet, so nothing is affordable.
  await expect(page.getByTestId('development-plus-focus')).toBeDisabled();
  await expect(page.getByTestId('development-review')).toHaveCount(0);
});
