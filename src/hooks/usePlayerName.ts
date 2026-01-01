/**
 * Custom hook to get the current player's name
 */

import { useGameStore } from '../stores/gameStore';

/**
 * Returns the current player's name from the game store
 * @returns Player name or undefined if no player exists
 */
export function usePlayerName(): string | undefined {
  return useGameStore((state) => state.player?.name);
}
