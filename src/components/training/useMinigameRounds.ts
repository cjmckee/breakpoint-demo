/**
 * Shared attempt controller for the minigames.
 *
 * A run is some number of attempts, each pass/fail, each worth points. Landing an
 * attempt banks its points; a miss banks none, does NOT end the run, and does not
 * have to be followed by another miss — every attempt always plays out. The
 * success window moves each attempt so it can't be muscle-memoried.
 *
 * Round count and score scale are separate inputs. Three attempts worth a point
 * each is the training default, so `score` there is the number of clean reps; a
 * game that scores one action out of a hundred asks for `{ rounds: 1, maxScore:
 * 100 }` and commits the points it earned.
 *
 * Games start in a `ready` phase and do not arm until begin() is called, so the
 * standardized entry screen (see MinigameShell) can gate the first attempt — no more
 * getting dropped mid-action. `streak` tracks trailing consecutive cleans for the
 * shared combo pop.
 *
 * The run reports a MinigameScore rather than a bare count, so a caller that is not
 * training can read it against its own scale.
 */

import { useCallback, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import type { MinigameConfig, MinigameId, MinigameScore } from '../../minigames/types';

/** Attempts a game runs when it does not say otherwise. */
export const DEFAULT_ROUNDS = 3;

/**
 * Per-attempt difficulty ramp. Each game still rolls its own random speed per
 * attempt — this multiplies on top, so later attempts run faster and a clean
 * sweep asks for more than repeats of the same rep. The last entry repeats, so a
 * run longer than the ramp keeps its final difficulty rather than resetting.
 */
const DEFAULT_SPEED_RAMP = [1, 1.1, 1.22];

/** Delay after a passed attempt before the next one arms (ms). */
const TRANSITION_MS = 380;
/** Delay after the final attempt before reporting the result (ms). */
const FINISH_MS = 1050;

export type RoundPhase = 'ready' | 'playing' | 'transition' | 'done';

export interface MinigameRounds {
  /** Current attempt index, 0-based. */
  round: number;
  /** Attempts in this run. */
  total: number;
  /** Attempts landed so far. Drives the pips; `score` is what gets reported. */
  successes: number;
  /** Points banked so far. */
  score: number;
  phase: RoundPhase;
  /** Result of the most recent attempt (null between attempts). */
  lastPass: boolean | null;
  /** Per-attempt outcomes, one entry per completed attempt. */
  results: boolean[];
  /** Trailing run of consecutive clean attempts (resets to 0 on a miss). */
  streak: number;
  /** Speed multiplier for the current attempt. */
  speed: number;
  /** Leave the entry screen and arm the first attempt. No-op once started. */
  begin: () => void;
  /**
   * Call exactly once per attempt with whether the player hit the window, and
   * what it was worth if the game scores attempts unevenly. Defaults to one
   * point for a landed attempt and none for a miss.
   */
  commit: (passed: boolean, points?: number) => void;
}

function trailingStreak(results: boolean[]): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) n++;
  return n;
}

/** Speed multiplier for a 0-based attempt index, clamped to the ramp's last entry. */
function speedFor(ramp: number[], round: number): number {
  return ramp[Math.min(Math.max(round, 0), ramp.length - 1)];
}

export function useMinigameRounds(
  request: { minigame: MinigameId; config?: MinigameConfig },
  onComplete: (score: MinigameScore) => void,
  onFirstAttempt?: () => void
): MinigameRounds {
  const { minigame, config } = request;
  const total = config?.rounds ?? DEFAULT_ROUNDS;
  const ramp = config?.speedRamp ?? DEFAULT_SPEED_RAMP;
  const maxScore = config?.maxScore ?? total;

  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('ready');
  const [lastPass, setLastPass] = useState<boolean | null>(null);

  const resultsRef = useRef<boolean[]>([]);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const phaseRef = useRef<RoundPhase>('ready');
  const doneRef = useRef(false);
  phaseRef.current = phase;

  const begin = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    setPhase('playing');
  }, []);

  const finish = useCallback(
    (finalScore: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      // A perfect run gets its own sting; the overall training_done cue fires
      // separately once the result screen takes over.
      if (finalScore >= maxScore) audioManager.playSfx('ace');
      window.setTimeout(
        () => onComplete({ minigame, score: finalScore, maxScore }),
        FINISH_MS
      );
    },
    [minigame, maxScore, onComplete]
  );

  const commit = useCallback(
    (passed: boolean, points?: number) => {
      if (doneRef.current || phaseRef.current !== 'playing') return;
      if (resultsRef.current.length === 0) onFirstAttempt?.();
      setLastPass(passed);
      audioManager.playSfx(passed ? 'stat_up' : 'net');

      const res = [...resultsRef.current, passed];
      resultsRef.current = res;
      setResults(res);

      const earned = points ?? (passed ? 1 : 0);
      scoreRef.current += earned;
      setScore(scoreRef.current);

      // Every attempt plays out — a miss does not stop the run.
      if (roundRef.current >= total - 1) {
        finish(scoreRef.current);
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
    [finish, onFirstAttempt, total]
  );

  return {
    round,
    total,
    successes: results.filter(Boolean).length,
    score,
    phase,
    lastPass,
    results,
    streak: trailingStreak(results),
    speed: speedFor(ramp, round),
    begin,
    commit,
  };
}
