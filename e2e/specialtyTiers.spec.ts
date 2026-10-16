import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame } from './helpers';

/**
 * Each season opens one more specialty tier: I at Club, II at Regional, III on
 * the Tour. The store refuses an upgrade past the cap, and the Specialties tab
 * has to agree with it, showing a locked caption that names the season that
 * opens the next tier rather than an Upgrade button that silently does nothing.
 */

async function specialistAt(page: Page, tier: 1 | 2 | 3, specialtyTier: 1 | 2): Promise<void> {
  await page.evaluate(
    ({ tier, specialtyTier }) => {
      const game = window.__test__!.game;
      const player = game.getState().player!;
      game.setState({
        player: {
          ...player,
          tier,
          archetypeProfile: {
            ...player.archetypeProfile,
            broad: 'baseliner',
            specializationPoints: 3,
            phases: { forehand: { path: 'fh_survivor', tier: specialtyTier } },
          },
        },
      });
      game.getState().navigateTo('archetype');
    },
    { tier, specialtyTier },
  );
  await page.getByTestId('archetype-phase-forehand').click();
}

const forehandTier = async (page: Page): Promise<number | undefined> =>
  (await readGame(page)).player?.archetypeProfile.phases.forehand?.tier;

test('a Club player cannot take a specialty past tier I', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await specialistAt(page, 1, 1);

  await expect(page.getByTestId('archetype-upgrade')).toHaveCount(0);
  await expect(page.getByTestId('archetype-tier-locked')).toContainText('Regional');

  await page.evaluate(() => window.__test__!.game.getState().upgradePhase('forehand'));
  expect(await forehandTier(page), 'the store holds the cap too').toBe(1);
});

test('Regional opens tier II and no further', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await specialistAt(page, 2, 1);

  await page.getByTestId('archetype-upgrade').click();
  expect(await forehandTier(page)).toBe(2);

  await expect(page.getByTestId('archetype-upgrade')).toHaveCount(0);
  await expect(page.getByTestId('archetype-tier-locked')).toContainText('Tour');
});

test('the Tour opens tier III', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await specialistAt(page, 3, 2);

  await page.getByTestId('archetype-upgrade').click();
  expect(await forehandTier(page)).toBe(3);
});
