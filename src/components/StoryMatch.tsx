/**
 * Story Match Component
 * Screen for scheduled story matches - wraps PreMatchScreen with story-specific data
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { PreMatchScreen } from './PreMatchScreen';
import { ItemManager } from '../game/ItemManager';
import { StoryMatchManager } from '../game/StoryMatchManager';
import type { PreMatchConfig } from '../types/gamePhase';

interface StoryMatchProps {
  matchConfig: PreMatchConfig | null;
}

export const StoryMatch: React.FC<StoryMatchProps> = ({ matchConfig }) => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const beginMatch = useGameStore((state) => state.beginMatch);

  if (!player || !matchConfig) {
    return null;
  }

  const energyCost = StoryMatchManager.calculateMatchEnergyCost(currentStatus.energy);

  const handleStartMatch = () => {
    const config = {
      playerStats: player.stats,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: matchConfig.opponentStats,
      opponentName: matchConfig.opponentName,
      opponentTier: matchConfig.opponentTier,
      surface: matchConfig.surface || 'hard',
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: (matchConfig.matchFormat || 'best-of-1') as 'best-of-1' | 'best-of-3',
      isStoryMatch: true,
    };

    beginMatch(config, 'story');
    useMatchStore.getState().startMatch(config, (data) => {
      useGameStore.getState().onMatchComplete(data);
    });
  };

  const contextContent = matchConfig.matchDescription ? (
    <Card className="bg-pixel-card border-2 border-purple-400">
      <div className="text-sm text-pixel-text-muted">
        <p>{matchConfig.matchDescription}</p>
      </div>
    </Card>
  ) : null;

  return (
    <PreMatchScreen
      title={matchConfig.matchTitle || 'Team Match'}
      opponentName={matchConfig.opponentName}
      opponentTier={matchConfig.opponentTier}
      opponentDescription={matchConfig.opponentDescription}
      opponentStats={matchConfig.opponentStats}
      surface={matchConfig.surface || 'hard'}
      matchFormat={matchConfig.matchFormat || 'best-of-1'}
      energyCost={energyCost}
      currentEnergy={currentStatus.energy}
      contextContent={contextContent}
      onStartMatch={handleStartMatch}
      onBack={() => navigateTo('idle')}
    />
  );
};
