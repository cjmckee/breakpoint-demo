/**
 * Item Manager
 * Handles all item-related operations: inventory, equipment, consumables
 */

import type { Player, Modifiers, StatBoosts } from '../types/game';
import type { Item, EquipmentSlot } from '../types/items';

const MAX_INVENTORY_SIZE = 10;

export class ItemManager {
  /**
   * Add an item to the player's inventory or story items
   * Story items bypass the inventory limit
   */
  static addItem(player: Player, item: Item): Player {
    if (item.type === 'story') {
      return {
        ...player,
        storyItems: [...player.storyItems, item],
      };
    }

    // Check inventory space
    if (player.inventory.length >= MAX_INVENTORY_SIZE) {
      console.warn('Inventory full! Cannot add item:', item.name);
      return player;
    }

    return {
      ...player,
      inventory: [...player.inventory, item],
    };
  }

  /**
   * Equip an item from inventory to an equipment slot
   * Returns the previously equipped item to inventory
   */
  static equipItem(player: Player, itemId: string, slot: EquipmentSlot): Player {
    const item = this.findItemInInventory(player, itemId);
    if (!item) {
      console.warn('Item not found in inventory:', itemId);
      return player;
    }

    if (item.type !== 'equipment') {
      console.warn('Item is not equipment type:', item.name);
      return player;
    }

    if (item.equipmentSlot !== slot) {
      console.warn(`Item ${item.name} cannot be equipped in ${slot} slot`);
      return player;
    }

    // Remove item from inventory
    const newInventory = player.inventory.filter((i) => i.id !== itemId);

    // Get previously equipped item
    const previousItem = player.equippedItems[slot];

    // Add previous item back to inventory if it exists
    if (previousItem) {
      newInventory.push(previousItem);
    }

    return {
      ...player,
      inventory: newInventory,
      equippedItems: {
        ...player.equippedItems,
        [slot]: item,
      },
    };
  }

  /**
   * Unequip an item from an equipment slot back to inventory
   */
  static unequipItem(player: Player, slot: EquipmentSlot): Player {
    const item = player.equippedItems[slot];
    if (!item) {
      console.warn('No item equipped in slot:', slot);
      return player;
    }

    // Check inventory space
    if (player.inventory.length >= MAX_INVENTORY_SIZE) {
      console.warn('Inventory full! Cannot unequip item');
      return player;
    }

    return {
      ...player,
      inventory: [...player.inventory, item],
      equippedItems: {
        ...player.equippedItems,
        [slot]: null,
      },
    };
  }

  /**
   * Swap an equipped item directly with an inventory item
   */
  static swapEquipment(player: Player, newItemId: string, slot: EquipmentSlot): Player {
    const newItem = this.findItemInInventory(player, newItemId);
    if (!newItem) {
      console.warn('New item not found in inventory:', newItemId);
      return player;
    }

    if (newItem.type !== 'equipment' || newItem.equipmentSlot !== slot) {
      console.warn('Invalid item for slot:', slot);
      return player;
    }

    const previousItem = player.equippedItems[slot];
    const newInventory = player.inventory.filter((i) => i.id !== newItemId);

    if (previousItem) {
      newInventory.push(previousItem);
    }

    return {
      ...player,
      inventory: newInventory,
      equippedItems: {
        ...player.equippedItems,
        [slot]: newItem,
      },
    };
  }

  /**
   * Use a consumable item
   * Applies instant effects and/or sets next activity buffs
   */
  static useConsumable(player: Player, itemId: string): {
    player: Player;
    energyChange: number;
    moodChange: number;
    buffApplied: boolean;
  } {
    const item = this.findItemInInventory(player, itemId);
    if (!item) {
      console.warn('Item not found:', itemId);
      return { player, energyChange: 0, moodChange: 0, buffApplied: false };
    }

    if (item.type !== 'consumable' || !item.consumableEffect) {
      console.warn('Item is not a consumable:', item.name);
      return { player, energyChange: 0, moodChange: 0, buffApplied: false };
    }

    const { consumableEffect } = item;
    let energyChange = 0;
    let moodChange = 0;
    let buffApplied = false;

    let updatedPlayer = { ...player };

    // Apply instant effects
    if (consumableEffect.type === 'instant' && consumableEffect.instantEffects) {
      energyChange = consumableEffect.instantEffects.energyChange || 0;
      moodChange = consumableEffect.instantEffects.moodChange || 0;
    }

    // Apply next activity buffs
    if (consumableEffect.nextActivityBuffs) {
      updatedPlayer.nextActivityBuffs = consumableEffect.nextActivityBuffs;
      buffApplied = true;
    }

    // Remove item from inventory
    updatedPlayer.inventory = player.inventory.filter((i) => i.id !== itemId);

    return { player: updatedPlayer, energyChange, moodChange, buffApplied };
  }

