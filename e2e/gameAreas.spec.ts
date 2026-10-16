import { test, expect } from '@playwright/test';
import { loadSave, readGame } from './helpers';
// The real area function: a pure stats → ratings call, so the expectation is the
// game's own and can't drift from what the card shows.
import { GAME_AREAS, gameAreaRatings } from '../src/core/gameAreas';
import { getLetterGrade } from '../src/utils/playerStats';

/**
 * The pre-match card compares the two players by area of the game (Serving,
 * Returning, Baseline, Netplay, Coverage), each a blend of the stats the engine
 * uses there. This catches the card drifting from those blends, or a row going
 * missing, which no Node check can see.
 */
test('the pre-match card rates both players in every area of the game', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 1234);
  await page.getByTestId('action-match').click();
  await page.getByTestId('preview-match').click();
  await expect(page.getByTestId('head-to-head')).toBeVisible();

  const game = await readGame(page);
  const phase = game.gamePhase;
  if (phase.type !== 'match_setup' || !phase.matchConfig || !game.player) {
    throw new Error(`expected the pre-match screen, got ${phase.type}`);
  }
  const ours = gameAreaRatings(game.player.stats);
  const theirs = gameAreaRatings(phase.matchConfig.opponentStats);

  await expect(page.locator('[data-testid^="head-to-head-area-"]')).toHaveCount(GAME_AREAS.length);
  for (const area of GAME_AREAS) {
    const row = page.getByTestId(`head-to-head-area-${area}`);
    await expect(row).toHaveAttribute('data-gap', String(ours[area] - theirs[area]));
    // Both numbers are on screen, not only in the attribute.
    await expect(row.locator('span').first()).toHaveText(String(ours[area]));
    await expect(row.locator('span').last()).toHaveText(String(theirs[area]));
  }
});

/**
 * The main menu's hero grades the player in the same five areas, as letters only.
 * Catches the hero drifting from the blends, or showing a number it shouldn't.
 */
test('the main menu grades the player in every area of the game', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 1234);
  const game = await readGame(page);
  const ratings = gameAreaRatings(game.player!.stats);

  await expect(page.locator('[data-testid^="menu-area-"]')).toHaveCount(GAME_AREAS.length);
  for (const area of GAME_AREAS) {
    const { grade } = getLetterGrade(ratings[area]);
    const tile = page.getByTestId(`menu-area-${area}`);
    await expect(tile).toHaveAttribute('data-grade', grade);
    await expect(tile, 'a letter, not the rating behind it').not.toContainText(
      String(ratings[area]),
    );
  }
});
