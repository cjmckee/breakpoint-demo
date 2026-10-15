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
 * Run: npx tsx src/test/analysis/rallyMixProbe.ts
 * Env: LEVELS=40,80  N=150  SECTIONS=mix,boost  BOOST=forehand+backhand,speed
 *      With tuneRun: TUNE='…' PROBE=rallyMixProbe npx tsx src/test/analysis/tuneRun.ts
 */

import type { PlayerStats, PointAnalysisData, ShotDetail } from '../../types';
import { PointType } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import { createEmptyArchetypeProfile } from '../../data/archetypeTree';
import { playMatch, BO3 } from './simMatch';

const N = Number(process.env.N ?? 150);
const LEVELS = (process.env.LEVELS ?? '40,80').split(',').map(Number);
const SECTIONS = new Set((process.env.SECTIONS ?? 'mix,boost').split(','));
const BOOSTS = (process.env.BOOST ?? 'forehand+backhand,speed').split(',');
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

function matches(player: PlayerStats, opponent: PlayerStats): PointAnalysisData[] {
  const points: PointAnalysisData[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(1000 + i);
    const m = playMatch(
      new PlayerProfile('p', 'P', player, createEmptyArchetypeProfile()),
      new PlayerProfile('o', 'O', opponent, createEmptyArchetypeProfile()),
      { format: BO3, initialServer: i % 2 === 0 ? 'player' : 'opponent' },
    );
    points.push(...m.points);
  }
  return points;
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
  const points = matches(uniform(level), uniform(level));
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
}

function boost(level: number, out: string[]): void {
  for (const group of ['', ...BOOSTS]) {
    const stats = group ? group.split('+') : [];
    const points = matches(boosted(level, stats, 15), uniform(level));
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
        `\n  their groundstrokes  ${describe(theirs, points.length)}`,
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
  log(`rallyMixProbe  N=${N} BO3 per cell, uniform players, no specialties`);
  for (const line of out) log(line);
}

main();
