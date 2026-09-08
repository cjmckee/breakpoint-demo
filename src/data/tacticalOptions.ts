/**
 * Tactical Options
 *
 * One flat pool. An option declares what it *is* — which side of the ball it can
 * be played from, how it plays the point, how wide its outcome spread is — and
 * the draw works out which options a given key moment may offer. The archetype
 * matchup comes from the option's posture via POSTURE_VS_ARCHETYPE, not from
 * per-option lists, so adding an option costs two tags rather than five
 * hand-authored relationships.
 */

import { PointType } from '../types';
import type { StatName } from '../types';

/**
 * Which side of the ball the option is played from — the hard constraint on what
 * can appear in a menu. Facing break point on your own serve, every option has to
 * be a serve; converting one, every option has to be a return.
 *
 * `rally` covers the 30-30 / 40-40 moments, which test how you construct the point
 * rather than how you start it. A rally situation still has a server, so its menu
 * draws from the rally pool *and* the serving or returning pool as appropriate —
 * which is why this is a list: an option can be playable from more than one.
 */
export type KeyMomentRole = 'serve' | 'return' | 'rally';

/**
 * How the option plays the point. Posture — not the individual option — is what an
 * opponent's archetype is strong or weak against, so the matchup lives in one
 * POSTURE x ARCHETYPE table (see data/postures.ts).
 */
export type KeyMomentPosture =
  | 'power'       // Overpower them, end it early
  | 'net'         // Take the net, finish short
  | 'neutralize'  // Absorb pace, reset, start the rally on your terms
  | 'deception'   // Drop shot, disguise, wrong-foot
  | 'attrition'   // Extend it, make them run, win the next one
  | 'variety';    // Refuse to be predictable - change pace, angle, court position

/**
 * How wide the outcome spread is, NOT how likely the option is to succeed.
 * Two options at the same success chance win the point equally often; the bolder
 * one resolves as a critical far more often and swings momentum harder when it does.
 */
export type KeyMomentRisk = 'safe' | 'balanced' | 'bold';

export interface SecondaryEffect {
  type: 'momentum' | 'energy' | 'pressure' | 'mood';
  value: number;
  condition: 'always' | 'on_success' | 'on_failure';
}

export interface TacticalOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  /** Which side of the ball this can be played from. */
  roles: KeyMomentRole[];
  /** How this plays the point; drives the archetype matchup. */
  posture: KeyMomentPosture;
  /** How wide the outcome spread is. */
  risk: KeyMomentRisk;
  /**
   * Aim at whichever of the opponent's wings is actually weaker. The resolver
   * swaps the `backhand` term in opponentStatWeights for `forehand` when that is
   * the lower of the two, so the option reads the opponent rather than assuming.
   */
  targetsWeakerWing?: boolean;
  secondaryEffects: SecondaryEffect[];
  playerStatWeights: StatWeights;
  opponentStatWeights: StatWeights;
  shotOutcomes: {
    success: { outcome: PointType; shotType: string; shooter: 'player' | 'opponent' };
    failure: { outcome: PointType; shotType: string; shooter: 'player' | 'opponent' };
  };
}

export interface StatWeights {
  primary: StatName;
  primaryWeight: number;
  secondary: Array<{ stat: StatName; weight: number }>;
}

/**
 * Secondary effects by risk level. Risk is variance, so a bolder option does not
 * win more often — it swings harder in both directions and costs more to attempt.
 * Every level carries a cost on failure: a safe option is low-variance, not free.
 */
const RISK_EFFECTS: Record<KeyMomentRisk, SecondaryEffect[]> = {
  safe: [
    { type: 'energy', value: -2, condition: 'always' },
    { type: 'mood', value: 2, condition: 'on_success' },
    { type: 'pressure', value: -3, condition: 'on_success' },
    { type: 'pressure', value: 2, condition: 'on_failure' },
  ],
  balanced: [
    { type: 'energy', value: -4, condition: 'always' },
    { type: 'momentum', value: 8, condition: 'on_success' },
    { type: 'momentum', value: -5, condition: 'on_failure' },
    { type: 'mood', value: -2, condition: 'on_failure' },
  ],
  bold: [
    { type: 'energy', value: -6, condition: 'always' },
    { type: 'momentum', value: 14, condition: 'on_success' },
    { type: 'momentum', value: -9, condition: 'on_failure' },
    { type: 'mood', value: -5, condition: 'on_failure' },
  ],
};

