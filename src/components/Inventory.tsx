/**
 * Inventory Component
 * Displays and manages player inventory, equipped items, and story items
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ItemManager } from '../game/ItemManager';
import type { Item, EquipmentSlot } from '../types/items';

const SLOT_ICONS: Record<EquipmentSlot, string> = {
  racquet: '🎾',
  shoes: '👟',
  outfit: '👕',
  hat: '🧢',
};

const SLOT_NAMES: Record<EquipmentSlot, string> = {
  racquet: 'Racquet',
  shoes: 'Shoes',
  outfit: 'Outfit',
  hat: 'Hat',
};

interface ModalState {
  item: Item | null;
  slot: EquipmentSlot | null;
  showSwapOptions: boolean;
}

export const Inventory: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const useConsumable = useGameStore((state) => state.useConsumable);
  const trashItem = useGameStore((state) => state.trashItem);
  const markItemSeen = useGameStore((state) => state.markItemSeen);

  const [modal, setModal] = useState<ModalState>({ item: null, slot: null, showSwapOptions: false });

  if (!player) return null;

  const passiveBoosts = ItemManager.getTotalPassiveBoosts(player);
  const slots: EquipmentSlot[] = ['racquet', 'shoes', 'outfit', 'hat'];

  const closeModal = () => {
    setModal({ item: null, slot: null, showSwapOptions: false });
  };

  const handleEquip = (item: Item) => {
    if (item.equipmentSlot) {
      equipItem(item.id, item.equipmentSlot);
      closeModal();
    }
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    unequipItem(slot);
    closeModal();
  };

  const handleUseConsumable = (item: Item) => {
    useConsumable(item.id);
    closeModal();
  };

  const handleTrashItem = (item: Item) => {
    trashItem(item.id);
    closeModal();
  };

  // Click on an inventory item - show details modal and mark as seen
  const handleItemClick = (item: Item) => {
    markItemSeen(item.id);
    setModal({ item, slot: item.equipmentSlot ?? null, showSwapOptions: false });
  };

  // Click on an equipment slot - show equipped item details or swap options
  const handleSlotClick = (slot: EquipmentSlot) => {
    const equippedItem = player.equippedItems[slot];
    if (equippedItem) {
      markItemSeen(equippedItem.id);
      // Show equipped item details with swap option
      setModal({ item: equippedItem, slot, showSwapOptions: false });
    } else {
      // Empty slot - show available items to equip
      setModal({ item: null, slot, showSwapOptions: true });
    }
  };

  // Check if an item is currently equipped
  const isItemEquipped = (item: Item): boolean => {
    if (!item.equipmentSlot) return false;
    return player.equippedItems[item.equipmentSlot]?.id === item.id;
  };

  const isItemNew = (item: Item): boolean => {
    return !(player.seenItemIds ?? []).includes(item.id);
  };

  const renderItemCard = (item: Item, isEquipped = false, onClick?: () => void) => {
    const typeColors: Record<string, string> = {
      equipment: 'bg-blue-600',
      consumable: 'bg-green-600',
      lucky: 'bg-purple-600',
      story: 'bg-yellow-600',
    };

    const isSelected = modal.item?.id === item.id;
    const isNew = isItemNew(item);

    return (
      <div key={item.id} onClick={onClick ?? (() => handleItemClick(item))}>
        <Card
          padding="sm"
          className={`cursor-pointer hover:border-pixel-accent transition-colors relative ${
            isSelected ? 'border-pixel-accent border-4' : ''
          }`}
        >
          {isNew && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce">
              !
            </div>
          )}
          <div className="text-center">
            <div className="text-3xl mb-1">
              {item.equipmentSlot ? SLOT_ICONS[item.equipmentSlot] : item.type === 'consumable' ? '💊' : '✨'}
            </div>
            <div className={`text-xs px-2 py-0.5 ${typeColors[item.type]} text-white mb-1`}>
              {item.type.toUpperCase()}
            </div>
            <div className="text-sm font-bold text-pixel-text truncate">{item.name}</div>
            {isEquipped && (
              <div className="text-xs text-pixel-accent mt-1">EQUIPPED</div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderItemDetails = (item: Item) => {
    const equipped = isItemEquipped(item);
    const slot = item.equipmentSlot;
    const canTrash = item.type !== 'story' && !equipped;

    return (
      <>
        <h2 className="text-2xl font-bold text-pixel-text mb-2">{item.name}</h2>
        <p className="text-sm text-pixel-text-muted mb-4">{item.description}</p>

        {/* Modifiers / Stat Boosts */}
        {item.modifiers?.statBoosts && Object.keys(item.modifiers.statBoosts).length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-pixel-text mb-2">Stat Boosts</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(item.modifiers.statBoosts).map(([stat, value]) => (
                <div key={stat} className="text-sm">
                  <span className="text-pixel-text">{stat}:</span>
                  <span className="text-pixel-accent font-bold ml-1">+{value as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumable Effect */}
        {item.consumableEffect && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-pixel-text mb-2">Effect</h3>
            {item.consumableEffect.instantEffects && (
              <div className="text-sm text-pixel-text-muted">
                {item.consumableEffect.instantEffects.energyChange && (
                  <div>Energy: +{item.consumableEffect.instantEffects.energyChange}</div>
                )}
                {item.consumableEffect.instantEffects.moodChange && (
                  <div>Mood: +{item.consumableEffect.instantEffects.moodChange}</div>
                )}
              </div>
            )}
            {item.consumableEffect.nextActivityBuffs && (
              <div>
                <div className="text-sm text-pixel-accent mb-1">Buffs for next activity:</div>
                {item.consumableEffect.nextActivityBuffs.statBoosts &&
                  Object.keys(item.consumableEffect.nextActivityBuffs.statBoosts).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(item.consumableEffect.nextActivityBuffs.statBoosts).map(([stat, value]) => (
                      <div key={stat} className="text-sm">
                        <span className="text-pixel-text">{stat}:</span>
                        <span className="text-pixel-accent font-bold ml-1">+{value as number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {/* Equipment actions */}
          {item.type === 'equipment' && slot && !equipped && (
            <Button onClick={() => handleEquip(item)} variant="primary">
              Equip
            </Button>
          )}
          {item.type === 'equipment' && slot && equipped && (
            <>
              <Button onClick={() => setModal({ ...modal, showSwapOptions: true })} variant="primary">
                Swap
              </Button>
              <Button onClick={() => handleUnequip(slot)} variant="secondary">
                Unequip
              </Button>
            </>
          )}

          {/* Consumable action */}
          {item.type === 'consumable' && (
            <Button onClick={() => handleUseConsumable(item)} variant="success">
              Use
            </Button>
          )}

          {/* Trash action - available for non-story, non-equipped items */}
          {canTrash && (
            <Button onClick={() => handleTrashItem(item)} variant="danger">
              Trash
            </Button>
          )}

          <Button onClick={closeModal} variant="secondary">
            Close
          </Button>
        </div>
      </>
    );
  };

  const renderSwapOptions = (slot: EquipmentSlot) => {
    const availableItems = ItemManager.getItemsBySlot(player, slot);
    const currentEquipped = player.equippedItems[slot];

    return (
      <>
        <h2 className="text-2xl font-bold text-pixel-text mb-4">
          {currentEquipped ? `Swap ${SLOT_NAMES[slot]}` : `Equip ${SLOT_NAMES[slot]}`}
        </h2>

        {currentEquipped && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-pixel-text-muted mb-2">Currently Equipped:</h3>
            <div className="inline-block">
              {renderItemCard(currentEquipped, true, () => setModal({ item: currentEquipped, slot, showSwapOptions: false }))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-bold text-pixel-text-muted mb-2">Available Items:</h3>
        {availableItems.length > 0 ? (
          <div className="grid grid-cols-5 gap-4 mb-4">
            {availableItems.map((item) => (
              <div key={item.id}>
                {renderItemCard(item, false, () => setModal({ item, slot, showSwapOptions: false }))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-pixel-text-muted mb-4">No items available for this slot.</p>
        )}

        <div className="flex gap-2">
          {currentEquipped && (
            <Button onClick={() => handleUnequip(slot)} variant="secondary">
              Unequip Current
            </Button>
          )}
          <Button onClick={closeModal} variant="secondary">
            Cancel
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Inventory</h1>
          <Button onClick={() => navigateTo('idle')}>Back to Menu</Button>
        </div>

        {/* Equipment Section */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-pixel-text mb-4">Equipment</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {slots.map((slot) => {
              const item = player.equippedItems[slot];
              return (
                <div key={slot} onClick={() => handleSlotClick(slot)}>
                  {item ? (
                    renderItemCard(item, true, () => handleSlotClick(slot))
                  ) : (
                    <Card padding="sm" className="cursor-pointer hover:border-pixel-accent">
                      <div className="text-center">
                        <div className="text-3xl mb-1">{SLOT_ICONS[slot]}</div>
                        <div className="text-xs text-pixel-text-muted">{SLOT_NAMES[slot]}</div>
                        <div className="text-xs text-pixel-text-muted mt-1">Empty</div>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Passive Boosts */}
          <div className="border-t-2 border-pixel-border pt-4">
            <h3 className="text-lg font-bold text-pixel-text mb-2">Total Passive Boosts</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(passiveBoosts).map(([stat, value]) => (
                <div key={stat} className="text-sm">
                  <span className="text-pixel-text-muted">{stat}:</span>
                  <span className="text-pixel-accent font-bold ml-1">+{value}</span>
                </div>
              ))}
              {Object.keys(passiveBoosts).length === 0 && (
                <div className="col-span-5 text-sm text-pixel-text-muted">No passive boosts active</div>
              )}
            </div>
          </div>
        </Card>

        {/* Regular Inventory */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-pixel-text mb-2">
            Inventory ({player.inventory.length}/10)
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {player.inventory.map((item) => renderItemCard(item))}
            {Array.from({ length: 10 - player.inventory.length }).map((_, i) => (
              <Card key={`empty-${i}`} padding="sm" className="opacity-50">
                <div className="text-center text-pixel-text-muted text-sm">Empty</div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Story Items */}
        {player.storyItems.length > 0 && (
          <Card className="mb-6 border-4 border-yellow-600">
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Story Items</h2>
            <div className="grid grid-cols-5 gap-4">
              {player.storyItems.map((item) => renderItemCard(item))}
            </div>
          </Card>
        )}

        {/* Unified Modal */}
        {(modal.item || modal.showSwapOptions) && (
          <Card className="mt-4 border-4 border-pixel-accent">
            {modal.showSwapOptions && modal.slot ? (
              renderSwapOptions(modal.slot)
            ) : modal.item ? (
              renderItemDetails(modal.item)
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
};
