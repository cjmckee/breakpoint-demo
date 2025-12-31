/**
 * Family Storyline Events
 * Events related to the player's family relationships and support system
 */

import type { StoryEvent } from '../../types/storyEvents';

export const familyEvents: StoryEvent[] = [
  {
    id: 'family_support',
    name: 'Family Comes to Watch',
    tags: ['family', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesPlayed: 2,
      minDay: 7,
    },
    skippable: true,
    description: 'Your family surprises you by coming to watch one of your matches.',
    dialogue: [['parent', 'We\'re so proud of how hard you\'ve been working. We wanted to be here to support you. No pressure - just play your game and have fun out there!']],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['Seeing your family in the stands fills you with warmth and motivation. Their presence reminds you why you love tennis and gives you an extra boost of confidence. After the match, you spend quality time together celebrating your progress.'],
      effects: {
        statBoosts: { focus: 2, serve: 1, forehand: 1 },
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
    dialogue: [['parent', 'We need to talk about something. We\'ve been using our savings to help with your training costs - equipment, coaching fees, tournament entries. We believe in you, but it\'s been tight. We\'re not asking you to quit, but we wanted you to know the reality of what we\'re investing in your dream.']],
    characters: ['parent'],
    options: [
      {
        id: 'redouble_commitment',
        text: 'Redouble Commitment',
        emoji: '💪',
        description: 'Work even harder to honor their sacrifice',
        outcome: {
          resultText: ['You feel the weight of their sacrifice and promise to make it worthwhile. This knowledge fuels your training with new intensity. You\'re no longer just playing for yourself - you\'re playing for everyone who believes in you.'],
          effects: {
            statBoosts: { focus: 4, strength: 3, stamina: 2 },
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
        description: 'Look for sponsors to ease the burden',
        prerequisites: {
          stats: { mental: { min: 40 } },
        },
        outcome: {
          resultText: ['You decide to actively pursue sponsorships and financial assistance to reduce the burden on your family. You research programs, reach out to local businesses, and start networking. Your proactive approach impresses everyone and shows maturity beyond your years.'],
          effects: {
            statBoosts: { focus: 3, anticipation: 2 },
            moodChange: 20,
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
          resultText: ['You offer to cut back on some expenses - maybe fewer private lessons, or practicing with the club team more. Your family is touched by your consideration, but they insist they want to support your dream. The conversation brings you closer together.'],
          effects: {
            statBoosts: { focus: 2 },
            moodChange: 10,
            energyChange: 0,
            relationshipChanges: { family: 30 },
          },
        },
      },
    ],
  },
];
