/**
 * Slice Probe — why is `slice` the weakest stat, and which lever moves it?
 *
 * `populationProbe` rules out the obvious explanation. Slice is not rare: it is
 * 10% of rally shots and 4.8% of the shot-quality budget, more exposure than
 * `net`, which measures higher. It is paid and it does not decide much.
 *
 * `shotCurve` locates the problem, and it is narrower than "the defensive slice
 * is a bad shot". Against a same-level opponent, across the whole 20-85 range:
 *
 *   shot              p(in)            p(win)
 *   defensive slice   69.4% -> 99.6%   0.9% -> 4.0%
 *   slice             67.9% -> 99.3%   1.9% -> 9.2%
 *   forehand          67.5% -> 95.1%   4.5% -> 19.9%
 *
 * Reliability is not the issue — the defensive slice gains as much in-play
 * probability as a forehand does. The issue is that it cannot convert any of
 * that into ENDING points: 3 points of winner probability across the entire
 * scale against the forehand's 15. And 73% of all slice usage is that shot, so
 * the stat's average outcome is "the ball comes back, from a losing position".
 *
 * Three candidate levers, measured here against the shipped config:
 *
 *   REQ    raise RELATIVE_QUALITY_REQUIREMENTS for the defensive slice off 0.25,
 *          so reliability stops saturating and the stat keeps buying something.
 *   FLOOR  lower MINIMUM_WINNER_THRESHOLDS for the defensive slice off 105, so a
 *          very good scramble can occasionally end the point. The audit put that
 *          floor there deliberately — at 44.6% winners the defensive slice was
 *          an expert's second-best point-ender — so this is the risky one.
 *   BAND   give slice a STAT_MODIFIER_BANDS entry, paying it on defensive shots
 *          and from a defensive court position. This is the only lever that pays
 *          the stat somewhere other than the shot that shares its name, and the
 *          only one that reads live context rather than shot family.
 *
 * Each cell is the same one-at-a-time design statInContext uses, with a
 * same-versus-same CONTROL so the noise floor is visible.
 *
 * Run: npm run build:node && node dist/src/test/analysis/sliceProbe.js
 * Env: N=800 (BO3 per cell)  BASE=50  BUMP=75
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import {
  MATCH_FATIGUE, RELATIVE_QUALITY_REQUIREMENTS, MINIMUM_WINNER_THRESHOLDS, STAT_MODIFIER_BANDS,
} from '../../config/shotThresholds';
import { aggregateArchetypeEffects } from '../../data/archetypeTree';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

const profileOf = (phases: Partial<Record<GamePhase, PhaseSpec>>, broad: ArchetypeProfile['broad'] = null): ArchetypeProfile =>
  ({ broad, phases, specializationPoints: 0, respecTokens: 0 });

const NONE = profileOf({});
const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner');
/** The most slice a build can reach: fs_curveball carries the only forehand slice. */
const SLICER = profileOf({
  backhand: { path: 'bh_samurai', tier: 3 },
  first_serve: { path: 'fs_curveball', tier: 3 },
}, 'baseliner');

function uniform(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function withSlice(base: number, slice: number): PlayerStats {
  const s = uniform(base);
  s.technical.slice = slice;
  return s;
}

function calcFatigue(cur: number, rally: number, stam: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec = MATCH_FATIGUE.baseRecoveryPerPoint +
    (stam / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec));
}

function runMatch(p: PlayerProfile, o: PlayerProfile, eff: Record<string, number>): [number, number] {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  p.rollMatchForm(); o.rollMatchForm();
  const sim = new PointSimulator();
  const ms: MatchState = {
    score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
    momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0,
    isKeyMoment: false, fatigue: { player: 0, opponent: 0 },
  };
  let pts = 0, won = 0;
  while (!tracker.isComplete() && pts < 600) {
    const server = tracker.getCurrentServer();
    ms.isKeyMoment = tracker.isKeyMoment();
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, eff, eff);
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    if (w === 'player') won++;
    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
  return [won, pts];
}

