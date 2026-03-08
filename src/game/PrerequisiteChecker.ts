/**
 * Prerequisite Checker
 * Pure functions for checking if a player meets story event requirements
 */

import type { PlayerStats } from '../types';
import type { Player, GameCalendar, Ability } from '../types/game';
import type { StoryEventPrerequisite, StoryEventOption, StoryEvent } from '../types/storyEvents';
import type { ActiveTournament } from '../types/tournaments';

export class PrerequisiteChecker {
  /**
   * Check stat requirements
   */
  static checkStatPrerequisites(
    playerStats: PlayerStats,
    requirements?: StoryEventPrerequisite['stats']
  ): boolean {
    if (!requirements) return true;

    for (const [statName, range] of Object.entries(requirements)) {
      const statValue = this.getStatValue(playerStats, statName);
      if (statValue === undefined) return false;

      if (range.min !== undefined && statValue < range.min) return false;
      if (range.max !== undefined && statValue > range.max) return false;
    }

    return true;
  }

  /**
   * Check relationship requirements
   */
  static checkRelationshipPrerequisites(
    relationships: Record<string, number>,
    requirements?: StoryEventPrerequisite['relationships']
  ): boolean {
    if (!requirements) return true;

    for (const [characterId, range] of Object.entries(requirements)) {
      const relationshipValue = relationships[characterId] || 0;

      if (range.min !== undefined && relationshipValue < range.min) return false;
      if (range.max !== undefined && relationshipValue > range.max) return false;
    }

    return true;
  }

  /**
   * Check event completion requirements
   */
  static checkEventPrerequisites(
    completedEvents: string[],
    completedChoices: Record<string, string>,
    requirements: {
      completedEvents?: string[];
      excludedEvents?: string[];
      completedEventChoices?: Record<string, string | string[]>;
      excludedEventChoices?: Record<string, string | string[]>;
    }
  ): boolean {
    // Check required completed events
    if (requirements.completedEvents) {
      for (const eventId of requirements.completedEvents) {
        if (!completedEvents.includes(eventId)) return false;
      }
    }

    // Check excluded events (must NOT be completed)
    if (requirements.excludedEvents) {
      for (const eventId of requirements.excludedEvents) {
        if (completedEvents.includes(eventId)) return false;
      }
    }

    // Check required choices (specific option must have been selected)
    if (requirements.completedEventChoices) {
      for (const [eventId, requiredOptionId] of Object.entries(requirements.completedEventChoices)) {
        const playerChoice = completedChoices[eventId];

        // Array means OR - player's choice must be in the array
        if (Array.isArray(requiredOptionId)) {
          if (!requiredOptionId.includes(playerChoice)) return false;
        } else {
          // Single string means exact match
          if (playerChoice !== requiredOptionId) return false;
        }
      }
    }

    // Check excluded choices (specific option blocks this event)
    if (requirements.excludedEventChoices) {
      for (const [eventId, blockedOptionId] of Object.entries(requirements.excludedEventChoices)) {
        const playerChoice = completedChoices[eventId];

        // Array means OR - if player's choice is in the array, block the event
        if (Array.isArray(blockedOptionId)) {
          if (blockedOptionId.includes(playerChoice)) return false;
        } else {
          // Single string means exact match
          if (playerChoice === blockedOptionId) return false;
        }
      }
    }

    return true;
  }

  /**
   * Check time requirements
   */
  static checkTimePrerequisites(
    calendar: GameCalendar,
    requirements?: Pick<StoryEventPrerequisite, 'minDay' | 'maxDay' | 'minSeason'>
  ): boolean {
    if (!requirements) return true;

    if (requirements.minDay !== undefined && calendar.currentDay < requirements.minDay) {
      return false;
    }
    if (requirements.maxDay !== undefined && calendar.currentDay > requirements.maxDay) {
      return false;
    }
    if (requirements.minSeason !== undefined && calendar.currentSeason < requirements.minSeason) {
      return false;
    }

    return true;
  }

  /**
   * Check ability requirements
   */
  static checkAbilityPrerequisites(
    abilities: Ability[],
    requirements?: Pick<StoryEventPrerequisite, 'hasAbilities' | 'lacksAbilities'>
  ): boolean {
    if (!requirements) return true;

    const abilityNames = abilities.map((a) => a.name);

    // Must have these abilities
    if (requirements.hasAbilities) {
      for (const abilityName of requirements.hasAbilities) {
        if (!abilityNames.includes(abilityName)) return false;
      }
    }

    // Must NOT have these abilities
    if (requirements.lacksAbilities) {
      for (const abilityName of requirements.lacksAbilities) {
        if (abilityNames.includes(abilityName)) return false;
      }
    }

    return true;
  }

