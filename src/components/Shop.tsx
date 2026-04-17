/**
 * Shop Component
 * Allows spending experience on stat increases, items, and abilities
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { ShopItemCategory, ItemRarity } from '../types/game';

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

function getRarityColor(rarity?: ItemRarity): string {
  switch (rarity) {
    case 'legendary': return 'text-yellow-400';
    case 'rare': return 'text-blue-400';
    case 'uncommon': return 'text-green-400';
    default: return 'text-gray-300';
  }
}

interface ShopItemCardProps {
  item: {
    id: string;
    category: ShopItemCategory;
    name: string;
    description: string;
    cost: number;
    purchased: boolean;
    rarity?: ItemRarity;
  };
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

  const availableItems = shopItems.filter(item => !item.purchased);
  const allPurchased = availableItems.length === 0 && shopItems.length > 0;

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

            {/* Consumables */}
            {shopItems.filter(i => i.category === 'consumable').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Consumables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'consumable').map((item) => (
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

            {/* Equipment */}
            {shopItems.filter(i => i.category === 'equipment').length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pixel-text mb-4">Equipment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopItems.filter(i => i.category === 'equipment').map((item) => (
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