/**
 * Family Storyline Events
 * Events related to the player's family relationships and support system
 */

import type { StoryEvent } from '../../types/storyEvents';

export const familyEvents: StoryEvent[] = [
  {
    id: 'family_support',
    name: 'Family Comes to a Match',
    tags: ['family', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesPlayed: 2,
      minDay: 7,
    },
    skippable: true,
    description: 'Your family surprises you by coming to watch one of your matches.',
    dialogue: [
      ['parent', ['We\'re so proud of how hard you\'ve been working. We wanted to be here to support you. And it just happens to be near the mall!']],
    ],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['Seeing your family in the stands fills you with warmth and motivation. It seems like mom figured out the phone camera and it even looks like dad knew the score! Everyone is making progress.'],
      effects: {
        statChanges: { focus: 2, serve: 1, forehand: 1 },
        moodChange: 35,
        energyChange: -5,
        relationshipChanges: { family: 25 },
      },
    },
  },

  {
    id: 'family_sacrifice',
    name: 'Family Sacrifice',
    tags: ['family', 'decision', 'conflict'],
    timeSlotsRequired: 2,
    prerequisites: {
      minDay: 25,
      completedEvents: ['family_support'],
    },
    skippable: true,
    description: 'Your family reveals they\'ve been making financial sacrifices to support your tennis career.',
    dialogue: [
      ['parent', ['We need to talk about something. We\'ve been using our savings to help with your training costs - equipment, coaching fees, tournament entries. We believe in you, but it\'s been tight.']],
      ['parent', ['We\'re not asking you to quit, but just know that we\'re giving our best to support you.']],
    ],
    characters: ['parent'],
    options: [
      {
        id: 'redouble_commitment',
        text: 'Redouble Commitment',
        emoji: '💪',
        description: 'Work even harder',
        outcome: {
          resultText: ['You feel a sudden inspiration. You\'re playing for everyone who believes in you, and you won\'t let them down.'],
          effects: {
            statChanges: { focus: 4, strength: 3, stamina: 2 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { family: 20 },
          },
        },
      },
      {
        id: 'find_sponsor',
        text: 'Seek Financial Help',
        emoji: '💼',
        description: 'Look for sponsors',
        outcome: {
          resultText: ['You look for sponsors to help with your training costs. The options are getting shadier and shadier as you keep looking. I hope you won\'t be forced to make a deal you\'ll regret.'],
          effects: {
            statChanges: { focus: 2, anticipation: 2 },
            moodChange: 10,
            energyChange: -10,
            relationshipChanges: { family: 15 },
          },
        },
      },
      {
        id: 'scale_back',
        text: 'Offer to Scale Back',
        emoji: '🤝',
        description: 'Suggest reducing training costs',
        outcome: {
          resultText: ['You offer to cut back on some expenses, but they insist they want to support your dream. You know you can find a way to make it work.'],
          effects: {
            statChanges: { focus: 5 },
            moodChange: 10,
            energyChange: 0,
            relationshipChanges: { family: 30 },
          },
        },
      },
    ],
  },
];
