/**
 * The pre-currency training model, kept only as the harnesses' baseline.
 *
 * Before currency, an anchor session granted +1 to the anchor and +1 to one
 * support per clean rep, drawn from a pool themed to the shot. careerSim's
 * `today` system and allocationProbe's `training` strategy compare the
 * currency economy against this; the game no longer uses it.
 */

import type { StatBoosts } from '../../types/game';
import type { CoreStat } from '../../game/AnchorTrainingSystem';
import { random } from '../../core/random';

export type SupportStat = Exclude<keyof StatBoosts, CoreStat>;

/** Each pool holds 4 stats; each support appears in 2 or 3 pools. */
export const SUPPORT_POOLS: Record<CoreStat, SupportStat[]> = {
  serve: ['strength', 'placement', 'spin', 'focus'],
  forehand: ['spin', 'strength', 'slice', 'stamina'],
  backhand: ['placement', 'slice', 'anticipation', 'stamina'],
  return: ['anticipation', 'speed', 'focus', 'tactics'],
  net: ['speed', 'anticipation', 'tactics', 'placement'],
};

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A session's stat grants: +1 anchor, +1 per rep to supports drawn from the
 * pool, preferring stats the previous session did not hand out.
 */
export function legacyTrainingBoosts(
  core: CoreStat,
  reps: number,
  previous: StatBoosts | undefined,
): StatBoosts {
  const pool = SUPPORT_POOLS[core];
  const recent = new Set(Object.keys(previous ?? {}));
  const fresh = shuffle(pool.filter((s) => !recent.has(s)));
  const stale = shuffle(pool.filter((s) => recent.has(s)));
  const supports = [...fresh, ...stale].slice(0, Math.max(0, Math.min(pool.length, reps)));
  const boosts: StatBoosts = { [core]: 1 };
  for (const s of supports) boosts[s] = 1;
  return boosts;
}
