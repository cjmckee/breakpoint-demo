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

export const TournamentMatch: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const activeTournament = useGameStore((state) => state.calendar.activeTournament);
  const setScreen = useGameStore((state) => state.setScreen);
  const startMatch = useMatchStore((state) => state.startMatch);

  if (!player || !activeTournament) {
    return null;
  }

  // Get tournament configuration
  const tournament = TournamentRegistry.getTournament(activeTournament.tournamentId);
  if (!tournament) {
    return null;
  }

  // Get current round data
  const currentRoundConfig = TournamentManager.getCurrentRound(
    tournament,
    activeTournament.currentRound
  );

  if (!currentRoundConfig) {
    return null;
  }

  const opponent = currentRoundConfig.opponent;
  const energyCost = TournamentManager.calculateMatchEnergyCost(currentStatus.energy);
  const roundNumber = activeTournament.currentRound + 1;
  const totalRounds = tournament.rounds.length;

  const getBracketColor = (bracket: 'winner' | 'loser'): string => {
    return bracket === 'winner' ? 'text-yellow-400' : 'text-gray-400';
  };

  const handleStartMatch = () => {
    startMatch({
      playerStats: player.stats,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: opponent.stats as PlayerStats,
      opponentName: opponent.name,
      opponentTier: opponent.tier,
      surface: tournament.surface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: 'best-of-1',
      isTournamentMatch: true,
    });

    setScreen('match');
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
      opponentName={opponent.name}
      opponentTier={opponent.tier}
      opponentDescription={opponent.description}
      opponentStats={opponent.stats as PlayerStats}
      surface={tournament.surface}
      matchFormat="best-of-1"
      energyCost={energyCost}
      currentEnergy={currentStatus.energy}
      contextContent={contextContent}
      onStartMatch={handleStartMatch}
      onBack={() => setScreen('main-menu')}
    />
  );
};
