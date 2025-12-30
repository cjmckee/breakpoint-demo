/**
 * Tactical Options Database
 * Complete set of user choices for key moments
 * Ported from ai-slop-gaming tactical options
 */

export interface TacticalOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
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
    success: { outcome: string; shotType: string; shooter: 'player' | 'opponent' };
    failure: { outcome: string; shotType: string; shooter: 'player' | 'opponent' };
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'speed', weight: 0.3 },
          { stat: 'anticipation', weight: 0.2 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'ace', shotType: 'serve', shooter: 'player' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'precision_serve_wide',
      emoji: '🎯',
      name: 'Precision serve wide',
      description: 'Place it perfectly in the corner with spin',
      riskLevel: 'medium',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'placement', weight: 0.35 },
          { stat: 'spin', weight: 0.25 },
          { stat: 'focus', weight: 0.1 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'speed', weight: 0.35 },
          { stat: 'agility', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'ace', shotType: 'serve', shooter: 'player' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'player' },
      },
    },
    {
      id: 'safe_serve_body',
      emoji: '🛡️',
      name: 'Safe serve to body',
      description: 'Low risk serve, rely on the rally',
      riskLevel: 'low',
      playerStatWeights: {
        primary: 'serve',
        primaryWeight: 0.6,
        secondary: [{ stat: 'focus', weight: 0.4 }],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.6,
        secondary: [{ stat: 'forehand', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'serve', shooter: 'player' },
        failure: { outcome: 'forced_error', shotType: 'forehand', shooter: 'opponent' },
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'forehand', weight: 0.25 },
          { stat: 'strength', weight: 0.2 },
          { stat: 'offensive', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'defensive', weight: 0.35 },
          { stat: 'anticipation', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'return', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.5,
        secondary: [
          { stat: 'defensive', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'unforced_error', shotType: 'backhand', shooter: 'opponent' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'chip_return_approach',
      emoji: '🏃',
      name: 'Chip and charge',
      description: 'Short slice return and rush the net',
      riskLevel: 'high',
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.3,
        secondary: [
          { stat: 'slice', weight: 0.25 },
          { stat: 'volley', weight: 0.25 },
          { stat: 'agility', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'shotVariety', weight: 0.35 },
          { stat: 'offensive', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.45,
        secondary: [
          { stat: 'strength', weight: 0.35 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'focus', weight: 0.35 },
          { stat: 'anticipation', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'ace', shotType: 'serve', shooter: 'player' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'player' },
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
        primaryWeight: 0.5,
        secondary: [
          { stat: 'focus', weight: 0.3 },
          { stat: 'defensive', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: 'forced_error', shotType: 'forehand', shooter: 'player' },
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'placement', weight: 0.4 },
          { stat: 'offensive', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'return', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.5,
        secondary: [
          { stat: 'focus', weight: 0.3 },
          { stat: 'defensive', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'return', shooter: 'opponent' },
        failure: { outcome: 'forced_error', shotType: 'forehand', shooter: 'player' },
      },
    }
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
        primaryWeight: 0.35,
        secondary: [
          { stat: 'stamina', weight: 0.25 },
          { stat: 'speed', weight: 0.25 },
          { stat: 'recovery', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'offensive',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'strength', weight: 0.35 },
          { stat: 'placement', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'unforced_error', shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.3,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'shotVariety', weight: 0.25 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'anticipation', weight: 0.35 },
          { stat: 'speed', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'forehand', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'backhand', shooter: 'player' },
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'defensive', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'placement', weight: 0.4 },
          { stat: 'offensive', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'return', shooter: 'opponent' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
      },
    },
    {
      id: 'slice_return',
      emoji: '🪄',
      name: 'Slice return',
      description: 'Use a slice to change the pace and angle of the return',
      riskLevel: 'medium',
      playerStatWeights: {
        primary: 'return',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'slice', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'placement', weight: 0.4 },
          { stat: 'offensive', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'return', shooter: 'opponent' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'placement', weight: 0.4 },
          { stat: 'offensive', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'return', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.35,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'placement', weight: 0.2 },
          { stat: 'focus', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.45,
        secondary: [
          { stat: 'speed', weight: 0.3 },
          { stat: 'anticipation', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'ace', shotType: 'serve', shooter: 'player' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'player' },
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
        primaryWeight: 0.35,
        secondary: [
          { stat: 'placement', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
          { stat: 'defensive', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'player' },
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'strength', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'placement', weight: 0.4 },
          { stat: 'offensive', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'return', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.5,
        secondary: [
          { stat: 'focus', weight: 0.3 },
          { stat: 'defensive', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'serve',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'return', shooter: 'opponent' },
        failure: { outcome: 'forced_error', shotType: 'forehand', shooter: 'player' },
      },
    }
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
        primaryWeight: 0.4,
        secondary: [
          { stat: 'placement', weight: 0.3 },
          { stat: 'focus', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.5,
        secondary: [
          { stat: 'speed', weight: 0.4 },
          { stat: 'anticipation', weight: 0.3 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'ace', shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: 'double_fault', shotType: 'serve', shooter: 'opponent' },
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
        primaryWeight: 0.5,
        secondary: [
          { stat: 'focus', weight: 0.3 },
          { stat: 'defensive', weight: 0.2 },
        ],
      },
      opponentStatWeights: {
        primary: 'return',
        primaryWeight: 0.6,
        secondary: [{ stat: 'offensive', weight: 0.4 }],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'serve', shooter: 'opponent' },
        failure: { outcome: 'forced_error', shotType: 'forehand', shooter: 'player' },
      },
    }
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
        primaryWeight: 0.35,
        secondary: [
          { stat: 'forehand', weight: 0.25 },
          { stat: 'backhand', weight: 0.25 },
          { stat: 'strength', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'defensive',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'speed', weight: 0.35 },
          { stat: 'anticipation', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'winner', shotType: 'return', shooter: 'player' },
        failure: { outcome: 'unforced_error', shotType: 'return', shooter: 'player' },
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
        primaryWeight: 0.35,
        secondary: [
          { stat: 'speed', weight: 0.25 },
          { stat: 'stamina', weight: 0.25 },
          { stat: 'recovery', weight: 0.15 },
        ],
      },
      opponentStatWeights: {
        primary: 'offensive',
        primaryWeight: 0.4,
        secondary: [
          { stat: 'focus', weight: 0.35 },
          { stat: 'stamina', weight: 0.25 },
        ],
      },
      shotOutcomes: {
        success: { outcome: 'forced_error', shotType: 'forehand', shooter: 'opponent' },
        failure: { outcome: 'forced_error', shotType: 'backhand', shooter: 'player' },
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
