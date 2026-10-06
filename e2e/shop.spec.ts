import { test, expect, type Page } from '@playwright/test';
import { grantCurrency, loadSave, readGame } from './helpers';
// The real catalogue and price, so the expected charge cannot drift from the game's.
import { ABILITY_DEFINITIONS } from '../src/data/abilities';
import { abilityPrice } from '../src/game/ShopSystem';
import type { AbilityItem } from '../src/types/game';

/**
 * Abilities cost XP and the currency their effect draws on: Heavy Hitter is
 * shot power, so Power. The day's stock is random, so the spec arranges one
 * known offer and then buys it through the shop screen like a player.
 */

const ABILITY = 'heavy_hitter';

async function stockOffer(page: Page): Promise<AbilityItem> {
  const def = ABILITY_DEFINITIONS[ABILITY];
  const price = abilityPrice(def, 0);
  const offer: AbilityItem = {
    id: `ability-${ABILITY}-spec`,
    category: 'ability',
    name: def.name,
    description: def.description,
    effects: def.effects,
    cost: price.xp,
    currencyCost: price.currency,
    level: 1,
    purchased: false,
    abilityId: def.name,
    rarity: 'common',
  };
  await page.evaluate((item) => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    handle.game.setState({ shopItems: [item] });
  }, offer);
  return offer;
}

test('an ability needs its currency as well as XP, and charges both', async ({ page }) => {
  await loadSave(page, 'save-day7-1', 7);
  const offer = await stockOffer(page);
  expect(offer.currencyCost.power, 'Heavy Hitter is priced in Power').toBeGreaterThan(0);

  await page.getByTestId('action-shop').click();
  const buy = page.getByTestId(`shop-buy-${ABILITY}`);

  // The save has the XP but an empty wallet.
  const before = (await readGame(page)).player!;
  expect(before.experience).toBeGreaterThanOrEqual(offer.cost);
  await expect(buy).toBeDisabled();
  await expect(buy).toContainText('Not Enough Power');

  await grantCurrency(page, { power: 50 });
  await expect(buy).toBeEnabled();
  await buy.click();
  await expect(buy).toContainText('Sold Out');

  const after = (await readGame(page)).player!;
  expect(after.experience).toBe(before.experience - offer.cost);
  expect(after.wallet.power).toBe(50 - (offer.currencyCost.power ?? 0));
  expect(after.abilities.find((a) => a.name === ABILITY)?.level).toBe(1);
});
