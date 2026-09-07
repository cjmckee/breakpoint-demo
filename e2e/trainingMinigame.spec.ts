import { test, expect, type Page } from '@playwright/test';
import { startNewGame, dismissWalkthrough } from './helpers';

/**
 * Drives a training minigame end to end.
 *
 * The unit checks cover pure logic and cannot mount a component, so nothing else
 * exercises the path a session actually takes: the registry resolves an id to a
 * component, the component mounts, useMinigameRounds reports a MinigameScore, and
 * the training screen turns that score into a session payout. Every one of those
 * links is a plain function call that typechecks whether or not it is wired up.
 */

/** Reaches the minigame for a given core stat, already started. */
async function startMinigame(page: Page, shot: string): Promise<void> {
  await startNewGame(page);
  await dismissWalkthrough(page);

  await page.getByRole('button', { name: 'Training' }).click();
  await expect(page.getByRole('heading', { name: 'Training' })).toBeVisible();

  await page.getByRole('button', { name: new RegExp(`^Train ${shot},`) }).click();
  await expect(page.getByRole('heading', { name: `${shot} Training` })).toBeVisible();

  // The start gate is the shell's, not the game's — every minigame opens on it.
  await page.getByRole('button', { name: '▶ Start' }).click();
}

test('a training minigame mounts, scores, and pays out a session', async ({ page }) => {
  await startMinigame(page, 'Serve');

  // Quick Sim is only offered before the first attempt, so its disappearance is
  // proof the game committed a rep rather than merely rendering.
  const quickSim = page.getByRole('button', { name: /Quick Sim/ });
  await expect(quickSim).toBeVisible();

  // Space commits an attempt in every game. Whether these land is irrelevant —
  // all three attempts always play out, and a miss scores as legitimately as a hit.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  }
  await expect(quickSim).toBeHidden();

  // Reaching this modal means the score survived the whole chain: the hook built
  // it, the training screen read it as a support count, and the store applied the
  // resulting session.
  await expect(page.getByText('Training Complete!')).toBeVisible({ timeout: 5000 });
});

test('every core anchor resolves to a mountable minigame', async ({ page }) => {
  // The registry is a Record keyed on MinigameId, so a missing entry is a compile
  // error — but an id pointing at the wrong component is not. Each anchor should
  // open a game whose start gate appears.
  const shots = ['Serve', 'Forehand', 'Backhand', 'Return', 'Net'];

  await startNewGame(page);
  await dismissWalkthrough(page);
  await page.getByRole('button', { name: 'Training' }).click();

  for (const shot of shots) {
    await page.getByRole('button', { name: new RegExp(`^Train ${shot},`) }).click();

    await expect(page.getByRole('heading', { name: `${shot} Training` })).toBeVisible();
    await expect(page.getByRole('button', { name: '▶ Start' })).toBeVisible();

    // Backing out of the play screen returns to the shot picker without spending
    // the slot, so all five can be checked in one session's worth of energy.
    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page.getByRole('heading', { name: 'Training' })).toBeVisible();
  }
});