  /**
   * Get and clear next activity buffs
   * Called when starting a training session or match
   */
  static consumeActivityBuffs(player: Player): {
    player: Player;
    buffs: Modifiers | null;
  } {
    const buffs = player.nextActivityBuffs;

    return {
      player: {
        ...player,
        nextActivityBuffs: null,
      },
      buffs,
    };
  }

  /**
   * Calculate total passive stat boosts from equipped items and inventory
   * Equipment items and lucky items provide passive boosts
   */
  static getTotalPassiveBoosts(player: Player): StatBoosts {
    const boosts: StatBoosts = {};

    // Add boosts from equipped items
    Object.values(player.equippedItems).forEach((item) => {
      if (item?.modifiers?.statBoosts) {
        this.mergeStatBoosts(boosts, item.modifiers.statBoosts);
      }
    });

    // Add boosts from lucky items in inventory (passive effect)
    player.inventory.forEach((item) => {
      if (item.type === 'lucky' && item.modifiers?.statBoosts) {
        this.mergeStatBoosts(boosts, item.modifiers.statBoosts);
      }
    });

    // Add boosts from story items (passive effect)
    player.storyItems.forEach((item) => {
      if (item.modifiers?.statBoosts) {
        this.mergeStatBoosts(boosts, item.modifiers.statBoosts);
      }
    });

    return boosts;
  }

  /**
   * Get count of regular inventory items (excludes story items)
   */
  static getInventoryCount(player: Player): number {
    return player.inventory.length;
  }

  /**
   * Check if player can add a regular item to inventory
   */
  static canAddItem(player: Player, item: Item): boolean {
    if (item.type === 'story') return true;
    return player.inventory.length < MAX_INVENTORY_SIZE;
  }

  /**
   * Find an item in the player's inventory by ID
   */
  static findItemInInventory(player: Player, itemId: string): Item | null {
    return player.inventory.find((item) => item.id === itemId) || null;
  }

  /**
   * Find an item in any of the player's item locations
   */
  static findItemById(player: Player, itemId: string): Item | null {
    // Check inventory
    const inInventory = player.inventory.find((item) => item.id === itemId);
    if (inInventory) return inInventory;

    // Check equipped items
    const equipped = Object.values(player.equippedItems).find((item) => item?.id === itemId);
    if (equipped) return equipped;

    // Check story items
    const inStoryItems = player.storyItems.find((item) => item.id === itemId);
    if (inStoryItems) return inStoryItems;

    return null;
  }

  /**
   * Get all items (inventory + equipped + story items)
   */
  static getAllItems(player: Player): Item[] {
    const equippedItems = Object.values(player.equippedItems).filter(
      (item): item is Item => item !== null
    );

    return [...player.inventory, ...equippedItems, ...player.storyItems];
  }

  /**
   * Get items from inventory that match a specific equipment slot
   */
  static getItemsBySlot(player: Player, slot: EquipmentSlot): Item[] {
    return player.inventory.filter(
      (item) => item.type === 'equipment' && item.equipmentSlot === slot
    );
  }

  /**
   * Trash/remove an item from inventory permanently
   * Cannot trash story items or currently equipped items
   */
  static trashItem(player: Player, itemId: string): Player {
    const item = this.findItemInInventory(player, itemId);
    if (!item) {
      console.warn('Item not found in inventory:', itemId);
      return player;
    }

    if (item.type === 'story') {
      console.warn('Cannot trash story items:', item.name);
      return player;
    }

    return {
      ...player,
      inventory: player.inventory.filter((i) => i.id !== itemId),
    };
  }

  /**
   * Merge stat boosts (helper function)
   */
  private static mergeStatBoosts(target: StatBoosts, source: StatBoosts): void {
    Object.entries(source).forEach(([stat, value]) => {
      const statKey = stat as keyof StatBoosts;
      target[statKey] = (target[statKey] || 0) + value;
    });
  }
}
