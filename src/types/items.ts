/**
 * Item System Type Definitions
 * Simple item structure using the Modifiers pattern from abilities
 */

import type { Modifiers } from './game';

/**
 * Item type categories
 */
export type ItemType = 'equipment' | 'lucky' | 'story';

/**
 * Item that can be earned and equipped
 * Uses the same Modifiers pattern as abilities for consistency
 */
export interface Item {
  name: string;
  description: string;
  type: ItemType;
  modifiers?: Modifiers; // Optional stat boosts and additional effects
}
