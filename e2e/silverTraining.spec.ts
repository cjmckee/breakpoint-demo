import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame } from './helpers';

/**
 * Silver training: from the Regional tier a session can pick a focus, the
 * currency that stands in for the shot's secondary one.
 *
 * The focus touches three things a spec cannot see from the store alone: the
 * picker has to appear only from silver, the chosen chip has to rewrite the
 * shot previews before anything is played, and the session that follows has to
 * pay what the preview promised. A focus that reached the preview but not the
 * payout (or the reverse) would look right on one screen and be wrong on the
 * other.
 */

async function setTier(page: Page, tier: 1 | 2): Promise<void> {
  await page.evaluate((t) => {
    const game = window.__test__!.game;
    const player = game.getState().player!;
    game.setState({ player: { ...player, tier: t } });
  }, tier);
}

test('bronze training has no focus to pick', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await page.getByTestId('action-training').click();
  await expect(page.getByTestId('training-anchor-serve')).toBeVisible();
  await expect(page.getByTestId('training-focus')).toHaveCount(0);
});

test('a silver session pays the focus it was given', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await setTier(page, 2);
  await page.getByTestId('action-training').click();

  // Serve's natural mix is Power with Mind; focus swaps the Mind for Technique.
  const serve = page.getByTestId('training-anchor-serve');
  await expect(serve, 'the natural serve preview pays Mind').toContainText('Mind');
  await page.getByTestId('training-focus-technique').click();
  await expect(page.getByTestId('training-focus-technique')).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(serve).toContainText('Technique');
  await expect(serve).not.toContainText('Mind');
  expect((await readGame(page)).player?.trainingFocus, 'the pick is remembered').toBe('technique');

  await serve.click();
  await page.getByTestId('training-quick-sim').click();

  await expect(page.getByTestId('training-result-tier')).toHaveAttribute('data-tier', 'silver');
  const last = (await readGame(page)).currentStatus.lastActivity;
  const earned = last?.type === 'training' ? last.currencyGained : {};
  expect(earned.technique ?? 0, 'the session paid Technique').toBeGreaterThan(0);
  expect(earned.mind ?? 0, 'and no Mind').toBe(0);
  expect(earned.power ?? 0, 'and still the serve’s Power').toBeGreaterThan(0);
});
