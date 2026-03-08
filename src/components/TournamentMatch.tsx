/**
 * Tournament Match Component
 * Screen for scheduled tournament matches
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PlayerStats } from '../types/game';

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

  // Calculate energy cost (variable based on remaining energy)
  const energyCost = TournamentManager.calculateMatchEnergyCost(currentStatus.energy);
  const canAfford = currentStatus.energy >= energyCost;

  const handleStartMatch = () => {
    // Fire off match simulation (don't await - it runs until match completes)
    startMatch({
      playerStats: player.stats,
      playerAbilities: player.abilities,
      opponentStats: opponent.stats as PlayerStats,
      opponentName: opponent.name,
      opponentTier: opponent.tier,
      surface: tournament.surface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      keyMomentsPerMatch: 8,
      matchFormat: 'best-of-1',
      isTournamentMatch: true, // Mark this as a tournament match
    });

    // Navigate to match screen
    setScreen('match');
  };

  const getTierLabel = (tier: number): string => {
    switch (tier) {
      case 1: return 'Club';
      case 2: return 'Regional';
      case 3: return 'Professional';
      case 4: return 'Elite';
      default: return 'Unknown';
    }
  };

  const getTierColor = (tier: number): string => {
    switch (tier) {
      case 1: return 'border-green-500';
      case 2: return 'border-yellow-500';
      case 3: return 'border-orange-500';
      case 4: return 'border-red-500';
      default: return 'border-pixel-border';
    }
  };

  const getSurfaceEmoji = (surface: string): string => {
    switch (surface) {
      case 'hard': return '🏟️';
      case 'clay': return '🧱';
      case 'grass': return '🌱';
      case 'carpet': return '📋';
      default: return '🎾';
    }
  };

  const getBracketColor = (bracket: 'winner' | 'loser'): string => {
    return bracket === 'winner' ? 'text-yellow-400' : 'text-gray-400';
  };

  const roundNumber = activeTournament.currentRound + 1; // Display as 1-based
  const totalRounds = tournament.rounds.length;

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => setScreen('main-menu')}>
            ← Back to Menu
          </Button>
        </div>

        {/* Tournament Header */}
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
                {activeTournament.currentBracket === 'winner' ? '🏆 Winner' : '🎗️ Consolation'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
            <div className="flex items-center justify-between">
              <span className="text-pixel-text-muted">Surface:</span>
              <span className="text-pixel-text font-bold">
                {getSurfaceEmoji(tournament.surface)} {tournament.surface.toUpperCase()}
              </span>
            </div>
          </div>
        </Card>

        {/* Opponent Card */}
        <Card title="Your Opponent" className="mb-6">
          <div className={`border-4 ${getTierColor(opponent.tier)} p-4 bg-pixel-card`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold text-pixel-text mb-1">
                  {opponent.name}
                </h3>
                <span className="text-sm px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                  {getTierLabel(opponent.tier)}
                </span>
              </div>
              <span className="text-4xl">🎾</span>
            </div>

            <p className="text-pixel-text-muted mb-4 text-sm">
              {opponent.description}
            </p>

            {/* Opponent Stats Preview */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Technical</div>
                <div className="text-lg font-bold text-green-500">
                  {opponent.stats.technical.forehand}
                </div>
              </div>
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Physical</div>
                <div className="text-lg font-bold text-blue-500">
                  {opponent.stats.physical.speed}
                </div>
              </div>
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Mental</div>
                <div className="text-lg font-bold text-purple-500">
                  {opponent.stats.mental.focus}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Match Info */}
        <Card title="Match Details" className="mb-6">
          <div className="space-y-3">
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Energy Cost:</span>
                <span className={`text-xl font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                  {energyCost} Energy
                </span>
              </div>
              <div className="mt-1 text-xs text-pixel-text-muted">
                You have {currentStatus.energy} / 100 energy available
              </div>
            </div>

            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Match Format:</span>
                <span className="text-pixel-text font-bold">Best of 1 Set</span>
              </div>
            </div>

            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Key Moments:</span>
                <span className="text-pixel-text font-bold">Interactive</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Start Match Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleStartMatch}
            disabled={!canAfford}
          >
            {!canAfford ? (
              <>Not Enough Energy (Need {energyCost})</>
            ) : (
              <>🎾 Start Match vs {opponent.name}</>
            )}
          </Button>
        </div>

        {/* Tournament Context */}
        <Card className="bg-pixel-card border-2 border-pixel-accent">
          <div className="text-sm text-pixel-text-muted">
            {activeTournament.currentBracket === 'winner' ? (
              <>
                <p className="mb-2">
                  <strong className="text-yellow-400">Winner's Bracket:</strong> You're still in contention for the championship!
                </p>
                <p>
                  Win this match to advance to the next round. A loss will move you to the consolation bracket.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  <strong className="text-gray-400">Consolation Bracket:</strong> You're playing for pride and experience.
                </p>
                <p>
                  Each match is a chance to prove yourself and improve your skills.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
