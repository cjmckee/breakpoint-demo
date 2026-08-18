/**
 * Anchor Probe — what does matchLevel actually do?
 *
 * Part 1: the labelling mechanics, no simulation. For a given incoming ball
 *         quality, show the timeAvailable label and the resulting difficulty
 *         multiplier under each candidate anchor. Runs standalone.
 * Part 2: blowout metrics. Real points, mismatched pairs, each anchor.
 * Part 3: the "rating tax" — same stat, two builds, each anchor.
 *
 * Run: PARTS=123 N=150 ML_MODE=mean node dist/src/test/analysis/anchorProbe.js
 *
 * ANCHOR SWAPPING REQUIRES TWO TEMPORARY SEAMS. Part 1 reads the anchor
 * directly and always works. Parts 2 and 3 drive the anchor through the live
 * sim, so ML_MODE / SERVE_ANCHOR do nothing unless these are applied first —
 * without them both parts run with the shipped mean anchor. They are
 * deliberately not committed: the sim should not read process.env.
 *
 *   src/utils/qualityThresholds.ts, in getMatchLevel (player1 is always the
 *   shooter/server at every call site):
 *     const mode = process.env?.ML_MODE;
 *     if (mode === 'shooter')  return player1OverallRating;
 *     if (mode === 'receiver') return player2OverallRating;
 *     if (mode === 'fixed')    return Number(process.env.ML_FIXED ?? 70);
 *
 *   src/core/ShotCalculator.ts, in determineServeOutcome, replacing
 *   serverProfile.overallRating in the scaledInPlayThreshold line:
 *     process.env?.SERVE_ANCHOR === 'fixed'
 *       ? Number(process.env.SERVE_FIXED ?? 70)
 *       : serverProfile.overallRating
 *
 * Findings from the run these seams supported are in
 * docs/research/stat-system-audit.md — in short, the anchor moves the blowout metrics
 * in Part 2 by under a point, and pinning matchLevel does not remove the
 * negative sign in Part 3, which is what the audit's section 4 predicted.
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { ShotCalculator } from '../../core/ShotCalculator';
import { getQualityThresholds } from '../../utils/qualityThresholds';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { aggregateArchetypeEffects } from '../../data/archetypeTree';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;
const MODE = process.env.ML_MODE ?? 'mean';

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function bump(base: number, bucket: keyof PlayerStats, key: string, v: number): PlayerStats {
  const s = uniformStats(base);
  (s[bucket] as unknown as Record<string, number>)[key] = v;
  return s;
}

function profileOf(phases: Partial<Record<GamePhase, PhaseSpec>>, broad: ArchetypeProfile['broad'] = null): ArchetypeProfile {
  return { broad, phases, specializationPoints: 0, respecTokens: 0 };
}

function calcFatigue(cur: number, rally: number, stam: number, rec: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec2 = MATCH_FATIGUE.baseRecoveryPerPoint + (rec / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec2));
}

interface PointStats { points: number; playerWon: number; rallySum: number; short: number; }

function runMatch(p: PlayerProfile, o: PlayerProfile, pe: Record<string, number>, oe: Record<string, number>, acc: PointStats): void {
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
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, pe, oe);
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    acc.points++;
    acc.rallySum += pr.rallyLength;
    if (pr.rallyLength <= 2) acc.short++;
    if (w === 'player') acc.playerWon++;
    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.stamina);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

function matchup(strong: number, weak: number, n: number): PointStats {
  const prof = profileOf({});
  const eff = aggregateArchetypeEffects(prof);
  const acc: PointStats = { points: 0, playerWon: 0, rallySum: 0, short: 0 };
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    const p = new PlayerProfile('p', 'P', uniformStats(strong), prof);
    const o = new PlayerProfile('o', 'O', uniformStats(weak), prof);
    runMatch(p, o, eff, eff, acc);
  }
  console.log = _origLog;
  return acc;
}

function taxTrial(bucket: keyof PlayerStats, key: string, prof: ArchetypeProfile, n: number): number {
  const eff = aggregateArchetypeEffects(prof);
  const acc: PointStats = { points: 0, playerWon: 0, rallySum: 0, short: 0 };
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    const p = new PlayerProfile('p', 'P', bump(50, bucket, key, 90), prof);
    const o = new PlayerProfile('o', 'O', uniformStats(50), prof);
    runMatch(p, o, eff, eff, acc);
  }
  console.log = _origLog;
  return (acc.playerWon / acc.points) * 100 - 50;
}

function f(x: number): string { return (x >= 0 ? '+' : '') + x.toFixed(2); }

function part1(): void {
  console.log(`\n── Part 1: labelling mechanics (no sim) ─────────────────────────────`);
  console.log('A 90-rated player hits a forehand_power at quality Q at a 40-rated defender');
  console.log('(defender speed/agility 40). What does the defender see?\n');
  const calc = new ShotCalculator();
  const anchors: Array<[string, number]> = [['shooter (90)', 90], ['mean (65)', 65], ['fixed (70)', 70], ['receiver (40)', 40]];
  console.log(['anchor'.padEnd(15), 'thr.high'.padStart(9), 'thr.excep'.padStart(10),
    '  Q=60'.padStart(16), 'Q=75'.padStart(16), 'Q=90'.padStart(16)].join(''));
  console.log('-'.repeat(85));
  for (const [name, ml] of anchors) {
    const t = getQualityThresholds(ml);
    const cells: string[] = [];
    for (const q of [60, 75, 90]) {
      const shot: ShotDetail = { shotType: 'forehand_power', quality: q, outcome: 'in_play', player: 'player' } as unknown as ShotDetail;
      console.log = () => {};
      const bq = calc.calculateBallQuality(shot, ml);
      console.log = _origLog;
      // replicate getBallQualityModifier (private) with defender speed/agility 40
      let mod = 1.0;
      if (bq.timeAvailable === 'rushed') mod *= 0.6 + (40 / 100) * 0.4;
      else if (bq.timeAvailable === 'plenty') mod *= 1.05;
      if (q >= t.high) mod *= 0.85;
      else if (q >= t.good) mod *= 0.95;
      else if (q < t.weak) mod *= 1.1;
      cells.push(`${bq.timeAvailable.padEnd(7)}×${mod.toFixed(2)}`.padStart(16));
    }
    console.log([name.padEnd(15), t.high.toFixed(1).padStart(9), t.exceptional.toFixed(1).padStart(10), ...cells].join(''));
  }
  console.log('\n(the ×N is the multiplier applied to the DEFENDER\'s own shot quality)');
}

function part2(n: number): void {
  console.log(`\n── Part 2: blowout metrics, ML_MODE=${MODE} (${n} BO3 per row) ────────`);
  console.log(['matchup'.padEnd(14), 'strong pt-win%'.padStart(15), 'mean rally'.padStart(12), '≤2-shot pts%'.padStart(14)].join(''));
  console.log('-'.repeat(55));
  for (const [s, w] of [[90, 40], [80, 55], [65, 65]] as Array<[number, number]>) {
    const a = matchup(s, w, n);
    console.log([`${s} v ${w}`.padEnd(14),
      ((a.playerWon / a.points) * 100).toFixed(1).padStart(15),
      (a.rallySum / a.points).toFixed(2).padStart(12),
      ((a.short / a.points) * 100).toFixed(1).padStart(14)].join(''));
  }
}

function part3(n: number): void {
  console.log(`\n── Part 3: the tax, ML_MODE=${MODE} (${n} BO3 per row) ────────────────`);
  const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner');
  const NONE = profileOf({});
  const a = taxTrial('core', 'slice', NONE, n);
  const b = taxTrial('core', 'slice', SAMURAI, n);
  console.log(`  slice 50→90, never slices     : ${f(a)}`);
  console.log(`  slice 50→90, slice specialist : ${f(b)}`);
  console.log(`  spread (specialist − never)   : ${f(b - a)}   <- tax is the gap being driven by frequency`);
}

const N = Number(process.env.N ?? 40);
const PARTS = process.env.PARTS ?? '123';
if (PARTS.includes('1') && MODE === 'mean') part1();
if (PARTS.includes('2')) part2(N);
if (PARTS.includes('3')) part3(N);
console.log('');
