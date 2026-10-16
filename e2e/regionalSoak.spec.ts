import { test, expect, type Page } from '@playwright/test';
import { loadSave, readGame, setMatchSpeed } from './helpers';
import { runBot, formatLog, expectProductiveRun } from './bot';
import { StoryEventRepository } from '../src/data/storyEvents/index';

/**
 * Plays the first stretch of Regional for each career identity, through the UI.
 *
 * Everything written so far is the Club season's and stops at promotion, and
 * Regional's own content isn't written yet, so a promoted player's free days are
 * practice, training and the shop. That's exactly where a Regional-only bug would
 * hide: a Club event leaking past its tier gate, a hangout spent on an event that
 * can no longer fire, a rare in a shop that should only open uncommons, a tier-2
 * practice opponent or silver training session the menu can't get through, or a
 * practice screen that still opens on Club opponents (it did, and that's fixed). The
 * Node checks pin each rule; this checks they hold together over two weeks of
 * play, on each identity's own build (the season-start saves, src/debug/saves).
 *
 * It fails on softlocks, unhandled phases and page errors, and on those rules.
 * The numbers print for reading, without thresholds.
 */

const IDENTITIES = ['bigServer', 'counter', 'netRusher', 'baseliner'] as const;
/** Regional days to play from the save's first morning. */
const DAYS = 10;

/** Ability offers on the shop screen, by rarity, opened and closed through the menu. */
async function shopRarities(page: Page): Promise<string[]> {
  await page.getByTestId('action-shop').click();
  const offers = page.locator('[data-testid^="shop-ability-"]');
  await expect(offers.first(), 'the shop should offer abilities').toBeVisible();
  const rarities = await offers.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-rarity') ?? ''),
  );
  await page.getByTestId('screen-back').click();
  return rarities;
}

for (const identity of IDENTITIES) {
  test(`the ${identity} plays Regional's first days without a Club leftover`, async ({ page }) => {
    // Ten in-game days of bot play, with matches, is well past the 60s default.
    test.setTimeout(240_000);
    // Rules, not layout: the phone layout of these screens is textFit's and
    // screenLayout's job, and a second run of each career only doubles the time.
    test.skip(test.info().project.name === 'mobile', 'desktop only: checks rules, not layout');

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await loadSave(page, `save-regional-day1-${identity}`, 41);
    await setMatchSpeed(page, 'instant');

    const before = await readGame(page);
    expect(before.player?.tier, 'the save should be a Regional player').toBe(2);
    const start = before.calendar.currentDay;

    // Keith's next hangout is a Club event, so Regional must not offer it: a ready
    // button here would spend the tier on an event that can no longer fire.
    await page.getByTestId('action-relationships').click();
    await expect(page.getByTestId('relationship-keith')).toBeVisible();
    await expect(page.getByTestId('relationship-hangout-keith')).toHaveCount(0);
    await page.getByTestId('screen-back').click();

    // Rares open with the Tour. Checked on screen and in the stock behind it.
    expect(await shopRarities(page)).not.toContain('rare');

    // Practice opens on the player's own tier: a promoted player who clicks
    // straight through should meet Regional opponents, not Club ones.
    await page.getByTestId('action-match').click();
    await expect(page.getByTestId('practice-tier-2')).toHaveAttribute('data-selected', 'true');
    await page.getByTestId('screen-back').click();

    const log = await runBot(page, { untilDay: start + DAYS });
    console.log(`${identity}:${formatLog(log)}`);
    expectProductiveRun(log, start + DAYS);
    expect(log.matchesPlayed, 'Regional practice matches should be playable').toBeGreaterThan(0);

    const after = await readGame(page);
    const matches = after.activityHistory
      .slice(before.activityHistory.length)
      .filter((a) => a.type === 'match');
    expect(
      matches.map((m) => ('opponentTier' in m ? m.opponentTier : undefined)),
      'the bot clicks straight through, so it should practise at Regional',
    ).not.toContain(1);
    const fired = after.completedStoryEvents.filter(
      (id) => !before.completedStoryEvents.includes(id),
    );
    const clubLeftovers = fired.filter(
      (id) => StoryEventRepository.getEventById(id)?.prerequisites.tier?.max === 1,
    );
    expect(clubLeftovers, 'no Club event should fire at Regional').toEqual([]);
    expect(after.hangoutThresholdsSeen, 'no hangout tier should be spent').toEqual(
      before.hangoutThresholdsSeen,
    );
    const stock = after.shopItems.filter((i) => i.category === 'ability');
    expect(stock.map((i) => i.rarity)).not.toContain('rare');
    expect(await shopRarities(page)).not.toContain('rare');

    expect(errors, `console/page errors during the run:\n${errors.join('\n')}`).toEqual([]);
  });
}
