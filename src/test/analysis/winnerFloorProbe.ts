/**
 * Winner Floor Probe — does MINIMUM_WINNER_THRESHOLDS still do its stated job?
 *
 * The floor exists to stop a weak shot becoming an instant winner against a very
 * weak incoming ball. The winner midpoint is `inPlayReq × WINNER_REQUIREMENTS`,
 * and `inPlayReq` is a fraction of incoming quality — so after a degraded rally,
 * with nothing else, the bar collapses toward zero and the next shot wins by
 * default.
 *
 * This sweeps incoming quality and reports, per shot: the relative winner
 * midpoint, the blended floor, which of the two binds, and the resulting winner
 * probability with and without the floor. The gap between those last two
 * columns is exactly what the floor is buying.
 *
 * Run: npm run build:node && node dist/src/test/analysis/winnerFloorProbe.js
 * Env: L=40 (shooter level)  OPP=30 (opponent level)
 */

import type { PlayerStats, ShotContext, ShotDetail, ShotType } from '../../types/index.js';
import { PointType } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { ShotCalculator } from '../../core/ShotCalculator.js';
import {
  RELATIVE_QUALITY_REQUIREMENTS, WINNER_REQUIREMENTS, MINIMUM_WINNER_THRESHOLDS,
  WINNER_FLOOR_OFFSET, WINNER_FLOOR_RETRIEVAL_WEIGHT, WINNER_FLOOR_RETRIEVAL_REF,
  MIN_QUALITY_FLOORS, FLOOR_CALIBRATION_LEVEL, OPPONENT_STAT_ADJUSTMENTS,
  SHOOTER_STAT_ADJUSTMENTS, POSITION_ADJUSTMENTS, SURFACE_EFFECTS,
  getShotCategory, PROBABILITY_STEEPNESS, sigmoidProbability,
} from '../../config/shotThresholds.js';

const NONE: ArchetypeProfile = { broad: null, phases: {}, specializationPoints: 0, respecTokens: 0 };
const _origLog = console.log;

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

const CONTEXT: ShotContext = {
  difficulty: 'normal', pressure: 'low', courtPosition: 'baseline',
  rallyLength: 6, courtSurface: 'hard',
};

function incoming(q: number): ShotDetail {
  return {
    shotType: 'slice_forehand', shooter: 'server', success: true, quality: q,
    outcome: PointType.IN_PLAY, statUsed: 'slice',
    modifiers: {} as ShotDetail['modifiers'], timestamp: 0, shotNumber: 5,
    context: CONTEXT,
  };
}

/** Mirror of calculateQualityRequirements, so both terms can be inspected. */
function thresholds(shot: ShotType, incomingQ: number, shooter: PlayerStats, opp: PlayerStats, matchLevel: number) {
  const surface = SURFACE_EFFECTS.hard;
  let inPlayReq = incomingQ * RELATIVE_QUALITY_REQUIREMENTS[shot];
  inPlayReq += (opp.mental.tactics - 50) * OPPONENT_STAT_ADJUSTMENTS.tactics * surface.defensiveAdjustmentMultiplier;
  inPlayReq += (opp.physical.speed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;
  inPlayReq -= (shooter.mental.anticipation - 50) * SHOOTER_STAT_ADJUSTMENTS.anticipation;
  inPlayReq += POSITION_ADJUSTMENTS['well_positioned'];
  inPlayReq = Math.max(inPlayReq, MIN_QUALITY_FLOORS[getShotCategory(shot)] * (matchLevel / FLOOR_CALIBRATION_LEVEL));

  const relative = inPlayReq * WINNER_REQUIREMENTS[shot];
  const retrieval = (opp.physical.speed + opp.mental.tactics) / 2;
  const scale = (1 - WINNER_FLOOR_RETRIEVAL_WEIGHT)
    + WINNER_FLOOR_RETRIEVAL_WEIGHT * (retrieval / WINNER_FLOOR_RETRIEVAL_REF);
  const floor = (MINIMUM_WINNER_THRESHOLDS[shot] + WINNER_FLOOR_OFFSET) * scale;
  return { inPlayReq, relative, floor };
}

function meanQuality(shot: ShotType, L: number, oppL: number, incomingQ: number, n: number): number {
  const calc = new ShotCalculator();
  const p = new PlayerProfile('p', 'P', uniform(L), NONE);
  const o = new PlayerProfile('o', 'O', uniform(oppL), NONE);
  p.matchForm = 0; o.matchForm = 0;
  let q = 0;
  console.log = () => {};
  for (let i = 0; i < n; i++) {
    q += calc.calculateShotSuccess(p, shot, CONTEXT, o, 'well_positioned', incoming(incomingQ)).quality;
  }
  console.log = _origLog;
  return q / n;
}

function main(): void {
  const L = Number(process.env.L ?? 40);
  const oppL = Number(process.env.OPP ?? 30);
  const N = Number(process.env.N ?? 400);
  const shooter = uniform(L), opp = uniform(oppL);
  const matchLevel = (L + oppL) / 2;
  const k = PROBABILITY_STEEPNESS.rally.winner;

  console.log(`\n╔══ WINNER FLOOR PROBE — shooter L=${L} vs opponent L=${oppL} ══╗`);
  console.log('\nSweeping the quality of the ball being hit AT the shooter. Low incoming');
  console.log('quality is the degraded-rally case the floor was added for.\n');

  const shots: ShotType[] = ['forehand', 'forehand_power', 'slice_backhand', 'defensive_slice_forehand', 'volley_forehand'];
  for (const shot of shots) {
    console.log(`── ${shot} ──`);
    console.log(['incoming'.padStart(9), 'quality'.padStart(9), 'relative'.padStart(10), 'floor'.padStart(8),
      'binds'.padStart(10), 'p(win)'.padStart(9), 'p(win) no floor'.padStart(17)].join(''));
    for (const iq of [5, 10, 15, 20, 30, 45, 60, 80]) {
      const t = thresholds(shot, iq, shooter, opp, matchLevel);
      const q = meanQuality(shot, L, oppL, iq, N);
      const withFloor = sigmoidProbability(q, Math.max(t.relative, t.floor), k) * 100;
      const without = sigmoidProbability(q, t.relative, k) * 100;
      console.log([String(iq).padStart(9), q.toFixed(1).padStart(9), t.relative.toFixed(1).padStart(10),
        t.floor.toFixed(1).padStart(8), (t.floor > t.relative ? 'FLOOR' : 'relative').padStart(10),
        `${withFloor.toFixed(1)}%`.padStart(9), `${without.toFixed(1)}%`.padStart(17)].join(''));
    }
    console.log('');
  }
}

main();
