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
import type { PlayerStats, PlayStyle } from '../types';

interface PracticeMatchProps {
  matchConfig: PreMatchConfig | null;
}

function calculateOverallRating(stats: PlayerStats): number {
  const coreAvg = (stats.core.serve + stats.core.forehand + stats.core.backhand + stats.core.return + stats.core.slice) / 5;
  const technicalAvg = (stats.technical.volley + stats.technical.overhead + stats.technical.dropShot + stats.technical.spin + stats.technical.placement) / 5;
  const physicalAvg = (stats.physical.speed + stats.physical.stamina + stats.physical.strength + stats.physical.agility + stats.physical.recovery) / 5;
  const mentalAvg = (stats.mental.focus + stats.mental.anticipation + stats.mental.shotVariety + stats.mental.offensive + stats.mental.defensive) / 5;

  return Math.round(
    coreAvg * 0.45 +
    technicalAvg * 0.15 +
    physicalAvg * 0.25 +
    mentalAvg * 0.15
  );
}

export const PracticeMatch: React.FC<PracticeMatchProps> = ({ matchConfig }) => {
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

  const getTierName = (tier: number): string => {
    switch (tier) {
      case 1: return 'Club';
      case 2: return 'Regional';
      case 3: return 'Professional';
      case 4: return 'Champion';
      default: return 'Unknown';
    }
  };

  const contextContent = (
    <Card className="bg-pixel-card border-2 border-pixel-border">
      <div className="text-sm text-pixel-text-muted">
        <p className="mb-2">
          <strong className="text-pixel-text">Practice Match</strong>
        </p>
        <p>
          Test your skills against a {getTierName(matchConfig.opponentTier).toLowerCase()} tier opponent.
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
