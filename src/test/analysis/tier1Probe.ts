/**
 * Tier 1 Probe — how does the shipped tier-1 content actually play?
 *
 * Every other analysis harness in this folder runs uniform-50 to uniform-90
 * builds. No implemented content sits in that range: the starting player is
 * OVR 20 and the whole of tier 1 spans OVR 25-45. This probe re-runs the
 * serve/return numbers at the ratings that actually exist.
 *
 * Part A: serve behaviour up the ladder, mirror matches, so only level varies.
 * Part B: the matchups a player actually gets, including practice opponents
 *         scaled by getScaledOpponentStats (+2/win, capped +20).
 * Part C: what a stat is worth at tier-1 scale — slice 20 → 40, not 50 → 90.
 *
 * Stats are inlined rather than imported from src/data, because those modules
 * use extensionless relative imports that resolve under Vite but not under the
 * node build.
 *
 * Parts B and C accept ML_MODE to swap the matchLevel anchor, which requires
 * the temporary seam documented in anchorProbe.ts; without it they run with
 * the shipped mean anchor. Part A never needs it.
 *
 * Run: PARTS=ABC N=40 node dist/src/test/analysis/tier1Probe.js
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;
const NONE: ArchetypeProfile = { broad: null, phases: {}, specializationPoints: 0, respecTokens: 0 };

const stats = (
  core: [number, number, number, number, number],
  tech: [number, number, number, number, number],
  phys: [number, number, number, number, number],
  ment: [number, number, number, number, number]
): PlayerStats => ({
  core: { serve: core[0], forehand: core[1], backhand: core[2], return: core[3], slice: core[4] },
  technical: { volley: tech[0], overhead: tech[1], dropShot: tech[2], spin: tech[3], placement: tech[4] },
  physical: { speed: phys[0], stamina: phys[1], strength: phys[2], agility: phys[3], recovery: phys[4] },
  mental: { focus: ment[0], anticipation: ment[1], shotVariety: ment[2], offensive: ment[3], defensive: ment[4] },
});

/** Implemented tier-1 content, copied from src/data. */
const ROSTER: Array<[string, PlayerStats]> = [
  ['new player (OVR 20)', stats([20, 20, 20, 20, 20], [20, 20, 20, 20, 20], [20, 20, 20, 20, 20], [20, 20, 20, 20, 20])],
  ['Danny Park (25)', stats([30, 35, 20, 20, 18], [23, 28, 18, 23, 23], [28, 23, 35, 23, 23], [28, 23, 23, 30, 23])],
  ['Big Steve (28)', stats([35, 32, 32, 23, 23], [35, 35, 18, 23, 25], [28, 28, 33, 24, 24], [28, 31, 25, 30, 21])],
  ['Lin Chen (29)', stats([30, 28, 31, 33, 30], [21, 23, 25, 31, 28], [35, 35, 20, 23, 33], [30, 30, 25, 21, 37])],
  ['Olivia Gulp (41)', stats([42, 46, 40, 44, 38], [36, 34, 34, 42, 42], [36, 42, 44, 42, 42], [41, 44, 36, 44, 38])],
  ['Jordan (45)', stats([46, 50, 48, 48, 49], [40, 38, 40, 46, 46], [44, 46, 44, 42, 45], [45, 46, 42, 46, 44])],
  ['uniform 70 (reference)', stats([70, 70, 70, 70, 70], [70, 70, 70, 70, 70], [70, 70, 70, 70, 70], [70, 70, 70, 70, 70])],
];

function calcFatigue(cur: number, rally: number, stam: number, rec: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec2 = MATCH_FATIGUE.baseRecoveryPerPoint + (rec / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec2));
}

interface Acc {
  points: number; playerWon: number; rallySum: number; short: number;
  serves: number; firstIn: number; doubleFaults: number; aces: number;
}
const zero = (): Acc => ({ points: 0, playerWon: 0, rallySum: 0, short: 0, serves: 0, firstIn: 0, doubleFaults: 0, aces: 0 });

function runMatch(p: PlayerProfile, o: PlayerProfile, acc: Acc): void {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  p.rollMatchForm(); o.rollMatchForm();
  const sim = new PointSimulator();
  const ms: MatchState = {
    score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
    momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0, isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };
  let pts = 0;
  while (!tracker.isComplete() && pts < 600) {
    const server = tracker.getCurrentServer();
    ms.isKeyMoment = tracker.isKeyMoment();
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, {}, {});
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    acc.points++;
    acc.rallySum += pr.rallyLength;
    if (pr.rallyLength <= 2) acc.short++;
    if (w === 'player') acc.playerWon++;

    // serve accounting, player's service points only
    if (server === 'player') {
      acc.serves++;
      if (pr.serveType === 'first') acc.firstIn++;
      const faults = pr.shots.filter(s => s.outcome === PointType.FAULT).length;
      if (faults >= 2) acc.doubleFaults++;
      if (pr.shots.some(s => s.outcome === PointType.ACE)) acc.aces++;
    }

    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.recovery);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.recovery);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

/** getScaledOpponentStats: +2 per tier win on every stat, capped at +20. */
function scaled(s: PlayerStats, tierWins: number): PlayerStats {
  const boost = Math.min(tierWins * 2, 20);
  const bump = <T extends object>(o: T): T => {
    const out = { ...o } as Record<string, number>;
    for (const k of Object.keys(out)) out[k] = Math.min(100, out[k] + boost);
    return out as T;
  };
  return { core: bump(s.core), technical: bump(s.technical), physical: bump(s.physical), mental: bump(s.mental) };
}