/** The whole authored pool. Situation eligibility is a property of each option. */
export const TACTICAL_OPTIONS: TacticalOption[] = [
  {
    id: 's_solid_first',
    emoji: '✅',
    name: 'Solid first serve',
    description: 'Pace without chasing the lines',
    roles: ['serve'],
    posture: 'power',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
      failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 's_body_jam',
    emoji: '🎯',
    name: 'Flat serve into the body',
    description: 'Cramp the return without flirting with the line',
    roles: ['serve'],
    posture: 'power',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
      failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 's_power_t',
    emoji: '🚀',
    name: 'Power serve down the T',
    description: 'Overpower them before the rally starts',
    roles: ['serve'],
    posture: 'power',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.ACE, shotType: 'serve', shooter: 'player' },
      failure: { outcome: PointType.DOUBLE_FAULT, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 's_kick_approach',
    emoji: '🪃',
    name: 'Sneak in behind a kick serve',
    description: 'The high ball buys you time to get forward',
    roles: ['serve'],
    posture: 'net',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 's_wide_close',
    emoji: '📐',
    name: 'Serve wide, close the angle',
    description: 'Pull them wide, then cover the line',
    roles: ['serve'],
    posture: 'net',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 's_serve_volley',
    emoji: '🏃',
    name: 'Serve and volley',
    description: 'Follow the serve in and finish at the net',
    roles: ['serve'],
    posture: 'net',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 's_kick_heavy',
    emoji: '🌪️',
    name: 'Heavy kick serve',
    description: 'Start the rally on your terms',
    roles: ['serve'],
    posture: 'neutralize',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
    },
  },
  {
    id: 's_slice_reset',
    emoji: '🔄',
    name: 'Slice serve wide, reset',
    description: 'Get a neutral rally started',
    roles: ['serve'],
    posture: 'neutralize',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
    },
  },
  {
    id: 's_carve_low',
    emoji: '🪶',
    name: 'Carve it low at their feet',
    description: 'A fine margin, but nothing comes back clean',
    roles: ['serve'],
    posture: 'neutralize',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'serve', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'return', shooter: 'opponent' },
    },
  },
  {
    id: 's_body_disguise',
    emoji: '🃏',
    name: 'Body serve off a wide pattern',
    description: 'Reads as wide, arrives at their hip',
    roles: ['serve'],
    posture: 'deception',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'serve', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 's_disguise_second',
    emoji: '🎭',
    name: 'Disguised second serve',
    description: 'Same toss, different spin',
    roles: ['serve'],
    posture: 'deception',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'serve', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 's_wide_then_drop',
    emoji: '🩰',
    name: 'Serve wide, drop the reply',
    description: 'Pull them out, then bring them in',
    roles: ['serve'],
    posture: 'deception',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'serve', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 's_kick_grind',
    emoji: '⛏️',
    name: 'Kick serve deep and grind',
    description: 'Accept the rally and out-last them',
    roles: ['serve'],
    posture: 'attrition',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 's_hammer_weak',
    emoji: '🔨',
    name: 'Hammer their weaker wing',
    description: 'Serve there, then keep going there',
    roles: ['serve'],
    posture: 'attrition',
    risk: 'balanced',
    targetsWeakerWing: true,
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 's_long_rally',
    emoji: '🐘',
    name: 'Commit to the marathon',
    description: 'Trade the odds on this point for their legs',
    roles: ['serve'],
    posture: 'attrition',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'spin', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 's_change_speed',
    emoji: '🎚️',
    name: 'Change of pace, nothing fancy',
    description: 'Take something off and see how they like it',
    roles: ['serve'],
    posture: 'variety',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 's_slice_timing',
    emoji: '🌀',
    name: 'Slice serve to break their timing',
    description: 'Take the rhythm away',
    roles: ['serve'],
    posture: 'variety',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 's_quick_serve',
    emoji: '⏱️',
    name: 'Quick-serve them',
    description: 'Go before they are set',
    roles: ['serve'],
    posture: 'variety',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'return', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'serve', shooter: 'player' },
    },
  },
  {
    id: 'r_drive_safe',
    emoji: '✅',
    name: 'Firm drive, big margin',
    description: 'Hit through it without going near the lines',
    roles: ['return'],
    posture: 'power',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'r_attack_cross',
    emoji: '⚡',
    name: 'Aggressive crosscourt return',
    description: 'Attack with power and depth crosscourt',
    roles: ['return'],
    posture: 'power',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'r_early_line',
    emoji: '🎯',
    name: 'Step in and take it down the line',
    description: 'Take it early and go for the line',
    roles: ['return'],
    posture: 'power',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'return',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'serve',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'r_block_follow',
    emoji: '🛡️',
    name: 'Block it and follow it in',
    description: 'Take the pace off and get forward',
    roles: ['return'],
    posture: 'net',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'r_chip_charge',
    emoji: '🏃',
    name: 'Chip and charge',
    description: 'Short slice return and rush the net',
    roles: ['return'],
    posture: 'net',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'r_attack_short',
    emoji: '🗡️',
    name: 'Attack the short reply',
    description: 'Wait for the ball to sit up, then come in',
    roles: ['return'],
    posture: 'net',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'forehand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'r_block_restart',
    emoji: '🧱',
    name: 'Block it back and start again',
    description: 'No ambition — just get into the point',
    roles: ['return'],
    posture: 'neutralize',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'slice',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
    },
  },
  {
    id: 'r_deep_neutral',
    emoji: '↩️',
    name: 'Deep neutralizing return',
    description: 'Get it back with depth and extend the rally',
    roles: ['return'],
    posture: 'neutralize',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'slice',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
    },
  },
  {
    id: 'r_lob_reset',
    emoji: '☁️',
    name: 'Lob it and reset',
    description: 'Buy time, and hope it is deep enough',
    roles: ['return'],
    posture: 'neutralize',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'slice',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'return', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'forehand', weight: 0.3 },
        { stat: 'strength', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'opponent' },
    },
  },
  {
    id: 'r_fake_drive',
    emoji: '🃏',
    name: 'Fake the drive, roll it deep',
    description: 'Show the big swing, take the pace off',
    roles: ['return'],
    posture: 'deception',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'r_slice_short',
    emoji: '🎭',
    name: 'Disguised slice, short and low',
    description: 'Punish anyone camped deep',
    roles: ['return'],
    posture: 'deception',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'r_drop_return',
    emoji: '🩰',
    name: 'Drop shot off the return',
    description: 'Catch them flat-footed behind the baseline',
    roles: ['return'],
    posture: 'deception',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'return', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'r_deep_grind',
    emoji: '⛏️',
    name: 'Deep return and grind',
    description: 'Make them earn every ball',
    roles: ['return'],
    posture: 'attrition',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'r_target_weak_wing',
    emoji: '🔨',
    name: 'Return to their weaker wing',
    description: 'Go there, and keep going there',
    roles: ['return'],
    posture: 'attrition',
    risk: 'balanced',
    targetsWeakerWing: true,
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'r_five_more',
    emoji: '🐘',
    name: 'Make them play five more',
    description: 'Trade the point for their legs',
    roles: ['return'],
    posture: 'attrition',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'r_stand_deep',
    emoji: '🔙',
    name: 'Stand deep, take the pace off',
    description: 'Change where the point starts',
    roles: ['return'],
    posture: 'variety',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'tactics', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'r_read_react',
    emoji: '👁️',
    name: 'Read and react',
    description: 'Pick the direction and redirect with precision',
    roles: ['return'],
    posture: 'variety',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'tactics', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'r_sabr',
    emoji: '🥷',
    name: 'Charge the second serve',
    description: 'Sprint in and take it on the rise',
    roles: ['return'],
    posture: 'variety',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'tactics', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'return', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'return', shooter: 'player' },
    },
  },
  {
    id: 'y_steady_depth',
    emoji: '✅',
    name: 'Heavy and deep, no risk',
    description: 'Keep the weight on without going for it',
    roles: ['rally'],
    posture: 'power',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'forehand',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
  {
    id: 'y_flatten_line',
    emoji: '💥',
    name: 'Flatten it out down the line',
    description: 'Change direction with everything you have',
    roles: ['rally'],
    posture: 'power',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'forehand',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
  {
    id: 'y_accelerate',
    emoji: '🚀',
    name: 'Push the accelerator',
    description: 'Take control and force the winner',
    roles: ['rally'],
    posture: 'power',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'forehand',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'placement', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
  {
    id: 'y_build_approach',
    emoji: '📐',
    name: 'Build the approach, then close',
    description: 'Earn the short ball before you come in',
    roles: ['rally'],
    posture: 'net',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'y_attack_net',
    emoji: '🏃',
    name: 'Attack the net',
    description: 'Force the approach and close the point out',
    roles: ['rally'],
    posture: 'net',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'y_reset_height',
    emoji: '☁️',
    name: 'Reset with height and depth',
    description: 'Take the sting out and recover',
    roles: ['rally'],
    posture: 'neutralize',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'slice', shooter: 'player' },
    },
  },
  {
    id: 'y_disguise_direction',
    emoji: '🃏',
    name: 'Disguised change of direction',
    description: 'Show one way, go the other',
    roles: ['rally'],
    posture: 'deception',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'net', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'y_drop_behind',
    emoji: '🩰',
    name: 'Drop it behind them',
    description: 'They are deep and leaning — bring them in',
    roles: ['rally'],
    posture: 'deception',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'net', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'y_construct',
    emoji: '🧩',
    name: 'Patiently construct the point',
    description: 'Move them around and wait for the opening',
    roles: ['rally'],
    posture: 'attrition',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'slice', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'y_corner_to_corner',
    emoji: '🏃',
    name: 'Run them corner to corner',
    description: 'Make the point cost them',
    roles: ['rally'],
    posture: 'attrition',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'slice', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'y_close_short',
    emoji: '✅',
    name: 'Close only on a short ball',
    description: 'Come in when the ball earns it, not before',
    roles: ['rally'],
    posture: 'net',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'net',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'anticipation', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'speed', weight: 0.3 },
        { stat: 'backhand', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'volley', shooter: 'player' },
      failure: { outcome: PointType.WINNER, shotType: 'passing_shot', shooter: 'opponent' },
    },
  },
  {
    id: 'y_roll_deep',
    emoji: '↩️',
    name: 'Roll it deep crosscourt',
    description: 'Heavy and safe into the big part of the court',
    roles: ['rally'],
    posture: 'neutralize',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'slice', shooter: 'player' },
    },
  },
  {
    id: 'y_carve_low',
    emoji: '🪶',
    name: 'Skid a low slice at their feet',
    description: 'A fine margin, but nothing comes back clean',
    roles: ['rally'],
    posture: 'neutralize',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'spin',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'strength', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'forehand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'slice', shooter: 'player' },
    },
  },
  {
    id: 'y_show_drop',
    emoji: '🃏',
    name: 'Show the drop, hit it deep',
    description: 'Sell the short ball, then go long',
    roles: ['rally'],
    posture: 'deception',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'placement',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'slice', weight: 0.3 },
        { stat: 'spin', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'speed',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'net', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'drop_shot', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'drop_shot', shooter: 'player' },
    },
  },
  {
    id: 'y_grind_backhand',
    emoji: '⛏️',
    name: 'Grind the backhand',
    description: 'Go there again. And again.',
    roles: ['rally'],
    posture: 'attrition',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'backhand', weight: 0.3 },
        { stat: 'focus', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'stamina',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'slice', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.FORCED_ERROR, shotType: 'backhand', shooter: 'opponent' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'backhand', shooter: 'player' },
    },
  },
  {
    id: 'y_sudden_change',
    emoji: '🎲',
    name: 'Change everything at once',
    description: 'New pace, new direction, new height',
    roles: ['rally'],
    posture: 'variety',
    risk: 'bold',
    secondaryEffects: RISK_EFFECTS.bold,
    playerStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
  {
    id: 'y_two_speed',
    emoji: '🎚️',
    name: 'Take one early, then take pace off',
    description: 'Never let them groove',
    roles: ['rally'],
    posture: 'variety',
    risk: 'safe',
    secondaryEffects: RISK_EFFECTS.safe,
    playerStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
  {
    id: 'y_change_pattern',
    emoji: '🔀',
    name: 'Change the pattern',
    description: 'Break your own rhythm before they read it',
    roles: ['rally'],
    posture: 'variety',
    risk: 'balanced',
    secondaryEffects: RISK_EFFECTS.balanced,
    playerStatWeights: {
      primary: 'tactics',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'anticipation', weight: 0.3 },
        { stat: 'speed', weight: 0.3 },
      ],
    },
    opponentStatWeights: {
      primary: 'anticipation',
      primaryWeight: 0.4,
      secondary: [
        { stat: 'focus', weight: 0.3 },
        { stat: 'tactics', weight: 0.3 },
      ],
    },
    shotOutcomes: {
      success: { outcome: PointType.WINNER, shotType: 'forehand', shooter: 'player' },
      failure: { outcome: PointType.UNFORCED_ERROR, shotType: 'forehand', shooter: 'player' },
    },
  },
];

