import { test, expect, type Page } from '@playwright/test';
import { loadSave } from './helpers';
import { TimeSlot } from '../src/types/game';

/**
 * The schedule grid keeps its columns whatever is on it. It used to size them from its
 * contents, so a long opponent name scheduled into one slot widened that column and
 * squeezed the rest.
 */

/** Opens the schedule and reads the width of each header cell. */
async function columnWidths(page: Page): Promise<number[]> {
  await page.getByTestId('status-calendar').click();
  const grid = page.getByTestId('calendar-grid');
  await expect(grid).toBeVisible();
  const widths = await grid
    .locator('thead th')
    .evaluateAll((cells) => cells.map((c) => c.getBoundingClientRect().width));
  await page.getByLabel('Close modal').click();
  await expect(grid).toBeHidden();
  return widths;
}

test('scheduling a match does not resize the schedule', async ({ page }) => {
  await loadSave(page, 'save-day7-1');
  const before = await columnWidths(page);

  // Scenario setup: a team match tomorrow afternoon against an opponent with a long name.
  await page.evaluate((afternoon) => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    const { calendar, player } = handle.game.getState();
    if (!player) throw new Error('no player');
    handle.game.setState({
      calendar: {
        ...calendar,
        scheduledEvents: [
          ...calendar.scheduledEvents,
          {
            eventType: 'story_match',
            scheduledDay: calendar.currentDay + 1,
            scheduledTimeSlot: afternoon,
            metadata: {
              opponentId: 'e2e-long-name',
              opponentName: 'Maximiliana Featherstonehaugh',
              opponentStats: player.stats,
              opponentTier: 1,
              winEventId: 'e2e-win',
              lossEventId: 'e2e-loss',
            },
          },
        ],
      },
    });
  }, TimeSlot.AFTERNOON);

  const after = await columnWidths(page);
  expect(after.length).toBe(before.length);
  after.forEach((width, i) => expect(width).toBeCloseTo(before[i], 0));
});
