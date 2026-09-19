/**
 * Item System Type Definitions
 * Simple item structure using the Modifiers pattern from abilities
 */

import type { Modifiers } from './game';

/**
 * Item type categories
 */
export type ItemType = 'equipment' | 'consumable' | 'lucky' | 'story';

/**
 * Equipment slot types.
 *
 * `charm` is the odd one out: it holds `type: 'lucky'` items rather than
 * `type: 'equipment'`. Lucky items used to apply passively from inventory, so
 * holding all of them stacked — the slot makes them a choice instead.
 */
export type EquipmentSlot = 'racquet' | 'shoes' | 'outfit' | 'hat' | 'charm';

/** The item type a given slot accepts. */
export const SLOT_ITEM_TYPE: Record<EquipmentSlot, ItemType> = {
  racquet: 'equipment',
  shoes: 'equipment',
  outfit: 'equipment',
  hat: 'equipment',
  charm: 'lucky',
};

/**
 * Consumable effect types
 */
export type ConsumableEffectType = 'instant' | 'next_activity';

/**
 * Consumable effect definition
 * Instant effects apply immediately, next_activity effects apply to the next training/match
 */
export interface ConsumableEffect {
  type: ConsumableEffectType;
  instantEffects?: {
    energyChange?: number;
    moodChange?: number;
    respecTokens?: number; // Grants archetype respec tokens (used to re-pick a phase specialty)
  };
  nextActivityBuffs?: Modifiers; // Applied to next training/match only
}

/**
 * Item that can be earned and equipped
 * Uses the same Modifiers pattern as abilities for consistency
 */
export interface Item {
  id: string; // Catalogue id — shared by every copy of this item
  name: string;
  description: string;
  type: ItemType;
  modifiers?: Modifiers; // Passive stat boosts (for equipment/lucky items)
  equipmentSlot?: EquipmentSlot; // Only for equipment type
  consumableEffect?: ConsumableEffect; // Only for consumable type
  shopAvailable?: boolean; // Whether item appears in shop (default true). Set false for story/reward-only items
}

/**
 * A copy of an item the player actually holds.
 *
 * `id` names the catalogue entry, so two bananas share it. Anything that acts
 * on one specific copy — equip, use, trash, React keys — goes by `instanceId`,
 * which ItemManager.addItem stamps when the item enters the player's hands.
 */
export interface OwnedItem extends Item {
  instanceId: string;
}
