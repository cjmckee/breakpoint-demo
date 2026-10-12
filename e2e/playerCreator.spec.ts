import { test, expect } from '@playwright/test';
import { readGame, stubThirdParty } from './helpers';

/**
 * The player creator builds a pixel-art look and saves it on the player.
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
