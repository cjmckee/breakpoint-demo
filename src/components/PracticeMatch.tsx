/**
 * Practice Match Component
 * Screen for practice matches - wraps PreMatchScreen with opponent info
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { PreMatchScreen } from './PreMatchScreen';
import { ItemManager } from '../game/ItemManager';
import { derivePlayStyle } from '../core/PlayerProfile';
import type { PreMatchConfig } from '../types/gamePhase';
import { DEFAULT_MATCH_ENERGY_COST } from '../config/matchRewards';
import { calculateOverallRating, getTierLabel } from '../utils/playerStats';

export const PracticeMatch: React.FC<{ matchConfig: PreMatchConfig | null }> = ({ matchConfig }) => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const beginMatch = useGameStore((state) => state.beginMatch);

  if (!player || !matchConfig) {
    return null;
  }

  const playerOverallRating = calculateOverallRating(player.stats);
  const playerPlayStyle = derivePlayStyle(player.stats);

  const energyCost = DEFAULT_MATCH_ENERGY_COST;

  const handleStartMatch = () => {
    const config = {
      playerStats: player.stats,
      playerName: player.name,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: matchConfig.opponentStats,
      opponentName: matchConfig.opponentName,
      opponentTier: matchConfig.opponentTier,
      surface: matchConfig.surface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: matchConfig.matchFormat,
    };

    beginMatch(config, 'regular');
    useMatchStore.getState().startMatch(config, (data) => {
      useGameStore.getState().onMatchComplete(data);
    });
  };

  const contextContent = (
    <Card className="bg-pixel-card border-2 border-pixel-border">
      <div className="text-sm text-pixel-text-muted">
        <p className="mb-2">
          <strong className="text-pixel-text">Practice Match</strong>
        </p>
        <p>
          Test your skills against a {getTierLabel(matchConfig.opponentTier).toLowerCase()} tier opponent.
          Wins here improve your performance against similar opponents.
        </p>
      </div>
    </Card>
  );

  return (
    <PreMatchScreen
      title="Practice Match"
      subtitle={`vs ${matchConfig.opponentName}`}
      playerName={player.name}
      playerTier={player.tier}
      playerOverallRating={playerOverallRating}
      playerStats={player.stats}
      playerPlayStyle={playerPlayStyle}
      opponentName={matchConfig.opponentName}
      opponentTier={matchConfig.opponentTier}
      opponentStats={matchConfig.opponentStats}
      opponentPlayStyle={matchConfig.opponentPlayStyle}
      surface={matchConfig.surface}
      matchFormat={matchConfig.matchFormat}
      energyCost={energyCost}
      currentEnergy={currentStatus.energy}
      contextContent={contextContent}
      onStartMatch={handleStartMatch}
      onBack={() => navigateTo('match_setup')}
    />
  );
};
