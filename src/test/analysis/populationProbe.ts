/**
 * Population Probe — what is actually in the population the regressions measure?
 *
 * `statSensitivity` Part B and `statChannels` PART A both draw the same
 * population: every stat independently uniform, and an archetype drawn from the
 * five legacy profiles with one build in six left unspecialized. Every
 * conclusion either harness reaches is conditional on that draw containing the
 * situations the stats are for — and twice in this repo it did not, which is how
 * `netCoverage` came back as noise from a mechanism that works fine when its
 * gate is open.
 *
 * A stat can read zero for two completely different reasons:
 *
 *   the stat is weak                 -> it is paid often and does not decide much
 *   the population never triggers it -> it is barely paid at all
 *
 * The measured value cannot tell those apart. This can. It reports, over the
 * drawn population, how much of the shot-quality budget each stat is paid and
 * how often the behaviours that pay it actually happen — so a zero can be read
 * as "weak" or "absent" rather than guessed at.
 *
 * Run: npm run build:node && node dist/src/test/analysis/populationProbe.js
 * Env: N=600 (BO3)  SEED=1  LO=25 HI=90 (matching statChannels)
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types/index.js';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype.js';
import { PlayerProfile, getShotStatWeights } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MATCH_FATIGUE } from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects, profileForArchetype, PATHS_BY_PHASE, type LegacyArchetype } from '../../data/archetypeTree.js';
import { drawPlayerProfile } from './playerFactory.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

const STAT_ORDER = [
  'serve', 'forehand', 'backhand', 'return', 'net',
  'slice', 'spin', 'placement',
  'speed', 'stamina', 'strength',
  'focus', 'anticipation', 'tactics',
] as const;

const LEGACY: LegacyArchetype[] = ['aggressive', 'defensive', 'counterpuncher', 'serve_volley', 'all_court'];

/** The net phase each legacy archetype buys — the thing that decides net frequency. */
const NET_PATH: Record<string, string> = {
  aggressive: 'net_opportunist T1',
  defensive: 'net_apologist T1  (net-AVERSE)',
  counterpuncher: 'net_apologist T1  (net-AVERSE)',
  serve_volley: 'net_downhill T2',
  all_court: 'net_opportunist T1',
  unspecialized: 'none',
};

/** Which archetype buys a slice preference — the thing that decides slice frequency. */
const SLICE_PATH: Record<string, string> = {
  aggressive: '—',
  defensive: '—',
  counterpuncher: 'bh_samurai T2',
  serve_volley: '—',
  all_court: '—',
  unspecialized: '—',
};

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function profileOf(phases: Partial<Record<GamePhase, PhaseSpec>>): ArchetypeProfile {
  return { broad: null, phases, specializationPoints: 0, respecTokens: 0 };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

interface Tally {
  weight: Map<string, number>;
  rallyShots: number;
  sliceFamily: number;
  defensiveSlice: number;
  netFamily: number;
  points: number;
  /** points in which EITHER player struck a shot from the net */
  netPoints: number;
  /** rally shots hit against an opponent who was standing at the net */
  shotsVsNetman: number;
  byArchetype: Map<string, { rallies: number; arrived: number }>;
}

const newTally = (): Tally => ({
  weight: new Map(), rallyShots: 0, sliceFamily: 0, defensiveSlice: 0, netFamily: 0,
  points: 0, netPoints: 0, shotsVsNetman: 0, byArchetype: new Map(),
});

function isSliceFamily(t: string): boolean { return t.includes('slice'); }
function isNetFamily(t: string): boolean {
  return t.includes('volley') || t.includes('overhead');
}

function runMatch(
  p: PlayerProfile, o: PlayerProfile, pName: string, oName: string,
  pEff: Record<string, number>, oEff: Record<string, number>, t: Tally,
): void {
  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
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
      server === 'player' ? o : p, ms, pEff, oEff);

    t.points++;
    const playerRole = server === 'player' ? 'server' : 'returner';
    let anyoneAtNet = false;
    const arrived = { server: false, returner: false };

    // Arrival index per player, so "hit against a netman" can mean what it says:
    // a shot struck AFTER the opponent had already reached the net.
    const arrivedAt: Record<string, number> = {};
    pr.shots.forEach((s: ShotDetail, i: number) => {
      if (s.context?.courtPosition === 'net' && arrivedAt[s.shooter] === undefined) {
        arrivedAt[s.shooter] = i;
      }
    });

    pr.shots.forEach((s: ShotDetail, i: number) => {
      const type = String(s.shotType);
      // Exposure covers every shot the player hit, serves included — `serve`,
      // `focus` and `tactics` are paid through the serve composites and nowhere
      // else, so excluding serves would read them as zero.
      for (const [stat, w] of Object.entries(getShotStatWeights(s.shotType))) {
        t.weight.set(stat, (t.weight.get(stat) ?? 0) + w);
      }

      // The gate denominators are rally shots only, which is the scope the
      // conditional mechanisms are written against.
      if (type.includes('serve') && !type.includes('volley')) return;
      t.rallyShots++;
      if (isSliceFamily(type)) t.sliceFamily++;
      if (type.includes('defensive_slice')) t.defensiveSlice++;
      if (isNetFamily(type)) t.netFamily++;
      if (s.context?.courtPosition === 'net') {
        anyoneAtNet = true;
        arrived[s.shooter] = true;
      }
      const other = s.shooter === 'server' ? 'returner' : 'server';
      if (arrivedAt[other] !== undefined && arrivedAt[other] < i) t.shotsVsNetman++;
    });

    if (anyoneAtNet) t.netPoints++;

    for (const [name, role] of [[pName, playerRole], [oName, playerRole === 'server' ? 'returner' : 'server']] as const) {
      const e = t.byArchetype.get(name) ?? { rallies: 0, arrived: 0 };
      e.rallies++;
      if (arrived[role as 'server' | 'returner']) e.arrived++;
      t.byArchetype.set(name, e);
    }

    tracker.addPoint(pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player'));
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina);
    ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
  }
}

