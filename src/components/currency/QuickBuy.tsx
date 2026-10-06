/**
 * One-tap +1s offered on an activity's result: the moment the player sees what
 * they earned is the moment to spend it. Each tap is a whole purchase (the
 * Development screen is where plans and reviews live).
 */

import React, { useState } from 'react';
import type { StatName } from '../../types';
import type { CurrencyAmounts as Amounts } from '../../types/game';
import { formatStatName, getStatIcon } from '../../config/statIcons';
import { useGameStore } from '../../stores/gameStore';
import { getStat, priceOf, suggestPurchases } from '../../game/StatDevelopment';
import { CurrencyAmounts } from './CurrencyAmounts';

interface QuickBuyProps {
  /** What the activity paid; suggestions favour stats this currency buys. */
  earned: Amounts;
  /** A stat to offer first when affordable, e.g. the anchor just trained. */
  first?: StatName;
}

export const QuickBuy: React.FC<QuickBuyProps> = ({ earned, first }) => {
  const player = useGameStore((state) => state.player);
  const purchaseStats = useGameStore((state) => state.purchaseStats);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const [bought, setBought] = useState<StatName[]>([]);

  if (!player) return null;
  const options = suggestPurchases(player, earned, first);
  if (options.length === 0 && bought.length === 0) return null;

  const buy = (stat: StatName): void => {
    if (purchaseStats([stat]).success) setBought((b) => [...b, stat]);
  };

  return (
    <div className="bg-pixel-card border-4 border-pixel-border p-4" data-testid="quick-buy">
      <h3 className="text-lg font-bold text-pixel-text mb-1">What this buys</h3>
      {bought.length > 0 && (
        <p className="text-sm text-pixel-success mb-2" role="status">
          Bought {bought.map((s) => `+1 ${formatStatName(s)}`).join(', ')}
        </p>
      )}
      <div className="grid gap-2">
        {options.map((stat) => {
          const value = getStat(player.stats, stat);
          return (
            <button
              key={stat}
              data-testid={`quick-buy-${stat}`}
              onClick={() => buy(stat)}
              className="flex items-center justify-between gap-3 border-2 border-pixel-border bg-pixel-bg px-3 py-2 text-left hover:border-pixel-accent transition-colors"
            >
              <span className="font-bold text-pixel-text">
                <span aria-hidden="true">{getStatIcon(stat)} </span>
                {formatStatName(stat)} {value} → {value + 1}
              </span>
              <CurrencyAmounts amounts={priceOf(stat, value)} className="text-sm" />
            </button>
          );
        })}
      </div>
      <button
        data-testid="quick-buy-development"
        onClick={() => navigateTo('development')}
        className="mt-3 text-sm text-pixel-accent underline"
      >
        Plan more in Development →
      </button>
    </div>
  );
};
