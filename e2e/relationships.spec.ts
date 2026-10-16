import { test, expect } from '@playwright/test';
import { drainToIdle } from './bot';
import { loadSave, readGame, setRelationships } from './helpers';
import { HANGOUT_CHARACTERS, getHangoutTier } from '../src/data/hangoutCharacters';

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

test('a relationship that jumps past a milestone still plays every scene, in order', async ({
  page,
}) => {
  // Jen's first scene is ready in the save. Past her second milestone with neither
  // scene played, she used to offer only the second, and the first was lost.
  await loadSave(page, SAVE, 7);
  await setRelationships(page, { jen: 60 });
  const scenes = HANGOUT_CHARACTERS.jen.scenes.map((s) => s.eventId);

  for (const expected of scenes.slice(0, 3)) {
    await page.getByTestId('action-relationships').click();
    await page.getByTestId('relationship-hangout-jen').click();
    await expect(page.getByTestId('story-event')).toBeVisible();
    const phase = (await readGame(page)).gamePhase;
    const eventId =
      phase.type === 'story_event'
        ? phase.event.id
        : phase.type === 'idle' && phase.overlay?.type === 'story_event'
          ? phase.overlay.event.id
          : null;
    expect(eventId).toBe(expected);
    await drainToIdle(page);
  }
  // The fourth scene needs a relationship of 75, and the scenes have moved it on
  // from 60 only by what they pay, so whether it is offered is the game's call.
  const { relationships, hangoutThresholdsSeen } = await readGame(page);
  expect(hangoutThresholdsSeen.jen).toEqual([0, 1, 2]);
  await page.getByTestId('action-relationships').click();
  await expect(page.getByTestId('relationship-hangout-jen')).toHaveCount(
    (relationships.jen ?? 0) >= HANGOUT_CHARACTERS.jen.scenes[3].minRelationship ? 1 : 0,
  );
});
