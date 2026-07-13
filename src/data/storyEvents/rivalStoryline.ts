/**
 * Rival Storyline Events
 * Events related to competitive rivalries and confrontations
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { CHALLENGE_PROVE_THEM_WRONG, CHALLENGE_RIVAL_READY, CHALLENGE_DOUBLES_INSTINCTS } from '../challengeTemplates';

export const rivalEvents: StoryEvent[] = [
  {
    id: 'rival_first_encounter',
    name: 'Meeting Your Rival',
    tags: ['rival', 'intro', 'conflict'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['shop_basics'],
    },
    skippable: false,
    description: 'You meet a talented player with a cocky attitude who seems determined to prove they\'re better than you.',
    dialogue: [
      ['jordan_rival', ['So you\'re the one everyone\'s been talking about? I\'ve won twice as many matches as you. When we finally play each other, I\'ll show everyone who the real talent is around here.']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ['You do the mental math. It\'s not really that good of an insult, actually. But ', {characterId: 'Jordan'}, ' already left anyway.'],
      effects: {
        statChanges: { focus: 1, offensive: 2, overhead: 2 },
        moodChange: -10,
        energyChange: 0,
        relationshipChanges: { jordan_rival: -20 },
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_PROVE_THEM_WRONG, {
          type: 'story',
          eventId: 'rival_first_encounter',
        }),
      ],
    },
  },

  {
    id: 'rival_confrontation',
    name: 'Rival Confrontation',
    tags: ['rival', 'conflict'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['rival_first_encounter'],
      minMatchesWon: 7,
      relationships: { jordan_rival: { max: -10 } },
    },
    skippable: false,
    description: 'Jordan approaches you before a tournament, trying to get in your head.',
    dialogue: [
      ['jordan_rival', ['I saw your last match. Sloppy footwork, weak backhand. I hope we get paired up in the tournament - it\'ll be an easy win for me. Unless you\'re scared and want to withdraw now?']],
      [null, ['You try not to let it get to you, but you can\'t stop thinking about the spaghetti sauce stain on ', {characterId: 'Jordan'}, '\'s shirt.']],
      [null, ['Kind of blanked there for a second, actually. You realize you didn\'t even hear what they said. You\'re further distracted by a waft of garlic bread.']]
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: ['The most hurtful part of that exchange is that no one told you there was italian in the Academy cafeteria. You love italian. Mama mia.'],
      effects: {
        statChanges: { recovery: 2, slice: 2, defensive: 2 },
        moodChange: -5,
        energyChange: 0,
        relationshipChanges: { jordan_rival: 5 },
      },
    }
  },

  {
    id: 'rival_doubles_disaster',
    name: 'Forced Partners',
    tags: ['rival', 'conflict', 'misc'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['rival_confrontation'],
    },
    skippable: false,
    description: "Coach Gonzalez assigns you and Jordan as doubles partners for a drill. This is not going to be fun.",
    dialogue: [
      ['coach_gonzalez', ["I'm pairing you with Jordan today. You will play doubles. You will communicate. You will not kill each other. These are not suggestions."]],
      ['jordan_rival', ["...This is beneath me. If you get in my way even once, I swear..."]],
    ],
    characters: ['coach_gonzalez', 'jordan_rival'],
    options: [
      {
        id: 'win_without_them',
        text: 'Try to win without them',
        emoji: '📣',
        description: 'Focus on yourself and let Jordan embarrass themselves',
        outcome: {
          resultText: ['You control what you can control. Every few shots, ', { characterId: 'jordan_rival' }, ' comes flying in to take a ball that should be yours. They hit it out. ', { characterId: 'coach_gonzalez' }, ' tells them not to swing at volleys. Small victories.'],
          effects: {
            statChanges: { offensive: 2, return: 1, strength: 1 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { jordan_rival: -15 },
            hangoutUnlocks: ['jordan_rival'],
          },
        },
      },
      {
        id: 'adapt_your_game',
        text: 'Adapt your game around them',
        emoji: '🧩',
        description: 'Try to play around Jordan',
        outcome: {
          resultText: ['You end up needing to play a lot stronger defense to support Jordan, but it turns into a fun challenge. Exhausting, but fun.'],
          effects: {
            statChanges: { defensive: 2, return: 2, anticipation: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { jordan_rival: 5 },
            hangoutUnlocks: ['jordan_rival'],
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_DOUBLES_INSTINCTS, {
              type: 'story',
              eventId: 'rival_doubles_disaster',
            }),
          ],
        },
      },
      {
        id: 'aim_at_jordan',
        text: 'Aim a return at Jordan',
        emoji: '🎯',
        description: 'Purely accidental, of course',
        outcome: {
          resultText: ['Towards the end of the drill, you get a slowly bouncing ball at the baseline and decide to take a very healthy swing. It "accidentally" catches them square in the butt and they jump about six feet straight in the air. That one is going to leave a bruise.'],
          effects: {
            statChanges: { offensive: 3, speed: 1, agility: 1 },
            moodChange: 20,
            energyChange: -15,
            relationshipChanges: { jordan_rival: -20 },
            hangoutUnlocks: ['jordan_rival'],
          },
        },
      },
    ],
  },

  {
    id: 'rival_jordan_humbled',
    name: 'A Different Side',
    tags: ['rival', 'conflict', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['rival_confrontation'],
      minMatchesWon: 10,
    },
    skippable: false,
    description: "You witness Jordan get absolutely demolished in a practice match.",
    dialogue: [
      [null, ["Jordan is playing a top seed in a practice session. By the third game, it's already clear this isn't going to be close."]],
    ],
    characters: ['jordan_rival'],
    options: [
      {
        id: 'offer_encouragement',
        text: 'Offer a word of encouragement',
        emoji: '🤝',
        description: 'Be the bigger person',
        outcome: {
          resultText: ['After the match, you walk over and say something simple. "Good fight." ', { characterId: 'jordan_rival' }, ' looks at you with contempt. You continue: "I\'ve seen him do worse to even tournament champions." That seems to soften Jordan up a little.'],
          effects: {
            statChanges: { focus: 2, defensive: 2, recovery: 1 },
            moodChange: 20,
            energyChange: 0,
            relationshipChanges: { jordan_rival: 20 },
          },
        },
      },
      {
        id: 'walk_past',
        text: 'Walk past without comment',
        emoji: '🚶',
        description: 'Let them have their moment',
        outcome: {
          resultText: ['You have nothing to say, so you say nothing. ', { characterId: 'jordan_rival' }, ' is still staring at their racquet when you pass. The understanding is clear, and no need to rub it in. Your focus returns to your own game.'],
          effects: {
            statChanges: { focus: 2, anticipation: 1 },
            moodChange: 10,
            energyChange: 0,
            relationshipChanges: { jordan_rival: 0 },
          },
        },
      },
      {
        id: 'say_something_cutting',
        text: 'Say something cutting',
        emoji: '😈',
        description: 'They had it coming',
        outcome: {
          resultText: ['You stop. You look at the scoreboard. You look at ', { characterId: 'jordan_rival' }, '. "At least he was nice enough to give you a free lesson." They look up. You walk away before they can respond. Your competitive fire is still alive.'],
          effects: {
            statChanges: { offensive: 2, serve: 1 },
            moodChange: 10,
            energyChange: 0,
            relationshipChanges: { jordan_rival: -25 },
          },
        },
      },
    ],
  },

  {
    id: 'rival_unexpected_respect',
    name: 'Unexpected Rival Respect',
    tags: ['rival'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['rival_confrontation'],
      minMatchesWon: 10,
      relationships: { jordan_rival: { min: -10 } },
    },
    skippable: false,
    description: "Jordan approaches you with something unusual: a compliment.",
    dialogue: [
      ['jordan_rival', ["I'm not going to make a big thing out of this. You've gotten better. That's all. Don't read into it."]],
      ['jordan_rival', ['I\'m proud of how far you\'ve come. But only because it reminds me that I\'ve come even further. So don\'t get such a big ego about it.']],
    ],
    characters: ['jordan_rival'],
    options: [],
    defaultOutcome: {
      resultText: [{ characterId: 'jordan_rival' }, ' walks away before you can respond. You stand there for a moment processing what just happened. You\'re not sure if this is the beginning of a rivalry or the beginning of something else. Either way, it feels like a milestone.'],
      effects: {
        statChanges: { focus: 3, anticipation: 2, offensive: 1 },
        moodChange: 25,
        energyChange: 0,
        relationshipChanges: { jordan_rival: 15 },
      },
    },
  },
];
