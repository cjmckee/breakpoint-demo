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
        relationshipChanges: { alex: 20 },
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
      relationships: { alex: { min: 15 } },
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
          resultText: ['You spend a relaxed afternoon learning about each other beyond tennis. ', { characterId: 'alex_romance' }, ' has a great sense of humor and you find yourself laughing a lot. The conversation flows naturally, and you discover you have a lot in common.'],
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
          resultText: ['You explain that you need to focus on training right now and ask if you can reschedule. ', { characterId: 'alex_romance' }, ' seems understanding but you can tell they\'re a bit disappointed.'],
          effects: {
            statChanges: { recovery: 1 },
            moodChange: 0,
            energyChange: 0,
            relationshipChanges: { alex: -5 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_practice_together',
    name: 'Practice Partners [AI-gen]', // TODO: Complete this event
    tags: ['romance', 'training'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_coffee_date'],
      relationships: { alex: { min: 25 } },
    },
    skippable: true,
    description: 'Alex suggests hitting some balls together at the courts.',
    dialogue: [
      ['alex_romance', ["I booked court 4 for us. Fair warning: I've been told I'm very competitive. Like, maybe aggressively so."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'apologize_profusely',
        text: 'Apologize for the mishap',
        emoji: '😬',
        description: 'You may have nailed them with a stray ball',
        outcome: {
          resultText: ['On your third rally, you absolutely nail ', { characterId: 'alex_romance' }, ' in the shoulder with a forehand. They drop their racquet dramatically, stare at you for a long moment, then burst out laughing. You apologize for the next ten minutes. They say it\'s fine at least seven of those times.'],
          effects: {
            statChanges: { return: 2, agility: 1, recovery: 1 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { alex: 15 },
          },
        },
      },
      {
        id: 'claim_it_intentional',
        text: 'Claim it was intentional',
        emoji: '😏',
        description: 'Own the chaos',
        outcome: {
          resultText: ['"That was a warning shot," you tell ', { characterId: 'alex_romance' }, ' with a straight face. They stare at you, then immediately try to peg you with a ball from three feet away. You spend the rest of the session in the most chaotic rally of your life. Somehow your return game improves significantly.'],
          effects: {
            statChanges: { return: 1, offensive: 2, serve: 1 },
            moodChange: 25,
            energyChange: -15,
            relationshipChanges: { alex: 10 },
          },
        },
      },
      {
        id: 'ask_for_feedback',
        text: 'Ask for their feedback',
        emoji: '🎾',
        description: 'Get some actual coaching',
        outcome: {
          resultText: [{ characterId: 'alex_romance' }, ' turns out to be a surprisingly sharp analyst. They break down your footwork, spin, and ball placement with startling precision. You get the feeling they\'ve been holding back on you. But for now, your game feels sharper.'],
          effects: {
            statChanges: { placement: 2, spin: 2, return: 1 },
            moodChange: 15,
            energyChange: -20,
            relationshipChanges: { alex: 20 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_movie_night',
    name: 'Tennis Movie Night [AI-gen]', // TODO: Complete this event
    tags: ['romance', 'misc'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['romance_practice_together'],
      relationships: { alex: { min: 35 } },
    },
    skippable: true,
    description: 'Alex suggests watching a tennis movie together.',
    dialogue: [
      ['alex_romance', ["I have two options. One is a gritty psychological drama about tennis greatness and obsession. The other is a romcom where a qualifier somehow wins Wimbledon. I will not be judged for either choice."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'watch_serious_film',
        text: 'The gritty drama',
        emoji: '🎬',
        description: 'Intense. Focused. Very serious.',
        outcome: {
          resultText: ['You watch two hours of absolute psychological tennis warfare. At some point ', { characterId: 'alex_romance' }, ' gets genuinely emotional during a tiebreak scene. You both sit in silence for a full minute after the credits. You don\'t know what to say, but your mental game somehow feels stronger.'],
          effects: {
            statChanges: { focus: 2, anticipation: 2, defensive: 1 },
            moodChange: 15,
            energyChange: 5,
            relationshipChanges: { alex: 12 },
          },
        },
      },
      {
        id: 'watch_romcom',
        text: 'The Wimbledon romcom',
        emoji: '💕',
        description: 'Extremely unrealistic tennis. Great vibes.',
        outcome: {
          resultText: ['You watch a qualifier improbably fall in love AND win Wimbledon simultaneously. The tennis is physically impossible. You and ', { characterId: 'alex_romance' }, ' spend half the film loudly pointing out the inaccuracies and having a great time. You fall asleep for about ten minutes somewhere in the third set. Alex doesn\'t mention it.'],
          effects: {
            moodChange: 30,
            energyChange: 10,
            relationshipChanges: { alex: 25 },
          },
        },
      },
    ],
  },

  {
    id: 'romance_alex_secret',
    name: "Alex's Little Secret [AI-gen]", // TODO: Complete this event
    tags: ['romance', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['romance_movie_night'],
      relationships: { alex: { min: 50 } },
    },
    skippable: true,
    description: "You discover something surprising about Alex's tennis background.",
    dialogue: [
      ['alex_romance', ["Okay so... I maybe didn't mention this, but I played junior nationals? And like, placed okay? It's not a big deal."]],
      ['alex_romance', ["Top eight. In the country. But again - not a big deal. Why are you looking at me like that."]],
    ],
    characters: ['alex_romance'],
    options: [
      {
        id: 'demand_real_training',
        text: 'Ask for real training',
        emoji: '💪',
        description: 'No more holding back',
        outcome: {
          resultText: ['"Stop going easy on me," you tell ', { characterId: 'alex_romance' }, '. They look relieved, honestly. The next session is humbling in ways that aren\'t fully describable. But you come out sharper. More precise. A little emotionally bruised, but in a good way.'],
          effects: {
            statChanges: { backhand: 3, volley: 2, return: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { alex: 15 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_PRACTICE_MAKES_PERFECT, {
              type: 'story',
              eventId: 'romance_alex_secret',
            }),
          ],
        },
      },
      {
        id: 'play_it_cool',
        text: 'Play it cool',
        emoji: '😎',
        description: "That's fine. Totally fine.",
        outcome: {
          resultText: ['"Oh, cool," you say, as if top-eight nationally is completely normal. ', { characterId: 'alex_romance' }, ' raises an eyebrow. You maintain eye contact for a beat too long. They seem charmed by this. You absolutely are not fine.'],
          effects: {
            statChanges: { focus: 2, anticipation: 2 },
            moodChange: 15,
            energyChange: 0,
            relationshipChanges: { alex: 20 },
          },
        },
      },
      {
        id: 'challenge_right_now',
        text: 'Challenge them to a match right now',
        emoji: '🎾',
        description: 'IMMEDIATELY',
        outcome: {
          resultText: ['"Court 2. Now. Let\'s go," you say. ', { characterId: 'alex_romance' }, ' looks at you. Looks at the time. It is 9:45pm. "...okay," they say. You lose 6-1 in the first set before ', { characterId: 'alex_romance' }, ' takes obvious pity on you. You win one game in the second set. You are not embarrassed. You are motivated.'],
          effects: {
            statChanges: { offensive: 3, serve: 2, speed: 1 },
            moodChange: 10,
            energyChange: -25,
            relationshipChanges: { alex: 10 },
          },
        },
      },
    ],
  },
];
