/**
 * Stat Exposure — how much of the shot-quality budget does each stat get paid?
 *
 * statSensitivity says what a stat is worth; it does not say why. This says why.
 * For every shot a player hits, `getShotStatWeights` gives the stats that set
 * its quality and the weight each carries. Summing those weights over a match
 * and normalising gives each stat's share of the total quality budget — the
 * stat's exposure.
 *
 * Exposure is the ceiling on sensitivity. A stat paid 1% of the budget cannot
 * measure like one paid 20%, no matter how the curves are tuned, and the fix for
 * a low number is different in each case:
 *
 *   low exposure, low value   -> the stat is rare. Change frequency or weights.
 *   high exposure, low value  -> the stat is paid but not decisive. Change curves.
 *
 * Only the composite channel is counted. Stats also act through the modifier
 * bands (STAT_MODIFIER_BANDS), the opponent/shooter threshold adjustments, and
 * systems outside shot quality entirely — fatigue for stamina, pressure for
 * focus. So a stat can matter while reading 0% here; `stamina` and `focus` are
 * the two that always will. The column is labelled `compOnly` as a reminder.
 *
 * Run: npm run build:node && node dist/src/test/analysis/statExposure.js
 * Env: N=30 (BO3 per build)  L=55
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile, getShotStatWeights } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { aggregateArchetypeEffects } from '../../data/archetypeTree';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

const STAT_ORDER = [
  'serve', 'forehand', 'backhand', 'return', 'net',
  'slice', 'spin', 'placement',
  'speed', 'stamina', 'strength',
  'focus', 'anticipation', 'tactics',
] as const;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

function profileOf(phases: Partial<Record<GamePhase, PhaseSpec>>, broad: ArchetypeProfile['broad'] = null): ArchetypeProfile {
  return { broad, phases, specializationPoints: 0, respecTokens: 0 };
}

function calcFatigue(cur: number, rally: number, stam: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec = MATCH_FATIGUE.baseRecoveryPerPoint + (stam / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec));
}

interface Tally {
  /** summed composite weight per stat */
  weight: Map<string, number>;
  /** shots on which the stat appears at all, for the "how often" column */
  shots: Map<string, number>;
  /** shots on which the stat is the single largest contributor */
  leads: Map<string, number>;
  totalShots: number;
}

const newTally = (): Tally => ({ weight: new Map(), shots: new Map(), leads: new Map(), totalShots: 0 });
const add = (m: Map<string, number>, k: string, v: number): void => { m.set(k, (m.get(k) ?? 0) + v); };

function scorePoint(shots: ShotDetail[], role: 'server' | 'returner', t: Tally): void {
  for (const s of shots) {
    if (s.shooter !== role) continue;
    // A fault still consumed a shot, and the serve stats are what produced it.
    const weights = getShotStatWeights(s.shotType);
    t.totalShots++;
    let best = '';
    let bestW = 0;
    for (const [stat, w] of Object.entries(weights)) {
      add(t.weight, stat, w);
      add(t.shots, stat, 1);
      if (w > bestW) { bestW = w; best = stat; }
    }
    if (best) add(t.leads, best, 1);
  }
}

function runMatch(p: PlayerProfile, o: PlayerProfile, eff: Record<string, number>, t: Tally): void {
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
    const pr = sim.simulatePoint(server, server === 'player' ? p : o, server === 'player' ? o : p, ms, eff, eff);
    scorePoint(pr.shots.filter(s => s.outcome !== PointType.FAULT || s.shotType.includes('serve')),
      server === 'player' ? 'server' : 'returner', t);
    tracker.addPoint(pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player'));
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

function measure(prof: ArchetypeProfile, level: number, n: number): Tally {
  const eff = aggregateArchetypeEffects(prof);
  const t = newTally();
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    runMatch(new PlayerProfile('p', 'P', uniform(level), prof),
      new PlayerProfile('o', 'O', uniform(level), prof), eff, t);
  }
  console.log = _origLog;
  return t;
}

const BUILDS: Array<[string, ArchetypeProfile]> = [
  ['no specialization', profileOf({})],
  ['net_downhill T3', profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker')],
  ['bh_samurai T3 (slice)', profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner')],
  ['fh_laserbeam T3', profileOf({ forehand: { path: 'fh_laserbeam', tier: 3 } }, 'baseliner')],
  ['fh_survivor T3 (def.)', profileOf({ forehand: { path: 'fh_survivor', tier: 3 } }, 'baseliner')],
];

function main(): void {
  const N = Number(process.env.N ?? 30);
  const L = Number(process.env.L ?? 55);

  console.log(`\n╔══ STAT EXPOSURE — share of the shot-quality budget, uniform ${L}, ${N} BO3 per build ══╗`);
  console.log('\nEach cell is the stat\'s summed composite weight as a share of all weight');
  console.log('the player spent. compOnly: the composite channel only — stamina and focus');
  console.log('act through fatigue and pressure and correctly read 0 here.\n');

  const tallies = BUILDS.map(([name, prof]) => [name, measure(prof, L, N)] as const);

  const head = ['stat'.padEnd(13), ...tallies.map(([n]) => n.slice(0, 13).padStart(15))].join('');
  console.log(head);
  console.log('-'.repeat(head.length));
  for (const stat of STAT_ORDER) {
    const cells = tallies.map(([, t]) => {
      const total = [...t.weight.values()].reduce((a, b) => a + b, 0);
      const w = t.weight.get(stat) ?? 0;
      return `${((w / total) * 100).toFixed(1)}%`.padStart(15);
    });
    console.log([stat.padEnd(13), ...cells].join(''));
  }

  console.log('\n\n── Share of shots where the stat is the LARGEST contributor ──\n');
  console.log(head);
  console.log('-'.repeat(head.length));
  for (const stat of STAT_ORDER) {
    const cells = tallies.map(([, t]) =>
      `${(((t.leads.get(stat) ?? 0) / t.totalShots) * 100).toFixed(1)}%`.padStart(15));
    console.log([stat.padEnd(13), ...cells].join(''));
  }
  console.log('');
}

main();
