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

/** The walkthrough's steps, in order, ending on the button that closes it. */
const WALKTHROUGH_ADVANCE = ['Next', 'Next', 'Next', "Let's Train"] as const;

/** Advances past the walkthrough so the plain menu is reachable. */
async function dismissWalkthrough(page: Page): Promise<void> {
  await expect(callout(page)).toBeVisible();
  for (const label of WALKTHROUGH_ADVANCE) {
    await callout(page).getByRole('button', { name: label }).click();
  }
  await expect(callout(page)).toBeHidden();
}

test('day-1 walkthrough explains the loop and hands off to the training goal', async ({ page }) => {
  await startNewGame(page);
  const card = callout(page);

  // Step 1 — the day economy
  await expect(card.getByText('Tutorial — Step 1 / 4')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Your Day' })).toBeVisible();
  await expect(card.getByText(/four timeslots/i)).toBeVisible();

  // Step 2 — the ratings, anchored on the grades in the hero header
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByText('Tutorial — Step 2 / 4')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Your stats' })).toBeVisible();
  await expect(card.getByText(/14 ratings/i)).toBeVisible();

  // Step 3 — must state Training's payoff *and* push back on Rest, since defaulting
  // to Rest is the behaviour this walkthrough exists to correct.
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByText('Tutorial — Step 3 / 4')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Where to start' })).toBeVisible();
  await expect(card.getByText(/Training is a surefire way to improve your stats/i)).toBeVisible();
  await expect(card.getByText(/only recovers 20 energy/i)).toBeVisible();

  // Step 4 — points at the goal
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card.getByText('Tutorial — Step 4 / 4')).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Challenges' })).toBeVisible();
  await expect(card.getByText(/six training sessions/i)).toBeVisible();

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

test('the walkthrough keeps the section it points at visible', async ({ page }) => {
  await startNewGame(page);
  const card = page.getByTestId('tutorial-callout');
  const spotlit = page.locator('[data-spotlit]');
  const viewport = page.viewportSize()!.height;

  // The callout docks to a viewport edge, and on a phone the menu is barely taller than
  // the screen, so it has to dodge rather than sit on its own subject. For the stat
  // breakdown — taller than the viewport — dodging is impossible, so the guarantee is
  // weaker but still real: a usable band of the section stays clear of the callout.
  for (const [index, advance] of WALKTHROUGH_ADVANCE.entries()) {
    await expect(spotlit).toHaveCount(1);
    const target = await spotlit.boundingBox();
    const callout = await card.boundingBox();
    expect(target, 'spotlit section should be laid out').not.toBeNull();
    expect(callout, 'callout should be laid out').not.toBeNull();

    // Both are near-full-width bands, so overlap reduces to the vertical axis.
    const visibleTop = Math.max(0, target!.y);
    const visibleBottom = Math.min(viewport, target!.y + target!.height);
    const calloutTop = callout!.y;
    const calloutBottom = callout!.y + callout!.height;

    const clearBand =
      calloutTop <= visibleTop
        ? visibleBottom - Math.max(visibleTop, calloutBottom)
        : Math.min(visibleBottom, calloutTop) - visibleTop;

    // A section that fits must be entirely clear; one that doesn't (the stat panel)
    // only has to keep a screen-sized chunk readable. The status bar is 52px tall, so
    // a flat viewport-relative floor would fail it for being small rather than hidden.
    const visibleHeight = visibleBottom - visibleTop;
    const required = Math.min(visibleHeight, viewport * 0.35);

    expect(
      clearBand,
      `step ${index + 1}: too little of the spotlit section is clear of the callout`
    ).toBeGreaterThanOrEqual(required);

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
