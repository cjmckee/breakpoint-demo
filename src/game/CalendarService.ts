/**
 * Calendar Service
 * Unified API for all calendar queries and scheduling operations
 * Wraps ScheduledEventManager with higher-level functionality
 */

import type {
  GameCalendar,
  ScheduledEvent,
  ScheduledEventMetadata,
} from '../types/game';
import { TimeSlot } from '../types/game';
import { ScheduledEventManager } from './ScheduledEventManager';

// ============================================================================
// TYPES
// ============================================================================

export interface SchedulingPreferences {
  /** Absolute day number to schedule on */
  preferredDay?: number;
  /** Days from current day (1 = tomorrow). Used if preferredDay not set */
  relativeDays?: number;
  /** Preferred time slot */
  preferredSlot?: TimeSlot;
  /** Restrict scheduling to these slots only */
  allowedSlots?: TimeSlot[];
  /** Maximum days ahead to search for available slot (default 30) */
  maxDaysAhead?: number;
}

export interface DateRange {
  startDay: number;
  endDay: number;
}

export interface AvailableSlot {
  day: number;
  slot: TimeSlot;
}

export interface ScheduleResult {
  /** Updated calendar with new event */
  calendar: GameCalendar;
  /** Actual day event was scheduled */
  scheduledDay: number;
  /** Actual slot event was scheduled */
  scheduledSlot: TimeSlot;
  /** True if event was shifted from preferred time due to conflict */
  wasShifted: boolean;
}

// ============================================================================
// CALENDAR SERVICE
// ============================================================================

export class CalendarService {
  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  /**
   * Get all events within a date range (inclusive)
   */
  static getEventsInRange(
    calendar: GameCalendar,
    range: DateRange
  ): ScheduledEvent[] {
    return calendar.scheduledEvents.filter(
      (e) => e.scheduledDay >= range.startDay && e.scheduledDay <= range.endDay
    );
  }

  /**
   * Get all events of a specific type
   */
  static getEventsOfType(
    calendar: GameCalendar,
    eventType: ScheduledEvent['eventType']
  ): ScheduledEvent[] {
    return calendar.scheduledEvents.filter((e) => e.eventType === eventType);
  }

  /**
   * Get events for a specific day
   */
  static getEventsForDay(
    calendar: GameCalendar,
    day: number
  ): ScheduledEvent[] {
    return ScheduledEventManager.getScheduledEventsForDay(
      calendar.scheduledEvents,
      day
    );
  }

  /**
   * Check if a specific day/slot combination is available
   */
  static isSlotAvailable(
    calendar: GameCalendar,
    day: number,
    slot: TimeSlot
  ): boolean {
    return !ScheduledEventManager.hasScheduledEvent(
      calendar.scheduledEvents,
      day,
      slot
    );
  }

  /**
   * Find next N available slots starting from current time
   */
  static findAvailableSlots(
    calendar: GameCalendar,
    count: number,
    preferences?: Partial<SchedulingPreferences>
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const maxDays = preferences?.maxDaysAhead ?? 30;
    const startDay = calendar.currentDay;
    const allowedSlots = preferences?.allowedSlots ?? [
      TimeSlot.MORNING,
      TimeSlot.AFTERNOON,
      TimeSlot.EVENING,
    ];

    for (let dayOffset = 0; dayOffset < maxDays && slots.length < count; dayOffset++) {
      const day = startDay + dayOffset;

      for (const slot of allowedSlots) {
        if (slots.length >= count) break;

        // Skip past slots on current day
        if (day === calendar.currentDay && slot <= calendar.currentTimeSlot) {
          continue;
        }

        if (this.isSlotAvailable(calendar, day, slot)) {
          slots.push({ day, slot });
        }
      }
    }

    return slots;
  }

