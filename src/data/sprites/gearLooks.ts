/**
 * Gear looks — how equipped items change the player's sprite.
 *
 * Keyed by catalogue item id rather than stored on the item, because held items are
 * persisted copies: a look added here reaches every save without a migration. Hats become
 * an accessory, outfits recolour the kit. An item with no entry doesn't change the look.
 */

import type { Appearance } from '../../types/appearance';

export type GearLook = Partial<Pick<Appearance, 'accessory' | 'kitColor'>>;

export const GEAR_LOOKS: Readonly<Record<string, GearLook>> = {
  // Hats
  visor: { accessory: 'visor' },
  headband: { accessory: 'headband' },
  cap: { accessory: 'cap' },
  lucky_hat: { accessory: 'cap' },
  sweatband: { accessory: 'headband' },
  bandana: { accessory: 'headband' },
  chef_hat: { accessory: 'chef_hat' },
  stylish_headband: { accessory: 'headband' },
  precision_visor: { accessory: 'visor' },
  rally_king_headband: { accessory: 'headband' },
  champions_cap: { accessory: 'cap' },

  // Outfits
  tournament_outfit: { kitColor: 'navy' },
  compression_outfit: { kitColor: 'violet' },
  retro_outfit: { kitColor: 'white' },
  sponsor_outfit: { kitColor: 'crimson' },
  space_suit: { kitColor: 'white' },
  aerodynamic_suit: { kitColor: 'sky' },
  mental_focus_jersey: { kitColor: 'forest' },
};
