/**
 * Balance Analysis - Automated analysis of how player ratings affect shot outcomes
 *
 * Run with: npm run analyze
 */

import type { ShotType, ShotContext, ShotDetail } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import { ShotCalculator } from '../../core/ShotCalculator.js';
import { MatchSimulator } from '../../core/MatchSimulator.js';
import { createUniformPlayer } from './playerFactory.js';
import { computeStats } from './stats.js';
import {
  print, printBanner, printHeader, printTable, printHistogram, fmtPct, fmtNum,
} from './formatters.js';
import {
  SERVE_BASELINE,
  RELATIVE_QUALITY_REQUIREMENTS,
  OUTCOME_MULTIPLIERS,
  MINIMUM_WINNER_THRESHOLDS,
  MIN_QUALITY_FLOORS,
  OPPONENT_STAT_ADJUSTMENTS,
  getShotCategory,
} from '../../config/shotThresholds.js';

// ─── Configuration ───────────────────────────────────────────

const RATINGS = [20, 30, 40, 50, 60, 70, 80, 90];
const HISTOGRAM_RATINGS = [30, 50, 70, 90];
const N_SHOTS = 1000;
const N_MATCHES = 50;

const SERVE_TYPES: ShotType[] = ['serve_first', 'serve_second', 'kick_serve'];

const RALLY_SHOT_TYPES: ShotType[] = [
  'forehand', 'backhand', 'forehand_power', 'slice_forehand',
  'return_forehand', 'passing_shot_forehand', 'lob_forehand', 'drop_shot_forehand',
];

const INCOMING_QUALITIES = [30, 50, 70];
const OPPONENT_RETURN_RATINGS = [30, 50, 70];

const MATCH_PAIRINGS = [
  [20, 20], [20, 50], [30, 30], [30, 50], [30, 70],
  [50, 50], [50, 70], [50, 90], [70, 70], [70, 90],
  [80, 80], [80, 90], [90, 90],
];

// ─── Suppress console.log during simulation ──────────────────

const _origLog = console.log;
function suppressLogs(): void { console.log = () => {}; }
function restoreLogs(): void { console.log = _origLog; }

// ─── Helpers ─────────────────────────────────────────────────

function makeServeContext(): ShotContext {
  return { difficulty: 'normal', pressure: 'low', courtPosition: 'baseline', rallyLength: 1 };
}

function makeRallyContext(rallyLength: number = 3): ShotContext {
  return { difficulty: 'normal', pressure: 'low', courtPosition: 'baseline', rallyLength };
}

function makeIncomingShotDetail(quality: number, shotType: ShotType = 'forehand'): ShotDetail {
  return {
    shotType,
    shooter: 'returner',
    success: true,
    quality,
    outcome: PointType.IN_PLAY,
    statUsed: 'forehand',
    modifiers: {
      spinBonus: 0, placementBonus: 0, physicalModifier: 1, mentalModifier: 1,
      difficultyModifier: 1, pressureModifier: 1, rallyLengthModifier: 1, finalAdjustment: 1,
    },
    timestamp: Date.now(),
    shotNumber: 2,
    context: makeRallyContext(),
  };
}

// ─── REPORT 1: Serve Analysis ────────────────────────────────

