/**
 * Romance Storyline Events
 * Events related to meeting and developing a relationship with Alex
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { CHALLENGE_IMPRESS_ALEX, CHALLENGE_PRACTICE_MAKES_PERFECT } from '../challengeTemplates';

export const romanceEvents: StoryEvent[] = [
  {
    id: 'romance_meet_tournament',
    name: 'Meeting Alex',
    tags: ['romance', 'intro'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesPlayed: 3,
      minDay: 10,
    },
    skippable: true,
    description: 'You meet someone interesting at a local tournament.',
    dialogue: [
      ['alex_romance', ['Great match out there! I saw that backhand winner on match point - incredible shot. I\'ve been working on my own backhand technique. Maybe we could practice together sometime?']],
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ['You chat with ', { characterId: 'alex_romance' }, ' about tennis for a while. They seem genuinely interested in your tennis journey and share some of their own experiences. You exchange contact information before parting ways.'],
      effects: {
        moodChange: 20,
        energyChange: 0,
        relationshipChanges: { alex_romance: 20 },
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_IMPRESS_ALEX, {
          type: 'story',
          eventId: 'romance_meet_tournament',
        }),
      ],
    },
  },

  {
    id: 'romance_coffee_date',
    name: 'Coffee with Alex',
    tags: ['romance', 'friend', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_meet_tournament'],
      relationships: { alex_romance: { min: 15 } },
    },
    skippable: true,
    description: 'Alex invites you to grab coffee after practice.',
    dialogue: [
      ['alex_romance', ['Hey! I know this great café near the courts. Want to go after we finish up here? My treat!']],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'serious_talk',
        text: 'Talk about tennis goals',
        emoji: '🎾',
        description: 'Keep the conversation focused on tennis',
        outcome: {
          resultText: ['You have a deep conversation about your tennis ambitions over coffee. ', { characterId: 'alex_romance' }, ' shares their own competitive experiences and offers helpful advice based on what they\'ve learned. You gain valuable insights into tournament preparation.'],
          effects: {
            statChanges: { dropShot: 1, volley: 1, anticipation: 1 },
            moodChange: 15,
            energyChange: -5,
            relationshipChanges: { alex_romance: 10 },
          },
        },
      },
      {
        id: 'fun_outing',
        text: 'Get to know them better',
        emoji: '☕',
        description: 'Learn more about Alex as a person',
        outcome: {
          resultText: ['You spend a relaxed afternoon learning about each other beyond tennis. ', { characterId: 'alex_romance' }, ' has a great sense of humor and you find yourself laughing a lot. The conversation flows naturally, and you discover you have a lot in common.'],
          effects: {
            moodChange: 25,
            energyChange: 0,
            relationshipChanges: { alex_romance: 25 },
          },
        },
      },
      {
        id: 'reschedule',
        text: 'Reschedule for later',
        emoji: '📅',
        description: 'Too busy with training right now',
        outcome: {
          resultText: ['You explain that you need to focus on training right now and ask if you can reschedule. ', { characterId: 'alex_romance' }, ' seems understanding but you can tell they\'re a bit disappointed.'],
          effects: {
            statChanges: { recovery: 1 },
            moodChange: 0,
            energyChange: 0,
            relationshipChanges: { alex_romance: -5 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_park_practice',
    name: 'Practice at the Park',
    tags: ['romance', 'training'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_coffee_date'],
      relationships: { alex_romance: { min: 25 } },
    },
    skippable: true,
    description: 'You run into Alex at the city park.',
    dialogue: [
      [null, ['You take a jog through the park, and you see a familiar face out on the public courts.']],
      [null, ['As you get a little closer, you can see ', {characterId: 'alex_romance'}, ' teaching a group of junior players. You wish your coaches were that cute.']],
      ['alex_romance', ['Hey, ', {characterId: 'player'}, '! Come join us! These kids are getting a bit uppity.']],
      ['alex_romance', ['They think just because I go easy on them, I don\'t have a little pop of my own! Let\'s show them a real session.']],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'go_all_out',
        text: 'Go all out',
        emoji: '😣',
        description: 'You\'re one of the best club players at the academy. Show your stuff!',
        outcome: {
          resultText: ['You give your full effort over a few points and play some incredible rallies. The juniors watch with a series of "oohs" and "ahhs." You manage to edge out ', { characterId: 'alex_romance' }, ', but it was a lot harder than you expected. You both had a lot of fun, and the kids were impressed. You\'re starting to think about more excuses to spend time with Alex.'],
          effects: {
            statChanges: { return: 2, agility: 1, recovery: 1 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { alex_romance: 15 },
          },
        },
      },
      {
        id: 'let_alex_show_off',
        text: 'Let Alex Show Off',
        emoji: '😏',
        description: 'Take a little off and let Alex be the star',
        outcome: {
          resultText: ['You don\'t want to steal anyone\'s thunder, and ', { characterId: 'alex_romance' }, ' takes NO mercy on you. They start pushing you all over the court and even land a tweener to further embarrass you. The kids love it and think ', {characterId: 'alex_romance'}, ' is the best coach ever. You manage to crack a smile even catching wind. Alex has a smile you\'d trade it all for.'],
          effects: {
            statChanges: { return: 1, defensive: 2, shotVariety: 1 },
            moodChange: 25,
            energyChange: -15,
            relationshipChanges: { alex_romance: 10 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_movie_night',
    name: 'Tennis Movie Night',
    tags: ['romance', 'misc'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['romance_park_practice'],
      relationships: { alex_romance: { min: 35 } },
    },
    skippable: true,
    description: 'Alex suggests watching a tennis movie together.',
    dialogue: [
      [null, ['You finish a long volley session and finally make it back to your room. You collapse on the bed and check your messages.']],
      ['alex_romance', ['"My coach just assigned me some film study, but he\'s letting me pick the movie. I\'ve got some popcorn with your name on it!"']],
      [null, ['You feel a jolt of energy, and suddenly your legs aren\'t quite so sore. You\'re outside in a matter of seconds.']],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'watch_serious_film',
        text: 'Watch a gritty tennis drama',
        emoji: '🎬',
        description: 'Intense. Focused. Inspiring, but sad.',
        outcome: {
          resultText: ['You watch two hours of absolute psychological tennis warfare. At some point ', { characterId: 'alex_romance' }, ' gets genuinely emotional during a tiebreak scene. You both sit in silence for a full minute after the credits. You don\'t know what to say, but your mental game somehow feels stronger.'],
          effects: {
            statChanges: { focus: 2, anticipation: 2, defensive: 1 },
            moodChange: 15,
            energyChange: 5,
            relationshipChanges: { alex_romance: 12 },
          },
        },
      },
      {
        id: 'watch_romcom',
        text: 'Watch a tennis romcom',
        emoji: '💕',
        description: 'Extremely unrealistic tennis. Great vibes.',
        outcome: {
          resultText: ['You watch a qualifier improbably fall in love AND win Wimbledon against all odds. The tennis is physically impossible, but it\'s flashy and fun. You and ', { characterId: 'alex_romance' }, ' spend half the film loudly recreating the goofy swings. You fall asleep for about ten minutes somewhere in the third set. Alex doesn\'t mention it.'],
          effects: {
            moodChange: 30,
            energyChange: 10,
            relationshipChanges: { alex_romance: 25 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_professional_match',
    name: 'Professional Match Date',
    tags: ['romance', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_movie_night'],
      relationships: { alex_romance: { min: 50 } },
    },
    skippable: true,
    description: "You get the opportunity to watch a local professional match with Alex",
    dialogue: [
      [null, ['You scored some last-minute tickets to a match between some of the best pros in the area. You bring ', {characterId: 'alex_romance'}, ' along.']],
      [null, ['As you walk to your seats, almost all of the coaches seem to know ', {characterId: 'alex_romance'}, '. They seem super knowledgeable throughout the match, and you have a lot of fun chatting with them.']],
      ['alex_romance', ['Okay so... I maybe didn\'t mention this, but I played in junior nationals with some of these players a few years back.']],
      ['alex_romance', ['I was one of the best players in the country at the time, but it just never really panned out for me.']],
      ['alex_romance', ['Now, I get the most fun from coaching and helping others achieve their dreams. I know what it takes to get to the top level, and I want to help light that fire in others.']],
    ],
    characters: ['alex_romance'],
    options: [],
    defaultOutcome: {
      resultText: ['You spend the rest of the match chatting about life beyond tennis. You find yourself a little more focused on the tennis journey, and a little more focused on Alex as well.'],
      effects: {
        statChanges: { backhand: 3, volley: 2, return: 2 },
        moodChange: 10,
        energyChange: -20,
        relationshipChanges: { alex_romance: 15 },
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_PRACTICE_MAKES_PERFECT, {
          type: 'story',
          eventId: 'romance_professional_match',
        }),
      ],
    },
  },
];
