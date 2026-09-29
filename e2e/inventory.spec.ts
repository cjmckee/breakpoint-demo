import { test, expect } from '@playwright/test';
import { loadSave, grantItem, readGame } from './helpers';
// The real aggregator, so the expected total cannot drift from the game's.
import { ItemManager } from '../src/game/ItemManager';

/**
 * Drives the equipment loop through the inventory screen.
 *
 * The inventory is the one screen where the UI and the model can disagree
 * silently. Equipping is a swap — the outgoing item has to come back to the bag,
 * the incoming one has to leave it, the slot has to end up holding exactly one
 * thing, and the player's effective stats have to move. Every one of those is a
 * separate line in ItemManager, and the screen will happily render a plausible
 * card whichever way they went.
 *
 * So these specs click like a player and check the model through the handle.
 * Reading the store is the only way to see the part that matters: the modal
 * shows an item's boosts, not whether they were actually applied.
 */

const SAVE = 'save-day7-1';
/** A clear upgrade on the beginner racquet the save starts equipped with. */
const UPGRADE = 'power_racquet';

test('equipping from the bag swaps the slot and returns the old item', async ({ page }) => {
  await loadSave(page, SAVE, 7);

  // The day-7 save carries an empty bag, so the item has to be arranged. This is
  // setup, not the thing under test — the equipping below is all done by clicking.
  await grantItem(page, UPGRADE);

  const before = await readGame(page);
  const oldRacquet = before.player!.equippedItems.racquet;
  expect(oldRacquet, 'save should start with a racquet equipped').not.toBeNull();
  expect(oldRacquet!.id).not.toBe(UPGRADE);

  const granted = before.player!.inventory.find((i) => i.id === UPGRADE);
  expect(granted, 'granted item should be in the bag').toBeDefined();

  await page.getByTestId('action-inventory').click();

  // Click the card, then Equip in the detail modal — the same two clicks a player
  // makes. (The grid also supports drag-and-drop onto the slot; that is a
  // separate path and not what this covers.)
  await page.getByTestId(`inventory-item-${granted!.instanceId}`).click();
  await expect(page.getByTestId('item-detail')).toBeVisible();
  await page.getByTestId('item-equip').click();

  const after = await readGame(page);
  expect(after.player!.equippedItems.racquet!.id).toBe(UPGRADE);
  // The swapped-out racquet has to land back in the bag, not vanish.
  expect(after.player!.inventory.map((i) => i.id)).toContain(oldRacquet!.id);
  // ...and the new one has to leave it, rather than existing in both places.
  expect(after.player!.inventory.map((i) => i.instanceId)).not.toContain(granted!.instanceId);

  // The slot card should now name the new item, so the screen agrees with the model.
  await expect(page.getByTestId('equipment-slot-racquet')).toHaveAttribute(
    'data-equipped',
    UPGRADE
  );
});

test('unequipping empties the slot and puts the item back in the bag', async ({ page }) => {
  await loadSave(page, SAVE, 7);

  const before = await readGame(page);
  const equipped = before.player!.equippedItems.racquet!;

  await page.getByTestId('action-inventory').click();
  await page.getByTestId('equipment-slot-racquet-item').click();
  await expect(page.getByTestId('item-detail')).toBeVisible();
  await page.getByTestId('item-unequip').click();

  const after = await readGame(page);
  expect(after.player!.equippedItems.racquet).toBeNull();
  expect(after.player!.inventory.map((i) => i.instanceId)).toContain(equipped.instanceId);
  await expect(page.getByTestId('equipment-slot-racquet')).toHaveAttribute('data-equipped', '');
});

test('an equipped item actually changes what the match is told about the player', async ({ page }) => {
  await loadSave(page, SAVE, 7);

  // The baseline includes the beginner racquet the save already wears, so the
  // assertion is "equipping raised it", not "a boost exists".
  const before = ItemManager.getTotalPassiveBoosts((await readGame(page)).player!);

  await grantItem(page, UPGRADE);
  await page.getByTestId('action-inventory').click();

  const granted = (await readGame(page)).player!.inventory.find((i) => i.id === UPGRADE)!;
  await page.getByTestId(`inventory-item-${granted.instanceId}`).click();
  await page.getByTestId('item-equip').click();

  // The point of equipment is the boost, and a card rendering "+8 serve" proves
  // only that the item's own data says so. This runs the same aggregation the
  // pre-match config uses, against the player the store actually holds — so it
  // fails if equipping updated the screen but not the loadout the match reads.
  const equipped = (await readGame(page)).player!;
  const boosts = ItemManager.getTotalPassiveBoosts(equipped);

  expect(boosts.serve ?? 0).toBeGreaterThan(before.serve ?? 0);
});
