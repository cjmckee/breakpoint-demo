/**
 * Shop Component
 * Spends XP on items, and XP plus training currency on abilities. Stats are
 * bought on the Development screen, not here.
 */

import React, { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import type {
  ItemRarity,
  ConsumableItem,
  EquipmentItem,
  AbilityItem,
  ShopItem,
  CurrencyAmounts as Amounts,
  Currency,
  Wallet,
} from '../types/game';
import { SLOT_NAMES } from './Inventory';
import { StatBoostList } from './ui/StatBoostList';
import { formatAbilityName } from './AbilityDisplay';
import { CurrencyAmounts } from './currency/CurrencyAmounts';
import { canAfford as walletCovers } from '../game/StatDevelopment';
import { CURRENCIES, CURRENCY_LABELS } from '../config/economy';
import { levelMultiplier } from '../core/EffectAggregator';

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
    case 'legendary':
      return 'text-yellow-400';
    case 'rare':
      return 'text-blue-400';
    case 'uncommon':
      return 'text-green-400';
    default:
      return 'text-gray-300';
  }
}

// Price tag colored by affordability so the catalog can be scanned without
// reading button states: yellow = in reach, red = can't afford yet.
const CostTag: React.FC<{
  cost: number;
  canAfford: boolean;
  purchased?: boolean;
  currency?: Amounts;
  short?: readonly Currency[];
}> = ({ cost, canAfford, purchased, currency, short }) => (
  <div className="text-right">
    {currency && (
      <CurrencyAmounts
        amounts={currency}
        short={purchased ? [] : short}
        className="justify-end text-lg"
      />
    )}
    <div
      className={`text-xl font-bold ${
        purchased ? 'text-gray-500' : canAfford ? 'text-yellow-400' : 'text-red-400'
      }`}
    >
      {cost}
    </div>
    <div className="text-xs text-gray-400">XP</div>
  </div>
);

const BuyButton: React.FC<{
  item: ShopItem;
  canAfford: boolean;
  onBuy: (itemId: string) => void;
  /** Why it can't be bought, when it can't. */
  shortOf?: string;
  testId: string;
}> = ({ item, canAfford, onBuy, shortOf = 'Not Enough XP', testId }) => {
  if (item.purchased) {
    return (
      <Button
        disabled
        className="w-full bg-gray-700 text-gray-400 cursor-not-allowed"
        testId={testId}
      >
        Sold Out
      </Button>
    );
  }
  return (
    <Button onClick={() => onBuy(item.id)} disabled={!canAfford} className="w-full" testId={testId}>
      {canAfford ? 'Buy' : shortOf}
    </Button>
  );
};

