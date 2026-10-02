/**
 * Slice Anatomy — what does a better slice actually change inside a rally?
 *
 * sliceProbe measures the slice stat's value end to end and found it small at
 * tier 1, with no constant lever moving it. This looks inside the rally
 * instead. For every shot the player hits that lands in play, it follows the
 * opponent's reply and the end of the point, split by shot family and by the
 * player's slice rating. If slice quality reached the opponent, the reply
 * error rate after a slice would rise with the stat the way it does after a
 * forehand when forehand rises.
 *
 * Player: uniform BASE with slice at each of SLICES, slicer archetype at TIER.
 * Opponent: uniform BASE, no archetype.
 *
 * Run: npx tsx src/test/analysis/sliceAnatomy.ts
 * Env: N=400 (BO3 per row)  BASE=30  SLICES=30,50,70  TIER=1  FH=0 (also sweep forehand)
 *      PIN_OVR=1 holds the player's overallRating at uniform BASE (diagnostic)
 */

import type { MatchFormat, MatchState, PlayerStats, ShotDetail } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile, SpecialtyTier } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { aggregateArchetypeEffects } from '../../data/archetypeTree';
import { getQualityThresholds } from '../../utils/qualityThresholds';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const N = Number(process.env.N ?? 400);
const BASE = Number(process.env.BASE ?? 30);
const SLICES = (process.env.SLICES ?? '30,50,70').split(',').map(Number);
const TIER = Number(process.env.TIER ?? 1) as SpecialtyTier;
const PIN_OVR = process.env.PIN_OVR === '1';

const SLICER: ArchetypeProfile = {
  broad: 'baseliner',
  phases: {
    backhand: { path: 'bh_samurai', tier: TIER },
    first_serve: { path: 'fs_curveball', tier: TIER },
  },
  specializationPoints: 0,
  respecTokens: 0,
};
const NONE: ArchetypeProfile = {
  broad: null,
  phases: {},
  specializationPoints: 0,
  respecTokens: 0,
};

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

type Family = 'def. slice' | 'slice' | 'forehand' | 'backhand' | 'other';
const familyOf = (t: string): Family =>
  t.startsWith('defensive_slice')
    ? 'def. slice'
    : t.startsWith('slice')
      ? 'slice'
      : t === 'forehand' || t === 'forehand_power'
        ? 'forehand'
        : t === 'backhand' || t === 'backhand_power'
          ? 'backhand'
          : 'other';

interface Row {
  hit: number;
  inPlay: number;
  winners: number;
  qualitySum: number;
  aboveGood: number;
  replyErr: number;
  replyWinner: number;
  replyQualitySum: number;
  replies: number;
  pointWon: number;
  /** Shooter was in a defensive court position when it chose this shot. */
  fromBadSpot: number;
}
const zero = (): Row => ({
  hit: 0,
  inPlay: 0,
  winners: 0,
  qualitySum: 0,
  aboveGood: 0,
  replyErr: 0,
  replyWinner: 0,
  replyQualitySum: 0,
  replies: 0,
  pointWon: 0,
  fromBadSpot: 0,
});

function fatigue(cur: number, rally: number, stam: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  const gain = rally * MATCH_FATIGUE.basePerShot * sf;
  const rec =
    MATCH_FATIGUE.baseRecoveryPerPoint +
    (stam / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec));
}

interface PointSplit {
  withSlice: number;
  withSliceWon: number;
  without: number;
  withoutWon: number;
}