const ovrOf = (s: PlayerStats): number => new PlayerProfile('x', 'X', s, NONE).overallRating;
const uniform = (r: number): PlayerStats =>
  stats([r, r, r, r, r], [r, r, r, r, r], [r, r, r, r, r], [r, r, r, r, r]);

function play(a: PlayerStats, b: PlayerStats, n: number): Acc {
  const acc = zero();
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    runMatch(new PlayerProfile('p', 'P', a, NONE), new PlayerProfile('o', 'O', b, NONE), acc);
  }
  console.log = _origLog;
  return acc;
}

const pct = (x: number, y: number): string => ((x / y) * 100).toFixed(1);

function partA(N: number): void {
  console.log(`\n── A. Serve behaviour across the real ladder (${N} BO3 each, mirror match) ──`);
  console.log('Each row is that build against a copy of itself, so only the level varies.\n');
  console.log(['build'.padEnd(26), 'OVR'.padStart(4), '1st in%'.padStart(9), 'DF%'.padStart(7),
    'ace%'.padStart(7), 'mean rally'.padStart(12), '≤2-shot%'.padStart(10)].join(''));
  console.log('-'.repeat(76));
  const ladder: Array<[string, PlayerStats]> = [
    ...ROSTER,
    ['Danny Park, 10 wins', scaled(ROSTER[1][1], 10)],
    ['Lin Chen, 10 wins', scaled(ROSTER[3][1], 10)],
  ];
  for (const [name, s] of ladder) {
    const a = play(s, s, N);
    console.log([name.padEnd(26), String(ovrOf(s)).padStart(4),
      pct(a.firstIn, a.serves).padStart(9), pct(a.doubleFaults, a.serves).padStart(7),
      pct(a.aces, a.serves).padStart(7), (a.rallySum / a.points).toFixed(2).padStart(12),
      pct(a.short, a.points).padStart(10)].join(''));
  }
}

function partB(N: number): void {
  const mode = process.env.ML_MODE ?? 'mean';
  console.log(`\n── B. Real tier-1 matchups, ML_MODE=${mode} (${N} BO3 each) ──`);
  console.log(['matchup'.padEnd(42), 'ML'.padStart(5), 'pt-win%'.padStart(9),
    'mean rally'.padStart(12), '≤2-shot%'.padStart(10)].join(''));
  console.log('-'.repeat(78));
  const pairs: Array<[string, PlayerStats, string, PlayerStats]> = [
    ['new player', ROSTER[0][1], 'Danny Park', ROSTER[1][1]],
    ['new player', ROSTER[0][1], 'Big Steve', ROSTER[2][1]],
    ['new player', ROSTER[0][1], 'Jordan', ROSTER[5][1]],
    ['new player', ROSTER[0][1], 'Danny Park +20', scaled(ROSTER[1][1], 10)],
    ['trained (40s)', uniform(40), 'Jordan', ROSTER[5][1]],
    ['trained (40s)', uniform(40), 'trained (40s)', uniform(40)],
  ];
  for (const [an, a, bn, b] of pairs) {
    const acc = play(a, b, N);
    const ml = (ovrOf(a) + ovrOf(b)) / 2;
    console.log([`${an} (${ovrOf(a)}) v ${bn} (${ovrOf(b)})`.padEnd(42), ml.toFixed(1).padStart(5),
      pct(acc.playerWon, acc.points).padStart(9), (acc.rallySum / acc.points).toFixed(2).padStart(12),
      pct(acc.short, acc.points).padStart(10)].join(''));
  }
}

function partC(N: number): void {
  const mode = process.env.ML_MODE ?? 'mean';
  console.log(`\n── C. Stat value at tier-1 scale, ML_MODE=${mode} (${N} BO3 each) ──`);
  console.log('slice 20 → 40 against a uniform-20 opponent, in a build that never');
  console.log('slices vs one built to slice. The 50 → 90 version of this is what');
  console.log("the audit's section 4 was measured on.\n");
  const SAMURAI: ArchetypeProfile = {
    broad: 'baseliner', phases: { backhand: { path: 'bh_samurai', tier: 3 } },
    specializationPoints: 0, respecTokens: 0,
  };
  const base = uniform(20);
  const bumped: PlayerStats = { ...base, core: { ...base.core, slice: 40 } };
  for (const [label, prof] of [['never slices', NONE], ['slice specialist', SAMURAI]] as Array<[string, ArchetypeProfile]>) {
    const acc = zero();
    console.log = () => {};
    for (let i = 0; i < N; i++) {
      runMatch(new PlayerProfile('p', 'P', bumped, prof), new PlayerProfile('o', 'O', base, prof), acc);
    }
    console.log = _origLog;
    const d = (acc.playerWon / acc.points) * 100 - 50;
    console.log(`  ${label.padEnd(20)} ${(d >= 0 ? '+' : '') + d.toFixed(2)}`);
  }
}

function main(): void {
  const N = Number(process.env.N ?? 40);
  const parts = process.env.PARTS ?? 'ABC';
  if (parts.includes('A')) partA(N);
  if (parts.includes('B')) partB(N);
  if (parts.includes('C')) partC(N);
  console.log('');
}

main();
