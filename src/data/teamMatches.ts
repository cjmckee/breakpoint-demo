/**
 * Team Match Configurations
 * Defines opponents and match settings for career storyline team matches.
 * Mirrors the tournament pattern: opponents defined as constants, referenced by configs.
 */

import type { MatchOpponent } from '../types/tournaments';
import type { StoryMatchMetadata, TeamMatchConfig } from '../types/game';
import { AbilityName } from '../types/game';
import { ABILITY_DEFINITIONS } from './abilities';
import { profileForArchetype } from './archetypeTree';
import {
  ASPEN_SLOPES_ACADEMY,
  AZALEA_FOREST_CLUB,
  COSMO_COMET,
  DOBRY_POMIDOR,
  SUNSET_DRIVE,
} from './venues';

// ============================================================================
// OPPONENT DEFINITIONS
// ============================================================================

const chetVale: MatchOpponent = {
  characterId: 'chet_vale',
  name: 'Chet Vale',
  tier: 1,
  archetype: 'counterpuncher',
  description: 'A speedy but inexperienced player from Aspen Slopes Academy',
  stats: {
    core: { serve: 30, forehand: 28, backhand: 23, return: 27, net: 19 },
    technical: { slice: 21, spin: 23, placement: 25 },
    physical: { speed: 48, stamina: 38, strength: 21 },
    mental: { focus: 28, anticipation: 33, tactics: 31 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.SLIDER]],
};

const richSoil: MatchOpponent = {
  characterId: 'richard_soil',
  name: 'Rich Soil',
  tier: 1,
  archetype: 'all_court',
  description: 'A pretty strong well-rounded player from Azalea Forest',
  stats: {
    core: { serve: 34, forehand: 38, backhand: 32, return: 36, net: 33 },
    technical: { slice: 37, spin: 34, placement: 37 },
    physical: { speed: 37, stamina: 36, strength: 36 },
    mental: { focus: 32, anticipation: 29, tactics: 30 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.SPIN_MASTER]],
};

const martiaEstrella: MatchOpponent = {
  characterId: 'martia_estrella',
  name: 'Martia Estrella',
  tier: 1,
  archetype: 'serve_volley',
  description: 'An up-and-coming star known for her volleys and court coverage.',
  stats: {
    core: { serve: 36, forehand: 38, backhand: 32, return: 36, net: 33 },
    technical: { slice: 38, spin: 33, placement: 37 },
    physical: { speed: 43, stamina: 35, strength: 19 },
    mental: { focus: 41, anticipation: 37, tactics: 34 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.NETCRASHER]],
};

const reginaldWerther: MatchOpponent = {
  characterId: 'reginald_werther',
  name: 'Reginald Werther',
  tier: 1,
  archetype: 'defensive',
  description:
    'A steady, patient player from Sunset Drive. He won tournaments 100 years before you were born.',
  stats: {
    core: { serve: 39, forehand: 42, backhand: 38, return: 39, net: 34 },
    technical: { slice: 38, spin: 36, placement: 41 },
    physical: { speed: 37, stamina: 41, strength: 36 },
    mental: { focus: 38, anticipation: 41, tactics: 37 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.BASELINER]],
};

const oliviaGulp: MatchOpponent = {
  characterId: 'olivia_gulp',
  name: 'Olivia Gulp',
  tier: 1,
  archetype: 'aggressive',
  description:
    "A talented chef with a variety of skills on the court. If you can't take the heat, you could get burned.",
  stats: {
    core: { serve: 41, forehand: 45, backhand: 38, return: 43, net: 33 },
    technical: { slice: 45, spin: 38, placement: 40 },
    physical: { speed: 35, stamina: 47, strength: 34 },
    mental: { focus: 40, anticipation: 42, tactics: 40 },
  },
  abilities: [ABILITY_DEFINITIONS[AbilityName.SOFT_HANDS]],
};

// ============================================================================
// MATCH CONFIGURATIONS
// ============================================================================

export const TEAM_MATCH_1: TeamMatchConfig = {
  opponent: chetVale,
  venue: ASPEN_SLOPES_ACADEMY,
  matchFormat: 'best-of-3',
  matchTitle: 'Team Match: Riverside vs Aspen Slopes',
  matchDescription: 'Your first official team match',
  prematchEventId: 'first_team_match_prematch',
  winEventId: 'first_team_match_win',
  lossEventId: 'first_team_match_loss',
};

export const TEAM_MATCH_2: TeamMatchConfig = {
  opponent: richSoil,
  venue: AZALEA_FOREST_CLUB,
  matchFormat: 'best-of-3',
  matchTitle: 'Team Match: Riverside vs Azalea Forest',
  matchDescription: 'Your second official team match',
  prematchEventId: 'second_team_match_prematch',
  winEventId: 'second_team_match_win',
  lossEventId: 'second_team_match_loss',
};

export const TEAM_MATCH_3: TeamMatchConfig = {
  opponent: martiaEstrella,
  venue: COSMO_COMET,
  matchFormat: 'best-of-3',
  matchTitle: 'Team Match: Riverside vs Cosmo Comet',
  matchDescription: 'Your third official team match',
  prematchEventId: 'third_team_match_prematch',
  winEventId: 'third_team_match_win',
  lossEventId: 'third_team_match_loss',
};

export const TEAM_MATCH_4: TeamMatchConfig = {
  opponent: reginaldWerther,
  venue: SUNSET_DRIVE,
  matchFormat: 'best-of-3',
  matchTitle: 'Team Match: Riverside vs Sunset Drive',
  matchDescription: 'Your fourth official team match',
  prematchEventId: 'fourth_team_match_prematch',
  winEventId: 'fourth_team_match_win',
  lossEventId: 'fourth_team_match_loss',
};

export const TEAM_MATCH_5: TeamMatchConfig = {
  opponent: oliviaGulp,
  venue: DOBRY_POMIDOR,
  matchFormat: 'best-of-3',
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
    opponentAbilities: config.opponent.abilities,
    opponentArchetypeProfile: profileForArchetype(config.opponent.archetype, config.opponent.tier),
    prematchEventId: config.prematchEventId,
    winEventId: config.winEventId,
    lossEventId: config.lossEventId,
    surface: config.venue.surface,
    venueId: config.venue.id,
    home: config.home,
    matchFormat: config.matchFormat,
    matchTitle: config.matchTitle,
    matchDescription: config.matchDescription,
  };
}
