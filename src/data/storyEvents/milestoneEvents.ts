/**
 * Milestone Events
 * Significant achievements and career milestones
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';

export const milestoneEvents: StoryEvent[] = [
  {
    id: 'first_match_win',
    name: 'First Match Victory',
    tags: ['milestone', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 1,
      excludedEvents: [],
    },
    skippable: false,
    description: 'You\'ve won your first match!',
    dialogue: [['coach_gonzalez', ['Congratulations on your first win! It may not have been pretty, but a win is a win. In fact, don\'t look at the stats. It was not pretty.']],
              ['coach_gonzalez', ['You\'ve moved off the bottom rung of the ladder now. To the second bottom rung. Progress.']]],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['You\'ve proven that you can win at this level. Your confidence is growing, but everything else hurts. I don\'t think it was supposed to be that hard.'],
      effects: {
        statChanges: {
          return: 1,
          focus: 1,
          anticipation: 1,
          offensive: 1,
          defensive: 1,
        }
      }
    }
  },
  {
    id: 'first_winning_streak',
    name: 'Three-Match Winning Streak',
    tags: ['milestone', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 3,
      excludedEvents: [],
    },
    skippable: false,
    description: 'You\'ve won three matches in a row - your best streak yet!',
    dialogue: [['coach_gonzalez', ['Three wins in a row! Do you know what this means? You\'re not just getting lucky anymore - you\'re consistently outplaying your opponents. This is the breakthrough we\'ve been working toward!']]],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['The winning streak has transformed your confidence. You\'re starting to believe you belong at this level, and other players have noticed your improvement. You feel yourself becoming a legitimate competitor.'],
      effects: {
        statChanges: { spin: 4, placement: 3, stamina: 2, recovery: 2 },
        moodChange: 40,
        energyChange: 0,
        relationshipChanges: { coach_gonzalez: 15 },
      },
      challengesAssigned: [
        ChallengeManager.createChallenge({
          id: 'milestone_challenge_ten_wins',
          name: 'Pursuit of Excellence',
          description: 'Your winning streak has proven you can compete. Now push yourself to reach 10 total match wins to establish yourself as a serious competitor.',
          requirements: [
            {
              type: 'matchCount',
              targetWins: 10,
              description: 'Win 10 total matches',
            },
          ],
          reward: {
            modifiers: {
              statBoosts: {
                focus: 5,
                offensive: 5,
                defensive: 5,
              },
            },
            items: [
              {
                name: 'Champion Wristband',
                description: 'A symbolic wristband marking your rise from beginner to competitor. Wear it with pride.',
                type: 'lucky',
                modifiers: {
                  statBoosts: {
                    focus: 3,
                  },
                },
              },
            ],
            experience: 200,
          },
          source: {
            type: 'story',
            eventId: 'first_winning_streak',
          },
        }),
      ],
    },
  },

  {
    id: 'equipment_upgrade',
    name: 'Professional Equipment Upgrade',
    tags: ['equipment', 'milestone', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 4,
      minDay: 10,
      completedEvents: ['sponsor_first_offer'],
      completedEventChoices: { sponsor_first_offer: ['accept_immediately', 'negotiate'] },
    },
    skippable: true,
    description: 'Your sponsor offers you access to professional-grade equipment and custom racquet fitting.',
    dialogue: [['sponsor_rep', ['We want to give you the best tools to succeed. We\'re offering you a full professional equipment package - custom-fitted racquet, premium strings, and professional-grade shoes. Our team will work with you to find the perfect setup for your game.']]],
    characters: ['sponsor_rep'],
    options: [
      {
        id: 'power_setup',
        text: 'Power Setup',
        emoji: '💥',
        description: 'Focus on power and aggressive play',
        outcome: {
          resultText: ['You choose a power-oriented setup with a heavier racquet and stiffer strings. The equipment feels powerful in your hands. You start hitting bigger serves and more aggressive groundstrokes, adding a new dimension to your game.'],
          effects: {
            statChanges: { serve: 4, forehand: 3, strength: 2, offensive: 3 },
            moodChange: 25,
            energyChange: -10,
          },
        },
      },
      {
        id: 'control_setup',
        text: 'Control Setup',
        emoji: '🎯',
        description: 'Emphasize precision and consistency',
        outcome: {
          resultText: ['You opt for a control-oriented setup with a more flexible frame and softer strings. The racquet gives you incredible feel and precision. Your shot placement improves dramatically, and you feel more confident in constructing points.'],
          effects: {
            statChanges: { spin: 3, placement: 3, anticipation: 2, defensive: 3, return: 2 },
            moodChange: 25,
            energyChange: -10,
          },
        },
      },
      {
        id: 'balanced_setup',
        text: 'Balanced Setup',
        emoji: '⚖️',
        description: 'All-around versatility',
        outcome: {
          resultText: ['You choose a balanced setup that doesn\'t sacrifice power or control. The versatile equipment allows you to adapt your game to different opponents and situations. You feel prepared for any challenge.'],
          effects: {
            statChanges: { serve: 2, forehand: 2, backhand: 2, anticipation: 2, offensive: 1, defensive: 1 },
            moodChange: 25,
            energyChange: -10,
          },
        },
      },
    ],
  },
];
