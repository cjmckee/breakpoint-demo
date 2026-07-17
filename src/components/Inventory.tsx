/**
 * Inventory Component
 *
 * Loadout-style layout: equipment slots + aggregated passive boosts on the left,
 * a filterable inventory grid on the right. Items can be equipped by drag-and-drop
 * (drag a grid item onto a slot) or by click, and equipment cards show an always-on
 * comparison badge plus a live delta overlay so upgrades are easy to spot.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { StatusBar } from './StatusBar';
import { ItemManager } from '../game/ItemManager';
import type { Item } from '../types/items';
import { EQUIPMENT_SLOTS } from './inventory/itemHelpers';
import { EquipmentSlot as EquipmentSlotCard } from './inventory/EquipmentSlot';
import { InventoryItem } from './inventory/InventoryItem';
import { ItemDetailModal } from './inventory/ItemDetailModal';
import { StatPills, EffectChips } from './inventory/ItemEffects';

// Re-exported for Shop.tsx which reads slot display names.
export { SLOT_NAMES } from './inventory/itemHelpers';

type FilterTab = 'all' | 'equipment' | 'consumable' | 'lucky';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'equipment', label: 'Gear' },
  { id: 'consumable', label: 'Consumables' },
  { id: 'lucky', label: 'Lucky' },
];

const MAX_INVENTORY_SIZE = 10;

export const Inventory: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const useConsumable = useGameStore((state) => state.useConsumable);
  const trashItem = useGameStore((state) => state.trashItem);
  const markItemSeen = useGameStore((state) => state.markItemSeen);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [draggingItem, setDraggingItem] = useState<Item | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [isGridDropTarget, setIsGridDropTarget] = useState(false);

  if (!player) return null;

  const passiveBoosts = ItemManager.getTotalPassiveBoosts(player);
  const passiveEffects = ItemManager.getTotalPassiveEffects(player);
  const hasStatBoosts = Object.values(passiveBoosts).some((v) => (v ?? 0) !== 0);
  const hasPassiveEffects = Object.keys(passiveEffects).length > 0;

  const filteredInventory = player.inventory.filter((item) =>
    filter === 'all' ? true : item.type === filter
  );

  const isItemNew = (item: Item): boolean => !(player.seenItemIds ?? []).includes(item.id);

  const equippedInSlot = (item: Item): Item | null =>
    item.equipmentSlot ? player.equippedItems[item.equipmentSlot] ?? null : null;

  const isDraggingEquipped =
    draggingItem !== null &&
    Object.values(player.equippedItems).some((i) => i?.id === draggingItem.id);

  // --- Handlers ---
  const openItem = (item: Item) => {
    markItemSeen(item.id);
    setSelectedItem(item);
  };

  const handleEquip = (item: Item) => {
    if (item.equipmentSlot) {
      equipItem(item.id, item.equipmentSlot);
      setSelectedItem(null);
      setDraggingItem(null);
    }
  };

  const handleUnequip = (item: Item) => {
    if (item.equipmentSlot) {
      unequipItem(item.equipmentSlot);
      setSelectedItem(null);
      setDraggingItem(null);
    }
  };

  const handleUse = (item: Item) => {
    useConsumable(item.id);
    setSelectedItem(null);
  };

  const handleTrash = (item: Item) => {
    trashItem(item.id);
    setSelectedItem(null);
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGridDropTarget(false);
    // Dropping an equipped item back into the grid unequips it.
    if (isDraggingEquipped && draggingItem?.equipmentSlot) {
      unequipItem(draggingItem.equipmentSlot);
    }
    setDraggingItem(null);
  };

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-4">Inventory</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-6">
          {/* ---- Left: Loadout ---- */}
          <div className="flex flex-col gap-6">
            <Card title="Equipment" padding="md">
              <div className="flex flex-col gap-3">
                {EQUIPMENT_SLOTS.map((slot) => (
                  <EquipmentSlotCard
                    key={slot}
                    slot={slot}
                    equippedItem={player.equippedItems[slot] ?? null}
                    draggingItem={draggingItem}
                    hoveredItem={hoveredItem}
                    onEquip={handleEquip}
                    onClickEquipped={openItem}
                    onDragStartEquipped={setDraggingItem}
                    onDragEnd={() => setDraggingItem(null)}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* ---- Right: Inventory grid ---- */}
          <div className="flex flex-col gap-6">
            <Card title="Passive Boosts" padding="md">
              {hasStatBoosts || hasPassiveEffects ? (
                <div className="flex flex-col gap-3">
                  {hasStatBoosts && <StatPills statBoosts={passiveBoosts} />}
                  {hasPassiveEffects && <EffectChips additional={passiveEffects} />}
                </div>
              ) : (
                <div className="text-sm text-pixel-text-muted">No passive boosts active</div>
              )}
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-pixel-text">
                  Inventory{' '}
                  <span className="text-base text-pixel-text-muted font-normal">
                    ({player.inventory.length}/{MAX_INVENTORY_SIZE})
                  </span>
                </h2>
                <div className="flex gap-1 flex-wrap">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id)}
                      className={`px-3 py-1 text-xs font-bold border-2 transition-colors ${
                        filter === tab.id
                          ? 'bg-pixel-accent border-pixel-accent-dark text-white'
                          : 'bg-pixel-bg border-pixel-border text-pixel-text-muted hover:border-pixel-accent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone for unequipping (drag an equipped item back here). */}
              <div
                onDragOver={(e) => {
                  if (isDraggingEquipped) {
                    e.preventDefault();
                    setIsGridDropTarget(true);
                  }
                }}
                onDragLeave={() => setIsGridDropTarget(false)}
                onDrop={handleGridDrop}
                className={`border-2 border-dashed p-2 transition-colors ${
                  isDraggingEquipped && isGridDropTarget
                    ? 'border-pixel-accent bg-pixel-accent/5'
                    : isDraggingEquipped
                      ? 'border-pixel-accent/50'
                      : 'border-transparent'
                }`}
              >
                {isDraggingEquipped && (
                  <div className="text-xs text-pixel-accent text-center mb-2">
                    Drop here to unequip
                  </div>
                )}

                {filteredInventory.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {filteredInventory.map((item) => (
                      <InventoryItem
                        key={item.id}
                        item={item}
                        isNew={isItemNew(item)}
                        equippedInSlot={equippedInSlot(item)}
                        onClick={openItem}
                        onDragStart={setDraggingItem}
                        onDragEnd={() => setDraggingItem(null)}
                        onHoverStart={setHoveredItem}
                        onHoverEnd={() => setHoveredItem(null)}
                      />
                    ))}
                    {/* Fill empty slots only in the unfiltered view. */}
                    {filter === 'all' &&
                      Array.from({ length: MAX_INVENTORY_SIZE - player.inventory.length }).map(
                        (_, i) => (
                          <Card
                            key={`empty-${i}`}
                            padding="sm"
                            className="opacity-40 flex items-center justify-center min-h-[7rem]"
                          >
                            <div className="text-center text-pixel-text-muted text-xs">Empty</div>
                          </Card>
                        )
                      )}
                  </div>
                ) : (
                  <div className="text-sm text-pixel-text-muted text-center py-8">
                    No {filter === 'all' ? '' : FILTER_TABS.find((t) => t.id === filter)?.label.toLowerCase()} items.
                  </div>
                )}
              </div>
            </Card>

            {/* Story Items */}
            {player.storyItems.length > 0 && (
              <Card padding="md" className="border-4 border-yellow-600">
                <h2 className="text-2xl font-bold text-yellow-600 mb-4">Story Items</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {player.storyItems.map((item) => (
                    <InventoryItem
                      key={item.id}
                      item={item}
                      isNew={isItemNew(item)}
                      equippedInSlot={null}
                      onClick={openItem}
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                      onHoverStart={() => {}}
                      onHoverEnd={() => {}}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <ItemDetailModal
          item={selectedItem}
          equippedInSlot={selectedItem ? equippedInSlot(selectedItem) : null}
          isEquipped={
            selectedItem?.equipmentSlot
              ? player.equippedItems[selectedItem.equipmentSlot]?.id === selectedItem.id
              : false
          }
          onClose={() => setSelectedItem(null)}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onUseConsumable={handleUse}
          onTrash={handleTrash}
        />
      </div>
    </div>
  );
};
