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
    core: {
      serve: 31,
      forehand: 29,
      backhand: 24,
      return: 28,
      slice: 22,
    },
    technical: {
      volley: 19,
      overhead: 22,
      dropShot: 16,
      spin: 24,
      placement: 26,
    },
    physical: {
      speed: 49,
      stamina: 39,
      strength: 22,
      agility: 46,
      recovery: 34,
    },
    mental: {
      focus: 29,
      anticipation: 34,
      shotVariety: 24,
      offensive: 26,
      defensive: 39,
    },
  },
};

const richSoil: MatchOpponent = {
  characterId: 'richard_soil',
  name: 'Rich Soil',
  tier: 1,
  description: 'A pretty strong well-rounded player from Azalea Forest',
  stats: {
    core: {
      serve: 33,
      forehand: 37,
      backhand: 31,
      return: 35,
      slice: 36,
    },
    technical: {
      volley: 37,
      overhead: 27,
      dropShot: 26,
      spin: 33,
      placement: 36,
    },
    physical: {
      speed: 36,
      stamina: 35,
      strength: 35,
      agility: 31,
      recovery: 25,
    },
    mental: {
      focus: 31,
      anticipation: 28,
      shotVariety: 23,
      offensive: 35,
      defensive: 23,
    },
  },
};

const martiaEstrella: MatchOpponent = {
  characterId: 'martia_estrella',
  name: 'Martia Estrella',
  tier: 1,
  description: 'An up-and-coming star known for her volleys and court coverage.',
  stats: {
    core: {
      serve: 37,
      forehand: 39,
      backhand: 33,
      return: 37,
      slice: 39,
    },
    technical: {
      volley: 38,
      overhead: 30,
      dropShot: 32,
      spin: 34,
      placement: 38,
    },
    physical: {
      speed: 44,
      stamina: 36,
      strength: 20,
      agility: 38,
      recovery: 32,
    },
    mental: {
      focus: 42,
      anticipation: 38,
      shotVariety: 41,
      offensive: 32,
      defensive: 38,
    },
  },
};

const reginaldWerther: MatchOpponent = {
  characterId: 'reginald_werther',
  name: 'Reginald Werther',
  tier: 1,
  description: 'A steady, patient player from Sunset Drive. He won tournaments 100 years before you were born.',
  stats: {
    core: {
      serve: 46,
      forehand: 49,
      backhand: 45,
      return: 46,
      slice: 45,
    },
    technical: {
      volley: 41,
      overhead: 39,
      dropShot: 37,
      spin: 43,
      placement: 48,
    },
    physical: {
      speed: 43,
      stamina: 48,
      strength: 43,
      agility: 41,
      recovery: 43,
    },
    mental: {
      focus: 45,
      anticipation: 48,
      shotVariety: 41,
      offensive: 43,
      defensive: 45,
    },
  },
};

const oliviaGulp: MatchOpponent = {
  characterId: 'olivia_gulp',
  name: 'Olivia Gulp',
  tier: 1,
  description: 'A talented chef with a variety of skills on the court. If you can\'t take the heat, you could get burned.',
  stats: {
    core: {
      serve: 51,
      forehand: 55,
      backhand: 47,
      return: 53,
      slice: 55,
    },
    technical: {
      volley: 43,
      overhead: 41,
      dropShot: 45,
      spin: 47,
      placement: 50,
    },
    physical: {
      speed: 43,
      stamina: 58,
      strength: 43,
      agility: 45,
      recovery: 61,
    },
    mental: {
      focus: 50,
      anticipation: 52,
      shotVariety: 45,
      offensive: 45,
      defensive: 54,
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
