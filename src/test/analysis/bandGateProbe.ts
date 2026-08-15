/**
 * Band Gate Probe — is the band channel actually reading context?
 *
 * The band channel's claim to exist, once `bonus` was folded into it, is that it
 * is the only mechanism that gates on LIVE MATCH CONTEXT rather than on shot
 * family. The composite tables are static per family; a band can ask whether the
 * ball arrived rushed, whether the shooter is scrambling, whether the opponent
 * has come forward.
 *
 * That is only a real difference if the gates are selective. A band whose gate is
 * open on nearly every shot is a composite weight with extra steps — it pays the
 * same stat the same way on the same shots, just multiplicatively. A band whose
 * gate is open on 3% of shots is expressing something the composite cannot, but
 * is also barely being paid.
 *
 * This measures, over the real build population, how often each band fires and
 * what it is worth when it does. Two columns matter:
 *
 *   OPEN%     share of rally shots where the gate is open
 *   CONTEXT%  share of THOSE openings that came from a live context flag rather
 *             than from the shot type alone
 *
 * A band with a high OPEN% and a zero CONTEXT% is not reading context at all.
 *
 * Every gate is now exact. `ShotDetail` carries `opponentPosition` and
 * `ballQuality`, which is what `reading` and `reactions` respectively gate on;
 * before those were recorded, both had to be reported as unmeasurable, and an
 * earlier version of this probe guessed at `reading` and got it wrong.
 *
 * Run: npm run build:node && node dist/src/test/analysis/bandGateProbe.js
 * Env: N=400 (BO3)  SEED=1  LO=25 HI=90  POINTS=6  MAX_TIER=3
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail, ShotType } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import {
  MATCH_FATIGUE, SHOT_CLASSIFICATIONS, STAT_MODIFIER_BANDS, NEUTRAL_STAT,
  isTacticalShot, isDefensiveShot, isOffensiveShot,
} from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects, profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree.js';
import { drawPlayerProfile } from './playerFactory.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;
const LEGACY: LegacyArchetype[] = ['aggressive', 'defensive', 'counterpuncher', 'serve_volley', 'all_court'];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniformStats(r: number): PlayerStats {
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

const inList = (list: readonly ShotType[], t: ShotType): boolean => list.includes(t);

/**
 * Each band, split into the part that depends only on the shot type and the part
 * that depends on live context. Mirrors calculatePhysicalModifier and
 * calculateMentalModifier — keep them in step.
 */
interface Gate {
  stat: string;
  band: string;
  size: number;
  byShot: (t: ShotType) => boolean;
  byContext: (s: ShotDetail) => boolean;
}

const GATES: Gate[] = [
  {
    stat: 'speed', band: 'courtCoverage', size: STAT_MODIFIER_BANDS.courtCoverage,
    byShot: t => inList(SHOT_CLASSIFICATIONS.defensiveShots, t),
    byContext: s => s.context?.courtPosition === 'defensive',
  },
  {
    stat: 'speed', band: 'reactions', size: STAT_MODIFIER_BANDS.reactions,
    byShot: t => inList(SHOT_CLASSIFICATIONS.netShots, t),
    byContext: s => s.ballQuality?.timeAvailable === 'rushed',
  },
  {
    stat: 'strength', band: 'power', size: STAT_MODIFIER_BANDS.power,
    byShot: t => inList(SHOT_CLASSIFICATIONS.powerShots, t),
    byContext: () => false,
  },
  {
    stat: 'anticipation', band: 'reading', size: STAT_MODIFIER_BANDS.reading,
    byShot: () => false,
    byContext: s => s.opponentPosition === 'at_net' || s.opponentPosition === 'well_positioned',
  },
  {
    stat: 'spin', band: 'touch', size: STAT_MODIFIER_BANDS.touch,
    byShot: t => isTacticalShot(t),
    byContext: () => false,
  },
  {
    stat: 'spin', band: 'shape', size: STAT_MODIFIER_BANDS.shape,
    byShot: t => inList(SHOT_CLASSIFICATIONS.spinShots, t),
    byContext: () => false,
  },
  {
    stat: 'placement', band: 'precision', size: STAT_MODIFIER_BANDS.precision,
    byShot: t => inList(SHOT_CLASSIFICATIONS.placementShots, t),
    byContext: () => false,
  },
  {
    stat: 'tactics', band: 'tactics', size: STAT_MODIFIER_BANDS.tactics,
    byShot: t => isDefensiveShot(t) || isOffensiveShot(t),
    byContext: () => false,
  },
];

