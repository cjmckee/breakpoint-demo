/**
 * Return Minigame — "Read & Catch"
 *
 * Three returns come at you: a ball drops from a random spot at the top of the box and
 * you have to click/tap it before it reaches the floor. Tests moving to the ball
 * (left/right) plus reaction — the fall gives a little timing leeway. Each catch banks
 * a support; all three balls always play out. See docs/training-redesign.md.
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

const HIT_RADIUS = 30; // px — a touch more generous than the visual ball
const MIN_FALL_MS = 1450;
const MAX_FALL_MS = 1950;

export const CatchReturnMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const rounds = useMinigameRounds(onComplete);
  const [ballX, setBallX] = useState(50); // %
  const [ballY, setBallY] = useState(0); // %

  const boxRef = useRef<HTMLDivElement | null>(null);
  const ballXRef = useRef(50);
  const ballYRef = useRef(0);
  const caughtRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const playing = rounds.phase === 'playing';

  // Arm a fresh falling ball for each playing attempt.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;

    const x = 12 + Math.random() * 76;
    ballXRef.current = x;
    ballYRef.current = 0;
    caughtRef.current = false;
    setBallX(x);
    setBallY(0);

    const fallMs = MIN_FALL_MS + Math.random() * (MAX_FALL_MS - MIN_FALL_MS);
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = now - last;
      last = now;
      const next = ballYRef.current + (100 / fallMs) * dt;
      if (next >= 100) {
        ballYRef.current = 100;
        setBallY(100);
        if (!caughtRef.current) rounds.commit(false); // ball hit the floor
        return;
      }
      ballYRef.current = next;
      setBallY(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // rounds.commit is stable enough; re-arm on each new playing round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  const tryCatch = useCallback(
    (clientX: number, clientY: number) => {
      if (rounds.phase !== 'playing' || caughtRef.current || !boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const cx = (ballXRef.current / 100) * rect.width;
      const cy = (ballYRef.current / 100) * rect.height;
      const dist = Math.hypot(clientX - rect.left - cx, clientY - rect.top - cy);
      if (dist <= HIT_RADIUS) {
        caughtRef.current = true;
        audioManager.playSfx('ui_click');
        rounds.commit(true);
      }
      // A miss-click is ignored — the ball keeps falling, so you can try again.
    },
    [rounds]
  );

  return (
    <MinigameShell title="Read & Catch" subtitle="Click each ball before it lands — the spot changes every time">
      <div
        ref={boxRef}
        onPointerDown={(e) => {
          e.preventDefault();
          tryCatch(e.clientX, e.clientY);
        }}
        className={`relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden select-none touch-none ${
          playing ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {/* Floor line — the ball disappears here */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500/50" />

        {playing && (
          <div
            className="absolute w-10 h-10 rounded-full bg-pixel-accent border-2 border-pixel-text flex items-center justify-center text-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${ballX}%`, top: `${ballY}%` }}
          >
            🎾
          </div>
        )}

        {rounds.phase === 'transition' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${rounds.lastPass ? 'text-green-400' : 'text-red-400'}`}>
              {rounds.lastPass ? 'Caught!' : 'Dropped it'}
            </span>
          </div>
        )}

        {rounds.phase === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <SupportResult
              count={rounds.successes}
              note={countNote(
                rounds.successes,
                'Three clean returns!',
                'Two good gets.',
                'One good get.',
                'Beaten to all three.'
              )}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase !== 'done' && (
        <p className="text-xs text-pixel-text-muted text-center mt-3">
          Return {Math.min(rounds.round + 1, 3)} of 3 · move to the ball and click before it lands
        </p>
      )}
    </MinigameShell>
  );
};
