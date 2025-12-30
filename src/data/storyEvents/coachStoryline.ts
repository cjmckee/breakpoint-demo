/**
 * Coach Storyline Events
 * Events related to the player's relationship with Coach Gonzalez
 */

import type { StoryEvent } from '../../types/storyEvents';

export const coachEvents: StoryEvent[] = [
  {
    id: 'coach_first_meeting',
    name: 'Meeting Coach Gonzalez',
    tags: ['coach', 'intro'],
    timeSlotsRequired: 1,
    prerequisites: {},
    skippable: false,
    description: 'A local tennis coach has taken interest in your development.',
    dialogue: `Coach Gonzalez: "I've been watching you play. You have raw talent, but you need guidance to reach your full potential. Let me help you develop your game properly."`,
    characters: ['coach_gonzalez'],
    options: [],
    defaultOutcome: {
      resultText: 'You spend an hour with Coach Gonzalez discussing your goals and tennis philosophy. He shares valuable insights about the mental side of the game and proper training techniques.',
      effects: {
        statBoosts: { focus: 2, anticipation: 1 },
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { coach_gonzalez: 25 },
      },
    },
  },

  {
    id: 'coach_training_focus',
    name: 'Choose Your Focus',
    tags: ['coach', 'training', 'decision'],
    timeSlotsRequired: 2,
    prerequisites: {
      completedEvents: ['coach_first_meeting'],
    },
    skippable: true,
    description: 'Coach Gonzalez wants to know what aspect of your game to prioritize in training.',
    dialogue: `Coach Gonzalez: "Everyone has different strengths and weaknesses. Tell me - what do you want to focus on developing? We'll build a training program around your choice."`,
    characters: ['coach_gonzalez'],
    options: [
      {
        id: 'focus_serve',
        text: 'Serve Power',
        emoji: '🚀',
        description: 'Focus on developing a dominant serve',
        outcome: {
          resultText: 'You spend intensive sessions working on serve technique. Coach Gonzalez helps you generate more power while maintaining accuracy. Your serve becomes a real weapon.',
          effects: {
            statBoosts: { serve: 5, strength: 3 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
        },
      },
      {
        id: 'focus_baseline',
        text: 'Baseline Game',
        emoji: '🎯',
        description: 'Improve groundstrokes and consistency',
        outcome: {
          resultText: 'You work tirelessly on groundstroke mechanics. Coach Gonzalez refines your technique on both wings. Your forehand and backhand both show marked improvement.',
          effects: {
            statBoosts: { forehand: 4, backhand: 4, defensive: 2 },
            moodChange: 10,
            energyChange: -20,
            relationshipChanges: { coach_gonzalez: 15 },
          },
        },
      },
      {
        id: 'focus_mental',
        text: 'Mental Game',
        emoji: '🧠',
        description: 'Develop focus and competitive mindset',
        outcome: {
          resultText: 'Coach Gonzalez introduces you to sports psychology techniques. You learn breathing exercises, visualization methods, and how to stay focused under pressure. The mental game is just as important as the physical.',
          effects: {
            statBoosts: { focus: 5, anticipation: 3, offensive: 2 },
            moodChange: 15,
            energyChange: -15,
            relationshipChanges: { coach_gonzalez: 20 },
          },
        },
      },
    ],
  },
];
