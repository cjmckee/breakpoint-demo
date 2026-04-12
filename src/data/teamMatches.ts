/**
 * Team Match Configurations
 * Defines opponents and match settings for career storyline team matches.
 * Mirrors the tournament pattern: opponents defined as constants, referenced by configs.
 */

import type { MatchOpponent } from '../types/tournaments';
import type { StoryMatchMetadata, TeamMatchConfig } from '../types/game';

// ============================================================================
// OPPONENT DEFINITIONS
// ============================================================================

const chetVale: MatchOpponent = {
  characterId: 'chet_vale',
  name: 'Chet Vale',
  tier: 1,
  description: 'A speedy but inexperienced player from Aspen Slopes Academy',
  stats: {
    technical: {
      serve: 22,
      forehand: 25,
      backhand: 20,
      volley: 15,
      overhead: 18,
      dropShot: 12,
      slice: 18,
      return: 24,
      spin: 20,
      placement: 22,
    },
    physical: {
      speed: 45,
      stamina: 35,
      strength: 18,
      agility: 42,
      recovery: 30,
    },
    mental: {
      focus: 25,
      anticipation: 30,
      shotVariety: 20,
      offensive: 22,
      defensive: 35,
    },
  },
};

const richSoil: MatchOpponent = {
  characterId: 'richard_soil',
  name: 'Rich Soil',
  tier: 1,
  description: 'A pretty strong well-rounded player from Azalea Forest',
  stats: {
    technical: {
      serve: 28,
      forehand: 32,
      backhand: 26,
      volley: 32,
      overhead: 22,
      dropShot: 21,
      slice: 31,
      return: 30,
      spin: 28,
      placement: 31,
    },
    physical: {
      speed: 31,
      stamina: 30,
      strength: 30,
      agility: 26,
      recovery: 20,
    },
    mental: {
      focus: 26,
      anticipation: 23,
      shotVariety: 18,
      offensive: 30,
      defensive: 18,
    },
  },
};

const martiaEstrella: MatchOpponent = {
  characterId: 'martia_estrella',
  name: 'Martia Estrella',
  tier: 1,
  description: 'An up-and-coming star known for her volleys and court coverage.',
  stats: {
    technical: {
      serve: 28,
      forehand: 30,
      backhand: 22,
      volley: 32,
      overhead: 24,
      dropShot: 26,
      slice: 30,
      return: 28,
      spin: 28,
      placement: 32,
    },
    physical: {
      speed: 38,
      stamina: 30,
      strength: 14,
      agility: 32,
      recovery: 26,
    },
    mental: {
      focus: 36,
      anticipation: 32,
      shotVariety: 35,
      offensive: 26,
      defensive: 32,
    },
  },
};

const reginaldWerther: MatchOpponent = {
  characterId: 'reginald_werther',
  name: 'Reginald Werther',
  tier: 1,
  description: 'A steady, patient player from Sunset Drive. He won tournaments 100 years before you were born.',
  stats: {
    technical: {
      serve: 36,
      forehand: 40,
      backhand: 34,
      volley: 34,
      overhead: 32,
      dropShot: 30,
      slice: 38,
      return: 38,
      spin: 36,
      placement: 41,
    },
    physical: {
      speed: 36,
      stamina: 41,
      strength: 36,
      agility: 34,
      recovery: 36,
    },
    mental: {
      focus: 38,
      anticipation: 41,
      shotVariety: 34,
      offensive: 36,
      defensive: 38,
    },
  },
};

const oliviaGulp: MatchOpponent = {
  characterId: 'olivia_gulp',
  name: 'Olivia Gulp',
  tier: 1,
  description: 'A talented chef with a variety of skills on the court. If you can\'t take the heat, you could get burned.',
  stats: {
    technical: {
      serve: 39,
      forehand: 44,
      backhand: 37,
      volley: 35,
      overhead: 33,
      dropShot: 37,
      slice: 42,
      return: 42,
      spin: 39,
      placement: 42,
    },
    physical: {
      speed: 35,
      stamina: 50,
      strength: 35,
      agility: 37,
      recovery: 53,
    },
    mental: {
      focus: 42,
      anticipation: 44,
      shotVariety: 37,
      offensive: 37,
      defensive: 46,
    },
  },
};

// ============================================================================
// MATCH CONFIGURATIONS
// ============================================================================

export const TEAM_MATCH_1: TeamMatchConfig = {
  opponent: chetVale,
  surface: 'hard',
  matchFormat: 'best-of-1',
  matchTitle: 'Team Match: Riverside vs Aspen Slopes',
  matchDescription: 'Your first official team match',
  prematchEventId: 'first_team_match_prematch',
  winEventId: 'first_team_match_win',
  lossEventId: 'first_team_match_loss',
};

export const TEAM_MATCH_2: TeamMatchConfig = {
  opponent: richSoil,
  surface: 'grass',
  matchFormat: 'best-of-1',
  matchTitle: 'Team Match: Riverside vs Azalea Forest',
  matchDescription: 'Your second official team match',
  prematchEventId: 'second_team_match_prematch',
  winEventId: 'second_team_match_win',
  lossEventId: 'second_team_match_loss',
};

export const TEAM_MATCH_3: TeamMatchConfig = {
  opponent: martiaEstrella,
  surface: 'clay',
  matchFormat: 'best-of-1',
  matchTitle: 'Team Match: Riverside vs Cosmo Comet',
  matchDescription: 'Your third official team match',
  prematchEventId: 'third_team_match_prematch',
  winEventId: 'third_team_match_win',
  lossEventId: 'third_team_match_loss',
};

export const TEAM_MATCH_4: TeamMatchConfig = {
  opponent: reginaldWerther,
  surface: 'hard',
  matchFormat: 'best-of-1',
  matchTitle: 'Team Match: Riverside vs Sunset Drive',
  matchDescription: 'Your fourth official team match',
  prematchEventId: 'fourth_team_match_prematch',
  winEventId: 'fourth_team_match_win',
  lossEventId: 'fourth_team_match_loss',
};

export const TEAM_MATCH_5: TeamMatchConfig = {
  opponent: oliviaGulp,
  surface: 'clay',
  matchFormat: 'best-of-1',
  matchTitle: 'Team Match: Riverside vs Dobry Pomidor',
  matchDescription: 'Your fifth official team match',
  prematchEventId: 'fifth_team_match_prematch',
  winEventId: 'fifth_team_match_win',
  lossEventId: 'fifth_team_match_loss',
};

// ============================================================================
// HELPER
// ============================================================================

/**
 * Converts a TeamMatchConfig into StoryMatchMetadata for use in scheduled events.
 */
export function buildStoryMatchMetadata(config: TeamMatchConfig): StoryMatchMetadata {
  return {
    opponentId: config.opponent.characterId,
    opponentName: config.opponent.name,
    opponentStats: config.opponent.stats,
    opponentTier: config.opponent.tier,
    opponentDescription: config.opponent.description,
    prematchEventId: config.prematchEventId,
    winEventId: config.winEventId,
    lossEventId: config.lossEventId,
    surface: config.surface,
    matchFormat: config.matchFormat,
    matchTitle: config.matchTitle,
    matchDescription: config.matchDescription,
  };
}
