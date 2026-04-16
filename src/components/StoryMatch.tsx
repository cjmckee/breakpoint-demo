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
import { derivePlayStyle } from '../core/PlayerProfile';
import type { PreMatchConfig } from '../types/gamePhase';
import type { PlayerStats, PlayStyle } from '../types';
import { calculateOverallRating } from '../utils/playerStats';

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

  const playerOverallRating = calculateOverallRating(player.stats);
  const playerPlayStyle = derivePlayStyle(player.stats);

  const energyCost = StoryMatchManager.calculateMatchEnergyCost(currentStatus.energy);

  const handleStartMatch = () => {
    const config = {
      playerStats: player.stats,
      playerName: player.name,
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
      playerName={player.name}
      playerTier={player.tier}
      playerOverallRating={playerOverallRating}
      playerStats={player.stats}
      playerPlayStyle={playerPlayStyle}
      opponentName={matchConfig.opponentName}
      opponentTier={matchConfig.opponentTier}
      opponentDescription={matchConfig.opponentDescription}
      opponentStats={matchConfig.opponentStats}
      opponentPlayStyle={matchConfig.opponentPlayStyle}
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
