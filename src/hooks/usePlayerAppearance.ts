/**
 * The player's look as drawn: the creator's appearance with equipped gear on top.
 */

import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Appearance } from '../types/appearance';
import { DEFAULT_APPEARANCE, appearanceWithGear } from '../core/spriteComposer';

export function usePlayerAppearance(): Appearance {
  const appearance = useGameStore((state) => state.player?.appearance);
  const equippedItems = useGameStore((state) => state.player?.equippedItems);
  return useMemo(
    () =>
      appearanceWithGear(
        appearance ?? DEFAULT_APPEARANCE,
        equippedItems ? Object.values(equippedItems) : [],
      ),
    [appearance, equippedItems],
  );
}
