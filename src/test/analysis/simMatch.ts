/**
 * One match on the game's own engine, for the analysis harnesses.
 *
 * Harnesses used to carry their own copy of the point loop: ScoreTracker,
 * PointSimulator and per-point fatigue. Those copies had no changeover or
 * set-break recovery and no momentum engine, so once break recovery came to
 * scale with stamina they misstated stamina's value and late-match fatigue.
 * Every harness now plays its matches through MatchSimulator here, so a change
 * to the engine reaches every measurement.
 *
 * MatchSimulator reads the live config objects (shotThresholds and friends), so
 * a harness that mutates config in place for an ablation still sees the change.
 */

import type { CourtSurface, MatchFormat, MatchStatistics, PointAnalysisData } from '../../types';
import { MatchSimulator, type MatchConfig } from '../../core/MatchSimulator';
import type { PlayerProfile } from '../../core/PlayerProfile';

export const BO1: MatchFormat = {
  bestOfSets: 1,
  gamesPerSet: 6,
  enableTiebreaks: true,
  tiebreakAt: 6,
};
export const BO3: MatchFormat = {
  bestOfSets: 3,
  gamesPerSet: 6,
  enableTiebreaks: true,
  tiebreakAt: 6,
};

export interface MatchOptions {
  format?: MatchFormat;
  surface?: CourtSurface;
  /** Who serves first; random when left out. */
  initialServer?: 'player' | 'opponent';
  /** Extra effects beyond the archetype's (abilities), as MatchConfig takes them. */
  playerEffects?: Record<string, number>;
  opponentEffects?: Record<string, number>;
  /** Overrides the match-day form roll; 0 disables it. */
  matchFormVariance?: number;
}

export interface PlayedMatch {
  winner: 'player' | 'opponent';
  /** Every point in order, with its shots. simulateMatch's pointResults is empty. */
  points: PointAnalysisData[];
  statistics: MatchStatistics;
  sets: Array<{ player: number; opponent: number }>;
  endFatigue: { player: number; opponent: number };
}

/**
 * Play one match. The profiles carry the stats and the archetype; the engine
 * derives archetype effects from the profile, rolls match-day form, applies
 * fatigue, changeover and set-break recovery, and runs momentum.
 *
 * Throws if the match hits MatchSimulator's point cap unfinished, rather than
 * hand back a match with no winner.
 */
export function playMatch(
  player: PlayerProfile,
  opponent: PlayerProfile,
  options: MatchOptions = {},
): PlayedMatch {
  const config: MatchConfig = {
    player,
    opponent,
    courtSurface: options.surface ?? 'hard',
    matchFormat: options.format ?? BO3,
    initialServer: options.initialServer,
    playerEffects: options.playerEffects,
    opponentEffects: options.opponentEffects,
    matchFormVariance: options.matchFormVariance,
  };
  const sim = new MatchSimulator(config);
  const result = sim.simulateMatch();
  if (!sim.isMatchComplete()) {
    throw new Error(`match hit the point cap unfinished at ${sim.getCurrentScore()}`);
  }
  const state = sim.getMatchState();
  return {
    winner: result.winner,
    points: sim.exportMatchData().points,
    statistics: result.statistics,
    sets: state.score.sets
      .filter((s) => s.isComplete)
      .map((s) => ({ player: s.player, opponent: s.opponent })),
    endFatigue: { ...state.fatigue },
  };
}
