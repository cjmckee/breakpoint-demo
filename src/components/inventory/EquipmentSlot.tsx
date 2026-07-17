/**
 * EquipmentSlot — one equipment slot in the loadout panel.
 *
 * Doubles as a drop target for drag-and-drop equipping and shows a live stat
 * delta overlay when a compatible item is being dragged over it or hovered in
 * the inventory grid. Clicking opens the equipped item's detail modal.
 */

import React, { useState } from 'react';
import type { Item, EquipmentSlot as SlotType } from '../../types/items';
import { SLOT_ICONS, SLOT_NAMES, getItemIcon, supportsHover } from './itemHelpers';
import { StatDeltaList } from './StatDeltaList';
import { StatPill } from './ItemEffects';

interface EquipmentSlotProps {
  slot: SlotType;
  equippedItem: Item | null;
  /** Item currently being dragged anywhere (null if no drag in progress). */
  draggingItem: Item | null;
  /** Item currently hovered in the inventory grid (null if none). */
  hoveredItem: Item | null;
  onEquip: (item: Item) => void;
  onClickEquipped: (item: Item) => void;
  onDragStartEquipped: (item: Item) => void;
  onDragEnd: () => void;
}

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slot,
  equippedItem,
  draggingItem,
  hoveredItem,
  onEquip,
  onClickEquipped,
  onDragStartEquipped,
  onDragEnd,
}) => {
  const [isDropTarget, setIsDropTarget] = useState(false);

  const draggingCompatible = draggingItem?.equipmentSlot === slot && draggingItem.id !== equippedItem?.id;

  // Which item to compare against the equipped one — a compatible drag wins over hover.
  const compareItem =
    draggingCompatible
      ? draggingItem
      : hoveredItem?.equipmentSlot === slot && hoveredItem.id !== equippedItem?.id
        ? hoveredItem
        : null;

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggingCompatible) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDropTarget) setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    if (isDropTarget) setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    if (draggingCompatible && draggingItem) {
      onEquip(draggingItem);
    }
  };

  const borderClass = isDropTarget
    ? 'border-pixel-accent bg-pixel-accent/10'
    : draggingCompatible
      ? 'border-pixel-accent border-dashed'
      : compareItem
        ? 'border-pixel-accent/60'
        : 'border-pixel-border';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-4 ${borderClass} bg-pixel-bg p-3 transition-colors`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{SLOT_ICONS[slot]}</span>
        <span className="text-xs font-bold uppercase tracking-wide text-pixel-text-muted">
          {SLOT_NAMES[slot]}
        </span>
      </div>

      {equippedItem ? (
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', equippedItem.id);
            onDragStartEquipped(equippedItem);
          }}
          onDragEnd={onDragEnd}
          onClick={() => onClickEquipped(equippedItem)}
          className="w-full text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getItemIcon(equippedItem)}</span>
            <span className="text-sm font-bold text-pixel-text group-hover:text-pixel-accent transition-colors">
              {equippedItem.name}
            </span>
          </div>
          {equippedItem.modifiers?.statBoosts && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(equippedItem.modifiers.statBoosts)
                .filter((e): e is [string, number] => (e[1] ?? 0) !== 0)
                .map(([stat, value]) => (
                  <StatPill key={stat} stat={stat} value={value} />
                ))}
            </div>
          )}
        </button>
      ) : (
        <div className="text-xs text-pixel-text-muted py-2 italic">
          {supportsHover ? 'Empty — drag an item here' : 'Empty — tap an item to equip'}
        </div>
      )}

      {/* Live comparison overlay */}
      {compareItem && (
        <div className="mt-3 border-t-2 border-pixel-border pt-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-lg">{getItemIcon(compareItem)}</span>
            <span className="text-xs font-bold text-pixel-accent truncate">{compareItem.name}</span>
          </div>
          <StatDeltaList current={equippedItem} candidate={compareItem} variant="compact" />
        </div>
      )}
    </div>
  );
};
