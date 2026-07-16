/**
 * Serve Minigame — "Toss & Strike"
 *
 * The ball toss rises and falls on a vertical meter. Strike near the top of the toss
 * for a clean contact. Mostly juice: a good strike lands 3 supports, a mediocre one
 * still lands 1 — you can't whiff to zero. See docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { scoreToCount, type SupportCount } from '../../game/AnchorTrainingSystem';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, SupportResult, countNote, type MinigameProps } from './MinigameShell';

// Toss travels this many meter-units per second (0..100 range). ~0.75s per pass.
const TOSS_SPEED = 135;

type Phase = 'swinging' | 'struck';

export const ServeMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>('swinging');
  const [result, setResult] = useState<{ pos: number; count: SupportCount } | null>(null);

  const dirRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const strike = useCallback(() => {
    setPhase((current) => {
      if (current !== 'swinging') return current;
      setPos((captured) => {
        const score = captured / 100;
        const count = scoreToCount(score);
        setResult({ pos: captured, count });
        audioManager.playSfx('ui_click');
        window.setTimeout(() => onComplete(score), 1050);
        return captured;
      });
      return 'struck';
    });
  }, [onComplete]);

  // Toss animation loop (ping-pongs between 0 and 100).
  useEffect(() => {
    if (phase !== 'swinging') return;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      setPos((p) => {
        let next = p + dirRef.current * TOSS_SPEED * dt;
        if (next >= 100) {
          next = 100;
          dirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          dirRef.current = 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // Spacebar to strike.
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

  const shown = result?.pos ?? pos;

  return (
    <MinigameShell title="Toss & Strike" subtitle="Strike at the top of the toss">
      <div className="flex items-end justify-center gap-6">
        {/* Vertical toss meter */}
        <div className="relative h-64 w-24 bg-pixel-bg border-2 border-pixel-border overflow-hidden">
          {/* Tier bands (bottom -> top): 1 / 2 / 3 supports */}
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gray-500/10 border-t border-gray-600" />
          <div className="absolute inset-x-0 bottom-[40%] h-[35%] bg-yellow-500/15 border-t border-yellow-600" />
          <div className="absolute inset-x-0 bottom-[75%] h-[25%] bg-green-500/20 border-t-2 border-green-500" />

          <span className="absolute right-1 top-1 text-[10px] font-bold text-green-400">+3</span>
          <span className="absolute right-1 top-[30%] text-[10px] font-bold text-yellow-400">+2</span>
          <span className="absolute right-1 bottom-1 text-[10px] font-bold text-gray-400">+1</span>

          {/* The ball */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 transition-none ${
              phase === 'struck'
                ? 'bg-orange-400 border-orange-200'
                : 'bg-pixel-accent border-pixel-text'
            }`}
            style={{ bottom: `calc(${shown}% - 16px)` }}
          >
            <div className="w-full h-full flex items-center justify-center text-sm">🎾</div>
          </div>
        </div>

        {/* Readout */}
        <div className="w-40">
          {phase === 'struck' && result ? (
            <SupportResult
              count={result.count}
              note={countNote(result.count, 'Flush contact!', 'Solid strike.', 'Caught it low.')}
            />
          ) : (
            <div className="text-sm text-pixel-text-muted text-center">
              Higher contact = more support stats. Time the peak.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button variant="primary" fullWidth size="lg" disabled={phase === 'struck'} onClick={strike}>
          {phase === 'struck' ? 'Nice serve!' : 'Strike!  (Space)'}
        </Button>
      </div>
    </MinigameShell>
  );
};
