import { test, expect } from '@playwright/test';
import { loadSave, readGame, stubThirdParty, triggerStoryEvent } from './helpers';

/**
 * The player creator builds a pixel-art look, and that look is the one on court.
 *
 * The creator's choices are only data until something draws them, so the spec follows
 * one through: chosen on the form, saved on the player, and standing on the court once
 * a match starts. Named characters carry fixed looks into dialogue the same way.
 */

test('the creator saves the chosen look', async ({ page }) => {
  await stubThirdParty(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Your Journey' }).click();

  await page.locator('#player-name').fill('Pixel Pat');
  await page.getByTestId('creator-hair-style-ponytail').click();
  await page.getByTestId('creator-hair-color-auburn').click();
  await page.getByTestId('creator-skin-brown').click();
  await page.getByTestId('creator-kit-crimson').click();
  await page.getByTestId('creator-hand-left').click();

  // The preview plays the poses on its own, so the look is seen in motion.
  const preview = page.getByTestId('creator-preview');
  await expect(preview).toHaveAttribute('data-pose', 'idle');
  await expect(preview).toHaveAttribute('data-pose', 'run');

  await page.getByTestId('creator-submit').click();
  await expect(page.getByRole('dialog').first()).toBeVisible();

  const { player } = await readGame(page);
  expect(player?.appearance).toEqual({
    skinTone: 'brown',
    hairStyle: 'ponytail',
    hairColor: 'auburn',
    kitColor: 'crimson',
    handedness: 'left',
  });
});

test('both players stand on the court as sprites', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 1234);

  await expect(page.getByTestId('menu-avatar')).toBeVisible();
  await page.getByTestId('action-match').click();
  await page.getByTestId('preview-match').click();

  // Pre-match, the two players face each other over the head-to-head.
  await expect(page.getByTestId('head-to-head-player-sprite')).toBeVisible();
  await expect(page.getByTestId('head-to-head-opponent-sprite')).toBeVisible();

  // Every stat label sits between its two bars, never over them — the pixel font is
  // wide, and a fixed label column let "Forehand" run into the bars.
  const overlaps = await page
    .locator('[data-testid^="head-to-head-"][data-gap]')
    .evaluateAll((rows) =>
      rows.flatMap((row) => {
        const [, left, label, right] = Array.from(row.children).map((c) =>
          c.getBoundingClientRect(),
        );
        return left.right <= label.left + 0.5 && label.right <= right.left + 0.5
          ? []
          : [row.getAttribute('data-testid')];
      }),
    );
  expect(overlaps).toEqual([]);
  await page.getByTestId('start-match-footer').click();

  await expect(page.getByTestId('court-figure-player')).toBeVisible();
  await expect(page.getByTestId('court-figure-opponent')).toBeVisible();

  // The ball is drawn on the players' pixel grid, so it grows with them.
  const sprite = await page.getByTestId('court-figure-player').locator('svg').boundingBox();
  const ball = await page.getByTestId('court-ball').boundingBox();
  expect(ball!.width).toBeGreaterThan(sprite!.width / 8);

  // When a point ends, its winner cheers and the loser slumps.
  const figures = page.locator('[data-testid^="court-figure-"]');
  await expect(figures.and(page.locator('[data-pose="cheer"]'))).toHaveCount(1, {
    timeout: 20_000,
  });
  await expect(figures.and(page.locator('[data-pose="slump"]'))).toHaveCount(1);
});

test('a named character speaks with their portrait', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 1234);
  await triggerStoryEvent(page, 'pond_with_keith');

  // Step through the dialogue until Keith speaks: his line shows his own portrait.
  const portrait = page.getByTestId('dialogue-portrait');
  for (let i = 0; i < 15; i++) {
    if ((await portrait.getAttribute('data-character-id').catch(() => null)) === 'keith') break;
    await page.getByTestId('story-advance').click();
  }
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('data-character-id', 'keith');
});

test('with reduced motion the preview holds still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubThirdParty(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Your Journey' }).click();

  // The loop would have moved on to the run pose by now.
  const preview = page.getByTestId('creator-preview');
  await page.waitForTimeout(3_000);
  await expect(preview).toHaveAttribute('data-pose', 'idle');
});
