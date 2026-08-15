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
 * Part D: how points end — the texture question. An even match between weak
 *         players should still be a match: worse shots and more misses, but a
 *         rally.
 *
 * Parts B and C accept ML_MODE to swap the matchLevel anchor, which requires
 * the temporary seam documented in anchorProbe.ts; without it they run with
 * the shipped mean anchor. Part A never needs it.
 *
 * Part D was also run against a second temporary seam, FLOOR_SCALE, in
 * calculateQualityRequirements — 'inplay' scales MIN_QUALITY_FLOORS by
 * matchLevel/70, 'ml' scales MINIMUM_WINNER_THRESHOLDS as well:
 *
 *   const floorScale  = (mode === 'ml' || mode === 'inplay') ? this.currentMatchLevel / 70 : 1;
 *   const winnerScale = (mode === 'ml') ? this.currentMatchLevel / 70 : 1;
 *   inPlayReq = Math.max(inPlayReq, minFloor * floorScale);
 *   ... Math.max(calculatedWinner, MINIMUM_WINNER_THRESHOLDS[cat] * winnerScale)
 *
 * 'inplay' roughly doubles the share of tier-1 points reaching four shots
 * (12.9% to 22.0%) while leaving winners rare and the OVR 70 reference
 * untouched. 'ml' is worse than the status quo: tier-1 winners go to 40%.
 *
 * Part E: progression inside a tier — a player sweeping OVR 20 to 50 against
 *         fixed opponents. Used to test anchoring matchLevel to a tier constant
 *         instead of the two players' mean; the two curves came out the same
 *         within noise, so no tier table was added.
 *
 * Run: PARTS=ABCDE N=40 node dist/src/test/analysis/tier1Probe.js
 * Env: N=40 (BO3 per row)  N_C=1000 (part C only — see its note)  PARTS=ABCD
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
  tech: [number, number, number],
  phys: [number, number, number],
  ment: [number, number, number]
): PlayerStats => ({
  core: { serve: core[0], forehand: core[1], backhand: core[2], return: core[3], net: core[4] },
  technical: { slice: tech[0], spin: tech[1], placement: tech[2] },
  physical: { speed: phys[0], stamina: phys[1], strength: phys[2] },
  mental: { focus: ment[0], anticipation: ment[1], tactics: ment[2] },
});

/** Implemented tier-1 content, copied from src/data. */
const ROSTER: Array<[string, PlayerStats]> = [
  ['new player (OVR 20)', stats([20, 20, 20, 20, 20], [20, 20, 20], [20, 20, 20], [20, 20, 20])],
  ['Danny Park (25)', stats([30, 35, 20, 20, 26], [18, 23, 23], [28, 23, 35], [28, 23, 26])],
  ['Big Steve (30)', stats([35, 32, 32, 23, 35], [23, 23, 25], [28, 28, 33], [28, 31, 26])],
  ['Lin Chen (29)', stats([30, 28, 31, 33, 22], [30, 31, 28], [35, 35, 20], [30, 30, 29])],
  ['Olivia Gulp (42)', stats([42, 46, 39, 44, 34], [46, 39, 41], [36, 48, 35], [41, 43, 41])],
  ['Jordan (47)', stats([50, 50, 46, 47, 43], [48, 40, 48], [44, 48, 46], [46, 40, 40])],
  ['uniform 70 (reference)', stats([70, 70, 70, 70, 70], [70, 70, 70], [70, 70, 70], [70, 70, 70])],
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
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.stamina);
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
  stats([r, r, r, r, r], [r, r, r], [r, r, r], [r, r, r]);

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

/**
 * Part C compares two cells and reads the answer off the difference, so its
 * noise is per-cell rather than pooled the way a regression's is. At the shared
 * N=40 it carried about +/-3 points and reported slice as +3.13 for a build that
 * never slices against +0.00 for the specialist — the sign inversion the audit
 * predicted, except both numbers were noise. It therefore takes its own sample
 * size, and prints a same-versus-same control so the floor is visible.
 */
const PART_C_MATCHES = Number(process.env.N_C ?? 1000);

function partC(_N: number): void {
  const mode = process.env.ML_MODE ?? 'mean';
  const N = PART_C_MATCHES;
  console.log(`\n── C. Stat value at tier-1 scale, ML_MODE=${mode} (${N} BO3 each) ──`);
  console.log('slice 20 → 40 against a uniform-20 opponent, in a build that never');
  console.log('slices vs one built to slice. The 50 → 90 version of this is what');
  console.log("the audit's section 4 was measured on.");
  console.log('CONTROL is the same build on both sides — this run\'s noise floor.\n');
  const SAMURAI: ArchetypeProfile = {
    broad: 'baseliner', phases: { backhand: { path: 'bh_samurai', tier: 3 } },
    specializationPoints: 0, respecTokens: 0,
  };
  const base = uniform(20);
  const bumped: PlayerStats = { ...base, technical: { ...base.technical, slice: 40 } };
  const cells: Array<[string, PlayerStats, ArchetypeProfile]> = [
    ['CONTROL (no bump)', base, NONE],
    ['never slices', bumped, NONE],
    ['slice specialist', bumped, SAMURAI],
  ];
  for (const [label, stats, prof] of cells) {
    const acc = zero();
    console.log = () => {};
    for (let i = 0; i < N; i++) {
      runMatch(new PlayerProfile('p', 'P', stats, prof), new PlayerProfile('o', 'O', base, prof), acc);
    }
    console.log = _origLog;
    const d = (acc.playerWon / acc.points) * 100 - 50;
    console.log(`  ${label.padEnd(20)} ${(d >= 0 ? '+' : '') + d.toFixed(2)}`);
  }
}

