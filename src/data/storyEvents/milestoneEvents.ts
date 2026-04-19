/**
 * Milestone Events
 * Significant achievements and career milestones
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { POWER_RACQUET, CONTROL_RACQUET, ALLROUND_RACQUET, COURT_SHOES, SPORTS_DRINK } from '../items';
import { CHALLENGE_TEN_WINS } from '../challengeTemplates';

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
    dialogue: [
      ['coach_gonzalez', ['Congratulations on your first win! It may not have been pretty, but a win is a win. In fact, don\'t look at the stats. It was not pretty.']],
      ['coach_gonzalez', ['You\'ve moved off the bottom rung of the ladder now. To the second bottom rung. Progress.']],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['You\'ve proven that you can win at this level. Your confidence is growing, but everything else hurts. I don\'t think it was supposed to be that hard.'],
      effects: {
        statChanges: {
          return: 1,
          speed: 1,
          anticipation: 1,
          offensive: 1,
          defensive: 1,
        },
        itemsGained: [SPORTS_DRINK],
      }
    }
  },
  {
    id: 'first_winning_streak',
    name: 'Three-Match Winning Streak',
    tags: ['milestone', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minWinStreak: 3,
      excludedEvents: [],
    },
    skippable: false,
    description: 'You\'ve won three matches in a row - your best streak yet!',
    dialogue: [
      ['coach_gonzalez', ['Three wins in a row! Do you know what this means? You\'re not just getting lucky anymore - you\'re consistently outplaying your opponents. This is the breakthrough we\'ve been working toward!']],
    ],
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: ['The winning streak has transformed your confidence. You\'re starting to believe you belong at this level, and other players have noticed your improvement. You feel yourself becoming a legitimate competitor.'],
      effects: {
        statChanges: { spin: 4, placement: 3, stamina: 2, recovery: 2 },
        moodChange: 40,
        energyChange: 0,
        relationshipChanges: { coach_gonzalez: 10 },
      },
      challengesAssigned: [
        ChallengeManager.createFromTemplate(CHALLENGE_TEN_WINS, {
          type: 'story',
          eventId: 'first_winning_streak',
        }),
      ],
    },
  },

];
