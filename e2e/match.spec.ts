import { test, expect } from '@playwright/test';
import { loadSave, setMatchSpeed, playMatch, readGame, readMatch } from './helpers';

/**
 * Drives a practice match from the menu to the results screen.
 *
 * Nothing else in the suite plays a match. The unit checks and the analysis
 * probes both call MatchOrchestrator directly, which skips everything a real
 * session goes through: the pre-match screen builds the config, the store holds
 * the orchestrator, the modal renders the tactics, a click resolves the promise
 * the simulation is blocked on, and the result lands back on the menu. Every one
 * of those links typechecks whether or not it is wired up.
 *
 * The save skips seven days of play; `instant` skips the between-point
 * animation, without which a single match is the better part of a minute.
 */

const SAVE = 'save-day7-1';

test('a practice match plays through its key moments to a result', async ({ page }) => {
  test.setTimeout(60_000);

  await loadSave(page, SAVE, 1234);
  await setMatchSpeed(page, 'instant');

  const energyBefore = (await readGame(page)).currentStatus.energy;

  await page.getByTestId('action-match').click();
  await page.getByTestId('preview-match').click();
  await page.getByTestId('start-match-footer').click();

  const run = await playMatch(page);

  // A match that resolved without ever stopping for a decision would pass a
  // "results are visible" check while proving nothing about key moments.
  expect(run.keyMoments).toBeGreaterThan(0);
  await expect(page.getByTestId('match-results')).toBeVisible();

  // The store is the only place some of this is legible at all — the modal
  // shows a scoreline, not how many decisions were recorded against it.
  const match = await readMatch(page);
  expect(match.keyMomentHistory).toHaveLength(run.keyMoments);
  expect(match.currentScore).not.toBeNull();

  // Playing a match costs energy, which the results screen never states.
  const game = await readGame(page);
  expect(game.currentStatus.energy).toBeLessThan(energyBefore);
});

test('the same seed replays the same match', async ({ page }) => {
  test.setTimeout(90_000);

  // Same seed, same save, same policy — so the tactics offered, and therefore
  // the ids chosen, have to come out identical. This is the guard on the seeded
  // RNG actually reaching the simulation: unseeded, the menus differ within a
  // few key moments and the trails diverge.
  const runOnce = async (): Promise<string[]> => {
    await page.context().clearCookies();
    await loadSave(page, SAVE, 4242);
    await setMatchSpeed(page, 'instant');
    await page.getByTestId('action-match').click();
    await page.getByTestId('preview-match').click();
    await page.getByTestId('start-match-footer').click();
    const run = await playMatch(page);
    return run.chosen;
  };

  const first = await runOnce();
  const second = await runOnce();

  expect(first.length).toBeGreaterThan(0);
  expect(second).toEqual(first);
});
