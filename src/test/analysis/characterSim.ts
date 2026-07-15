/**
 * Character Simulation - Runs a specific player build against the game's real
 * opponent presets (practice tiers + Riverside Open) to diagnose balance.
 *
 * Run with: npm run build:node && node dist/src/test/analysis/characterSim.js
 *
 * Mirrors MatchOrchestrator's non-key-moment path: PointSimulator per point,
 * ScoreTracker for scoring, MatchSimulator-style momentum/fatigue/pressure,
 * and ability + archetype effects passed through. Key moments are excluded
 * (they depend on live user choices).
 */

import type { MatchFormat, MatchState, PlayerStats, MatchStatistics as IMatchStatistics } from '../../types/index.js';
import type { Ability } from '../../types/game.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MatchStatistics } from '../../core/MatchStatistics.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects } from '../../data/archetypeTree.js';
import {
  OPPONENTS_BY_TIER,
  getScaledOpponentStats,
  getOpponentArchetypeProfile,
  type OpponentPreset,
} from '../../data/opponents.js';
import { riversideOpen } from '../../data/tournaments/riversideOpen.js';
import { print, printBanner, printHeader, printTable, fmtNum } from './formatters.js';

// ─── Configuration ───────────────────────────────────────────

const N_MATCHES = 200;

const BO1: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

// The day-39 character, as shown on the stats screen.
// "Effective" = base stat + item boost (item boosts apply in matches).
const CHARACTER_EFFECTIVE: PlayerStats = {
  core: { serve: 72, forehand: 56, backhand: 45, return: 52, slice: 44 },
  technical: { volley: 40, overhead: 42, dropShot: 30, spin: 49, placement: 52 },
  physical: { speed: 53, stamina: 66, strength: 47, agility: 44, recovery: 55 },
  mental: { focus: 57, anticipation: 42, shotVariety: 36, offensive: 51, defensive: 58 },
};

const CHARACTER_BASE: PlayerStats = {
  core: { serve: 64, forehand: 47, backhand: 37, return: 44, slice: 38 },
  technical: { volley: 40, overhead: 42, dropShot: 30, spin: 44, placement: 52 },
  physical: { speed: 47, stamina: 55, strength: 40, agility: 42, recovery: 52 },
  mental: { focus: 45, anticipation: 42, shotVariety: 32, offensive: 51, defensive: 54 },
};

// ─── Suppress console.log during simulation ──────────────────

const _origLog = console.log;
function suppressLogs(): void { console.log = () => {}; }
function restoreLogs(): void { console.log = _origLog; }

// ─── Match runner (mirrors MatchSimulator/MatchOrchestrator loop) ──

interface RunResult {
  winner: 'player' | 'opponent';
  sets: Array<{ player: number; opponent: number }>;
  stats: IMatchStatistics;
  endFatigue: { player: number; opponent: number };
  points: number;
  // Direct tallies (independent of MatchStatistics attribution)
  serveWon: { player: number; opponent: number };
  serveTotal: { player: number; opponent: number };
}

function calculateNewFatigue(
  currentFatigue: number,
  rallyLength: number,
  staminaStat: number,
  recoveryStat: number,
): number {
  const staminaFactor = MATCH_FATIGUE.minFatigueRate +
    (1 - MATCH_FATIGUE.minFatigueRate) * (1 - staminaStat / 100);

  let fatigueGain = rallyLength * MATCH_FATIGUE.basePerShot * staminaFactor;
  if (rallyLength > MATCH_FATIGUE.longRallyThreshold) {
    fatigueGain += (rallyLength - MATCH_FATIGUE.longRallyThreshold) *
      MATCH_FATIGUE.longRallyExtra * staminaFactor;
  }

  const recovery = MATCH_FATIGUE.baseRecoveryPerPoint +
    (recoveryStat / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);

  return Math.max(0, Math.min(100, currentFatigue + fatigueGain - recovery));
}

/** Ability "additional" effects + archetype behavior effects, as the orchestrator builds them. */
function buildEffects(abilities?: Ability[], archetypeProfile?: ArchetypeProfile): Record<string, number> {
  const effects: Record<string, number> = {};
  for (const ability of abilities ?? []) {
    for (const [key, value] of Object.entries(ability.modifiers?.additional ?? {})) {
      effects[key] = (effects[key] || 0) + value;
    }
  }
  if (archetypeProfile) {
    for (const [key, value] of Object.entries(aggregateArchetypeEffects(archetypeProfile))) {
      effects[key] = (effects[key] || 0) + value;
    }
  }
  return effects;
}

