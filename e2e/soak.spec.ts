import { test, expect } from '@playwright/test';
import { startNewGame, dismissWalkthrough, setMatchSpeed } from './helpers';
import { runBot, formatLog, expectProductiveRun } from './bot';

/**
 * Plays the game for a stretch of in-game days and reports what happened.
 *
 * This is the soak run, and it is a different kind of test from the rest of the
 * suite. The others pin one behaviour; this one asks whether the game holds
 * together when somebody actually plays it — whether the loop can be run for
 * weeks without parking in a screen with no exit, whether a phase exists that
 * nothing knows how to dismiss, whether a console error goes unnoticed because
 * nothing was asserting on it.
 *
 * It fails on hard problems only: a softlock, an unhandled phase, a page error.
 * The balance numbers print for reading rather than being asserted, because a
 * threshold here would fail every time the game is deliberately rebalanced,
 * which is the opposite of useful.
 */

/** Days to play. Long enough to clear the day-5 match and day-7 shop gates. */
const DAYS = 14;

test('a fresh player can play two weeks without the game getting stuck', async ({ page }) => {
  test.setTimeout(120_000);

  // A console error during a 14-day run is a real defect that would otherwise go
  // unseen — nothing else in the suite is watching for one over this much play.
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  await startNewGame(page);
  await dismissWalkthrough(page);
  await setMatchSpeed(page, 'instant');

  const log = await runBot(page, { untilDay: DAYS, tactics: 'first' });

  console.log(formatLog(log));

  expectProductiveRun(log, DAYS);
  // The run has to actually reach the interesting part of the game, not just
  // survive by resting 14 days in a row.
  expect(log.matchesPlayed).toBeGreaterThan(0);
  expect(errors, `console/page errors during the run:\n${errors.join('\n')}`).toEqual([]);
});

test('a training-only run still progresses the build', async ({ page }) => {
  test.setTimeout(120_000);

  await startNewGame(page);
  await dismissWalkthrough(page);
  // Needed even with matches off: the calendar schedules a story match in week
  // one, and the bot has to play it whether or not it went looking for one.
  await setMatchSpeed(page, 'instant');

  // Matches off, so this isolates the training economy: does a week of nothing
  // but training actually move the player's rating, and does energy sustain it?
  const log = await runBot(page, { untilDay: 5, playMatches: false });

  console.log(formatLog(log));

  expectProductiveRun(log, 5);
  const first = log.daily[0];
  const last = log.daily[log.daily.length - 1];
  expect(last.overall).toBeGreaterThan(first.overall);
});
