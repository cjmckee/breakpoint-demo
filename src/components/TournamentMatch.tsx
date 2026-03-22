/**
 * Tournament Match Component
 * Screen for scheduled tournament matches - wraps PreMatchScreen with tournament-specific data
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';
import { Card } from './ui/Card';
import { PreMatchScreen } from './PreMatchScreen';
import type { PlayerStats } from '../types/game';
import { ItemManager } from '../game/ItemManager';
import type { PreMatchConfig } from '../types/gamePhase';

interface TournamentMatchProps {
  matchConfig: PreMatchConfig | null;
}

export const TournamentMatch: React.FC<TournamentMatchProps> = ({ matchConfig }) => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const activeTournament = useGameStore((state) => state.calendar.activeTournament);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const beginMatch = useGameStore((state) => state.beginMatch);

  if (!player || !activeTournament || !matchConfig) {
    return null;
  }

  // Get tournament configuration for display purposes
  const tournament = TournamentRegistry.getTournament(activeTournament.tournamentId);
  if (!tournament) {
    return null;
  }

  const energyCost = TournamentManager.calculateMatchEnergyCost(currentStatus.energy);
  const roundNumber = activeTournament.currentRound + 1;
  const totalRounds = tournament.rounds.length;

  const getBracketColor = (bracket: 'winner' | 'loser'): string => {
    return bracket === 'winner' ? 'text-yellow-400' : 'text-gray-400';
  };

  const handleStartMatch = () => {
    const config = {
      playerStats: player.stats,
      playerName: player.name,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: matchConfig.opponentStats as PlayerStats,
      opponentName: matchConfig.opponentName,
      opponentTier: matchConfig.opponentTier,
      surface: matchConfig.surface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: matchConfig.matchFormat === 'best-of-3' ? 'best-of-3' as const : 'best-of-1' as const,
      isTournamentMatch: true,
    };

    beginMatch(config, 'tournament');
    useMatchStore.getState().startMatch(config, (data) => {
      useGameStore.getState().onMatchComplete(data);
    });
  };

  const headerContent = (
    <Card title={tournament.name} className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-pixel-text-muted mb-1">Tournament Progress</div>
          <div className="text-2xl font-bold text-pixel-text">
            Round {roundNumber} / {totalRounds}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-pixel-text-muted mb-1">Bracket</div>
          <div className={`text-2xl font-bold ${getBracketColor(activeTournament.currentBracket)}`}>
            {activeTournament.currentBracket === 'winner' ? '🎾 Main Draw' : '🎗️ Consolation'}
          </div>
        </div>
      </div>

      <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
        <div className="flex items-center justify-between">
          <span className="text-pixel-text-muted">Surface:</span>
          <span className="text-pixel-text font-bold">
            {tournament.surface.toUpperCase()}
          </span>
        </div>
      </div>
    </Card>
  );

  const contextContent = (
    <Card className="bg-pixel-card border-2 border-pixel-accent">
      <div className="text-sm text-pixel-text-muted">
        {activeTournament.currentBracket === 'winner' ? (
          <>
            <p className="mb-2">
              <strong className="text-yellow-400">Main Draw:</strong> You're still in contention for the championship!
            </p>
            <p>
              Win this match to advance to the next round. A loss will move you to the consolation bracket.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">
              <strong className={getBracketColor('loser')}>Consolation Bracket:</strong> You're playing for pride and experience.
            </p>
            <p>
              Each match is a chance to prove yourself and improve your skills.
            </p>
          </>
        )}
      </div>
    </Card>
  );

  return (
    <PreMatchScreen
      title={tournament.name}
      headerContent={headerContent}
      opponentName={matchConfig.opponentName}
      opponentTier={matchConfig.opponentTier}
      opponentDescription={matchConfig.opponentDescription}
      opponentStats={matchConfig.opponentStats as PlayerStats}
      surface={matchConfig.surface}
      matchFormat={matchConfig.matchFormat === 'best-of-3' ? 'best-of-3' : 'best-of-1'}
      energyCost={energyCost}
      currentEnergy={currentStatus.energy}
      contextContent={contextContent}
      onStartMatch={handleStartMatch}
      onBack={() => navigateTo('idle')}
    />
  );
};
