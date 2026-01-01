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
      [null, ['You stand at the entrance of the Riverside Tennis Academy, your tennis bag slung over your shoulder. The sound of balls being struck echoes across the pristine courts. This is it - the beginning of your professional tennis journey.']],
      ['jordan_rival', ['Are you lost? This is THE Riverside Tennis Academy. Twisted Knee Pickleball Academy is on the other side of the parking lot.']],
      ['player', ['I just started here. It\'s my first day. I\'m here to train. You guys do Padel too?']],
      ['jordan_rival', ['I hope you know what you\'re getting into. This place is no joke. We\'ve got players from all over the country, and countries you\'ve never even heard of.']],
      ['jordan_rival', ['Just remember, everyone here is gunning for you. Well, that\'s actually not quite true. It\'s just me gunning for you.']],
      ['player', ['What\'s your problem?']],
      ['jordan_rival', ['And soon, everyone at this academy will know my name...']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: [`You feel a mixture of excitement and nerves as you head to your room. It's only been a few weeks since you received that unexpected acceptance letter. If you want to make it in the tennis world, this is just the start. Also, who even was that guy?`],
      effects: {
        statChanges: {},
        moodChange: 20, // Excitement about the new beginning
        energyChange: 0,
        relationshipChanges: {
          jordan_rival: -10, // Jordan being jordan
        },
      },
    },
  },
];