const ConsumableShopCard: React.FC<{
  item: ConsumableItem;
  playerExperience: number;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, onBuy }) => {
  const canAfford = playerExperience >= item.cost;
  const hasInstant =
    item.instantEffects && (item.instantEffects.energyChange || item.instantEffects.moodChange);
  const hasNextActivity =
    item.nextActivityBuffs?.statBoosts && Object.keys(item.nextActivityBuffs.statBoosts).length > 0;

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
          <CostTag cost={item.cost} canAfford={canAfford} purchased={item.purchased} />
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
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
            Next Session
          </div>
        )}
        {item.nextActivityBuffs?.statBoosts && (
          <StatBoostList statBoosts={item.nextActivityBuffs.statBoosts} variant="list" />
        )}

        <div className="mt-auto">
          <BuyButton
            item={item}
            canAfford={canAfford}
            onBuy={onBuy}
            testId={`shop-buy-${item.sourceItemId}`}
          />
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
    <Card
      className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} bg-gray-900 border-gray-600 flex flex-col`}
    >
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className="text-lg font-bold text-pixel-text">{item.name}</h3>
            </div>
          </div>
          <CostTag cost={item.cost} canAfford={canAfford} purchased={item.purchased} />
        </div>

        <div className="text-sm text-gray-400">{SLOT_NAMES[item.slot] || item.slot}</div>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <StatBoostList statBoosts={item.statBoosts} variant="grid" showTotal />
        </div>

        <div className="mt-auto">
          <BuyButton
            item={item}
            canAfford={canAfford}
            onBuy={onBuy}
            testId={`shop-buy-${item.sourceItemId}`}
          />
        </div>
      </div>
    </Card>
  );
};

const AbilityShopCard: React.FC<{
  item: AbilityItem;
  playerExperience: number;
  wallet: Wallet;
  onBuy: (itemId: string) => void;
}> = ({ item, playerExperience, wallet, onBuy }) => {
  const enoughXp = playerExperience >= item.cost;
  const short = CURRENCIES.filter((c) => wallet[c] < (item.currencyCost[c] ?? 0));
  const canAfford = enoughXp && walletCovers(wallet, item.currencyCost);
  const needs = [
    ...(enoughXp ? [] : [`${item.cost - playerExperience} XP`]),
    ...short.map(
      (c) => `${(item.currencyCost[c] ?? 0) - Math.floor(wallet[c])} ${CURRENCY_LABELS[c]}`,
    ),
  ];
  const shortOf = `Need ${needs.join(' and ')}`;
  const owned = item.level - 1;
  const rarityColor = getRarityColor(item.rarity);
  const rarityBg = RARITY_BG_COLORS[item.rarity];

  return (
    <Card
      className={`border-2 p-4 ${item.purchased ? 'opacity-60' : ''} ${rarityBg} border-gray-600 flex flex-col`}
    >
      <div
        className="flex flex-col gap-2 flex-1"
        data-testid={`shop-ability-${item.abilityId}`}
        data-level={item.level}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className={`text-lg font-bold ${rarityColor}`}>
                {formatAbilityName(item.abilityId)}
              </h3>
              <span className={`text-xs ${rarityColor}`}>{RARITY_LABELS[item.rarity]} Ability</span>
            </div>
          </div>
          {/* The XP colour is about XP alone; the button names any currency short. */}
          <CostTag
            cost={item.cost}
            canAfford={enoughXp}
            purchased={item.purchased}
            currency={item.currencyCost}
            short={short}
          />
        </div>

        {owned > 0 && (
          <div
            className="border-2 border-pixel-accent px-3 py-2 text-sm"
            data-testid={`shop-upgrade-${item.abilityId}`}
          >
            <div className="font-bold text-pixel-text">
              Upgrade: you own Lv {owned} → buying Lv {item.level}
            </div>
            <div className="text-xs text-pixel-text-muted">
              Effect ×{levelMultiplier(owned).toFixed(1)} → ×
              {levelMultiplier(item.level).toFixed(1)}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-400 italic">{item.description}</p>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-300">{item.effects}</p>
        </div>

        <div className="mt-auto pt-2">
          <BuyButton
            item={item}
            canAfford={canAfford}
            onBuy={onBuy}
            shortOf={shortOf}
            testId={`shop-buy-${item.abilityId}`}
          />
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

  const grouped = useMemo(
    () => ({
      consumable: shopItems.filter((i): i is ConsumableItem => i.category === 'consumable'),
      equipment: shopItems.filter((i): i is EquipmentItem => i.category === 'equipment'),
      ability: shopItems.filter((i): i is AbilityItem => i.category === 'ability'),
    }),
    [shopItems],
  );

  if (!player) return null;

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-1">Shop</h1>
        <span className="text-xs text-gray-200 opacity-75 truncate mb-3">New stock daily</span>

        {/* XP balance stays pinned while browsing — every Buy decision is a
            comparison against this number */}
        <div className="sticky top-2 z-20 mb-6 bg-yellow-900 border-4 border-yellow-500 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="text-sm font-bold text-yellow-200 whitespace-nowrap">💰 Balance</span>
          </div>
          <span className="flex flex-wrap items-center justify-end gap-x-3">
            <CurrencyAmounts amounts={player.wallet} testId="shop-wallet" />
            <span className="text-2xl font-bold text-yellow-400 whitespace-nowrap">
              {player.experience} XP
            </span>
          </span>
        </div>

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
                      wallet={player.wallet}
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
