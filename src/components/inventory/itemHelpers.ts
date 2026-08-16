/**
 * Shared visual helpers for inventory / equipment UI.
 */

import type { Item, EquipmentSlot, ItemType } from '../../types/items';

export const SLOT_ICONS: Record<EquipmentSlot, string> = {
  racquet: '🎾',
  shoes: '👟',
  outfit: '👕',
  hat: '🧢',
};

export const SLOT_NAMES: Record<EquipmentSlot, string> = {
  racquet: 'Racquet',
  shoes: 'Shoes',
  outfit: 'Outfit',
  hat: 'Hat',
};

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['racquet', 'shoes', 'outfit', 'hat'];

interface ItemTypeMeta {
  label: string;
  /** Tailwind background class for the type badge. */
  badge: string;
  /** Tailwind border color used for card accents. */
  border: string;
}

export const ITEM_TYPE_META: Record<ItemType, ItemTypeMeta> = {
  equipment: { label: 'Equipment', badge: 'bg-blue-600', border: 'border-blue-500' },
  consumable: { label: 'Consumable', badge: 'bg-green-600', border: 'border-green-500' },
  lucky: { label: 'Lucky', badge: 'bg-purple-600', border: 'border-purple-500' },
  story: { label: 'Story', badge: 'bg-yellow-600', border: 'border-yellow-500' },
};

/**
 * Whether the device supports true hover (desktop/mouse). Touch devices don't,
 * so drag-and-drop and hover overlays are unavailable and the UI falls back to
 * tap-driven affordances. Mirrors the detection used in AbilityDisplay.
 */
export const supportsHover =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

/** Emoji shown for an item — equipment uses its slot icon. */
export function getItemIcon(item: Item): string {
  if (item.equipmentSlot) return SLOT_ICONS[item.equipmentSlot];
  if (item.type === 'consumable') return '💊';
  if (item.type === 'lucky') return '🍀';
  return '📜';
}
