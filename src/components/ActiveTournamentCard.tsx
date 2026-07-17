/**
 * Active Tournament Card Component
 * Flat banner strip on the main menu — mirrors the challenges strip's shape so it
 * stays short and doesn't push the stats section down.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';

export const ActiveTournamentCard: React.FC = () => {
  const calendar = useGameStore((state) => state.calendar);
  const activeTournament = calendar.activeTournament;
  const scheduledEvents = calendar.scheduledEvents;
  const navigateToScheduledMatch = useGameStore((state) => state.navigateToScheduledMatch);

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

  const getRelativeTimeLabel = (scheduledDay: number, scheduledTimeSlot: number): string => {
    const daysUntil = scheduledDay - calendar.currentDay;
    if (daysUntil === 0) return `${getTimeSlotLabel(scheduledTimeSlot)} session`;
    if (daysUntil === 1) return `Tomorrow — ${getTimeSlotLabel(scheduledTimeSlot)}`;
    return `In ${daysUntil} days — ${getTimeSlotLabel(scheduledTimeSlot)}`;
  };

  // Show scheduled tournament card when tournament hasn't started yet
  if (!activeTournament?.isActive) {
    const ceremonyEvent = scheduledEvents.find(event => {
      if (event.eventType !== 'story') return false;
      const storyEventId = (event.metadata as Record<string, unknown>)?.storyEventId as string | undefined;
      return storyEventId && TournamentRegistry.getAllTournaments().some(
        t => t.openingCeremonyEventId === storyEventId
      );
    });

    if (!ceremonyEvent) return null;

    const storyEventId = (ceremonyEvent.metadata as Record<string, unknown>).storyEventId as string;
    const scheduledTournament = TournamentRegistry.getAllTournaments().find(
      t => t.openingCeremonyEventId === storyEventId
    );

    if (!scheduledTournament) return null;

    const daysUntil = ceremonyEvent.scheduledDay - calendar.currentDay;

    return (
      <div className="w-full flex items-center gap-3 border-4 border-yellow-400 bg-yellow-500 bg-opacity-10 px-4 py-3">
        <span className="text-2xl shrink-0">{getSurfaceEmoji(scheduledTournament.surface)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-pixel-text truncate">
            {scheduledTournament.name}
            <span className="ml-2 text-xs font-normal text-pixel-text-muted">
              {scheduledTournament.surface.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-pixel-text-muted truncate">
            {daysUntil === 0
              ? '🎾 Opening ceremony today'
              : `Starts ${getRelativeTimeLabel(ceremonyEvent.scheduledDay, ceremonyEvent.scheduledTimeSlot)}`}
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold px-2 py-1 bg-yellow-500 bg-opacity-20 border border-yellow-400 text-yellow-400">
          Upcoming
        </span>
      </div>
    );
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

  // Check if there's a scheduled tournament match ready right now
  const scheduledTournamentMatch = TournamentManager.getScheduledTournamentMatch(
    activeTournament,
    scheduledEvents,
    calendar
  );
  const isReady = scheduledTournamentMatch !== null;

  // Find next scheduled match (even if not today)
  const nextScheduledMatch = scheduledEvents.find(
    (event) =>
      event.eventType === 'tournament_match' &&
      (event.scheduledDay > calendar.currentDay ||
        (event.scheduledDay === calendar.currentDay && event.scheduledTimeSlot >= calendar.currentTimeSlot))
  );

  const bracketLabel = activeTournament.currentBracket === 'winner' ? 'Main Draw' : 'Consolation';
  const scheduleLabel = isReady
    ? 'Match ready now'
    : nextScheduledMatch
      ? getRelativeTimeLabel(nextScheduledMatch.scheduledDay, nextScheduledMatch.scheduledTimeSlot)
      : 'Awaiting schedule';

  const row = (
    <>
      <span className="text-2xl shrink-0">{getSurfaceEmoji(tournament.surface)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-pixel-text truncate">
          {tournament.name}
          <span className="ml-2 text-xs font-normal text-pixel-text-muted">
            Round {roundNumber}/{totalRounds} · {bracketLabel}
          </span>
        </div>
        <div className="text-xs text-pixel-text-muted truncate">
          Next: {opponent.name} · {scheduleLabel}
        </div>
      </div>
      {isReady ? (
        <span className="shrink-0 text-xs font-bold px-2 py-1 bg-green-500 bg-opacity-20 border border-green-500 text-green-500">
          🎾 Play ▸
        </span>
      ) : (
        <span className="shrink-0 text-xs font-bold px-2 py-1 bg-yellow-500 bg-opacity-20 border border-yellow-400 text-yellow-400">
          Active
        </span>
      )}
    </>
  );

  return (
    <div className="border-4 border-yellow-400 bg-yellow-500 bg-opacity-10">
      {isReady ? (
        <button
          onClick={() => navigateToScheduledMatch('tournament')}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-yellow-500 hover:bg-opacity-20 transition-colors"
        >
          {row}
        </button>
      ) : (
        <div className="w-full flex items-center gap-3 px-4 py-3">{row}</div>
      )}
      {/* Slim progress bar keeps a sense of tournament progress without adding height */}
      <div className="h-1 w-full bg-pixel-border">
        <div
          className="h-full bg-yellow-400"
          style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
        />
      </div>
    </div>
  );
};
