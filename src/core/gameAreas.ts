/**
 * The areas of the game a player is rated on before a match: on serve, on return,
 * from the baseline, at the net, and covering the court.
 *
 * Each area is a blend of the stats the engine uses there, so every stat shows up
 * in the rating it actually pays into. Serve and return reuse the engine's own
 * composites. Baseline, net and coverage gather the groundstroke, volley and
 * defender weights (SHOT_COMPOSITE_WEIGHTS, OPPONENT_STAT_ADJUSTMENTS), plus
 * stamina (fatigue) and focus (pressure and momentum), which act across the match.
 *
 * Measured on random builds, each stat drawn independently against one flat opponent: the
 * five areas explain 88-89% of the spread in point-win between builds at levels 45
 * and 70, against 91-92% for all fourteen stats. The two service contests alone
 * explain 55-60%, so they can't stand in for the match. statLadder re-measures it
 * on every run, with both players random and specialties on (the "pre-match card" line).
 */

import type { PlayerStats, StatName } from '../types';
import {
  RETURN_COMPOSITE_WEIGHTS,
  SERVE_ACCURACY_WEIGHTS,
  SERVE_QUALITY_WEIGHTS,
} from '../config/shotThresholds';

export type GameArea = 'serve' | 'return' | 'baseline' | 'net' | 'coverage';

type Weights = Partial<Record<StatName, number>>;

/** Half how hurtful the first serve is, half how reliably it lands. */
function servingWeights(): Weights {
  const out: Weights = {};
  for (const w of [SERVE_QUALITY_WEIGHTS.serve_first, SERVE_ACCURACY_WEIGHTS.serve_first]) {
    for (const [stat, weight] of Object.entries(w) as Array<[StatName, number]>) {
      out[stat] = (out[stat] ?? 0) + weight / 2;
    }
  }
  return out;
}

/** Stat weights for each area. Each sums to 1, so a player with every stat at 60 rates 60. */
export const GAME_AREA_WEIGHTS: Record<GameArea, Weights> = {
  serve: servingWeights(),
  return: RETURN_COMPOSITE_WEIGHTS as Weights,
  // Groundstrokes off both wings with their spin and pace, the slice and placement
  // shots that come out of a rally, and tactics, which makes winners harder to hit.
  baseline: {
    forehand: 0.25,
    backhand: 0.25,
    spin: 0.1,
    strength: 0.1,
    slice: 0.1,
    placement: 0.1,
    tactics: 0.1,
  },
  // Approach, volley and overhead: net technique, reacting at the net, and putting
  // the ball away.
  net: { net: 0.6, speed: 0.15, anticipation: 0.1, placement: 0.1, strength: 0.05 },
  // Getting to the ball, and still getting there late in a long match. Weighting
  // stamina and focus here measured best: they act on every point.
  coverage: { speed: 0.3, anticipation: 0.2, stamina: 0.3, focus: 0.2 },
};

export const GAME_AREAS = Object.keys(GAME_AREA_WEIGHTS) as GameArea[];

function flatten(stats: PlayerStats): Record<StatName, number> {
  return { ...stats.core, ...stats.technical, ...stats.physical, ...stats.mental };
}

/** A player's rating in each area, 0-100, rounded. */
export function gameAreaRatings(stats: PlayerStats): Record<GameArea, number> {
  const flat = flatten(stats);
  const rate = (weights: Weights): number =>
    Math.round(
      (Object.entries(weights) as Array<[StatName, number]>).reduce(
        (sum, [stat, weight]) => sum + flat[stat] * weight,
        0,
      ),
    );
  return {
    serve: rate(GAME_AREA_WEIGHTS.serve),
    return: rate(GAME_AREA_WEIGHTS.return),
    baseline: rate(GAME_AREA_WEIGHTS.baseline),
    net: rate(GAME_AREA_WEIGHTS.net),
    coverage: rate(GAME_AREA_WEIGHTS.coverage),
  };
}
