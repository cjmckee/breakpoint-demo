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
    core: {
      serve: 37,
      forehand: 39,
      backhand: 33,
      return: 37,
      slice: 33,
    },
    technical: {
      volley: 31,
      overhead: 37,
      dropShot: 25,
      spin: 41,
      placement: 45,
    },
    physical: {
      speed: 43,
      stamina: 31,
      strength: 33,
      agility: 41,
      recovery: 41,
    },
    mental: {
      focus: 35,
      anticipation: 31,
      shotVariety: 37,
      offensive: 27,
      defensive: 35,
    },
  },
};

const chris: MatchOpponent = {
  characterId: 'chris',
  name: 'Chris',
  tier: 1,
  description: 'A tactical player with strong mental game and consistent groundstrokes. He\'s improved noticeably since you last saw him.',
  stats: {
    core: {
      serve: 46,
      forehand: 45,
      backhand: 49,
      return: 47,
      slice: 47,
    },
    technical: {
      volley: 41,
      overhead: 37,
      dropShot: 43,
      spin: 42,
      placement: 48,
    },
    physical: {
      speed: 45,
      stamina: 47,
      strength: 39,
      agility: 47,
      recovery: 45,
    },
    mental: {
      focus: 39,
      anticipation: 37,
      shotVariety: 47,
      offensive: 39,
      defensive: 37,
    },
  },
};

const max: MatchOpponent = {
  characterId: 'max',
  name: 'Max',
  tier: 1,
  description: 'A defensive specialist with great court coverage. His return game and placement are his biggest weapons. Don\'t let him get comfortable.',
  stats: {
    core: {
      serve: 52,
      forehand: 50,
      backhand: 52,
      return: 60,
      slice: 54,
    },
    technical: {
      volley: 38,
      overhead: 41,
      dropShot: 36,
      spin: 52,
      placement: 56,
    },
    physical: {
      speed: 56,
      stamina: 54,
      strength: 41,
      agility: 54,
      recovery: 49,
    },
    mental: {
      focus: 54,
      anticipation: 52,
      shotVariety: 43,
      offensive: 36,
      defensive: 62,
    },
  },
};

const jordan: MatchOpponent = {
  characterId: 'jordan_rival',
  name: 'Jordan',
  tier: 1,
  description: 'Your rival. He\'s been preparing for this tournament seriously and it shows. Well-rounded, competitive, and dangerous in every situation.',
  stats: {
    core: {
      serve: 61,
      forehand: 61,
      backhand: 56,
      return: 57,
      slice: 59,
    },
    technical: {
      volley: 56,
      overhead: 49,
      dropShot: 49,
      spin: 49,
      placement: 58,
    },
    physical: {
      speed: 54,
      stamina: 58,
      strength: 56,
      agility: 52,
      recovery: 49,
    },
    mental: {
      focus: 56,
      anticipation: 49,
      shotVariety: 45,
      offensive: 54,
      defensive: 45,
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
