/**
 * Coach Storyline Events
 * Events related to the player's relationship with Coach Gonzalez
 */

import type { StoryEvent } from '../../types/storyEvents';
import { ChallengeManager } from '../../game/ChallengeManager';
import { AbilityName } from '../../types/game';

export const coachEvents: StoryEvent[] = [
  {
    id: 'coach_first_meeting',
    name: 'Meeting Coach Gonzalez',
    tags: ['coach', 'intro'],
    timeSlotsRequired: 1,
    prerequisites: {},
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
        statChanges: { focus: 2, anticipation: 1 },
        moodChange: 15,
        energyChange: -10,
        relationshipChanges: { coach_gonzalez: 25 },
      },
      challengesAssigned: [
        ChallengeManager.createChallenge({
          id: 'challenge_forehand_fundamentals',
          name: 'Forehand Fundamentals',
          description: 'Coach Gonzalez wants you to master the basics of the forehand. Train your forehand stat to 30.',
          requirements: [
            {
              type: 'statThreshold',
              statName: 'forehand',
              targetValue: 30,
              description: 'Reach 30 Forehand',
            },
          ],
          reward: {
            modifiers: {
              statBoosts: {
                placement: 5,
                spin: 3,
              },
            },
            relationshipChanges: {
              coach_gonzalez: 10,
            },
            experience: 50,
          },
          source: {
            type: 'story',
            eventId: 'coach_first_meeting',
          },
        }),
        ChallengeManager.createChallenge({
          id: 'challenge_first_victories',
          name: 'First Victories',
          description: 'Coach Gonzalez challenges you to use what you\'ve learned on the court. Win three matches.',
          requirements: [
            {
              type: 'matchCount',
              targetWins: 3,
              description: 'Win 3 matches',
            },
          ],
          reward: {
            modifiers: {
              statBoosts: {
                focus: 5,
                anticipation: 5,
              },
            },
            relationshipChanges: {
              coach_gonzalez: 15,
            },
            experience: 100,
          },
          source: {
            type: 'story',
            eventId: 'coach_first_meeting',
          },
        }),
      ],
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
            ChallengeManager.createChallenge({
              id: 'coach_challenge_serve_mastery',
              name: "Coach's Challenge: Serve Mastery",
              description: 'Coach Gonzalez wants you to develop your serve to a passable level. Train your serve to 40.',
              requirements: [
                {
                  type: 'statThreshold',
                  statName: 'serve',
                  targetValue: 40,
                  description: 'Reach 40 Serve',
                },
              ],
              reward: {
                abilities: [AbilityName.HEAVY_HITTER],
                modifiers: {
                  statBoosts: {
                    serve: 5,
                    strength: 3,
                  },
                },
                relationshipChanges: {
                  coach_gonzalez: 20,
                },
                experience: 100,
              },
              source: {
                type: 'story',
                eventId: 'coach_training_focus',
              },
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
            ChallengeManager.createChallenge({
              id: 'coach_challenge_baseline_warrior',
              name: "Coach's Challenge: Baseline Warrior",
              description: 'Coach Gonzalez challenges you to become a complete baseline player. Train both forehand and backhand to 35.',
              requirements: [
                {
                  type: 'statThreshold',
                  statName: 'forehand',
                  targetValue: 35,
                  description: 'Reach 35 Forehand',
                },
                {
                  type: 'statThreshold',
                  statName: 'backhand',
                  targetValue: 35,
                  description: 'Reach 35 Backhand',
                },
              ],
              reward: {
                abilities: [AbilityName.BASELINER],
                modifiers: {
                  statBoosts: {
                    placement: 5,
                    defensive: 5,
                    stamina: 3,
                  },
                },
                relationshipChanges: {
                  coach_gonzalez: 20,
                },
                experience: 125,
              },
              source: {
                type: 'story',
                eventId: 'coach_training_focus',
              },
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
            ChallengeManager.createChallenge({
              id: 'coach_challenge_mental_edge',
              name: "Coach's Challenge: Mental Edge",
              description: 'Coach Gonzalez wants you to develop the mental fortitude of a champion. Train your focus to 40.',
              requirements: [
                {
                  type: 'statThreshold',
                  statName: 'focus',
                  targetValue: 40,
                  description: 'Reach 40 Focus',
                },
              ],
              reward: {
                abilities: [AbilityName.CLUTCH],
                modifiers: {
                  statBoosts: {
                    focus: 5,
                    anticipation: 5,
                    offensive: 3,
                  },
                },
                relationshipChanges: {
                  coach_gonzalez: 25,
                },
                experience: 150,
              },
              source: {
                type: 'story',
                eventId: 'coach_training_focus',
              },
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
            ChallengeManager.createChallenge({
              id: 'challenge_balanced_approach',
              name: 'Balanced Approach',
              description: 'Coach Gonzalez wants you to become a well-rounded player. Raise both forehand and backhand to 40.',
              requirements: [
                {
                  type: 'statThreshold',
                  statName: 'forehand',
                  targetValue: 40,
                  description: 'Reach 40 Forehand',
                },
                {
                  type: 'statThreshold',
                  statName: 'backhand',
                  targetValue: 40,
                  description: 'Reach 40 Backhand',
                },
              ],
              reward: {
                modifiers: {
                  statBoosts: {
                    shotVariety: 8,
                    placement: 4,
                  },
                },
                relationshipChanges: {
                  coach_gonzalez: 15,
                },
                experience: 120,
              },
              source: {
                type: 'story',
                eventId: 'coach_balanced_development',
              },
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
            ChallengeManager.createChallenge({
              id: 'challenge_athletic_foundation',
              name: 'Athletic Foundation',
              description: 'Coach Gonzalez challenges you to build elite-level fitness. Reach 35 in both speed and stamina.',
              requirements: [
                {
                  type: 'statThreshold',
                  statName: 'speed',
                  targetValue: 35,
                  description: 'Reach 35 Speed',
                },
                {
                  type: 'statThreshold',
                  statName: 'stamina',
                  targetValue: 35,
                  description: 'Reach 35 Stamina',
                },
              ],
              reward: {
                modifiers: {
                  statBoosts: {
                    agility: 5,
                    recovery: 5,
                  },
                },
                items: [
                  {
                    id: 'training_headband',
                    name: 'Training Headband',
                    description: 'A lightweight headband that helps you stay focused during intense rallies.',
                    type: 'equipment',
                    equipmentSlot: 'hat',
                    modifiers: {
                      statBoosts: {
                        focus: 2,
                        stamina: 2,
                      },
                    },
                  },
                ],
                relationshipChanges: {
                  coach_gonzalez: 20,
                },
                experience: 150,
              },
              source: {
                type: 'story',
                eventId: 'coach_balanced_development',
              },
            }),
          ],
        },
      },
    ],
  },
];
