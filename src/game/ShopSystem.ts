import type {
  ShopItem,
  ItemRarity,
  StatIncreaseItem,
  ConsumableItem,
  EquipmentItem,
  AbilityItem,
  StatBoosts,
  Ability,
} from '../types/game';
import type { PlayerStats } from '../types/index';
import type { Item } from '../types/items';
import { ABILITY_DEFINITIONS } from './AbilitySystem';
import { AbilityRarity } from '../types/game';
import { ALL_CONSUMABLES, ALL_EQUIPMENT } from '../data/items';

const CORE_STATS = ['serve', 'forehand', 'backhand', 'return', 'slice'] as const;
const TECHNICAL_STATS = ['volley', 'overhead', 'dropShot', 'spin', 'placement'] as const;
const PHYSICAL_STATS = ['speed', 'stamina', 'strength', 'agility', 'recovery'] as const;
const MENTAL_STATS = ['focus', 'anticipation', 'shotVariety', 'offensive', 'defensive'] as const;

function getStatValue(stats: PlayerStats, statName: string): number {
  if (statName in stats.core) return stats.core[statName as keyof typeof stats.core];
  if (statName in stats.technical) return stats.technical[statName as keyof typeof stats.technical];
  if (statName in stats.physical) return stats.physical[statName as keyof typeof stats.physical];
  if (statName in stats.mental) return stats.mental[statName as keyof typeof stats.mental];
  return 0;
}

function calculateStatIncreaseCost(currentValue: number, increase: number): number {
  const multiplier = Math.max(3, currentValue / 10);
  return Math.round(Math.pow(increase, 1.4) * multiplier);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollStatRarity(): ItemRarity {
  const roll = Math.random() * 100;
  if (roll < 60) return 'common';
  if (roll < 85) return 'uncommon';
  if (roll < 97) return 'rare';
  return 'legendary';
}

function createStatIncreaseItem(playerStats: PlayerStats | null): StatIncreaseItem {
  const rarity = rollStatRarity();
  const numStatsMap: Record<ItemRarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    legendary: 4,
  };
  const numStats = numStatsMap[rarity];

  const category = Math.random() < 0.3 ? 'core' : (Math.random() < 0.33 ? 'technical' : Math.random() < 0.5 ? 'physical' : 'mental');

  const statNames: Record<string, readonly string[]> = {
    core: CORE_STATS,
    technical: TECHNICAL_STATS,
    physical: PHYSICAL_STATS,
    mental: MENTAL_STATS,
  };

  const statBoosts: StatBoosts = {};
  const usedStats = new Set<string>();
  let totalIncrease = 0;

  const availableStats = statNames[category];
  for (let i = 0; i < numStats; i++) {
    const remaining = availableStats.filter(s => !usedStats.has(s));
    if (remaining.length === 0) break;
    const stat = remaining[Math.floor(Math.random() * remaining.length)];
    usedStats.add(stat);
    const boost = randInt(1, 5);
    (statBoosts as Record<string, number>)[stat] = boost;
    totalIncrease += boost;
  }

  const statKeys = Object.keys(statBoosts);
  const avgCurrentValue = playerStats
    ? statKeys.reduce((sum, stat) => sum + getStatValue(playerStats, stat), 0) / statKeys.length
    : 0;
  const cost = calculateStatIncreaseCost(avgCurrentValue, totalIncrease);
  const affectedStats = Object.keys(statBoosts).join(' + ');
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);

  const rarityName: Record<ItemRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    legendary: 'Legendary',
  };

  return {
    id: `stat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'stat_increase',
    name: `${rarityName[rarity]} +${total} ${affectedStats}`,
    description: `Increase ${affectedStats} by a total of +${total}`,
    cost,
    purchased: false,
    statBoosts,
    rarity,
  };
}

const SHOP_CONSUMABLE_ITEMS: Item[] = ALL_CONSUMABLES.filter(item => item.shopAvailable !== false);

function createConsumableItem(): ConsumableItem {
  const sourceItem = SHOP_CONSUMABLE_ITEMS[Math.floor(Math.random() * SHOP_CONSUMABLE_ITEMS.length)];
  const effect = sourceItem.consumableEffect;
  return {
    id: `consumable-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'consumable',
    sourceItemId: sourceItem.id,
    name: sourceItem.name,
    description: sourceItem.description,
    instantEffects: effect?.type === 'instant' ? effect.instantEffects : undefined,
    nextActivityBuffs: effect?.nextActivityBuffs,
    cost: 2,
    purchased: false,
    rarity: 'common',
  };
}