function runMatch(
  player: PlayerProfile,
  opponent: PlayerProfile,
  playerEffects: Record<string, number>,
  opponentEffects: Record<string, number>,
  format: MatchFormat,
): RunResult {
  const tracker = new ScoreTracker(format);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  player.rollMatchForm();
  opponent.rollMatchForm();
  const pointSim = new PointSimulator();
  const stats = new MatchStatistics(player, opponent);

  const matchState: MatchState = {
    score: tracker.getScore(),
    currentServer: tracker.getCurrentServer(),
    courtSurface: 'hard',
    momentum: 0,
    pressure: 'low',
    matchLength: 0,
    pointsPlayed: 0,
    isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };

  const recentWinners: Array<'player' | 'opponent'> = [];
  const serveWon = { player: 0, opponent: 0 };
  const serveTotal = { player: 0, opponent: 0 };
  let points = 0;
  const maxPoints = 600;

  while (!tracker.isComplete() && points < maxPoints) {
    const server = tracker.getCurrentServer();
    const serverProfile = server === 'player' ? player : opponent;
    const returnerProfile = server === 'player' ? opponent : player;
    matchState.isKeyMoment = tracker.isKeyMoment();
    const breakPointFor = tracker.getBreakPointFor();

    const pointResult = pointSim.simulatePoint(
      server, serverProfile, returnerProfile, matchState, playerEffects, opponentEffects,
    );

    const pointWinner = pointResult.winner === 'server'
      ? server
      : (server === 'player' ? 'opponent' : 'player');
    tracker.addPoint(pointWinner);
    stats.addPointResult(pointResult, server, breakPointFor);
    serveTotal[server]++;
    if (pointWinner === server) serveWon[server]++;

    // Momentum: last-5-points form, as in MatchSimulator
    recentWinners.push(pointWinner);
    if (recentWinners.length > 5) recentWinners.shift();
    const pw = recentWinners.filter(w => w === 'player').length;
    matchState.momentum = ((pw - (recentWinners.length - pw)) / recentWinners.length) * 100;

    // Fatigue
    matchState.fatigue.player = calculateNewFatigue(
      matchState.fatigue.player, pointResult.rallyLength,
      player.stats.physical.stamina, player.stats.physical.recovery,
    );
    matchState.fatigue.opponent = calculateNewFatigue(
      matchState.fatigue.opponent, pointResult.rallyLength,
      opponent.stats.physical.stamina, opponent.stats.physical.recovery,
    );

    points++;
    matchState.score = tracker.getScore();
    matchState.currentServer = tracker.getCurrentServer();
    matchState.pointsPlayed = points;
    matchState.pressure = matchState.isKeyMoment ? 'high' : points > 30 ? 'medium' : 'low';
  }

  stats.finalizeStatistics();

  return {
    winner: tracker.getWinner() ?? 'player',
    sets: tracker.getScore().sets
      .filter(s => s.isComplete)
      .map(s => ({ player: s.player, opponent: s.opponent })),
    stats: stats.getStatistics(),
    endFatigue: { ...matchState.fatigue },
    points,
    serveWon,
    serveTotal,
  };
}

// ─── Aggregation ─────────────────────────────────────────────

interface MatchupSummary {
  label: string;
  oppOvr: number;
  winPct: number;
  gamesWon: number;
  gamesLost: number;
  bagelSetPct: number;      // sets won 6-0 by player / total sets
  setsLostPct: number;      // sets won by opponent / total sets
  pAces: number; pDf: number; pWinners: number; pUe: number;
  oAces: number; oWinners: number; oUe: number;
  avgRally: number;
  pHoldPct: number; oHoldPct: number;
  endFatigueP: number; endFatigueO: number;
  topScores: string;
}

