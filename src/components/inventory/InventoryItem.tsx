/**
 * InventoryItem — a single draggable card in the inventory grid.
 *
 * Equipment cards carry an always-on net-rating badge comparing them to whatever
 * is equipped in their slot, so the player can scan the whole grid and instantly
 * see upgrades (▲) vs. downgrades (▼) without opening anything.
 */

import React from 'react';
import type { Item } from '../../types/items';
import { Card } from '../ui/Card';
import { UnseenBadge } from '../ui/UnseenBadge';
import { ItemManager } from '../../game/ItemManager';
import { ITEM_TYPE_META, getItemIcon } from './itemHelpers';
import { NetRatingBadge } from './StatDeltaList';

interface InventoryItemProps {
  item: Item;
  isNew: boolean;
  /** Item equipped in this item's slot — used for the comparison badge. */
  equippedInSlot: Item | null;
  onClick: (item: Item) => void;
  onDragStart: (item: Item) => void;
  onDragEnd: () => void;
  onHoverStart: (item: Item) => void;
  onHoverEnd: () => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  isNew,
  equippedInSlot,
  onClick,
  onDragStart,
  onDragEnd,
  onHoverStart,
  onHoverEnd,
}) => {
  const meta = ITEM_TYPE_META[item.type];
  const isEquipment = item.type === 'equipment';
  const netDelta = isEquipment
    ? ItemManager.getItemRating(item) - ItemManager.getItemRating(equippedInSlot)
    : 0;

  return (
    <div
      draggable={isEquipment}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        onDragStart(item);
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onHoverStart(item)}
      onMouseLeave={onHoverEnd}
      onClick={() => onClick(item)}
    >
      <Card
        padding="sm"
        className={`cursor-pointer hover:border-pixel-accent transition-colors relative ${isEquipment ? 'active:cursor-grabbing' : ''}`}
      >
        {isNew && <UnseenBadge className="absolute -top-2 -right-2" />}

        {/* Comparison badge — only for equipment, and only when it changes rating. */}
        {isEquipment && (
          <div className="absolute -top-2 -left-2">
            <NetRatingBadge delta={netDelta} />
          </div>
        )}

        <div className="text-center">
          <div className="text-3xl mb-1">{getItemIcon(item)}</div>
          <div className={`text-xs px-2 py-0.5 ${meta.badge} text-white mb-1`}>
            {meta.label.toUpperCase()}
          </div>
          <div className="text-sm font-bold text-pixel-text truncate">{item.name}</div>
        </div>
      </Card>
    </div>
  );
};
