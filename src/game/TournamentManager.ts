/**
 * Tournament Manager
 * Business logic for tournament operations
 */

import type {
  ActiveTournament,
  TournamentConfig,
  TournamentMatchMetadata,
} from '../types/tournaments';
import type { ScheduledEvent, GameCalendar } from '../types/game';
import { TournamentRegistry } from '../data/tournaments';

const defaultMatchEnergyCost = 50;

export class TournamentManager {
  /**
   * Get scheduled tournament match for current time
   * Returns the scheduled event if it's a tournament match at the current time
   */
  static getScheduledTournamentMatch(
    activeTournament: ActiveTournament | null,
    scheduledEvents: ScheduledEvent[],
    calendar: GameCalendar
  ): ScheduledEvent | null {
    console.log('Checking scheduled tournament match...');
    console.log('activeTournament:', activeTournament);
    console.log('scheduledEvents:', scheduledEvents);
    console.log('calendar:', calendar);
    
    if (!activeTournament || !activeTournament.isActive) {
      return null;
    }

 

    // Find tournament match scheduled for current time
    const tournamentMatch = scheduledEvents.find(
      event =>
        event.eventType === 'tournament_match' &&
        event.scheduledDay === calendar.currentDay &&
        event.scheduledTimeSlot === calendar.currentTimeSlot
    );

    return tournamentMatch || null;
  }

  /**
   * Calculate energy cost for tournament match
   * Uses default energy cost unless player has less energy
   * then uses all remaining energy
   */
  static calculateMatchEnergyCost(
    currentEnergy: number
  ): number {
    return Math.min(defaultMatchEnergyCost, currentEnergy);
  }

  /**
   * Get current round configuration
   */
  static getCurrentRound(
    tournament: TournamentConfig,
    currentRound: number
  ) {
    if (currentRound < 0 || currentRound >= tournament.rounds.length) {
      return null;
    }
    return tournament.rounds[currentRound];
  }

  /**
   * Get prematch event ID based on bracket
   */
  static getPrematchEventId(
    tournament: TournamentConfig,
    currentRound: number,
    bracket: 'winner' | 'loser'
  ): string | null {
    const round = this.getCurrentRound(tournament, currentRound);
    if (!round) return null;

    return bracket === 'winner'
      ? round.prematchEventWinner
      : round.prematchEventLoser;
  }

  /**
   * Get post-match event ID based on result
   */
  static getPostMatchEventId(
    tournament: TournamentConfig,
    currentRound: number,
    result: 'win' | 'loss'
  ): string | null {
    const round = this.getCurrentRound(tournament, currentRound);
    if (!round) return null;

    return result === 'win' ? round.winEventId : round.lossEventId;
  }

  /**
   * Check if tournament is complete
   */
  static isTournamentComplete(
    tournament: TournamentConfig,
    currentRound: number
  ): boolean {
    return currentRound >= tournament.rounds.length;
  }

  /**
   * Extract tournament match metadata from scheduled event
   */
  static getTournamentMatchMetadata(
    event: ScheduledEvent
  ): TournamentMatchMetadata | null {
    if (event.eventType !== 'tournament_match' || !event.metadata) {
      return null;
    }

    const metadata = event.metadata as TournamentMatchMetadata;

    // Validate required fields
    if (
      !metadata.tournamentId ||
      !metadata.tournamentName ||
      metadata.roundNumber === undefined ||
      !metadata.opponentId ||
      !metadata.opponentName ||
      !metadata.bracket
    ) {
      return null;
    }

    return metadata;
  }
}