function summarize(
  label: string,
  playerProfileFactory: () => PlayerProfile,
  opponentProfileFactory: () => PlayerProfile,
  playerEffects: Record<string, number>,
  opponentEffects: Record<string, number>,
  format: MatchFormat,
  n: number,
): MatchupSummary {
  let wins = 0, gamesWon = 0, gamesLost = 0, bagels = 0, setsLost = 0, totalSets = 0;
  let pAces = 0, pDf = 0, pWinners = 0, pUe = 0, oAces = 0, oWinners = 0, oUe = 0, rally = 0;
  let pServeWon = 0, pServeTotal = 0, oServeWon = 0, oServeTotal = 0;
  let fatP = 0, fatO = 0;
  let oppOvr = 0;
  const scoreCounts = new Map<string, number>();

  suppressLogs();
  for (let i = 0; i < n; i++) {
    const player = playerProfileFactory();
    const opponent = opponentProfileFactory();
    oppOvr = opponent.overallRating;
    const r = runMatch(player, opponent, playerEffects, opponentEffects, format);

    if (r.winner === 'player') wins++;
    const scoreStr = r.sets.map(s => `${s.player}-${s.opponent}`).join(' ');
    scoreCounts.set(scoreStr, (scoreCounts.get(scoreStr) ?? 0) + 1);
    for (const s of r.sets) {
      totalSets++;
      gamesWon += s.player;
      gamesLost += s.opponent;
      if (s.player === 6 && s.opponent === 0) bagels++;
      if (s.opponent > s.player) setsLost++;
    }
    pAces += r.stats.aces.player; pDf += r.stats.doubleFaults.player;
    pWinners += r.stats.winners.player; pUe += r.stats.unforcedErrors.player;
    oAces += r.stats.aces.opponent; oWinners += r.stats.winners.opponent;
    oUe += r.stats.unforcedErrors.opponent;
    rally += r.stats.averageRallyLength;
    // Serve-point win rates tallied directly in the match loop
    pServeWon += r.serveWon.player;
    pServeTotal += r.serveTotal.player;
    oServeWon += r.serveWon.opponent;
    oServeTotal += r.serveTotal.opponent;
    fatP += r.endFatigue.player; fatO += r.endFatigue.opponent;
  }
  restoreLogs();

  const topScores = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([score, count]) => `${score} (${Math.round(100 * count / n)}%)`)
    .join(', ');

  return {
    label,
    oppOvr,
    winPct: 100 * wins / n,
    gamesWon: gamesWon / n,
    gamesLost: gamesLost / n,
    bagelSetPct: totalSets ? 100 * bagels / totalSets : 0,
    setsLostPct: totalSets ? 100 * setsLost / totalSets : 0,
    pAces: pAces / n, pDf: pDf / n, pWinners: pWinners / n, pUe: pUe / n,
    oAces: oAces / n, oWinners: oWinners / n, oUe: oUe / n,
    avgRally: rally / n,
    pHoldPct: pServeTotal ? 100 * pServeWon / pServeTotal : 0,
    oHoldPct: oServeTotal ? 100 * oServeWon / oServeTotal : 0,
    endFatigueP: fatP / n, endFatigueO: fatO / n,
    topScores,
  };
}

function summaryRow(s: MatchupSummary): (string | number)[] {
  return [
    s.label, String(s.oppOvr),
    fmtNum(s.winPct, 1) + '%',
    `${fmtNum(s.gamesWon, 1)}-${fmtNum(s.gamesLost, 1)}`,
    fmtNum(s.bagelSetPct, 0) + '%',
    fmtNum(s.setsLostPct, 1) + '%',
    fmtNum(s.pHoldPct, 0) + '/' + fmtNum(s.oHoldPct, 0),
    fmtNum(s.pAces, 1), fmtNum(s.pDf, 1), fmtNum(s.pWinners, 1), fmtNum(s.pUe, 1),
    fmtNum(s.oAces, 1), fmtNum(s.oWinners, 1), fmtNum(s.oUe, 1),
    fmtNum(s.avgRally, 1),
    `${fmtNum(s.endFatigueP, 0)}/${fmtNum(s.endFatigueO, 0)}`,
  ];
}

const SUMMARY_HEADER = [
  'Opponent', 'OVR', 'Win%', 'AvgGames', 'Bagel%', 'SetLoss%', 'SrvPt% P/O',
  'P.Ace', 'P.DF', 'P.Wnr', 'P.UE', 'O.Ace', 'O.Wnr', 'O.UE', 'Rally', 'EndFat P/O',
];

// ─── Scenario runners ────────────────────────────────────────

function makeCharacter(stats: PlayerStats): PlayerProfile {
  return new PlayerProfile('character', 'You', stats);
}

function opponentFromPreset(preset: OpponentPreset, tierWins: number): () => PlayerProfile {
  const stats = getScaledOpponentStats(preset.stats, tierWins);
  const profile = getOpponentArchetypeProfile(preset);
  return () => new PlayerProfile(`opp_${preset.name}`, preset.name, stats, profile);
}

