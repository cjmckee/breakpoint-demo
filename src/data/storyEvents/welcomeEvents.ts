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
    dialogue: `You stand at the entrance of the Riverside Tennis Academy, your tennis bag slung over your shoulder. The sound of balls being struck echoes across the pristine courts. This is it - the beginning of your professional tennis journey.

Coach Gonzalez approaches with a warm smile and a firm handshake. "Welcome! I've been expecting you. I've trained dozens of players over the years, and I can see you've got the fire in your eyes. That's good - you'll need it."

He gestures toward the courts. "This won't be easy. Tennis demands everything - your body, your mind, your heart. But if you're willing to put in the work, I'll help you reach heights you never imagined possible."

"We start training tomorrow morning. Get some rest tonight. Your new life begins at sunrise."`,
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: `You feel a mixture of excitement and nervousness as you head to your quarters. The weight of this decision settles over you - you've committed to this path. No turning back now.

As you unpack your belongings, you think about the journey ahead. Champion or not, you'll give this everything you have. Coach Gonzalez seems like someone who can help you get there.

Tomorrow, the real work begins.`,
      effects: {
        statBoosts: {},
        moodChange: 20, // Excitement about the new beginning
        energyChange: 0,
        relationshipChanges: {
          coach_gonzalez: 10, // Good first impression
        },
      },
    },
  },
];
