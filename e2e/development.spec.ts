import { test, expect } from '@playwright/test';
import { grantCurrency, loadSave, readGame } from './helpers';
// The real pricing, so the expected cost cannot drift from the game's.
import {
  STAT_NAMES,
  canAfford,
  getStat,
  planCost,
  plannedStats,
  priceOf,
} from '../src/game/StatDevelopment';
import { GAME_AREAS, gameAreaRatings } from '../src/core/gameAreas';
import { STAT_SECTIONS } from '../src/config/statSections';

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
  // With this much in the wallet a Focus point is affordable, and the row says so.
  await expect(page.getByTestId('development-stat-focus')).toHaveAttribute('data-buyable', 'true');
  // The bar only appears once something is added.
  await expect(page.getByTestId('development-plan-bar')).toHaveCount(0);

  await page.getByTestId('development-plus-focus').click();
  await page.getByTestId('development-plus-focus').click();
  await page.getByTestId('development-plus-serve').click();
  await expect(page.getByTestId('development-stat-focus')).toHaveAttribute('data-planned', '2');
  await expect(page.getByTestId('development-plan-bar')).toBeVisible();
  // The row's cost is the next point's, so it moves as points are added.
  const nextFocus = priceOf('focus', getStat(player.stats, 'focus') + 2);
  await expect(
    page.getByTestId('development-cost-focus').locator('[data-currency="mind"]'),
  ).toHaveAttribute('data-amount', String(nextFocus.mind));
  // Only currencies the plan spends show their old balance.
  await expect(
    page.getByTestId('development-wallet').locator('[data-currency="quickness"]'),
  ).not.toContainText('→');

  // The row's − takes a point back off.
  await page.getByTestId('development-minus-serve').click();
  await expect(page.getByTestId('development-stat-serve')).toHaveAttribute('data-planned', '0');

  const plan = ['focus', 'focus'] as const;
  const cost = planCost(player.stats, plan);
  await expect(
    page.getByTestId('development-wallet').locator('[data-currency="mind"]'),
  ).toHaveAttribute('data-amount', String(Math.floor(player.wallet.mind - (cost.mind ?? 0))));

  // Buying is one tap: the costs are already on screen.
  await page.getByTestId('development-confirm').click();
  await expect(page.getByTestId('development-message')).toContainText('Bought 2');
  await expect(page.getByTestId('development-plan-bar')).toHaveCount(0);

  const after = (await readGame(page)).player!;
  expect(getStat(after.stats, 'focus')).toBe(getStat(player.stats, 'focus') + 2);
  expect(after.wallet.mind).toBe(player.wallet.mind - (cost.mind ?? 0));
  expect(after.wallet.power).toBe(player.wallet.power);
});

test('planned +1s move every area they feed, and the stats keep their order', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await grantCurrency(page, { power: 60, quickness: 60, technique: 60, mind: 60 });
  const player = (await readGame(page)).player!;
  await page.getByTestId('action-development').click();

  // Every stat, in the sections' fixed order, so planning never reorders the rows.
  const order = STAT_SECTIONS.flatMap((s) => s.stats);
  const rows = page.locator('[data-testid^="development-stat-"]');
  const ids = async (): Promise<string[]> =>
    rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-testid') ?? ''));
  expect(await ids()).toEqual(order.map((s) => `development-stat-${s}`));

  // Before anything is planned, each area shows the player's own rating.
  const now = gameAreaRatings(player.stats);
  for (const area of GAME_AREAS) {
    await expect(page.getByTestId(`development-area-${area}`)).toHaveAttribute(
      'data-planned',
      String(now[area]),
    );
  }

  // Speed feeds Returning, Netplay and Coverage at once; seven points move all three
  // by at least one whole point.
  const plan = Array<'speed'>(7).fill('speed');
  for (const stat of plan) await page.getByTestId(`development-plus-${stat}`).click();
  const after = gameAreaRatings(plannedStats(player.stats, plan));
  let moved = 0;
  for (const area of GAME_AREAS) {
    const row = page.getByTestId(`development-area-${area}`);
    await expect(row).toHaveAttribute('data-value', String(now[area]));
    await expect(row).toHaveAttribute('data-planned', String(after[area]));
    // A change shows on screen too, not only in the attribute.
    if (after[area] > now[area]) {
      moved += 1;
      await expect(row).toContainText(`${now[area]}→${after[area]}`);
    }
  }
  expect(moved, 'seven Speed should lift three areas').toBe(3);
  expect(await ids(), 'planning should not reorder the rows').toEqual(
    order.map((s) => `development-stat-${s}`),
  );
});

