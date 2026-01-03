/**
 * Tournament List Component
 * Shows available tournaments player can enter
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentConfig } from '../types/tournaments';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const TournamentList: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const calendar = useGameStore((state) => state.calendar);
  const completedStoryEvents = useGameStore((state) => state.completedStoryEvents);
  const setScreen = useGameStore((state) => state.setScreen);
  const startTournament = useGameStore((state) => state.startTournament);
  const cancelTournament = useGameStore((state) => state.cancelTournament);
  const activeTournament = calendar.activeTournament;

  if (!player) {
    return null;
  }

  // Get all tournaments
  const allTournaments = TournamentRegistry.getAllTournaments();

  // Check eligibility for each tournament
  const eligibleTournaments = TournamentRegistry.getEligibleTournaments(
    player,
    {
      completedStoryEvents,
      calendar: {
        activeTournament,
        completedTournaments: calendar.completedTournaments,
      },
    }
  );

  const handleEnterTournament = (tournamentId: string) => {
    startTournament(tournamentId);
    setScreen('main-menu');
  };

  const getSurfaceColor = (surface: string): string => {
    switch (surface) {
      case 'hard':
        return 'text-blue-400 border-blue-400';
      case 'clay':
        return 'text-orange-400 border-orange-400';
      case 'grass':
        return 'text-green-400 border-green-400';
      case 'carpet':
        return 'text-purple-400 border-purple-400';
      default:
        return 'text-pixel-text border-pixel-border';
    }
  };

  const getSurfaceEmoji = (surface: string): string => {
    switch (surface) {
      case 'hard':
        return '🏟️';
      case 'clay':
        return '🟤';
      case 'grass':
        return '🌱';
      case 'carpet':
        return '🟣';
      default:
        return '🎾';
    }
  };

  const isEligible = (tournament: TournamentConfig): boolean => {
    return eligibleTournaments.some((t) => t.id === tournament.id);
  };

  const getTournamentCompletion = (tournamentId: string) => {
    return calendar.completedTournaments.find(
      (completion) => completion.tournamentId === tournamentId
    );
  };

  const getIneligibilityReason = (tournament: TournamentConfig): string | null => {
    if (!tournament.minPlayerTier && !tournament.minMatchesPlayed && !tournament.requiredEvents?.length) {
      return null;
    }

    const reasons: string[] = [];

    if (tournament.minPlayerTier && player.tier < tournament.minPlayerTier) {
      reasons.push(`Tier ${tournament.minPlayerTier}+ required`);
    }

    if (tournament.minMatchesPlayed && (player.matchesPlayed || 0) < tournament.minMatchesPlayed) {
      reasons.push(`${tournament.minMatchesPlayed} matches required`);
    }

    if (tournament.requiredEvents?.length) {
      const completedEvents = useGameStore.getState().completedStoryEvents;
      const missingEvents = tournament.requiredEvents.filter(
        (eventId) => !completedEvents.includes(eventId)
      );
      if (missingEvents.length > 0) {
        reasons.push('Complete prerequisite events');
      }
    }

    return reasons.length > 0 ? reasons.join(', ') : null;
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => setScreen('main-menu')}>
            ← Back to Menu
          </Button>
        </div>

        {activeTournament && activeTournament.isActive && (
          <Card title="Active Tournament" className="mb-6 border-4 border-yellow-400">
            <p className="text-pixel-text text-lg mb-2">
              You are currently competing in <span className="font-bold">{activeTournament.tournamentName}</span>
            </p>
            <p className="text-pixel-text-muted mb-4">
              Return to the main menu to continue your tournament matches.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setScreen('main-menu')} fullWidth>
                Return to Menu
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to forfeit ${activeTournament.tournamentName}? All progress will be lost.`)) {
                    cancelTournament();
                  }
                }}
                fullWidth
              >
                Cancel Tournament
              </Button>
            </div>
          </Card>
        )}

        <Card title="Available Tournaments" className="mb-6">
          <p className="text-pixel-text-muted mb-4">
            Enter tournaments to compete against multiple opponents and build your reputation.
            Tournaments require energy and commitment - make sure you're ready!
          </p>

          {allTournaments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-pixel-text-muted text-lg">
                No tournaments available at this time.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTournaments.map((tournament) => {
              const eligible = isEligible(tournament);
              const ineligibilityReason = !eligible ? getIneligibilityReason(tournament) : null;
              const isInActiveTournament = activeTournament?.tournamentId === tournament.id;
              const completion = getTournamentCompletion(tournament.id);

              return (
                <div
                  key={tournament.id}
                  className={`border-4 ${getSurfaceColor(tournament.surface)} p-4 bg-pixel-card ${
                    !eligible && !completion ? 'opacity-60' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-pixel-text">
                          {tournament.name}
                        </h3>
                        {completion && completion.won && (
                          <span className="text-yellow-400 text-xl" title="Champion">
                            👑
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block px-2 py-1 text-sm font-bold border-2 ${getSurfaceColor(
                          tournament.surface
                        )}`}
                      >
                        {getSurfaceEmoji(tournament.surface)} {tournament.surface.toUpperCase()}
                      </span>
                      {completion && (
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-bold border-2 ${
                              completion.won
                                ? 'text-yellow-400 border-yellow-400 bg-yellow-400/10'
                                : 'text-gray-400 border-gray-400 bg-gray-400/10'
                            }`}
                          >
                            {completion.won ? '✓ CHAMPION' : '✗ COMPLETED'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-2xl">🏆</span>
                  </div>

                  {/* Description */}
                  <p className="text-pixel-text-muted mb-3 text-sm">
                    {tournament.description}
                  </p>

                  {/* Tournament Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-pixel-text-muted">Rounds:</span>
                      <span className="font-bold text-pixel-text">{tournament.rounds.length}</span>
                    </div>
                    {tournament.minPlayerTier && (
                      <div className="flex justify-between text-sm">
                        <span className="text-pixel-text-muted">Min Tier:</span>
                        <span className="font-bold text-pixel-text">Tier {tournament.minPlayerTier}</span>
                      </div>
                    )}
                    {tournament.minMatchesPlayed && (
                      <div className="flex justify-between text-sm">
                        <span className="text-pixel-text-muted">Min Matches:</span>
                        <span className="font-bold text-pixel-text">{tournament.minMatchesPlayed}</span>
                      </div>
                    )}
                  </div>

                  {/* Opponents Preview */}
                  <div className="mb-4 p-2 bg-pixel-bg border-2 border-pixel-border">
                    <div className="text-xs text-pixel-text-muted mb-1">Opponents:</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {tournament.rounds.map((round, idx) => (
                        <span key={idx} className="text-pixel-text font-bold">
                          R{idx + 1}: {round.opponent.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ineligibility Reason */}
                  {!eligible && ineligibilityReason && (
                    <div className="mb-3 p-2 bg-red-900/20 border-2 border-red-400">
                      <p className="text-red-400 text-xs font-bold">{ineligibilityReason}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleEnterTournament(tournament.id)}
                    disabled={!eligible || isInActiveTournament || !!completion}
                  >
                    {completion
                      ? completion.won
                        ? 'Champion'
                        : 'Completed'
                      : isInActiveTournament
                      ? 'Already Entered'
                      : !eligible
                      ? 'Not Eligible'
                      : 'Enter Tournament'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