/**
 * How points end, and where the ball was when they ended. An even match
 * between weak players should still be a match — worse shots and more misses,
 * but a rally. This measures whether that is what happens.
 */
function partD(N: number): void {
  console.log(`\n── D. How points end, mirror matches (${N} BO3 each) ──`);
  console.log(['build'.padEnd(24), 'OVR'.padStart(4), 'ace'.padStart(7), 'DF'.padStart(7),
    'winner'.padStart(8), 'forced'.padStart(8), 'unforced'.padStart(9),
    'ret err'.padStart(9), 'rally≥4'.padStart(9)].join(''));
  console.log('-'.repeat(86));
  const ladder: Array<[string, PlayerStats]> = [
    ROSTER[0], ROSTER[2], ROSTER[5],
    ['Lin Chen, 10 wins', scaled(ROSTER[3][1], 10)],
    ['uniform 55', uniform(55)],
    ROSTER[6],
    ['uniform 85', uniform(85)],
  ];
  for (const [name, s] of ladder) {
    const tally: Record<string, number> = {};
    let total = 0, retErr = 0, long = 0;
    console.log = () => {};
    for (let i = 0; i < N; i++) {
      const p = new PlayerProfile('p', 'P', s, NONE);
      const o = new PlayerProfile('o', 'O', s, NONE);
      const acc = zero();
      const seen: string[] = [];
      runMatchTapped(p, o, acc, (pt, rally, shots) => {
        seen.push(pt);
        total++;
        tally[pt] = (tally[pt] ?? 0) + 1;
        if (rally >= 4) long++;
        // point ended on the return: two in-play shots, last one an error
        if (rally === 2 && (pt === PointType.UNFORCED_ERROR || pt === PointType.FORCED_ERROR)
            && shots.length >= 2) retErr++;
      });
    }
    console.log = _origLog;
    const p = (k: string): string => (((tally[k] ?? 0) / total) * 100).toFixed(1);
    console.log([name.padEnd(24), String(ovrOf(s)).padStart(4),
      p(PointType.ACE).padStart(7), p(PointType.DOUBLE_FAULT).padStart(7),
      p(PointType.WINNER).padStart(8), p(PointType.FORCED_ERROR).padStart(8),
      p(PointType.UNFORCED_ERROR).padStart(9),
      ((retErr / total) * 100).toFixed(1).padStart(9),
      ((long / total) * 100).toFixed(1).padStart(9)].join(''));
  }
  console.log('\nMIN_QUALITY_FLOORS (20/15/10) and MINIMUM_WINNER_THRESHOLDS (50/55/60)');
  console.log('are absolute constants in an otherwise relative system, calibrated at');
  console.log('~70. At tier 1 the in-play floor binds on nearly every rally shot: a');
  console.log('20-quality ball asks 0.50 × 20 = 10 for a groundstroke, raised to 15.');
  console.log('The winner floor is NOT mis-scaled — it is what stops weak shots from');
  console.log('ending points, and scaling it takes tier-1 winners from 7% to 40%.');
}

function runMatchTapped(
  p: PlayerProfile, o: PlayerProfile, acc: Acc,
  tap: (pointType: string, rally: number, shots: unknown[]) => void
): void {
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
    tap(pr.pointType, pr.rallyLength, pr.shots);
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    acc.points++;
    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.stamina);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

/**
 * Progression sweep: does getting better inside a tier feel like getting
 * better? A player climbing from OVR 20 to 50 plays the same fixed opponents
 * under whichever matchLevel anchor is active.
 */
function partE(N: number): void {
  const mode = process.env.ML_MODE ?? 'mean';
  const anchor = mode === 'fixed' ? `tier-anchored at ${process.env.ML_FIXED ?? 70}` : 'mean of both players';
  console.log(`\n── E. Progression inside tier 1 — matchLevel ${anchor} (${N} BO3 each) ──`);
  const opponents: Array<[string, PlayerStats]> = [
    ['Big Steve (28)', ROSTER[2][1]],
    ['Jordan (46)', ROSTER[5][1]],
  ];
  for (const [name, opp] of opponents) {
    console.log(`\n  vs ${name}`);
    console.log(['  player OVR'.padEnd(14), 'pt-win%'.padStart(9), 'mean rally'.padStart(12),
      '≤2-shot%'.padStart(10)].join(''));
    console.log('  ' + '-'.repeat(43));
    for (const L of [20, 25, 30, 35, 40, 45, 50]) {
      const acc = play(uniform(L), opp, N);
      console.log([`  ${L}`.padEnd(14), pct(acc.playerWon, acc.points).padStart(9),
        (acc.rallySum / acc.points).toFixed(2).padStart(12),
        pct(acc.short, acc.points).padStart(10)].join(''));
    }
  }
}

function main(): void {
  const N = Number(process.env.N ?? 40);
  const parts = process.env.PARTS ?? 'ABCD';
  if (parts.includes('A')) partA(N);
  if (parts.includes('B')) partB(N);
  if (parts.includes('C')) partC(N);
  if (parts.includes('D')) partD(N);
  if (parts.includes('E')) partE(N);
  console.log('');
}

main();