function runServeAnalysis(): void {
  printHeader('REPORT 1: Serve Analysis');

  const calculator = new ShotCalculator();

  for (const serveType of SERVE_TYPES) {
    const serveKey = serveType as keyof typeof SERVE_BASELINE;
    const baseline = SERVE_BASELINE[serveKey];
    if (!baseline) continue;

    for (const oppReturnRating of OPPONENT_RETURN_RATINGS) {
      const opponent = createUniformPlayer('Opponent', oppReturnRating);
      const aceThreshold = baseline.aceThresholdBase + (oppReturnRating * baseline.aceReturnMultiplier);

      print(`  ${serveType} vs Opponent Return: ${oppReturnRating}`);
      print(`  InPlay Threshold: ${baseline.inPlayThreshold} │ Ace Threshold: ${fmtNum(aceThreshold)}`);
      print('');

      const rows: (string | number)[][] = [];
      const allQualities: Map<number, number[]> = new Map();

      for (const rating of RATINGS) {
        const player = createUniformPlayer('Player', rating);
        const qualities: number[] = [];
        let faults = 0;
        let inPlay = 0;
        let aces = 0;

        suppressLogs();
        for (let i = 0; i < N_SHOTS; i++) {
          const result = calculator.calculateShotSuccess(
            player, serveType, makeServeContext(), opponent, 'well_positioned',
          );
          qualities.push(result.quality);
          if (result.outcome === PointType.FAULT || result.outcome === PointType.DOUBLE_FAULT) faults++;
          else if (result.outcome === PointType.ACE) aces++;
          else inPlay++;
        }
        restoreLogs();

        const stats = computeStats(qualities);
        allQualities.set(rating, qualities);

        rows.push([
          String(rating), stats.mean, stats.stddev, stats.p10, stats.p25, stats.p75, stats.p90,
          fmtPct(faults, N_SHOTS), fmtPct(inPlay, N_SHOTS), fmtPct(aces, N_SHOTS),
        ]);
      }

      printTable(
        ['Rating', 'Mean', 'StdDev', 'P10', 'P25', 'P75', 'P90', 'Fault%', 'InPlay%', 'Ace%'],
        rows,
      );

      // Histogram for key ratings
      for (const rating of HISTOGRAM_RATINGS) {
        const quals = allQualities.get(rating);
        if (quals) {
          print(`\n  Quality Distribution (Rating ${rating}, ${serveType}):`);
          printHistogram(quals, [
            { label: 'InPlay', value: baseline.inPlayThreshold },
            { label: 'Ace', value: aceThreshold },
          ]);
        }
      }

      print('');
    }
  }
}

// ─── REPORT 2: Rally Shot Analysis ──────────────────────────

