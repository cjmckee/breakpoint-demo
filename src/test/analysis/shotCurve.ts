/**
 * Shot Curve — does each shot type scale across the 0-100 stat range?
 *
 * serveCurve showed the first serve is flat below OVR ~40 because its midpoint
 * is a fixed proportion of overall rating while finalAdjustment climbs from
 * 0.71 to a hard cap of 1.0. This runs the same measurement for every rally
 * shot family.
 *
 * Method: a uniform-L shooter faces an incoming ball of quality L — i.e. an
 * opponent of the same level — and we record the quality produced, the
 * midpoints it is measured against, and the resulting outcome probabilities.
 * A shot that "scales" should get more reliable and more dangerous as L rises.
 *
 * Run: npm run build:node && node dist/src/test/analysis/shotCurve.js
 * Env: LEVELS=20,40,70  SHOTS=forehand,volley_forehand  N=1500
 *
 * MOD_COMPRESS was a third temporary seam, placed just before the
 * TOTAL_MODIFIER_CAPS clamp in calculateModifiers:
 *
 *   const compress = Number(process.env?.MOD_COMPRESS ?? 1);
 *   if (compress !== 1) finalAdjustment = 1 + (finalAdjustment - 1) * compress;
 *
 * It pulls the whole modifier stack toward 1.0, approximating narrower
 * per-modifier ranges without editing each function. At 0.35 the return goes
 * from flat (47.9% in-play at L=20, 47.8% at L=50) to monotonic (55.2% to
 * 71.0%). It does NOT fix the winner inversion, which lives in the product
 * RELATIVE_QUALITY_REQUIREMENTS x OUTCOME_MULTIPLIERS.winner.
 */

import type { PlayerStats, ShotContext, ShotDetail, ShotType } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { ShotCalculator } from '../../core/ShotCalculator.js';
import {
  PROBABILITY_STEEPNESS, sigmoidProbability, TOTAL_MODIFIER_CAPS,
} from '../../config/shotThresholds.js';

const NONE: ArchetypeProfile = { broad: null, phases: {}, specializationPoints: 0, respecTokens: 0 };
const _origLog = console.log;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, slice: r },
  technical: { volley: r, overhead: r, dropShot: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r, agility: r, recovery: r },
  mental: { focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r },
});

const CONTEXT: ShotContext = {
  difficulty: 'normal', pressure: 'low', courtPosition: 'baseline',
  rallyLength: 4, courtSurface: 'hard',
};

const SHOTS: ShotType[] = [
  'forehand', 'forehand_power', 'return_forehand', 'slice_backhand',
  'defensive_slice_forehand', 'volley_forehand', 'overhead', 'lob_forehand',
  'drop_shot_forehand', 'angle_shot_forehand', 'passing_shot_forehand',
  'forehand_approach',
];

function incoming(q: number): ShotDetail {
  return {
    shotType: 'forehand', shooter: 'server', success: true, quality: q,
    outcome: PointType.IN_PLAY, statUsed: 'forehand',
    modifiers: {} as ShotDetail['modifiers'], timestamp: 0, shotNumber: 3,
    context: CONTEXT,
  };
}

interface Row { adj: number; capped: number; quality: number; inPlay: number; winner: number; pIn: number; pWin: number; }

/**
 * @param L     the shooter's level
 * @param oppL  the opponent's level. Defaults to L (a same-level opponent, which
 *              is how a match at level L actually plays). Pin it to isolate the
 *              shooter's own scaling: the opponent's speed and defensive stats
 *              feed OPPONENT_STAT_ADJUSTMENTS, so letting them rise with L means
 *              the bar moves at the same time as the shot, and the curve shows
 *              the two effects netted against each other rather than either one.
 */
function measure(shot: ShotType, L: number, N: number, oppL: number): Row {
  const calc = new ShotCalculator();
  const p = new PlayerProfile('p', 'P', uniform(L), NONE);
  const o = new PlayerProfile('o', 'O', uniform(oppL), NONE);
  p.matchForm = 0; o.matchForm = 0;
  const cap = TOTAL_MODIFIER_CAPS.rally;

  let adj = 0, capped = 0, q = 0, mIn = 0, mWin = 0, pIn = 0, pWin = 0;
  console.log = () => {};
  for (let i = 0; i < N; i++) {
    const r = calc.calculateShotSuccess(p, shot, CONTEXT, o, 'well_positioned', incoming(oppL));
    adj += r.modifiers.finalAdjustment;
    if (r.modifiers.finalAdjustment >= cap - 1e-9) capped++;
    q += r.quality;
    const t = r.thresholds ?? { inPlay: 0, winner: 0, forcedError: 0 };
    mIn += t.inPlay; mWin += t.winner;
    pIn += sigmoidProbability(r.quality, t.inPlay, PROBABILITY_STEEPNESS.rally.inPlay);
    pWin += sigmoidProbability(r.quality, t.winner, PROBABILITY_STEEPNESS.rally.winner);
  }
  console.log = _origLog;
  return {
    adj: adj / N, capped: (capped / N) * 100, quality: q / N,
    inPlay: mIn / N, winner: mWin / N, pIn: (pIn / N) * 100, pWin: (pWin / N) * 100,
  };
}

function main(): void {
  const N = Number(process.env.N ?? 1200);
  const levels = (process.env.LEVELS ?? '20,30,40,50,60,70,85').split(',').map(Number);
  const shots = (process.env.SHOTS ? process.env.SHOTS.split(',') : SHOTS) as ShotType[];
  const oppFixed = process.env.OPP ? Number(process.env.OPP) : null;

  console.log(`\n╔══ SHOT CURVE — ${N} rolls/cell ══╗`);
  console.log(oppFixed === null
    ? '\nOpponent tracks the shooter (same-level match).'
    : `\nOpponent PINNED at level ${oppFixed}: incoming ball quality and the opponent's`
      + '\nspeed/defensive contribution to the bar are held constant, so the curve'
      + '\nshows the shooter\'s own scaling only.');
  console.log('\nquality: what the shooter produces | in/win: sigmoid midpoints they are measured against');
  console.log('margin = quality − inPlay midpoint. A shot that scales has a margin that grows with L.\n');

  for (const shot of shots) {
    console.log(`── ${shot} ──`);
    console.log(['L'.padStart(4), 'finalAdj'.padStart(10), 'capped%'.padStart(9), 'quality'.padStart(9),
      'inPlay'.padStart(8), 'margin'.padStart(8), 'p(in)'.padStart(8),
      'winner'.padStart(8), 'p(win)'.padStart(8)].join(''));
    for (const L of levels) {
      const r = measure(shot, L, N, oppFixed ?? L);
      const margin = r.quality - r.inPlay;
      console.log([String(L).padStart(4), r.adj.toFixed(3).padStart(10), r.capped.toFixed(0).padStart(9),
        r.quality.toFixed(1).padStart(9), r.inPlay.toFixed(1).padStart(8),
        ((margin >= 0 ? '+' : '') + margin.toFixed(1)).padStart(8),
        `${r.pIn.toFixed(1)}%`.padStart(8), r.winner.toFixed(1).padStart(8),
        `${r.pWin.toFixed(1)}%`.padStart(8)].join(''));
    }
    console.log('');
  }
}

main();
