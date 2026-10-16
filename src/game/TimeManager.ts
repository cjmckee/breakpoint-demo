/**
 * Time Manager
 * Handles calendar and time slot management
 * Note: Energy and mood are managed in CurrentStatus via gameStore, not in the calendar
 */

import {
  GameCalendar,
  TimeSlot,
  TIME_SLOT_NAMES,
  TimeDisplayInfo,
  DEFAULT_CALENDAR,
} from '../types/game';

export class TimeManager {
  /**
   * Create a new calendar with default values
   */
  static createCalendar(): GameCalendar {
    return { ...DEFAULT_CALENDAR };
  }

  /**
   * Advance to next time slot
   */
  static advanceTimeSlot(calendar: GameCalendar): GameCalendar {
    const currentSlot = calendar.currentTimeSlot;

    if (currentSlot === TimeSlot.NIGHT) {
      // Move to next day
      return this.advanceDay(calendar);
    }

    // Move to next slot in same day
    return {
      ...calendar,
      currentTimeSlot: currentSlot + 1,
    };
  }

  /**
   * Advance to the next day, and begin a season that a promotion queued for it.
   */
  static advanceDay(calendar: GameCalendar): GameCalendar {
    const currentDay = calendar.currentDay + 1;
    const upcoming = calendar.upcomingSeason;
    const begins = upcoming !== null && currentDay >= upcoming.startDay;

    return {
      ...calendar,
      currentDay,
      currentTimeSlot: TimeSlot.MORNING,
      ...(begins && {
        currentSeason: upcoming.season,
        seasonStartDay: upcoming.startDay,
        upcomingSeason: null,
      }),
    };
  }

  /**
   * Queue `season` to begin on the morning after the current day. Promotion
   * calls this, so the rest of the promotion day still reads as the old season.
   */
  static queueSeason(calendar: GameCalendar, season: number): GameCalendar {
    return { ...calendar, upcomingSeason: { season, startDay: calendar.currentDay + 1 } };
  }

  /** Today's day of the season, counted from 1. */
  static seasonDay(calendar: GameCalendar): number {
    return this.seasonDayOf(calendar, calendar.currentDay);
  }

  /**
   * The season day a calendar day falls on, as the player will see it then. A
   * day on or after a queued season's start counts from that season.
   */
  static seasonDayOf(calendar: GameCalendar, day: number): number {
    const upcoming = calendar.upcomingSeason;
    const start =
      upcoming && day >= upcoming.startDay ? upcoming.startDay : calendar.seasonStartDay;
    return day - start + 1;
  }

  /**
   * Returns true when advancing from prev to next crosses a day boundary.
   * Use this to trigger once-per-day actions (shop refresh, daily resets, etc.).
   */
  static isNewDay(prev: GameCalendar, next: GameCalendar): boolean {
    return next.currentDay !== prev.currentDay || next.currentSeason !== prev.currentSeason;
  }

  /**
   * Get time display information
   */
  static getTimeDisplay(calendar: GameCalendar): TimeDisplayInfo {
    return {
      season: calendar.currentSeason,
      day: this.seasonDay(calendar),
      timeSlot: calendar.currentTimeSlot,
      timeSlotName: TIME_SLOT_NAMES[calendar.currentTimeSlot],
      formattedDisplay: `Season ${calendar.currentSeason}, Day ${this.seasonDay(calendar)} - ${TIME_SLOT_NAMES[calendar.currentTimeSlot]}`,
    };
  }

  /**
   * Calculate energy efficiency (affects training effectiveness)
   * Low energy = less efficient training
   */
  static calculateEnergyEfficiency(currentEnergy: number, maxEnergy: number = 100): number {
    const percentage = currentEnergy / maxEnergy;

    if (percentage >= 0.75) return 1.0;
    if (percentage >= 0.5) return 0.9;
    if (percentage >= 0.25) return 0.75;
    return 0.5;
  }

  /**
   * Get remaining time slots in current day
   */
  static getRemainingTimeSlots(calendar: GameCalendar): number {
    return 4 - calendar.currentTimeSlot;
  }
}
