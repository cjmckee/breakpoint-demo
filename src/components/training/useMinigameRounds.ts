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
 *
 * Games start in a `ready` phase and do not arm until begin() is called, so the
 * standardized entry screen (see MinigameShell) can gate the first attempt — no more
 * getting dropped mid-action. `streak` tracks trailing consecutive cleans for the
 * shared combo pop.
 */

import { useCallback, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager.js';

export const TOTAL_ROUNDS = 3;

/**
 * Per-attempt difficulty ramp shared by every minigame. Each game still rolls its own
 * random speed per attempt — this multiplies on top, so later attempts run faster and a
 * clean sweep asks for more than three repeats of the same rep.
 */
const ROUND_SPEED = [1, 1.1, 1.22];

/** Speed multiplier for a 0-based attempt index. */
export function roundSpeed(round: number): number {
  return ROUND_SPEED[Math.min(Math.max(round, 0), ROUND_SPEED.length - 1)];
}

/** Delay after a passed attempt before the next one arms (ms). */
const TRANSITION_MS = 380;
/** Delay after the final attempt before reporting the result (ms). */
const FINISH_MS = 1050;

export type RoundPhase = 'ready' | 'playing' | 'transition' | 'done';

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
  /** Trailing run of consecutive clean attempts (resets to 0 on a miss). */
  streak: number;
  /** Leave the entry screen and arm the first attempt. No-op once started. */
  begin: () => void;
  /** Call exactly once per attempt with whether the player hit the window. */
  commit: (passed: boolean) => void;
}

function trailingStreak(results: boolean[]): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) n++;
  return n;
}

export function useMinigameRounds(
  onComplete: (successes: number) => void,
  onFirstAttempt?: () => void
): MinigameRounds {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<RoundPhase>('ready');
  const [lastPass, setLastPass] = useState<boolean | null>(null);

  const resultsRef = useRef<boolean[]>([]);
  const roundRef = useRef(0);
  const phaseRef = useRef<RoundPhase>('ready');
  const doneRef = useRef(false);
  phaseRef.current = phase;

  const begin = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    setPhase('playing');
  }, []);

  const finish = useCallback(
    (res: boolean[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      const successes = res.filter(Boolean).length;
      // A clean sweep gets its own sting; the overall training_done cue fires
      // separately once the result screen takes over.
      if (successes === TOTAL_ROUNDS) audioManager.playSfx('ace');
      window.setTimeout(() => onComplete(successes), FINISH_MS);
    },
    [onComplete]
  );

  const commit = useCallback(
    (passed: boolean) => {
      if (doneRef.current || phaseRef.current !== 'playing') return;
      if (resultsRef.current.length === 0) onFirstAttempt?.();
      setLastPass(passed);
      audioManager.playSfx(passed ? 'stat_up' : 'net');

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
    [finish, onFirstAttempt]
  );

  return {
    round,
    successes: results.filter(Boolean).length,
    phase,
    lastPass,
    results,
    streak: trailingStreak(results),
    begin,
    commit,
  };
}
