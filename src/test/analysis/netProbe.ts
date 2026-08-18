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
 * It also traces the full net sequence — approach, reply, net shot, reply,
 * net shot — which is where the net phase actually breaks down.
 *
 * Run: npm run build:node && node dist/src/test/analysis/netProbe.js
 * Env: N=40  L=60
 *
 * Two temporary seams were used to sweep the fixes, in ShotCalculator:
 *
 *   PSR      overrides RELATIVE_QUALITY_REQUIREMENTS for passing shots, in
 *            calculateQualityRequirements.
 *   NETPRESS lowers the quality bar at which a volley or overhead labels the
 *            incoming ball 'rushed', in calculateBallQuality — 'good' and
 *            'average' use those thresholds instead of 'high'.
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { aggregateArchetypeEffects } from '../../data/archetypeTree';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
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
  // the full net sequence, step by step
  seq: Map<string, number>;
  netShot1: Map<string, number>;
  reply2: Map<string, number>;
  netShot2: Map<string, number>;
  volleyQ: number[];
  reply2Q: number[];
  /** the player's baseline shots after the return — the moments an approach was possible */
  approachChances: number;
}

const newTally = (): Tally => ({
  points: 0, pastReturn: 0, arrived: 0, hit: 0, rallyShots: 0,
  volleys: 0, overheads: 0, approaches: 0, approachesIn: 0, afterApproach: new Map(),
  seq: new Map(), netShot1: new Map(), reply2: new Map(), netShot2: new Map(),
  volleyQ: [], reply2Q: [], approachChances: 0,
});

const bump = (m: Map<string, number>, k: string): void => { m.set(k, (m.get(k) ?? 0) + 1); };

const outcomeName = (o: PointType): string =>
  o === PointType.WINNER ? 'winner'
  : o === PointType.IN_PLAY ? 'in play'
  : o === PointType.FORCED_ERROR ? 'forced error'
  : o === PointType.UNFORCED_ERROR ? 'unforced error' : String(o);

/**
 * Walk the sequence after a successful approach:
 *   approach -> opponent reply -> net shot 1 -> opponent reply 2 -> net shot 2
 * This is the "two shots after" question: how often does a volley put the point
 * away, how often does it continue, and when it continues what comes back?
 */
function traceNetSequence(shots: ShotDetail[], role: 'server' | 'returner', t: Tally): void {
  const i = shots.findIndex(s => s.shooter === role && s.shotType.includes('approach') && s.outcome === PointType.IN_PLAY);
  if (i < 0) return;
  const reply = shots[i + 1];
  if (!reply) { bump(t.seq, '1. approach won the point outright'); return; }
  const kind = reply.shotType.includes('lob') ? 'lob' : reply.shotType.includes('passing') ? 'passing shot' : 'other reply';
  if (reply.outcome !== PointType.IN_PLAY) { bump(t.seq, `2. ${kind} missed`); return; }
  bump(t.seq, `3. ${kind} in play`);

  const net1 = shots[i + 2];
  if (!net1) { bump(t.netShot1, 'point ended before a net shot'); return; }
  const fam1 = isOverhead(net1.shotType) ? 'overhead' : isVolley(net1.shotType) ? 'volley' : 'baseline shot';
  bump(t.netShot1, `${fam1}: ${outcomeName(net1.outcome)}`);
  if (fam1 === 'volley') t.volleyQ.push(net1.quality);
  if (net1.outcome !== PointType.IN_PLAY) return;

  const r2 = shots[i + 3];
  if (!r2) { bump(t.reply2, 'point ended'); return; }
  bump(t.reply2, outcomeName(r2.outcome));
  if (r2.outcome !== PointType.IN_PLAY) return;
  t.reply2Q.push(r2.quality);

  const net2 = shots[i + 4];
  if (!net2) { bump(t.netShot2, 'point ended'); return; }
  const fam2 = isOverhead(net2.shotType) ? 'overhead' : isVolley(net2.shotType) ? 'volley' : 'baseline shot';
  bump(t.netShot2, `${fam2}: ${outcomeName(net2.outcome)}`);
}

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
  for (const s of mine) {
    if (s.shotType.includes('serve') || s.shotType.includes('return')) continue;
    if (isNetShot(s.shotType) || s.context.courtPosition === 'net') continue;
    t.approachChances++;
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
  traceNetSequence(shots, role, t);
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
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina, o.stats.physical.stamina);
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
    'volley%'.padStart(9), 'v+oh%'.padStart(8), 'appr%'.padStart(7), 'appr/chance'.padStart(12),
    'chances/rally'.padStart(14)].join(''));
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
      pct(t.volleys + t.overheads, t.rallyShots).padStart(8),
      pct(t.approaches, t.rallyShots).padStart(7),
      pct(t.approaches, t.approachChances).padStart(12),
      (t.approachChances / Math.max(1, t.pastReturn)).toFixed(2).padStart(14)].join(''));
  }

  const t3 = tallies.find(([n]) => n === 'net_downhill T3')?.[1];
  if (t3) {
    const show = (title: string, m: Map<string, number>): void => {
      const total = [...m.values()].reduce((a, b) => a + b, 0);
      console.log(`\n  ${title}  (n=${total})`);
      for (const [k, v] of [...m.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${k.padEnd(36)} ${pct(v, total).padStart(7)}`);
      }
    };
    const mean = (a: number[]): string => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-';
    console.log('\n── the net sequence, net_downhill T3 ──');
    show('step 1: opponent reply to the approach', t3.seq);
    show('step 2: the net player\'s first shot', t3.netShot1);
    show('step 3: opponent reply to that net shot', t3.reply2);
    show('step 4: the net player\'s second shot', t3.netShot2);
    console.log(`\n  mean volley quality: ${mean(t3.volleyQ)}   mean quality of the ball coming back: ${mean(t3.reply2Q)}`);
  }
  console.log('');
}

main();
