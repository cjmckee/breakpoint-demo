/**
 * Season Manager
 *
 * A season is one tier's run through the calendar. Its fixed story beats live
 * in data (src/data/seasons/) on season days, so each tier can be written like
 * the Club season ("day 15: the first team match") wherever it falls in the
 * career. Pure logic, no store access.
 */

import type { GameCalendar, OpponentTier, ScheduledEvent, SeasonSchedule } from '../types/game';
import { CONTENT_END_EVENT, SEASON_SCHEDULES } from '../data/seasons';
import { TimeManager } from './TimeManager';

export class SeasonManager {
  /**
   * The season's beats as calendar events, for a season whose day 1 is
   * `startDay` on the calendar.
   */
  static scheduleSeason(schedule: SeasonSchedule, startDay: number): ScheduledEvent[] {
    return schedule.beats.map((beat) => ({
      eventType: 'story',
      scheduledDay: startDay + beat.day - 1,
      scheduledTimeSlot: beat.slot,
      metadata: { storyEventId: beat.storyEventId },
    }));
  }

  /**
   * Promotion to `tier`: its season begins tomorrow morning, and that season's
   * beats (if it has been written) join the calendar. Returns the calendar with
   * the season queued, and the events to add.
   */
  static promote(
    calendar: GameCalendar,
    tier: OpponentTier,
  ): { calendar: GameCalendar; events: ScheduledEvent[] } {
    const queued = TimeManager.queueSeason(calendar, tier);
    const schedule = SEASON_SCHEDULES[tier];
    const events = schedule ? this.scheduleSeason(schedule, calendar.currentDay + 1) : [];
    return { calendar: queued, events };
  }

  /**
   * Whether the player has played everything written: the closing event has run
   * and their tier has no season yet. The game stops there rather than leave them
   * training on an empty calendar. Writing the season (moving it into
   * SEASON_SCHEDULES) lifts it.
   */
  static contentEnded(tier: OpponentTier, completedStoryEvents: readonly string[]): boolean {
    return !SEASON_SCHEDULES[tier] && completedStoryEvents.includes(CONTENT_END_EVENT);
  }
}
