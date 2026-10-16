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
 *   boost  the same match with the player's BOOST stats (+-joined) moved by BY (15):
 *          point-win, and the player's and opponent's groundstroke quality, bar,
 *          errors and winners, so you can see where a stat's edge is lost.
 *
 *   net    the player's net points, by how they end: the last shot's striker,
 *          type and outcome, and what the opponent hit back at the net player
 *          (pass, lob or something else) with its quality and bar. Played with
 *          the BOOST stats moved by BY too, so a stat's reach into the net
 *          phase shows.
 *
 * All sections also report the player's net points (share of points, share
 * won) and each side's fatigue at the end of the match: what `net` and
 * `stamina` act on.
 *
 * Run: npx tsx src/test/analysis/rallyMixProbe.ts
 * Env: LEVELS=40,80  N=150  SECTIONS=mix,boost,net  BOOST=forehand+backhand,speed  BY=15
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
const BY = Number(process.env.BY ?? 15);
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
    for (const k of stats) if (k in group) group[k] = Math.max(0, Math.min(100, level + by));
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
    const played = matches(boosted(level, stats, BY), uniform(level), level);
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
      `\nlevel ${level}, ${group ? `${group} ${BY > 0 ? '+' : ''}${BY}` : 'even'}: point-win ${pct(won, points.length)}` +
        `\n  my groundstrokes     ${describe(mine, points.length)}` +
        `\n  their groundstrokes  ${describe(theirs, points.length)}` +
        netAndFatigue(played),
    );
  }
}

/** How the player's net points end, and what the opponent hits at the net player. */
function netEnds(level: number, out: string[]): void {
  for (const group of ['', ...BOOSTS]) {
    const stats = group ? group.split('+') : [];
    const played = matches(boosted(level, stats, BY), uniform(level), level);
    const ends = new Map<string, number>();
    const replies = new Map<string, Tally>();
    // Mean modifiers on those replies: the whole adjustment, difficulty, and the
    // rest of it (incoming ball × tactical × the stat bands), multiplied out.
    const mods = new Map<string, { n: number; total: number; difficulty: number; rest: number }>();
    // The net player's own volleys and overheads, with the winner bar they face.
    const mine = new Map<
      string,
      Tally & { winnerBar: number; adj: number; diff: number; capped: number }
    >();
    let net = 0;
    for (const pt of played.points) {
      const me = pt.server === 'player' ? 'server' : 'returner';
      for (const s of pt.shots) {
        if (s.shooter !== me || s.context.courtPosition !== 'net') continue;
        const type = s.shotType.includes('overhead') ? 'overhead' : 'volley';
        const t = mine.get(type) ?? { ...empty(), winnerBar: 0, adj: 0, diff: 0, capped: 0 };
        add(t, s);
        t.winnerBar += s.thresholds?.winner ?? 0;
        t.adj += s.modifiers.finalAdjustment;
        t.diff += s.modifiers.difficultyModifier;
        if (s.quality >= 99.5) t.capped++;
        mine.set(type, t);
      }
      const first = pt.shots.findIndex(
        (s) => s.shooter === me && s.context.courtPosition === 'net',
      );
      if (first < 0) continue;
      net++;
      const last = pt.shots[pt.shots.length - 1];
      const key = `${last.shooter === me ? 'mine  ' : 'theirs'} ${last.shotType.replace(/_(forehand|backhand)/, '')} ${last.outcome}`;
      ends.set(key, (ends.get(key) ?? 0) + 1);
      for (const s of pt.shots.slice(first)) {
        if (s.shooter === me) continue;
        const type = s.shotType.includes('passing')
          ? 'pass'
          : s.shotType.includes('lob')
            ? 'lob'
            : 'other';
        const t = replies.get(type) ?? empty();
        add(t, s);
        replies.set(type, t);
        const m = mods.get(type) ?? { n: 0, total: 0, difficulty: 0, rest: 0 };
        const { finalAdjustment, difficultyModifier, pressureModifier } = s.modifiers;
        m.n++;
        m.total += finalAdjustment;
        m.difficulty += difficultyModifier;
        m.rest += finalAdjustment / (difficultyModifier * pressureModifier);
        mods.set(type, m);
      }
    }
    out.push(
      `\nlevel ${level}, ${group ? `${group} ${BY > 0 ? '+' : ''}${BY}` : 'even'}: ${net} net points`,
    );
    for (const [key, n] of [...ends].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      out.push(`  ends  ${key.padEnd(36)} ${pct(n, net)}`);
    }
    for (const [type, t] of mine) {
      out.push(
        `  my    ${type.padEnd(8)} ${describe(t, net)}  winner bar ${(t.winnerBar / t.n).toFixed(0)}` +
          `  ×${(t.adj / t.n).toFixed(2)} (difficulty ×${(t.diff / t.n).toFixed(2)})  at 100: ${pct(t.capped, t.n)}`,
      );
    }
    for (const [type, t] of replies) {
      const m = mods.get(type)!;
      out.push(
        `  their ${type.padEnd(5)} ${describe(t, net)}  ×${(m.total / m.n).toFixed(2)} ` +
          `(difficulty ×${(m.difficulty / m.n).toFixed(2)}, rest ×${(m.rest / m.n).toFixed(2)})`,
      );
    }
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
      if (SECTIONS.has('net')) netEnds(level, out);
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
