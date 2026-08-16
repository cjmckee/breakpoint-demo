/**
 * Stat Sensitivity Audit — measures how much each of the 20 stats actually
 * moves match outcomes, to find candidates for consolidation or removal.
 *
 * Two independent methods, because each has a different blind spot:
 *
 *   PART A — one-at-a-time. Bump a single stat from 50 to 90, hold everything
 *   else at 50, play against an identical-profile uniform-50 opponent. Clean
 *   and controlled, but only measures the stat in one build context.
 *
 *   PART B — randomized population. Give every player independently random
 *   stats AND a random archetype, pair them at random, then regress the
 *   point-win margin on each stat difference. Because the stats are randomized
 *   independently, the univariate slope is an unbiased estimate of each stat's
 *   marginal value across the whole build space.
 *
 * Primary metric is POINT win rate, not match win rate — ~120 points per BO3
 * match makes it roughly 10x less noisy for the same runtime.
 *
 * Run with: npm run build:node && node dist/src/test/analysis/statSensitivity.js
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { aggregateArchetypeEffects, profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

const A_MATCHES = 40;   // per stat, per profile (Part A)
const B_MATCHES = 1400; // total randomized pairings (Part B)
const BASE = 50;
const BUMP = 90;

const _origLog = console.log;

// ─── Stat plumbing ───────────────────────────────────────────

const BUCKETS = ['core', 'technical', 'physical', 'mental'] as const;
type Bucket = typeof BUCKETS[number];

const STAT_KEYS: Array<{ bucket: Bucket; key: string }> = [
  ...(['serve', 'forehand', 'backhand', 'return', 'net'] as const).map(k => ({ bucket: 'core' as Bucket, key: k })),
  ...(['slice', 'spin', 'placement'] as const).map(k => ({ bucket: 'technical' as Bucket, key: k })),
  ...(['speed', 'stamina', 'strength'] as const).map(k => ({ bucket: 'physical' as Bucket, key: k })),
  ...(['focus', 'anticipation', 'tactics'] as const).map(k => ({ bucket: 'mental' as Bucket, key: k })),
];

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function withBump(base: number, bucket: Bucket, key: string, value: number): PlayerStats {
  const s = uniformStats(base);
  (s[bucket] as unknown as Record<string, number>)[key] = value;
  return s;
}

function flatten(s: PlayerStats): number[] {
  return STAT_KEYS.map(({ bucket, key }) => (s[bucket] as unknown as Record<string, number>)[key]);
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
  const recovery = MATCH_FATIGUE.baseRecoveryPerPoint +
    (rec / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - recovery));
}

/** Play one match; return [playerPointsWon, totalPoints, playerWonMatch]. */
function runMatch(
  player: PlayerProfile,
  opponent: PlayerProfile,
  pEff: Record<string, number>,
  oEff: Record<string, number>,
): [number, number, boolean] {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  player.rollMatchForm();
  opponent.rollMatchForm();
  const sim = new PointSimulator();

  const matchState: MatchState = {
    score: tracker.getScore(),
    currentServer: tracker.getCurrentServer(),
    courtSurface: 'hard',
    momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0,
    isKeyMoment: false, fatigue: { player: 0, opponent: 0 },
  };

  let points = 0;
  let playerPoints = 0;
  while (!tracker.isComplete() && points < 600) {
    const server = tracker.getCurrentServer();
    const serverProfile = server === 'player' ? player : opponent;
    const returnerProfile = server === 'player' ? opponent : player;
    matchState.isKeyMoment = tracker.isKeyMoment();

    const pr = sim.simulatePoint(server, serverProfile, returnerProfile, matchState, pEff, oEff);
    const winner = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    if (winner === 'player') playerPoints++;
    tracker.addPoint(winner);

    matchState.fatigue.player = calcFatigue(matchState.fatigue.player, pr.rallyLength, player.stats.physical.stamina, player.stats.physical.stamina);
    matchState.fatigue.opponent = calcFatigue(matchState.fatigue.opponent, pr.rallyLength, opponent.stats.physical.stamina, opponent.stats.physical.stamina);
    matchState.score = tracker.getScore();
    matchState.currentServer = tracker.getCurrentServer();
    matchState.pointsPlayed = ++points;
  }
  const setsWon = tracker.getScore().sets.filter(s => s.player > s.opponent).length;
  const setsLost = tracker.getScore().sets.filter(s => s.opponent > s.player).length;
  return [playerPoints, points, setsWon > setsLost];
}

// ─── Part A: one-at-a-time ───────────────────────────────────

const A_PROFILES: Array<{ label: string; profile: ArchetypeProfile }> = [
  { label: 'unspecialized', profile: profileOf({}) },
  { label: 'aggressive', profile: profileForArchetype('aggressive') },
  { label: 'counterpuncher', profile: profileForArchetype('counterpuncher') },
  { label: 'serve_volley', profile: profileForArchetype('serve_volley') },
];

interface ARow { bucket: Bucket; key: string; byProfile: number[]; mean: number }

function partA(): ARow[] {
  const rows: ARow[] = [];
  console.log = () => {};
  for (const { bucket, key } of STAT_KEYS) {
    const byProfile: number[] = [];
    for (const { profile } of A_PROFILES) {
      const eff = aggregateArchetypeEffects(profile);
      let pw = 0, tot = 0;
      for (let i = 0; i < A_MATCHES; i++) {
        const p = new PlayerProfile('p', 'P', withBump(BASE, bucket, key, BUMP), profile);
        const o = new PlayerProfile('o', 'O', uniformStats(BASE), profile);
        const [a, b] = runMatch(p, o, eff, eff);
        pw += a; tot += b;
      }
      byProfile.push((pw / tot) * 100 - 50);
    }
    rows.push({ bucket, key, byProfile, mean: byProfile.reduce((s, x) => s + x, 0) / byProfile.length });
  }
  console.log = _origLog;
  return rows;
}