const pc = (a: number, b: number): string => `${(b === 0 ? 0 : (a / b) * 100).toFixed(1)}%`;

function main(): void {
  const N = Number(process.env.N ?? 600);
  const SEED = Number(process.env.SEED ?? 1);
  const LO = Number(process.env.LO ?? 25);
  const HI = Number(process.env.HI ?? 90);
  const MODE = process.env.POP ?? 'real';
  const POINTS = Number(process.env.POINTS ?? 6);
  const MAX_TIER = Number(process.env.MAX_TIER ?? 3) as 1 | 2 | 3;

  const rng = mulberry32(SEED);
  const drawStats = (): PlayerStats => {
    const s = uniformStats(50);
    for (const b of ['core', 'technical', 'physical', 'mental'] as const) {
      for (const k of Object.keys(s[b])) {
        (s[b] as unknown as Record<string, number>)[k] = LO + rng() * (HI - LO);
      }
    }
    return s;
  };
  const drawOpponent = (): [string, ArchetypeProfile] => {
    if (rng() < 1 / 6) return ['unspecialized', profileOf({})];
    const a = LEGACY[Math.floor(rng() * LEGACY.length)];
    return [a, profileForArchetype(a)];
  };
  const drawPlayer = (): [string, ArchetypeProfile] => ['player build', drawPlayerProfile(rng, POINTS, MAX_TIER)];

  // Which side of the net each build model represents. `presets` reproduces the
  // old symmetric draw for comparison against previously published numbers.
  const draw = MODE === 'presets'
    ? [drawOpponent, drawOpponent]
    : [drawPlayer, drawOpponent];

  console.log(`\n╔══ POPULATION PROBE — what the regression harnesses actually sample ══╗`);
  console.log(`\n   ${N} pairings, stats ~ U(${LO}, ${HI}), seed ${SEED}.`);
  console.log(MODE === 'presets'
    ? `   POP=presets: both sides drawn from the five authored opponent profiles.\n`
    : `   POP=real: player side spends ${POINTS} specialization points (max tier ${MAX_TIER});\n   opponent side drawn from the five authored profiles.\n`);

  const t = newTally();
  const pathHits = new Map<string, number>();
  const tierHits = new Map<number, number>();
  console.log = () => {};
  for (let i = 0; i < N; i++) {
    const [pn, pp] = draw[0]();
    const [on, op] = draw[1]();
    for (const [phase, spec] of Object.entries(pp.phases)) pathHits.set(spec.path, (pathHits.get(spec.path) ?? 0) + 1), tierHits.set(spec.tier, (tierHits.get(spec.tier) ?? 0) + 1), void phase;
    for (const [phase, spec] of Object.entries(op.phases)) pathHits.set(spec.path, (pathHits.get(spec.path) ?? 0) + 1), tierHits.set(spec.tier, (tierHits.get(spec.tier) ?? 0) + 1), void phase;
    runMatch(
      new PlayerProfile('p', 'P', drawStats(), pp), new PlayerProfile('o', 'O', drawStats(), op),
      pn, on, aggregateArchetypeEffects(pp), aggregateArchetypeEffects(op), t,
    );
  }
  console.log = _origLog;

  console.log('── who is in the population, and what net phase they bought ──\n');
  const head = ['archetype'.padEnd(16), 'share'.padStart(8), 'reaches net'.padStart(13), '  net phase'].join('');
  console.log(head);
  console.log('-'.repeat(head.length));
  const totalRallies = [...t.byArchetype.values()].reduce((a, e) => a + e.rallies, 0);
  for (const [name, e] of [...t.byArchetype.entries()].sort((a, b) => b[1].rallies - a[1].rallies)) {
    console.log([
      name.padEnd(16),
      pc(e.rallies, totalRallies).padStart(8),
      pc(e.arrived, e.rallies).padStart(13),
      `  ${NET_PATH[name] ?? '?'}`,
    ].join(''));
  }

  console.log('\n\n── specialty coverage: does the draw reach what the game contains? ──\n');
  const allPaths = Object.values(PATHS_BY_PHASE).flat().map(d => d.id);
  const unseen = allPaths.filter(id => !pathHits.has(id));
  console.log(`  paths reached      ${allPaths.length - unseen.length} of ${allPaths.length}`);
  if (unseen.length) console.log(`  NEVER SAMPLED      ${unseen.join(', ')}`);
  const tierTotal = [...tierHits.values()].reduce((a, b) => a + b, 0);
  console.log(`  specialties by tier  ` +
    [1, 2, 3].map(tr => `T${tr} ${pc(tierHits.get(tr) ?? 0, tierTotal)}`).join('   '));

  console.log('\n\n── how often the conditional gates are open ──\n');
  console.log(`  points where either player reached the net   ${pc(t.netPoints, t.points).padStart(8)}`);
  console.log(`  rally shots hit against a player at the net  ${pc(t.shotsVsNetman, t.rallyShots).padStart(8)}   <- netCoverage's gate`);
  console.log(`  rally shots from the net (volley/overhead)   ${pc(t.netFamily, t.rallyShots).padStart(8)}   <- the net stat's own shots`);
  console.log(`  rally shots in the slice family             ${pc(t.sliceFamily, t.rallyShots).padStart(8)}   <- the slice stat's own shots`);
  console.log(`    of which DEFENSIVE slice                  ${pc(t.defensiveSlice, t.sliceFamily).padStart(8)}   <- a shot hit while losing the point`);
  console.log('\n  slice preference sources:');
  for (const [name, path] of Object.entries(SLICE_PATH)) {
    if (path !== '—') console.log(`    opponent preset ${name} -> ${path}`);
  }
  console.log(MODE === 'presets'
    ? '    fs_curveball (the only SLICE_PREFERENCE_FOREHAND) is NEVER SAMPLED here'
    : '    player builds can also buy bh_samurai and fs_curveball at any tier');

  console.log('\n\n── share of the shot-quality budget, over the whole population ──\n');
  const total = [...t.weight.values()].reduce((a, b) => a + b, 0);
  console.log(['stat'.padEnd(14), 'exposure'.padStart(10)].join(''));
  console.log('-'.repeat(24));
  for (const stat of STAT_ORDER) {
    console.log([stat.padEnd(14), pc(t.weight.get(stat) ?? 0, total).padStart(10)].join(''));
  }
  console.log('\n`stamina` and `focus` correctly read 0: getShotStatWeights covers the quality');
  console.log('composites only, and those two are paid through fatigue, pressure and momentum.');
  console.log('focus is also in SERVE_ACCURACY_WEIGHTS, which sets whether the serve lands');
  console.log('rather than how hard it is, and is not part of this budget either.\n');
  console.log('Read a low measured value against its exposure here. Low exposure and low');
  console.log('value means the population never asked the question; high exposure and low');
  console.log('value means the stat was asked and did not matter.\n');
}

main();
