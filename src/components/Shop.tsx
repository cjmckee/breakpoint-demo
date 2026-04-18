/**
 * Shop Component
 * Allows spending experience on stat increases, items, and abilities
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type {
  ShopItemCategory,
  ItemRarity,
  StatIncreaseItem,
  ConsumableItem,
  EquipmentItem,
  AbilityItem,
  ShopItem,
} from '../types/game';
import type { EquipmentSlot } from '../types/items';
import { SLOT_NAMES } from './Inventory';

const CATEGORY_LABELS: Record<ShopItemCategory, string> = {
  stat_increase: 'Stat Increase',
  consumable: 'Consumable',
  equipment: 'Equipment',
  ability: 'Ability',
};

const CATEGORY_ICONS: Record<ShopItemCategory, string> = {
  stat_increase: '📈',
  consumable: '🧪',
  equipment: '⚔️',
  ability: '⭐',
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  common: 'bg-gray-900',
  uncommon: 'bg-green-900',
  rare: 'bg-blue-900',
  legendary: 'bg-yellow-900',
};

const STAT_ICONS: Record<string, string> = {
  serve: '🎯',
  forehand: '🏃',
  backhand: '🏃',
  volley: '🖐️',
  overhead: '🙌',
  dropShot: '📉',
  slice: '🔪',
  return: '🔙',
  spin: '🔄',
  placement: '🎯',
  speed: '⚡',
  stamina: '💪',
  strength: '💪',
  agility: '🦘',
  focus: '🎯',
  anticipation: '👁️',
  shotVariety: '🎨',
  recovery: '🔄',
  offensive: '⚔️',
  defensive: '🛡️',
};

const CONSUMABLE_ICONS: Record<string, string> = {
  energy: '⚡',
  mood: '😊',
  focus: '🎯',
};

function getRarityColor(rarity?: ItemRarity): string {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400';
    case 'rare': return 'text-blue-400';
    case 'uncommon': return 'text-green-400';
    default: return 'text-gray-300';
  }
}

function formatStatName(stat: string): string {
  return stat.charAt(0).toUpperCase() + stat.slice(1);
}

const ConsumableShopCard: React.FC<{
  item: ConsumableItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const hasInstant = item.instantEffects && (item.instantEffects.energyChange || item.instantEffects.moodChange);
  const hasBuff = item.nextActivityBuffs?.statBoosts && Object.keys(item.nextActivityBuffs.statBoosts).length > 0;
  const hasNextActivity = item.effectType === 'focus' || hasBuff;

  return (
    <Card className="border-2 p-4 bg-gray-900 border-gray-600">
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            <div>
              <h3 className="text-lg font-bold text-pixel-text">{item.name}</h3>
              <span className="text-xs text-gray-400 uppercase">Consumable</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        {/* Instant Effects */}
        {hasInstant && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
            Instant
          </div>
        )}
        {hasInstant && item.instantEffects?.energyChange && (
          <div className="flex items-center gap-2 text-sm">
            <span>⚡</span>
            <span className="text-gray-300">Energy</span>
            <span className="text-green-400 ml-auto">+{item.instantEffects.energyChange}</span>
          </div>
        )}
        {hasInstant && item.instantEffects?.moodChange && (
          <div className="flex items-center gap-2 text-sm">
            <span>😊</span>
            <span className="text-gray-300">Mood</span>
            <span className="text-green-400 ml-auto">+{item.instantEffects.moodChange}</span>
          </div>
        )}

        {/* Next Session Buffs */}
        {hasNextActivity && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
            Next Session
          </div>
        )}
        {hasNextActivity && item.effectType === 'focus' && (
          <div className="flex items-center gap-2 text-sm">
            <span>🎯</span>
            <span className="text-gray-300">Focus</span>
            <span className="text-green-400 ml-auto">+{item.effectAmount}</span>
          </div>
        )}
        {item.nextActivityBuffs?.statBoosts && Object.entries(item.nextActivityBuffs.statBoosts).map(([stat, value]) => (
          <div key={stat} className="flex items-center gap-2 text-sm">
            <span>{STAT_ICONS[stat] || '⭐'}</span>
            <span className="text-gray-300">{formatStatName(stat)}</span>
            <span className="text-green-400 ml-auto">+{value}</span>
          </div>
        ))}

        {/* Button */}
        <div className="mt-auto">
          {item.purchased ? (
            <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">Sold Out</Button>
          ) : (
            <Button onClick={() => onBuy(item.id)} disabled={!canAfford} className="w-full">
              {canAfford ? 'Buy' : 'Not Enough XP'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const StatBoostCard: React.FC<{
  item: StatIncreaseItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const rarity = item.rarity ?? 'common';
  const rarityColor = getRarityColor(rarity);
  const rarityBg = RARITY_BG_COLORS[rarity];
  const statEntries = Object.entries(item.statBoosts);
  const totalIncrease = statEntries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <Card className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} ${rarityBg} border-gray-600 flex flex-col`}>
      <div className="flex flex-col gap-2 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <div>
              <h3 className={`text-lg font-bold ${rarityColor}`}>+{totalIncrease} Bundle</h3>
              <span className={`text-xs ${rarityColor}`}>{RARITY_LABELS[rarity]}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        {/* Body - Stats */}
        <div className="mt-2 pt-2 border-t border-gray-700 flex flex-col flex-1">
          <div className="grid grid-cols-2 gap-1">
            {statEntries.map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-1 text-sm">
                <span>{STAT_ICONS[stat] || '⭐'}</span>
                <span className="text-gray-300">{formatStatName(stat)}</span>
                <span className="text-green-400 ml-auto">+{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-2 border-t border-gray-700 flex justify-between text-sm">
            <span className="text-gray-400">Total Improvement</span>
            <span className="text-green-400">+{totalIncrease}</span>
          </div>
        </div>

        {/* Button */}
        <div className="mt-auto">
          {item.purchased ? (
            <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">Sold Out</Button>
          ) : (
            <Button onClick={() => onBuy(item.id)} disabled={!canAfford} className="w-full">
              {canAfford ? 'Buy' : 'Not Enough XP'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const EquipmentShopCard: React.FC<{
  item: EquipmentItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const rarity = item.rarity ?? 'common';
  const rarityColor = getRarityColor(rarity);
  // const rarityBg = RARITY_BG_COLORS[rarity]; // TODO: Add back in when equipment has rarity.
  const rarityBg = 'bg-gray-900'
  const statEntries = Object.entries(item.statBoosts);
  const totalIncrease = statEntries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <Card className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} ${rarityBg} border-gray-600 flex flex-col`}>
      <div className="flex flex-col gap-2 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className={`text-lg font-bold text-pixel-text`}>{item.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        {/* Slot */}
        <div className="text-sm text-gray-400">
          {SLOT_NAMES[item.slot] || item.slot}
        </div>

        {/* Body - Stats */}
        <div className="mt-2 pt-2 border-t border-gray-700 flex flex-col flex-1">
          <div className="grid grid-cols-2 gap-1">
            {statEntries.map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-1 text-sm">
                <span>{STAT_ICONS[stat] || '⭐'}</span>
                <span className="text-gray-300">{formatStatName(stat)}</span>
                <span className="text-green-400 ml-auto">+{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-2 border-t border-gray-700 flex justify-between text-sm">
            <span className="text-gray-400">Total Improvement</span>
            <span className="text-green-400">+{totalIncrease}</span>
          </div>
        </div>

        {/* Button */}
        <div className="mt-auto">
          {item.purchased ? (
            <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">Sold Out</Button>
          ) : (
            <Button onClick={() => onBuy(item.id)} disabled={!canAfford} className="w-full">
              {canAfford ? 'Buy' : 'Not Enough XP'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

interface ShopItemCardProps {
  item: ShopItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item,
  playerExperience,
  onBuy,
}) => {
  const canAfford = playerExperience >= item.cost;
  const rarityColor = item.rarity ? getRarityColor(item.rarity) : 'text-pixel-text';
  const rarityBg = item.rarity ? RARITY_BG_COLORS[item.rarity] : 'bg-gray-900';

  return (
    <Card className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} ${rarityBg} border-gray-600`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
            <div>
              <h3 className={`text-lg font-bold ${rarityColor || 'text-pixel-text'}`}>
                {item.name}
              </h3>
              {item.rarity && item.category !== 'ability' && (
                <span className={`text-xs ${rarityColor}`}>
                  {RARITY_LABELS[item.rarity]}
                </span>
              )}
              {!item.rarity && (
                <span className="text-xs text-gray-400 uppercase">
                  {CATEGORY_LABELS[item.category]}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        <p className="text-sm text-gray-300">{item.description}</p>

        <div className="mt-auto">
          {item.purchased ? (
            <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">Sold Out</Button>
          ) : (
            <Button
              onClick={() => onBuy(item.id)}
              disabled={!canAfford}
              className="w-full"
            >
              {canAfford ? 'Buy' : 'Not Enough XP'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const Shop: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const shopItems = useGameStore((state) => state.shopItems);
  const shopUnlocked = useGameStore((state) => state.shopUnlocked);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const purchaseItem = useGameStore((state) => state.purchaseItem);
  const calendar = useGameStore((state) => state.calendar);

  const isShopAvailable = shopUnlocked || calendar.currentDay >= 7;

  if (!player) return null;

  const availableItems = (shopItems as ShopItem[]).filter(item => !item.purchased);
  const allPurchased = availableItems.length === 0 && shopItems.length > 0;

  console.log('items', availableItems);

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Shop</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Day {calendar.currentDay}</div>
            <Button onClick={() => navigateTo('idle')}>Back to Menu</Button>
          </div>
        </div>

        {/* Experience Display */}
        <Card className="mb-6 bg-yellow-900 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">Experience</h2>
              <p className="text-sm text-yellow-200">Spend experience to improve your character</p>
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              {player.experience} XP
            </div>
          </div>
        </Card>

        {/* Unlock message or shop items */}
        {!isShopAvailable ? (
          <Card className="bg-gray-900 border-gray-600">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-pixel-text mb-2">Shop Unlocks Day 7</h2>
              <p className="text-pixel-text-muted">
                Complete more matches and training to access the shop!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Current progress: Day {calendar.currentDay}/7
              </p>
            </div>
          </Card>
        ) : shopItems.length === 0 ? (
          <Card className="bg-gray-900 border-gray-600">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-pixel-text mb-2">Shop Closed</h2>
              <p className="text-pixel-text-muted">
                The shop is closed for today. Check back tomorrow!
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Stat Increases */}
            {shopItems.filter(i => i.category === 'stat_increase').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Stat Increases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'stat_increase').map((item) => (
                    <StatBoostCard
                      key={item.id}
                      item={item as StatIncreaseItem}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Consumables */}
            {shopItems.filter(i => i.category === 'consumable').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Consumables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'consumable').map((item) => (
                    <ConsumableShopCard
                      key={item.id}
                      item={item as ConsumableItem}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {shopItems.filter(i => i.category === 'equipment').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Equipment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'equipment').map((item) => (
                    <EquipmentShopCard
                      key={item.id}
                      item={item as EquipmentItem}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Abilities */}
            {shopItems.filter(i => i.category === 'ability').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Abilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'ability').map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};