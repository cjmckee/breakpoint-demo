/**
 * Tactical Options Database
 * Complete set of user choices for key moments
 * Ported from ai-slop-gaming tactical options
 */

import { PointType } from '../types';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface TacticalOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
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
  'break-point-serve': [
    {
      id: 'power_serve_t',
      emoji: '🚀',
      name: 'Power serve down the T',
      description: 'Go for the ace with raw power down the center',
      riskLevel: 'high',
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
      id: 'precision_serve_wide',
      emoji: '🎯',
      name: 'Precision serve wide',
      description: 'Place it perfectly in the corner with spin',
      riskLevel: 'medium',
      playerStatWeights: {
        primary: 'placement',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'serve', weight: 0.25 },
          { stat: 'spin', weight: 0.25 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'speed', weight: 0.25 },
          { stat: 'agility', weight: 0.25 },
          { stat: 'anticipation', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'safe_serve_body',
      emoji: '🛡️',
      name: 'Safe serve to body',
      description: 'Low risk serve, jam them and start a rally',
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'placement', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'forehand', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'strength', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      },
    },
  ],

  'break-point-return': [
    {
      id: 'aggressive_return_crosscourt',
      emoji: '⚔️',
      name: 'Aggressive crosscourt return',
      description: 'Attack with power and placement crosscourt',
      riskLevel: 'high',
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
      name: 'Safe deep return',
      description: 'Get the return in play with depth and consistency',
      riskLevel: 'low',
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
      emoji: '🏃',
      name: 'Chip and charge',
      description: 'Short slice return and rush the net',
      riskLevel: 'medium',
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

  'set-point-player-serve': [
    {
      id: 'clutch_power_serve',
      emoji: '💥',
      name: 'Clutch power serve',
      description: 'Channel all your mental strength into one massive serve',
      riskLevel: 'high',
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
      riskLevel: 'medium',
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
      id: 'steady_serve',
      emoji: '⚖️',
      name: 'Steady and reliable',
      description: "Don't overthink it, just get it in with good pace",
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'recovery', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'player' },
      },
    },
  ],

  'set-point-player-return': [
    {
      id: 'aggressive_return',
      emoji: '🎯',
      name: 'Aggressive return',
      description: 'Take control with a powerful return',
      riskLevel: 'high',
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
      riskLevel: 'medium',
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
      id: 'steady_return',
      emoji: '⚖️',
      name: 'Steady and reliable',
      description: "Don't overthink it, just get it in with good pace",
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'recovery', weight: 0.1 },
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
        success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'player' },
      },
    },
  ],

  'set-point-opponent-serve': [
    {
      id: 'defensive_rally_setup',
      emoji: '🛡️',
      name: 'Defensive rally setup',
      description: 'Stay in the point with consistency and court coverage',
      riskLevel: 'low',
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
      name: 'Pressure-free swing',
      description: 'Nothing to lose - go for winners with variety',
      riskLevel: 'high',
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
      riskLevel: 'medium',
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
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
  ],

  'set-point-opponent-return': [
    {
      id: 'defensive_return',
      emoji: '🛡️',
      name: 'Defensive return',
      description: 'Focus on consistency and placement to neutralize the serve',
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'defensive', weight: 0.2 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'anticipation', weight: 0.15 },
          { stat: 'stamina', weight: 0.1 },
          { stat: 'speed', weight: 0.1 },
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
        success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'slice_return',
      emoji: '🪄',
      name: 'Slice return',
      description: 'Use a slice to change the pace and angle of the return',
      riskLevel: 'medium',
      playerStatWeights: {
        primary: 'slice',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'return', weight: 0.25 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'shotVariety', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
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
      id: 'aggressive_return',
      emoji: '🎯',
      name: 'Aggressive return',
      description: 'Take control with a powerful return',
      riskLevel: 'high',
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
  ],

  'match-point-player-serve': [
    {
      id: 'match_winning_serve',
      emoji: '🏆',
      name: 'Championship serve',
      description: 'Go for the match-winning ace with power and placement',
      riskLevel: 'high',
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
      description: 'Get to the net quickly and put the volley away',
      riskLevel: 'medium',
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
        success: { outcome: PointType.WINNER, shotType: 'serve', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
      },
    },
    {
      id: 'match_safe_serve',
      emoji: '🎯',
      name: 'Smart match serve',
      description: 'Get the serve in with good placement and follow up',
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'defensive', weight: 0.15 },
          { stat: 'stamina', weight: 0.1 },
          { stat: 'spin', weight: 0.1 },
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
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
      },
    },
  ],

  'match-point-player-return': [
    {
      id: 'aggressive_return',
      emoji: '🎯',
      name: 'Aggressive return',
      description: 'Take control with a powerful return',
      riskLevel: 'high',
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
      riskLevel: 'medium',
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
      id: 'steady_return',
      emoji: '⚖️',
      name: 'Steady and reliable',
      description: "Don't overthink it, just get it in with good pace",
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'recovery', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'player' },
      },
    },
  ],

  'match-point-opponent-serve': [
    {
      id: 'aggressive_serve',
      emoji: '🎯',
      name: 'Aggressive serve',
      description: 'Go for the big serve to take control',
      riskLevel: 'high',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.2 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'speed', weight: 0.25 },
          { stat: 'anticipation', weight: 0.2 },
          { stat: 'agility', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'opponent' },
      },
    },
    {
      id: 'serve_and_grind',
      emoji: '💪',
      name: 'Serve and grind',
      description: 'Get it in and use physical edge to wear them down',
      riskLevel: 'medium',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'stamina', weight: 0.2 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'recovery', weight: 0.15 },
          { stat: 'speed', weight: 0.1 },
          { stat: 'focus', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'forehand', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
        failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      },
    },
    {
      id: 'steady_serve',
      emoji: '⚖️',
      name: 'Steady and reliable',
      description: "Don't overthink it, just get it in with good pace",
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.25 },
          { stat: 'defensive', weight: 0.2 },
          { stat: 'stamina', weight: 0.15 },
          { stat: 'spin', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.35,
        secondary: [
          { stat: 'offensive', weight: 0.25 },
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'player' },
      },
    },
  ],

  'match-point-opponent-return': [
    {
      id: 'desperate_winner_attempt',
      emoji: '🎯',
      name: 'Desperate winner attempt',
      description: 'Nothing to lose - go for the lines with power',
      riskLevel: 'high',
      playerStatWeights: {
        primary: 'placement',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'forehand', weight: 0.2 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
          { stat: 'backhand', weight: 0.1 },
          { stat: 'spin', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'speed', weight: 0.25 },
          { stat: 'anticipation', weight: 0.2 },
          { stat: 'agility', weight: 0.15 },
          { stat: 'recovery', weight: 0.1 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
        failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'lob_and_reset',
      emoji: '🌈',
      name: 'Lob and reset',
      description: 'Buy time with a high lob to reset the rally',
      riskLevel: 'medium',
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
        success: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.WINNER, shotType: 'overhead', shooter: 'opponent' },
      },
    },
    {
      id: 'extend_rally_hope',
      emoji: '🏃',
      name: 'Extend the rally',
      description: 'Make them earn it with speed and defensive skills',
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.25,
        secondary: [
          { stat: 'speed', weight: 0.2 },
          { stat: 'stamina', weight: 0.2 },
          { stat: 'recovery', weight: 0.15 },
          { stat: 'focus', weight: 0.1 },
          { stat: 'anticipation', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'offensive',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'focus', weight: 0.2 },
          { stat: 'stamina', weight: 0.2 },
          { stat: 'forehand', weight: 0.15 },
          { stat: 'placement', weight: 0.15 },
        ],
      },
      shotOutcomes: {
        success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'player' },
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
