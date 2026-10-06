/**
 * Character Simulation - Runs a specific player build against the game's real
 * opponent presets (practice tiers + Riverside Open) to diagnose balance.
 *
 * Run with: npm run build:node && node dist/src/test/analysis/characterSim.js
 *
 * Plays every match on MatchSimulator, the game's own engine, with ability and
 * archetype effects passed through as MatchOrchestrator builds them. Key
 * moments are excluded (they depend on live user choices).
 */

import type {
  MatchFormat,
  PlayerStats,
  PointAnalysisData,
  MatchStatistics as IMatchStatistics,
} from '../../types';
import type { Ability } from '../../types/game';
import { abilityEffects } from '../../core/EffectAggregator';
import { PlayerProfile } from '../../core/PlayerProfile';
import {
  OPPONENTS_BY_TIER,
  getScaledOpponentStats,
  getOpponentArchetypeProfile,
  type OpponentPreset,
} from '../../data/opponents';
import { riversideOpen } from '../../data/tournaments/riversideOpen';
import { print, printBanner, printHeader, printTable, fmtNum } from './formatters';
import { BO1, BO3, playMatch } from './simMatch';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';

// ─── Configuration ───────────────────────────────────────────

const N_MATCHES = Number(process.env.N ?? 200);

// The day-39 character, as shown on the stats screen.
// "Effective" = base stat + item boost (item boosts apply in matches).
const CHARACTER_EFFECTIVE: PlayerStats = {
  core: { serve: 72, forehand: 56, backhand: 45, return: 52, net: 41 },
  technical: { slice: 44, spin: 49, placement: 52 },
  physical: { speed: 53, stamina: 66, strength: 47 },
  mental: { focus: 57, anticipation: 42, tactics: 55 },
};

const CHARACTER_BASE: PlayerStats = {
  core: { serve: 64, forehand: 47, backhand: 37, return: 44, net: 41 },
  technical: { slice: 38, spin: 44, placement: 52 },
  physical: { speed: 47, stamina: 55, strength: 40 },
  mental: { focus: 45, anticipation: 42, tactics: 53 },
};

// ─── Match runner ───────────────────────────────────────────

interface RunResult {
  winner: 'player' | 'opponent';
  sets: Array<{ player: number; opponent: number }>;
  stats: IMatchStatistics;
  endFatigue: { player: number; opponent: number };
  points: PointAnalysisData[];
  // Direct tallies (independent of MatchStatistics attribution)
  serveWon: { player: number; opponent: number };
  serveTotal: { player: number; opponent: number };
}

function runMatch(
  player: PlayerProfile,
  opponent: PlayerProfile,
  playerEffects: Record<string, number>,
  opponentEffects: Record<string, number>,
  format: MatchFormat,
): RunResult {
  const m = playMatch(player, opponent, { format, playerEffects, opponentEffects });
  const serveWon = { player: 0, opponent: 0 };
  const serveTotal = { player: 0, opponent: 0 };
  for (const pt of m.points) {
    serveTotal[pt.server]++;
    if (pt.winner === pt.server) serveWon[pt.server]++;
  }
  return {
    winner: m.winner,
    sets: m.sets,
    stats: m.statistics,
    endFatigue: m.endFatigue,
    points: m.points,
    serveWon,
    serveTotal,
  };
}

// ─── Aggregation ─────────────────────────────────────────────

interface MatchupSummary {
  label: string;
  oppOvr: number;
  rates: Rates;
  gamesWon: number;
  gamesLost: number;
  bagelSetPct: number; // sets won 6-0 by player / total sets
  setsLostPct: number; // sets won by opponent / total sets
  pAces: number;
  pDf: number;
  pWinners: number;
  pUe: number;
  oAces: number;
  oWinners: number;
  oUe: number;
  avgRally: number;
  pHoldPct: number;
  oHoldPct: number;
  endFatigueP: number;
  endFatigueO: number;
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
  const rates = emptyRates();
  let gamesWon = 0,
    gamesLost = 0,
    bagels = 0,
    setsLost = 0,
    totalSets = 0;
  let pAces = 0,
    pDf = 0,
    pWinners = 0,
    pUe = 0,
    oAces = 0,
    oWinners = 0,
    oUe = 0,
    rally = 0;
  let pServeWon = 0,
    pServeTotal = 0,
    oServeWon = 0,
    oServeTotal = 0;
  let fatP = 0,
    fatO = 0;
  let oppOvr = 0;
  const scoreCounts = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const player = playerProfileFactory();
    const opponent = opponentProfileFactory();
    oppOvr = opponent.overallRating;
    const r = runMatch(player, opponent, playerEffects, opponentEffects, format);