/**
 * Every option this role is allowed to offer.
 *
 * Role is the only axis: what is on the line and whether you are chasing or
 * hanging on change the *stakes* of a key moment, not which shots are physically
 * available. An earlier model also filtered on those two, but nothing ever used
 * the stakes filter and only one authored pair used pressure — a "nothing to
 * lose" swing that existed to avoid deleting a duplicate. Both axes came out
 * with it.
 *
 * The three roles are discrete: a deuce point draws rally options only. That
 * keeps each pool a clean 18 — one option per posture x risk — so a menu can
 * never show the same kind of play twice.
 */
export function getEligibleOptions(role: KeyMomentRole): TacticalOption[] {
  return TACTICAL_OPTIONS.filter((option) => option.roles.includes(role));
}

/**
 * Draw a menu for a role.
 *
 * Constraints rather than fixed slots, so the *shape* of the hand varies too:
 * sometimes safe/bold/net, sometimes two bold options of different postures. The
 * two guarantees are that there is always a real choice of exposure (at least two
 * risk levels) and always a matchup decision to make (at least two postures).
 *
 * `avoidPostures` lets the caller keep consecutive moments from repeating — it is
 * a preference, not a filter, so a thin pool still returns a full menu.
 */
export function drawOptions(
  role: KeyMomentRole,
  count = 3,
  avoidPostures: KeyMomentPosture[] = []
): TacticalOption[] {
  const pool = shuffle(getEligibleOptions(role));
  if (pool.length <= count) return pool;

  // Prefer postures the previous moment did not use, but fall back to the whole
  // pool rather than returning a short menu.
  const fresh = pool.filter((o) => !avoidPostures.includes(o.posture));
  const ordered = [...fresh, ...pool.filter((o) => avoidPostures.includes(o.posture))];

  const picked: TacticalOption[] = [];
  const take = (predicate: (o: TacticalOption) => boolean): void => {
    const found = ordered.find((o) => !picked.includes(o) && predicate(o));
    if (found) picked.push(found);
  };

  // Seed both ends of the risk axis so exposure is always a real choice.
  take((o) => o.risk === 'bold');
  take((o) => o.risk !== 'bold');

  // Fill the rest, preferring postures not already on the menu.
  while (picked.length < count) {
    const postures = picked.map((o) => o.posture);
    const before = picked.length;
    take((o) => !postures.includes(o.posture));
    if (picked.length === before) take(() => true);
    if (picked.length === before) break;
  }

  return shuffle(picked);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * The situations the match engine detects. Retained as an enumeration because the
 * engine reasons about the score, but it is now just a label for a point on the
 * (role, stakes, pressure) axes rather than a content bucket with its own menu.
 */
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
  | 'match-point-opponent-return'
  | 'key-rally';

/**
 * Which side of the ball each detected moment is played from. Stakes are carried
 * by the score and by updatePressure(), not by the option pool.
 */
const ROLE_BY_TYPE: Record<KeyMomentType, KeyMomentRole> = {
  'break-point-serve': 'serve',
  'break-point-return': 'return',
  'set-point-player-serve': 'serve',
  'set-point-player-return': 'return',
  'set-point-opponent-serve': 'serve',
  'set-point-opponent-return': 'return',
  'match-point-player-serve': 'serve',
  'match-point-player-return': 'return',
  'match-point-opponent-serve': 'serve',
  'match-point-opponent-return': 'return',
  // A deuce point tests how the point is constructed rather than how it starts.
  'key-rally': 'rally',
};

/** The role a detected key moment draws from. */
export function getRole(type: KeyMomentType): KeyMomentRole {
  return ROLE_BY_TYPE[type];
}

/** Draw the menu for a detected key moment. */
export function getOptionsForSituation(
  type: KeyMomentType,
  count = 3,
  avoidPostures: KeyMomentPosture[] = []
): TacticalOption[] {
  return drawOptions(getRole(type), count, avoidPostures);
}

/** Get a specific option by ID. */
export function getOptionById(id: string): TacticalOption | undefined {
  return TACTICAL_OPTIONS.find((option) => option.id === id);
}
