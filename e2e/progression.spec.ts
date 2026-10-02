import { test, expect } from '@playwright/test';
import { startNewGame, dismissWalkthrough, setMatchSpeed, readGame } from './helpers';
import { runBot } from './bot';

/**
 * Walks a brand-new player through the early-game unlocks in one sitting.
 *
 * The gates are spread across three different mechanisms — a day check in the
 * store (`isMatchUnlocked`), a day check inlined in a component (the shop's
 * `currentDay < 7`), and a scheduled story event that has to actually fire
 * (the coach picking an archetype) — so "can a new player still get there?" is
 * not answerable from any one of them. It needs playing.
 *
 * One walk rather than one per gate: the bot run is the expensive part, and
 * checking the gates as it passes them is both faster and closer to the question
 * being asked.
 */

test('a fresh player reaches each early unlock by playing', async ({ page }) => {
  test.setTimeout(120_000);

  await startNewGame(page);
  await dismissWalkthrough(page);
  await setMatchSpeed(page, 'instant');

  const matchTile = page.getByTestId('action-match');
  const shopTile = page.getByTestId('action-shop');

  // ── Day 1: both gates shut, and saying so ────────────────────────────────
  // A locked action that simply vanished would leave a new player with no idea
  // the feature exists, so the caption is part of the contract.
  await expect(matchTile).toBeDisabled();
  await expect(shopTile).toBeDisabled();
  await expect(matchTile).toContainText('Unlocks Day 5');
  await expect(shopTile).toContainText('Unlocks Day 7');

  // ── Day 5: matches open ──────────────────────────────────────────────────
  await runBot(page, { untilDay: 5 });
  expect((await readGame(page)).calendar.currentDay).toBeGreaterThanOrEqual(5);
  await expect(matchTile).toBeEnabled();
  await expect(shopTile).toBeDisabled();

  // Enabled is not the same as reachable — follow it through to the screen.
  await matchTile.click();
  expect((await readGame(page)).gamePhase.type).toBe('match_setup');
  await page.getByRole('button', { name: /Back/ }).first().click();
  expect((await readGame(page)).gamePhase.type).toBe('idle');

  // ── Day 7: the shop opens, with something in it ──────────────────────────
  await runBot(page, { untilDay: 7 });
  await expect(shopTile).toBeEnabled();
  await shopTile.click();
  expect((await readGame(page)).gamePhase.type).toBe('shop');
  // An empty shop would pass a "the screen opened" check while being useless.
  expect((await readGame(page)).shopItems.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Back/ }).first().click();

  // ── Day 12: the archetype tree, once the coach has introduced it ──────────
  // The chip on the hero header is only a button after a broad archetype is
  // chosen, which happens in a story event scheduled for day 11.
  await runBot(page, { untilDay: 12 });
  const state = await readGame(page);
  expect(
    state.player!.archetypeProfile.broad,
    'the coach event should have set a broad archetype by day 12',
  ).not.toBeNull();

  const archetypeButton = page.getByTestId('action-archetype');
  await expect(archetypeButton).toBeVisible();
  await archetypeButton.click();
  expect((await readGame(page)).gamePhase.type).toBe('archetype');

  // Points are worthless if they cannot be spent, so spend one.
  const pointsBefore = state.player!.archetypeProfile.specializationPoints;
  expect(pointsBefore, 'the walk should have banked a specialization point').toBeGreaterThan(0);

  // The tree opens on the court diagram with a node per phase and no paths
  // showing; picking a phase is what reveals its three specialisations.
  await page
    .getByTestId(/^archetype-phase-/)
    .first()
    .click();

  const specialize = page.getByTestId(/^archetype-specialize-/).first();
  await expect(specialize).toBeEnabled();
  await specialize.click();

  const after = await readGame(page);
  expect(after.player!.archetypeProfile.specializationPoints).toBe(pointsBefore - 1);
  // The point has to have bought something, not just been deducted.
  expect(Object.keys(after.player!.archetypeProfile.phases).length).toBeGreaterThan(0);
});
