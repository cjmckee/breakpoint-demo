/**
 * Scheduled Event Manager
 * Generic system for scheduling any activity type for specific day/time slots
 */

import type { ScheduledEvent, GameCalendar, ScheduledEventMetadata } from '../types/game';
import { TimeSlot } from '../types/game';

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
    metadata?: ScheduledEventMetadata
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

  /**
   * Check if an event is in the past relative to the current calendar
   */
  static isEventInPast(event: ScheduledEvent, calendar: GameCalendar): boolean {
    if (event.scheduledDay < calendar.currentDay) return true;
    if (event.scheduledDay === calendar.currentDay) {
      return event.scheduledTimeSlot < calendar.currentTimeSlot;
    }
    return false;
  }

  /**
   * Get all scheduled events that are in the past (missed)
   * Returns the oldest missed event first so they can be processed in order
   */
  static getMissedEvents(
    scheduledEvents: ScheduledEvent[],
    calendar: GameCalendar
  ): ScheduledEvent[] {
    return scheduledEvents
      .filter(e => this.isEventInPast(e, calendar))
      .sort((a, b) => {
        if (a.scheduledDay !== b.scheduledDay) return a.scheduledDay - b.scheduledDay;
        return a.scheduledTimeSlot - b.scheduledTimeSlot;
      });
  }

  /**
   * Reconcile a single missed event.
   * - Story events: returns the event as-is for immediate triggering
   * - Match events (tournament_match, story_match): reschedules to currentDay + 1
   *   at the original time slot, with conflict resolution
   * Returns the updated events array and optionally the story event to trigger
   */
  static reconcileMissedEvent(
    scheduledEvents: ScheduledEvent[],
    missedEvent: ScheduledEvent,
    calendar: GameCalendar
  ): { updatedEvents: ScheduledEvent[]; storyEventToTrigger: ScheduledEvent | null } {
    // Remove the missed event from the array
    const withoutMissed = scheduledEvents.filter(e => e !== missedEvent);

    if (missedEvent.eventType === 'tournament_match' || missedEvent.eventType === 'story_match') {
      // Reschedule match for tomorrow at its original time slot
      const rescheduleDay = calendar.currentDay + 1;
      const { updatedEvents } = this.scheduleEventWithConflictResolution(
        withoutMissed,
        missedEvent.eventType,
        rescheduleDay,
        missedEvent.scheduledTimeSlot,
        missedEvent.metadata
      );
      return { updatedEvents, storyEventToTrigger: null };
    }

    if (missedEvent.eventType === 'story') {
      // Story events trigger immediately
      return { updatedEvents: withoutMissed, storyEventToTrigger: missedEvent };
    }

    // Other types (training, rest): just discard — these are non-blocking
    return { updatedEvents: withoutMissed, storyEventToTrigger: null };
  }

  /**
   * Find the next available time slot starting from a given day/slot
   * Skips NIGHT slots (not a valid activity time for scheduling)
   * Returns the first free day/slot combination
   */
  static findNextAvailableSlot(
    scheduledEvents: ScheduledEvent[],
    startDay: number,
    preferredSlot: TimeSlot
  ): { day: number; slot: TimeSlot } {
    // Valid slots for scheduling (excludes NIGHT)
    const validSlots = [TimeSlot.MORNING, TimeSlot.AFTERNOON, TimeSlot.EVENING];

    let currentDay = startDay;
    let startSlotIndex = validSlots.indexOf(preferredSlot);

    // If preferred slot is NIGHT or invalid, start from MORNING
    if (startSlotIndex === -1) {
      startSlotIndex = 0;
    }

    // Search for up to 30 days (safety limit)
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const day = currentDay + dayOffset;

      // On the first day, start from the preferred slot; on subsequent days, start from MORNING
      const slotsToCheck = dayOffset === 0 ? validSlots.slice(startSlotIndex) : validSlots;

      for (const slot of slotsToCheck) {
        if (!this.hasScheduledEvent(scheduledEvents, day, slot)) {
          return { day, slot };
        }
      }
    }

    // Fallback: if no slot found in 30 days, just return day 30 morning
    return { day: startDay + 30, slot: TimeSlot.MORNING };
  }

  /**
   * Schedule event with conflict resolution
   * If preferred slot is taken, finds next available slot
   * Returns the scheduled event along with the actual day/slot used
   */
  static scheduleEventWithConflictResolution(
    scheduledEvents: ScheduledEvent[],
    eventType: ScheduledEvent['eventType'],
    preferredDay: number,
    preferredSlot: TimeSlot,
    metadata?: ScheduledEventMetadata
  ): { event: ScheduledEvent; actualDay: number; actualSlot: TimeSlot; updatedEvents: ScheduledEvent[] } {
    // Find the next available slot
    const { day: actualDay, slot: actualSlot } = this.findNextAvailableSlot(
      scheduledEvents,
      preferredDay,
      preferredSlot
    );

    // Create the event
    const event = this.scheduleEvent(eventType, actualDay, actualSlot, metadata);

    // Return event with actual scheduling info
    return {
      event,
      actualDay,
      actualSlot,
      updatedEvents: [...scheduledEvents, event],
    };
  }
}
