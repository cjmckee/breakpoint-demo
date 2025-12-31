/**
 * Welcome Events
 * Initial story events that introduce the player to the game world
 */

import type { StoryEvent } from '../../types/storyEvents';

export const welcomeEvents: StoryEvent[] = [
  {
    id: 'welcome_to_tennis_rpg',
    name: 'A New Beginning',
    tags: ['intro', 'coach'],
    timeSlotsRequired: 0, // Doesn't consume time - happens during character creation
    prerequisites: {
      minDay: 1,
      maxDay: 1,
      excludedEvents: ['welcome_to_tennis_rpg'], // Only trigger once ever
    },
    skippable: false,
    description: 'You arrive at the tennis academy for the first time, ready to begin your journey.',
    dialogue: [
      [null, 'You stand at the entrance of the Riverside Tennis Academy, your tennis bag slung over your shoulder. The sound of balls being struck echoes across the pristine courts. This is it - the beginning of your professional tennis journey.'],
      ['jordan_rival', 'Are you lost? This is THE Riverside Tennis Academy. The Twisted Knee Pickleball Academy is on the other side of the parking lot.'],
      ['jordan_rival', 'I hope you know what you\'re getting into. This place is no joke. We\'ve got players from all over the country, and countries you\'ve never even heard of.'],
      ['jordan_rival', 'Just remember, everyone here is gunning for you. Well, that\'s actually not quite true. It\'s just me gunning for you.'],
      ['jordan_rival', 'And everyone at this academy will know my name...'],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: [`You feel a mixture of excitement and nervousness as you head to your quarters. The weight of this decision settles over you - you've committed to this path. No turning back now.

As you unpack your belongings, you think about the journey ahead. Champion or not, you'll give this everything you have. Also, who even was that guy?`],
      effects: {
        statBoosts: {},
        moodChange: 20, // Excitement about the new beginning
        energyChange: 0,
        relationshipChanges: {
          jordan_rival: -10, // Jordan being jordan
        },
      },
    },
  },
];
