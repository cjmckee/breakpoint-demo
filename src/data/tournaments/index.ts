/**
 * Tournament Registry
 * Central registry for all tournament configurations
 */

import type { ActiveTournament, TournamentConfig } from '../../types/tournaments';
import type { Player, TournamentCompletion } from '../../types/game';
import { riversideOpen } from './riversideOpen';

const ALL_TOURNAMENTS: TournamentConfig[] = [
  riversideOpen,
  // Future tournaments can be added here
];

export const TournamentRegistry = {
  /**
   * Get all tournament configurations
   */
  getAllTournaments(): TournamentConfig[] {
    return ALL_TOURNAMENTS;
  },

  /**
   * Get a specific tournament by ID
   */
  getTournament(id: string): TournamentConfig | undefined {
    return ALL_TOURNAMENTS.find(t => t.id === id);
  },

  /**
   * Get tournaments the player is eligible to enter
   */
  getEligibleTournaments(
    player: Player,
    gameState: {
      calendar: {
        activeTournament: ActiveTournament | null;
        completedTournaments: TournamentCompletion[];
      };
      completedStoryEvents: string[];
    }
  ): TournamentConfig[] {
    return ALL_TOURNAMENTS.filter(tournament => {
      // Check if already completed
      const alreadyCompleted = gameState.calendar.completedTournaments.some(
        completion => completion.tournamentId === tournament.id
      );
      if (alreadyCompleted) {
        return false;
      }

      // Check tier requirement
      if (tournament.minPlayerTier && player.tier < tournament.minPlayerTier) {
        return false;
      }

      // Check matches played requirement
      if (tournament.minMatchesPlayed && (player.matchesPlayed || 0) < tournament.minMatchesPlayed) {
        return false;
      }

      // Check required story events
      if (tournament.requiredEvents) {
        const hasAllEvents = tournament.requiredEvents.every(eventId =>
          gameState.completedStoryEvents.includes(eventId)
        );
        if (!hasAllEvents) {
          return false;
        }
      }

      return true;
    });
  },
};
