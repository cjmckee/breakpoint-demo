/**
 * Shot Mix Probe — measures what shots each playstyle actually hits.
 *
 * Tallies raw `shotType` (NOT `statUsed`, which is unreliable on branches
 * predating the getPrimaryStatName fix) for the PLAYER only, so opponent
 * behavior never pollutes the mix. Also dumps annotated case-study rallies.
 *
 * Run with: npm run build:node && node dist/src/test/analysis/shotMixProbe.js
 * Env: N=60 (BO3 per build)  RATING=60 (uniform rating; use 35 for tier 1)
 */

import type { MatchFormat, MatchState, PlayerStats, ShotType, PointResult } from '../../types/index.js';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects } from '../../data/archetypeTree.js';

const N_MATCHES = Number(process.env.N ?? 60);
/** Uniform rating for both players. The shipped ladder is OVR 20-49, so pass
 *  RATING=35 to see the mix a tier-1 player actually hits. */
const RATING = Number(process.env.RATING ?? 60);
const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

const _origLog = console.log;

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function profile(phases: Partial<Record<GamePhase, PhaseSpec>>, broad: ArchetypeProfile['broad'] = null): ArchetypeProfile {
  return { broad, phases, specializationPoints: 0, respecTokens: 0 };
}

/** Families keyed the same way the proposal doc counts them. */
function family(shotType: ShotType): string {
  const s = String(shotType);
  if (s.includes('serve') && !s.includes('volley')) return 'serve';
  if (s.startsWith('return')) return 'return';
  if (s.includes('approach')) return 'approach (groundstroke)';
  if (s.includes('half_volley')) return 'half-volley';
  if (s.includes('volley')) return 'volley';
  if (s.includes('overhead')) return 'overhead';
  if (s.includes('defensive_slice')) return 'defensive slice';
  if (s.includes('slice')) return 'slice';
  if (s.includes('drop_shot')) return 'drop shot';
  if (s.includes('lob')) return 'lob';
  if (s.includes('passing')) return 'passing';
  if (s.includes('angle')) return 'angle';
  if (s.includes('power')) return 'groundstroke (power)';
  return 'groundstroke';
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

interface Tally {
  rallyShots: number;
  byFamily: Map<string, number>;
  byType: Map<string, number>;
  netPointsEntered: number;
  shotsWhileAtNet: number;
  points: number;
}

function newTally(): Tally {
  return { rallyShots: 0, byFamily: new Map(), byType: new Map(), netPointsEntered: 0, shotsWhileAtNet: 0, points: 0 };
}

function runMatch(
  player: PlayerProfile,
  opponent: PlayerProfile,
  pEff: Record<string, number>,
  oEff: Record<string, number>,
  tally: Tally,
  capture: PointResult[] | null,
): void {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  player.rollMatchForm();
  opponent.rollMatchForm();
  const sim = new PointSimulator();

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

  let points = 0;
  while (!tracker.isComplete() && points < 600) {
    const server = tracker.getCurrentServer();
    const serverProfile = server === 'player' ? player : opponent;
    const returnerProfile = server === 'player' ? opponent : player;
    matchState.isKeyMoment = tracker.isKeyMoment();

    const pr = sim.simulatePoint(server, serverProfile, returnerProfile, matchState, pEff, oEff);

    // The player is 'server' in the shot stream when the player is serving.
    const playerRole = server === 'player' ? 'server' : 'returner';
    tally.points++;
    let enteredNet = false;
    for (const shot of pr.shots) {
      if (shot.shooter !== playerRole) continue;
      const fam = family(shot.shotType);
      if (fam === 'serve') continue; // rally shots only, matching the doc
      tally.rallyShots++;
      tally.byFamily.set(fam, (tally.byFamily.get(fam) ?? 0) + 1);
      tally.byType.set(String(shot.shotType), (tally.byType.get(String(shot.shotType)) ?? 0) + 1);
      if (shot.context?.courtPosition === 'net') {
        tally.shotsWhileAtNet++;
        if (!enteredNet) { tally.netPointsEntered++; enteredNet = true; }
      }
    }
    if (capture && capture.length < 400) capture.push(pr);

    const winner = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    tracker.addPoint(winner);
    matchState.fatigue.player = calcFatigue(matchState.fatigue.player, pr.rallyLength, player.stats.physical.stamina, player.stats.physical.stamina);
    matchState.fatigue.opponent = calcFatigue(matchState.fatigue.opponent, pr.rallyLength, opponent.stats.physical.stamina, opponent.stats.physical.stamina);
    matchState.score = tracker.getScore();
    matchState.currentServer = tracker.getCurrentServer();
    matchState.pointsPlayed = ++points;
  }
}

function pct(n: number, d: number): string {
  return d === 0 ? '  0.00%' : `${((n / d) * 100).toFixed(2).padStart(6)}%`;
}

// ─── Builds under test ───────────────────────────────────────

const BUILDS: Array<{ label: string; profile: ArchetypeProfile }> = [
  { label: 'No specialization (doc baseline)', profile: profile({}) },
  { label: 'Broad net_attacker, NO phase points', profile: profile({}, 'net_attacker') },
  { label: 'net_downhill T1', profile: profile({ net: { path: 'net_downhill', tier: 1 } }, 'net_attacker') },
  { label: 'net_downhill T3', profile: profile({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker') },
  { label: 'net_downhill T3 + fs_bomber T2 (serve-volley)', profile: profile({ net: { path: 'net_downhill', tier: 3 }, first_serve: { path: 'fs_bomber', tier: 2 } }, 'net_attacker') },
  { label: 'net_apologist T3 (net-averse)', profile: profile({ net: { path: 'net_apologist', tier: 3 } }, 'baseliner') },
  { label: 'bh_samurai T3 (slice specialist)', profile: profile({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner') },
  { label: 'bh_samurai T3 + fh_survivor T3 (counterpuncher)', profile: profile({ backhand: { path: 'bh_samurai', tier: 3 }, forehand: { path: 'fh_survivor', tier: 3 } }, 'baseliner') },
];

const FAMILY_ORDER = [
  'return', 'groundstroke', 'groundstroke (power)', 'approach (groundstroke)',
  'slice', 'defensive slice', 'volley', 'half-volley', 'overhead',
  'lob', 'passing', 'angle', 'drop shot',
];

function main(): void {
  const results: Array<{ label: string; tally: Tally; effects: Record<string, number> }> = [];
  const caseStudies: Record<string, PointResult[]> = {};

  for (const build of BUILDS) {
    const tally = newTally();
    const pEff = aggregateArchetypeEffects(build.profile);
    const capture: PointResult[] = [];
    console.log = () => {};
    for (let i = 0; i < N_MATCHES; i++) {
      const player = new PlayerProfile('p', 'Player', uniformStats(RATING), build.profile);
      const opponent = new PlayerProfile('o', 'Opponent', uniformStats(RATING), profile({}));
      runMatch(player, opponent, pEff, {}, tally, capture);
    }
    console.log = _origLog;
    results.push({ label: build.label, tally, effects: pEff });
    caseStudies[build.label] = capture;
  }

  // ─── Table ───
  console.log(`\n╔══ SHOT MIX BY BUILD — player rally shots only, uniform-${RATING} vs uniform-${RATING}, hard, ${N_MATCHES} BO3 ══╗\n`);
  const header = ['family'.padEnd(24), ...results.map((_, i) => `B${i + 1}`.padStart(8))].join(' ');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const fam of FAMILY_ORDER) {
    const row = [fam.padEnd(24)];
    for (const r of results) row.push(pct(r.tally.byFamily.get(fam) ?? 0, r.tally.rallyShots).padStart(8));
    console.log(row.join(' '));
  }
  console.log('-'.repeat(header.length));
  const netRow = ['NET FAMILY (v+hv+oh)'.padEnd(24)];
  const approachRow = ['pts reaching net'.padEnd(24)];
  const nRow = ['n (rally shots)'.padEnd(24)];
  for (const r of results) {
    const t = r.tally;
    const net = (t.byFamily.get('volley') ?? 0) + (t.byFamily.get('half-volley') ?? 0) + (t.byFamily.get('overhead') ?? 0);
    netRow.push(pct(net, t.rallyShots).padStart(8));
    approachRow.push(pct(t.netPointsEntered, t.points).padStart(8));
    nRow.push(String(t.rallyShots).padStart(8));
  }
  console.log(netRow.join(' '));
  console.log(approachRow.join(' '));
  console.log(nRow.join(' '));

  console.log('\nLegend:');
  results.forEach((r, i) => {
    const eff = Object.entries(r.effects).map(([k, v]) => `${k}=${v}`).join(', ') || '(none)';
    console.log(`  B${i + 1}  ${r.label}\n       effects: ${eff}`);
  });

  // ─── Case studies: what happens after a net approach ───
  console.log('\n\n╔══ CASE STUDY: net points, net_downhill T3 ══╗\n');
  const dh = caseStudies['net_downhill T3'] ?? [];
  let shown = 0;
  for (const pr of dh) {
    const hasApproach = pr.shots.some(s => String(s.shotType).includes('approach'));
    if (!hasApproach || shown >= 6) continue;
    shown++;
    console.log(`\n--- point ${shown} (server: ${pr.server}, winner: ${pr.winner}, rally ${pr.rallyLength}) ---`);
    for (const s of pr.shots) {
      const pos = s.context?.courtPosition ?? '?';
      const q = s.quality.toFixed(0).padStart(3);
      console.log(
        `  ${String(s.shotNumber).padStart(2)}. [${s.shooter.padEnd(8)}] ${String(s.shotType).padEnd(26)} q=${q} pos=${String(pos).padEnd(15)} ${s.success ? '' : 'MISS '}${s.outcome}`
      );
    }
  }

  // ─── Case studies: slice specialist ───
  console.log('\n\n╔══ CASE STUDY: rallies with slice, bh_samurai T3 ══╗\n');
  const sam = caseStudies['bh_samurai T3 (slice specialist)'] ?? [];
  shown = 0;
  for (const pr of sam) {
    const hasSlice = pr.shots.some(s => String(s.shotType).includes('slice'));
    if (!hasSlice || shown >= 5) continue;
    shown++;
    console.log(`\n--- point ${shown} (server: ${pr.server}, winner: ${pr.winner}, rally ${pr.rallyLength}) ---`);
    for (const s of pr.shots) {
      const pos = s.context?.courtPosition ?? '?';
      const q = s.quality.toFixed(0).padStart(3);
      console.log(
        `  ${String(s.shotNumber).padStart(2)}. [${s.shooter.padEnd(8)}] ${String(s.shotType).padEnd(26)} q=${q} pos=${String(pos).padEnd(15)} ${s.success ? '' : 'MISS '}${s.outcome}`
      );
    }
  }

  // ─── What ends a net point? ───
  console.log('\n\n╔══ WHAT HAPPENS AFTER THE PLAYER APPROACHES (net_downhill T3) ══╗\n');
  let approaches = 0;
  const nextShotByOpp = new Map<string, number>();
  const playerNextAtNet = new Map<string, number>();
  for (const pr of dh) {
    for (let i = 0; i < pr.shots.length; i++) {
      const s = pr.shots[i];
      if (!String(s.shotType).includes('approach') || !s.success) continue;
      approaches++;
      const opp = pr.shots[i + 1];
      if (!opp) { nextShotByOpp.set('(approach ended point)', (nextShotByOpp.get('(approach ended point)') ?? 0) + 1); continue; }
      const k = family(opp.shotType) + (opp.success ? '' : ' [MISS]');
      nextShotByOpp.set(k, (nextShotByOpp.get(k) ?? 0) + 1);
      const mine = pr.shots[i + 2];
      const k2 = mine ? family(mine.shotType) : '(point ended)';
      playerNextAtNet.set(k2, (playerNextAtNet.get(k2) ?? 0) + 1);
    }
  }
  console.log(`successful approaches: ${approaches}\n`);
  console.log('opponent\'s reply to the approach:');
  for (const [k, v] of [...nextShotByOpp.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(30)} ${String(v).padStart(4)}  ${pct(v, approaches)}`);
  }
  console.log('\nplayer\'s NEXT shot at net (2 shots after approach):');
  for (const [k, v] of [...playerNextAtNet.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(30)} ${String(v).padStart(4)}  ${pct(v, approaches)}`);
  }
}

main();

// ─── Addendum: how do lobs fare against a net player? ────────
export function lobProbe(): void {
  const prof = profile({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker');
  const pEff = aggregateArchetypeEffects(prof);
  const capture: PointResult[] = [];
  const tally = newTally();
  console.log = () => {};
  for (let i = 0; i < 120; i++) {
    const player = new PlayerProfile('p', 'Player', uniformStats(RATING), prof);
    const opponent = new PlayerProfile('o', 'Opponent', uniformStats(RATING), profile({}));
    const cap: PointResult[] = [];
    runMatch(player, opponent, pEff, {}, tally, cap);
    capture.push(...cap);
  }
  console.log = _origLog;

  // Find every lob hit while the OTHER player was at net, bucket by lob quality.
  const buckets = new Map<string, { n: number; lobWon: number; nextShot: Map<string, number> }>();
  for (const pr of capture) {
    for (let i = 0; i < pr.shots.length; i++) {
      const s = pr.shots[i];
      if (!String(s.shotType).includes('lob') || !s.success) continue;
      const prev = pr.shots[i - 1];
      const wasVsNet = prev && prev.context?.courtPosition === 'net';
      const next = pr.shots[i + 1];
      const nextIsNet = next && next.context?.courtPosition === 'net';
      if (!wasVsNet && !nextIsNet) continue;
      const q = s.quality;
      const b = q < 45 ? 'weak   (q<45)' : q < 60 ? 'medium (45-60)' : q < 75 ? 'good   (60-75)' : 'great  (q>=75)';
      if (!buckets.has(b)) buckets.set(b, { n: 0, lobWon: 0, nextShot: new Map() });
      const e = buckets.get(b)!;
      e.n++;
      if (String(s.outcome) === 'winner') e.lobWon++;
      const k = next ? family(next.shotType) + (next.success ? '' : ' [MISS]') : '(point ended)';
      e.nextShot.set(k, (e.nextShot.get(k) ?? 0) + 1);
    }
  }

  console.log('\n\n╔══ LOBS HIT AT A NET PLAYER — outcome by lob quality ══╗\n');
  for (const key of ['weak   (q<45)', 'medium (45-60)', 'good   (60-75)', 'great  (q>=75)']) {
    const e = buckets.get(key);
    if (!e) continue;
    console.log(`${key}   n=${String(e.n).padStart(4)}   outright winner: ${pct(e.lobWon, e.n)}`);
    const top = [...e.nextShot.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`   net player's reply: ${top.map(([k, v]) => `${k} ${pct(v, e.n).trim()}`).join(' | ')}`);
  }
}

lobProbe();
