/**
 * Screen for a minigame played outside training.
 *
 * Deliberately thin: minigames own their own arena, controls, and footer through
 * MinigameShell, so this resolves the requested game from the registry, renders
 * it, and hands the score back to the store. Where the score goes is the
 * phase's continuation to decide, not this component's.
 *
 * Training does not route through here — it already has a screen and mounts the
 * same component inline.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { MINIGAMES } from '../minigames/registry';
import { EffectAggregator } from '../core/EffectAggregator';
import { EffectKey } from '../types/game';
import { StatusBar } from './StatusBar';

export const MinigameHost: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const player = useGameStore((state) => state.player);
  const completeMinigame = useGameStore((state) => state.completeMinigame);

  if (gamePhase.type !== 'minigame_active' || !player) return null;

  const Minigame = MINIGAMES[gamePhase.request.minigame];

  // The window bonus is a property of the player, not of why they are playing,
  // so an item that widens timing windows widens them here too.
  const { effects } = EffectAggregator.getActiveEffects(player);
  const windowBonus = EffectAggregator.getEffect(effects, EffectKey.MINIGAME_WINDOW_BONUS);

  return (
    <div className="min-h-screen bg-pixel-bg">
      {/* No back control: the player already committed to this by choosing the
          option that led here, and leaving would strand the event mid-resolution. */}
      <StatusBar />

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Minigame onComplete={completeMinigame} windowBonus={windowBonus} />
      </div>
    </div>
  );
};
