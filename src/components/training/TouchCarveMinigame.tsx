/**
 * Slice Minigame — "Touch & Carve"
 *
 * The contact ring breathes in and out between two target rings. Tap when it's sized
 * between them — the target window moves each of three attempts. Every clean carve
 * banks a support; the first miss ends the practice. See docs/training-redesign.md.
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

const MIN_SIZE = 10; // % of the box
const MAX_SIZE = 100;
const BREATH_SPEED = 3.4; // radians/sec (~1.85s per full breath)

export const TouchCarveMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const rounds = useMinigameRounds(onComplete);
  const [size, setSize] = useState(MAX_SIZE);

  const bandsRef = useRef<Band[]>(movingBands(26, 62, 16));
  const sizeRef = useRef(MAX_SIZE);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const band = bandsRef.current[Math.min(rounds.round, bandsRef.current.length - 1)];
  const playing = rounds.phase === 'playing';

  const carve = useCallback(() => {
    if (rounds.phase !== 'playing') return;
    const s = sizeRef.current;
    const passed = s >= band.lo && s <= band.hi;
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, band]);

  useEffect(() => {
    if (rounds.phase === 'done') return;
    let last = performance.now();
    const mid = (MIN_SIZE + MAX_SIZE) / 2;
    const amp = (MAX_SIZE - MIN_SIZE) / 2;
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      tRef.current += dt * BREATH_SPEED;
      const next = mid + amp * Math.cos(tRef.current);
      sizeRef.current = next;
      setSize(next);
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
        carve();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [carve]);

  return (
    <MinigameShell title="Touch & Carve" subtitle="Tap when the ring fits the target — it moves each rep">
      <div className="relative h-56 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden flex items-center justify-center mb-4">
        {/* Target window: tap while the breathing ring sits between these two */}
        <div
          className="absolute rounded-full border-2 border-green-500/70 border-dashed"
          style={{ width: `${band.lo}%`, aspectRatio: '1 / 1' }}
        />
        <div
          className="absolute rounded-full border-2 border-green-500/70 border-dashed"
          style={{ width: `${band.hi}%`, aspectRatio: '1 / 1' }}
        />
        {/* The breathing contact ring */}
        <div
          className={`absolute rounded-full border-4 ${playing ? 'border-pixel-accent' : 'border-orange-400'}`}
          style={{ width: `${size}%`, aspectRatio: '1 / 1' }}
        />
        <span className="text-2xl relative">🎾</span>
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Three feather touches!',
            'Two clean carves.',
            'One before you leaned on it.',
            'Ring was the wrong size.'
          )}
        />
      ) : (
        <MinigameActionButton onPress={carve} disabled={!playing}>
          {playing ? `Carve!  ·  Rep ${rounds.round + 1} of 3  (Space)` : 'Clean! Next touch…'}
        </MinigameActionButton>
      )}
    </MinigameShell>
  );
};
