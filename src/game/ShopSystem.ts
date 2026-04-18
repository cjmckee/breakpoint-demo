/**
 * Shop System
 * Handles shop item generation and daily refresh
 */

import type {
  ShopItem,
  ShopItemCategory,
  ItemRarity,
  StatIncreaseItem,
  ConsumableItem,
  EquipmentItem,
  AbilityItem,
  StatBoosts,
} from '../types/game';
import type { PlayerStats } from '../types';
import type { Item, EquipmentSlot } from '../types/items';
import { ABILITY_DEFINITIONS } from './AbilitySystem';
import { AbilityRarity } from '../types/game';
import { ALL_CONSUMABLES, ALL_EQUIPMENT } from '../data/items';

const CORE_STATS = ['serve', 'forehand', 'backhand', 'return', 'slice'] as const;
const TECHNICAL_STATS = ['volley', 'overhead', 'dropShot', 'spin', 'placement'] as const;
const PHYSICAL_STATS = ['speed', 'stamina', 'strength', 'agility', 'recovery'] as const;
const MENTAL_STATS = ['focus', 'anticipation', 'shotVariety', 'offensive', 'defensive'] as const;

type CoreStat = typeof CORE_STATS[number];
type TechnicalStat = typeof TECHNICAL_STATS[number];
type PhysicalStat = typeof PHYSICAL_STATS[number];
type MentalStat = typeof MENTAL_STATS[number];

function getStatValue(stats: PlayerStats, statName: string): number {
  if (statName in stats.core) {
    return stats.core[statName as keyof typeof stats.core];
  }
  if (statName in stats.technical) {
    return stats.technical[statName as keyof typeof stats.technical];
  }
  if (statName in stats.physical) {
    return stats.physical[statName as keyof typeof stats.physical];
  }
  if (statName in stats.mental) {
    return stats.mental[statName as keyof typeof stats.mental];
  }
  return 0;
}

function calculateStatIncreaseCost(currentValue: number, increase: number): number {
  const multiplier = Math.max(1, currentValue / 10 - 1);
  return Math.round(Math.pow(increase, 1.3) * multiplier);
}

function pickRandomStat(values: readonly string[]): string {
  return values[Math.floor(Math.random() * values.length)];
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

  const currentValue = playerStats ? getStatValue(playerStats, Object.keys(statBoosts)[0]) : 0;
  const cost = calculateStatIncreaseCost(currentValue, totalIncrease);
  const affectedStats = Object.keys(statBoosts).join(' + ');
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);

  const rarityName: Record<ItemRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare ',
    legendary: 'Legendary ',
  };

  return {
    id: `stat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'stat_increase',
    name: `${rarityName[rarity]}+${total} ${affectedStats}`,
    description: `Increase ${affectedStats} by a total of +${total}`,
    cost,
    purchased: false,
    statBoosts,
    rarity,
  };
}

const SHOP_CONSUMABLES: Pick<ConsumableItem, 'name' | 'description' | 'effectType' | 'effectAmount' | 'instantEffects' | 'nextActivityBuffs'>[] =
  ALL_CONSUMABLES
    .filter(item => item.shopAvailable !== false)
    .map(item => {
      const effect = item.consumableEffect;
      let effectType: 'energy' | 'mood' | 'focus' = 'energy';
      let effectAmount = 20;
      let instantEffects: { energyChange?: number; moodChange?: number } | undefined;

      if (effect?.type === 'instant' && effect.instantEffects) {
        instantEffects = effect.instantEffects;
        if (effect.instantEffects.energyChange && effect.instantEffects.energyChange > 0) {
          effectType = 'energy';
          effectAmount = effect.instantEffects.energyChange;
        } else if (effect.instantEffects.moodChange && effect.instantEffects.moodChange > 0) {
          effectType = 'mood';
          effectAmount = effect.instantEffects.moodChange;
        }
      }

      return {
        name: item.name,
        description: item.description,
        effectType,
        effectAmount,
        instantEffects,
        nextActivityBuffs: effect?.nextActivityBuffs,
      };
    });

function createConsumableItem(): ConsumableItem {
  const template = SHOP_CONSUMABLES[Math.floor(Math.random() * SHOP_CONSUMABLES.length)];
  return {
    id: `consumable-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'consumable',
    ...template,
    cost: 2,
    purchased: false,
    rarity: 'common',
  };
}