    tallyMatch(r.points, format, rates);
    const scoreStr = r.sets.map((s) => `${s.player}-${s.opponent}`).join(' ');
    scoreCounts.set(scoreStr, (scoreCounts.get(scoreStr) ?? 0) + 1);
    for (const s of r.sets) {
      totalSets++;
      gamesWon += s.player;
      gamesLost += s.opponent;
      if (s.player === 6 && s.opponent === 0) bagels++;
      if (s.opponent > s.player) setsLost++;
    }
    pAces += r.stats.aces.player;
    pDf += r.stats.doubleFaults.player;
    pWinners += r.stats.winners.player;
    pUe += r.stats.unforcedErrors.player;
    oAces += r.stats.aces.opponent;
    oWinners += r.stats.winners.opponent;
    oUe += r.stats.unforcedErrors.opponent;
    rally += r.stats.averageRallyLength;
    // Serve-point win rates tallied directly in the match loop
    pServeWon += r.serveWon.player;
    pServeTotal += r.serveTotal.player;
    oServeWon += r.serveWon.opponent;
    oServeTotal += r.serveTotal.opponent;
    fatP += r.endFatigue.player;
    fatO += r.endFatigue.opponent;
  }

  const topScores = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([score, count]) => `${score} (${Math.round((100 * count) / n)}%)`)
    .join(', ');

  return {
    label,
    oppOvr,
    rates,
    gamesWon: gamesWon / n,
    gamesLost: gamesLost / n,
    bagelSetPct: totalSets ? (100 * bagels) / totalSets : 0,
    setsLostPct: totalSets ? (100 * setsLost) / totalSets : 0,
    pAces: pAces / n,
    pDf: pDf / n,
    pWinners: pWinners / n,
    pUe: pUe / n,
    oAces: oAces / n,
    oWinners: oWinners / n,
    oUe: oUe / n,
    avgRally: rally / n,
    pHoldPct: pServeTotal ? (100 * pServeWon) / pServeTotal : 0,
    oHoldPct: oServeTotal ? (100 * oServeWon) / oServeTotal : 0,
    endFatigueP: fatP / n,
    endFatigueO: fatO / n,
    topScores,
  };
}

function summaryRow(s: MatchupSummary): (string | number)[] {
  return [
    s.label,
    String(s.oppOvr),
    ...formatRates(s.rates),
    `${fmtNum(s.gamesWon, 1)}-${fmtNum(s.gamesLost, 1)}`,
    fmtNum(s.bagelSetPct, 0) + '%',
    fmtNum(s.setsLostPct, 1) + '%',
    fmtNum(s.pHoldPct, 0) + '/' + fmtNum(s.oHoldPct, 0),
    fmtNum(s.pAces, 1),
    fmtNum(s.pDf, 1),
    fmtNum(s.pWinners, 1),
    fmtNum(s.pUe, 1),
    fmtNum(s.oAces, 1),
    fmtNum(s.oWinners, 1),
    fmtNum(s.oUe, 1),
    fmtNum(s.avgRally, 1),
    `${fmtNum(s.endFatigueP, 0)}/${fmtNum(s.endFatigueO, 0)}`,
  ];
}