/** Control run: uniform 50 vs uniform 50 should land on 0.00. */
function partAControl(): number {
  console.log = () => {};
  let pw = 0, tot = 0;
  for (let i = 0; i < A_MATCHES * 4; i++) {
    const p = new PlayerProfile('p', 'P', uniformStats(BASE), profileOf({}));
    const o = new PlayerProfile('o', 'O', uniformStats(BASE), profileOf({}));
    const [a, b] = runMatch(p, o, {}, {});
    pw += a; tot += b;
  }
  console.log = _origLog;
  return (pw / tot) * 100 - 50;
}

// ─── Part B: randomized population ───────────────────────────

const LEGACY: LegacyArchetype[] = ['aggressive', 'defensive', 'counterpuncher', 'serve_volley', 'all_court'];

function randomStats(): PlayerStats {
  const s = uniformStats(BASE);
  for (const { bucket, key } of STAT_KEYS) {
    (s[bucket] as unknown as Record<string, number>)[key] = 25 + Math.random() * 65; // U(25, 90)
  }
  return s;
}

function randomProfile(): ArchetypeProfile {
  // 1 in 6 players is unspecialized; the rest get a real authored identity.
  if (Math.random() < 1 / 6) return profileOf({});
  return profileForArchetype(LEGACY[Math.floor(Math.random() * LEGACY.length)]);
}

interface BRow { bucket: Bucket; key: string; slope: number; se: number }

function partB(): { rows: BRow[]; n: number } {
  const diffs: number[][] = [];
  const ys: number[] = [];
  console.log = () => {};
  for (let i = 0; i < B_MATCHES; i++) {
    const ps = randomStats(), os = randomStats();
    const pp = randomProfile(), op = randomProfile();
    const p = new PlayerProfile('p', 'P', ps, pp);
    const o = new PlayerProfile('o', 'O', os, op);
    const [won, tot] = runMatch(p, o, aggregateArchetypeEffects(pp), aggregateArchetypeEffects(op));
    if (tot === 0) continue;
    const pf = flatten(ps), of = flatten(os);
    diffs.push(pf.map((v, j) => v - of[j]));
    ys.push((won / tot) * 100 - 50);
  }
  console.log = _origLog;

  const n = ys.length;
  const rows: BRow[] = STAT_KEYS.map(({ bucket, key }, j) => {
    const xs = diffs.map(d => d[j]);
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    const my = ys.reduce((s, x) => s + x, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const slope = sxy / sxx;
    // residual SE of the slope
    let sse = 0;
    for (let i = 0; i < n; i++) { const pred = my + slope * (xs[i] - mx); sse += (ys[i] - pred) ** 2; }
    const se = Math.sqrt((sse / (n - 2)) / sxx);
    return { bucket, key, slope, se };
  });
  return { rows, n };
}

// ─── Report ──────────────────────────────────────────────────

function f(x: number, d = 2): string { return (x >= 0 ? '+' : '') + x.toFixed(d); }

function main(): void {
  console.log('\nRunning Part A (one-at-a-time)...');
  const control = partAControl();
  const a = partA();

  console.log('\n╔══ PART A: point-win-% gained by taking ONE stat from 50 → 90 ══╗');
  console.log(`   (control, uniform 50 v 50: ${f(control)} pts — that is the noise floor)\n`);
  const hdr = ['stat'.padEnd(14), 'bucket'.padEnd(10), ...A_PROFILES.map(p => p.label.padStart(15)), 'MEAN'.padStart(8)].join(' ');
  console.log(hdr);
  console.log('-'.repeat(hdr.length));
  for (const r of [...a].sort((x, y) => y.mean - x.mean)) {
    console.log([
      r.key.padEnd(14), r.bucket.padEnd(10),
      ...r.byProfile.map(v => f(v).padStart(15)),
      f(r.mean).padStart(8),
    ].join(' '));
  }

  console.log('\n\nRunning Part B (randomized population)...');
  const { rows: b, n } = partB();
  console.log(`\n╔══ PART B: marginal point-win-% per +10 stat, across ${n} randomized builds & playstyles ══╗\n`);
  const hdr2 = ['stat'.padEnd(14), 'bucket'.padEnd(10), 'per +10'.padStart(10), '95% CI'.padStart(18), 'verdict'.padStart(12)].join(' ');
  console.log(hdr2);
  console.log('-'.repeat(hdr2.length));
  for (const r of [...b].sort((x, y) => y.slope - x.slope)) {
    const s10 = r.slope * 10, ci = r.se * 10 * 1.96;
    const verdict = Math.abs(s10) < ci ? 'NOISE' : s10 > 0.8 ? 'strong' : s10 > 0.3 ? 'moderate' : 'weak';
    console.log([
      r.key.padEnd(14), r.bucket.padEnd(10), f(s10).padStart(10),
      `[${f(s10 - ci)}, ${f(s10 + ci)}]`.padStart(18), verdict.padStart(12),
    ].join(' '));
  }

  console.log('\n\n╔══ BUCKET TOTALS (Part B, sum of marginal effects per +10) ══╗\n');
  for (const bk of BUCKETS) {
    const sum = b.filter(r => r.bucket === bk).reduce((s, r) => s + r.slope * 10, 0);
    console.log(`  ${bk.padEnd(12)} ${f(sum).padStart(8)}`);
  }
}

main();
