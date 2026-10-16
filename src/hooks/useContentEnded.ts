/**
 * Whether the player has reached the end of what's written (SeasonManager.contentEnded).
 * The menu and its keyboard shortcuts both read it, so neither opens an empty season.
 */

import { useGameStore } from '../stores/gameStore';
import { SeasonManager } from '../game/SeasonManager';

export function useContentEnded(): boolean {
  return useGameStore((state) =>
    state.player
      ? SeasonManager.contentEnded(state.player.tier, state.completedStoryEvents)
      : false,
  );
}
