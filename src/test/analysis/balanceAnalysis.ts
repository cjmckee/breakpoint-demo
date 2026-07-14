/**
 * Balance Analysis - Automated analysis of how player ratings affect shot outcomes
 *
 * Run with: npm run analyze
 */

import type { ShotType, ShotContext, ShotDetail, CourtSurface } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import { ShotCalculator } from '../../core/ShotCalculator.js';
import { MatchSimulator } from '../../core/MatchSimulator.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { aggregateArchetypeEffects } from '../../data/archetypeTree.js';
import { createUniformPlayer, createArchetypePlayer } from './playerFactory.js';
import { computeStats } from './stats.js';
import type { ArchetypeProfile, GamePhase, PhasePathId, SpecialtyTier } from '../../types/archetype.js';
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
const MATCHUP_RATINGS = [30, 50, 70, 90];
const SURFACES: CourtSurface[] = ['hard', 'clay', 'grass', 'carpet'];
const N_SHOTS = 1000;
const N_MATCHES = 50;

const SERVE_TYPES: ShotType[] = ['serve_first', 'serve_second'];

const RALLY_SHOT_TYPES: ShotType[] = [
  'forehand', 'backhand', 'forehand_power', 'slice_forehand',
  'return_forehand', 'passing_shot_forehand', 'lob_forehand', 'drop_shot_forehand',
];

const INCOMING_QUALITIES = [30, 50, 70];
const OPPONENT_RETURN_RATINGS = [30, 50, 70];

// ─── Suppress console.log during simulation ──────────────────

const _origLog = console.log;
function suppressLogs(): void { console.log = () => {}; }
function restoreLogs(): void { console.log = _origLog; }

// ─── Helpers ─────────────────────────────────────────────────

function makeServeContext(courtSurface: CourtSurface = 'hard'): ShotContext {
  return { difficulty: 'normal', pressure: 'low', courtPosition: 'baseline', rallyLength: 1, courtSurface };
}

function makeRallyContext(rallyLength: number = 3, courtSurface: CourtSurface = 'hard'): ShotContext {
  return { difficulty: 'normal', pressure: 'low', courtPosition: 'baseline', rallyLength, courtSurface };
}

function makeIncomingShotDetail(quality: number, shotType: ShotType = 'forehand', courtSurface: CourtSurface = 'hard'): ShotDetail {
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
      fatigueModifier: 1, momentumModifier: 1,
    },
    timestamp: Date.now(),
    shotNumber: 2,
    context: makeRallyContext(3, courtSurface),
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
      print(`  InPlay Threshold (base): ${baseline.inPlayThreshold} │ Ace Threshold (base): ${fmtNum(aceThreshold)}`);
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
//
// Runs every player rating (30/50/70/90) against every opponent rating
// (30/50/70/90), on every surface (hard/clay/grass/carpet). That's
// 4×4 = 16 matchups per surface × 4 surfaces = 64 reports.

