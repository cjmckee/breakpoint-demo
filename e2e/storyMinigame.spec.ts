import { test, expect } from '@playwright/test';
import { startNewGame, dismissWalkthrough } from './helpers';

/**
 * Drives a story event through its minigame and back out the other side.
 *
 * storyMinigameCheck.ts pins getOutcome, but that is one pure function in the
 * middle of a two-pass round trip: the option has to park the event on the phase,
 * MinigameHost has to resolve and mount the game, the score has to come back
 * through completeMinigame, and the event has to resume where it left off. None
 * of that is reachable from a unit check.
 *
 * The event is forced through the debug panel — it needs day 12 and a Keith
 * relationship of 15, which no test wants to play its way to.
 */

test('a story event plays its minigame and resolves on the score', async ({ page }) => {
  // Five casts that each run out their clock take most of the default 30s alone.
  test.setTimeout(90_000);
  await startNewGame(page);
  await dismissWalkthrough(page);

  await page.getByTitle('Debug Panel').click();
  await page.getByPlaceholder('Filter by id, name, or tag').fill('aquarium');
  await page.getByRole('button', { name: /The Aquarium/ }).click();

  // Dialogue runs before the choices appear.
  for (let i = 0; i < 20; i++) {
    const cont = page.getByRole('button', { name: /^Continue$/ });
    if (!(await cont.isVisible().catch(() => false))) break;
    await cont.click();
    await page.waitForTimeout(120);
  }

  await page.getByRole('button', { name: /Take the bet/ }).click();
  await page.getByRole('button', { name: 'Confirm Choice' }).click();

  // The option handed the screen to MinigameHost, which resolved 'fishing_cast'
  // out of the registry. Nothing else in the suite mounts a game this way.
  await expect(page.getByText('Cast & Reel')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: '▶ Start' }).click();

  // Five casts, not the training three — the event's game declares its own shape.
  // Nobody steers the lure, so each cast runs out its clock. Whether any fish swims
  // under the lure is irrelevant; both branches are a legitimate resolution.
  // Either branch, but a branch — the score came back and picked one. The keychain
  // branch names it in the text and in the item card, hence first().
  await expect(page.getByText(/penguin|keychain/i).first()).toBeVisible({ timeout: 45_000 });

  // The event arrived as an overlay on the menu, so its result belongs there too.
  // Leaving for the minigame is what loses that, so this is the regression guard.
  await expect(page.getByRole('button', { name: 'Training' })).toBeVisible();
});