const SUMMARY_HEADER = [
  'Opponent',
  'OVR',
  ...RATE_HEADERS,
  'AvgGames',
  'Bagel%',
  'SetLoss%',
  'SrvPt% P/O',
  'P.Ace',
  'P.DF',
  'P.Wnr',
  'P.UE',
  'O.Ace',
  'O.Wnr',
  'O.UE',
  'Rally',
  'EndFat P/O',
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
  print(
    `  Character OVR: ${player.overallRating} │ tierWins boost: +${Math.min(tierWins * 2, 20)} │ format: Bo${format.bestOfSets} │ n=${N_MATCHES}/opponent`,
  );
  print('');

  const summaries: MatchupSummary[] = [];
  for (const preset of presets) {
    summaries.push(
      summarize(
        preset.name,
        () => makeCharacter(playerStats),
        opponentFromPreset(preset, tierWins),
        {}, // player: no ability/archetype effects (unknown build) — see note in output
        abilityEffects(preset.abilities),
        format,
        N_MATCHES,
      ),
    );
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
    summaries.push(
      summarize(
        `R${round.roundNumber} ${opp.name}`,
        () => makeCharacter(playerStats),
        opponentFromPreset(preset, 0),
        {},
        abilityEffects(preset.abilities),
        BO3,
        N_MATCHES,
      ),
    );
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
    summaries.push(
      summarize(
        `serve=${serve} (OVR ${ovr})`,
        () => makeCharacter(stats),
        opponentFromPreset(jake, 0),
        {},
        abilityEffects(jake.abilities),
        BO1,
        N_MATCHES,
      ),
    );
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
    summaries.push(
      summarize(
        `return=${ret} (OVR ${ovr})`,
        () => makeCharacter(stats),
        opponentFromPreset(jake, 0),
        {},
        abilityEffects(jake.abilities),
        BO1,
        N_MATCHES,
      ),
    );
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
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
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
    summaries.push(
      summarize(
        `${label} (OVR ${ovr})`,
        () => new PlayerProfile('p', label, stats),
        opponentFromPreset(jake, 0),
        {},
        abilityEffects(jake.abilities),
        BO1,
        N_MATCHES,
      ),
    );
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
        core: { serve: r, forehand: r, backhand: r, return: r, net: r },
        technical: { slice: r, spin: r, placement: r },
        physical: { speed: r, stamina: r, strength: r },
        mental: { focus: r, anticipation: r, tactics: r },
      });
      summaries.push(
        summarize(
          `50 vs ${50 + gap} (Bo${format.bestOfSets})`,
          () => new PlayerProfile('p', 'P', stats(50)),
          () => new PlayerProfile('o', 'O', stats(50 + gap)),
          {},
          {},
          format,
          N_MATCHES,
        ),
      );
    }
    printTable(SUMMARY_HEADER, summaries.map(summaryRow));
    print('');
  }
}

// ─── Main ────────────────────────────────────────────────────

function main(): void {
  printBanner('CHARACTER BALANCE SIMULATION (day-39 build)');

  print('  Player modeled WITHOUT abilities/archetype effects (build unknown) —');
  print("  real results should skew slightly further in the player's favor.");
  print('  Key moments excluded (user-choice dependent).');

  runPresetGroup(
    'Tier 1 practice, +20 win-scaling (10 wins), Bo1 — "still dominating" case',
    OPPONENTS_BY_TIER[1],
    10,
    CHARACTER_EFFECTIVE,
    BO1,
  );

  runPresetGroup(
    'Tier 1 practice, unscaled, Bo1 — reference',
    OPPONENTS_BY_TIER[1],
    0,
    CHARACTER_EFFECTIVE,
    BO1,
  );

  runRiverside(CHARACTER_EFFECTIVE);

  runPresetGroup(
    'Tier 2 practice, unscaled, Bo1 — the intended next challenge',
    OPPONENTS_BY_TIER[2],
    0,
    CHARACTER_EFFECTIVE,
    BO1,
  );

  runPresetGroup(
    'Tier 2 practice, unscaled, Bo3 — long-match behavior',
    OPPONENTS_BY_TIER[2],
    0,
    CHARACTER_EFFECTIVE,
    BO3,
  );

  runPresetGroup(
    'Tier 1 practice, +20 scaling, Bo1 — WITHOUT item boosts (base stats)',
    OPPONENTS_BY_TIER[1],
    10,
    CHARACTER_BASE,
    BO1,
  );

  runServeSweep();
  runReturnSweep();
  runServeStyleShowcase();
  runGapCurve();

  print('');
  print('Simulation complete.');
}

main();
