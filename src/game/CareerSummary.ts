/**
 * Career Summary — everything the end screen shows about a career, from the save.
 *
 * Pure: it reads the player and the store's story, challenge and calendar state and
 * returns plain values, so the screen only lays them out.
 */

import type { GameCalendar, OpponentTier, Player, TeamMatchConfig } from '../types/game';
import type { GameArea } from '../core/gameAreas';
import { gameAreaRatings } from '../core/gameAreas';
import { calculateOverallRating } from '../core/PlayerProfile';
import { BROAD_ARCHETYPE_LABELS, DEFAULT_ARCHETYPE_LABEL } from '../data/archetypeTree';
import { getCharacterName } from '../data/characters';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../data/teamMatches';
import { TournamentRegistry } from '../data/tournaments';
import { getTierLabel } from '../utils/playerStats';

/** The Club season's team matches, in the order they're played. */
const TEAM_MATCHES: TeamMatchConfig[] = [
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
];

export interface TeamMatchRecord {
  opponent: string;
  /** Null when the match hasn't been played. */
  result: 'win' | 'loss' | null;
}

export interface CareerSummary {
  name: string;
  tier: string;
  level: number;
  archetype: string;
  overall: number;
  areas: Record<GameArea, number>;
  /** Career days played. */
  days: number;
  matches: { played: number; won: number; lost: number; winRate: number };
  /** Newest first, up to ten. */
  form: Array<'win' | 'loss'>;
  teamMatches: TeamMatchRecord[];
  tournaments: Array<{ name: string; won: boolean }>;
  highlights: {
    aces: number;
    winners: number;
    netPoints: number;
    breakPoints: number;
    longRallies: number;
    trainingSessions: number;
    storyEvents: number;
    challenges: number;
    experience: number;
  };
  abilities: Array<{ name: string; level: number; rarity: string }>;
  /** The closest relationships, strongest first, up to three. */
  friends: Array<{ name: string; value: number }>;
}

export function careerSummary(
  player: Player,
  state: {
    calendar: GameCalendar;
    completedStoryEvents: string[];
    completedChallenges: string[];
    relationships: Record<string, number>;
  },
): CareerSummary {
  const played = player.matchesPlayed ?? 0;
  const won = player.matchesWon ?? 0;
  const completed = new Set(state.completedStoryEvents);

  return {
    name: player.name,
    tier: getTierLabel(player.tier as OpponentTier),
    level: player.level,
    archetype: player.archetypeProfile.broad
      ? BROAD_ARCHETYPE_LABELS[player.archetypeProfile.broad]
      : DEFAULT_ARCHETYPE_LABEL,
    overall: calculateOverallRating(player.stats),
    areas: gameAreaRatings(player.stats),
    days: state.calendar.currentDay,
    matches: {
      played,
      won,
      lost: played - won,
      winRate: played > 0 ? Math.round((won / played) * 100) : 0,
    },
    form: player.latestMatchResults ?? [],
    teamMatches: TEAM_MATCHES.map((match) => ({
      opponent: match.opponent.name,
      result: completed.has(match.winEventId)
        ? 'win'
        : completed.has(match.lossEventId)
          ? 'loss'
          : null,
    })),
    tournaments: state.calendar.completedTournaments.map((t) => ({
      name: TournamentRegistry.getTournament(t.tournamentId)?.name ?? t.tournamentId,
      won: t.won,
    })),
    highlights: {
      aces: player.cumulativeMatchStats.aces,
      winners: player.cumulativeMatchStats.winners,
      netPoints: player.cumulativeMatchStats.netPoints,
      breakPoints: player.cumulativeMatchStats.breakPoints,
      longRallies: player.cumulativeMatchStats.longRallies,
      trainingSessions: player.trainingSessionsCompleted,
      storyEvents: state.completedStoryEvents.length,
      challenges: state.completedChallenges.length,
      experience: player.totalExperienceEarned,
    },
    abilities: player.abilities.map((a) => ({ name: a.name, level: a.level, rarity: a.rarity })),
    friends: Object.entries(state.relationships)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, value]) => ({ name: getCharacterName(id) ?? id, value })),
  };
}
