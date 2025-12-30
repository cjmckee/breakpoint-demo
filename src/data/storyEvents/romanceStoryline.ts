/**
 * Romance Storyline Events
 * Events related to meeting and developing a relationship with Alex
 */

import type { StoryEvent } from '../../types/storyEvents';

export const romanceEvents: StoryEvent[] = [
  {
    id: 'romance_meet_tournament',
    name: 'Meeting Alex',
    tags: ['romance', 'tournament', 'intro'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesPlayed: 3,
      minDay: 10,
    },
    description: 'You meet someone interesting at a local tournament.',
    dialogue: `Alex: "Great match out there! I saw that backhand winner on match point - incredible shot. I've been working on my own backhand technique. Maybe we could practice together sometime?"`,
    characters: ['alex'],
    options: [],
    defaultOutcome: {
      resultText: 'You chat with Alex about tennis for a while. They seem genuinely interested in your tennis journey and share some of their own experiences. You exchange contact information before parting ways.',
      effects: {
        moodChange: 20,
        energyChange: 0,
        relationshipChanges: { alex: 20 },
      },
    },
  },

  {
    id: 'romance_coffee_date',
    name: 'Coffee with Alex',
    tags: ['romance', 'friend', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_meet_tournament'],
      relationships: { alex: { min: 15 } },
    },
    description: 'Alex invites you to grab coffee after practice.',
    dialogue: `Alex: "Hey! I know this great café near the courts. Want to go after we finish up here? My treat!"`,
    characters: ['alex'],
    options: [
      {
        id: 'serious_talk',
        text: 'Talk about tennis goals',
        emoji: '🎾',
        description: 'Keep the conversation focused on tennis',
        outcome: {
          resultText: 'You have a deep conversation about your tennis ambitions over coffee. Alex shares their own competitive experiences and offers helpful advice based on what they\'ve learned. You gain valuable insights into tournament preparation.',
          effects: {
            statBoosts: { focus: 2, anticipation: 1 },
            moodChange: 15,
            energyChange: -5,
            relationshipChanges: { alex: 10 },
          },
        },
      },
      {
        id: 'fun_outing',
        text: 'Get to know them better',
        emoji: '☕',
        description: 'Learn more about Alex as a person',
        outcome: {
          resultText: 'You spend a relaxed afternoon learning about each other beyond tennis. Alex has a great sense of humor and you find yourself laughing a lot. The conversation flows naturally, and you discover you have a lot in common.',
          effects: {
            moodChange: 25,
            energyChange: 0,
            relationshipChanges: { alex: 25 },
          },
        },
      },
      {
        id: 'reschedule',
        text: 'Reschedule for later',
        emoji: '📅',
        description: 'Too busy with training right now',
        outcome: {
          resultText: 'You explain that you need to focus on training right now and ask if you can reschedule. Alex seems understanding but you can tell they\'re a bit disappointed.',
          effects: {
            statBoosts: { focus: 1 },
            moodChange: 0,
            energyChange: 0,
            relationshipChanges: { alex: -5 },
          },
        },
      },
    ],
  },
];
