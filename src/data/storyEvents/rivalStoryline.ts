/**
 * Rival Storyline Events
 * Events related to competitive rivalries and confrontations
 */

import type { StoryEvent } from '../../types/storyEvents';

export const rivalEvents: StoryEvent[] = [
  {
    id: 'rival_first_encounter',
    name: 'Meeting Your Rival',
    tags: ['rival', 'intro', 'conflict'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['abilities_basics'],
    },
    skippable: true,
    description: 'You meet a talented player with a cocky attitude who seems determined to prove they\'re better than you.',
    dialogue: [
      ['jordan_rival', ['So you\'re the one everyone\'s been talking about? I\'ve won twice as many matches as you. When we finally play each other, I\'ll show everyone who the real talent is around here.']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ['You keep your composure despite ', { characterId: 'jordan_rival' }, '\'s arrogance. Their words sting a bit, but you channel that emotion into motivation. You make a mental note to prove yourself when the time comes.'],
      effects: {
        statChanges: { focus: 3, offensive: 2 },
        moodChange: -10,
        energyChange: 0,
        relationshipChanges: { jordan_rival: -20 },
      },
    },
  },

  {
    id: 'rival_confrontation',
    name: 'Rival Confrontation',
    tags: ['rival', 'conflict', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['rival_first_encounter'],
      minMatchesWon: 7,
      relationships: { jordan_rival: { max: -10 } },
    },
    skippable: true,
    description: 'Jordan approaches you before a tournament, trying to get in your head.',
    dialogue: [
      ['jordan_rival', ['I saw your last match. Sloppy footwork, weak backhand. I hope we get paired up in the tournament - it\'ll be an easy win for me. Unless you\'re scared and want to withdraw now?']],
    ],
    characters: ['jordan_rival'],
    options: [
      {
        id: 'confident_response',
        text: 'Respond Confidently',
        emoji: '😎',
        description: 'Stand your ground with confidence',
        prerequisites: {
          stats: { focus: { min: 25 } },
        },
        outcome: {
          resultText: ['You look ', { characterId: 'jordan_rival' }, ' straight in the eye and calmly say, "I\'ll let my tennis do the talking. See you on the court." Your confident composure clearly rattles them. You walk away feeling mentally stronger and more focused than ever.'],
          effects: {
            statChanges: { focus: 5, anticipation: 3, offensive: 2 },
            moodChange: 20,
            energyChange: -5,
            relationshipChanges: { jordan_rival: -10 },
          },
        },
      },
      {
        id: 'ignore_rival',
        text: 'Ignore Them',
        emoji: '🤐',
        description: 'Don\'t engage with the negativity',
        outcome: {
          resultText: ['You simply nod and walk past without engaging. ', { characterId: 'jordan_rival' }, ' seems frustrated by your lack of reaction. You maintain your focus and don\'t let their words affect your mental preparation.'],
          effects: {
            statChanges: { focus: 3, defensive: 2 },
            moodChange: 5,
            energyChange: 0,
            relationshipChanges: { jordan_rival: -5 },
          },
        },
      },
      {
        id: 'fire_back',
        text: 'Fire Back',
        emoji: '🔥',
        description: 'Match their trash talk',
        outcome: {
          resultText: ['You fire back with your own trash talk, listing ', { characterId: 'jordan_rival' }, '\'s recent losses and weaknesses. The exchange gets heated. While it felt good in the moment, you\'re a bit distracted now thinking about the confrontation instead of your game.'],
          effects: {
            statChanges: { offensive: 2 },
            moodChange: -5,
            energyChange: -10,
            relationshipChanges: { jordan_rival: -30 },
          },
        },
      },
    ],
  },
];
