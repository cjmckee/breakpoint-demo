/**
 * Scheduled Event Manager
 * Generic system for scheduling any activity type for specific day/time slots
 */

import type { ScheduledEvent, GameCalendar, TimeSlot } from '../types/game';

export class ScheduledEventManager {
  /**
   * Get scheduled event for current time
   */
  static getScheduledEvent(
    scheduledEvents: ScheduledEvent[],
    calendar: GameCalendar
  ): ScheduledEvent | null {
    const event = scheduledEvents.find(
      e =>
        e.scheduledDay === calendar.currentDay &&
        e.scheduledTimeSlot === calendar.currentTimeSlot
    );

    return event || null;
  }

  /**
   * Create a new scheduled event
   */
  static scheduleEvent(
    eventType: ScheduledEvent['eventType'],
    day: number,
    slot: TimeSlot,
    metadata?: Record<string, any>
  ): ScheduledEvent {
    return {
      eventType,
      scheduledDay: day,
      scheduledTimeSlot: slot,
      metadata,
    };
  }

  /**
   * Remove scheduled event for specific day/slot
   * Returns new array without the event
   */
  static clearScheduledEvent(
    scheduledEvents: ScheduledEvent[],
    day: number,
    slot: TimeSlot
  ): ScheduledEvent[] {
    return scheduledEvents.filter(
      e => !(e.scheduledDay === day && e.scheduledTimeSlot === slot)
    );
  }

  /**
   * Check if there's a scheduled event for specific day/slot
   */
  static hasScheduledEvent(
    scheduledEvents: ScheduledEvent[],
    day: number,
    slot: TimeSlot
  ): boolean {
    return scheduledEvents.some(
      e => e.scheduledDay === day && e.scheduledTimeSlot === slot
    );
  }

  /**
   * Get all scheduled events for a specific day
   */
  static getScheduledEventsForDay(
    scheduledEvents: ScheduledEvent[],
    day: number
  ): ScheduledEvent[] {
    return scheduledEvents.filter(e => e.scheduledDay === day);
  }

  /**
   * Clear all scheduled events
   * Returns empty array
   */
  static clearAllScheduledEvents(): ScheduledEvent[] {
    return [];
  }

  /**
   * Remove past scheduled events
   * Useful for cleanup - removes events before current day/slot
   */
  static clearPastEvents(
    scheduledEvents: ScheduledEvent[],
    calendar: GameCalendar
  ): ScheduledEvent[] {
    return scheduledEvents.filter(e => {
      // Keep if day is after current day
      if (e.scheduledDay > calendar.currentDay) return true;

      // Keep if same day but slot is current or later
      if (e.scheduledDay === calendar.currentDay) {
        return e.scheduledTimeSlot >= calendar.currentTimeSlot;
      }

      // Remove if before current day
      return false;
    });
  }
}
