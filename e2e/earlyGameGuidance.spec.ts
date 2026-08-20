import { test, expect, type Page } from '@playwright/test';

/**
 * Covers the day-1 onboarding path: the first week has no matches and no shop, so
 * a new player's only signposts are the main-menu walkthrough and the seeded
 * training goal. These assertions pin both to the screen.
 */

/** The walkthrough card. Scoped because "Next" also appears elsewhere on the menu. */
const callout = (page: Page) => page.getByTestId('tutorial-callout');

/** Creates a player and clicks through the welcome story event to reach the main menu. */
async function startNewGame(page: Page, name = 'Testy McTestface'): Promise<void> {
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

/** Advances past the three-step walkthrough so the plain menu is reachable. */
async function dismissWalkthrough(page: Page): Promise<void> {
  await expect(callout(page)).toBeVisible();
  await callout(page).getByRole('button', { name: 'Next' }).click();
  await callout(page).getByRole('button', { name: 'Next' }).click();
  await callout(page).getByRole('button', { name: "Let's Train" }).click();
  await expect(callout(page)).toBeHidden();
}

test('day-1 walkthrough explains the loop and hands off to the training goal', async ({ page }) => {
  await startNewGame(page);
  const card = callout(page);

  // Step 1 — the day economy
  await expect(card.getByText('Tutorial — Step 1 / 3')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Your Day' })).toBeVisible();
  await expect(card.getByText(/four time slots/i)).toBeVisible();

  // Step 2 — must state Training's payoff *and* push back on Rest, since defaulting
  // to Rest is the behaviour this walkthrough exists to correct.
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByText('Tutorial — Step 2 / 3')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Where Your Time Goes' })).toBeVisible();
  await expect(card.getByText(/guaranteed \+1 to a core stat/i)).toBeVisible();
  await expect(card.getByText(/Rest only refills energy and still burns a slot/i)).toBeVisible();

  // Step 3 — points at the goal
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByText('Tutorial — Step 3 / 3')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Your Goals' })).toBeVisible();
  await expect(card.getByText(/six training sessions before your Day 5 assessment/i)).toBeVisible();

  // Dismissing leaves the player on the menu with the walkthrough gone for good
  await card.getByRole('button', { name: "Let's Train" }).click();
  await expect(card).toBeHidden();

  await page.reload();
  await expect(card).toBeHidden();
});

test('the week-one training goal is seeded on day 1', async ({ page }) => {
  await startNewGame(page);
  await dismissWalkthrough(page);

  // The strip must not read as empty on day 1 — that emptiness was the original problem.
  const challengeStrip = page.getByRole('button', { name: /Challenges/ });
  await expect(challengeStrip).toBeVisible();
  await expect(page.getByText('No active challenges — new quests appear as you play')).toBeHidden();

  await challengeStrip.click();
  await expect(page.getByText('Putting In The Reps')).toBeVisible();

  // Cards start collapsed — requirements and progress live behind a tap
  await page.getByText('Putting In The Reps').click();
  await expect(page.getByText('Complete 6 training sessions')).toBeVisible();
  await expect(page.getByText('0/6')).toBeVisible();
});

test('the walkthrough never covers the section it points at', async ({ page }) => {
  await startNewGame(page);
  const card = page.getByTestId('tutorial-callout');
  const spotlit = page.locator('[data-spotlit]');

  // The callout is docked to a viewport edge, and on a phone the menu is barely taller
  // than the screen — so it has to dodge to the opposite half rather than sit on top of
  // its own subject. Step 3 is the tight one: the challenge strip sits low on the page.
  for (const advance of ['Next', 'Next', "Let's Train"]) {
    await expect(spotlit).toHaveCount(1);
    const target = await spotlit.boundingBox();
    const callout = await card.boundingBox();
    expect(target, 'spotlit section should be laid out').not.toBeNull();
    expect(callout, 'callout should be laid out').not.toBeNull();

    const overlaps =
      target!.x < callout!.x + callout!.width &&
      callout!.x < target!.x + target!.width &&
      target!.y < callout!.y + callout!.height &&
      callout!.y < target!.y + target!.height;
    expect(overlaps, `callout overlaps the section it describes`).toBe(false);

    await card.getByRole('button', { name: advance }).click();
    await page.waitForTimeout(400);
  }
});

test('match and shop are gated but visibly dated, not silently missing', async ({ page }) => {
  await startNewGame(page);
  await dismissWalkthrough(page);

  await expect(page.getByText('Unlocks Day 5')).toBeVisible();
  await expect(page.getByText('Unlocks Day 7')).toBeVisible();
});
