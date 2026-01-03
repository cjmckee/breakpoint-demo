/**
 * Active Tournament Card Component
 * Shows tournament progress and next match info on the main menu
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';
import { ScheduledEventManager } from '../game/ScheduledEventManager';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const ActiveTournamentCard: React.FC = () => {
  const calendar = useGameStore((state) => state.calendar);
  const activeTournament = calendar.activeTournament;
  const scheduledEvents = calendar.scheduledEvents;
  const setScreen = useGameStore((state) => state.setScreen);

  if (!activeTournament || !activeTournament.isActive) {
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
  const roundNumber = activeTournament.currentRound + 1; // Display as 1-based
  const totalRounds = tournament.rounds.length;

  // Check if there's a scheduled tournament match
  const scheduledTournamentMatch = TournamentManager.getScheduledTournamentMatch(
    activeTournament,
    scheduledEvents,
    calendar
  );

  // Find next scheduled match (even if not today)
  const nextScheduledMatch = scheduledEvents.find(
    (event) =>
      event.eventType === 'tournament_match' &&
      (event.scheduledDay > calendar.currentDay ||
        (event.scheduledDay === calendar.currentDay && event.scheduledTimeSlot >= calendar.currentTimeSlot))
  );

  const getBracketColor = (bracket: 'winner' | 'loser'): string => {
    return bracket === 'winner' ? 'text-yellow-400' : 'text-gray-400';
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

  const getTimeSlotLabel = (slot: number): string => {
    switch (slot) {
      case 0: return 'Morning';
      case 1: return 'Afternoon';
      case 2: return 'Evening';
      default: return 'Unknown';
    }
  };

  return (
    <Card title="Active Tournament" className="border-4 border-yellow-400 bg-yellow-500 bg-opacity-10">
      <div className="space-y-3">
        {/* Tournament Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-pixel-text mb-1">
              {tournament.name}
            </div>
            <div className="text-sm text-pixel-text-muted">
              {getSurfaceEmoji(tournament.surface)} {tournament.surface.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getBracketColor(activeTournament.currentBracket)}`}>
              {activeTournament.currentBracket === 'winner' ? '🏆 Winner' : '🎗️ Consolation'}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-pixel-text-muted text-sm">Tournament Progress:</span>
            <span className="text-pixel-text font-bold">
              Round {roundNumber} / {totalRounds}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-pixel-border h-3">
            <div
              className="h-full bg-yellow-400"
              style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
            />
          </div>
        </div>

        {/* Next Opponent */}
        <div className="p-3 bg-pixel-card border-2 border-pixel-accent">
          <div className="text-xs text-pixel-text-muted mb-1">Next Opponent:</div>
          <div className="text-lg font-bold text-pixel-text">
            {opponent.name}
          </div>
          <div className="text-xs text-pixel-text-muted">
            {opponent.description}
          </div>
        </div>

        {/* Match Record */}
        {activeTournament.matchResults.length > 0 && (
          <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
            <div className="text-xs text-pixel-text-muted mb-2">Match History:</div>
            <div className="flex flex-wrap gap-2">
              {activeTournament.matchResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-2 py-1 border-2 font-bold ${
                    result.result === 'win'
                      ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-500'
                      : 'bg-red-500 bg-opacity-20 border-red-500 text-red-500'
                  }`}
                >
                  R{result.roundNumber + 1}: {result.result.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Match Info */}
        {nextScheduledMatch && (
          <div className="p-3 bg-blue-500 bg-opacity-10 border-2 border-blue-400">
            <div className="text-xs text-blue-400 font-bold mb-1">
              {scheduledTournamentMatch ? '⚡ Match Ready Now!' : '📅 Match Scheduled'}
            </div>
            <div className="text-sm text-pixel-text">
              {scheduledTournamentMatch ? (
                <>Your tournament match is scheduled for this time slot!</>
              ) : (
                <>
                  Day {nextScheduledMatch.scheduledDay}, {getTimeSlotLabel(nextScheduledMatch.scheduledTimeSlot)}
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {scheduledTournamentMatch ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => setScreen('tournament-match')}
          >
            🎾 Play Tournament Match
          </Button>
        ) : (
          <div className="text-center text-sm text-pixel-text-muted py-2">
            {nextScheduledMatch
              ? 'Advance time to play your next match'
              : 'Waiting for match to be scheduled...'}
          </div>
        )}
      </div>
    </Card>
  );
};
