/**
 * Family Storyline Events
 * Events related to the player's family relationships and support system
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { CHALLENGE_MAKE_THEM_PROUD, CHALLENGE_SIBLING_TEACHER } from '../challengeTemplates';
import { GRANDMAS_LUCKY_COOKIES, LUCKY_JACKET } from '../items';

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
    id: 'family_investment',
    name: 'Family Investment',
    tags: ['family', 'decision', 'conflict'],
    timeSlotsRequired: 2,
    prerequisites: {
      minDay: 25,
      completedEvents: ['family_support'],
    },
    skippable: true,
    description: 'Your family reveals they\'ve been investing in your tennis career.',
    dialogue: [
      ['parent', ['We need to talk about something. A few years ago, we made quite a big investment hoping if it paid off, we\'d be able to fund your tennis career.']],
      ['parent', ['However, that investment which we thought was bulletproof - has defied all odds and gone belly up.']],
      ['parent', ['Some visionaries are ahead of their time, and soon the world will see the mistake it made by passing up on our invention - purple clay.']],
      ['parent', ['Unfortunately, you\'re on your own until we can figure out our next venture. And that means cash could be tight.']],
    ],
    characters: ['parent'],
    options: [
      {
        id: 'redouble_commitment',
        text: 'Redouble Commitment',
        emoji: '💪',
        description: 'Work even harder',
        outcome: {
          resultText: ['You feel a sudden inspiration. You know there\'s no turning back now. You feel the pressure to keep pushing in your tennis career. Purple clay does sound pretty cool, though.'],
          effects: {
            statChanges: { focus: 1, strength: 3, stamina: 2, speed: 2, recovery: 1 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { family: 20 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_MAKE_THEM_PROUD, {
              type: 'story',
              eventId: 'family_investment',
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
          resultText: ['You look for sponsors to help with your training costs and save the burden on your family. The options are getting shadier and shadier as you keep looking. I hope you won\'t be forced to make a deal you\'ll regret.'],
          effects: {
            statChanges: { focus: 1, anticipation: 2, slice: 1 },
            moodChange: 10,
            energyChange: -10,
            relationshipChanges: { family: 15 },
          },
        },
      },
      {
        id: 'become_salesman',
        text: 'Offer to Help',
        emoji: '🤝',
        description: 'Offer to help with their investment.',
        outcome: {
          resultText: ['You can be pretty persuasive, and purple clay sounds like a dream. You offer to try and sell this thing as hard as you can to recover some losses.'],
          effects: {
            statChanges: { focus: -1, recovery: 2, shotVariety: 2, speed: 1 },
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
      ['player', ['Well, I\'ve really been working on my second serve. But there\'s not enough room here to show it off.']],
      ['parent', ['Nonsense! We have plenty of space.']],
      [null, ['They toss you a dinner roll. You look around to confirm the waiter isn\'t around.']]
    ],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['You stand up to demonstrate your new serve toss. Everyone watches expectantly. The roll goes up, you snap your wrist, and you absolutely crater a water glass across the table. There\'s a brief silence. Then, applause. Cheering. Yelling from the waiter. Your serve technique is unquestionably better.'],
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
    description: "Your younger sibling is convinced they can beat you in a little driveway tennis.",
    dialogue: [
      ['parent', ["Your little brother has been practicing against the garage wall for two weeks. He is completely convinced he can beat you now. He's been talking about it all week."]],
    ],
    characters: ['parent'],
    options: [
      {
        id: 'let_them_win',
        text: 'Let them win graciously',
        emoji: '😊',
        description: 'Be a good sport about it',
        outcome: {
          resultText: ['You engage in the most elaborate display of slow-motion errors ever seen on a residential driveway. You lose 10-2 and your little brother runs victory laps around the car. Your patience and defensive footwork are somehow improved from all the deliberate maneuvering.'],
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
          resultText: ['You decide that if they want a challenge, they\'ll get one. You win 10-0. Your brother stares at you for a long moment, then breaks into tears. This is oddly motivating for both of you. Your competitive edge feels sharpened. Your little brother may be picking another sport.'],
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
          resultText: ['You spend two hours breaking down grip, footwork, and swing plane. Your brother is actually a quick learner. At some point you realize that explaining techniques out loud is helping to clarify them in your own head too. Teaching is, somehow, training.'],
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
    name: 'Family Care Package',
    tags: ['family', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['family_investment'],
      minDay: 35,
    },
    skippable: true,
    description: 'Your family sends a care package to the academy.',
    dialogue: [
      [null, ['A package appears on your doorstep and you pull it inside. It smells delicious.']],
      ['parent', ["We put together a few things we thought you'd need. Your grandmother also included a letter. She thinks you play badminton, by the way. We didn't correct her."]],
      ['parent', ['Plus I threw in an old ski jacket I have from the 90s. Maybe you can bring the style back.']]
    ],
    characters: ['parent'],
    options: [],
    defaultOutcome: {
      resultText: ['The box contains: two dozen homemade cookies, a sports drink variety pack, socks with little tennis racquets on them, and a framed photo of you at age seven in a massive tennis visor. Grandma\'s letter encourages you to "keep shuttlecocking." You feel loved.'],
      effects: {
        statChanges: { stamina: 2, focus: 1, recovery: 2 },
        moodChange: 40,
        energyChange: 10,
        relationshipChanges: { family: 20 },
        itemsGained: [GRANDMAS_LUCKY_COOKIES, LUCKY_JACKET],
      },
    },
  },
];
