/**
 * Forehand Minigame — "Rally Rhythm"
 *
 * The ball rallies back and forth across the baseline. Each of three attempts the
 * strike zone sits at a different spot — swing while the ball is inside it. Every clean
 * contact banks a support; the first miss ends the rally. See docs/training-redesign.md.
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

const BALL_SPEED = 115; // units/sec across the 0..100 track

export const RallyRhythmMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const rounds = useMinigameRounds(onComplete);
  const [pos, setPos] = useState(0);

  const bandsRef = useRef<Band[]>(movingBands(22, 78, 18));
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const band = bandsRef.current[Math.min(rounds.round, bandsRef.current.length - 1)];
  const playing = rounds.phase === 'playing';

  const swing = useCallback(() => {
    if (rounds.phase !== 'playing') return;
    const p = posRef.current;
    const passed = p >= band.lo && p <= band.hi;
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, band]);

  useEffect(() => {
    if (rounds.phase === 'done') return;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      let next = posRef.current + dirRef.current * BALL_SPEED * dt;
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
        swing();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swing]);

  return (
    <MinigameShell title="Rally Rhythm" subtitle="Swing while the ball is in the zone — it moves each rep">
      {/* Horizontal rally track */}
      <div className="relative h-16 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 bg-green-500/25 border-x-2 border-green-500"
          style={{ left: `${band.lo}%`, width: `${band.hi - band.lo}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm ${
            playing ? 'bg-pixel-accent border-pixel-text' : 'bg-orange-400 border-orange-200'
          }`}
          style={{ left: `calc(${pos}% - 14px)` }}
        >
          🎾
        </div>
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Locked-in rally!',
            'Two clean strikes.',
            'One before you netted it.',
            'Mistimed the first one.'
          )}
        />
      ) : (
        <MinigameActionButton onPress={swing} disabled={!playing}>
          {playing ? `Swing!  ·  Rep ${rounds.round + 1} of 3  (Space)` : 'Clean! Next ball…'}
        </MinigameActionButton>
      )}
    </MinigameShell>
  );
};