function trial(prof: ArchetypeProfile, base: number, bump: number, n: number): number {
  const eff = aggregateArchetypeEffects(prof);
  let won = 0, tot = 0;
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    const [w, t] = runMatch(
      new PlayerProfile('p', 'P', withSlice(base, bump), prof),
      new PlayerProfile('o', 'O', uniform(base), prof), eff,
    );
    won += w; tot += t;
  }
  console.log = _origLog;
  return (won / tot) * 100 - 50;
}

// ─── Config levers ───────────────────────────────────────────

const DEF_SLICE = ['defensive_slice_forehand', 'defensive_slice_backhand'] as const;
const SHIPPED = {
  req: RELATIVE_QUALITY_REQUIREMENTS.defensive_slice_backhand,
  floor: MINIMUM_WINNER_THRESHOLDS.defensive_slice_backhand,
};

type Lever = { label: string; apply: () => void };

function restore(): void {
  for (const s of DEF_SLICE) {
    RELATIVE_QUALITY_REQUIREMENTS[s] = SHIPPED.req;
    MINIMUM_WINNER_THRESHOLDS[s] = SHIPPED.floor;
  }
  delete (STAT_MODIFIER_BANDS as unknown as Record<string, number>).sliceDefense;
}

const levers: Lever[] = [
  { label: 'shipped', apply: () => {} },
  { label: `REQ ${SHIPPED.req} -> 0.40`, apply: () => { for (const s of DEF_SLICE) RELATIVE_QUALITY_REQUIREMENTS[s] = 0.40; } },
  { label: `REQ ${SHIPPED.req} -> 0.55`, apply: () => { for (const s of DEF_SLICE) RELATIVE_QUALITY_REQUIREMENTS[s] = 0.55; } },
  { label: `FLOOR ${SHIPPED.floor} -> 85`, apply: () => { for (const s of DEF_SLICE) MINIMUM_WINNER_THRESHOLDS[s] = 85; } },
  { label: `FLOOR ${SHIPPED.floor} -> 70`, apply: () => { for (const s of DEF_SLICE) MINIMUM_WINNER_THRESHOLDS[s] = 70; } },
];

const f = (x: number): string => (x >= 0 ? '+' : '') + x.toFixed(2);

function main(): void {
  const N = Number(process.env.N ?? 800);
  const BASE = Number(process.env.BASE ?? 50);
  const BUMP = Number(process.env.BUMP ?? 75);

  console.log(`\n╔══ SLICE PROBE — which lever makes the slice stat pay? ══╗`);
  console.log(`\n   slice ${BASE} -> ${BUMP}, everything else uniform ${BASE}, ${N} BO3 per cell.`);
  console.log(`   Both players carry the same archetype, so only the stat differs.`);
  console.log(`   The BAND lever is not simulated here — it needs a code change in`);
  console.log(`   ShotCalculator, not just a constant. See the header.\n`);

  const builds: Array<[string, ArchetypeProfile]> = [
    ['no specialization', NONE],
    ['bh_samurai T3', SAMURAI],
    ['max slice build', SLICER],
  ];

  const head = ['lever'.padEnd(20), 'CONTROL'.padStart(10), ...builds.map(([n]) => n.slice(0, 16).padStart(18))].join('');
  console.log(head);
  console.log('-'.repeat(head.length));

  for (const lever of levers) {
    restore();
    lever.apply();
    const control = trial(NONE, BASE, BASE, N);
    const cells = builds.map(([, prof]) => trial(prof, BASE, BUMP, N));
    console.log([
      lever.label.padEnd(20),
      f(control).padStart(10),
      ...cells.map(c => f(c).padStart(18)),
    ].join(''));
  }
  restore();

  console.log('\nCONTROL is the same build on both sides at this lever setting — the noise');
  console.log('floor for its row. A lever earns its place by moving the build columns');
  console.log('further than the control column moves.\n');
}

main();