function runPresetGroup(
  title: string,
  presets: OpponentPreset[],
  tierWins: number,
  playerStats: PlayerStats,
  format: MatchFormat,
): void {
  printHeader(title);
  const player = makeCharacter(playerStats);
  print(`  Character OVR: ${player.overallRating} │ tierWins boost: +${Math.min(tierWins * 2, 20)} │ format: Bo${format.bestOfSets} │ n=${N_MATCHES}/opponent`);
  print('');

  const summaries: MatchupSummary[] = [];
  for (const preset of presets) {
    summaries.push(summarize(
      preset.name,
      () => makeCharacter(playerStats),
      opponentFromPreset(preset, tierWins),
      {}, // player: no ability/archetype effects (unknown build) — see note in output
      buildEffects(preset.abilities, getOpponentArchetypeProfile(preset)),
      format,
      N_MATCHES,
    ));
  }
  printTable(SUMMARY_HEADER, summaries.map(summaryRow));
  print('');
  print('  Most common scores:');
  for (const s of summaries) {
    print(`    ${s.label}: ${s.topScores}`);
  }
}

function runRiverside(playerStats: PlayerStats): void {
  printHeader('Riverside Open opponents (Bo3, hard court)');
  const player = makeCharacter(playerStats);
  print(`  Character OVR: ${player.overallRating} │ n=${N_MATCHES}/opponent`);
  print('');

  const summaries: MatchupSummary[] = [];
  for (const round of riversideOpen.rounds) {
    const opp = round.opponent;
    const preset: OpponentPreset = {
      name: opp.name,
      description: opp.description ?? '',
      tier: opp.tier,
      archetype: opp.archetype,
      stats: opp.stats,
      abilities: opp.abilities,
    };
    summaries.push(summarize(
      `R${round.roundNumber} ${opp.name}`,
      () => makeCharacter(playerStats),
      opponentFromPreset(preset, 0),
      {},
      buildEffects(preset.abilities, getOpponentArchetypeProfile(preset)),
      BO3,
      N_MATCHES,
    ));
  }
  printTable(SUMMARY_HEADER, summaries.map(summaryRow));
}

/**
 * Serve-stat sensitivity sweep: same character, only the serve stat varies,
 * against a fixed all-court tier-2 opponent. Shows how much a single
 * specialized stat swings match outcomes.
 */
function runServeSweep(): void {
  printHeader('Serve-stat sensitivity sweep vs Jake Morrison (T2 all-court, OVR 56), Bo1');

  const jake = OPPONENTS_BY_TIER[2][2];
  const summaries: MatchupSummary[] = [];
  for (const serve of [42, 52, 62, 72, 82, 92]) {
    const stats: PlayerStats = {
      ...CHARACTER_EFFECTIVE,
      core: { ...CHARACTER_EFFECTIVE.core, serve },
    };
    const ovr = makeCharacter(stats).overallRating;
    summaries.push(summarize(
      `serve=${serve} (OVR ${ovr})`,
      () => makeCharacter(stats),
      opponentFromPreset(jake, 0),
      {},
      buildEffects(jake.abilities, getOpponentArchetypeProfile(jake)),
      BO1,
      N_MATCHES,
    ));
  }
  printTable(SUMMARY_HEADER, summaries.map(summaryRow));
}

/**
 * Return-stat sensitivity sweep, same setup, for contrast with the serve sweep.
 */
function runReturnSweep(): void {
  printHeader('Return-stat sensitivity sweep vs Jake Morrison (T2 all-court, OVR 56), Bo1');

  const jake = OPPONENTS_BY_TIER[2][2];
  const summaries: MatchupSummary[] = [];
  for (const ret of [42, 52, 62, 72, 82, 92]) {
    const stats: PlayerStats = {
      ...CHARACTER_EFFECTIVE,
      core: { ...CHARACTER_EFFECTIVE.core, return: ret },
    };
    const ovr = makeCharacter(stats).overallRating;
    summaries.push(summarize(
      `return=${ret} (OVR ${ovr})`,
      () => makeCharacter(stats),
      opponentFromPreset(jake, 0),
      {},
      buildEffects(jake.abilities, getOpponentArchetypeProfile(jake)),
      BO1,
      N_MATCHES,
    ));
  }
  printTable(SUMMARY_HEADER, summaries.map(summaryRow));
}

/**
 * Serve-style showcase: same overall rating, different serve identities.
 * Power server should hit more aces AND more faults than the precise server.
 */
