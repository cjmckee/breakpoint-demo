/**
 * Identity Gap Probe — why do some career identities win more at equal rating?
 *
 * The career sim's four identities reach the same overall rating by day 23,
 * yet the net rusher wins ~9 more points in 100 than the big server. That gap
 * has two possible sources: what each identity bought (its stats) and what its
 * archetype specialties do in a match (its profile). This crosses them: every
 * identity's day-23 stats with every identity's profile, plus each build's own
 * stats flattened to a uniform build at the same overall rating, and a
 * no-archetype profile. Reading across a row isolates the profile; down a
 * column, the stats.
 *
 * Opponents: a uniform build at the identities' overall rating with no
 * archetype (OPP=uniform), so no matchup flatters one style, or a team-match
 * opponent (OPP=1..5).
 *
 * Run: npx tsx src/test/analysis/identityGapProbe.ts
 * Env: N=600 (BO3 per cell)  OPP=uniform|1..5  SEED=1  BREAKDOWN=1 (per-cell detail)
 */

import type { CourtSurface, PlayerStats } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { profileForArchetype } from '../../data/archetypeTree';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import { IDENTITY_BUILDS } from './identityBuilds';
import { emptyRates, tallyMatch, type Rates } from './matchTally';
import { BO3, playMatch } from './simMatch';

const N = Number(process.env.N ?? 600);
const OPP = process.env.OPP ?? 'uniform';
const SEED = Number(process.env.SEED ?? 1);
const BREAKDOWN = process.env.BREAKDOWN === '1';

const IDS = ['bigServer', 'counter', 'netRusher', 'baseliner'] as const;
const NONE: ArchetypeProfile = {
  broad: null,
  phases: {},
  specializationPoints: 0,
  respecTokens: 0,
};

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

const meanStat = (s: PlayerStats): number => {
  const all = Object.values(s).flatMap((g) => Object.values(g as Record<string, number>));
  return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
};

interface Cell {
  rates: Rates;
  aces: number;
  doubleFaults: number;
  winners: number;
  unforced: number;
  forced: number;
  netPoints: number;
  netWon: number;
  shots: number;
}

function opponent(): { stats: PlayerStats; profile: ArchetypeProfile; surface: CourtSurface } {
  if (OPP === 'uniform') {
    const r = meanStat(IDENTITY_BUILDS.bigServer.stats);
    return { stats: uniform(r), profile: NONE, surface: 'hard' };
  }
  const team = [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5][
    Number(OPP) - 1
  ];
  return {
    stats: team.opponent.stats,
    profile: profileForArchetype(team.opponent.archetype),
    surface: team.surface,
  };
}

function play(stats: PlayerStats, profile: ArchetypeProfile): Cell {
  const opp = opponent();
  const c: Cell = {
    rates: emptyRates(),
    aces: 0,
    doubleFaults: 0,
    winners: 0,
    unforced: 0,
    forced: 0,
    netPoints: 0,
    netWon: 0,
    shots: 0,
  };
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', stats, profile),
      new PlayerProfile('o', 'O', opp.stats, opp.profile),
      { format: BO3, surface: opp.surface, initialServer: i % 2 === 0 ? 'player' : 'opponent' },
    );
    tallyMatch(points, BO3, c.rates);
    for (const pt of points) {
      const role = pt.server === 'player' ? 'server' : 'returner';
      const mine = pt.winner === 'player';
      c.shots += pt.shots.length;
      if (pt.pointType === PointType.ACE && pt.server === 'player') c.aces++;
      if (pt.pointType === PointType.DOUBLE_FAULT && pt.server === 'player') c.doubleFaults++;
      const last = pt.shots[pt.shots.length - 1];
      if (last && last.shooter === role) {
        if (last.outcome === PointType.WINNER) c.winners++;
        if (last.outcome === PointType.UNFORCED_ERROR) c.unforced++;
        if (last.outcome === PointType.FORCED_ERROR) c.forced++;
      }
      if (pt.shots.some((s) => s.shooter === role && s.context.courtPosition === 'net')) {
        c.netPoints++;
        if (mine) c.netWon++;
      }
    }
  }
  return c;
}

const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) : '-');

function main(): void {
  const log = console.log;
  console.log = (): void => {};
  const rows: Array<[string, string[]]> = [];
  const details: string[] = [];
  const statSets: Array<[string, PlayerStats]> = [
    ...IDS.map((id): [string, PlayerStats] => [`${id} stats`, IDENTITY_BUILDS[id].stats]),
    [
      `uniform ${meanStat(IDENTITY_BUILDS.bigServer.stats)}`,
      uniform(meanStat(IDENTITY_BUILDS.bigServer.stats)),
    ],
  ];
  const profiles: Array<[string, ArchetypeProfile]> = [
    ...IDS.map((id): [string, ArchetypeProfile] => [id, IDENTITY_BUILDS[id].profile]),
    ['none', NONE],
  ];
  for (const [statName, stats] of statSets) {
    const cells: string[] = [];
    for (const [profName, profile] of profiles) {
      const c = play(stats, profile);
      const r = c.rates;
      cells.push(pct(r.pointsWon, r.points));
      details.push(
        [
          statName,
          profName,
          pct(r.pointsWon, r.points),
          pct(r.holds, r.serviceGames),
          pct(r.breaks, r.returnGames),
          pct(r.matchesWon, r.matches),
          pct(c.aces, r.points),
          pct(c.doubleFaults, r.points),
          pct(c.winners, r.points),
          pct(c.unforced, r.points),
          pct(c.forced, r.points),
          pct(c.netPoints, r.points),
          pct(c.netWon, c.netPoints),
          (c.shots / r.points).toFixed(2),
        ].join('\t'),
      );
      process.stderr.write('.');
    }
    rows.push([statName, cells]);
  }
  console.log = log;
  const opp = opponent();
  log(
    `\nidentityGapProbe  N=${N} BO3  opponent ${OPP === 'uniform' ? `uniform ${meanStat(opp.stats)}, no archetype` : `team match ${OPP}`} (${opp.surface})`,
  );
  log('point-win %: rows = whose stats, columns = whose archetype profile');
  log(['stats \\ profile', ...profiles.map(([p]) => p)].join('\t'));
  for (const [name, cells] of rows) log([name, ...cells].join('\t'));
  if (BREAKDOWN) {
    log('\nper cell (shares are of all points; my aces/DFs/winners/errors; net = I hit from net)');
    log(
      [
        'stats',
        'profile',
        'pt-win',
        'hold',
        'break',
        'match',
        'aces',
        'DFs',
        'winners',
        'UE',
        'FE',
        'net pts',
        'net won',
        'shots/pt',
      ].join('\t'),
    );
    for (const d of details) log(d);
  }
}

main();
