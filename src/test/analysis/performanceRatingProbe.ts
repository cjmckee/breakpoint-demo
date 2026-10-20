/**
 * Performance Rating Probe — how well the post-match grade tracks the match.
 *
 * Plays matches through MatchOrchestrator (the game's live-match engine, key
 * moments included, picked at random) between random builds across a wide
 * spread of level gaps, grades each one with MatchRewardSystem exactly as the
 * results screen does, and writes one JSON row per match.
 *
 * Run with: npx tsx src/test/analysis/performanceRatingProbe.ts
 *   N_MATCHES=2000   matches to play
 *   FORMAT=best-of-1 match format (the game's usual one)
 *   MAX_GAP=22       largest level gap between the players, either way
 *   OUT=path.jsonl   where the rows go (default: stdout summary only)
 */

import { writeFileSync } from 'node:fs';
import type { PlayerStats } from '../../types';
import { MatchOrchestrator } from '../../game/MatchOrchestrator';
import { MatchRewardSystem } from '../../game/MatchRewardSystem';
import { profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree';
import { gameAreaValues } from '../../core/gameAreas';
import { PERFORMANCE_AREAS } from '../../config/performanceScoring';

const N_MATCHES = Number(process.env.N_MATCHES ?? 400);
const FORMAT = (process.env.FORMAT ?? 'best-of-1') as 'best-of-1' | 'best-of-3';
const OUT = process.env.OUT;
/** Largest level gap between the two players, either way. */
const MAX_GAP = Number(process.env.MAX_GAP ?? 22);

const ARCHETYPES: LegacyArchetype[] = [
  'aggressive',
  'defensive',
  'counterpuncher',
  'serve_volley',
  'all_court',
];

const clamp = (v: number): number => Math.max(1, Math.min(99, Math.round(v)));
const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Every stat near `level`, each one off by up to ±spread. */
function randomStats(level: number, spread: number): PlayerStats {
  const s = (): number => clamp(level + (Math.random() * 2 - 1) * spread);
  return {
    core: { serve: s(), forehand: s(), backhand: s(), return: s(), net: s() },
    technical: { slice: s(), spin: s(), placement: s() },
    physical: { speed: s(), stamina: s(), strength: s() },
    mental: { focus: s(), anticipation: s(), tactics: s() },
  };
}

async function playOne(): Promise<Record<string, unknown>> {
  const level = 35 + Math.random() * 35;
  const gap = (Math.random() * 2 - 1) * MAX_GAP;
  const playerStats = randomStats(level, 15);
  const opponentStats = randomStats(level - gap, 15);
  const playerArch = pick(ARCHETYPES);
  const opponentArch = pick(ARCHETYPES);

  const orchestrator = new MatchOrchestrator();
  const final = await orchestrator.simulateInteractiveMatch({
    playerStats,
    opponentStats,
    playerArchetypeProfile: profileForArchetype(playerArch),
    opponentArchetypeProfile: profileForArchetype(opponentArch),
    surface: 'hard',
    mood: 0,
    energy: 100,
    enableKeyMoments: true,
    matchFormat: FORMAT,
    pointDelayMs: 0,
    onKeyMoment: async (km) => pick(km.options),
  });
  const stats = orchestrator.getMatchStatistics();
  if (!stats) throw new Error('no statistics');
  const won = final.winner === 'player';
  const rewards = MatchRewardSystem.calculateRewards(stats, 1, won);
  const p = rewards.performanceBreakdown;

  const games = final.sets.reduce(
    (acc, set) => ({ player: acc.player + set.player, opponent: acc.opponent + set.opponent }),
    { player: 0, opponent: 0 },
  );
  const pw = stats.totalPoints.player;
  const po = stats.totalPoints.opponent;
  const servePlayed =
    stats.pointsWon.player.serve + stats.pointsWon.opponent.return + stats.doubleFaults.player;
  const returnPlayed =
    stats.pointsWon.opponent.serve + stats.pointsWon.player.return + stats.doubleFaults.opponent;

  return {
    won,
    sets: final.sets.map((s) => `${s.player}-${s.opponent}`).join(' '),
    gamesFor: games.player,
    gamesAgainst: games.opponent,
    pointShare: pw / (pw + po),
    servePointShare: servePlayed ? stats.pointsWon.player.serve / servePlayed : null,
    returnPointShare: returnPlayed ? stats.pointsWon.player.return / returnPlayed : null,
    rallyShare: stats.rallyPointsPlayed.player
      ? stats.rallyPointsWon.player / stats.rallyPointsPlayed.player
      : null,
    netPlayed: stats.netPointsPlayed.player,
    netWon: stats.netPointsWon.player,
    longRallies: stats.longRallyPointsPlayed,
    longRalliesWon: stats.longRallyPointsWon.player,
    outplayed: stats.rallyPointsOutplayed.player,
    outplayedOpponent: stats.rallyPointsOutplayed.opponent,
    kmWon: stats.keyMomentsWon.player,
    kmLost: stats.keyMomentsWon.opponent,
    bpFor: stats.breakPointOpportunities.player,
    bpConv: stats.breakPointsConverted.player,
    bpFaced: stats.breakPointOpportunities.opponent,
    bpLost: stats.breakPointsConverted.opponent,
    totalPoints: pw + po,
    ...Object.fromEntries(PERFORMANCE_AREAS.map((a) => [a, p.areas[a]])),
    netWeight: p.weights.net,
    overall: p.overallScore,
    currency: rewards.currency,
    playerArch,
    opponentArch,
    level,
    gap,
    playerAreas: gameAreaValues(playerStats),
    opponentAreas: gameAreaValues(opponentStats),
  };
}

async function main(): Promise<void> {
  // The reward system and engine log every match; keep the output to the summary.
  const log = console.log;
  console.log = (): void => {};
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < N_MATCHES; i++) rows.push(await playOne());
  console.log = log;

  if (OUT) writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const wins = rows.filter((r) => r.won).length;
  console.log(`${rows.length} ${FORMAT} matches, ${wins} won${OUT ? `, rows in ${OUT}` : ''}`);
}

void main();