function runServeStyleShowcase(): void {
  printHeader('Serve styles at equal OVR vs Jake Morrison (T2 all-court, OVR 56), Bo1');

  const jake = OPPONENTS_BY_TIER[2][2];
  const base = (r: number): PlayerStats => ({
    core: { serve: r, forehand: r, backhand: r, return: r, slice: r },
    technical: { volley: r, overhead: r, dropShot: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r, agility: r, recovery: r },
    mental: { focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r },
  });

  // Each build moves 40 points around within serve-related stats, net zero
  const balanced = base(56);
  const power: PlayerStats = {
    ...base(56),
    core: { ...base(56).core, serve: 76 },
    physical: { ...base(56).physical, strength: 76 },
    technical: { ...base(56).technical, placement: 36, spin: 56 },
    mental: { ...base(56).mental, focus: 36 },
  };
  const precise: PlayerStats = {
    ...base(56),
    core: { ...base(56).core, serve: 56 },
    technical: { ...base(56).technical, placement: 76, spin: 66 },
    mental: { ...base(56).mental, focus: 66 },
    physical: { ...base(56).physical, strength: 26 },
  };

  const summaries: MatchupSummary[] = [];
  for (const [label, stats] of [
    ['Balanced 56', balanced],
    ['Power server', power],
    ['Precise server', precise],
  ] as const) {
    const ovr = new PlayerProfile('p', label, stats).overallRating;
    summaries.push(summarize(
      `${label} (OVR ${ovr})`,
      () => new PlayerProfile('p', label, stats),
      opponentFromPreset(jake, 0),
      {},
      buildEffects(jake.abilities, getOpponentArchetypeProfile(jake)),
      BO1,
      N_MATCHES,
    ));
  }
  printTable(SUMMARY_HEADER, summaries.map(summaryRow));
}

/**
 * Pure rating-gap curve: uniform players at 50 vs 50+gap, no build shape.
 * The target experience: better player clearly favored but never certain,
 * with Bo3 amplifying the favorite modestly.
 */
function runGapCurve(): void {
  printHeader('Uniform rating-gap curve (uniform 50 vs uniform 50+gap)');

  for (const format of [BO1, BO3]) {
    const summaries: MatchupSummary[] = [];
    for (const gap of [0, 3, 5, 8, 12, 16, 20]) {
      const stats = (r: number): PlayerStats => ({
        core: { serve: r, forehand: r, backhand: r, return: r, slice: r },
        technical: { volley: r, overhead: r, dropShot: r, spin: r, placement: r },
        physical: { speed: r, stamina: r, strength: r, agility: r, recovery: r },
        mental: { focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r },
      });
      summaries.push(summarize(
        `50 vs ${50 + gap} (Bo${format.bestOfSets})`,
        () => new PlayerProfile('p', 'P', stats(50)),
        () => new PlayerProfile('o', 'O', stats(50 + gap)),
        {},
        {},
        format,
        N_MATCHES,
      ));
    }
    printTable(SUMMARY_HEADER, summaries.map(summaryRow));
    print('');
  }
}

// ─── Main ────────────────────────────────────────────────────

function main(): void {
  printBanner('CHARACTER BALANCE SIMULATION (day-39 build)');

  print('  Player modeled WITHOUT abilities/archetype effects (build unknown) —');
  print('  real results should skew slightly further in the player\'s favor.');
  print('  Key moments excluded (user-choice dependent).');

  runPresetGroup(
    'Tier 1 practice, +20 win-scaling (10 wins), Bo1 — "still dominating" case',
    OPPONENTS_BY_TIER[1], 10, CHARACTER_EFFECTIVE, BO1,
  );

  runPresetGroup(
    'Tier 1 practice, unscaled, Bo1 — reference',
    OPPONENTS_BY_TIER[1], 0, CHARACTER_EFFECTIVE, BO1,
  );

  runRiverside(CHARACTER_EFFECTIVE);

  runPresetGroup(
    'Tier 2 practice, unscaled, Bo1 — the intended next challenge',
    OPPONENTS_BY_TIER[2], 0, CHARACTER_EFFECTIVE, BO1,
  );

  runPresetGroup(
    'Tier 2 practice, unscaled, Bo3 — long-match behavior',
    OPPONENTS_BY_TIER[2], 0, CHARACTER_EFFECTIVE, BO3,
  );

  runPresetGroup(
    'Tier 1 practice, +20 scaling, Bo1 — WITHOUT item boosts (base stats)',
    OPPONENTS_BY_TIER[1], 10, CHARACTER_BASE, BO1,
  );

  runServeSweep();
  runReturnSweep();
  runServeStyleShowcase();
  runGapCurve();

  print('');
  print('Simulation complete.');
}

main();
