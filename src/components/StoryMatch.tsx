/**
 * Story Match Component
 * Screen for scheduled story matches - wraps PreMatchScreen with story-specific data
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { StoryMatchManager } from '../game/StoryMatchManager';
import { Card } from './ui/Card';
import { PreMatchScreen } from './PreMatchScreen';
import { ItemManager } from '../game/ItemManager';

export const StoryMatch: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const setScreen = useGameStore((state) => state.setScreen);
  const getScheduledStoryMatch = useGameStore((state) => state.getScheduledStoryMatch);
  const startMatch = useMatchStore((state) => state.startMatch);

  const scheduledStoryMatch = getScheduledStoryMatch();
  const storyMatchMetadata = scheduledStoryMatch
    ? StoryMatchManager.getStoryMatchMetadata(scheduledStoryMatch)
    : null;

  if (!player || !storyMatchMetadata) {
    return null;
  }

  const energyCost = StoryMatchManager.calculateMatchEnergyCost(currentStatus.energy);

  const handleStartMatch = () => {
    startMatch({
      playerStats: player.stats,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: storyMatchMetadata.opponentStats,
      opponentName: storyMatchMetadata.opponentName,
      opponentTier: storyMatchMetadata.opponentTier,
      surface: storyMatchMetadata.surface || 'hard',
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: storyMatchMetadata.matchFormat || 'best-of-1',
      isStoryMatch: true,
    });

    setScreen('match');
  };

  const contextContent = storyMatchMetadata.matchDescription ? (
    <Card className="bg-pixel-card border-2 border-purple-400">
      <div className="text-sm text-pixel-text-muted">
        <p>{storyMatchMetadata.matchDescription}</p>
      </div>
    </Card>
  ) : null;

  return (
    <PreMatchScreen
      title={storyMatchMetadata.matchTitle || 'Team Match'}
      opponentName={storyMatchMetadata.opponentName}
      opponentTier={storyMatchMetadata.opponentTier}
      opponentDescription={storyMatchMetadata.opponentDescription}
      opponentStats={storyMatchMetadata.opponentStats}
      surface={storyMatchMetadata.surface || 'hard'}
      matchFormat={storyMatchMetadata.matchFormat || 'best-of-1'}
      energyCost={energyCost}
      currentEnergy={currentStatus.energy}
      contextContent={contextContent}
      onStartMatch={handleStartMatch}
      onBack={() => setScreen('main-menu')}
    />
  );
};
