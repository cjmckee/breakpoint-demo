/**
 * Story Match Manager
 * Business logic for story-driven match operations
 */

import type { ScheduledEvent, GameCalendar, StoryMatchMetadata } from '../types/game';

const defaultMatchEnergyCost = 30;

export class StoryMatchManager {
  /**
   * Get scheduled story match for current time
   * Returns the scheduled event if it's a story match at the current time
   */
  static getScheduledStoryMatch(
    scheduledEvents: ScheduledEvent[],
    calendar: GameCalendar
  ): ScheduledEvent | null {
    const storyMatch = scheduledEvents.find(
      (event) =>
        event.eventType === 'story_match' &&
        event.scheduledDay === calendar.currentDay &&
        event.scheduledTimeSlot === calendar.currentTimeSlot
    );

    return storyMatch || null;
  }

  /**
   * Calculate energy cost for story match
   */
  static calculateMatchEnergyCost(currentEnergy: number): number {
    return Math.min(defaultMatchEnergyCost, currentEnergy);
  }

  /**
   * Extract and validate story match metadata from scheduled event
   * Returns null if metadata is invalid or missing required fields
   */
  static getStoryMatchMetadata(event: ScheduledEvent): StoryMatchMetadata | null {
    if (event.eventType !== 'story_match' || !event.metadata) {
      return null;
    }

    const metadata = event.metadata as unknown as StoryMatchMetadata;

    // Validate required fields
    if (
      !metadata.opponentId ||
      !metadata.opponentName ||
      !metadata.opponentStats ||
      !metadata.winEventId ||
      !metadata.lossEventId
    ) {
      console.warn('StoryMatchManager: Invalid story match metadata - missing required fields', metadata);
      return null;
    }

    return metadata;
  }

  /**
   * Get post-match event ID based on match result
   */
  static getPostMatchEventId(
    metadata: StoryMatchMetadata,
    result: 'win' | 'loss'
  ): string {
    return result === 'win' ? metadata.winEventId : metadata.lossEventId;
  }
}
