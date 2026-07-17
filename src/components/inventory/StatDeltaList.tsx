/**
 * StatDeltaList — side-by-side comparison of a candidate equipment item against
 * whatever is currently equipped in its slot. Renders a per-stat delta and a
 * net-rating summary so the player can instantly tell if an item is an upgrade.
 */

import React from 'react';
import type { Item } from '../../types/items';
import { ItemManager } from '../../game/ItemManager';
import { STAT_ICONS, formatStatName } from '../ui/StatBoostList';

function deltaColor(delta: number): string {
  if (delta > 0) return 'text-green-400';
  if (delta < 0) return 'text-red-400';
  return 'text-pixel-text-muted';
}

function formatDelta(delta: number): string {
  if (delta === 0) return '±0';
  return `${delta > 0 ? '+' : ''}${delta}`;
}

/** Net-rating pill: ▲ +6 / ▼ -4 / = */
export const NetRatingBadge: React.FC<{ delta: number; className?: string }> = ({
  delta,
  className = '',
}) => {
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '=';
  const color =
    delta > 0
      ? 'bg-green-600 border-green-800'
      : delta < 0
        ? 'bg-red-600 border-red-800'
        : 'bg-pixel-secondary border-pixel-border';
  return (
    <span
      className={`inline-flex items-center gap-0.5 border-2 px-1.5 py-0.5 text-xs font-bold text-white leading-none ${color} ${className}`}
    >
      {arrow}
      {delta !== 0 && <span>{Math.abs(delta)}</span>}
    </span>
  );
};

interface StatDeltaListProps {
  current: Item | null;
  candidate: Item;
  /** 'full' shows from → to columns; 'compact' shows only the delta value. */
  variant?: 'full' | 'compact';
}

export const StatDeltaList: React.FC<StatDeltaListProps> = ({
  current,
  candidate,
  variant = 'full',
}) => {
  const deltas = ItemManager.getStatDeltas(current, candidate);
  const netDelta = ItemManager.getItemRating(candidate) - ItemManager.getItemRating(current);

  return (
    <div className="flex flex-col gap-1">
      {deltas.map(({ stat, from, to, delta }) => (
        <div key={stat} className="flex items-center gap-2 text-xs">
          <span>{STAT_ICONS[stat] ?? '⭐'}</span>
          <span className="text-pixel-text-muted flex-1 truncate">{formatStatName(stat)}</span>
          {variant === 'full' && (
            <span className="text-pixel-text-muted tabular-nums">
              {from} <span className="text-pixel-text-muted/60">→</span> {to}
            </span>
          )}
          <span className={`font-bold tabular-nums w-10 text-right ${deltaColor(delta)}`}>
            {formatDelta(delta)}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between border-t-2 border-pixel-border pt-1.5 mt-1 text-xs">
        <span className="text-pixel-text-muted font-bold uppercase tracking-wide">Net Rating</span>
        <NetRatingBadge delta={netDelta} />
      </div>
    </div>
  );
};
