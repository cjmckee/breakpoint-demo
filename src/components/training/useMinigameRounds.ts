/**
 * Shared 3-attempt controller for the training minigames.
 *
 * Each minigame is now a best-of-streak: the player gets THREE attempts, each a
 * pass/fail. Every consecutive success banks one support stat; the first miss ends
 * the practice and you keep what you've banked. So 0-3 supports, and the success
 * window moves each attempt so it can't be muscle-memoried. See docs/training-redesign.md.
 *
 * The core anchor's +1 is granted separately and is always guaranteed — this only
 * governs the support count.
 */

import { useCallback, useRef, useState } from 'react';

export const TOTAL_ROUNDS = 3;

/** Delay after a passed attempt before the next one arms (ms). */
const TRANSITION_MS = 620;
/** Delay after the final attempt before reporting the result (ms). */
const FINISH_MS = 1050;

export type RoundPhase = 'playing' | 'transition' | 'done';

export interface MinigameRounds {
  /** Current attempt index, 0-based. */
  round: number;
  /** Supports banked so far. */
  successes: number;
  phase: RoundPhase;
  /** Result of the most recent attempt (null between attempts). */
  lastPass: boolean | null;
  /** Call exactly once per attempt with whether the player hit the window. */
  commit: (passed: boolean) => void;
}

export function useMinigameRounds(onComplete: (successes: number) => void): MinigameRounds {
  const [round, setRound] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('playing');
  const [lastPass, setLastPass] = useState<boolean | null>(null);

  const succRef = useRef(0);
  const roundRef = useRef(0);
  const phaseRef = useRef<RoundPhase>('playing');
  const doneRef = useRef(false);
  phaseRef.current = phase;

  const finish = useCallback(
    (n: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      window.setTimeout(() => onComplete(n), FINISH_MS);
    },
    [onComplete]
  );

  const commit = useCallback(
    (passed: boolean) => {
      if (doneRef.current || phaseRef.current !== 'playing') return;
      setLastPass(passed);

      if (!passed) {
        finish(succRef.current);
        return;
      }

      const n = succRef.current + 1;
      succRef.current = n;
      setSuccesses(n);

      if (roundRef.current >= TOTAL_ROUNDS - 1) {
        finish(n);
        return;
      }

      // Passed with rounds remaining — brief beat, then arm the next attempt.
      setPhase('transition');
      window.setTimeout(() => {
        roundRef.current += 1;
        setRound(roundRef.current);
        setLastPass(null);
        setPhase('playing');
      }, TRANSITION_MS);
    },
    [finish]
  );

  return { round, successes, phase, lastPass, commit };
}
