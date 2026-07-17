/**
 * ItemDetailModal — full detail view for a single item.
 *
 * For unequipped equipment it shows a side-by-side comparison against whatever
 * is currently equipped in the same slot, so the player can make an informed
 * equip decision. Other item types just show their effects and actions.
 */

import React from 'react';
import type { Item } from '../../types/items';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ItemEffects } from './ItemEffects';
import { StatDeltaList } from './StatDeltaList';
import { getItemIcon, SLOT_NAMES } from './itemHelpers';

interface ItemDetailModalProps {
  item: Item | null;
  /** Item equipped in the same slot (for comparison). Null if slot empty / N/A. */
  equippedInSlot: Item | null;
  isEquipped: boolean;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onUnequip: (item: Item) => void;
  onUseConsumable: (item: Item) => void;
  onTrash: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  equippedInSlot,
  isEquipped,
  onClose,
  onEquip,
  onUnequip,
  onUseConsumable,
  onTrash,
}) => {
  if (!item) return null;

  const isEquipment = item.type === 'equipment';
  const canTrash = item.type !== 'story' && !isEquipped;
  // Show comparison only when equipping *would* change the loadout.
  const showComparison = isEquipment && !isEquipped;

  return (
    <Modal isOpen={item !== null} onClose={onClose} size="md" title={item.name}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-4xl">{getItemIcon(item)}</span>
        <div>
          {isEquipped && <div className="text-xs text-pixel-accent font-bold mb-1">EQUIPPED</div>}
          <p className="text-sm text-pixel-text-muted">{item.description}</p>
        </div>
      </div>

      {showComparison ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-pixel-card border-2 border-pixel-border p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-pixel-text-muted mb-2">
              This Item
            </div>
            <ItemEffects item={item} compact />
          </div>
          <div className="bg-pixel-card border-2 border-pixel-accent/60 p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-pixel-text-muted mb-2">
              vs. {equippedInSlot ? equippedInSlot.name : `Empty ${SLOT_NAMES[item.equipmentSlot!]}`}
            </div>
            <StatDeltaList current={equippedInSlot} candidate={item} variant="full" />
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <ItemEffects item={item} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {isEquipment && item.equipmentSlot && !isEquipped && (
          <Button onClick={() => onEquip(item)} variant="primary">
            {equippedInSlot ? 'Equip (Swap)' : 'Equip'}
          </Button>
        )}
        {isEquipment && item.equipmentSlot && isEquipped && (
          <Button onClick={() => onUnequip(item)} variant="secondary">
            Unequip
          </Button>
        )}
        {item.type === 'consumable' && (
          <Button onClick={() => onUseConsumable(item)} variant="success">
            Use
          </Button>
        )}
        {canTrash && (
          <Button onClick={() => onTrash(item)} variant="danger">
            Trash
          </Button>
        )}
      </div>
    </Modal>
  );
};
