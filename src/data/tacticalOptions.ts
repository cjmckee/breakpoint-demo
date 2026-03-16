/**
 * Tactical Options Database
 * Complete set of user choices for key moments.
 * Each option has strongAgainst/weakAgainst archetype relationships
 * and secondary effects that apply beyond point outcome.
 */

import { PointType } from '../types';
import type { ArchetypeType } from './archetypes';

export interface SecondaryEffect {
  type: 'momentum' | 'energy' | 'pressure' | 'mood';
  target: 'player';
  value: number;
  condition: 'always' | 'on_success' | 'on_failure';
}

export interface TacticalOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  strongAgainst: ArchetypeType[];
  weakAgainst: ArchetypeType[];
  bestAgainstHint: string; // Human-readable hint for UI (doesn't name archetypes directly)
  secondaryEffects: SecondaryEffect[];
  playerStatWeights: {
    primary: string;
    primaryWeight: number;
    secondary: Array<{ stat: string; weight: number }>;
  };
  opponentStatWeights: {
    primary: string;
    primaryWeight: number;
    secondary: Array<{ stat: string; weight: number }>;
  };
  shotOutcomes: {
    success: { outcome: PointType; shotType: string; shooter: 'player' | 'opponent' };
    failure: { outcome: PointType; shotType: string; shooter: 'player' | 'opponent' };
  };
  successProbability?: number; // Calculated dynamically
}

export type KeyMomentType =
  | 'break-point-serve'
  | 'break-point-return'
  | 'set-point-player-serve'
  | 'set-point-player-return'
  | 'set-point-opponent-serve'
  | 'set-point-opponent-return'
  | 'match-point-player-serve'
  | 'match-point-player-return'
  | 'match-point-opponent-serve'
  | 'match-point-opponent-return';