interface Counts { open: number; contextOnly: number }

function main(): void {
  const N = Number(process.env.N ?? 400);
  const SEED = Number(process.env.SEED ?? 1);
  const LO = Number(process.env.LO ?? 25);
  const HI = Number(process.env.HI ?? 90);
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
  const opponentProf = (): ArchetypeProfile => profileForArchetype(LEGACY[Math.floor(rng() * LEGACY.length)]);

  const counts = new Map<string, Counts>();
  for (const g of GATES) counts.set(`${g.stat}.${g.band}`, { open: 0, contextOnly: 0 });
  let rallyShots = 0;

  console.log = () => {};
  for (let i = 0; i < N; i++) {
    const pProf = drawPlayerProfile(rng, POINTS, MAX_TIER);
    const oProf = opponentProf();
    const p = new PlayerProfile('p', 'P', drawStats(), pProf);
    const o = new PlayerProfile('o', 'O', drawStats(), oProf);
    const pEff = aggregateArchetypeEffects(pProf);
    const oEff = aggregateArchetypeEffects(oProf);

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
        server === 'player' ? o : p, ms, pEff, oEff);

      pr.shots.forEach((s: ShotDetail) => {
        const t = s.shotType;
        if (String(t).includes('serve') && !String(t).includes('volley')) return;
        rallyShots++;
        for (const g of GATES) {
          const byShot = g.byShot(t);
          const byCtx = g.byContext(s);
          if (!byShot && !byCtx) continue;
          const c = counts.get(`${g.stat}.${g.band}`)!;
          c.open++;
          if (!byShot && byCtx) c.contextOnly++;
        }
      });

      tracker.addPoint(pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player'));
      ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, p.stats.physical.stamina);
      ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, o.stats.physical.stamina);
      ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer(); ms.pointsPlayed = ++pts;
    }
  }
  console.log = _origLog;

  console.log(`\n╔══ BAND GATES — is the band channel reading context, or just shot type? ══╗`);
  console.log(`\n   ${N} pairings, real build population, ${rallyShots} rally shots.`);
  console.log(`   size: the band's half-width. value: quality points per +10 stat at rating 55,`);
  console.log(`   weighted by how often the gate is actually open.\n`);

  const head = ['stat.band'.padEnd(24), 'size'.padStart(7), 'OPEN%'.padStart(8),
    'CONTEXT%'.padStart(10), 'when open'.padStart(11), 'weighted'.padStart(10)].join('');
  console.log(head);
  console.log('-'.repeat(head.length));

  const rows = GATES.map(g => {
    const c = counts.get(`${g.stat}.${g.band}`)!;
    const open = c.open / rallyShots;
    const whenOpen = 55 * 0.2 * g.size;
    return { g, open, contextShare: c.open === 0 ? 0 : c.contextOnly / c.open, whenOpen, weighted: whenOpen * open };
  }).sort((a, b) => b.weighted - a.weighted);

  for (const r of rows) {
    console.log([
      `${r.g.stat}.${r.g.band}`.padEnd(24),
      r.g.size.toFixed(3).padStart(7),
      `${(r.open * 100).toFixed(1)}%`.padStart(8),
      `${(r.contextShare * 100).toFixed(1)}%`.padStart(10),
      r.whenOpen.toFixed(2).padStart(11),
      r.weighted.toFixed(3).padStart(10),
    ].join(''));
  }

  console.log(`\nNEUTRAL_STAT is ${NEUTRAL_STAT}, so every band is 1.0 for an average player and`);
  console.log('these are the deviations a build shape buys. CONTEXT% is the share of');
  console.log('openings that the composite tables could NOT have expressed, because they');
  console.log('came from match state rather than from which shot was played.\n');
}

main();
