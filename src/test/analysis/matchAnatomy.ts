/**
 * Match Anatomy — the standing before/after report for any simulation change.
 *
 * The other harnesses each answer one question. This one describes what a match
 * actually looks like, so a change can be checked against the whole picture
 * rather than against the metric it was aimed at. Run it before a change, run it
 * after, diff the two.
 *
 * Every rate is reported with its denominator spelled out, because most of the
 * disagreements in this repo have been denominator disagreements. "Players reach
 * the net 6% of the time" and "players reach the net 13% of the time" were both
 * true at once — of all points, and of rallies that got past the return.
 *
 * Sections:
 *   A  rally length — the distribution, not just the mean
 *   B  how points end
 *   C  shot mix, as a share of rally shots
 *   D  the net funnel, with every denominator
 *   E  the slice split
 *
 * Run: npm run build:node && node dist/src/test/analysis/matchAnatomy.js
 * Env: N=150 (BO3 per build)  L=45 (uniform rating)  BUILDS=all|baseline
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

const profileOf = (phases: Partial<Record<GamePhase, PhaseSpec>>, broad: ArchetypeProfile['broad'] = null): ArchetypeProfile =>
  ({ broad, phases, specializationPoints: 0, respecTokens: 0 });

const BUILDS: Array<[string, ArchetypeProfile]> = [
  ['no specialization', profileOf({})],
  ['net_attacker (broad)', profileOf({}, 'net_attacker')],
  ['net_downhill T3', profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker')],
  ['net_apologist T3', profileOf({ net: { path: 'net_apologist', tier: 3 } }, 'baseliner')],
  ['bh_samurai T3', profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner')],
];

function uniform(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
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

interface Anatomy {
  points: number;
  /** points where the returner got a ball back — the rally actually started */
  ralliesPastReturn: number;
  rallyLen: number[];
  endings: Map<string, number>;
  rallyShots: number;
  family: Map<string, number>;
  // net funnel, from the PLAYER's side only
  approachesHit: number;
  approachesIn: number;
  /** points where the player hit a shot FROM the net */
  arrivedPoints: number;
  arrivedPastReturn: number;
  /**
   * points where the player CAME FORWARD — an approach that landed, or a shot
   * struck from the net. Higher than `arrived`, because an approach that forces
   * the error ends the point before a net shot is ever hit, and "did they come
   * to the net" should count that.
   */
  cameForward: number;
  cameForwardPastReturn: number;
  netShots: number;
  netPointsWon: number;
  // slice
  sliceOffensive: number;
  sliceDefensive: number;
}

const newAnatomy = (): Anatomy => ({
  points: 0, ralliesPastReturn: 0, rallyLen: [], endings: new Map(), rallyShots: 0,
  family: new Map(), approachesHit: 0, approachesIn: 0, arrivedPoints: 0,
  arrivedPastReturn: 0, cameForward: 0, cameForwardPastReturn: 0,
  netShots: 0, netPointsWon: 0, sliceOffensive: 0, sliceDefensive: 0,
});

function family(t: string): string {
  if (t.includes('serve') && !t.includes('volley')) return 'serve';
  if (t.startsWith('return')) return 'return';
  if (t.includes('approach')) return 'approach';
  if (t.includes('half_volley')) return 'half-volley';
  if (t.includes('volley')) return 'volley';
  if (t.includes('overhead')) return 'overhead';
  if (t.includes('defensive_slice')) return 'defensive slice';
  if (t.includes('slice')) return 'slice';
  if (t.includes('drop_shot')) return 'drop shot';
  if (t.includes('lob')) return 'lob';
  if (t.includes('passing')) return 'passing';
  if (t.includes('angle')) return 'angle';
  if (t.includes('power')) return 'groundstroke (power)';
  return 'groundstroke';
}

