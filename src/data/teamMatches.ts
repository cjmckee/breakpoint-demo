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
      serve: 30,
      forehand: 28,
      backhand: 23,
      return: 27,
      slice: 21,
    },
    technical: {
      volley: 18,
      overhead: 21,
      dropShot: 15,
      spin: 23,
      placement: 25,
    },
    physical: {
      speed: 48,
      stamina: 38,
      strength: 21,
      agility: 45,
      recovery: 33,
    },
    mental: {
      focus: 28,
      anticipation: 33,
      shotVariety: 23,
      offensive: 25,
      defensive: 38,
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
      serve: 31,
      forehand: 35,
      backhand: 29,
      return: 33,
      slice: 34,
    },
    technical: {
      volley: 35,
      overhead: 25,
      dropShot: 24,
      spin: 31,
      placement: 34,
    },
    physical: {
      speed: 34,
      stamina: 33,
      strength: 33,
      agility: 29,
      recovery: 23,
    },
    mental: {
      focus: 29,
      anticipation: 26,
      shotVariety: 21,
      offensive: 33,
      defensive: 21,
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
      serve: 34,
      forehand: 36,
      backhand: 30,
      return: 34,
      slice: 36,
    },
    technical: {
      volley: 35,
      overhead: 27,
      dropShot: 29,
      spin: 31,
      placement: 35,
    },
    physical: {
      speed: 41,
      stamina: 33,
      strength: 17,
      agility: 35,
      recovery: 29,
    },
    mental: {
      focus: 39,
      anticipation: 35,
      shotVariety: 38,
      offensive: 29,
      defensive: 35,
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
      serve: 42,
      forehand: 45,
      backhand: 41,
      return: 42,
      slice: 41,
    },
    technical: {
      volley: 37,
      overhead: 35,
      dropShot: 33,
      spin: 39,
      placement: 44,
    },
    physical: {
      speed: 39,
      stamina: 44,
      strength: 39,
      agility: 37,
      recovery: 39,
    },
    mental: {
      focus: 41,
      anticipation: 44,
      shotVariety: 37,
      offensive: 39,
      defensive: 41,
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
      serve: 46,
      forehand: 50,
      backhand: 42,
      return: 48,
      slice: 50,
    },
    technical: {
      volley: 38,
      overhead: 36,
      dropShot: 40,
      spin: 42,
      placement: 45,
    },
    physical: {
      speed: 38,
      stamina: 53,
      strength: 38,
      agility: 40,
      recovery: 56,
    },
    mental: {
      focus: 45,
      anticipation: 47,
      shotVariety: 40,
      offensive: 40,
      defensive: 49,
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