const SHOP_EQUIPMENT: Pick<EquipmentItem, 'name' | 'description' | 'statBoosts' | 'slot'>[] =
  ALL_EQUIPMENT
    .filter(item => item.shopAvailable !== false)
    .map(item => ({
      name: item.name,
      description: item.description,
      statBoosts: item.modifiers?.statBoosts ?? {},
      slot: item.equipmentSlot ?? 'racquet',
    }));

function calculateEquipmentCost(statBoosts: StatBoosts): number {
  const total = Object.values(statBoosts).reduce((a, b) => a + b, 0);
  return Math.round(Math.pow(total, 1.3) * 2);
}

function createEquipmentItem(): EquipmentItem {
  const template = SHOP_EQUIPMENT[Math.floor(Math.random() * SHOP_EQUIPMENT.length)];
  return {
    id: `equipment-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: template.name,
    description: template.description,
    category: 'equipment',
    statBoosts: template.statBoosts || {},
    slot: template.slot || 'racquet',
    cost: calculateEquipmentCost(template.statBoosts || {}),
    purchased: false,
    rarity: 'uncommon',
  };
}

type ShopAbilityTemplate = {
  abilityId: string;
  name: string;
  description: string;
  rarity: AbilityRarity;
  statBoosts: StatBoosts;
};

const ABILITIES: ShopAbilityTemplate[] = Object.values(ABILITY_DEFINITIONS)
  .filter(ability => ability.shopAvailable !== false)
  .map(ability => ({
    abilityId: ability.name,
    name: ability.name,
    description: ability.description,
    rarity: ability.rarity,
    statBoosts: ability.modifiers.statBoosts,
  }));

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

function createAbilityItem(ownedAbilityIds: Set<string> = new Set(), ownedLevels: Map<string, number> = new Map()): AbilityItem | null {
  const roll = Math.random();
  let pool: typeof ABILITIES = ABILITIES;

  if (roll < 0.5) {
    pool = ABILITIES.filter(a => a.rarity === AbilityRarity.COMMON);
  } else if (roll < 0.75) {
    pool = ABILITIES.filter(a => a.rarity !== AbilityRarity.LEGENDARY);
  } else if (roll < 0.9) {
    pool = ABILITIES.filter(a => a.rarity !== AbilityRarity.COMMON && a.rarity !== AbilityRarity.LEGENDARY);
  } else {
    pool = ABILITIES.filter(a => a.rarity === AbilityRarity.LEGENDARY);
  }

  const template = pool[Math.floor(Math.random() * pool.length)];
  const currentLevel = ownedLevels.get(template.abilityId) ?? 0;
  const nextLevel = currentLevel + 1;

  const baseCost = calculateAbilityCost(template.statBoosts, template.rarity);
  const hasAbility = currentLevel > 0;
  const adjustedCost = hasAbility 
    ? Math.round(baseCost * 1.5 + baseCost * currentLevel * 0.75) 
    : baseCost;

  const levelText = nextLevel > 1 ? ` Lv${nextLevel}` : '';
  const nameWithLevel = template.name + levelText;

  return {
    id: `ability-${template.abilityId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    category: 'ability',
    name: nameWithLevel,
    description: hasAbility 
      ? `Upgrade ${template.name} to level ${nextLevel}. ${template.description}`
      : `Learn ${template.name}. ${template.description}`,
    cost: adjustedCost,
    purchased: false,
    abilityId: template.abilityId,
    statBoosts: template.statBoosts,
    rarity: template.rarity,
  };
}

export function generateDailyShopItems(
  playerStats: PlayerStats | null = null,
  playerAbilities: string[] = [],
  ownedLevels: Map<string, number> = new Map()
): ShopItem[] {
  const items: ShopItem[] = [];
  const usedNames = new Set<string>();
  const ownedAbilityIds = new Set(playerAbilities);

  // Generate 4 stat increases
  while (items.filter(i => i.category === 'stat_increase').length < 4) {
    const item = createStatIncreaseItem(playerStats);
    if (item && !usedNames.has(item.name)) {
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

  // Generate 2 abilities
  // TODO: Add this back in when you have a better catalog of abilities + effects. Keep to items for now.
  return items;

  // while (items.filter(i => i.category === 'ability').length < 2) {
  //   const item = createAbilityItem(ownedAbilityIds, ownedLevels);
  //   if (item && !usedNames.has(item.name)) {
  //     items.push(item);
  //     usedNames.add(item.name);
  //   }
  // }

  // return items;
}