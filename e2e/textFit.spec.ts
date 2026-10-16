import { test, expect, type Page } from '@playwright/test';
import { grantCurrency, loadSave, markStoryEventsCompleted, setMatchSpeed } from './helpers';
import { CONTENT_END_EVENT } from '../src/data/seasons';

/**
 * Text fits its box on every main screen.
 *
 * The pixel font is far wider than a system font, so labels that fit while it was missing
 * ran into bars, under buttons and off cards once it loaded. The font is bundled now, so
 * the specs see the widths players do; this walks the screens on each project and lists
 * any text cut off, ellipsis included.
 */

const SAVE = 'save-day7-1';

/** Innermost elements whose text is wider than their box. Emoji-only glyphs are ignored. */
async function clippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const overflows = (el: Element): boolean =>
      el instanceof HTMLElement &&
      el.getBoundingClientRect().width > 0 &&
      el.scrollWidth > el.clientWidth + 1 &&
      !['auto', 'scroll'].includes(getComputedStyle(el).overflowX);
    return Array.from(document.querySelectorAll('body *'))
      .filter((el) => overflows(el) && !Array.from(el.children).some(overflows))
      .map((el) => (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim())
      .filter((text) => /[A-Za-z0-9]/.test(text));
  });
}

test('no text is cut off on the main screens', async ({ page }) => {
  await loadSave(page, SAVE, 7);
  // Double-digit wallets, so Development's before → after readout is at its widest.
  await grantCurrency(page, { power: 16, quickness: 18, technique: 16, mind: 19 });
  const found: string[] = [];
  const check = async (screen: string): Promise<void> => {
    for (const text of await clippedText(page)) found.push(`${screen}: ${text.slice(0, 40)}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (wide) found.push(`${screen}: the page scrolls sideways`);
  };

  await check('menu');
  for (const screen of ['inventory', 'relationships', 'development', 'training', 'shop']) {
    await page.getByTestId(`action-${screen}`).click();
    await expect(page.getByTestId('screen-title')).toBeVisible();
    await check(screen);
    if (screen === 'development') {
      // A plan shows each wallet as before → after, its widest state.
      // Plan the way a player would: the first affordable +1, over and over.
      const plus = page.locator('[data-testid^="development-plus-"]:enabled');
      for (let i = 0; i < 12 && (await plus.count()) > 0; i++) await plus.first().click();
      await check('development with a plan');
    }
    await page.getByTestId('screen-back').click();
  }

  await setMatchSpeed(page, 'instant');
  await page.getByTestId('action-match').click();
  await check('match setup');
  await page.getByTestId('preview-match').click();
  await expect(page.getByTestId('head-to-head')).toBeVisible();
  await check('pre-match');
  await page.getByTestId('start-match-footer').click();
  await expect(page.getByTestId('km-choice')).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(0, 0);
  await check('key moment');

  expect(found).toEqual([]);
});

test('no text is cut off on the end screen', async ({ page }) => {
  // A promoted player who has seen the epilogue, with the confirm step open: its widest state.
  await loadSave(page, 'save-regional-day1-baseliner', 41);
  await markStoryEventsCompleted(page, [CONTENT_END_EVENT]);
  await page.getByTestId('content-end-new-career').click();
  await expect(page.getByTestId('content-end-confirm')).toBeVisible();
  expect(await clippedText(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
