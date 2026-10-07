import { test, expect } from '@playwright/test';
import { loadSave, readGame } from './helpers';
import { getHangoutTier } from '../src/data/hangoutCharacters';

/**
 * The Relationships screen is also the hangout menu. The day-7 save has Jen's
 * first hangout ready and Jordan below zero, so it covers a ready card, a
 * strained one, and the path from the button into the tier event — the part a
 * redesign of the cards could quietly disconnect.
 */

const SAVE = 'save-day7-1';

test('each key character shows the tier the game has them at', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  const { relationships } = await readGame(page);
  await page.getByTestId('action-relationships').click();

  for (const id of ['jen', 'keith', 'jordan_rival']) {
    const card = page.getByTestId(`relationship-${id}`);
    await expect(card).toHaveAttribute('data-value', String(relationships[id]));
    await expect(card).toHaveAttribute(
      'data-tier',
      String(getHangoutTier(id, relationships[id] ?? 0)),
    );
  }
  await expect(page.getByTestId('relationship-jordan_rival')).toContainText('Strained');
});

test('Hang Out on a ready card starts that tier event', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  await page.getByTestId('action-relationships').click();

  const hangout = page.getByTestId('relationship-hangout-jen');
  await expect(hangout).toBeEnabled();
  // Only a card with a new tier event offers the button.
  await expect(page.getByTestId('relationship-hangout-jordan_rival')).toHaveCount(0);

  await hangout.click();
  await expect(page.getByTestId('story-event')).toBeVisible();
  const phase = (await readGame(page)).gamePhase;
  const eventId =
    phase.type === 'story_event'
      ? phase.event.id
      : phase.type === 'idle' && phase.overlay?.type === 'story_event'
        ? phase.overlay.event.id
        : null;
  expect(eventId).toBe('jen_hangout_tier0');
});
