/**
 * Riverside Open Tournament Configuration
 * The first tournament featuring 4 rounds with named opponents
 */

import type { TournamentConfig, MatchOpponent } from '../../types/tournaments';
import { AbilityName } from '../../types/game';
import { ABILITY_DEFINITIONS } from '../abilities';

// ============================================================================
// OPPONENT DEFINITIONS
// ============================================================================

const keith: MatchOpponent = {
  characterId: 'keith',
  name: 'Keith',
  tier: 1,
  archetype: 'aggressive',
  description: 'He lost to his little sister, but he\'s been training hard since. Don\'t underestimate his speed.',
  stats: {
    core: { serve: 37, forehand: 39, backhand: 33, return: 37, net: 34 },
    technical: { slice: 33, spin: 41, placement: 45 },
    physical: { speed: 43, stamina: 31, strength: 33 },
    mental: { focus: 35, anticipation: 31, tactics: 31 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.RANGY_RETURN]],
};

const chris: MatchOpponent = {
  characterId: 'chris',
  name: 'Chris',
  tier: 1,
  archetype: 'counterpuncher',
  description: 'A tactical player with strong mental game and consistent groundstrokes. He\'s improved noticeably since you last saw him.',
  stats: {
    core: { serve: 41, forehand: 40, backhand: 44, return: 42, net: 34 },
    technical: { slice: 42, spin: 37, placement: 43 },
    physical: { speed: 40, stamina: 42, strength: 35 },
    mental: { focus: 35, anticipation: 33, tactics: 34 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.CLUTCH]],
};

const max: MatchOpponent = {
  characterId: 'max',
  name: 'Max',
  tier: 1,
  archetype: 'defensive',
  description: 'A defensive specialist with great court coverage. His return game and placement are his biggest weapons. Don\'t let him get comfortable.',
  stats: {
    core: { serve: 44, forehand: 42, backhand: 44, return: 52, net: 33 },
    technical: { slice: 46, spin: 44, placement: 48 },
    physical: { speed: 48, stamina: 46, strength: 34 },
    mental: { focus: 46, anticipation: 44, tactics: 42 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.SPEED_DEMON]],
};

const jordan: MatchOpponent = {
  characterId: 'jordan_rival',
  name: 'Jordan',
  tier: 1,
  archetype: 'serve_volley',
  description: 'Your rival. He\'s been preparing for this tournament seriously and it shows. Well-rounded, competitive, and dangerous in every situation.',
  stats: {
    core: { serve: 50, forehand: 50, backhand: 46, return: 47, net: 43 },
    technical: { slice: 48, spin: 40, placement: 48 },
    physical: { speed: 44, stamina: 48, strength: 46 },
    mental: { focus: 46, anticipation: 40, tactics: 40 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.SERVE_CANNON]],
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