function run(playerStats: PlayerStats): {
  rows: Record<Family, Row>;
  pointWin: number;
  split: PointSplit;
} {
  const split: PointSplit = { withSlice: 0, withSliceWon: 0, without: 0, withoutWon: 0 };
  const rows = {
    'def. slice': zero(),
    slice: zero(),
    forehand: zero(),
    backhand: zero(),
    other: zero(),
  } as Record<Family, Row>;
  const pFx = aggregateArchetypeEffects(SLICER);
  let won = 0;
  let total = 0;
  for (let m = 0; m < N; m++) {
    const p = new PlayerProfile('p', 'P', playerStats, SLICER);
    if (PIN_OVR) {
      // Diagnostic: hold the player's rating at the uniform-BASE value, so the
      // stat being swept cannot move matchLevel or ace resistance.
      const pinned = new PlayerProfile('x', 'X', uniform(BASE), SLICER).overallRating;
      Object.defineProperty(p, 'overallRating', { get: () => pinned });
    }
    const o = new PlayerProfile('o', 'O', uniform(BASE), NONE);
    const good = getQualityThresholds((p.overallRating + o.overallRating) / 2).good;
    const tracker = new ScoreTracker(BO3);
    tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
    p.rollMatchForm();
    o.rollMatchForm();
    const sim = new PointSimulator();
    const ms: MatchState = {
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
    let pts = 0;
    while (!tracker.isComplete() && pts < 600) {
      const server = tracker.getCurrentServer();
      ms.isKeyMoment = tracker.isKeyMoment();
      const pr = sim.simulatePoint(
        server,
        server === 'player' ? p : o,
        server === 'player' ? o : p,
        ms,
        server === 'player' ? pFx : {},
        server === 'player' ? {} : pFx,
      );
      const w = pr.winner === 'server' ? server : server === 'player' ? 'opponent' : 'player';
      total++;
      if (w === 'player') won++;
      const playerRole = server === 'player' ? 'server' : 'returner';
      const shots: ShotDetail[] = pr.shots;
      const sliced = shots.some(
        (s) => s.shooter === playerRole && s.shotType.toString().includes('slice'),
      );
      if (sliced) {
        split.withSlice++;
        if (w === 'player') split.withSliceWon++;
      } else {
        split.without++;
        if (w === 'player') split.withoutWon++;
      }
      shots.forEach((shot, i) => {
        if (shot.shooter !== playerRole || shot.shotType.includes('serve')) return;
        const row = rows[familyOf(shot.shotType)];
        row.hit++;
        if (shot.context.courtPosition === 'defensive') row.fromBadSpot++;
        if (shot.outcome === PointType.WINNER) row.winners++;
        if (shot.outcome !== PointType.IN_PLAY) return;
        row.inPlay++;
        row.qualitySum += shot.quality;
        if (shot.quality >= good) row.aboveGood++;
        if (w === 'player') row.pointWon++;
        const reply = shots[i + 1];
        if (!reply) return;
        row.replies++;
        row.replyQualitySum += reply.quality;
        if (reply.outcome === PointType.FORCED_ERROR || reply.outcome === PointType.UNFORCED_ERROR)
          row.replyErr++;
        if (reply.outcome === PointType.WINNER) row.replyWinner++;
      });
      tracker.addPoint(w);
      ms.fatigue.player = fatigue(ms.fatigue.player, pr.rallyLength, BASE);
      ms.fatigue.opponent = fatigue(ms.fatigue.opponent, pr.rallyLength, BASE);
      ms.score = tracker.getScore();
      ms.currentServer = tracker.getCurrentServer();
      ms.pointsPlayed = ++pts;
    }
  }
  return { rows, pointWin: (won / total) * 100, split };
}

const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) : '-');

function main(): void {
  const sweeps: Array<[string, (v: number) => PlayerStats]> = [
    [
      'slice',
      (v) => {
        const s = uniform(BASE);
        s.technical.slice = v;
        return s;
      },
    ],
  ];
  if (process.env.FH === '1') {
    sweeps.push([
      'forehand',
      (v) => {
        const s = uniform(BASE);
        s.core.forehand = v;
        return s;
      },
    ]);
  }
  console.log(`sliceAnatomy  N=${N} BASE=${BASE} TIER=${TIER} PIN_OVR=${PIN_OVR}`);
  console.log(
    [
      'sweep',
      'value',
      'ptwin%',
      'family',
      'share%',
      'badSpot%',
      'in%',
      'winner%',
      'avgQ',
      '>=good%',
      'replyErr%',
      'replyWin%',
      'replyQ',
      'ptWon|in%',
    ].join('\t'),
  );
  for (const [name, build] of sweeps) {
    for (const v of SLICES) {
      const { rows, pointWin, split } = run(build(v));
      console.log(
        `${name} ${v}: points with a player slice ${pct(split.withSlice, split.withSlice + split.without)}% of points, ` +
          `won ${pct(split.withSliceWon, split.withSlice)}%; without ${pct(split.withoutWon, split.without)}%`,
      );
      const totalHit = Object.values(rows).reduce((a, r) => a + r.hit, 0);
      for (const fam of ['def. slice', 'slice', 'forehand', 'backhand'] as Family[]) {
        const r = rows[fam];
        console.log(
          [
            name,
            v,
            pointWin.toFixed(1),
            fam,
            pct(r.hit, totalHit),
            pct(r.fromBadSpot, r.hit),
            pct(r.inPlay + r.winners, r.hit),
            pct(r.winners, r.hit),
            r.inPlay ? (r.qualitySum / r.inPlay).toFixed(1) : '-',
            pct(r.aboveGood, r.inPlay),
            pct(r.replyErr, r.replies),
            pct(r.replyWinner, r.replies),
            r.replies ? (r.replyQualitySum / r.replies).toFixed(1) : '-',
            pct(r.pointWon, r.inPlay),
          ].join('\t'),
        );
      }
    }
  }
}

main();