  /**
   * Get the next scheduled event after current time
   */
  static getNextEvent(calendar: GameCalendar): ScheduledEvent | null {
    const futureEvents = calendar.scheduledEvents
      .filter((e) => {
        if (e.scheduledDay > calendar.currentDay) return true;
        if (e.scheduledDay === calendar.currentDay) {
          return e.scheduledTimeSlot > calendar.currentTimeSlot;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.scheduledDay !== b.scheduledDay) {
          return a.scheduledDay - b.scheduledDay;
        }
        return a.scheduledTimeSlot - b.scheduledTimeSlot;
      });

    return futureEvents[0] ?? null;
  }

  /**
   * Get the next scheduled event of a specific type
   */
  static getNextEventOfType(
    calendar: GameCalendar,
    eventType: ScheduledEvent['eventType']
  ): ScheduledEvent | null {
    const futureEvents = calendar.scheduledEvents
      .filter((e) => {
        if (e.eventType !== eventType) return false;
        if (e.scheduledDay > calendar.currentDay) return true;
        if (e.scheduledDay === calendar.currentDay) {
          return e.scheduledTimeSlot > calendar.currentTimeSlot;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.scheduledDay !== b.scheduledDay) {
          return a.scheduledDay - b.scheduledDay;
        }
        return a.scheduledTimeSlot - b.scheduledTimeSlot;
      });

    return futureEvents[0] ?? null;
  }

  /**
   * Get event at current time slot
   */
  static getCurrentEvent(calendar: GameCalendar): ScheduledEvent | null {
    return ScheduledEventManager.getScheduledEvent(
      calendar.scheduledEvents,
      calendar
    );
  }

  // ==========================================================================
  // SCHEDULING METHODS
  // ==========================================================================

  /**
   * Schedule an event with smart conflict resolution
   * Returns updated calendar and actual scheduled time
   */
  static scheduleEvent(
    calendar: GameCalendar,
    eventType: ScheduledEvent['eventType'],
    preferences: SchedulingPreferences,
    metadata?: ScheduledEventMetadata
  ): ScheduleResult {
    // Resolve preferred day from relative or absolute
    const preferredDay =
      preferences.preferredDay ??
      calendar.currentDay + (preferences.relativeDays ?? 1);

    const preferredSlot = preferences.preferredSlot ?? TimeSlot.AFTERNOON;

    // Check if preferred slot is available
    const preferredAvailable = this.isSlotAvailable(
      calendar,
      preferredDay,
      preferredSlot
    );

    // Use conflict resolution to find actual slot
    const { event, actualDay, actualSlot, updatedEvents } =
      ScheduledEventManager.scheduleEventWithConflictResolution(
        calendar.scheduledEvents,
        eventType,
        preferredDay,
        preferredSlot,
        metadata
      );

    const wasShifted = !preferredAvailable ||
      actualDay !== preferredDay ||
      actualSlot !== preferredSlot;

    return {
      calendar: {
        ...calendar,
        scheduledEvents: updatedEvents,
      },
      scheduledDay: actualDay,
      scheduledSlot: actualSlot,
      wasShifted,
    };
  }

  /**
   * Remove an event at a specific day/slot
   */
  static removeEvent(
    calendar: GameCalendar,
    day: number,
    slot: TimeSlot
  ): GameCalendar {
    return {
      ...calendar,
      scheduledEvents: ScheduledEventManager.clearScheduledEvent(
        calendar.scheduledEvents,
        day,
        slot
      ),
    };
  }

  /**
   * Remove all events of a specific type
   */
  static removeEventsOfType(
    calendar: GameCalendar,
    eventType: ScheduledEvent['eventType']
  ): GameCalendar {
    return {
      ...calendar,
      scheduledEvents: calendar.scheduledEvents.filter(
        (e) => e.eventType !== eventType
      ),
    };
  }

  /**
   * Clear past events (before current time)
   */
  static clearPastEvents(calendar: GameCalendar): GameCalendar {
    return {
      ...calendar,
      scheduledEvents: ScheduledEventManager.clearPastEvents(
        calendar.scheduledEvents,
        calendar
      ),
    };
  }

  /**
   * Clear all scheduled events
   */
  static clearAllEvents(calendar: GameCalendar): GameCalendar {
    return {
      ...calendar,
      scheduledEvents: [],
    };
  }
}
