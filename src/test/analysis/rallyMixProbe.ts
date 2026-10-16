/**
 * Rally Mix Probe — what does a rally look like at each level, and what does a
 * stat buy inside it?
 *
 * Two uniform players (every stat at LEVEL, no specialties) play N best of
 * threes. Reported:
 *
 *   mix    every shot type per point, the stat it reads, its mean quality and
 *          in-play bar, and how often it ends the point as a winner or an error.
 *          A rally that swings to lobs and defensive slices at high level is a
 *          rally where forehand and backhand stop counting.
 *   boost  the same match with the player's BOOST stats (+-joined) raised by 15:
 *          point-win, and the player's and opponent's groundstroke quality, bar,
 *          errors and winners, so you can see where a stat's edge is lost.
 *
 * Both sections also report the player's net points (share of points, share
 * won) and each side's fatigue at the end of the match: what `net` and
 * `stamina` act on.
 *
 * Run: npx tsx src/test/analysis/rallyMixProbe.ts
 * Env: LEVELS=40,80  N=150  SECTIONS=mix,boost  BOOST=forehand+backhand,speed
 *      PROFILE=serve_volley gives the player that authored archetype (at the
 *      level's tier) instead of none, to measure a stat on the players who use it
 *      With tuneRun: TUNE='…' PROBE=rallyMixProbe npx tsx src/test/analysis/tuneRun.ts
 */

import type { PlayerStats, PointAnalysisData, ShotDetail } from '../../types';
import { PointType } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import type { OpponentTier } from '../../types/game';
import {
  createEmptyArchetypeProfile,
  profileForArchetype,
  type LegacyArchetype,
} from '../../data/archetypeTree';
import { playMatch, BO3 } from './simMatch';

const N = Number(process.env.N ?? 150);
const LEVELS = (process.env.LEVELS ?? '40,80').split(',').map(Number);
const SECTIONS = new Set((process.env.SECTIONS ?? 'mix,boost').split(','));
const BOOSTS = (process.env.BOOST ?? 'forehand+backhand,speed').split(',');
const PROFILE = process.env.PROFILE as LegacyArchetype | undefined;
const tierFor = (level: number): OpponentTier =>
  level >= 66 ? 4 : level >= 56 ? 3 : level >= 42 ? 2 : 1;
const GROUNDSTROKES = new Set(['forehand', 'backhand', 'forehand_power', 'backhand_power']);

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

function boosted(level: number, stats: string[], by: number): PlayerStats {
  const s = uniform(level);
  for (const group of Object.values(s) as Array<Record<string, number>>) {
    for (const k of stats) if (k in group) group[k] = Math.min(100, level + by);
  }
  return s;
}

interface Played {
  points: PointAnalysisData[];
  /** Mean fatigue at the end of the match, player and opponent. */
  endFatigue: { player: number; opponent: number };
}

function matches(player: PlayerStats, opponent: PlayerStats, level: number): Played {
  const points: PointAnalysisData[] = [];
  const endFatigue = { player: 0, opponent: 0 };
  const profile = PROFILE
    ? profileForArchetype(PROFILE, tierFor(level))
    : createEmptyArchetypeProfile();
  for (let i = 0; i < N; i++) {
    setSeed(1000 + i);
    const m = playMatch(
      new PlayerProfile('p', 'P', player, profile),
      new PlayerProfile('o', 'O', opponent, createEmptyArchetypeProfile()),
      { format: BO3, initialServer: i % 2 === 0 ? 'player' : 'opponent' },
    );
    points.push(...m.points);
    endFatigue.player += m.endFatigue.player / N;
    endFatigue.opponent += m.endFatigue.opponent / N;
  }
  return { points, endFatigue };
}

