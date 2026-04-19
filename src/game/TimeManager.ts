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
   * Advance to next day
   */
  static advanceDay(calendar: GameCalendar): GameCalendar {
    const daysPerSeason = 90; // ~3 months

    if (calendar.currentDay >= daysPerSeason) {
      // Move to next season
      return {
        ...calendar,
        currentSeason: calendar.currentSeason + 1,
        currentDay: 1,
        currentTimeSlot: TimeSlot.MORNING,
      };
    }

    return {
      ...calendar,
      currentDay: calendar.currentDay + 1,
      currentTimeSlot: TimeSlot.MORNING,
    };
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
      day: calendar.currentDay,
      timeSlot: calendar.currentTimeSlot,
      timeSlotName: TIME_SLOT_NAMES[calendar.currentTimeSlot],
      formattedDisplay: `Season ${calendar.currentSeason}, Day ${calendar.currentDay} - ${TIME_SLOT_NAMES[calendar.currentTimeSlot]}`,
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
