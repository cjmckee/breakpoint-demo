/**
 * Net Probe — how often does a player actually end up at the net?
 *
 * Earlier net figures were "net-family shots as a share of all rally shots",
 * which buries the answer: returns alone are 44% of rally shots, so any net
 * number measured that way looks tiny. The question that matters for whether a
 * `net` stat can carry a core slot is: of the rallies that get past the return,
 * in how many does the player arrive at the net?
 *
 * Reports both, because they differ a lot and the gap is the actual problem:
 *
 *   ARRIVED  — the player got to the net (a successful approach, a serve-volley,
 *              or any shot hit from there). This is "ending up at the net".
 *   HIT      — the player struck at least one shot from the net. Lower than
 *              ARRIVED whenever the approach itself ended the point.
 *
 * Also splits the net stat's usage share with and without overheads counted, to
 * size what consolidating `overhead` into `volley` buys the merged stat.
 *
 * Run: npm run build:node && node dist/src/test/analysis/netProbe.js
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects } from '../../data/archetypeTree.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, slice: r },
  technical: { volley: r, overhead: r, dropShot: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r, agility: r, recovery: r },
  mental: { focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r },
});

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

const isVolley = (t: string): boolean => t.includes('volley');
const isOverhead = (t: string): boolean => t.includes('overhead');
const isNetShot = (t: string): boolean => isVolley(t) || isOverhead(t);

interface Tally {
  points: number;
  pastReturn: number;      // rallies that got beyond the return
  arrived: number;         // ...in which the player reached the net
  hit: number;             // ...in which the player struck a ball from the net
  rallyShots: number;
  volleys: number;
  overheads: number;
  approaches: number;
  approachesIn: number;
  // what happened on the ball after a successful approach
  afterApproach: Map<string, number>;
}

const newTally = (): Tally => ({
  points: 0, pastReturn: 0, arrived: 0, hit: 0, rallyShots: 0,
  volleys: 0, overheads: 0, approaches: 0, approachesIn: 0, afterApproach: new Map(),
});

function scorePoint(shots: ShotDetail[], role: 'server' | 'returner', t: Tally): void {
  const mine = shots.filter(s => s.shooter === role && s.outcome !== PointType.FAULT);
  const rally = shots.filter(s => s.outcome !== PointType.FAULT);
  t.points++;
  for (const s of mine) {
    if (s.shotType.includes('serve')) continue;
    t.rallyShots++;
    if (isVolley(s.shotType)) t.volleys++;
    if (isOverhead(s.shotType)) t.overheads++;
    if (s.shotType.includes('approach')) {
      t.approaches++;
      if (s.outcome === PointType.IN_PLAY) t.approachesIn++;
    }
  }
  if (rally.length < 3) return;   // never got past the return
  t.pastReturn++;

  const hitFromNet = mine.some(s => isNetShot(s.shotType) || s.context.courtPosition === 'net');
  const approachedIn = mine.some(s => s.shotType.includes('approach') && s.outcome === PointType.IN_PLAY);
  if (hitFromNet) t.hit++;
  if (hitFromNet || approachedIn) t.arrived++;

  // classify the ball after a successful approach
  const idx = shots.findIndex(s => s.shooter === role && s.shotType.includes('approach') && s.outcome === PointType.IN_PLAY);
  if (idx >= 0) {
    const reply = shots[idx + 1];
    const next = shots[idx + 2];
    let key: string;
    if (!reply) key = 'approach ended the point';
    else if (reply.outcome !== PointType.IN_PLAY) key = `opponent ${reply.shotType.includes('lob') ? 'lob' : 'reply'} missed`;
    else if (!next) key = 'point ended on the reply';
    else if (isOverhead(next.shotType)) key = 'overhead';
    else if (isVolley(next.shotType)) key = 'volley';
    else key = 'back at the baseline';
    t.afterApproach.set(key, (t.afterApproach.get(key) ?? 0) + 1);
  }
}

function runMatch(p: PlayerProfile, o: PlayerProfile, eff: Record<string, number>, oEff: Record<string, number>, t: Tally): void {
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
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, eff, oEff);
    scorePoint(pr.shots, server === 'player' ? 'server' : 'returner', t);
    const w = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    tracker.addPoint(w);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.recovery);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.recovery);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

const pct = (a: number, b: number): string => b === 0 ? '   -  ' : `${((a / b) * 100).toFixed(1)}%`;

function main(): void {
  const N = Number(process.env.N ?? 40);
  const L = Number(process.env.L ?? 60);

  const BUILDS: Array<[string, ArchetypeProfile]> = [
    ['no specialization', profileOf({})],
    ['broad net_attacker only', profileOf({}, 'net_attacker')],
    ['net_downhill T1', profileOf({ net: { path: 'net_downhill', tier: 1 } }, 'net_attacker')],
    ['net_downhill T3', profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker')],
    ['net_downhill T3 + fs_bomber T2', profileOf({ net: { path: 'net_downhill', tier: 3 }, first_serve: { path: 'fs_bomber', tier: 2 } }, 'net_attacker')],
    ['net_apologist T3 (net-averse)', profileOf({ net: { path: 'net_apologist', tier: 3 } }, 'baseliner')],
  ];

  console.log(`\n╔══ NET PROBE — uniform-${L} vs uniform-${L}, ${N} BO3 per build ══╗`);
  console.log('\nARRIVED / HIT are shares of rallies that got PAST THE RETURN.');
  console.log('The last two columns are shares of the player\'s rally shots.\n');
  console.log(['build'.padEnd(32), 'ARRIVED'.padStart(9), 'HIT'.padStart(8), 'appr in'.padStart(9),
    'volley%'.padStart(9), 'v+oh%'.padStart(8)].join(''));
  console.log('-'.repeat(76));

  const tallies: Array<[string, Tally]> = [];
  for (const [name, prof] of BUILDS) {
    const eff = aggregateArchetypeEffects(prof);
    const base = aggregateArchetypeEffects(profileOf({}));
    const t = newTally();
    console.log = () => {};
    for (let i = 0; i < N; i++) {
      runMatch(new PlayerProfile('p', 'P', uniform(L), prof), new PlayerProfile('o', 'O', uniform(L), profileOf({})), eff, base, t);
    }
    console.log = _origLog;
    tallies.push([name, t]);
    console.log([name.padEnd(32), pct(t.arrived, t.pastReturn).padStart(9), pct(t.hit, t.pastReturn).padStart(8),
      pct(t.approachesIn, t.approaches).padStart(9), pct(t.volleys, t.rallyShots).padStart(9),
      pct(t.volleys + t.overheads, t.rallyShots).padStart(8)].join(''));
  }

  console.log('\n── the ball after a successful approach (net_downhill T3) ──');
  const t3 = tallies.find(([n]) => n === 'net_downhill T3')?.[1];
  if (t3) {
    const total = [...t3.afterApproach.values()].reduce((a, b) => a + b, 0);
    for (const [k, v] of [...t3.afterApproach.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(34)} ${pct(v, total).padStart(7)}  (n=${v})`);
    }
    console.log(`  ${'total successful approaches'.padEnd(34)} ${String(total).padStart(7)}`);
  }
  console.log('');
}

main();