/** The player's net points: share of all points, and share of those won. */
function netAndFatigue(played: Played): string {
  let net = 0;
  let netWon = 0;
  for (const pt of played.points) {
    const me = pt.server === 'player' ? 'server' : 'returner';
    if (pt.shots.some((s) => s.shooter === me && s.context.courtPosition === 'net')) {
      net++;
      if (pt.winner === 'player') netWon++;
    }
  }
  return (
    `\n  my net points        ${pct(net, played.points.length)} of points, ${net ? pct(netWon, net) : '-'} won` +
    `\n  fatigue at the end   mine ${played.endFatigue.player.toFixed(0)}, theirs ${played.endFatigue.opponent.toFixed(0)}`
  );
}

interface Tally {
  n: number;
  quality: number;
  bar: number;
  winners: number;
  errors: number;
}
const empty = (): Tally => ({ n: 0, quality: 0, bar: 0, winners: 0, errors: 0 });
function add(t: Tally, s: ShotDetail): void {
  t.n++;
  t.quality += s.quality;
  t.bar += s.thresholds?.inPlay ?? 0;
  if (s.outcome === PointType.WINNER || s.outcome === PointType.ACE) t.winners++;
  if (
    s.outcome === PointType.UNFORCED_ERROR ||
    s.outcome === PointType.FORCED_ERROR ||
    s.outcome === PointType.DOUBLE_FAULT
  ) {
    t.errors++;
  }
}
const pct = (a: number, b: number): string => `${((a / b) * 100).toFixed(0)}%`;
const describe = (t: Tally, points: number): string =>
  `${(t.n / points).toFixed(2)}/pt  quality ${(t.quality / t.n).toFixed(0)}  bar ${(t.bar / t.n).toFixed(0)}  ` +
  `winners ${pct(t.winners, t.n)}  errors ${pct(t.errors, t.n)}`;

function mix(level: number, out: string[]): void {
  const played = matches(uniform(level), uniform(level), level);
  const points = played.points;
  const byType = new Map<string, { stat: string; t: Tally }>();
  let shots = 0;
  for (const pt of points) {
    for (const s of pt.shots) {
      shots++;
      const entry = byType.get(s.shotType) ?? { stat: s.statUsed, t: empty() };
      add(entry.t, s);
      byType.set(s.shotType, entry);
    }
  }
  out.push(
    `\n── level ${level}: the rally, ${(shots / points.length).toFixed(2)} shots per point ──`,
  );
  for (const [type, { stat, t }] of [...byType].sort((a, b) => b[1].t.n - a[1].t.n)) {
    out.push(`${type}\t${stat}\t${describe(t, points.length)}`);
  }
  out.push(netAndFatigue(played).trimStart());
}

function boost(level: number, out: string[]): void {
  for (const group of ['', ...BOOSTS]) {
    const stats = group ? group.split('+') : [];
    const played = matches(boosted(level, stats, 15), uniform(level), level);
    const points = played.points;
    const mine = empty();
    const theirs = empty();
    let won = 0;
    for (const pt of points) {
      if (pt.winner === 'player') won++;
      const me = pt.server === 'player' ? 'server' : 'returner';
      for (const s of pt.shots) {
        if (s.shotNumber <= 2 || !GROUNDSTROKES.has(s.shotType)) continue;
        add(s.shooter === me ? mine : theirs, s);
      }
    }
    out.push(
      `\nlevel ${level}, ${group ? `${group} +15` : 'even'}: point-win ${pct(won, points.length)}` +
        `\n  my groundstrokes     ${describe(mine, points.length)}` +
        `\n  their groundstrokes  ${describe(theirs, points.length)}` +
        netAndFatigue(played),
    );
  }
}

function main(): void {
  const log = console.log;
  const out: string[] = [];
  console.log = (): void => {};
  try {
    for (const level of LEVELS) {
      if (SECTIONS.has('mix')) mix(level, out);
      if (SECTIONS.has('boost')) boost(level, out);
    }
  } finally {
    console.log = log;
  }
  clearSeed();
  log(
    `rallyMixProbe  N=${N} BO3 per cell, uniform players, ` +
      `${PROFILE ? `the player as ${PROFILE}` : 'no specialties'}`,
  );
  for (const line of out) log(line);
}

main();