function computeRallyThresholds(
  shotType: ShotType,
  incomingQuality: number,
  opponentDefensive: number,
  opponentSpeed: number,
): { inPlay: number; winner: number; forcedError: number } {
  const relativeReq = RELATIVE_QUALITY_REQUIREMENTS[shotType] ?? 0.50;
  const category = getShotCategory(shotType);
  const multipliers = OUTCOME_MULTIPLIERS[category];
  const floor = MIN_QUALITY_FLOORS[category];
  const winnerFloor = MINIMUM_WINNER_THRESHOLDS[category];

  // Base requirement from incoming quality
  let inPlayReq = incomingQuality * relativeReq;

  // Opponent stat adjustments: (stat - 50) * multiplier
  inPlayReq += (opponentDefensive - 50) * OPPONENT_STAT_ADJUSTMENTS.defensive;
  inPlayReq += (opponentSpeed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;

  // Apply minimum floor
  inPlayReq = Math.max(inPlayReq, floor);

  const winnerReq = Math.max(inPlayReq * multipliers.winner, winnerFloor);
  const forcedErrorReq = inPlayReq * multipliers.forcedError;

  return { inPlay: inPlayReq, winner: winnerReq, forcedError: forcedErrorReq };
}

function runRallyAnalysis(): void {
  printHeader('REPORT 2: Rally Shot Analysis');

  const calculator = new ShotCalculator();

  for (const shotType of RALLY_SHOT_TYPES) {
    const category = getShotCategory(shotType);
    const relativeReq = RELATIVE_QUALITY_REQUIREMENTS[shotType] ?? 0.50;

    print(`  ┌─ ${shotType} (${category}) ── relative requirement: ${relativeReq}`);

    for (const incomingQ of INCOMING_QUALITIES) {
      const opponent = createUniformPlayer('Opponent', 50);
      const thresholds = computeRallyThresholds(shotType, incomingQ, 50, 50);
      const incomingShot = makeIncomingShotDetail(incomingQ);

      print(`  │`);
      print(`  ├─ Incoming Quality: ${incomingQ} │ Opponent: 50-rated`);
      print(`  │  InPlay: ${fmtNum(thresholds.inPlay)} │ Winner: ${fmtNum(thresholds.winner)} │ ForcedError: ${fmtNum(thresholds.forcedError)}`);
      print('');

      const rows: (string | number)[][] = [];
      const allQualities: Map<number, number[]> = new Map();

      for (const rating of RATINGS) {
        const player = createUniformPlayer('Player', rating);
        const qualities: number[] = [];
        let winners = 0;
        let inPlayCount = 0;
        let forcedErrors = 0;
        let unforcedErrors = 0;

        suppressLogs();
        for (let i = 0; i < N_SHOTS; i++) {
          const result = calculator.calculateShotSuccess(
            player, shotType, makeRallyContext(), opponent, 'well_positioned',
            incomingShot,
          );
          qualities.push(result.quality);
          switch (result.outcome) {
            case PointType.WINNER: winners++; break;
            case PointType.IN_PLAY: inPlayCount++; break;
            case PointType.FORCED_ERROR: forcedErrors++; break;
            case PointType.UNFORCED_ERROR: unforcedErrors++; break;
          }
        }
        restoreLogs();

        const stats = computeStats(qualities);
        allQualities.set(rating, qualities);

        rows.push([
          String(rating), stats.mean, stats.stddev, stats.p10, stats.p90,
          fmtPct(unforcedErrors, N_SHOTS), fmtPct(forcedErrors, N_SHOTS),
          fmtPct(inPlayCount, N_SHOTS), fmtPct(winners, N_SHOTS),
        ]);
      }

      printTable(
        ['Rating', 'Mean', 'StdDev', 'P10', 'P90', 'UE%', 'FE%', 'InPlay%', 'Winner%'],
        rows,
      );

      // Histogram for key ratings
      for (const rating of HISTOGRAM_RATINGS) {
        const quals = allQualities.get(rating);
        if (quals) {
          print(`\n  Quality Distribution (Rating ${rating}, ${shotType}, incoming=${incomingQ}):`);
          printHistogram(quals, [
            { label: 'FE', value: thresholds.forcedError },
            { label: 'InPlay', value: thresholds.inPlay },
            { label: 'Winner', value: thresholds.winner },
          ]);
        }
      }

      print('');
    }
    print(`  └${'─'.repeat(60)}`);
    print('');
  }
}

// ─── REPORT 3: Match Outcome Rates ──────────────────────────

function runMatchAnalysis(): void {
  printHeader('REPORT 3: Match Outcomes');

  const rows: (string | number)[][] = [];

  for (const [r1, r2] of MATCH_PAIRINGS) {
    const player = createUniformPlayer('Player', r1);
    const opponent = createUniformPlayer('Opponent', r2);

    suppressLogs();
    const results = MatchSimulator.simulateMultipleMatches({
      player,
      opponent,
      courtSurface: 'hard',
      matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 },
    }, N_MATCHES);
    restoreLogs();

    const playerWins = results.filter(r => r.winner === 'player').length;
    const avgAces = results.reduce((s, r) => s + r.statistics.aces.player, 0) / N_MATCHES;
    const avgWinners = results.reduce((s, r) => s + r.statistics.winners.player, 0) / N_MATCHES;
    const avgUE = results.reduce((s, r) => s + r.statistics.unforcedErrors.player, 0) / N_MATCHES;
    const avgFE = results.reduce((s, r) => s + r.statistics.forcedErrors.player, 0) / N_MATCHES;
    const avgRally = results.reduce((s, r) => s + r.statistics.averageRallyLength, 0) / N_MATCHES;

    // Get most common score
    const scoreCounts = new Map<string, number>();
    for (const r of results) {
      scoreCounts.set(r.finalScore, (scoreCounts.get(r.finalScore) ?? 0) + 1);
    }
    const topScore = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '?';

    rows.push([
      `${r1}v${r2}`, fmtPct(playerWins, N_MATCHES), topScore,
      avgAces, avgWinners, avgUE, avgFE, avgRally,
    ]);
  }

  printTable(
    ['Matchup', 'P1 Win%', 'Top Score', 'Avg Aces', 'Avg Winners', 'Avg UE', 'Avg FE', 'Avg Rally'],
    rows,
  );
}

