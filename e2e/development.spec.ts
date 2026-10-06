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
  // The row says what the planned points cost and what the next one would.
  await expect(page.getByTestId('development-planned-focus')).toContainText('Planned +2');
  await expect(page.getByTestId('development-next-focus')).toContainText('Next +1');
  await expect(page.getByTestId('development-planned-forehand')).toHaveCount(0);
  // Only currencies the plan spends show their old balance.
  await expect(
    page.getByTestId('development-wallet').locator('[data-currency="quickness"]'),
  ).not.toContainText('→');

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

test('training pays currency, which buys the anchor in Development', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  const before = (await readGame(page)).player!;

  await page.getByTestId('action-training').click();
  await page.getByTestId('training-anchor-serve').click();
  await page.getByTestId('training-quick-sim').click();

  // Quick Sim is one clean rep. The payout is the game's own function, so this
  // pins that the wallet got exactly what the result says, not the formula.
  await expect(page.getByTestId('training-result-currency')).toBeVisible();
  const trained = (await readGame(page)).player!;
  const last = (await readGame(page)).activityHistory[0];
  expect(last.type).toBe('training');
  if (last.type !== 'training') return;
  for (const c of ['power', 'quickness', 'technique', 'mind'] as const) {
    expect(trained.wallet[c]).toBe(before.wallet[c] + (last.currencyGained[c] ?? 0));
  }
  expect(trained.stats.core.serve, 'training no longer grants stats').toBe(before.stats.core.serve);

  // One serve rep pays more than a serve point costs at the ×1 step.
  await page.getByTestId('training-result-dismiss').click();
  await page.getByTestId('action-development').click();
  await page.getByTestId('development-plus-serve').click();
  await page.getByTestId('development-review').click();
  await page.getByTestId('development-confirm').click();
  await expect(page.getByTestId('development-message')).toContainText('Bought 1');
  const bought = (await readGame(page)).player!;
  expect(bought.stats.core.serve).toBe(before.stats.core.serve + 1);
});

test('D opens Development from the menu and closes it again', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.keyboard.press('d');
  await expect(page.getByTestId('development-wallet')).toBeVisible();
  await page.keyboard.press('d');
  await expect(page.getByTestId('action-development')).toBeVisible();
});
