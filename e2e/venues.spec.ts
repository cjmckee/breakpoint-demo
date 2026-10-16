import { test, expect } from '@playwright/test';
import { loadSave, readGame } from './helpers';
import { buildStoryMatchMetadata, TEAM_MATCH_1 } from '../src/data/teamMatches';
import { TimeSlot } from '../src/types/game';

/**
 * A team match shows where it is played before it starts.
 *
 * Venues travel a long way to reach the screen: the team match config names
 * one, the scheduled match carries its id in persisted metadata, the store
 * copies it onto the pre-match config, and StoryMatch looks it up again to hand
 * PreMatchScreen the venue and the live match its conditions. Drop the id at any
 * step and the match still plays, on the right surface, with no venue at all —
 * which no other spec would notice, since the Club tier's venues have no
 * conditions to change a result.
 */
test("a team match's pre-match screen names its venue", async ({ page }) => {
  await loadSave(page, 'save-day7-1');

  // Arrange: team match 1, due next slot, without its prematch story event, so
  // the time passing goes straight to the pre-match screen. And enough energy
  // missing that resting is allowed.
  const { prematchEventId: _skipped, ...metadata } = buildStoryMatchMetadata(TEAM_MATCH_1);
  await page.evaluate(
    ({ metadata, slot }) => {
      const game = window.__test__!.game;
      const { calendar } = game.getState();
      game.setState({ currentStatus: { ...game.getState().currentStatus, energy: 60 } });
      game.getState().scheduleEvent({
        eventType: 'story_match',
        scheduledDay: calendar.currentDay,
        scheduledTimeSlot: slot,
        metadata,
      });
    },
    { metadata, slot: TimeSlot.AFTERNOON },
  );

  // Act: rest through the morning.
  await page.getByTestId('action-rest').click();

  await expect
    .poll(async () => (await readGame(page)).gamePhase.type, {
      message: 'resting into the scheduled slot should open the pre-match screen',
    })
    .toBe('match_setup');
  const phase = (await readGame(page)).gamePhase;
  expect(phase.type === 'match_setup' && phase.matchConfig?.venueId).toBe(TEAM_MATCH_1.venue.id);

  const venue = page.getByTestId('prematch-venue');
  await expect(venue).toHaveAttribute('data-venue-id', TEAM_MATCH_1.venue.id);
  await expect(venue).toContainText(TEAM_MATCH_1.venue.name);
});