test('a +1 the wallet cannot cover is disabled', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-development').click();

  // The save starts with an empty wallet, so nothing is affordable.
  await expect(page.getByTestId('development-plus-focus')).toBeDisabled();
  await expect(page.getByTestId('development-needs-focus')).toBeVisible();
  await expect(page.getByTestId('development-cost-focus')).toContainText('Needs');
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

  // One rep pays for a point of something at the ×1 step. Which stat depends on the
  // recipes, so ask the game's own pricing rather than naming one here.
  const buyable = STAT_NAMES.find((s) =>
    canAfford(trained.wallet, priceOf(s, getStat(trained.stats, s) + 1)),
  );
  expect(buyable, 'a single training session should pay for at least one point').toBeDefined();
  if (!buyable) return;
  await page.getByTestId('training-result-dismiss').click();
  await page.getByTestId('action-development').click();
  await page.getByTestId(`development-plus-${buyable}`).click();
  await page.getByTestId('development-confirm').click();
  await expect(page.getByTestId('development-message')).toContainText('Bought 1');
  const bought = (await readGame(page)).player!;
  expect(getStat(bought.stats, buyable)).toBe(getStat(trained.stats, buyable) + 1);
});

test('D opens Development from the menu and closes it again', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.keyboard.press('d');
  await expect(page.getByTestId('development-wallet')).toBeVisible();
  await page.keyboard.press('d');
  await expect(page.getByTestId('action-development')).toBeVisible();
});

test('the Develop badge lights on new currency and goes out on a visit', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  const badge = page.getByTestId('status-wallet');
  await expect(badge).toHaveAttribute('data-new-currency', 'false');

  // A session's pay is new currency; serve pays enough Power to buy something.
  await page.getByTestId('action-training').click();
  await page.getByTestId('training-anchor-serve').click();
  await page.getByTestId('training-quick-sim').click();
  await page.getByTestId('training-result-dismiss').click();
  await expect(badge).toHaveAttribute('data-new-currency', 'true');
  await expect(page.getByTestId('action-development')).toContainText('to spend');
  const dot = page.getByTestId('action-development').getByTestId('unseen-badge');
  await expect(dot).toBeVisible();

  // Looking at it is enough; nothing has to be bought.
  await page.getByTestId('action-development').click();
  await page.getByTestId('screen-back').click();
  await expect(page.getByTestId('action-development')).not.toContainText('to spend');
  await expect(dot).toBeHidden();
});

test('Development holds both halves: stats and specialties', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-development').click();
  await expect(page.getByTestId('development-stat-serve')).toBeVisible();
  await expect(page.getByTestId('development-spec-points')).toBeVisible();

  await page.getByTestId('development-tab-specialties').click();
  // This save hasn't met the coach, so the tab explains how to unlock specialties.
  await expect(page.getByText('Player Archetype')).toBeVisible();
  await expect(page.getByTestId('development-stat-serve')).toHaveCount(0);
  // The wallet stays: both resources are visible from either tab.
  await expect(page.getByTestId('development-spec-points')).toBeVisible();

  await page.getByTestId('development-tab-stats').click();
  await expect(page.getByTestId('development-stat-serve')).toBeVisible();
});
