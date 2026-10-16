import { test, expect } from '@playwright/test';
import { loadSave, readGame } from './helpers';
// The real contest function: a pure stats → composites call, so the expectation is
// the engine's own and can't drift from what the card shows.
import { serviceContests } from '../src/core/serviceContests';

/**
 * The pre-match card leads with the two contests holds and breaks are decided
 * on: your first serve against their return, and your return against their
 * serve. Raw stats don't say that (a high serve stat against a reader of the serve
 * is not an edge), so the card has to show the engine's composites, not the stat
 * list again. This catches the card drifting from them, or a row going missing,
 * which no Node check can see.
 */
test('the pre-match card shows both service contests as the engine reads them', async ({
  page,
}) => {
  await loadSave(page, 'save-day7-1', 1234);
  await page.getByTestId('action-match').click();
  await page.getByTestId('preview-match').click();
  await expect(page.getByTestId('head-to-head')).toBeVisible();

  const game = await readGame(page);
  const phase = game.gamePhase;
  if (phase.type !== 'match_setup' || !phase.matchConfig || !game.player) {
    throw new Error(`expected the pre-match screen, got ${phase.type}`);
  }
  const expected = serviceContests(game.player.stats, phase.matchConfig.opponentStats);

  for (const key of ['serve', 'return'] as const) {
    const row = page.getByTestId(`head-to-head-contest-${key}`);
    await expect(row).toHaveAttribute(
      'data-gap',
      String(expected[key].mine - expected[key].theirs),
    );
    // Both numbers are on screen, not only in the attribute.
    await expect(row.locator('span').first()).toHaveText(String(expected[key].mine));
    await expect(row.locator('span').last()).toHaveText(String(expected[key].theirs));
  }
});
