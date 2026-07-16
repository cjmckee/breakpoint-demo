/**
 * Slice Minigame — "Touch & Carve"
 *
 * The contact ring breathes in and out. Tap at its softest, smallest point for the
 * finest touch — the tighter the ring when you strike, the more support stats. Mostly
 * juice: a heavy-handed tap still lands 1.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { scoreToCount, type SupportCount } from '../../game/AnchorTrainingSystem';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, SupportResult, countNote, type MinigameProps } from './MinigameShell';

const MIN_SIZE = 12; // % — the ideal "softest" ring
const MAX_SIZE = 100; // %
const BREATH_SPEED = 3.6; // radians/sec (~1.75s per full breath)

type Phase = 'breathing' | 'done';

export const TouchCarveMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const [size, setSize] = useState(MAX_SIZE);
  const [phase, setPhase] = useState<Phase>('breathing');
  const [result, setResult] = useState<{ size: number; count: SupportCount } | null>(null);

  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(MAX_SIZE);
  const tRef = useRef(0);
  const phaseRef = useRef<Phase>('breathing');
  phaseRef.current = phase;

  const carve = useCallback(() => {
    if (phaseRef.current !== 'breathing') return;
    const captured = sizeRef.current;
    // Smaller ring = softer touch = higher score.
    const score = Math.max(0, Math.min(1, 1 - (captured - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)));
    const count = scoreToCount(score);
    setResult({ size: captured, count });
    setPhase('done');
    audioManager.playSfx('ui_click');
    window.setTimeout(() => onComplete(score), 1050);
  }, [onComplete]);

  // Breathing loop.
  useEffect(() => {
    if (phase !== 'breathing') return;
    let last = performance.now();
    const mid = (MIN_SIZE + MAX_SIZE) / 2;
    const amp = (MAX_SIZE - MIN_SIZE) / 2;
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      tRef.current += dt * BREATH_SPEED;
      // Start large, shrink toward MIN — cos so it opens at full size.
      const next = mid + amp * Math.cos(tRef.current);
      sizeRef.current = next;
      setSize(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // Spacebar to carve.
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

  const shownSize = result?.size ?? size;

  return (
    <MinigameShell title="Touch & Carve" subtitle="Tap at the softest, smallest point">
      <div className="relative h-56 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden flex items-center justify-center mb-4">
        {/* Target: the ideal small ring to aim for */}
        <div
          className="absolute rounded-full border-2 border-green-500/70 border-dashed"
          style={{ width: `${MIN_SIZE}%`, aspectRatio: '1 / 1' }}
        />
        {/* The breathing contact ring */}
        <div
          className={`absolute rounded-full border-4 ${
            phase === 'done' ? 'border-orange-400' : 'border-pixel-accent'
          }`}
          style={{ width: `${shownSize}%`, aspectRatio: '1 / 1' }}
        />
        <span className="text-2xl relative">🎾</span>
      </div>

      {phase === 'done' && result ? (
        <SupportResult
          count={result.count}
          note={countNote(result.count, 'Feather touch!', 'Nicely carved.', 'Too heavy.')}
        />
      ) : (
        <Button variant="primary" fullWidth size="lg" onClick={carve}>
          Carve!  (Space)
        </Button>
      )}
    </MinigameShell>
  );
};
