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
   * Get a specific event by ID if player qualifies for it
   * Returns the event if eligible, null otherwise
   */
  static getEligibleEventById(
    eventId: string,
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
    }
  ): StoryEvent | null {
    console.log(`🔍 Getting event by ID: ${eventId}`);

    // Get event from repository
    const event = StoryEventRepository.getEventById(eventId);
    if (!event) {
      console.log(`❌ Event not found: ${eventId}`);
      return null;
    }

    // Skip if already completed
    if (gameState.completedStoryEvents.includes(event.id)) {
      console.log(`❌ Event already completed: ${eventId}`);
      return null;
    }

    // Check prerequisites
    const isEligible = PrerequisiteChecker.checkAllPrerequisites(
      event.prerequisites,
      player,
      gameState
    );

    if (!isEligible) {
      console.log(`❌ Event prerequisites not met: ${eventId}`);
      return null;
    }

    console.log(`✅ Event eligible: ${event.name}`);
    return event;
  }

  /**
   * Get all events matching a specific tag that the player qualifies for
   */
  static getEligibleEventsByTag(
    tag: StoryEventTag,
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
    }
  ): StoryEvent[] {
    console.log(`🔍 Getting eligible events for tag: ${tag}`);

    // Get events by tag
    const taggedEvents = StoryEventRepository.getEventsByTag(tag);

    // Filter by prerequisites
    return taggedEvents.filter((event) => {
      // Skip if already completed
      if (gameState.completedStoryEvents.includes(event.id)) {
        return false;
      }

      // Check prerequisites
      return PrerequisiteChecker.checkAllPrerequisites(event.prerequisites, player, gameState);
    });
  }

  /**
   * Get all events the player currently qualifies for (no tag filter)
   */
  static getAllEligibleEvents(
    player: Player,
    gameState: {
      completedStoryEvents: string[];
      completedStoryEventChoices: Record<string, string>;
      relationships: Record<string, number>;
      calendar: GameCalendar;
    }
  ): StoryEvent[] {
    console.log(`🔍 Getting all eligible events for player: ${player.id}`);

    console.log('completed events:', gameState.completedStoryEvents);
    console.log('event choices:', gameState.completedStoryEventChoices);
    console.log('relationships:', gameState.relationships);

    // Get all events
    const allEvents = StoryEventRepository.getAllEvents();

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

    // Get stat changes from outcome
    const statChanges: Record<string, number> = {
      ...(outcome.effects.statChanges || {}),
    };

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
