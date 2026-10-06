import { test, expect } from '@playwright/test';
import { grantCurrency, loadSave, readGame, triggerStoryEvent } from './helpers';
import { drainToIdle } from './bot';
import { StoryEventRepository } from '../src/data/storyEvents';

/**
 * Story outcomes pay currency, and a penalty is a currency loss that clamps at
 * zero rather than a stat going down.
 *
 * `coding_class` is linear (no options to choose between) and nets a
 * Technique gain against Power, Quickness and Mind losses, so one run covers a
 * gain, a loss smaller than the balance, and losses bigger than it.
 */

const EVENT = 'coding_class';

test('a story outcome pays its currency and clamps its losses at zero', async ({ page }) => {
  const event = StoryEventRepository.getAllEvents().find((e) => e.id === EVENT);
  const currency = event?.defaultOutcome?.effects.currency;
  expect(currency, `${EVENT} should carry a currency outcome`).toBeDefined();
  expect(currency!.quickness, 'the spec needs a loss to clamp').toBeLessThan(-1);

  await loadSave(page, 'save-day7-1', 7);
  // Mind covers its loss; Quickness has 1 against a bigger loss; Power has none.
  await grantCurrency(page, { quickness: 1, mind: 10 });
  const before = (await readGame(page)).player!;

  await triggerStoryEvent(page, EVENT);
  // The result shows the losses as losses (red), the gain as a gain.
  const result = page.getByTestId('story-result-currency');
  while (!(await result.isVisible().catch(() => false))) {
    const next = page.getByTestId('story-advance').or(page.getByTestId('story-resolve'));
    await next.first().click();
  }
  await expect(result.locator('[data-currency="quickness"]')).toHaveAttribute('data-loss', 'true');
  await expect(result.locator('[data-currency="technique"]')).not.toHaveAttribute('data-loss');
  await drainToIdle(page);

  const after = (await readGame(page)).player!;
  expect(after.wallet.technique).toBe(before.wallet.technique + (currency!.technique ?? 0));
  expect(after.wallet.mind).toBe(before.wallet.mind + (currency!.mind ?? 0));
  expect(after.wallet.quickness, 'a loss bigger than the balance ends at 0').toBe(0);
  expect(after.wallet.power, 'a loss from an empty balance stays at 0').toBe(0);
  expect(after.stats, 'story outcomes no longer change stats').toEqual(before.stats);
});

test('a rare story moment raises stats directly and shows them', async ({ page }) => {
  // coach_secret_past is gated behind a close coach relationship, one of the few
  // outcomes that still grant stats rather than currency.
  const event = StoryEventRepository.getAllEvents().find((e) => e.id === 'coach_secret_past');
  const changes = event?.defaultOutcome?.effects.statChanges;
  expect(changes, 'coach_secret_past should grant stats').toBeDefined();

  await loadSave(page, 'save-day7-1', 7);
  const before = (await readGame(page)).player!;
  await triggerStoryEvent(page, 'coach_secret_past');
  const result = page.getByTestId('story-result-stats');
  while (!(await result.isVisible().catch(() => false))) {
    await page.getByTestId('story-advance').or(page.getByTestId('story-resolve')).first().click();
  }
  await expect(result.locator('[data-stat="focus"]')).toHaveAttribute(
    'data-amount',
    String(changes!.focus),
  );
  await drainToIdle(page);

  const after = (await readGame(page)).player!;
  expect(after.stats.mental.focus).toBe(before.stats.mental.focus + (changes!.focus ?? 0));
  expect(after.wallet, 'a stat outcome pays no currency').toEqual(before.wallet);
});