function runMatchAnalysis(): void {
  printHeader('REPORT 3: Match Outcomes (4×4 matchups × 4 surfaces = 64 reports)');

  for (const surface of SURFACES) {
    print('');
    print(`  ┌─ Surface: ${surface.toUpperCase()} ${'─'.repeat(60 - surface.length)}`);
    print('');

    const rows: (string | number)[][] = [];

    for (const r1 of MATCHUP_RATINGS) {
      for (const r2 of MATCHUP_RATINGS) {
        const player = createUniformPlayer('Player', r1);
        const opponent = createUniformPlayer('Opponent', r2);

        suppressLogs();
        const results = MatchSimulator.simulateMultipleMatches({
          player,
          opponent,
          courtSurface: surface,
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
    }

    printTable(
      ['Matchup', 'P1 Win%', 'Top Score', 'Avg Aces', 'Avg Winners', 'Avg UE', 'Avg FE', 'Avg Rally'],
      rows,
    );

    // Win rate matrix: rows = player rating, cols = opponent rating
    print('');
    print(`  Win Rate Matrix (${surface}) — rows: P1 rating, cols: P2 rating`);
    const matrixRows: (string | number)[][] = [];
    for (let i = 0; i < MATCHUP_RATINGS.length; i++) {
      const r1 = MATCHUP_RATINGS[i];
      const matrixRow: (string | number)[] = [String(r1)];
      for (let j = 0; j < MATCHUP_RATINGS.length; j++) {
        const winRow = rows[i * MATCHUP_RATINGS.length + j];
        matrixRow.push(winRow[1] as string);
      }
      matrixRows.push(matrixRow);
    }
    printTable(
      ['P1 \\ P2', ...MATCHUP_RATINGS.map(String)],
      matrixRows,
    );

    print(`  └${'─'.repeat(70)}`);
  }
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

// ─── REPORT 5: Archetype Effects ────────────────────────────
//
// Isolates archetype behavior: every player is uniform-rated and plays a fixed
// neutral opponent, so any difference comes purely from the chosen specialties.

const ARCH_RATING = 60;
const N_ARCH_MATCHES = 150;

function archProfile(
  phases: Partial<Record<GamePhase, { path: PhasePathId; tier: SpecialtyTier }>>,
  broad: ArchetypeProfile['broad'] = 'all_courter',
): ArchetypeProfile {
  return { broad, phases, specializationPoints: 0, respecTokens: 0 };
}

interface ArchAgg {
  winPct: number; aces: number; df: number; winners: number; ue: number;
  firstServePct: number; rally: number;
}

function runArchetypeMatches(playerProfile: ArchetypeProfile, opponentProfile: ArchetypeProfile): ArchAgg {
  suppressLogs();
  const results = MatchSimulator.simulateMultipleMatches({
    player: createArchetypePlayer('P', ARCH_RATING, playerProfile),
    opponent: createArchetypePlayer('O', ARCH_RATING, opponentProfile),
    courtSurface: 'hard',
    matchFormat: { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 },
  }, N_ARCH_MATCHES);
  restoreLogs();

  const n = results.length;
  const avg = (f: (r: typeof results[number]) => number) => results.reduce((s, r) => s + f(r), 0) / n;
  return {
    winPct: results.filter(r => r.winner === 'player').length / n,
    aces: avg(r => r.statistics.aces.player),
    df: avg(r => r.statistics.doubleFaults.player),
    winners: avg(r => r.statistics.winners.player),
    ue: avg(r => r.statistics.unforcedErrors.player),
    firstServePct: avg(r => r.statistics.firstServePercentage.player),
    rally: avg(r => r.statistics.averageRallyLength),
  };
}

function runArchetypeReport(): void {
  printHeader('REPORT 5: Archetype Effects (uniform 60 vs neutral 60, archetype-only diff)');

  const neutral = archProfile({});

  // Single-specialty scenarios vs a neutral opponent.
  const scenarios: [string, ArchetypeProfile][] = [
    ['Baseline (none)', neutral],
    ['Bomber I', archProfile({ first_serve: { path: 'fs_bomber', tier: 1 } })],
    ['Bomber III', archProfile({ first_serve: { path: 'fs_bomber', tier: 3 } })],
    ['Spot-Server I', archProfile({ first_serve: { path: 'fs_sniper', tier: 1 } })],
    ['Spot-Server III', archProfile({ first_serve: { path: 'fs_sniper', tier: 3 } })],
    ['Safe 2nd I', archProfile({ second_serve: { path: 'ss_pancake', tier: 1 } })],
    ['Safe 2nd III', archProfile({ second_serve: { path: 'ss_pancake', tier: 3 } })],
    ['Gambler 2nd I', archProfile({ second_serve: { path: 'ss_gambler', tier: 1 } })],
    ['Gambler 2nd III', archProfile({ second_serve: { path: 'ss_gambler', tier: 3 } })],
    ['Flat FH I', archProfile({ forehand: { path: 'fh_laserbeam', tier: 1 } })],
    ['Flat FH III', archProfile({ forehand: { path: 'fh_laserbeam', tier: 3 } })],
    ['Heavy Topspin III', archProfile({ forehand: { path: 'fh_rpm_overdrive', tier: 3 } })],
  ];

  const rows: (string | number)[][] = [];
  for (const [label, prof] of scenarios) {
    const a = runArchetypeMatches(prof, neutral);
    rows.push([
      label, fmtPct(Math.round(a.winPct * N_ARCH_MATCHES), N_ARCH_MATCHES),
      fmtNum(a.aces), fmtNum(a.df), fmtNum(a.firstServePct), fmtNum(a.winners), fmtNum(a.ue), fmtNum(a.rally),
    ]);
  }
  printTable(
    ['Scenario', 'Win%', 'Aces', 'DblFaults', '1stServe%', 'Winners', 'UE', 'AvgRally'],
    rows,
  );

  // Archetype-vs-archetype matchups.
  print('');
  print('  Matchups (player listed first; Win% is for that player):');
  const netRusher = archProfile({ net: { path: 'net_downhill', tier: 2 }, first_serve: { path: 'fs_bomber', tier: 2 }, return: { path: 'rt_sneaky_beaky', tier: 2 } }, 'net_downhill');
  const grinder = archProfile({ forehand: { path: 'fh_survivor', tier: 2 }, backhand: { path: 'bh_brick_wall', tier: 2 }, return: { path: 'rt_extinguisher', tier: 2 }, net: { path: 'net_apologist', tier: 2 } }, 'baseliner');
  const aggressive = archProfile({ forehand: { path: 'fh_laserbeam', tier: 2 }, first_serve: { path: 'fs_bomber', tier: 2 }, return: { path: 'rt_redliner', tier: 2 } });
  const counter = archProfile({ forehand: { path: 'fh_survivor', tier: 2 }, backhand: { path: 'bh_samurai', tier: 2 }, return: { path: 'rt_extinguisher', tier: 2 } }, 'baseliner');

  const netOnly = archProfile({ net: { path: 'net_downhill', tier: 3 } }, 'net_downhill');
  const netT1 = archProfile({ net: { path: 'net_downhill', tier: 1 } }, 'net_downhill');
  const matchups: [string, ArchetypeProfile, ArchetypeProfile][] = [
    ['Net-Rusher(full) vs Grinder', netRusher, grinder],
    ['Net t3 (w/ NET_GAME) vs Base', netOnly, neutral],
    ['Net t1 (no NET_GAME) vs Base', netT1, neutral],
    ['Net t1 vs Grinder', netT1, grinder],
    ['Aggressive vs Counter', aggressive, counter],
    ['Aggressive vs Grinder', aggressive, grinder],
  ];
  const mrows: (string | number)[][] = [];
  for (const [label, p, o] of matchups) {
    const a = runArchetypeMatches(p, o);
    mrows.push([label, fmtPct(Math.round(a.winPct * N_ARCH_MATCHES), N_ARCH_MATCHES), fmtNum(a.winners), fmtNum(a.ue), fmtNum(a.rally)]);
  }
  printTable(['Matchup', 'P1 Win%', 'P1 Winners', 'P1 UE', 'AvgRally'], mrows);
}

// ─── REPORT 6: Archetype Playstyle Expression (point-level) ──
//
// Isolates each archetype by running raw points (archetype always serving vs a
// neutral returner) and reporting the signature-category rates — the numbers
// that show a playstyle is actually being expressed, independent of win rate.

const N_STYLE_POINTS = 4000;

function styleMatchState(): unknown {
  return {
    score: { currentGame: { server: 1, returner: 1 } },
    currentServer: 'player', courtSurface: 'hard', momentum: 0,
    pressure: 'low', matchLength: 10, pointsPlayed: 10, isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };
}

interface StyleRates {
  acePct: number; dfPct: number; firstInPct: number;
  powerWinPct: number; powerUEPct: number; powerShare: number;
  netApproachPct: number; bhSlicePct: number; avgRally: number;
}

function runArchetypeStyle(profile: ArchetypeProfile, n: number): StyleRates {
  const ps = new PointSimulator();
  const fx = aggregateArchetypeEffects(profile);
  const player = createArchetypePlayer('P', ARCH_RATING, profile);
  const opp = createUniformPlayer('O', ARCH_RATING);

  let points = 0, df = 0, aces = 0, firstServes = 0, firstIn = 0;
  let serverShots = 0, powerShots = 0, powerWin = 0, powerErr = 0;
  let approaches = 0, bh = 0, bhSlice = 0, rallyTotal = 0;

  suppressLogs();
  for (let i = 0; i < n; i++) {
    const r = ps.simulatePoint('player', player, opp, styleMatchState() as never, fx, {});
    points++;
    rallyTotal += r.rallyLength;
    if (r.pointType === PointType.DOUBLE_FAULT) df++;
    for (const s of r.shots) {
      if (s.shooter !== 'server') continue; // the archetype player's own shots
      serverShots++;
      if (s.shotType === 'serve_first') { firstServes++; if (s.outcome !== PointType.FAULT) firstIn++; }
      if (s.outcome === PointType.ACE) aces++;
      if (s.shotType.includes('power')) {
        powerShots++;
        if (s.outcome === PointType.WINNER) powerWin++;
        if (s.outcome === PointType.UNFORCED_ERROR || s.outcome === PointType.FORCED_ERROR) powerErr++;
      }
      if (s.shotType.includes('approach')) approaches++;
      if (s.shotType.includes('backhand')) { bh++; if (s.shotType.includes('slice')) bhSlice++; }
    }
  }
  restoreLogs();

  const rallyShots = serverShots - firstServes; // exclude first serves from "shot" denominators
  return {
    acePct: points ? (100 * aces / points) : 0,
    dfPct: points ? (100 * df / points) : 0,
    firstInPct: firstServes ? (100 * firstIn / firstServes) : 0,
    powerWinPct: powerShots ? (100 * powerWin / powerShots) : 0,
    powerUEPct: powerShots ? (100 * powerErr / powerShots) : 0,
    powerShare: rallyShots > 0 ? (100 * powerShots / rallyShots) : 0,
    netApproachPct: rallyShots > 0 ? (100 * approaches / rallyShots) : 0,
    bhSlicePct: bh ? (100 * bhSlice / bh) : 0,
    avgRally: points ? (rallyTotal / points) : 0,
  };
}

function runArchetypeStyleReport(): void {
  printHeader('REPORT 6: Archetype Playstyle Expression (point-level, archetype serving)');

  const scenarios: [string, ArchetypeProfile][] = [
    ['Baseline', archProfile({})],
    ['Bomber I', archProfile({ first_serve: { path: 'fs_bomber', tier: 1 } })],
    ['Bomber III', archProfile({ first_serve: { path: 'fs_bomber', tier: 3 } })],
    ['Spot-Server III', archProfile({ first_serve: { path: 'fs_sniper', tier: 3 } })],
    ['Safe 2nd I', archProfile({ second_serve: { path: 'ss_pancake', tier: 1 } })],
    ['Safe 2nd III', archProfile({ second_serve: { path: 'ss_pancake', tier: 3 } })],
    ['Gambler 2nd III', archProfile({ second_serve: { path: 'ss_gambler', tier: 3 } })],
    ['Flat FH I', archProfile({ forehand: { path: 'fh_laserbeam', tier: 1 } })],
    ['Flat FH III', archProfile({ forehand: { path: 'fh_laserbeam', tier: 3 } })],
    ['Net-Rusher III', archProfile({ net: { path: 'net_downhill', tier: 3 } }, 'net_downhill')],
    ['Slice BH III', archProfile({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner')],
    ['Grinder', archProfile({ forehand: { path: 'fh_survivor', tier: 2 }, backhand: { path: 'bh_brick_wall', tier: 2 }, net: { path: 'net_apologist', tier: 2 } }, 'baseliner')],
  ];

  const rows: (string | number)[][] = [];
  for (const [label, prof] of scenarios) {
    const s = runArchetypeStyle(prof, N_STYLE_POINTS);
    rows.push([
      label,
      fmtNum(s.acePct), fmtNum(s.dfPct), fmtNum(s.firstInPct),
      fmtNum(s.powerShare), fmtNum(s.powerWinPct), fmtNum(s.powerUEPct),
      fmtNum(s.netApproachPct), fmtNum(s.bhSlicePct), fmtNum(s.avgRally),
    ]);
  }
  printTable(
    ['Scenario', 'Ace%', 'DF%', '1stIn%', 'Power%', 'PwrWin%', 'PwrUE%', 'NetAppr%', 'BHslice%', 'Rally'],
    rows,
  );
  print('  (Ace%/DF% per point; 1stIn% of first serves; Power%/NetAppr%/BHslice% of the player\'s rally shots)');
}

// ─── Main ────────────────────────────────────────────────────

function main(): void {
  printBanner('TENNIS RPG BALANCE ANALYSIS');

  // `npm run analyze -- --archetype` runs only the archetype reports (fast).
  if (process.argv.includes('--archetype')) {
    runArchetypeStyleReport();
    runArchetypeReport();
    print('');
    print('Analysis complete.');
    return;
  }

  print(`  Ratings tested: ${RATINGS.join(', ')}`);
  print(`  Shots per test: ${N_SHOTS}`);
  print(`  Matches per pairing: ${N_MATCHES}`);

  runServeAnalysis();
  runRallyAnalysis();
  runMatchAnalysis();
  runModifierBreakdown();
  runArchetypeStyleReport();
  runArchetypeReport();

  print('');
  print('Analysis complete.');
}

main();
