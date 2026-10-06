/**
 * Match tally — point, game and match win rates from a match's points.
 *
 * Match win rate swings hard on small edges (a 52% point-winner wins most
 * matches), so on its own it hides whether stats are working. Point win rate
 * is the direct read of the stats; game win rate sits between, and split into
 * service holds and return breaks it shows whether serve and return stats are
 * doing their jobs. Every harness that reports a match result should report
 * all three.
 *
 * Games are found by replaying the points through a fresh ScoreTracker, so this
 * works on any engine's output: MatchSimulator's exportMatchData().points, or a
 * harness loop's own list. Tiebreaks count as games but as neither a hold nor a
 * break.
 */

import type { MatchFormat } from '../../types';
import { ScoreTracker } from '../../core/ScoreTracker';

type Side = 'player' | 'opponent';

export interface Rates {
  points: number;
  pointsWon: number;
  games: number;
  gamesWon: number;
  serviceGames: number;
  holds: number;
  returnGames: number;
  breaks: number;
  matches: number;
  matchesWon: number;
}

export const emptyRates = (): Rates => ({
  points: 0,
  pointsWon: 0,
  games: 0,
  gamesWon: 0,
  serviceGames: 0,
  holds: 0,
  returnGames: 0,
  breaks: 0,
  matches: 0,
  matchesWon: 0,
});

const gamesOf = (t: ScoreTracker, side: Side): number =>
  t.getScore().sets.reduce((sum, set) => sum + set[side], 0);

/** Add one match, given each point's server and winner in order, to `into`. */
export function tallyMatch(
  points: ReadonlyArray<{ server: Side; winner: Side }>,
  format: MatchFormat,
  into: Rates,
): Rates {
  if (points.length === 0) return into;
  const t = new ScoreTracker(format);
  t.setInitialServer(points[0].server);
  for (const pt of points) {
    const server = t.getCurrentServer();
    const tiebreak = t.isInTiebreak();
    const before = gamesOf(t, 'player');
    const beforeOpp = gamesOf(t, 'opponent');
    t.addPoint(pt.winner);
    into.points++;
    if (pt.winner === 'player') into.pointsWon++;
    const playerGame = gamesOf(t, 'player') > before;
    const opponentGame = gamesOf(t, 'opponent') > beforeOpp;
    if (!playerGame && !opponentGame) continue;
    into.games++;
    if (playerGame) into.gamesWon++;
    if (tiebreak) continue;
    if (server === 'player') {
      into.serviceGames++;
      if (playerGame) into.holds++;
    } else {
      into.returnGames++;
      if (playerGame) into.breaks++;
    }
  }
  into.matches++;
  if (t.getWinner() === 'player') into.matchesWon++;
  return into;
}

const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) : '-');

/** Column headers matching formatRates. */
export const RATE_HEADERS = ['pt-win%', 'game-win%', 'hold%', 'break%', 'match-win%'];

export function formatRates(r: Rates): string[] {
  return [
    pct(r.pointsWon, r.points),
    pct(r.gamesWon, r.games),
    pct(r.holds, r.serviceGames),
    pct(r.breaks, r.returnGames),
    pct(r.matchesWon, r.matches),
  ];
}
