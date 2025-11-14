/**
 * Time Manager
 * Handles calendar, time slots, energy, and mood management
 */

import {
  GameCalendar,
  TimeSlot,
  TIME_SLOT_NAMES,
  TimeDisplayInfo,
  EnergyDisplayInfo,
  MoodDisplayInfo,
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
        energy: calendar.maxEnergy, // Restore energy overnight
      };
    }

    return {
      ...calendar,
      currentDay: calendar.currentDay + 1,
      currentTimeSlot: TimeSlot.MORNING,
      energy: calendar.maxEnergy, // Restore energy overnight
    };
  }

  /**
   * Consume energy for an activity
   */
  static consumeEnergy(calendar: GameCalendar, amount: number): GameCalendar {
    return {
      ...calendar,
      energy: Math.max(0, calendar.energy - amount),
    };
  }

  /**
   * Restore energy (rest activities)
   */
  static restoreEnergy(calendar: GameCalendar, amount: number): GameCalendar {
    return {
      ...calendar,
      energy: Math.min(calendar.maxEnergy, calendar.energy + amount),
    };
  }

  /**
   * Adjust mood
   */
  static adjustMood(calendar: GameCalendar, change: number): GameCalendar {
    return {
      ...calendar,
      mood: Math.max(-100, Math.min(100, calendar.mood + change)),
    };
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
   * Get energy display information
   */
  static getEnergyDisplay(calendar: GameCalendar): EnergyDisplayInfo {
    const percentage = (calendar.energy / calendar.maxEnergy) * 100;
    const efficiency = this.calculateEnergyEfficiency(calendar.energy, calendar.maxEnergy);

    let costModifier = '100%';
    if (efficiency < 1.0) {
      costModifier = `${Math.round(efficiency * 100)}%`;
    }

    return {
      current: calendar.energy,
      max: calendar.maxEnergy,
      percentage,
      efficiency,
      costModifier,
    };
  }

  /**
   * Get mood display information
   */
  static getMoodDisplay(calendar: GameCalendar): MoodDisplayInfo {
    const mood = calendar.mood;

    let description: string;
    let color: string;
    let emoji: string;

    if (mood >= 75) {
      description = 'Excellent';
      color = 'green';
      emoji = '😁';
    } else if (mood >= 50) {
      description = 'Very Good';
      color = 'lightgreen';
      emoji = '😊';
    } else if (mood >= 25) {
      description = 'Good';
      color = 'lime';
      emoji = '🙂';
    } else if (mood >= 0) {
      description = 'Neutral';
      color = 'yellow';
      emoji = '😐';
    } else if (mood >= -25) {
      description = 'Low';
      color = 'orange';
      emoji = '😕';
    } else if (mood >= -50) {
      description = 'Poor';
      color = 'orangered';
      emoji = '😞';
    } else if (mood >= -75) {
      description = 'Very Poor';
      color = 'red';
      emoji = '😢';
    } else {
      description = 'Terrible';
      color = 'darkred';
      emoji = '😭';
    }

    return {
      value: mood,
      description,
      color,
      emoji,
    };
  }

  /**
   * Calculate energy efficiency (affects training effectiveness)
   * Low energy = less efficient training
   */
  static calculateEnergyEfficiency(currentEnergy: number, maxEnergy: number): number {
    const percentage = currentEnergy / maxEnergy;

    if (percentage >= 0.75) return 1.0;
    if (percentage >= 0.5) return 0.9;
    if (percentage >= 0.25) return 0.75;
    return 0.5;
  }

  /**
   * Can perform activity with given energy cost
   */
  static canPerformActivity(calendar: GameCalendar, energyCost: number): boolean {
    return calendar.energy >= energyCost;
  }

  /**
   * Get remaining time slots in current day
   */
  static getRemainingTimeSlots(calendar: GameCalendar): number {
    return 4 - calendar.currentTimeSlot;
  }

  /**
   * Calculate mood decay (mood naturally trends toward neutral)
   */
  static applyMoodDecay(calendar: GameCalendar, decayRate: number = 2): GameCalendar {
    let newMood = calendar.mood;

    if (calendar.mood > 0) {
      newMood = Math.max(0, calendar.mood - decayRate);
    } else if (calendar.mood < 0) {
      newMood = Math.min(0, calendar.mood + decayRate);
    }

    return {
      ...calendar,
      mood: newMood,
    };
  }

  /**
   * Skip time slot (pass time without activity)
   */
  static skipTimeSlot(calendar: GameCalendar): GameCalendar {
    const newCalendar = this.advanceTimeSlot(calendar);
    // Mood decreases slightly when skipping
    return this.adjustMood(newCalendar, -5);
  }

  /**
   * Rest activity (restore energy, improve mood slightly)
   */
  static rest(
    calendar: GameCalendar,
    restType: 'light' | 'moderate' | 'deep'
  ): { calendar: GameCalendar; energyRestored: number; moodChange: number } {
    const restBonuses = {
      light: { energy: 15, mood: 3, slots: 1 },
      moderate: { energy: 30, mood: 5, slots: 1 },
      deep: { energy: 50, mood: 8, slots: 2 },
    };

    const bonus = restBonuses[restType];

    let newCalendar = this.restoreEnergy(calendar, bonus.energy);
    newCalendar = this.adjustMood(newCalendar, bonus.mood);

    // Advance time slots
    for (let i = 0; i < bonus.slots; i++) {
      newCalendar = this.advanceTimeSlot(newCalendar);
    }

    return {
      calendar: newCalendar,
      energyRestored: bonus.energy,
      moodChange: bonus.mood,
    };
  }
}
