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

async function stockOffer(page: Page, owned = 0): Promise<AbilityItem> {
  const def = ABILITY_DEFINITIONS[ABILITY];
  const price = abilityPrice(def, owned);
  const offer: AbilityItem = {
    id: `ability-${ABILITY}-spec`,
    category: 'ability',
    name: def.name,
    description: def.description,
    effects: def.effects,
    cost: price.xp,
    currencyCost: price.currency,
    level: owned + 1,
    purchased: false,
    abilityId: def.name,
    rarity: 'common',
  };
  await page.evaluate(
    ({ item, owned, def }) => {
      const handle = window.__test__;
      if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
      const player = handle.game.getState().player!;
      const abilities = owned > 0 ? [{ ...def, level: owned }] : player.abilities;
      handle.game.setState({ shopItems: [item], player: { ...player, abilities } });
    },
    { item: offer, owned, def },
  );
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
  await expect(buy).toContainText(`Need ${offer.currencyCost.power} Power`);
  // The short currency is flagged in the price itself, not only on the button.
  await expect(
    page.getByTestId(`shop-ability-${ABILITY}`).locator('[data-currency="power"]'),
  ).toHaveAttribute('data-short', 'true');

  await grantCurrency(page, { power: 50 });
  await expect(buy).toBeEnabled();
  await buy.click();
  await expect(buy).toContainText('Sold Out');

  const after = (await readGame(page)).player!;
  expect(after.experience).toBe(before.experience - offer.cost);
  expect(after.wallet.power).toBe(50 - (offer.currencyCost.power ?? 0));
  expect(after.abilities.find((a) => a.name === ABILITY)?.level).toBe(1);
});

test('an upgrade offer says what is owned and how much stronger the next level is', async ({
  page,
}) => {
  await loadSave(page, 'save-day7-1', 7);
  await stockOffer(page, 1);
  await page.getByTestId('action-shop').click();

  const upgrade = page.getByTestId(`shop-upgrade-${ABILITY}`);
  await expect(upgrade).toContainText('you own Lv 1 → buying Lv 2');
  await expect(upgrade).toContainText('×1.0 → ×1.6');

  // Short on both XP and Power: the button names both, with amounts.
  const buy = page.getByTestId(`shop-buy-${ABILITY}`);
  await expect(buy).toContainText('XP');
  await expect(buy).toContainText('Power');
});
