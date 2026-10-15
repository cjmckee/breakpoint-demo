/**
 * Promotion playoffs: lose the tier-final and a playoff match is scheduled a few
 * days on; lose that and it comes round again, the same opponent at the same
 * strength, until it is won. Nothing ever gets easier, and nothing gets stuck.
 */

import type { PlayoffConfig, ScheduledEvent, StoryMatchMetadata } from '../types/game';
import { TimeSlot } from '../types/game';
import { buildStoryMatchMetadata } from '../data/teamMatches';
import { ScheduledEventManager } from './ScheduledEventManager';

export class PlayoffManager {
  /** The loss event for an attempt (from 1): one per attempt, the last repeating. */
  static lossEventFor(config: PlayoffConfig, attempt: number): string {
    const ids = config.lossEventIds;
    return ids[Math.min(Math.max(attempt, 1), ids.length) - 1];
  }

  /** The story match for one attempt, marked so its loss schedules the next. */
  static metadataFor(config: PlayoffConfig, attempt: number): StoryMatchMetadata {
    return {
      ...buildStoryMatchMetadata({ ...config, lossEventId: this.lossEventFor(config, attempt) }),
      playoff: { id: config.id, attempt },
    };
  }

  /**
   * Schedule an attempt `config.retryDays` after `fromDay`, in the afternoon (or
   * the next free slot), and return the calendar's events with it added.
   */
  static scheduleAttempt(
    events: ScheduledEvent[],
    config: PlayoffConfig,
    attempt: number,
    fromDay: number,
  ): ScheduledEvent[] {
    return ScheduledEventManager.scheduleEventWithConflictResolution(
      events,
      'story_match',
      fromDay + config.retryDays,
      TimeSlot.AFTERNOON,
      this.metadataFor(config, attempt),
    ).updatedEvents;
  }
}
