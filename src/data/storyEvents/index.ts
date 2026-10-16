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
import { tournamentEvents } from './tournamentStoryline';
import { miscEvents } from './miscEvents';
import { interactionEvents } from './interactionEvents';
import { CONTENT_END_EVENT } from '../seasons';
import { CLUB_SEASON } from '../seasons/club';

/**
 * Events that play after the Club season ends but belong to it: the end card the
 * morning after promotion.
 */
const CLUB_EPILOGUE = new Set([CONTENT_END_EVENT]);

/**
 * What makes an event the Club season's own: its calendar (the beats and the
 * chains they start), its team matches and tournament, and the tutorial. Those
 * are written again for each season.
 */
const SEASON_TAGS: readonly StoryEventTag[] = [
  'team',
  'story_match',
  'tournament_match',
  'tournament_ceremony',
  'tutorial',
];
const CLUB_BEATS = new Set(CLUB_SEASON.beats.map((beat) => beat.storyEventId));
/** Club-only for what they say: the first-day welcome, and an invitation "up" to Regional. */
const CLUB_ONLY = new Set(['welcome_to_tennis_rpg', 'tournament_invitation']);

/**
 * Gates every event in these files by season, unless it names its own tier.
 * The Club season's own content stops at promotion. Everything else, the
 * characters' storylines, hangouts and random events, is available from Club
 * on: the people come with you, so what you didn't get to with them is still
 * there. A later season's events live in their own files and set their own tier.
 */
function clubSeason(event: StoryEvent): StoryEvent {
  if (event.prerequisites.tier || CLUB_EPILOGUE.has(event.id)) return event;
  const seasonal =
    CLUB_ONLY.has(event.id) ||
    CLUB_BEATS.has(event.id) ||
    event.tags.some((tag) => SEASON_TAGS.includes(tag));
  return {
    ...event,
    prerequisites: { ...event.prerequisites, tier: seasonal ? { max: 1 } : { min: 1 } },
  };
}

const CLUB_EVENTS: StoryEvent[] = [
  ...welcomeEvents,
  ...coachEvents,
  ...romanceEvents,
  ...careerEvents,
  ...familyEvents,
  ...rivalEvents,
  ...milestoneEvents,
  ...tournamentEvents,
  ...miscEvents,
  ...interactionEvents,
].map(clubSeason);

// Later seasons' files go after the Club's, each setting its own tier.
const ALL_EVENTS: StoryEvent[] = [...CLUB_EVENTS];

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
