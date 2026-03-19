/**
 * Coach Storyline Events
 * Events related to the player's relationship with Coach Gonzalez
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import {
  CHALLENGE_FOREHAND_FUNDAMENTALS,
  CHALLENGE_FIRST_VICTORIES,
  CHALLENGE_SERVE_MASTERY,
  CHALLENGE_BASELINE_WARRIOR,
  CHALLENGE_MENTAL_EDGE,
  CHALLENGE_BALANCED_APPROACH,
  CHALLENGE_ATHLETIC_FOUNDATION,
  CHALLENGE_TRICK_SHOT_MASTER,
} from '../challengeTemplates';

export const coachEvents: StoryEvent[] = [
  {
    id: 'coach_first_meeting',
    name: 'Meeting Coach Gonzalez',
    tags: ['coach', 'intro'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['abilities_basics'],
    },
    skippable: false,
    description: 'One of the academy\'s tennis coaches has taken interest in your development.',
    dialogue: [
      ['coach_gonzalez', ['I\'ve been watching you play. You have some raw talent, but you\'re going to need a lot of work to compete at this level.']],
      ['coach_gonzalez', ['I mean, look around. A former top 10 under-16 player over there. That guy played for Spain in the junior Olympics. And she\'s a two-time national champion committed to Duke now.']],
      ['coach_gonzalez', ['And that guy... he\'s the #4 rated player in a country I\'ve never even heard of.']],
      ['coach_gonzalez', ['You have a long way to go, kid. But I think I can help.']],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['You spend an hour listening to ', { characterId: 'coach_gonzalez' }, ' talk about his tennis experiences and what it takes to be the best. You realize you haven\'t even gotten a word in since you sat down. But you find it oddly helpful.'],
      effects: {
        statChanges: { dropShot: 1, overhead: 1, anticipation: 1 },
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { coach_gonzalez: 25 },
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_FOREHAND_FUNDAMENTALS, {
          type: 'story',
          eventId: 'coach_first_meeting',
        }),
        ChallengeManager.createFromTemplate(CHALLENGE_FIRST_VICTORIES, {
          type: 'story',
          eventId: 'coach_first_meeting',
        }),
      ],
    },
  },

  {
    id: 'coach_training_focus',
    name: 'Choose Your Focus',
    tags: ['coach', 'training', 'decision'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['coach_first_meeting'],
    },
    skippable: true,
    description: 'Coach Gonzalez wants to know what aspect of your game to prioritize in training.',
    dialogue: [
      ['coach_gonzalez', ['Everyone has different strengths and weaknesses. You - you have many weaknesses.']],
      ['coach_gonzalez', ['Let\'s take one of those weaknesses and make it just average!']],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'focus_serve',
        text: 'Serve Power',
        emoji: '🚀',
        description: 'Focus on developing a dominant serve',
        outcome: {
          resultText: ['You spend intensive sessions working on serve technique. ', { characterId: 'coach_gonzalez' }, ' helps you generate more power while maintaining accuracy. Your serve improves noticeably.'],
          effects: {
            statChanges: { serve: 5, strength: 3 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_SERVE_MASTERY, {
              type: 'story',
              eventId: 'coach_training_focus',
            }),
          ],
        },
      },
      {
        id: 'focus_baseline',
        text: 'Baseline Game',
        emoji: '🎯',
        description: 'Improve groundstrokes and consistency',
        outcome: {
          resultText: ['You work tirelessly on groundstroke mechanics. ', { characterId: 'coach_gonzalez' }, ' refines your technique on both wings. Your forehand and backhand both show marked improvement.'],
          effects: {
            statChanges: { forehand: 4, backhand: 4, defensive: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_BASELINE_WARRIOR, {
              type: 'story',
              eventId: 'coach_training_focus',
            }),
          ],
        },
      },
      {
        id: 'focus_mental',
        text: 'Mental Game',
        emoji: '🧠',
        description: 'Develop focus and competitive mindset',
        outcome: {
          resultText: [{ characterId: 'coach_gonzalez' }, ' introduces you to sports psychology techniques. You learn breathing exercises, visualization methods, and how to stay focused under pressure. The mental game is just as important as the physical.'],
          effects: {
            statChanges: { focus: 5, anticipation: 3, offensive: 2 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { coach_gonzalez: 20 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_MENTAL_EDGE, {
              type: 'story',
              eventId: 'coach_training_focus',
            }),
          ],
        },
      },
    ],
  },

  {
    id: 'coach_balanced_development',
    name: 'Building a Complete Game',
    tags: ['coach', 'training', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['coach_first_meeting'],
      minDay: 10,
    },
    skippable: true,
    description: 'Coach Gonzalez emphasizes the importance of developing all aspects of your game.',
    dialogue: [
      ['coach_gonzalez', ['You\'re making good progress, but a truly great player needs balance. You can specialize, but you can\'t have glaring weaknesses. Let\'s work on rounding out your game.']],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'focus_groundstrokes',
        text: 'Balance Groundstrokes',
        emoji: '⚖️',
        description: 'Work on becoming equally strong on both wings',
        outcome: {
          resultText: ['You dedicate equal time to both forehand and backhand. ', { characterId: 'coach_gonzalez' }, ' helps you build consistency across both shots, eliminating the predictability of having a weaker side.'],
          effects: {
            statChanges: { forehand: 3, backhand: 3, shotVariety: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_BALANCED_APPROACH, {
              type: 'story',
              eventId: 'coach_balanced_development',
            }),
          ],
        },
      },
      {
        id: 'focus_fitness',
        text: 'Athletic Foundation',
        emoji: '💪',
        description: 'Build your physical conditioning',
        outcome: {
          resultText: [{ characterId: 'coach_gonzalez' }, ' introduces you to a strength and conditioning program. You work on explosive speed, endurance, and recovery. Your body starts to feel like a finely-tuned machine.'],
          effects: {
            statChanges: { speed: 4, stamina: 4, agility: 2 },
            moodChange: 10,
            energyChange: -25,
            relationshipChanges: { coach_gonzalez: 15 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_ATHLETIC_FOUNDATION, {
              type: 'story',
              eventId: 'coach_balanced_development',
            }),
          ],
        },
      },
    ],
  },

  {
    id: 'coach_video_analysis',
    name: 'The Film Room',
    tags: ['coach', 'training', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['coach_training_focus'],
      minDay: 15,
    },
    skippable: true,
    description: 'Coach Gonzalez has prepared hours of match footage for you to analyze.',
    dialogue: [
      ['coach_gonzalez', ["I've compiled twelve hours of footage from your last eight matches, your opponents, and three professionals with similar playing styles. We'll cover it all today."]],
      ['coach_gonzalez', ["No, I'm not joking."]],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'stay_awake',
        text: 'Actually pay attention',
        emoji: '👀',
        description: 'Every minute of it',
        outcome: {
          resultText: ['Three hours in, you\'re still laser focused. ', { characterId: 'coach_gonzalez' }, ' looks genuinely startled when you start pointing out patterns before he does. You notice tendencies in your own game you\'d never seen before. Your anticipation and return positioning are sharper almost immediately.'],
          effects: {
            statChanges: { anticipation: 3, return: 2, placement: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 20 },
          },
        },
      },
      {
        id: 'doze_off',
        text: 'Doze off halfway through',
        emoji: '😴',
        description: 'You tried your best',
        outcome: {
          resultText: ['You make it forty-seven minutes before your eyes start to close. When ', { characterId: 'coach_gonzalez' }, ' asks what you think of a particular rally, you say "very tactical" with a confidence that surprises even you. He seems satisfied. You absorbed more than you realized.'],
          effects: {
            statChanges: { anticipation: 1, return: 1, focus: 1 },
            moodChange: 5,
            energyChange: 5,
            relationshipChanges: { coach_gonzalez: 5 },
          },
        },
      },
      {
        id: 'ask_questions',
        text: 'Ask questions constantly',
        emoji: '🙋',
        description: 'Make the most of it',
        outcome: {
          resultText: ['You pause the footage approximately forty times to ask follow-up questions. ', { characterId: 'coach_gonzalez' }, '\'s expression cycles from irritated to thoughtfully engaged to something resembling respect. You don\'t finish the footage. You do, however, understand your game better than ever.'],
          effects: {
            statChanges: { return: 3, anticipation: 2, defensive: 2 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { coach_gonzalez: 10 },
          },
        },
      },
    ],
  },

  {
    id: 'coach_secret_past',
    name: "Coach's Grand Slam Secret",
    tags: ['coach', 'milestone'],
    timeSlotsRequired: 1,
    prerequisites: {
      completedEvents: ['coach_balanced_development'],
      relationships: { coach_gonzalez: { min: 40 } },
    },
    skippable: true,
    description: 'Coach Gonzalez accidentally reveals more about his past than he intended.',
    dialogue: [
      ['coach_gonzalez', ["When I was at the Open - I mean, when I watched the Open on television - I noticed..."]],
      ['coach_gonzalez', ["...I played in it. Fine. I played in it. Quarterfinals. Don't make it weird."]],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['The story comes out in pieces. ', { characterId: 'coach_gonzalez' }, ' reached the quarterfinals of a Grand Slam at age 24. A knee injury in the fifth set ended his run and eventually his career. He was ranked 38th in the world. He has never told any of his other students. You sit with that for a moment. When you ask why he became a coach, he looks at the courts for a long time and says: "Someone had to deal with people like you."'],
      effects: {
        statChanges: { focus: 3, offensive: 2, serve: 1 },
        moodChange: 20,
        energyChange: -5,
        relationshipChanges: { coach_gonzalez: 25 },
      },
    },
  },

  {
    id: 'coach_trick_shot_challenge',
    name: 'The Bet',
    tags: ['coach', 'training', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['coach_video_analysis'],
    },
    skippable: true,
    description: 'Coach Gonzalez made a bet that you could pull off an around-the-net trick shot.',
    dialogue: [
      ['coach_gonzalez', ["So I may have told Coach Reyes that you could hit an around-the-net winner by end of week."]],
      ['coach_gonzalez', ["She bet me lunch. I need lunch. So you need to do this."]],
    ],
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'actually_practice',
        text: 'Actually drill it',
        emoji: '🎯',
        description: 'Get the rep count up',
        prerequisites: {
          stats: { shotVariety: { min: 20 } },
        },
        outcome: {
          resultText: ['You spend an entire session doing nothing but around-the-net attempts. Most go into the net. Some fly wide. One hits ', { characterId: 'coach_gonzalez' }, ' in the shin. But by the end, you\'re threading it clean. ', { characterId: 'coach_gonzalez' }, ' calls Coach Reyes immediately. "She saw it," he reports. "She says it doesn\'t count because you\'re \'too short.\'" He is absolutely going to win this eventually.'],
          effects: {
            statChanges: { dropShot: 3, shotVariety: 3, placement: 2 },
            moodChange: 20,
            energyChange: -25,
            relationshipChanges: { coach_gonzalez: 20 },
          },
          challengesAssigned: [
            ChallengeManager.createFromTemplate(CHALLENGE_TRICK_SHOT_MASTER, {
              type: 'story',
              eventId: 'coach_trick_shot_challenge',
            }),
          ],
        },
      },
      {
        id: 'wing_it',
        text: 'Try to wing it',
        emoji: '🤞',
        description: 'How hard can it be',
        outcome: {
          resultText: ['You decide you can probably just feel your way through this. Spoiler: you cannot. You hit the net 14 times, clip the post twice, and on your final attempt the ball bounces off the frame in a direction no one predicted, rolls across two courts, and stops at Coach Reyes\' feet. She looks at it. She looks at you. She starts laughing. ', { characterId: 'coach_gonzalez' }, ' says this counts. Your instincts, at least, are sharpening.'],
          effects: {
            statChanges: { dropShot: 1, shotVariety: 2, overhead: 1 },
            moodChange: 10,
            energyChange: -15,
            relationshipChanges: { coach_gonzalez: 10 },
          },
        },
      },
      {
        id: 'negotiate_terms',
        text: 'Renegotiate the bet',
        emoji: '🤝',
        description: 'Surely there are other options',
        outcome: {
          resultText: ['"What if I hit a between-the-legs shot instead?" you suggest. ', { characterId: 'coach_gonzalez' }, ' stares at you. "That\'s harder," he says. "I know," you say. You\'re not sure why you said that. You practice it anyway. You don\'t land it clean, but you get close enough that ', { characterId: 'coach_gonzalez' }, ' seems impressed in an exasperated way. The lunch bet remains unresolved.'],
          effects: {
            statChanges: { shotVariety: 3, agility: 2, overhead: 1 },
            moodChange: 15,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
        },
      },
    ],
  },
];
