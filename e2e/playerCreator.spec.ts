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

  await page.getByTestId('action-match').click();
  await page.getByTestId('preview-match').click();
  await page.getByTestId('start-match-footer').click();

  await expect(page.getByTestId('court-figure-player')).toBeVisible();
  await expect(page.getByTestId('court-figure-opponent')).toBeVisible();
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
