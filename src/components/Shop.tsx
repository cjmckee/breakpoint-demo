/**
 * Shop Component
 * Allows spending experience on stat increases, items, and abilities
 */

import React, { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type {
  ItemRarity,
  StatIncreaseItem,
  ConsumableItem,
  EquipmentItem,
  AbilityItem,
  ShopItem,
} from '../types/game';
import { SLOT_NAMES } from './Inventory';
import { StatBoostList } from './ui/StatBoostList';

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

function getRarityColor(rarity?: ItemRarity): string {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400';
    case 'rare': return 'text-blue-400';
    case 'uncommon': return 'text-green-400';
    default: return 'text-gray-300';
  }
}


const BuyButton: React.FC<{
  item: ShopItem;
  canAfford: boolean;
  onBuy: (itemId: string) => void;
}> = ({ item, canAfford, onBuy }) => {
  if (item.purchased) {
    return <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">Sold Out</Button>;
  }
  return (
    <Button onClick={() => onBuy(item.id)} disabled={!canAfford} className="w-full">
      {canAfford ? 'Buy' : 'Not Enough XP'}
    </Button>
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

        <div className="mt-2 pt-2 border-t border-gray-700">
          <StatBoostList statBoosts={item.statBoosts} variant="grid" showTotal />
        </div>

        <div className="mt-auto">
          <BuyButton item={item} canAfford={canAfford} onBuy={onBuy} />
        </div>
      </div>
    </Card>
  );
};

const ConsumableShopCard: React.FC<{
  item: ConsumableItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const hasInstant = item.instantEffects && (item.instantEffects.energyChange || item.instantEffects.moodChange);
  const hasNextActivity = item.nextActivityBuffs?.statBoosts && Object.keys(item.nextActivityBuffs.statBoosts).length > 0;

  return (
    <Card className="border-2 p-4 bg-gray-900 border-gray-600">
      <div className="flex flex-col gap-2">
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

        {hasInstant && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">Instant</div>
        )}
        {item.instantEffects?.energyChange && (
          <div className="flex items-center gap-2 text-sm">
            <span>⚡</span>
            <span className="text-gray-300">Energy</span>
            <span className="text-green-400 ml-auto">+{item.instantEffects.energyChange}</span>
          </div>
        )}
        {item.instantEffects?.moodChange && (
          <div className="flex items-center gap-2 text-sm">
            <span>😊</span>
            <span className="text-gray-300">Mood</span>
            <span className="text-green-400 ml-auto">+{item.instantEffects.moodChange}</span>
          </div>
        )}

        {hasNextActivity && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">Next Session</div>
        )}
        {item.nextActivityBuffs?.statBoosts && (
          <StatBoostList statBoosts={item.nextActivityBuffs.statBoosts} variant="list" />
        )}

        <div className="mt-auto">
          <BuyButton item={item} canAfford={canAfford} onBuy={onBuy} />
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

  return (
    <Card className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} bg-gray-900 border-gray-600 flex flex-col`}>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className="text-lg font-bold text-pixel-text">{item.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          {SLOT_NAMES[item.slot] || item.slot}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <StatBoostList statBoosts={item.statBoosts} variant="grid" showTotal />
        </div>

        <div className="mt-auto">
          <BuyButton item={item} canAfford={canAfford} onBuy={onBuy} />
        </div>
      </div>
    </Card>
  );
};

const AbilityShopCard: React.FC<{
  item: AbilityItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const rarityColor = getRarityColor(item.rarity);
  const rarityBg = RARITY_BG_COLORS[item.rarity];

  return (
    <Card className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} ${rarityBg} border-gray-600 flex flex-col`}>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className={`text-lg font-bold ${rarityColor}`}>{item.name}</h3>
              <span className={`text-xs ${rarityColor}`}>{RARITY_LABELS[item.rarity]} Ability</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400">{item.cost}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>

        <p className="text-sm text-gray-300">{item.description}</p>

        <div className="mt-auto">
          <BuyButton item={item} canAfford={canAfford} onBuy={onBuy} />
        </div>
      </div>
    </Card>
  );
};

export const Shop: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const shopItems = useGameStore((state) => state.shopItems);
  const isShopAvailable = useGameStore((state) => state.isShopUnlocked());
  const navigateTo = useGameStore((state) => state.navigateTo);
  const purchaseItem = useGameStore((state) => state.purchaseItem);
  const calendar = useGameStore((state) => state.calendar);

  const grouped = useMemo(() => ({
    stat_increase: shopItems.filter((i): i is StatIncreaseItem => i.category === 'stat_increase'),
    consumable: shopItems.filter((i): i is ConsumableItem => i.category === 'consumable'),
    equipment: shopItems.filter((i): i is EquipmentItem => i.category === 'equipment'),
    ability: shopItems.filter((i): i is AbilityItem => i.category === 'ability'),
  }), [shopItems]);

  if (!player) return null;

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Shop</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Day {calendar.currentDay}</div>
            <Button onClick={() => navigateTo('idle')}>Back to Menu</Button>
          </div>
        </div>

        <Card className="mb-6 bg-yellow-900 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">Experience</h2>
              <p className="text-sm text-yellow-200">Spend experience to improve your character</p>
              <p className="text-xs text-pixel-text">New items are available each day</p>
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              {player.experience} XP
            </div>
          </div>
        </Card>

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
            {grouped.stat_increase.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Stat Increases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped.stat_increase.map((item) => (
                    <StatBoostCard
                      key={item.id}
                      item={item}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {grouped.consumable.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Consumables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped.consumable.map((item) => (
                    <ConsumableShopCard
                      key={item.id}
                      item={item}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {grouped.equipment.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Equipment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped.equipment.map((item) => (
                    <EquipmentShopCard
                      key={item.id}
                      item={item}
                      playerExperience={player.experience}
                      onBuy={purchaseItem}
                    />
                  ))}
                </div>
              </div>
            )}
            {grouped.ability.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Abilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped.ability.map((item) => (
                    <AbilityShopCard
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
