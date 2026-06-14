import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Item } from '../types/items';

interface ItemAcquiredModalProps {
  isOpen: boolean;
  item: Item;
  hasMore: boolean;
  onClose: () => void;
}

function itemEmoji(item: Item): string {
  if (item.type === 'equipment') {
    switch (item.equipmentSlot) {
      case 'racquet': return '🎾';
      case 'shoes': return '👟';
      case 'hat': return '🧢';
      case 'outfit': return '👕';
    }
  }
  if (item.type === 'consumable') return '⚡';
  if (item.type === 'lucky') return '⭐';
  if (item.type === 'story') return '📖';
  return '🎁';
}

export const ItemAcquiredModal: React.FC<ItemAcquiredModalProps> = ({
  isOpen,
  item,
  hasMore,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item Acquired" size="sm">
      <div className="text-center space-y-4 py-2">
        <div className="text-5xl">{itemEmoji(item)}</div>
        <p className="text-lg font-semibold text-pixel-accent">{item.name}</p>
        <p className="text-sm text-pixel-text-muted">{item.description}</p>
      </div>
      <div className="flex justify-center mt-6">
        <Button onClick={onClose} variant="primary">
          {hasMore ? 'Next' : 'Got it'}
        </Button>
      </div>
    </Modal>
  );
};