// ─── REPORT 4: Modifier Breakdown ───────────────────────────

function runModifierBreakdown(): void {
  printHeader('REPORT 4: Modifier Breakdown (Single Shot Trace)');

  const calculator = new ShotCalculator();
  const opponent = createUniformPlayer('Opponent', 50);
  const incomingShot = makeIncomingShotDetail(50);

  const shotTypesToTrace: { type: ShotType; isServe: boolean }[] = [
    { type: 'serve_first', isServe: true },
    { type: 'forehand', isServe: false },
  ];

  for (const { type, isServe } of shotTypesToTrace) {
    print(`  ${type}:`);
    print('');

    for (const rating of RATINGS) {
      const player = createUniformPlayer('Player', rating);

      suppressLogs();
      const result = calculator.calculateShotSuccess(
        player, type, isServe ? makeServeContext() : makeRallyContext(),
        opponent, 'well_positioned',
        isServe ? undefined : incomingShot,
      );
      restoreLogs();

      const m = result.modifiers;
      print(`    Rating ${rating}:`);
      print(`      Primary stat:       ${rating}`);
      print(`      Spin bonus:         x${fmtNum(1 + m.spinBonus / 100, 3)}`);
      print(`      Placement bonus:    x${fmtNum(1 + m.placementBonus / 100, 3)}`);
      print(`      Physical modifier:  x${fmtNum(m.physicalModifier, 3)}`);
      print(`      Mental modifier:    x${fmtNum(m.mentalModifier, 3)}`);
      print(`      Difficulty mod:     x${fmtNum(m.difficultyModifier, 3)}`);
      print(`      Pressure mod:       x${fmtNum(m.pressureModifier, 3)}`);
      print(`      Rally length mod:   x${fmtNum(m.rallyLengthModifier, 3)}`);
      print(`      Final adjustment:   x${fmtNum(m.finalAdjustment, 3)}`);
      if (m.serveVariance !== undefined) print(`      Serve variance:     ${m.serveVariance > 0 ? '+' : ''}${fmtNum(m.serveVariance)}`);
      if (m.returnVariance !== undefined) print(`      Return variance:    ${m.returnVariance > 0 ? '+' : ''}${fmtNum(m.returnVariance)}`);
      if (m.rallyVariance !== undefined) print(`      Rally variance:     ${m.rallyVariance > 0 ? '+' : ''}${fmtNum(m.rallyVariance)}`);
      print(`      Final quality:      ${fmtNum(result.quality)}`);
      print(`      Outcome:            ${result.outcome}`);
      if (result.thresholds) {
        print(`      Thresholds:         InPlay=${fmtNum(result.thresholds.inPlay)} Winner=${fmtNum(result.thresholds.winner)} FE=${fmtNum(result.thresholds.forcedError)}`);
      }
      print('');
    }
  }
}

// ─── Main ────────────────────────────────────────────────────

function main(): void {
  printBanner('TENNIS RPG BALANCE ANALYSIS');
  print(`  Ratings tested: ${RATINGS.join(', ')}`);
  print(`  Shots per test: ${N_SHOTS}`);
  print(`  Matches per pairing: ${N_MATCHES}`);

  runServeAnalysis();
  runRallyAnalysis();
  runMatchAnalysis();
  runModifierBreakdown();

  print('');
  print('Analysis complete.');
}

main();