function run(prof: ArchetypeProfile, level: number, n: number): Anatomy {
  const eff = aggregateArchetypeEffects(prof);
  const a = newAnatomy();
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    const p = new PlayerProfile('p', 'P', uniform(level), prof);
    const o = new PlayerProfile('o', 'O', uniform(level), prof);
    const tracker = new ScoreTracker(BO3);
    tracker.setInitialServer(i % 2 === 0 ? 'player' : 'opponent');
    p.rollMatchForm(); o.rollMatchForm();
    const sim = new PointSimulator();
    const ms: MatchState = {
      score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
      momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0,
      isKeyMoment: false, fatigue: { player: 0, opponent: 0 },
    };
    let pts = 0;
    while (!tracker.isComplete() && pts < 600) {
      const server = tracker.getCurrentServer();
      ms.isKeyMoment = tracker.isKeyMoment();
      const pr = sim.simulatePoint(server, server === 'player' ? p : o,
        server === 'player' ? o : p, ms, eff, eff);
      const winner = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
      const role = server === 'player' ? 'server' : 'returner';

      a.points++;
      a.rallyLen.push(pr.rallyLength);
      a.endings.set(pr.pointType, (a.endings.get(pr.pointType) ?? 0) + 1);
      const pastReturn = pr.rallyLength >= 3;
      if (pastReturn) a.ralliesPastReturn++;

      let arrived = false;
      let approachLanded = false;
      for (const s of pr.shots as ShotDetail[]) {
        if (s.shooter !== role) continue;
        const t = String(s.shotType);
        const fam = family(t);
        if (fam !== 'serve') {
          a.rallyShots++;
          a.family.set(fam, (a.family.get(fam) ?? 0) + 1);
          if (fam === 'slice') a.sliceOffensive++;
          if (fam === 'defensive slice') a.sliceDefensive++;
        }
        if (t.includes('approach')) {
          a.approachesHit++;
          if (s.outcome === PointType.IN_PLAY || s.outcome === PointType.WINNER) {
            a.approachesIn++;
            approachLanded = true;
          }
        }
        if (s.context?.courtPosition === 'net') {
          a.netShots++;
          arrived = true;
        }
      }
      if (arrived) {
        a.arrivedPoints++;
        if (pastReturn) a.arrivedPastReturn++;
        if (winner === 'player') a.netPointsWon++;
      }
      if (arrived || approachLanded) {
        a.cameForward++;
        if (pastReturn) a.cameForwardPastReturn++;
      }

      tracker.addPoint(winner);
      ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina);
      ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina);
      ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
    }
  }
  console.log = _origLog;
  return a;
}

const pc = (x: number, d: number): string => `${(d === 0 ? 0 : (x / d) * 100).toFixed(1)}%`;

function main(): void {
  const N = Number(process.env.N ?? 150);
  const L = Number(process.env.L ?? 45);

  console.log(`\n╔══ MATCH ANATOMY — uniform ${L} mirror matches, ${N} BO3 per build ══╗`);
  console.log('\nEvery rate names its denominator. Mirror matches, so both sides carry the');
  console.log('same build and only the player side is tallied.\n');

  const results = BUILDS.map(([name, prof]) => [name, run(prof, L, N)] as const);
  const cols = (label: string, f: (a: Anatomy) => string): void => {
    console.log([label.padEnd(34), ...results.map(([, a]) => f(a).padStart(15))].join(''));
  };
  const head = ['metric'.padEnd(34), ...results.map(([n]) => n.slice(0, 14).padStart(15))].join('');

  console.log('── A. rally length ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  cols('mean shots per point', a => (a.rallyLen.reduce((x, y) => x + y, 0) / a.points).toFixed(2));
  cols('median', a => String([...a.rallyLen].sort((x, y) => x - y)[Math.floor(a.rallyLen.length / 2)]));
  cols('% ending on serve (<=1)', a => pc(a.rallyLen.filter(r => r <= 1).length, a.points));
  cols('% ending on return (==2)', a => pc(a.rallyLen.filter(r => r === 2).length, a.points));
  cols('% past the return (>=3)', a => pc(a.ralliesPastReturn, a.points));
  cols('% reaching 6+ shots', a => pc(a.rallyLen.filter(r => r >= 6).length, a.points));
  cols('% reaching 10+ shots', a => pc(a.rallyLen.filter(r => r >= 10).length, a.points));

  console.log('\n── B. how points end (share of all points) ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  for (const k of [PointType.ACE, PointType.DOUBLE_FAULT, PointType.WINNER,
    PointType.FORCED_ERROR, PointType.UNFORCED_ERROR]) {
    cols(String(k), a => pc(a.endings.get(k) ?? 0, a.points));
  }

  console.log('\n── C. shot mix (share of the player\'s rally shots) ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  const fams = ['return', 'groundstroke', 'groundstroke (power)', 'approach', 'slice',
    'defensive slice', 'volley', 'half-volley', 'overhead', 'lob', 'passing', 'angle', 'drop shot'];
  for (const f of fams) cols(f, a => pc(a.family.get(f) ?? 0, a.rallyShots));

  console.log('\n── D. the net funnel ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  cols('approaches hit / rally shots', a => pc(a.approachesHit, a.rallyShots));
  cols('approaches that landed', a => pc(a.approachesIn, a.approachesHit));
  cols('CAME FORWARD / all points', a => pc(a.cameForward, a.points));
  cols('CAME FORWARD / past return', a => pc(a.cameForwardPastReturn, a.ralliesPastReturn));
  cols('  hit from net / all points', a => pc(a.arrivedPoints, a.points));
  cols('  hit from net / past return', a => pc(a.arrivedPastReturn, a.ralliesPastReturn));
  cols('net shots / rally shots', a => pc(a.netShots, a.rallyShots));
  cols('net points won', a => pc(a.netPointsWon, a.arrivedPoints));

  console.log('\n── E. the slice split (share of the player\'s rally shots) ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  cols('slice family, total', a => pc(a.sliceOffensive + a.sliceDefensive, a.rallyShots));
  cols('  offensive slice', a => pc(a.sliceOffensive, a.rallyShots));
  cols('  defensive slice', a => pc(a.sliceDefensive, a.rallyShots));
  cols('defensive share of slice', a => pc(a.sliceDefensive, a.sliceOffensive + a.sliceDefensive));
  console.log('');
}

main();
