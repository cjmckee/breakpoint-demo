/**
 * Return Minigame — "Read & React"
 *
 * Wait for the serve, tap the instant the panel flips to GO. There's no spatial window
 * to move, so instead the returns get FASTER: the reaction time you must beat tightens
 * each of three attempts. Beat it to bank a support; a slow reaction OR an early jump
 * ends the practice. See docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import {
  MinigameShell,
  SupportResult,
  RoundPips,
  countNote,
  type MinigameProps,
} from './MinigameShell';
import { useMinigameRounds } from './useMinigameRounds';
import { tighteningThresholds } from './minigameWindows';

const MIN_DELAY = 900;
const MAX_DELAY = 2300;

type ReactPhase = 'waiting' | 'go';

export const ReadReactMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const rounds = useMinigameRounds(onComplete);
  const [reactPhase, setReactPhase] = useState<ReactPhase>('waiting');
  const [note, setNote] = useState<string>('');

  const reactPhaseRef = useRef<ReactPhase>('waiting');
  reactPhaseRef.current = reactPhase;
  const goTimeRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const thresholdsRef = useRef<number[]>(tighteningThresholds(470, 80));

  const threshold = thresholdsRef.current[Math.min(rounds.round, thresholdsRef.current.length - 1)];

  const react = useCallback(() => {
    if (rounds.phase !== 'playing') return;
    if (reactPhaseRef.current === 'waiting') {
      // Jumped before the serve fired — a miss.
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      setNote('Jumped early!');
      audioManager.playSfx('ui_click');
      rounds.commit(false);
      return;
    }
    const reaction = performance.now() - goTimeRef.current;
    const passed = reaction <= threshold;
    setNote(`${Math.round(reaction)}ms ${passed ? '✓' : `> ${threshold}ms`}`);
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, threshold]);

  // Arm a fresh wait -> GO cycle for each playing round.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    setReactPhase('waiting');
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timeoutRef.current = window.setTimeout(() => {
      goTimeRef.current = performance.now();
      setReactPhase('go');
    }, delay);
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [rounds.phase, rounds.round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        react();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [react]);

  const isGo = rounds.phase === 'playing' && reactPhase === 'go';
  const panel = isGo
    ? 'bg-green-500/30 border-green-500 text-green-300'
    : rounds.phase === 'done'
      ? 'bg-pixel-bg border-pixel-border'
      : rounds.phase === 'transition'
        ? 'bg-pixel-bg border-pixel-border text-pixel-text-muted'
        : 'bg-red-500/20 border-red-500/60 text-red-300';

  return (
    <MinigameShell title="Read & React" subtitle="Tap the instant the serve fires — it gets faster each rep">
      <button
        type="button"
        // React on pointer DOWN so reaction time is measured from the press, not release.
        onPointerDown={(e) => {
          e.preventDefault();
          react();
        }}
        disabled={rounds.phase === 'done'}
        className={`w-full h-48 border-4 flex items-center justify-center transition-colors duration-75 select-none touch-none ${panel} ${
          rounds.phase === 'done' ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {rounds.phase === 'done' ? (
          <SupportResult
            count={rounds.successes}
            note={countNote(
              rounds.successes,
              'Three lightning returns!',
              'Two quick reads.',
              'One before you were late.',
              'Beaten by the serve.'
            )}
          />
        ) : rounds.phase === 'transition' ? (
          <div className="text-center">
            <div className="text-lg font-bold">Got it!</div>
            <div className="text-xs">{note}</div>
          </div>
        ) : isGo ? (
          <div className="text-center">
            <div className="text-5xl font-bold">NOW!</div>
            <div className="text-sm">Tap!</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">🎾</div>
            <div className="text-lg font-bold">Wait for it…</div>
          </div>
        )}
      </button>

      <div className="mt-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase !== 'done' && (
        <p className="text-xs text-pixel-text-muted text-center mt-3">
          Return {Math.min(rounds.round + 1, 3)} of 3 · beat {threshold}ms · click or Space
        </p>
      )}
    </MinigameShell>
  );
};
