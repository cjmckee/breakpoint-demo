import { expect, type Page } from '@playwright/test';

/**
 * Shared setup for specs that need a real player past the onboarding gate.
 * Extracted from earlyGameGuidance.spec.ts once a second spec needed it.
 */

/** The walkthrough card. Scoped because "Next" also appears elsewhere on the menu. */
export const callout = (page: Page) => page.getByTestId('tutorial-callout');

/** Creates a player and clicks through the welcome story event to reach the main menu. */
export async function startNewGame(page: Page, name = 'Testy McTestface'): Promise<void> {
  await page.goto('/');

  // Demo splash shown over the creation form
  await page.getByRole('button', { name: 'Start Your Journey' }).click();

  await page.locator('#player-name').fill(name);
  await page.getByRole('button', { name: 'Create Player' }).click();

  // welcome_to_tennis_rpg runs dialogue, resolves, then grants two items — so the chain
  // is Continue through the dialogue and result, then Next/Got it through the item
  // popups. Drain every dialog until none remain.
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 30; i++) {
    if ((await dialog.count()) === 0) break;
    const advance = dialog
      .last()
      .getByRole('button')
      .filter({ hasText: /^(Continue|Next|Got it)$/ })
      .first();
    if (!(await advance.isVisible().catch(() => false))) break;
    await advance.click();
    await page.waitForTimeout(120);
  }

  // The walkthrough must wait for a genuinely clear screen: App renders the item
  // popups beside MainMenu with overlay={null}, so this is the regression guard.
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('tutorial-callout')).toBeVisible();
}

/** The walkthrough's steps, in order, ending on the button that closes it. */
export const WALKTHROUGH_ADVANCE = ['Next', 'Next', 'Next', "Let's Train"] as const;

/** Advances past the walkthrough so the plain menu is reachable. */
export async function dismissWalkthrough(page: Page): Promise<void> {
  await expect(callout(page)).toBeVisible();
  for (const label of WALKTHROUGH_ADVANCE) {
    await callout(page).getByRole('button', { name: label }).click();
  }
  await expect(callout(page)).toBeHidden();
}
