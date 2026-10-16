import { test, expect, type Page } from '@playwright/test';
import { loadSave, offerDrill, readGame } from './helpers';
import { CURRENCY_LABELS } from '../src/config/economy';

/**
 * Silver training: from the Regional tier a session can pick a focus, the
 * currency that stands in for the drill's secondary one.
 *
 * The focus touches three things a spec cannot see from the store alone: the
 * picker has to appear only from silver, the chosen chip has to rewrite the
 * drills' pay before anything is played, and the session that follows has to
 * pay what the card promised. A focus that reached the card but not the payout
 * (or the reverse) would look right on one screen and be wrong on the other.
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
  await expect(page.locator('[data-testid="training-offer"] [data-drill]')).toHaveCount(3);
  await expect(page.getByTestId('training-focus')).toHaveCount(0);
});

test('a silver session pays the focus it was given', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await setTier(page, 2);
  // Rally Rhythm pays Power with Technique; the focus swaps the Technique for Mind.
  await offerDrill(page, 'rally_rhythm');
  await page.getByTestId('action-training').click();

  const rally = page.getByTestId('training-drill-rally_rhythm');
  await expect(rally, 'the natural pay is Technique').toContainText(CURRENCY_LABELS.technique);
  await page.getByTestId('training-focus-mind').click();
  await expect(page.getByTestId('training-focus-mind')).toHaveAttribute('data-selected', 'true');
  await expect(rally).toContainText(CURRENCY_LABELS.mind);
  await expect(rally).not.toContainText(CURRENCY_LABELS.technique);
  expect((await readGame(page)).player?.trainingFocus, 'the pick is remembered').toBe('mind');

  await rally.click();
  await page.getByTestId('training-quick-sim').click();

  await expect(page.getByTestId('training-result-tier')).toHaveAttribute('data-tier', 'silver');
  const last = (await readGame(page)).currentStatus.lastActivity;
  const earned = last?.type === 'training' ? last.currencyGained : {};
  expect(earned.mind ?? 0, 'the session paid Mind').toBeGreaterThan(0);
  expect(earned.technique ?? 0, 'and no Technique').toBe(0);
  expect(earned.power ?? 0, 'and still the drill’s Power').toBeGreaterThan(0);
});
