/**
 * Shared 3-attempt controller for the training minigames.
 *
 * The player always gets THREE attempts, each a pass/fail. You bank one support per
 * success — they do NOT have to be consecutive, and a miss no longer ends the
 * practice; all three reps always play out. So 0-3 supports, and the success window
 * moves each attempt so it can't be muscle-memoried. See docs/training-redesign.md.
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
  /** Supports banked so far (total passes). */
  successes: number;
  phase: RoundPhase;
  /** Result of the most recent attempt (null between attempts). */
  lastPass: boolean | null;
  /** Per-attempt outcomes, one entry per completed attempt. */
  results: boolean[];
  /** Call exactly once per attempt with whether the player hit the window. */
  commit: (passed: boolean) => void;
}

export function useMinigameRounds(onComplete: (successes: number) => void): MinigameRounds {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<RoundPhase>('playing');
  const [lastPass, setLastPass] = useState<boolean | null>(null);

  const resultsRef = useRef<boolean[]>([]);
  const roundRef = useRef(0);
  const phaseRef = useRef<RoundPhase>('playing');
  const doneRef = useRef(false);
  phaseRef.current = phase;

  const finish = useCallback(
    (res: boolean[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      const successes = res.filter(Boolean).length;
      window.setTimeout(() => onComplete(successes), FINISH_MS);
    },
    [onComplete]
  );

  const commit = useCallback(
    (passed: boolean) => {
      if (doneRef.current || phaseRef.current !== 'playing') return;
      setLastPass(passed);

      const res = [...resultsRef.current, passed];
      resultsRef.current = res;
      setResults(res);

      // All three attempts always play out — a miss no longer stops the practice.
      if (roundRef.current >= TOTAL_ROUNDS - 1) {
        finish(res);
        return;
      }

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

  return { round, successes: results.filter(Boolean).length, phase, lastPass, results, commit };
}
