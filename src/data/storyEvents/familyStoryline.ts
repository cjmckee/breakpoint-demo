/**
 * Family Storyline Events
 * Events related to the player's family relationships and support system
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { CHALLENGE_MAKE_THEM_PROUD, CHALLENGE_SIBLING_TEACHER } from '../challengeTemplates';

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
        statChanges: { dropShot: 1, slice: 1, serve: 1, forehand: 1 },
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
            statChanges: { focus: 1, strength: 3, stamina: 2, speed: 2, recovery: 1 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { family: 20 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_MAKE_THEM_PROUD, {
              type: 'story',
              eventId: 'family_sacrifice',
            }),
          ],
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
            statChanges: { focus: 1, anticipation: 2, slice: 1 },
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
            statChanges: { focus: 1, recovery: 2, shotVariety: 2 },
            moodChange: 10,
            energyChange: 0,
            relationshipChanges: { family: 30 },
          },
        },
      },
    ],
  },

  {
    id: 'family_dinner_disaster',
    name: 'Dinner Table Demo',
    tags: ['family', 'misc'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['family_support'],
      minDay: 15,
    },
    skippable: true,
    description: 'A family dinner takes an unexpected turn when you try to demonstrate your new serve.',
    dialogue: [
      ['parent', ["We want to hear all about the training! Show us something you've learned!"]],
    ],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['You pick up a dinner roll to demonstrate your new serve toss. Everyone watches expectantly. The roll goes up, you snap your wrist, and you absolutely crater a water glass. There\'s a brief silence. Then your parent pulls out their phone and asks you to do it again "for the family group chat." Your dad starts clapping. Your serve technique is unquestionably better.'],
      effects: {
        statChanges: { serve: 2, strength: 1, shotVariety: 1 },
        moodChange: 20,
        energyChange: -5,
        relationshipChanges: { family: 15 },
      },
    },
  },

  {
    id: 'family_sibling_rivalry',
    name: 'The Backyard Challenge',
    tags: ['family', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['family_support'],
      minDay: 20,
    },
    skippable: true,
    description: "Your younger sibling is convinced they can beat you at tennis.",
    dialogue: [
      ['parent', ["Your sibling has been practicing against the garage wall for two weeks. They are absolutely convinced they can beat you now. They've been talking about it all week."]],
    ],
    characters: ['parent'],
    options: [
      {
        id: 'let_them_win',
        text: 'Let them win graciously',
        emoji: '😊',
        description: 'Be a good sport about it',
        outcome: {
          resultText: ['You engage in the most elaborate display of slow-motion errors ever seen on a residential driveway. Your sibling demolishes you 10-2 and runs victory laps around the car. Your parent films the whole thing. It\'s adorable. Your patience and defensive footwork are somehow improved from all the deliberate maneuvering.'],
          effects: {
            statChanges: { defensive: 2, recovery: 2, agility: 1 },
            moodChange: 20,
            energyChange: -10,
            relationshipChanges: { family: 20 },
          },
        },
      },
      {
        id: 'actually_compete',
        text: 'Actually try your hardest',
        emoji: '😤',
        description: 'No mercy. Not even a little.',
        outcome: {
          resultText: ['You decide that if they want a challenge, they\'ll get one. You win 10-0. Your sibling stares at you for a long moment, then says "okay so I need to train harder." This is oddly motivating for both of you. Your competitive edge feels sharpened.'],
          effects: {
            statChanges: { forehand: 2, serve: 2, offensive: 2 },
            moodChange: 20,
            energyChange: -15,
            relationshipChanges: { family: 5 },
          },
        },
      },
      {
        id: 'coach_them_instead',
        text: 'Turn it into a lesson',
        emoji: '🎓',
        description: 'Maybe you can teach them something',
        outcome: {
          resultText: ['You spend two hours breaking down grip, footwork, and ball toss. Your sibling is actually a quick learner. At some point you realize that explaining techniques out loud is clarifying them in your own head too. Teaching is, somehow, training.'],
          effects: {
            statChanges: { placement: 2, spin: 2, anticipation: 1 },
            moodChange: 25,
            energyChange: -15,
            relationshipChanges: { family: 25 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_SIBLING_TEACHER, {
              type: 'story',
              eventId: 'family_sibling_rivalry',
            }),
          ],
        },
      },
    ],
  },

  {
    id: 'family_care_package',
    name: 'Care Package',
    tags: ['family', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['family_sacrifice'],
      minDay: 35,
    },
    skippable: true,
    description: 'Your family sends a care package to the academy.',
    dialogue: [
      ['parent', ["We put together a few things we thought you'd need. Your grandmother also included a letter. She thinks you play badminton, by the way. We didn't correct her."]],
    ],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['The box contains: two dozen homemade cookies, a sports drink variety pack, socks with little tennis racquets on them, and a framed photo of you at age seven in a massive tennis visor looking extremely serious. Grandma\'s letter encourages you to "keep shuttlecocking." You eat three cookies immediately. You feel genuinely, completely loved.'],
      effects: {
        statChanges: { stamina: 2, focus: 1, recovery: 2 },
        moodChange: 40,
        energyChange: 10,
        relationshipChanges: { family: 20 },
        itemsGained: [
          {
            id: 'grandmas_lucky_cookies',
            name: "Grandma's Lucky Cookies",
            description: 'A tin of homemade cookies. Somehow they taste exactly like confidence.',
            type: 'consumable',
            consumableEffect: {
              type: 'instant',
              instantEffects: {
                energyChange: 20,
                moodChange: 15,
              },
            },
          },
        ],
      },
    },
  },
];
