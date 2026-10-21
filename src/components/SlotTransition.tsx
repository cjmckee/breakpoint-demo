/**
 * Slot Transition
 *
 * A second between one time slot and the next, inside a day: the old slot's icon
 * swings off along an arc and the new one swings up into its place, like a dial
 * turning, while the slot name rolls over underneath. The step from night to morning
 * is the day card's (DayTransition).
 *
 * Training and matches move the clock while their result is opening, so the beat
 * waits until the old slot's wrap-up (the result and the notices that follow it) has
 * been dismissed, then plays over whatever the new slot opens with.
 *
 * Tapping skips it. With reduced motion it is the end frame, held still.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { TimeManager } from '../game/TimeManager';
import { TimeSlot, TIME_SLOT_NAMES } from '../types/game';
import type { GamePhase } from '../types/gamePhase';
import { TIME_SLOT_COLOURS, TIME_SLOT_ICONS } from '../data/pixelIcons';
import { PixelIcon } from './ui/PixelIcon';
import { transitionsEnabled } from '../utils/transitionsEnabled';

/** Whole beat, fade in to fade out. Kept in step with `slot-tx-*` in index.css. */
const SLOT_TRANSITION_MS = 1000;

/** The one extra touch each new slot gets as its icon lands. */
const FLOURISH: Record<TimeSlot, 'pop' | 'settle' | 'stars' | null> = {
  [TimeSlot.MORNING]: null,
  [TimeSlot.AFTERNOON]: 'pop',
  [TimeSlot.EVENING]: 'settle',
  [TimeSlot.NIGHT]: 'stars',
};

/** Where the stars blink on around the moon, from the dial's centre line. */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [-38, 20],
  [34, 6],
  [48, 40],
  [-20, -2],
];

interface Step {
  from: TimeSlot;
  to: TimeSlot;
}

interface Transition extends Step {
  /** Bumps on every beat, so back-to-back beats restart the animation. */
  key: number;
}

/** What closes out a slot: its result and the notices that follow it. */
function isWrapUp(phase: GamePhase): boolean {
  if (phase.type === 'match_results') return true;
  if (phase.type !== 'idle' || !phase.overlay) return false;
  const { type } = phase.overlay;
  return type === 'training_result' || type === 'item_acquired' || type === 'hangout_unlock';
}

/** Watches the clock and plays the beat whenever the slot moves on within a day. */
export const SlotTransition: React.FC = () => {
  const [transition, setTransition] = useState<Transition | null>(null);
  const pending = useRef<Step | null>(null);

  useEffect(() => {
    if (!transitionsEnabled()) return;
    return useGameStore.subscribe((state, prev) => {
      if (!prev.isInitialized || !state.isInitialized) return;
      // A new day is the day card's.
      if (TimeManager.isNewDay(prev.calendar, state.calendar)) {
        pending.current = null;
        return;
      }
      const from = prev.calendar.currentTimeSlot;
      const to = state.calendar.currentTimeSlot;
      if (to > from) pending.current = { from: pending.current?.from ?? from, to };
      const step = pending.current;
      if (!step || isWrapUp(state.gamePhase)) return;
      pending.current = null;
      setTransition((current) => ({ ...step, key: (current?.key ?? 0) + 1 }));
    });
  }, []);

  useEffect(() => {
    if (!transition) return;
    const id = window.setTimeout(() => setTransition(null), SLOT_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [transition]);

  const skip = useCallback(() => setTransition(null), []);

  if (!transition) return null;
  const { from, to } = transition;
  const flourish = FLOURISH[to];
  const fromName = TIME_SLOT_NAMES[from];
  const toName = TIME_SLOT_NAMES[to];

  return (
    <div
      key={transition.key}
      className="slot-tx fixed inset-0 z-[70] flex items-center justify-center bg-black/85 cursor-pointer"
      onClick={skip}
      role="status"
      aria-label={toName}
      data-testid="slot-transition"
      data-from={from}
      data-to={to}
    >
      <div className="flex flex-col items-center gap-3 -mt-[8vh]">
        <div className="relative w-[200px] h-[96px]">
          {flourish === 'stars' &&
            STARS.map(([x, y], i) => (
              <i
                key={i}
                className="slot-tx-star absolute w-1 h-1 bg-[#e8ecff]"
                style={{ left: 100 + x, top: y, animationDelay: `${i * 50}ms` }}
              />
            ))}
          <span className="slot-tx-arm slot-tx-arm-old">
            <span className="slot-tx-icon slot-tx-icon-old">
              <PixelIcon grid={TIME_SLOT_ICONS[from]} color={TIME_SLOT_COLOURS[from]} scale={4} />
            </span>
          </span>
          <span className="slot-tx-arm slot-tx-arm-new">
            <span
              className={`slot-tx-icon slot-tx-icon-new${flourish ? ` slot-tx-${flourish}` : ''}`}
            >
              <PixelIcon grid={TIME_SLOT_ICONS[to]} color={TIME_SLOT_COLOURS[to]} scale={4} />
            </span>
          </span>
        </div>
        {/* The old name rolls up and out as the new one rolls in, like the day number. */}
        <span className="relative inline-block h-[1.6em] overflow-hidden text-sm font-bold leading-[1.6em]">
          <span className="invisible">{fromName.length > toName.length ? fromName : toName}</span>
          <span className="slot-tx-name-old absolute inset-0 text-center text-pixel-text">
            {fromName}
          </span>
          <span className="slot-tx-name-new absolute inset-0 text-center text-pixel-accent">
            {toName}
          </span>
        </span>
      </div>
    </div>
  );
};
