/**
 * Riverside Open Tournament Configuration
 * The first tournament featuring 4 rounds with named opponents
 */

import type { TournamentConfig, MatchOpponent } from '../../types/tournaments';

// ============================================================================
// OPPONENT DEFINITIONS
// ============================================================================

const keith: MatchOpponent = {
  characterId: 'keith',
  name: 'Keith',
  tier: 1,
  description: 'He lost to his little sister, but he\'s been training hard since. Don\'t underestimate his speed.',
  stats: {
    technical: {
      serve: 32,
      forehand: 34,
      backhand: 28,
      volley: 26,
      overhead: 32,
      dropShot: 20,
      slice: 28,
      return: 32,
      spin: 36,
      placement: 40,
    },
    physical: {
      speed: 38,
      stamina: 26,
      strength: 28,
      agility: 36,
      recovery: 36,
    },
    mental: {
      focus: 30,
      anticipation: 26,
      shotVariety: 32,
      offensive: 22,
      defensive: 30,
    },
  },
};

const chris: MatchOpponent = {
  characterId: 'chris',
  name: 'Chris',
  tier: 1,
  description: 'A tactical player with strong mental game and consistent groundstrokes. He\'s improved noticeably since you last saw him.',
  stats: {
    technical: {
      serve: 34,
      forehand: 38,
      backhand: 42,
      volley: 36,
      overhead: 32,
      dropShot: 38,
      slice: 40,
      return: 40,
      spin: 37,
      placement: 43,
    },
    physical: {
      speed: 40,
      stamina: 42,
      strength: 34,
      agility: 42,
      recovery: 40,
    },
    mental: {
      focus: 34,
      anticipation: 32,
      shotVariety: 42,
      offensive: 34,
      defensive: 32,
    },
  },
};

const max: MatchOpponent = {
  characterId: 'max',
  name: 'Max',
  tier: 1,
  description: 'A defensive specialist with great court coverage. His return game and placement are his biggest weapons. Don\'t let him get comfortable.',
  stats: {
    technical: {
      serve: 34,
      forehand: 40,
      backhand: 42,
      volley: 31,
      overhead: 34,
      dropShot: 29,
      slice: 47,
      return: 51,
      spin: 45,
      placement: 49,
    },
    physical: {
      speed: 49,
      stamina: 47,
      strength: 34,
      agility: 47,
      recovery: 42,
    },
    mental: {
      focus: 47,
      anticipation: 45,
      shotVariety: 36,
      offensive: 29,
      defensive: 55,
    },
  },
};

const jordan: MatchOpponent = {
  characterId: 'jordan_rival',
  name: 'Jordan',
  tier: 1,
  description: 'Your rival. He\'s been preparing for this tournament seriously and it shows. Well-rounded, competitive, and dangerous in every situation.',
  stats: {
    technical: {
      serve: 44,
      forehand: 50,
      backhand: 46,
      volley: 48,
      overhead: 41,
      dropShot: 41,
      slice: 48,
      return: 46,
      spin: 41,
      placement: 50,
    },
    physical: {
      speed: 46,
      stamina: 50,
      strength: 48,
      agility: 44,
      recovery: 41,
    },
    mental: {
      focus: 48,
      anticipation: 41,
      shotVariety: 37,
      offensive: 46,
      defensive: 37,
    },
  },
};

// ============================================================================
// TOURNAMENT CONFIGURATION
// ============================================================================

export const riversideOpen: TournamentConfig = {
  id: 'riverside_open',
  name: 'Riverside Open',
  description: 'A local club tournament featuring rising players in the region. This is your chance to prove yourself against increasingly skilled opponents.',

  surface: 'hard',

  // Prerequisites
  minPlayerTier: 1,
  minMatchesPlayed: 3,
  requiredEvents: ['riverside_open_prep'],  // Player must complete prep event first

  // Story events
  openingCeremonyEventId: 'riverside_open_opening_ceremony',
  victoryEventId: 'riverside_open_victory',
  eliminationEventId: 'riverside_open_elimination',
  consolationEventId: 'riverside_open_consolation_promotion',

  // Tournament rounds (flexible array - can be any length)
  rounds: [
    // Round 1: vs Keith
    {
      roundNumber: 1,
      opponent: keith,
      prematchEventWinner: 'riverside_r1_prematch_winner',
      prematchEventLoser: 'riverside_r1_prematch_loser',
      winEventId: 'riverside_r1_win',
      lossEventId: 'riverside_r1_loss',
    },

    // Round 2: vs Chris
    {
      roundNumber: 2,
      opponent: chris,
      prematchEventWinner: 'riverside_r2_prematch_winner',
      prematchEventLoser: 'riverside_r2_prematch_loser',
      winEventId: 'riverside_r2_win',
      lossEventId: 'riverside_r2_loss',
    },

    // Round 3: vs Max
    {
      roundNumber: 3,
      opponent: max,
      prematchEventWinner: 'riverside_r3_prematch_winner',
      prematchEventLoser: 'riverside_r3_prematch_loser',
      winEventId: 'riverside_r3_win',
      lossEventId: 'riverside_r3_loss',
    },

    // Round 4: vs Jordan
    {
      roundNumber: 4,
      opponent: jordan,
      prematchEventWinner: 'riverside_r4_prematch_winner',
      prematchEventLoser: 'riverside_r4_prematch_loser',
      winEventId: 'riverside_r4_win',
      lossEventId: 'riverside_r4_loss',
    },
  ],
};