export const TACTICAL_OPTIONS: Record<KeyMomentType, TacticalOption[]> = {
  // ============================================================
  // BREAK POINT - SERVING (you're serving, facing break point)
  // ============================================================
  'break-point-serve': [
    {
      id: 'power_serve_t',
      emoji: '🚀',
      name: 'Power serve down the T',
      description: 'Overpower them before the rally starts',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against patient opponents who sit back',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -3, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'strength', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'offensive', weight: 0.1 },
          { stat: 'focus', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'agility', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'kick_serve_rally',
      emoji: '🌀',
      name: 'Kick serve and grind',
      description: 'Heavy spin serve, then outlast them in the rally',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher'],
      bestAgainstHint: 'Best against impatient attackers who want quick points',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -3, condition: 'always' },

        { type: 'mood', target: 'player', value: 2, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -2, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'spin',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'stamina', weight: 0.2 },
          { stat: 'defensive', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'backhand', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'agility', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
    {
      id: 'serve_volley_surprise',
      emoji: '🏃',
      name: 'Serve and charge the net',
      description: 'Follow your serve in and finish with a volley',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against baseline players who struggle with net pressure',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -4, condition: 'always' },
        { type: 'momentum', target: 'player', value: 8, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
          { stat: 'overhead', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
      },
    },
  ],

  // ============================================================
  // BREAK POINT - RETURNING (you're returning, chance to break)
  // ============================================================
  'break-point-return': [
    {
      id: 'aggressive_return_crosscourt',
      emoji: '⚔️',
      name: 'Aggressive crosscourt return',
      description: 'Attack with power and placement crosscourt',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents who sit deep behind the baseline',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -4, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -3, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'placement', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'placement', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'anticipation', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'safe_return_deep',
      emoji: '🎯',
      name: 'Deep neutralizing return',
      description: 'Get the return in play with depth, extend the rally',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher', 'defensive'],
      bestAgainstHint: 'Best against attackers who want to end points quickly',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -3, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'defensive', weight: 0.25 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'anticipation', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'forehand', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'chip_return_approach',
      emoji: '🪶',
      name: 'Chip and charge',
      description: 'Short slice return and rush the net',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against baseline grinders who hate net pressure',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -4, condition: 'always' },
        { type: 'momentum', target: 'player', value: 8, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'slice', weight: 0.2 },
          { stat: 'return', weight: 0.2 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'shotVariety', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'placement', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
  ],

  // ============================================================
  // SET POINT FOR PLAYER — PLAYER SERVING
  // ============================================================
  'set-point-player-serve': [
    {
      id: 'clutch_power_serve',
      emoji: '💥',
      name: 'Clutch power serve',
      description: 'Channel everything into one massive serve',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents who rely on getting the ball back',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -6, condition: 'always' },
        { type: 'momentum', target: 'player', value: 12, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -8, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.25 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'placement', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'anticipation', weight: 0.2 },
          { stat: 'speed', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'kick_serve_setup',
      emoji: '🌀',
      name: 'Kick serve and rally',
      description: 'Use heavy spin to push them back, then dominate the rally',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher'],
      bestAgainstHint: 'Best against opponents who struggle with long rallies',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -3, condition: 'always' },

        { type: 'mood', target: 'player', value: 2, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -3, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'spin',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
          { stat: 'stamina', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'backhand', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'agility', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
    {
      id: 'serve_and_volley_set',
      emoji: '🏃',
      name: 'Serve and volley',
      description: 'Get to the net quickly and put the volley away',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents anchored to the baseline',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
          { stat: 'overhead', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
  ],

  // ============================================================
  // SET POINT FOR PLAYER — PLAYER RETURNING
  // ============================================================
  'set-point-player-return': [
    {
      id: 'aggressive_return_set',
      emoji: '⚔️',
      name: 'Aggressive return',
      description: 'Take control with a powerful return',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents with weak serves who play safe',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -4, condition: 'always' },
        { type: 'momentum', target: 'player', value: 12, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'placement', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'block_return_rally',
      emoji: '🧱',
      name: 'Block return and rally',
      description: 'Neutralize the serve and grind out the point',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher', 'defensive'],
      bestAgainstHint: 'Best against big servers who fade in long rallies',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -3, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'backhand', weight: 0.2 },
          { stat: 'anticipation', weight: 0.2 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.25 },
          { stat: 'offensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'strength', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'player' },
      },
    },
    {
      id: 'drop_shot_return_set',
      emoji: '🪶',
      name: 'Drop shot off the return',
      description: 'Catch them off guard with a disguised drop shot',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents who hang back expecting a rally',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -2, condition: 'always' },

        { type: 'momentum', target: 'player', value: 8, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'dropShot',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'return', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'speed',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'agility', weight: 0.25 },
          { stat: 'recovery', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'dropShot', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
  ],

  // ============================================================
  // SET POINT FOR OPPONENT — PLAYER SERVING
  // ============================================================
    'set-point-opponent-serve': [
    {
      id: 'big_serve_pressure',
      emoji: '🚀',
      name: 'Big serve under pressure',
      description: 'Go for a powerful serve to take control of the point',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents with weak returns who play safe',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -8, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -3, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.15 },
          { stat: 'offensive', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'offensive', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'slice_serve_rally',
      emoji: '🪄',
      name: 'Slice serve and rally',
      description: 'Use a slice serve to disrupt their timing, then build the point',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher'],
      bestAgainstHint: 'Best against opponents who attack returns aggressively',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -2, condition: 'always' },

        { type: 'mood', target: 'player', value: 2, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -3, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'slice',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'spin', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'serve_volley_set_opp',
      emoji: '🏃',
      name: 'Serve and volley',
      description: 'Rush the net after your serve to end the point quickly',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents who struggle to pass at the net',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
          { stat: 'overhead', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
      },
    },
  ],

  // ============================================================
  // SET POINT FOR OPPONENT — PLAYER RETURNING
  // ============================================================
  'set-point-opponent-return': [
    {
      id: 'defensive_rally_setup',
      emoji: '🛡️',
      name: 'Defensive rally setup',
      description: 'Stay in the point with consistency and court coverage',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher', 'defensive'],
      bestAgainstHint: 'Best against opponents who go for too much under pressure',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'stamina', weight: 0.2 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'recovery', weight: 0.15 },
          { stat: 'focus', weight: 0.1 },
          { stat: 'anticipation', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'offensive',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'forehand', weight: 0.15 },
          { stat: 'spin', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'pressure_free_swing',
      emoji: '🎪',
      name: 'Nothing-to-lose swing',
      description: 'Swing freely — go for winners with variety',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents who expect you to play safe',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 12, condition: 'on_success' },

        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'forehand',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.2 },
          { stat: 'offensive', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'agility', weight: 0.15 },
          { stat: 'recovery', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
      },
    },
    {
      id: 'drop_shot_surprise',
      emoji: '🪶',
      name: 'Drop shot surprise',
      description: 'Catch them off guard with a disguised drop shot',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents who camp deep behind the baseline',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -2, condition: 'always' },

        { type: 'momentum', target: 'player', value: 8, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'dropShot',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'shotVariety', weight: 0.2 },
          { stat: 'slice', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'speed',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'agility', weight: 0.25 },
          { stat: 'recovery', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'dropShot', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
  ],

  // ============================================================
  // MATCH POINT FOR PLAYER — PLAYER SERVING
  // ============================================================
  'match-point-player-serve': [
    {
      id: 'match_winning_serve',
      emoji: '🏆',
      name: 'Championship serve',
      description: 'Go for the match-winning ace with power and placement',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents who rely on getting the ball back',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -6, condition: 'always' },
        { type: 'momentum', target: 'player', value: 15, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -10, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'serve_volley_finish',
      emoji: '🎾',
      name: 'Serve and volley',
      description: 'Get to the net quickly and put the match away at the net',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against baseline players who can\'t pass',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
          { stat: 'overhead', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
    {
      id: 'match_safe_serve',
      emoji: '🌀',
      name: 'Smart spin serve',
      description: 'Get the serve in with heavy spin and work the rally',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher'],
      bestAgainstHint: 'Best against opponents who attack the return aggressively',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -3, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'spin', weight: 0.2 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
          { stat: 'stamina', weight: 0.1 },
          { stat: 'defensive', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.15 },
          { stat: 'speed', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
  ],

  // ============================================================
  // MATCH POINT FOR PLAYER — PLAYER RETURNING
  // ============================================================
  'match-point-player-return': [
    {
      id: 'aggressive_return_match',
      emoji: '⚔️',
      name: 'Aggressive return',
      description: 'Take control with a powerful return to win the match',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents with weak serves',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 15, condition: 'on_success' },
        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'placement', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'read_and_react',
      emoji: '👁️',
      name: 'Read and react',
      description: 'Anticipate the serve direction and redirect with precision',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['all_court'],
      bestAgainstHint: 'Best against predictable servers with big wind-ups',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'anticipation',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'return', weight: 0.25 },
          { stat: 'backhand', weight: 0.2 },
          { stat: 'placement', weight: 0.15 },
          { stat: 'agility', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'spin', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'strength', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'chip_charge_match',
      emoji: '🏃',
      name: 'Chip and charge',
      description: 'Slice the return and rush the net to end it',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against baseline grinders who hate net pressure',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'slice', weight: 0.2 },
          { stat: 'return', weight: 0.2 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'shotVariety', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'placement', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
      },
    },
  ],

  // ============================================================
  // MATCH POINT FOR OPPONENT — PLAYER SERVING
  // ============================================================
  'match-point-opponent-serve': [
    {
      id: 'desperate_winner_attempt',
      emoji: '🚀',
      name: 'Big serve to survive',
      description: 'Go for a huge serve to stay in the match',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents who struggle with pace on the return',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -6, condition: 'always' },
        { type: 'momentum', target: 'player', value: 12, condition: 'on_success' },

        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'focus', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'anticipation', weight: 0.25 },
          { stat: 'speed', weight: 0.2 },
          { stat: 'agility', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'slice_serve_grind',
      emoji: '🪄',
      name: 'Slice serve and grind',
      description: 'Disrupt their timing and make them work for it',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher'],
      bestAgainstHint: 'Best against opponents who attack returns aggressively',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'slice',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.15 },
          { stat: 'speed', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
    {
      id: 'serve_volley_desperation',
      emoji: '🏃',
      name: 'Serve and charge',
      description: 'Rush the net — force them to hit a passing shot under pressure',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents who freeze when you come to the net',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 10, condition: 'on_success' },

      ],
      playerStatWeights: {
        primary: 'volley',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'speed', weight: 0.15 },
          { stat: 'overhead', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
      },
    },
  ],

  
  // ============================================================
  // MATCH POINT FOR OPPONENT — PLAYER RETURNING
  // ============================================================
  'match-point-opponent-return': [
    {
      id: 'desperate_attack_return',
      emoji: '⚔️',
      name: 'All-out attack return',
      description: 'Nothing to lose — go after the return with everything',
      strongAgainst: ['defensive', 'counterpuncher'],
      weakAgainst: ['aggressive'],
      bestAgainstHint: 'Best against opponents with tentative serves under pressure',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: -5, condition: 'always' },
        { type: 'momentum', target: 'player', value: 12, condition: 'on_success' },

        { type: 'momentum', target: 'player', value: -5, condition: 'on_failure' },
        { type: 'mood', target: 'player', value: -5, condition: 'on_failure' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'placement', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'deep_return_grind',
      emoji: '🧱',
      name: 'Deep return and grind',
      description: 'Get the return deep and make them earn the match',
      strongAgainst: ['aggressive', 'serve_volley'],
      weakAgainst: ['counterpuncher', 'defensive'],
      bestAgainstHint: 'Best against opponents who crack under extended rallies',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 2, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.2 },
          { stat: 'focus', weight: 0.15 },
          { stat: 'anticipation', weight: 0.1 },
          { stat: 'speed', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'forehand', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'lob_and_reset_match',
      emoji: '🌈',
      name: 'Lob and reset',
      description: 'Buy time with a high lob to reset the rally',
      strongAgainst: ['counterpuncher', 'defensive'],
      weakAgainst: ['serve_volley', 'all_court'],
      bestAgainstHint: 'Best against opponents stuck deep who struggle with overheads',
      secondaryEffects: [
        { type: 'energy', target: 'player', value: 3, condition: 'always' },

        { type: 'mood', target: 'player', value: 3, condition: 'on_success' },
        { type: 'pressure', target: 'player', value: -5, condition: 'on_success' },
      ],
      playerStatWeights: {
        primary: 'shotVariety',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'defensive', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.15 },
          { stat: 'anticipation', weight: 0.1 },
          { stat: 'speed', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'overhead',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'speed', weight: 0.2 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'strength', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'overhead', shooter: 'opponent' },
        failure: { outcome: PointType.WINNER, shotType: 'overhead', shooter: 'opponent' },
      },
    },
  ],
};

/**
 * Get tactical options for a specific key moment type
 */
export function getOptionsForSituation(momentType: KeyMomentType): TacticalOption[] {
  return TACTICAL_OPTIONS[momentType] || [];
}

/**
 * Get a specific option by ID
 */
export function getOptionById(id: string): TacticalOption | undefined {
  for (const options of Object.values(TACTICAL_OPTIONS)) {
    const found = options.find(option => option.id === id);
    if (found) return found;
  }
  return undefined;
}
