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
 * Equipment slot types
 */
export type EquipmentSlot = 'racquet' | 'shoes' | 'outfit' | 'hat';

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
  };
  nextActivityBuffs?: Modifiers; // Applied to next training/match only
}

/**
 * Item that can be earned and equipped
 * Uses the same Modifiers pattern as abilities for consistency
 */
export interface Item {
  id: string; // Unique identifier for tracking
  name: string;
  description: string;
  type: ItemType;
  modifiers?: Modifiers; // Passive stat boosts (for equipment/lucky items)
  equipmentSlot?: EquipmentSlot; // Only for equipment type
  consumableEffect?: ConsumableEffect; // Only for consumable type
  shopAvailable?: boolean; // Whether item appears in shop (default true). Set false for story/reward-only items
}
