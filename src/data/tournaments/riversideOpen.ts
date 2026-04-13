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
      serve: 35,
      forehand: 37,
      backhand: 31,
      return: 35,
      slice: 31,
    },
    technical: {
      volley: 29,
      overhead: 35,
      dropShot: 23,
      spin: 39,
      placement: 43,
    },
    physical: {
      speed: 41,
      stamina: 29,
      strength: 31,
      agility: 39,
      recovery: 39,
    },
    mental: {
      focus: 33,
      anticipation: 29,
      shotVariety: 35,
      offensive: 25,
      defensive: 33,
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
      serve: 37,
      forehand: 41,
      backhand: 45,
      return: 43,
      slice: 43,
    },
    technical: {
      volley: 39,
      overhead: 35,
      dropShot: 41,
      spin: 40,
      placement: 46,
    },
    physical: {
      speed: 43,
      stamina: 45,
      strength: 37,
      agility: 45,
      recovery: 43,
    },
    mental: {
      focus: 37,
      anticipation: 35,
      shotVariety: 45,
      offensive: 37,
      defensive: 35,
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
      serve: 37,
      forehand: 43,
      backhand: 45,
      return: 54,
      slice: 50,
    },
    technical: {
      volley: 34,
      overhead: 37,
      dropShot: 32,
      spin: 48,
      placement: 52,
    },
    physical: {
      speed: 52,
      stamina: 50,
      strength: 37,
      agility: 50,
      recovery: 45,
    },
    mental: {
      focus: 50,
      anticipation: 48,
      shotVariety: 39,
      offensive: 32,
      defensive: 58,
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
      serve: 47,
      forehand: 53,
      backhand: 49,
      return: 49,
      slice: 51,
    },
    technical: {
      volley: 51,
      overhead: 44,
      dropShot: 44,
      spin: 44,
      placement: 53,
    },
    physical: {
      speed: 49,
      stamina: 53,
      strength: 51,
      agility: 47,
      recovery: 44,
    },
    mental: {
      focus: 51,
      anticipation: 44,
      shotVariety: 40,
      offensive: 49,
      defensive: 40,
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
