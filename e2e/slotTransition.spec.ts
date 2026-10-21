import { test, expect } from '@playwright/test';
import {
  loadSave,
  markStoryEventsCompleted,
  playMatch,
  readGame,
  setMatchSpeed,
  triggerStoryEvent,
} from './helpers';
import { buildStoryMatchMetadata, TEAM_MATCH_1 } from '../src/data/teamMatches';
import { TimeSlot } from '../src/types/game';

/**
 * The beat between time slots: training, and a story choice that takes time, move the
 * clock while their result opens, so the beat waits for the result to be dismissed and
 * then plays over the next slot.
 *
 * Specs run without it (SlotTransition skips under webdriver), so this one opts in
 * with `?transitions`.
 */
test('training waits for its result, then the slot beat plays', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  await page.goto('/?transitions');
  await expect(page.getByTestId('action-training')).toBeVisible();
  const before = await readGame(page);
  expect(before.calendar.currentTimeSlot).toBe(TimeSlot.MORNING);

  await page.getByTestId('action-training').click();
  await page.locator('[data-testid="training-offer"] [data-drill]').first().click();
  await page.getByTestId('training-quick-sim').click();

  // The clock has moved, but the result is still the morning's.
  await expect(page.getByTestId('training-result-dismiss')).toBeVisible();
  expect((await readGame(page)).calendar.currentTimeSlot).toBe(TimeSlot.AFTERNOON);
  const beat = page.getByTestId('slot-transition');
  await expect(beat).toHaveCount(0);

  await page.getByTestId('training-result-dismiss').click();
  await expect(beat).toBeVisible();
  await expect(beat).toHaveAttribute('data-from', String(TimeSlot.MORNING));
  await expect(beat).toHaveAttribute('data-to', String(TimeSlot.AFTERNOON));
  await expect(beat).toHaveAttribute('aria-label', 'Afternoon');

  // A second, then the afternoon is back.
  await expect(beat).toBeHidden({ timeout: 3_000 });
});

// One event with a single option (a plain Continue), one with a real choice to confirm.
for (const [eventId, name] of [
  ['rival_first_encounter', 'Meeting Your Rival'],
  ['coach_training_focus', 'Choose Your Focus'],
] as const) {
  test(`${name}: the slot beat waits for the story result`, async ({ page }) => {
    await loadSave(page, 'save-day7-1');
    await page.goto('/?transitions');
    await expect(page.getByTestId('action-training')).toBeVisible();
    expect((await readGame(page)).calendar.currentTimeSlot).toBe(TimeSlot.MORNING);

    // The event takes a slot: the clock moves as the choice is confirmed.
    await triggerStoryEvent(page, eventId);

    // Through the dialogue, then take its first open choice (a lone one is a plain Continue).
    const advance = page.getByTestId('story-advance');
    const resolve = page.getByTestId('story-resolve');
    const option = page
      .getByTestId(/^story-option-/)
      .and(page.locator('[data-available="true"]'))
      .first();
    await expect(advance.or(resolve).or(option)).toBeVisible();
    while (await advance.isVisible()) await advance.click();
    if (await resolve.isVisible()) {
      await resolve.click();
    } else {
      await option.click();
      await page.getByTestId('story-confirm').click();
    }

    // The result is still the morning's, with the clock already on the afternoon, and
    // the beat stays away the whole time it is up.
    const dismiss = page.getByTestId('story-result-dismiss');
    await expect(dismiss).toBeVisible();
    expect((await readGame(page)).calendar.currentTimeSlot).toBe(TimeSlot.AFTERNOON);
    const beat = page.getByTestId('slot-transition');
    for (let i = 0; i < 6; i++) {
      await expect(beat).toHaveCount(0);
      await page.waitForTimeout(250);
    }

    // Any notices the result brings (Choose Your Focus unlocks a hangout) still belong
    // to the morning, so the beat waits through those as well.
    await dismiss.click();
    const notice = page
      .getByTestId('hangout-unlocked-dismiss')
      .or(page.getByTestId('item-acquired-dismiss'));
    await expect(beat.or(notice)).toBeVisible();
    while (await notice.isVisible()) {
      await expect(beat).toHaveCount(0);
      await notice.click();
    }
    await expect(beat).toBeVisible();
    await expect(beat).toHaveAttribute('data-from', String(TimeSlot.MORNING));
    await expect(beat).toHaveAttribute('data-to', String(TimeSlot.AFTERNOON));
  });
}

