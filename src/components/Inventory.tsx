/**
 * Inventory Component
 * Displays and manages player inventory, equipped items, and story items
 */

import React, { useState, JSX } from 'react';
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

export const Inventory: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const setScreen = useGameStore((state) => state.setScreen);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const useConsumable = useGameStore((state) => state.useConsumable);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);

  if (!player) return null;

  const passiveBoosts = ItemManager.getTotalPassiveBoosts(player);
  const slots: EquipmentSlot[] = ['racquet', 'shoes', 'outfit', 'hat'];

  const handleEquipClick = (item: Item) => {
    if (item.equipmentSlot) {
      equipItem(item.id, item.equipmentSlot);
      setSelectedItem(null);
    }
  };

  const handleUnequipClick = (slot: EquipmentSlot) => {
    unequipItem(slot);
  };

  const handleUseConsumable = (item: Item) => {
    if (confirm(`Use ${item.name}?`)) {
      useConsumable(item.id);
      setSelectedItem(null);
    }
  };

  const handleSlotClick = (slot: EquipmentSlot) => {
    setSelectedSlot(slot === selectedSlot ? null : slot);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item === selectedItem ? null : item);
  }

  const clearSelections = () => {
    setSelectedItem(null);
    setSelectedSlot(null);
  };

  const renderItemCard = (item: Item, isEquipped = false) => {
    const typeColors: Record<string, string> = {
      equipment: 'bg-blue-600',
      consumable: 'bg-green-600',
      lucky: 'bg-purple-600',
      story: 'bg-yellow-600',
    };

    return (
      <div key={item.id} onClick={() => handleItemClick(item)}>
        <Card
          padding="sm"
          className={`cursor-pointer hover:border-pixel-accent transition-colors ${
            selectedItem?.id === item.id ? 'border-pixel-accent border-4' : ''
          }`}
        >
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

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Inventory</h1>
          <Button onClick={() => setScreen('main-menu')}>Back to Menu</Button>
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
                    renderItemCard(item, true)
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
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Story Items ⭐</h2>
            <div className="grid grid-cols-5 gap-4">
              {player.storyItems.map((item) => renderItemCard(item))}
            </div>
          </Card>
        )}

        {/* Item Detail Panel */}
        {selectedItem && (
          <Card className="border-4 border-pixel-accent">
            <h2 className="text-2xl font-bold text-pixel-text mb-2">{selectedItem.name}</h2>
            <p className="text-sm text-pixel-text-muted mb-4">{selectedItem.description}</p>

            {/* Modifiers */}
            {selectedItem.modifiers?.statBoosts && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-pixel-text mb-2">Stat Boosts</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedItem.modifiers.statBoosts).map(([stat, value]) => (
                    <div key={stat} className="text-sm">
                      <span className="text-pixel-text">{stat}:</span>
                      <span className="text-pixel-accent font-bold ml-1">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consumable Effect */}
            {selectedItem.consumableEffect && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-pixel-text mb-2">Effect</h3>
                {selectedItem.consumableEffect.instantEffects && (
                  <div className="text-sm text-pixel-text-muted">
                    {selectedItem.consumableEffect.instantEffects.energyChange && (
                      <div>Energy: +{selectedItem.consumableEffect.instantEffects.energyChange}</div>
                    )}
                    {selectedItem.consumableEffect.instantEffects.moodChange && (
                      <div>Mood: +{selectedItem.consumableEffect.instantEffects.moodChange}</div>
                    )}
                  </div>
                )}
                {selectedItem.consumableEffect.nextActivityBuffs && (
                  <div className="text-sm text-pixel-accent">
                    Buffs for next activity
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {selectedItem.type === 'equipment' && selectedItem.equipmentSlot && (
                <Button onClick={() => handleEquipClick(selectedItem)} variant="primary">
                  Equip
                </Button>
              )}
              {selectedItem.type === 'consumable' && (
                <Button onClick={() => handleUseConsumable(selectedItem)} variant="success">
                  Use
                </Button>
              )}
              <Button onClick={() => clearSelections()} variant="secondary">
                Close
              </Button>
            </div>
          </Card>
        )}

        {/* Swap Equipment Panel */}
        {selectedSlot && (
          <Card className="mt-4 border-4 border-blue-600">
            <h2 className="text-2xl font-bold text-pixel-text mb-4">
              Swap {SLOT_NAMES[selectedSlot]}
            </h2>
            <div className="grid grid-cols-5 gap-4 mb-4">
              {ItemManager.getItemsBySlot(player, selectedSlot).map((item) => (
                <div key={item.id} onClick={() => handleEquipClick(item)}>
                  {renderItemCard(item)}
                </div>
              ))}
            </div>
            {player.equippedItems[selectedSlot] && (
              <Button onClick={() => handleUnequipClick(selectedSlot)} variant="secondary">
                Unequip Current
              </Button>
            )}
            <Button onClick={() => clearSelections()} variant="secondary" className="ml-2">
              Cancel
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
