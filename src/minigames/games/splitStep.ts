/**
 * Split-Step Sprint, the rules. Pure: no React, no clock, no randomness of its own.
 *
 * One rep: the player waits on the split step, an arrow names a direction, they
 * push it (Quickness: the reaction window), then a button lights at the cone they
 * ran to and they mash it until the meter fills (Power: presses against the clock).
 *
 * - Pushing any direction before the arrow is a false start: the rep is lost.
 * - The wrong direction, or none inside the window, loses the rep.
 * - Mashing the wrong button knocks a press off the meter, so hammering all four
 *   doesn't fill it.
 *
 * Times are seconds since the rep began. The window bonus (MINIGAME_WINDOW_BONUS)
 * lengthens both windows; the speed ramp shortens them.
 */

import type { Direction } from '../../utils/gameKeys';

export const SPRINT_DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];
export const MASH_BUTTONS = [1, 2, 3, 4] as const;
export type MashButton = (typeof MASH_BUTTONS)[number];

/** The split step: how long the player waits before the arrow, in seconds. */
export const CUE_DELAY = { min: 0.7, max: 1.6 };
/** Seconds to push the arrow's direction, at speed ×1. */
export const REACT_WINDOW = 1.2;
/** Presses that fill the meter. */
export const MASH_TARGET = 8;
/** Seconds to fill it, at speed ×1: under 3 presses a second, so a phone thumb keeps up. */
export const MASH_WINDOW = 2.8;

export interface RepPlan {
  cueAt: number;
  direction: Direction;
  button: MashButton;
  reactWindow: number;
  mashWindow: number;
}

/** Plan one rep from three rolls in [0, 1). */
export function planRep(rolls: [number, number, number], speed: number, windowBonus = 0): RepPlan {
  const [delay, dir, button] = rolls;
  const stretch = (1 + windowBonus) / speed;
  return {
    cueAt: CUE_DELAY.min + delay * (CUE_DELAY.max - CUE_DELAY.min),
    direction: SPRINT_DIRECTIONS[Math.floor(dir * SPRINT_DIRECTIONS.length)],
    button: MASH_BUTTONS[Math.floor(button * MASH_BUTTONS.length)],
    reactWindow: REACT_WINDOW * stretch,
    mashWindow: MASH_WINDOW * stretch,
  };
}

export type MissReason = 'early' | 'wrong_way' | 'too_slow' | 'out_of_time';

export type RepStage =
  | { kind: 'wait' }
  | { kind: 'react'; since: number }
  | { kind: 'mash'; since: number; presses: number }
  | { kind: 'passed' }
  | { kind: 'missed'; reason: MissReason };

export type RepEvent =
  | { type: 'tick'; t: number }
  | { type: 'direction'; t: number; direction: Direction }
  | { type: 'button'; t: number; button: MashButton };

/** The rep's next stage. A settled rep (passed or missed) ignores everything. */
export function stepRep(plan: RepPlan, stage: RepStage, event: RepEvent): RepStage {
  if (stage.kind === 'passed' || stage.kind === 'missed') return stage;

  if (stage.kind === 'wait') {
    if (event.type === 'direction') return { kind: 'missed', reason: 'early' };
    return event.t >= plan.cueAt ? { kind: 'react', since: plan.cueAt } : stage;
  }

  if (stage.kind === 'react') {
    if (event.t - stage.since > plan.reactWindow) return { kind: 'missed', reason: 'too_slow' };
    if (event.type !== 'direction') return stage;
    return event.direction === plan.direction
      ? { kind: 'mash', since: event.t, presses: 0 }
      : { kind: 'missed', reason: 'wrong_way' };
  }

  // Mashing.
  if (event.t - stage.since > plan.mashWindow) return { kind: 'missed', reason: 'out_of_time' };
  if (event.type !== 'button') return stage;
  const presses = Math.max(0, stage.presses + (event.button === plan.button ? 1 : -1));
  return presses >= MASH_TARGET ? { kind: 'passed' } : { ...stage, presses };
}