  /**
   * Check match history requirements
   */
  static checkMatchHistoryPrerequisites(
    player: Player,
    requirements?: Pick<StoryEventPrerequisite, 'minMatchesPlayed' | 'minMatchesWon' | 'minWinStreak'>
  ): boolean {
    if (!requirements) return true;

    if (requirements.minMatchesPlayed !== undefined) {
      const matchesPlayed = player.matchesPlayed || 0;
      if (matchesPlayed < requirements.minMatchesPlayed) return false;
    }

    if (requirements.minMatchesWon !== undefined) {
      const matchesWon = player.matchesWon || 0;
      if (matchesWon < requirements.minMatchesWon) return false;
    }

    if (requirements.minWinStreak !== undefined) {
      const results = player.latestMatchResults || [];
      let streak = 0;
      for (const result of results) {
        if (result !== 'win') break;
        streak++;
      }
      if (streak < requirements.minWinStreak) return false;
    }

    return true;
  }

  /**
   * Check tournament requirements
   */
  static checkTournamentPrerequisites(
    activeTournament: ActiveTournament | null,
    requirements?: Pick<StoryEventPrerequisite, 'activeTournament' | 'tournamentBracket' | 'tournamentRound'>
  ): boolean {
    if (!requirements) return true;

    // Must be in specific tournament
    if (requirements.activeTournament) {
      if (!activeTournament || activeTournament.tournamentId !== requirements.activeTournament) {
        return false;
      }
    }

    // Must be in specific bracket
    if (requirements.tournamentBracket) {
      if (!activeTournament || activeTournament.currentBracket !== requirements.tournamentBracket) {
        return false;
      }
    }

    // Must be at specific round
    if (requirements.tournamentRound !== undefined) {
      if (!activeTournament || activeTournament.currentRound !== requirements.tournamentRound) {
        return false;
      }
    }

    return true;
  }

  /**
   * Main prerequisite checker - checks all conditions
   */
  static checkAllPrerequisites(
    prerequisites: StoryEventPrerequisite,
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
      activeTournament?: ActiveTournament | null;
    }
  ): boolean {
    return (
      this.checkStatPrerequisites(player.stats, prerequisites.stats) &&
      this.checkRelationshipPrerequisites(gameState.relationships, prerequisites.relationships) &&
      this.checkEventPrerequisites(
        gameState.completedStoryEvents,
        gameState.completedStoryEventChoices,
        {
          completedEvents: prerequisites.completedEvents,
          excludedEvents: prerequisites.excludedEvents,
          completedEventChoices: prerequisites.completedEventChoices,
          excludedEventChoices: prerequisites.excludedEventChoices,
        }
      ) &&
      this.checkTimePrerequisites(gameState.calendar, prerequisites) &&
      this.checkAbilityPrerequisites(player.abilities, prerequisites) &&
      this.checkMatchHistoryPrerequisites(player, prerequisites) &&
      this.checkTournamentPrerequisites(gameState.activeTournament || null, prerequisites)
    );
  }

  /**
   * Check if a specific option is available to the player
   */
  static checkOptionPrerequisites(
    option: StoryEventOption,
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
      activeTournament?: ActiveTournament | null;
    }
  ): boolean {
    if (!option.prerequisites) return true;
    return this.checkAllPrerequisites(option.prerequisites, player, gameState);
  }

  /**
   * Get available options for an event (filters out locked options)
   */
  static getAvailableOptions(
    event: StoryEvent,
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
      activeTournament?: ActiveTournament | null;
    }
  ): StoryEventOption[] {
    return event.options.filter((option) => this.checkOptionPrerequisites(option, player, gameState));
  }

  /**
   * Helper to get stat value from nested PlayerStats structure
   */
  private static getStatValue(stats: PlayerStats, statName: string): number | undefined {
    if (statName in stats.technical) {
      return stats.technical[statName as keyof typeof stats.technical];
    }
    if (statName in stats.physical) {
      return stats.physical[statName as keyof typeof stats.physical];
    }
    if (statName in stats.mental) {
      return stats.mental[statName as keyof typeof stats.mental];
    }
    return undefined;
  }
}
