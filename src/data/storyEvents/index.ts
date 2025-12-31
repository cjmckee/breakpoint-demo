/**
 * Story Event Repository
 * Central registry and lookup functions for all story events
 */

import type { StoryEvent, StoryEventTag } from '../../types/storyEvents';
import { welcomeEvents } from './welcomeEvents';
import { coachEvents } from './coachStoryline';
import { romanceEvents } from './romanceStoryline';
import { careerEvents } from './careerStoryline';
import { familyEvents } from './familyStoryline';
import { rivalEvents } from './rivalStoryline';
import { milestoneEvents } from './milestoneEvents';

// Combine all events from different storylines
const ALL_EVENTS: StoryEvent[] = [
  ...welcomeEvents,
  ...coachEvents,
  ...romanceEvents,
  ...careerEvents,
  ...familyEvents,
  ...rivalEvents,
  ...milestoneEvents,
];

/**
 * Story Event Repository
 * Provides functions to query and retrieve story events
 */
export const StoryEventRepository = {
  /**
   * Get all story events
   */
  getAllEvents(): StoryEvent[] {
    return ALL_EVENTS;
  },

  /**
   * Get a specific event by ID
   */
  getEventById(id: string): StoryEvent | undefined {
    return ALL_EVENTS.find((event) => event.id === id);
  },

  /**
   * Get events by a single tag
   */
  getEventsByTag(tag: StoryEventTag): StoryEvent[] {
    return ALL_EVENTS.filter((event) => event.tags.includes(tag));
  },

  /**
   * Get events matching any of the provided tags
   */
  getEventsByTags(tags: StoryEventTag[]): StoryEvent[] {
    return ALL_EVENTS.filter((event) => event.tags.some((tag) => tags.includes(tag)));
  },

  /**
   * Get linear events (no player choices)
   */
  getLinearEvents(): StoryEvent[] {
    return ALL_EVENTS.filter((event) => event.options.length === 0);
  },

  /**
   * Get choice events (has player choices)
   */
  getChoiceEvents(): StoryEvent[] {
    return ALL_EVENTS.filter((event) => event.options.length > 0);
  },
};
