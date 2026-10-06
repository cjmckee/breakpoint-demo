/**
 * Serve and Upset Probe — two whole-match sanity checks.
 *
 * 1. Serve: in a mirror match a server should hold more often than not, and
 *    double faults should be a small share of points. Reports, for uniform
 *    mirror matches at several ratings: hold %, first-serve-in %, double faults
 *    per service game and as a share of points, ace share, and the server's
 *    point-win %.
 * 2. Upsets: how often the weaker player wins, by rating gap. The game wants
 *    stats to matter and still let a weaker player win sometimes; this is the
 *    curve that decides whether it does.
 *
 * Uniform builds with no archetype, hard court, so the numbers describe the
 * engine rather than any one playstyle.
 *
 * Run: npx tsx src/test/analysis/serveAndUpsetProbe.ts
 * Env: N=400 (matches per row)  RATINGS=25,35,50,70  BASE=35  GAPS=0,3,6,10,15,20
 *      SECTIONS=serve,upset  FORMAT=best-of-3|best-of-1
 */

import type { PlayerStats } from '../../types';
import { PointType } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { ScoreTracker } from '../../core/ScoreTracker';
import { BO1, BO3, playMatch } from './simMatch';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch } from './matchTally';

const N = Number(process.env.N ?? 400);
const RATINGS = (process.env.RATINGS ?? '25,35,50,70').split(',').map(Number);
const BASE = Number(process.env.BASE ?? 35);
const GAPS = (process.env.GAPS ?? '0,3,6,10,15,20').split(',').map(Number);
const SECTIONS = (process.env.SECTIONS ?? 'serve,upset').split(',');
const FORMAT = process.env.FORMAT === 'best-of-1' ? BO1 : BO3;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) : '-');

function serveSection(log: typeof console.log): void {
  log(`\n── Serve: uniform mirror matches, N=${N} ──`);
  log(
    [
      'rating',
      'hold%',
      '1st in%',
      'DF / svc game',
      'DF % of pts',
      'ace % of pts',
      'server pt-win%',
      'mean rally',
    ].join('\t'),
  );
  for (const r of RATINGS) {
    const rates = emptyRates();
    let pts = 0;
    let firstIn = 0;
    let dfs = 0;
    let aces = 0;
    let serverWon = 0;
    let shots = 0;
    for (let i = 0; i < N; i++) {
      const { points } = playMatch(
        new PlayerProfile('p', 'P', uniform(r)),
        new PlayerProfile('o', 'O', uniform(r)),
        { format: FORMAT },
      );
      tallyMatch(points, FORMAT, rates);
      for (const pt of points) {
        pts++;
        if (pt.serveType === 'first') firstIn++;
        if (pt.pointType === PointType.DOUBLE_FAULT) dfs++;
        if (pt.pointType === PointType.ACE) aces++;
        if (pt.winner === pt.server) serverWon++;
        shots += pt.shots.length;
      }
    }
    const svcGames = rates.serviceGames + rates.returnGames;
    log(
      [
        r,
        // In a mirror, both players' service games pool into one hold rate.
        pct(rates.holds + (rates.returnGames - rates.breaks), svcGames),
        pct(firstIn, pts),
        (dfs / svcGames).toFixed(2),
        pct(dfs, pts),
        pct(aces, pts),
        pct(serverWon, pts),
        (shots / pts).toFixed(2),
      ].join('\t'),
    );
  }
}

function upsetSection(log: typeof console.log): void {
  log(`\n── Upsets: the weaker player (uniform ${BASE}) against uniform ${BASE}+gap, N=${N} ──`);
  log(
    [
      'gap',
      'overall weak v strong',
      ...RATE_HEADERS,
      'went the distance%',
      'comebacks%',
      'longest game run',
    ].join('\t'),
  );
  for (const gap of GAPS) {
    const rates = emptyRates();
    const weak = new PlayerProfile('p', 'P', uniform(BASE));
    const strong = new PlayerProfile('o', 'O', uniform(BASE + gap));
    let distance = 0;
    let comebacks = 0;
    let longestRunSum = 0;
    for (let i = 0; i < N; i++) {
      const { points, sets, winner } = playMatch(
        new PlayerProfile('p', 'P', uniform(BASE)),
        new PlayerProfile('o', 'O', uniform(BASE + gap)),
        { format: FORMAT },
      );
      tallyMatch(points, FORMAT, rates);
      if (sets.length === FORMAT.bestOfSets) distance++;
      const firstSetWinner = sets[0].player > sets[0].opponent ? 'player' : 'opponent';
      if (firstSetWinner !== winner) comebacks++;
      longestRunSum += longestGameRun(points);
    }
    log(
      [
        gap,
        `${weak.overallRating} v ${strong.overallRating}`,
        ...formatRates(rates),
        pct(distance, N),
        pct(comebacks, N),
        (longestRunSum / N).toFixed(1),
      ].join('\t'),
    );
  }
}

/** Longest run of consecutive games won by one player in a match: how streaky it was. */
function longestGameRun(
  points: ReadonlyArray<{ server: 'player' | 'opponent'; winner: 'player' | 'opponent' }>,
): number {
  const t = new ScoreTracker(FORMAT);
  t.setInitialServer(points[0].server);
  const games = (side: 'player' | 'opponent'): number =>
    t.getScore().sets.reduce((sum, set) => sum + set[side], 0);
  let last: 'player' | 'opponent' | null = null;
  let run = 0;
  let best = 0;
  for (const pt of points) {
    const before = games('player') + games('opponent');
    const beforePlayer = games('player');
    t.addPoint(pt.winner);
    if (games('player') + games('opponent') === before) continue;
    const gameWinner = games('player') > beforePlayer ? 'player' : 'opponent';
    run = gameWinner === last ? run + 1 : 1;
    last = gameWinner;
    best = Math.max(best, run);
  }
  return best;
}

function main(): void {
  const log = console.log;
  console.log = (): void => {};
  try {
    if (SECTIONS.includes('serve')) serveSection(log);
    if (SECTIONS.includes('upset')) upsetSection(log);
  } finally {
    console.log = log;
  }
}

main();
