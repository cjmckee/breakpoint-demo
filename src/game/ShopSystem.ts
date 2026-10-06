/**
 * The daily shop: consumables and equipment for XP, abilities for XP plus the
 * currency their effect draws on. Stats are not sold — they are bought on the
 * Development screen.
 */

import type {
  AbilityItem,
  Ability,
  ConsumableItem,
  CurrencyAmounts,
  EquipmentItem,
  ItemRarity,
  ShopItem,
  StatBoosts,
} from '../types/game';
import type { Item } from '../types/items';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { AbilityRarity } from '../types/game';
import { ALL_CONSUMABLES, ALL_EQUIPMENT, CONSUMABLE_SHOP_COSTS } from '../data/items';
import { ABILITY_CURRENCY, ABILITY_PRICES, type AbilityPriceRarity } from '../config/economy';

import { random } from '../core/random';

const SHOP_CONSUMABLE_ITEMS: Item[] = ALL_CONSUMABLES.filter(
  (item) => item.shopAvailable !== false,
);

function createConsumableItem(): ConsumableItem {
  const sourceItem = SHOP_CONSUMABLE_ITEMS[Math.floor(random() * SHOP_CONSUMABLE_ITEMS.length)];
  const effect = sourceItem.consumableEffect;
  return {
    id: `consumable-${Date.now()}-${random().toString(36).slice(2, 5)}`,
    category: 'consumable',
    sourceItemId: sourceItem.id,
    name: sourceItem.name,
    description: sourceItem.description,
    instantEffects: effect?.type === 'instant' ? effect.instantEffects : undefined,
    nextActivityBuffs: effect?.nextActivityBuffs,
    cost: CONSUMABLE_SHOP_COSTS[sourceItem.id] ?? 10,
    purchased: false,
    rarity: 'common',
  };
}

const SHOP_EQUIPMENT_ITEMS: Item[] = ALL_EQUIPMENT.filter((item) => item.shopAvailable !== false);

function calculateEquipmentCost(statBoosts: StatBoosts): number {
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);
  return Math.round(Math.pow(total, 1.4) * 4);
}

function createEquipmentItem(): EquipmentItem {
  const sourceItem = SHOP_EQUIPMENT_ITEMS[Math.floor(random() * SHOP_EQUIPMENT_ITEMS.length)];
  const statBoosts = sourceItem.modifiers?.statBoosts ?? {};
  return {
    id: `equipment-${Date.now()}-${random().toString(36).slice(2, 5)}`,
    category: 'equipment',
    sourceItemId: sourceItem.id,
    name: sourceItem.name,
    description: sourceItem.description,
    statBoosts,
    slot: sourceItem.equipmentSlot ?? 'racquet',
    cost: calculateEquipmentCost(statBoosts),
    purchased: false,
    rarity: 'uncommon',
  };
}

// Legendaries are never sold: they come from the story and rewards only.
const ABILITIES: Ability[] = Object.values(ABILITY_DEFINITIONS).filter(
  (ability) => ability.shopAvailable !== false && ability.rarity !== AbilityRarity.LEGENDARY,
);

/**
 * What taking `ability` from `currentLevel` to the next level costs: a fixed
 * amount per rarity in the ability's currency, plus XP. Learning it (level 0)
 * costs the base; each level after costs base × (1.5 + 0.75 × currentLevel).
 * An off-court ability (no entry in ABILITY_CURRENCY) costs XP only.
 */
export function abilityPrice(
  ability: Pick<Ability, 'name' | 'rarity'>,
  currentLevel: number,
): { xp: number; currency: CurrencyAmounts } {
  const base = ABILITY_PRICES[ability.rarity as AbilityPriceRarity];
  const scale = currentLevel === 0 ? 1 : 1.5 + 0.75 * currentLevel;
  const currency = ABILITY_CURRENCY[ability.name];
  return {
    xp: Math.round(base.xp * scale),
    currency: currency ? { [currency]: Math.round(base.units * scale) } : {},
  };
}

function createAbilityItem(ownedLevels: Map<string, number> = new Map()): AbilityItem | null {
  const roll = random();
  let pool: Ability[] = ABILITIES;

  // How often a rarity appears depends on the rarity: half the offers are
  // commons, a third uncommons, the rest rares.
  if (roll < 0.5) {
    pool = ABILITIES.filter((a) => a.rarity === AbilityRarity.COMMON);
  } else if (roll < 0.85) {
    pool = ABILITIES.filter((a) => a.rarity === AbilityRarity.UNCOMMON);
  } else {
    pool = ABILITIES.filter((a) => a.rarity === AbilityRarity.RARE);
  }

  if (pool.length === 0) return null;
  const template = pool[Math.floor(random() * pool.length)];
  const currentLevel = ownedLevels.get(template.name) ?? 0;
  const nextLevel = currentLevel + 1;

  const price = abilityPrice(template, currentLevel);

  return {
    id: `ability-${template.name}-${Date.now()}-${random().toString(36).slice(2, 5)}`,
    category: 'ability',
    name: nextLevel > 1 ? `${template.name} Lv${nextLevel}` : template.name,
    description: template.description,
    effects: template.effects,
    cost: price.xp,
    currencyCost: price.currency,
    level: nextLevel,
    purchased: false,
    abilityId: template.name,
    rarity: template.rarity as unknown as ItemRarity,
  };
}

export function generateDailyShopItems(ownedLevels: Map<string, number> = new Map()): ShopItem[] {
  const items: ShopItem[] = [];
  const usedNames = new Set<string>();

  // Generate 2 consumables
  while (items.filter((i) => i.category === 'consumable').length < 2) {
    const item = createConsumableItem();
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  // Generate 2 equipment
  while (items.filter((i) => i.category === 'equipment').length < 2) {
    const item = createEquipmentItem();
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  // Generate 2 abilities
  while (items.filter((i) => i.category === 'ability').length < 2) {
    const abilityItem = createAbilityItem(ownedLevels);
    if (abilityItem && !usedNames.has(abilityItem.name)) {
      items.push(abilityItem);
      usedNames.add(abilityItem.name);
    }
  }

  return items;
}
