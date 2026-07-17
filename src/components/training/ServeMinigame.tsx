/**
 * Serve Minigame — "Toss & Strike"
 *
 * The ball toss rises and falls on a vertical meter. Each of three attempts a green
 * strike window sits at a different height — strike while the ball is inside it. Every
 * clean strike banks a support. See
 * docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import {
  MinigameShell,
  SupportResult,
  RoundPips,
  MinigameActionButton,
  countNote,
  type MinigameProps,
} from './MinigameShell';
import { useMinigameRounds } from './useMinigameRounds';
import { movingBands, type Band } from './minigameWindows';

const TOSS_SPEED_MIN = 170; // meter-units per second — randomized per attempt so it can't be counted out
const TOSS_SPEED_MAX = 230;

export const ServeMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const [pos, setPos] = useState(0);

  const bandsRef = useRef<Band[]>(movingBands(32, 90, 16 * (1 + windowBonus)));
  const speedsRef = useRef<number[]>(
    Array.from({ length: 3 }, () => TOSS_SPEED_MIN + Math.random() * (TOSS_SPEED_MAX - TOSS_SPEED_MIN))
  );
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const band = bandsRef.current[Math.min(rounds.round, bandsRef.current.length - 1)];
  const tossSpeed = speedsRef.current[Math.min(rounds.round, speedsRef.current.length - 1)];
  const playing = rounds.phase === 'playing';

  const strike = useCallback(() => {
    if (rounds.phase !== 'playing') return;
    const p = posRef.current;
    const passed = p >= band.lo && p <= band.hi;
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, band]);

  // Toss animation (ping-pongs 0..100) — pauses between attempts so the miss/hit
  // readout has a beat to land before the next toss starts moving again.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      let next = posRef.current + dirRef.current * tossSpeed * dt;
      if (next >= 100) {
        next = 100;
        dirRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
      }
      posRef.current = next;
      setPos(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [rounds.phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        strike();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [strike]);

  return (
    <MinigameShell title="Toss & Strike" subtitle="Strike while the ball is in the window">
      <div className="flex items-end justify-center gap-6 mb-4">
        {/* Vertical toss meter */}
        <div className="relative h-64 w-24 bg-pixel-bg border-2 border-pixel-border overflow-hidden">
          {/* Current success window */}
          <div
            className="absolute inset-x-0 bg-green-500/25 border-y-2 border-green-500"
            style={{ bottom: `${band.lo}%`, height: `${band.hi - band.lo}%` }}
          />
          {/* The ball */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 ${
              playing ? 'bg-pixel-accent border-pixel-text' : 'bg-orange-400 border-orange-200'
            }`}
            style={{ bottom: `calc(${pos}% - 16px)` }}
          >
            <div className="w-full h-full flex items-center justify-center text-sm">🎾</div>
          </div>
        </div>

        <div className="w-40">
          {rounds.phase === 'done' ? (
            <SupportResult
              count={rounds.successes}
              note={countNote(
                rounds.successes,
                'Three perfect serves!',
                'Two clean serves. Not bad.',
                'One clean serve. Keep practicing!',
                'You need some work...'
              )}
            />
          ) : (
            <div className="text-sm text-pixel-text-muted text-center">
              {rounds.phase === 'transition'
                ? rounds.lastPass
                  ? 'Clean! Next toss…'
                  : 'Missed — next toss…'
                : `Serve ${rounds.round + 1} of 3`}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? null : (
        <MinigameActionButton onPress={strike} disabled={!playing}>
          {playing ? 'Strike!  (Space)' : rounds.lastPass ? 'Nice!' : 'Missed'}
        </MinigameActionButton>
      )}
    </MinigameShell>
  );
};
