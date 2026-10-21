/** An item's pixel icon, in the menu's palette. */

import React from 'react';
import type { Item } from '../../types/items';
import { ICON_PALETTE } from '../../data/pixelIcons';
import { PixelIcon } from '../ui/PixelIcon';
import { getItemIcon } from './itemHelpers';

export function ItemIcon({
  item,
  scale = 2,
  className,
}: {
  item: Item;
  /** 16px per grid at 1; 2 for a card, 3 for a modal's lead icon. */
  scale?: number;
  className?: string;
}): React.JSX.Element {
  return (
    <PixelIcon
      grid={getItemIcon(item)}
      palette={ICON_PALETTE}
      scale={scale}
      className={className}
    />
  );
}
