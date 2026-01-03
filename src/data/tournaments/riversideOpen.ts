/**
 * Riverside Open Tournament Configuration
 * The first tournament featuring 4 rounds with named opponents
 */

import type { TournamentConfig, TournamentOpponent } from '../../types/tournaments';

// ============================================================================
// OPPONENT DEFINITIONS
// ============================================================================

const keith: TournamentOpponent = {
  characterId: 'keith',
  name: 'Keith',
  tier: 1,
  description: 'He just lost to his little sister. You can do this.',
  stats: {
    technical: {
      serve: 18,
      forehand: 18,
      backhand: 15,
      volley: 14,
      overhead: 18,
      dropShot: 10,
      slice: 15,
      return: 18,
      spin: 20,
      placement: 23,
    },
    physical: {
      speed: 20,
      stamina: 12,
      strength: 15,
      agility: 18,
      recovery: 20,
    },
    mental: {
      focus: 15,
      anticipation: 12,
      shotVariety: 18,
      offensive: 10,
      defensive: 15,
    },
  },
};

const chris: TournamentOpponent = {
  characterId: 'chris',
  name: 'Chris',
  tier: 1,
  description: 'A tactical player with strong mental game and consistent groundstrokes',
  stats: {
    technical: {
      serve: 22,
      forehand: 25,
      backhand: 28,
      volley: 23,
      overhead: 20,
      dropShot: 25,
      slice: 27,
      return: 26,
      spin: 24,
      placement: 28,
    },
    physical: {
      speed: 26,
      stamina: 28,
      strength: 22,
      agility: 28,
      recovery: 27,
    },
    mental: {
      focus: 22,
      anticipation: 20,
      shotVariety: 28,
      offensive: 22,
      defensive: 20,
    },
  },
};

const zack: TournamentOpponent = {
  characterId: 'zack',
  name: 'Zack',
  tier: 1,
  description: 'A defensive specialist with exceptional court coverage and shot placement.',
  stats: {
    technical: {
      serve: 25,
      forehand: 30,
      backhand: 30,
      volley: 22,
      overhead: 24,
      dropShot: 20,
      slice: 35,
      return: 40,
      spin: 35,
      placement: 40,
    },
    physical: {
      speed: 40,
      stamina: 35,
      strength: 25,
      agility: 35,
      recovery: 30,
    },
    mental: {
      focus: 40,
      anticipation: 38,
      shotVariety: 25,
      offensive: 20,
      defensive: 45,
    },
  },
};

const jordan: TournamentOpponent = {
  characterId: 'jordan_rival',
  name: 'Jordan',
  tier: 1,
  description: 'Your rival with improving skills and a competitive edge. He\'s well-rounded and adaptable.',
  stats: {
    technical: {
      serve: 35,
      forehand: 40,
      backhand: 38,
      volley: 40,
      overhead: 35,
      dropShot: 35,
      slice: 40,
      return: 38,
      spin: 35,
      placement: 40,
    },
    physical: {
      speed: 38,
      stamina: 40,
      strength: 40,
      agility: 36,
      recovery: 30,
    },
    mental: {
      focus: 40,
      anticipation: 33,
      shotVariety: 28,
      offensive: 38,
      defensive: 28,
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

    // Round 3: vs Zack
    {
      roundNumber: 3,
      opponent: zack,
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
