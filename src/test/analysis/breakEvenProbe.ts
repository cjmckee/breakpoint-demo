/**
 * Break-Even Probe — tests the "rating tax" hypothesis.
 *
 * Raising a stat raises overallRating, which raises matchLevel (the average of
 * both players' ratings), which raises every quality threshold in the match.
 * So a stat pays off only if the quality it adds to the shots you actually hit
 * exceeds the threshold rise it inflicts on ALL your shots.
 *
 *   threshold rise (per +10 stat) = 10 × bucketWeight/5 / 2 × scale
 *     core      → 10 × 0.09 / 2 × 1.0 = +0.45
 *     technical → 10 × 0.03 / 2 × 1.0 = +0.15
 *   quality gain (per +10 stat)   = shotFrequency × primaryWeight × 10
 *
 * Break-even frequency: core ≈ 6%, technical ≈ 2.1%.
 *
 * Falsifiable prediction: `slice` is net-NEGATIVE for a player who never
 * slices (0.35% of shots) and clearly POSITIVE for a slice specialist
 * (~10% of shots) — same stat, same magnitude, opposite sign.
 *
 * Run: npm run build:node && node dist/src/test/analysis/breakEvenProbe.js
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types/index.js';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects } from '../../data/archetypeTree.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const N = 150;
const _origLog = console.log;

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, slice: r },
    technical: { volley: r, overhead: r, dropShot: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r, agility: r, recovery: r },
    mental: { focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r },
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

function runMatch(p: PlayerProfile, o: PlayerProfile, pe: Record<string, number>, oe: Record<string, number>): [number, number] {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  p.rollMatchForm(); o.rollMatchForm();
  const sim = new PointSimulator();
  const ms: MatchState = {
    score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
    momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0, isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };
  let pts = 0, won = 0;
  while (!tracker.isComplete() && pts < 600) {
    const server = tracker.getCurrentServer();
    ms.isKeyMoment = tracker.isKeyMoment();
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, pe, oe);
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    if (w === 'player') won++;
    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.recovery);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.recovery);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
  return [won, pts];
}

function trial(bucket: keyof PlayerStats, key: string, prof: ArchetypeProfile): number {
  const eff = aggregateArchetypeEffects(prof);
  let won = 0, tot = 0;
  console.log = () => {};
  for (let i = 0; i < N; i++) {
    const p = new PlayerProfile('p', 'P', bump(50, bucket, key, 90), prof);
    const o = new PlayerProfile('o', 'O', uniformStats(50), prof);
    const [w, t] = runMatch(p, o, eff, eff);
    won += w; tot += t;
  }
  console.log = _origLog;
  return (won / tot) * 100 - 50;
}

const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner');
const DOWNHILL = profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker');
const NONE = profileOf({});

function f(x: number): string { return (x >= 0 ? '+' : '') + x.toFixed(2); }

function main(): void {
  console.log(`\n╔══ BREAK-EVEN PROBE — point-win-% from taking one stat 50 → 90 (${N} BO3 each) ══╗\n`);
  const rows: Array<[string, string, number, string]> = [];

  rows.push(['slice (core)', 'never slices (0.3% of shots)', trial('core', 'slice', NONE), 'predict NEGATIVE']);
  rows.push(['slice (core)', 'slice specialist (~10% of shots)', trial('core', 'slice', SAMURAI), 'predict POSITIVE']);
  rows.push(['volley (technical)', 'unspecialized (1.3%)', trial('technical', 'volley', NONE), 'predict ~0 / negative']);
  rows.push(['volley (technical)', 'net specialist (2.0%)', trial('technical', 'volley', DOWNHILL), 'predict ~0']);
  rows.push(['return (core)', 'unspecialized (44%)', trial('core', 'return', NONE), 'control: far above break-even']);
  rows.push(['dropShot (technical)', 'unspecialized (0.15%)', trial('technical', 'dropShot', NONE), 'control: far below break-even']);

  const w = 20;
  console.log(['stat'.padEnd(w), 'context'.padEnd(34), 'Δ pt-win%'.padStart(10), '  expectation'].join(''));
  console.log('-'.repeat(w + 34 + 10 + 30));
  for (const [s, c, v, e] of rows) {
    console.log([s.padEnd(w), c.padEnd(34), f(v).padStart(10), '  ' + e].join(''));
  }
  console.log('\nIf the two slice rows have opposite signs, the rating tax is real:');
  console.log('the same +40 investment helps or hurts purely as a function of how');
  console.log('often the build actually hits that shot.\n');
}

main();
