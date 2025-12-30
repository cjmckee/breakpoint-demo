/**
 * Milestone Events
 * Significant achievements and career milestones
 */

import type { StoryEvent } from '../../types/storyEvents';

export const milestoneEvents: StoryEvent[] = [
  {
    id: 'first_winning_streak',
    name: 'Five-Match Winning Streak',
    tags: ['milestone', 'celebration'],
    timeSlotsRequired: 1,
    prerequisites: {
      minMatchesWon: 5,
      excludedEvents: ['first_winning_streak'], // Only trigger once
    },
    skippable: false,
    description: 'You\'ve won five matches in a row - your best streak yet!',
    dialogue: `Coach Gonzalez: "Five wins in a row! Do you know what this means? You're not just getting lucky anymore - you're consistently outplaying your opponents. This is the breakthrough we've been working toward!"`,
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: 'The winning streak has transformed your confidence. You\'re starting to believe you belong at this level. Other players are starting to take notice of your consistent performance. You feel yourself crossing a threshold from hopeful beginner to legitimate competitor.',
      effects: {
        statBoosts: { focus: 4, anticipation: 3, offensive: 2, defensive: 2 },
        moodChange: 40,
        energyChange: 0,
        relationshipChanges: { coach_gonzalez: 15 },
      },
    },
  },

  {
    id: 'equipment_upgrade',
    name: 'Professional Equipment Upgrade',
    tags: ['equipment', 'milestone', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      minMatchesWon: 6,
      minDay: 20,
      completedEvents: ['sponsor_first_offer'],
      completedEventChoices: { sponsor_first_offer: 'accept_immediately' },
    },
    skippable: true,
    description: 'Your sponsor offers you access to professional-grade equipment and custom racquet fitting.',
    dialogue: `Sponsor Rep: "We want to give you the best tools to succeed. We're offering you a full professional equipment package - custom-fitted racquet, premium strings, and professional-grade shoes. Our team will work with you to find the perfect setup for your game."`,
    characters: ['sponsor_rep'],
    options: [
      {
        id: 'power_setup',
        text: 'Power Setup',
        emoji: '💥',
        description: 'Focus on power and aggressive play',
        outcome: {
          resultText: 'You choose a power-oriented setup with a heavier racquet and stiffer strings. The equipment feels powerful in your hands. You start hitting bigger serves and more aggressive groundstrokes, adding a new dimension to your game.',
          effects: {
            statBoosts: { serve: 4, forehand: 3, strength: 2, offensive: 3 },
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
          resultText: 'You opt for a control-oriented setup with a more flexible frame and softer strings. The racquet gives you incredible feel and precision. Your shot placement improves dramatically, and you feel more confident in constructing points.',
          effects: {
            statBoosts: { forehand: 3, backhand: 3, anticipation: 2, defensive: 3 },
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
          resultText: 'You choose a balanced setup that doesn\'t sacrifice power or control. The versatile equipment allows you to adapt your game to different opponents and situations. You feel prepared for any challenge.',
          effects: {
            statBoosts: { serve: 2, forehand: 2, backhand: 2, anticipation: 2, offensive: 1, defensive: 1 },
            moodChange: 25,
            energyChange: -10,
          },
        },
      },
    ],
  },
];
