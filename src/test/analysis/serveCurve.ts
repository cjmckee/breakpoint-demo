/**
 * Serve Curve — why first-serve-in% is flat across the low end of the scale.
 *
 * The serve-in roll is:
 *
 *   accuracy = getServeAccuracy(type) × finalAdjustment + U(±SERVE_VARIANCE) + matchForm
 *   midpoint = overallRating × (SERVE_BASELINE[type].inPlayThreshold / 70)
 *   p(in)    = sigmoid(accuracy, midpoint, PROBABILITY_STEEPNESS.serve.inPlay)
 *
 * For a uniform-L build both getServeAccuracy and overallRating equal L, so
 *
 *   margin = L × finalAdjustment − L × 0.886 = L × (finalAdjustment − 0.886)
 *
 * finalAdjustment is a product of modifiers that are each below 1 at low stats
 * and approach 1 near the top, and it is capped at 1.0 for serves
 * (TOTAL_MODIFIER_CAPS.serve). So as L rises, finalAdjustment rises but the
 * multiplier L rises with it, and the product barely moves until
 * finalAdjustment crosses 0.886 — at which point margin goes positive and
 * climbs fast. That crossover is the "threshold" in the flat curve.
 *
 * This probe measures finalAdjustment and the resulting margin per level.
 *
 * Run: npm run build:node && node dist/src/test/analysis/serveCurve.js
 */

import type { PlayerStats, ShotContext } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { ShotCalculator } from '../../core/ShotCalculator.js';
import { SERVE_BASELINE, PROBABILITY_STEEPNESS, sigmoidProbability } from '../../config/shotThresholds.js';

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
  rallyLength: 1, courtSurface: 'hard',
};

function main(): void {
  const N = Number(process.env.N ?? 4000);
  const calc = new ShotCalculator();

  for (const serveType of ['serve_first', 'serve_second'] as const) {
    const base = SERVE_BASELINE[serveType].inPlayThreshold;
    const ratio = base / 70;
    console.log(`\n── ${serveType}: midpoint = OVR × ${base}/70 = ${ratio.toFixed(3)} × OVR ──`);
    console.log(['L'.padStart(4), 'finalAdj'.padStart(10), 'accuracy'.padStart(10), 'midpoint'.padStart(10),
      'margin'.padStart(9), 'p(in)'.padStart(8)].join(''));
    console.log('-'.repeat(53));

    for (const L of [20, 25, 30, 40, 50, 60, 70, 80, 90]) {
      const p = new PlayerProfile('p', 'P', uniform(L), NONE);
      const o = new PlayerProfile('o', 'O', uniform(L), NONE);
      p.matchForm = 0; o.matchForm = 0;

      let adjSum = 0, accSum = 0, inSum = 0;
      console.log = () => {};
      for (let i = 0; i < N; i++) {
        const r = calc.calculateShotSuccess(p, serveType, CONTEXT, o, 'well_positioned');
        adjSum += r.modifiers.finalAdjustment;
        accSum += r.modifiers.serveAccuracy ?? 0;
        inSum += sigmoidProbability(r.modifiers.serveAccuracy ?? 0, r.thresholds?.inPlay ?? 0,
          PROBABILITY_STEEPNESS.serve.inPlay);
      }
      console.log = _origLog;

      const adj = adjSum / N, acc = accSum / N, mid = L * ratio;
      console.log([String(L).padStart(4), adj.toFixed(3).padStart(10), acc.toFixed(1).padStart(10),
        mid.toFixed(1).padStart(10), (acc - mid >= 0 ? '+' : '') + (acc - mid).toFixed(1).padStart(8),
        `${((inSum / N) * 100).toFixed(1)}%`.padStart(8)].join(''));
    }
    console.log(`\ncrossover: finalAdjustment must exceed ${ratio.toFixed(3)} for the margin to go positive`);
  }
  console.log('');
}

main();
