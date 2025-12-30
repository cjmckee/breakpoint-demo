/**
 * Story Event Manager
 * Main orchestrator for story event system
 */

import { StoryEventRepository } from '../data/storyEvents';
import { PrerequisiteChecker } from './PrerequisiteChecker';
import type {
  StoryEvent,
  StoryEventOption,
  StoryEventOutcome,
  StoryEventResult,
  StoryEventTag,
} from '../types/storyEvents';
import type { Player, GameCalendar } from '../types/game';

export class StoryEventManager {
  /**
   * Get all events the player currently qualifies for
   */
  static getEligibleEvents(
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
    },
    tag?: StoryEventTag
  ): StoryEvent[] {
    console.log(`🔍 Getting eligible events for player: ${player.id}, tag: ${tag}`);

    console.log('completed events:', gameState.completedStoryEvents);
    console.log('event choices:', gameState.completedStoryEventChoices);
    console.log('relationships:', gameState.relationships);

    // Get all events (or filtered by tag)
    const allEvents = tag
      ? StoryEventRepository.getEventsByTag(tag)
      : StoryEventRepository.getAllEvents();

    console.log('all events:', allEvents);
    // Filter by prerequisites
    return allEvents.filter((event) => {
      // Skip if already completed
      if (gameState.completedStoryEvents.includes(event.id)) {
        return false;
      }

      // Check prerequisites
      return PrerequisiteChecker.checkAllPrerequisites(event.prerequisites, player, gameState);
    });
  }

  /**
   * Select a random event from eligible events
   */
  static selectRandomEvent(eligibleEvents: StoryEvent[]): StoryEvent | null {
    if (eligibleEvents.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
    return eligibleEvents[randomIndex];
  }

  /**
   * Check if a story event should trigger based on probability
   */
  static shouldTriggerEvent(triggerChance: number): boolean {
    return Math.random() * 100 < triggerChance;
  }

  /**
   * Execute a story event with the player's selected option
   */
  static executeStoryEvent(
    event: StoryEvent,
    selectedOption: StoryEventOption | null, // null for linear events
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
    }
  ): StoryEventResult {
    // Get the outcome (from selected option or default)
    const outcome = this.getOutcome(event, selectedOption);

    // Combine stat boosts and decreases into single statChanges object
    const statChanges: Record<string, number> = {
      ...(outcome.effects.statBoosts || {}),
    };

    // Add stat decreases as negative values
    if (outcome.effects.statDecreases) {
      for (const [stat, value] of Object.entries(outcome.effects.statDecreases)) {
        statChanges[stat] = -(value || 0);
      }
    }

    // Create result
    const result: StoryEventResult = {
      id: `story-${Date.now()}`,
      type: 'story',
      source: 'story_event',
      timestamp: new Date().toISOString(),
      timeSlotsUsed: event.timeSlotsRequired,
      energyCost: Math.abs(outcome.effects.energyChange || 0),
      moodResult: outcome.effects.moodChange || 0,

      eventId: event.id,
      eventName: event.name,
      tags: event.tags,

      selectedOptionId: selectedOption?.id,
      selectedOptionText: selectedOption?.text,

      resultText: outcome.resultText,

      statChanges,
      relationshipChanges: outcome.effects.relationshipChanges || {},
      abilitiesGained: outcome.effects.abilitiesGained || [],
    };

    return result;
  }

  /**
   * Get the outcome for an event (from option or default)
   */
  static getOutcome(event: StoryEvent, selectedOption: StoryEventOption | null): StoryEventOutcome {
    if (selectedOption) {
      return selectedOption.outcome;
    }

    if (event.defaultOutcome) {
      return event.defaultOutcome;
    }

    throw new Error(`Event ${event.id} has no default outcome and no option was selected`);
  }
}