const SHOP_EQUIPMENT_ITEMS: Item[] = ALL_EQUIPMENT.filter(item => item.shopAvailable !== false);

function calculateEquipmentCost(statBoosts: StatBoosts): number {
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);
  return Math.round(Math.pow(total, 1.3) * 2);
}

function createEquipmentItem(): EquipmentItem {
  const sourceItem = SHOP_EQUIPMENT_ITEMS[Math.floor(Math.random() * SHOP_EQUIPMENT_ITEMS.length)];
  const statBoosts = sourceItem.modifiers?.statBoosts ?? {};
  return {
    id: `equipment-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
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

const ABILITIES: Ability[] = Object.values(ABILITY_DEFINITIONS).filter(
  ability => ability.shopAvailable !== false
);

const RARITY_MULTIPLIERS: Record<AbilityRarity, number> = {
  [AbilityRarity.COMMON]: 25,
  [AbilityRarity.UNCOMMON]: 50,
  [AbilityRarity.RARE]: 100,
  [AbilityRarity.LEGENDARY]: 200,
};

function calculateAbilityCost(statBoosts: StatBoosts, rarity: AbilityRarity): number {
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);
  const multiplier = RARITY_MULTIPLIERS[rarity] ?? 0;
  return Math.round(Math.pow(total, 1.5) + multiplier);
}

function createAbilityItem(ownedLevels: Map<string, number> = new Map()): AbilityItem | null {
  const roll = Math.random();
  let pool: Ability[] = ABILITIES;

  if (roll < 0.5) {
    pool = ABILITIES.filter(a => a.rarity === AbilityRarity.COMMON);
  } else if (roll < 0.75) {
    pool = ABILITIES.filter(a => a.rarity !== AbilityRarity.LEGENDARY);
  } else if (roll < 0.9) {
    pool = ABILITIES.filter(a => a.rarity !== AbilityRarity.COMMON && a.rarity !== AbilityRarity.LEGENDARY);
  } else {
    pool = ABILITIES.filter(a => a.rarity === AbilityRarity.LEGENDARY);
  }

  if (pool.length === 0) return null;
  const template = pool[Math.floor(Math.random() * pool.length)];
  const currentLevel = ownedLevels.get(template.name) ?? 0;
  const nextLevel = currentLevel + 1;
  const hasAbility = currentLevel > 0;

  const baseCost = calculateAbilityCost(template.modifiers.statBoosts, template.rarity);
  const adjustedCost = hasAbility
    ? Math.round(baseCost * 1.5 + baseCost * currentLevel * 0.75)
    : baseCost;

  return {
    id: `ability-${template.name}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'ability',
    name: nextLevel > 1 ? `${template.name} Lv${nextLevel}` : template.name,
    description: hasAbility
      ? `Upgrade ${template.name} to level ${nextLevel}. ${template.description}`
      : `Learn ${template.name}. ${template.description}`,
    cost: adjustedCost,
    purchased: false,
    abilityId: template.name,
    statBoosts: template.modifiers.statBoosts,
    rarity: template.rarity as unknown as import('../types/game').ItemRarity,
  };
}

export function generateDailyShopItems(
  playerStats: PlayerStats | null = null,
  playerAbilities: string[] = [],
  ownedLevels: Map<string, number> = new Map()
): ShopItem[] {
  const items: ShopItem[] = [];
  const usedNames = new Set<string>();

  // Generate 4 stat increases
  while (items.filter(i => i.category === 'stat_increase').length < 4) {
    const item = createStatIncreaseItem(playerStats);
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  // Generate 2 consumables
  while (items.filter(i => i.category === 'consumable').length < 2) {
    const item = createConsumableItem();
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  // Generate 2 equipment
  while (items.filter(i => i.category === 'equipment').length < 2) {
    const item = createEquipmentItem();
    if (!usedNames.has(item.name)) {
      items.push(item);
      usedNames.add(item.name);
    }
  }

  // TODO: Re-enable ability generation once ability catalog is more robust
  return items;
}