test('after a team match the slot beat waits for the post-match event', async ({ page }) => {
  test.setTimeout(120_000);
  await loadSave(page, 'save-day7-1');
  await page.goto('/?transitions');
  await expect(page.getByTestId('action-training')).toBeVisible();
  await setMatchSpeed(page, 'instant');

  // Scenario setup: team match 1 this afternoon, straight to the court (no prematch
  // event), against an opponent no Day 7 player can beat, so its loss event follows.
  // The post-match events need the prematch one played, so it counts as done.
  const { prematchEventId, ...metadata } = buildStoryMatchMetadata(TEAM_MATCH_1);
  if (prematchEventId) await markStoryEventsCompleted(page, [prematchEventId]);
  await page.evaluate(
    ({ metadata, slot }) => {
      const game = window.__test__!.game;
      const max = (o: unknown): unknown =>
        typeof o === 'number'
          ? 100
          : typeof o === 'object' && o !== null
            ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, max(v)]))
            : o;
      const { calendar, currentStatus } = game.getState();
      game.setState({ currentStatus: { ...currentStatus, energy: 60 } });
      game.getState().scheduleEvent({
        eventType: 'story_match',
        scheduledDay: calendar.currentDay,
        scheduledTimeSlot: slot,
        metadata: { ...metadata, opponentStats: max(metadata.opponentStats) },
      });
    },
    { metadata, slot: TimeSlot.AFTERNOON },
  );

  // Rest into the afternoon: its own beat plays over the pre-match screen.
  await page.getByTestId('action-rest').click();
  const beat = page.getByTestId('slot-transition');
  await expect(page.getByTestId('start-match-header')).toBeVisible();
  await expect(beat).toHaveCount(0, { timeout: 3_000 });

  await page.getByTestId('start-match-header').click();
  await playMatch(page);
  await expect(page.getByTestId('match-results')).toBeVisible();
  expect((await readGame(page)).calendar.currentTimeSlot).toBe(TimeSlot.EVENING);
  await page.getByTestId('match-results-continue').click();

  // Everything after the match is the afternoon's: the post-match event, its result
  // and any notices. The beat waits for the menu.
  const advance = page.getByTestId('story-advance');
  const resolve = page.getByTestId('story-resolve');
  const option = page
    .getByTestId(/^story-option-/)
    .and(page.locator('[data-available="true"]'))
    .first();
  const steps = [
    advance,
    resolve,
    page.getByTestId('story-result-dismiss'),
    page.getByTestId('item-acquired-dismiss'),
    page.getByTestId('hangout-unlocked-dismiss'),
  ];
  await expect(page.getByTestId('story-event')).toBeVisible();
  const afternoonScreens = page
    .getByTestId('story-event')
    .or(page.getByTestId('story-result'))
    .or(page.getByTestId('item-acquired'))
    .or(page.getByTestId('hangout-unlocked'));
  for (let i = 0; i < 60 && !(await beat.isVisible()); i++) {
    const step = await (async () => {
      for (const candidate of [...steps, option]) {
        if (await candidate.isVisible().catch(() => false)) return candidate;
      }
      return null;
    })();
    if (!step) {
      await page.waitForTimeout(100);
      continue;
    }
    await step.click();
    if (step === option) await page.getByTestId('story-confirm').click();
  }

  // Back on the menu, the beat plays from the afternoon the match was in, with nothing
  // of the afternoon's left behind it.
  await expect(beat).toBeVisible();
  await expect(beat).toHaveAttribute('data-from', String(TimeSlot.AFTERNOON));
  await expect(afternoonScreens).toHaveCount(0);
});
