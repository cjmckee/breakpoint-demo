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
      serve: 38,
      forehand: 42,
      backhand: 36,
      volley: 42,
      overhead: 32,
      dropShot: 31,
      slice: 41,
      return: 40,
      spin: 38,
      placement: 41,
    },
    physical: {
      speed: 41,
      stamina: 40,
      strength: 40,
      agility: 36,
      recovery: 30,
    },
    mental: {
      focus: 36,
      anticipation: 33,
      shotVariety: 28,
      offensive: 40,
      defensive: 28,
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
      serve: 38,
      forehand: 40,
      backhand: 32,
      volley: 42,
      overhead: 34,
      dropShot: 36,
      slice: 40,
      return: 38,
      spin: 38,
      placement: 42,
    },
    physical: {
      speed: 48,
      stamina: 40,
      strength: 24,
      agility: 42,
      recovery: 36,
    },
    mental: {
      focus: 46,
      anticipation: 42,
      shotVariety: 45,
      offensive: 36,
      defensive: 42,
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
      serve: 46,
      forehand: 50,
      backhand: 44,
      volley: 44,
      overhead: 42,
      dropShot: 40,
      slice: 48,
      return: 48,
      spin: 46,
      placement: 51,
    },
    physical: {
      speed: 46,
      stamina: 51,
      strength: 46,
      agility: 44,
      recovery: 46,
    },
    mental: {
      focus: 48,
      anticipation: 51,
      shotVariety: 44,
      offensive: 46,
      defensive: 48,
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
      serve: 48,
      forehand: 53,
      backhand: 46,
      volley: 44,
      overhead: 42,
      dropShot: 46,
      slice: 51,
      return: 51,
      spin: 48,
      placement: 51,
    },
    physical: {
      speed: 44,
      stamina: 59,
      strength: 44,
      agility: 46,
      recovery: 62,
    },
    mental: {
      focus: 51,
      anticipation: 53,
      shotVariety: 46,
      offensive: 46,
      defensive: 55,
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
