import { test, expect } from '@playwright/test';
import { loadSave, setMatchSpeed, triggerStoryEvent, allStoryEventIds, readGame } from './helpers';
import { drainToIdle } from './bot';

/**
 * Runs every story event in the game and checks it can be got out of.
 *
 * There are 133 authored events and, before this, nothing exercised all but a
 * handful of them. storyMinigameCheck.ts pins the authored data and one spec
 * drives a single event, but an event is a small state machine — dialogue, then
 * options filtered by prerequisites, then effects that can grant an item,
 * unlock a hangout, start a minigame or schedule a match, then a result screen
 * that has to hand control back. A typo in any of that typechecks fine and only
 * shows up as a player stuck on a modal with no button.
 *
 * So the assertion is deliberately coarse: force the event, click through
 * whatever it puts up, and require the game to end up back on a usable menu.
 * That is the property that actually matters, and it is the one that catches a
 * dead end.
 *
 * Events are forced through the store's debug action because almost all of them
 * gate on a day and a relationship level no test should have to play its way to.
 * The options within an event are still prerequisite-filtered, so what the
 * sweep sees is what a qualifying player would.
 *
 * Sharded into batches so the suite parallelises: one save load per batch rather
 * than per event, and a failure names the event it died on.
 */

/** Events per test. Trades parallelism against repeated save loads. */
const BATCH_SIZE = 12;

const ALL_IDS = allStoryEventIds();

/** Splits the event list into contiguous batches. */
function batches(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

test.describe('every story event resolves and hands control back', () => {
  for (const [index, batch] of batches(ALL_IDS, BATCH_SIZE).entries()) {
    test(`batch ${index + 1}: ${batch[0]} … ${batch[batch.length - 1]}`, async ({ page }) => {
      test.setTimeout(90_000);

      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

      await loadSave(page, 'save-day7-1', 99);
      // An event can start a match; without this each one costs the better part
      // of a minute.
      await setMatchSpeed(page, 'instant');

      for (const id of batch) {
        await triggerStoryEvent(page, id);

        // A forced event should put the game somewhere other than a plain menu.
        // If it does not, the trigger silently did nothing, and every assertion
        // after this would be vacuous.
        const after = await readGame(page);
        const started = after.gamePhase.type !== 'idle' || after.gamePhase.overlay !== null;
        expect(started, `triggering "${id}" did not open anything`).toBe(true);

        // The real check: can a player get out of it?
        try {
          await drainToIdle(page);
        } catch (err) {
          throw new Error(`event "${id}" could not be resolved — ${(err as Error).message}`);
        }
      }

      expect(errors, `page errors during batch ${index + 1}:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

test('the sweep covers the whole authored event list', () => {
  // Guards the sweep itself: if the repository were empty or the helper returned
  // nothing, every batch above would pass by doing nothing at all.
  expect(ALL_IDS.length).toBeGreaterThan(100);
  expect(new Set(ALL_IDS).size).toBe(ALL_IDS.length);
});
