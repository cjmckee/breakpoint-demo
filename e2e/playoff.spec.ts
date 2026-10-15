import { test, expect } from '@playwright/test';
import { loadSave, playMatch, readGame, setMatchSpeed } from './helpers';
import { TEAM_MATCH_1 } from '../src/data/teamMatches';
import { PlayoffManager } from '../src/game/PlayoffManager';
import type { PlayoffConfig, StoryMatchMetadata } from '../src/types/game';
import { TimeSlot } from '../src/types/game';

/**
 * A lost promotion playoff comes round again.
 *
 * The retry is the engine's job, not the content's: losing a playoff match has
 * to schedule the same match `retryDays` on, with the next attempt's loss event,
 * or a player who loses it is stuck in the season for good. That only happens
 * after the results screen is dismissed, which no unit check reaches, so this
 * loses one through the UI.
 */

const { lossEventId: _single, ...match } = TEAM_MATCH_1;
const PLAYOFF: PlayoffConfig = {
  ...match,
  id: 'e2e_playoff',
  // Not written yet, so nothing shows; the spec watches the schedule instead.
  prematchEventId: 'e2e_playoff_prematch',
  winEventId: 'e2e_playoff_win',
  lossEventIds: ['e2e_playoff_loss_1', 'e2e_playoff_loss_2', 'e2e_playoff_loss_again'],
  retryDays: 6,
};

test('losing a playoff schedules the same match again, with the next loss event', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await loadSave(page, 'save-day7-1', 7);
  await setMatchSpeed(page, 'instant');

  // Arrange: the playoff registered, attempt 1 due this afternoon, and a player
  // with nothing left in their game, so the match is lost.
  await page.evaluate(
    ({ playoff, metadata, slot }) => {
      const t = window.__test__!;
      t.playoffs[playoff.id] = playoff;
      const game = t.game;
      const { player, calendar, currentStatus } = game.getState();
      const one = <T extends object>(group: T): T =>
        Object.fromEntries(Object.keys(group).map((k) => [k, 1])) as T;
      game.setState({
        player: {
          ...player!,
          stats: {
            core: one(player!.stats.core),
            technical: one(player!.stats.technical),
            physical: one(player!.stats.physical),
            mental: one(player!.stats.mental),
          },
        },
        currentStatus: { ...currentStatus, energy: 60 },
      });
      game.getState().scheduleEvent({
        eventType: 'story_match',
        scheduledDay: calendar.currentDay,
        scheduledTimeSlot: slot,
        metadata,
      });
    },
    {
      playoff: PLAYOFF,
      metadata: PlayoffManager.metadataFor(PLAYOFF, 1),
      slot: TimeSlot.AFTERNOON,
    },
  );

  // Act: rest into the afternoon, play the playoff and lose it.
  await page.getByTestId('action-rest').click();
  await page.getByTestId('start-match-footer').click();
  await playMatch(page);
  const lostOn = (await readGame(page)).calendar.currentDay;
  await page.getByTestId('match-results-continue').click();

  // Assert: attempt 2 is on the calendar, retryDays on, with the second loss event.
  await expect
    .poll(async () => {
      const { scheduledEvents } = (await readGame(page)).calendar;
      return scheduledEvents
        .filter((e) => e.eventType === 'story_match')
        .map((e) => {
          const m = e.metadata as unknown as StoryMatchMetadata;
          return { day: e.scheduledDay, attempt: m.playoff?.attempt, loss: m.lossEventId };
        });
    })
    .toContainEqual({ day: lostOn + 6, attempt: 2, loss: 'e2e_playoff_loss_2' });
});
