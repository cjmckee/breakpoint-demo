/**
 * Forehand Minigame — "Rally Rhythm"
 *
 * The ball rallies back and forth. Tap in time as it crosses the strike zone in the
 * middle — land clean contacts to extend the rally. Three swings; the cleaner your
 * timing, the more support stats. Mostly juice: even sloppy timing lands 1.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { scoreToCount, type SupportCount } from '../../game/AnchorTrainingSystem';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, SupportResult, countNote, type MinigameProps } from './MinigameShell';

const BALL_SPEED = 115; // units/sec across the 0..100 track
const CENTER = 50;
const TOTAL_SWINGS = 3;

type Phase = 'rallying' | 'done';

export const RallyRhythmMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const [pos, setPos] = useState(0);
  const [hits, setHits] = useState<number[]>([]); // accuracy 0..1 per swing
  const [phase, setPhase] = useState<Phase>('rallying');
  const [result, setResult] = useState<SupportCount | null>(null);

  const dirRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const hitsRef = useRef<number[]>([]);

  const finish = useCallback(
    (accuracies: number[]) => {
      const score =
        accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / TOTAL_SWINGS : 0;
      const count = scoreToCount(score);
      setResult(count);
      setPhase('done');
      window.setTimeout(() => onComplete(score), 1050);
    },
    [onComplete]
  );

  const swing = useCallback(() => {
    if (phase !== 'rallying') return;
    const accuracy = Math.max(0, 1 - Math.abs(posRef.current - CENTER) / CENTER);
    const next = [...hitsRef.current, accuracy];
    hitsRef.current = next;
    setHits(next);
    audioManager.playSfx('ui_click');
    if (next.length >= TOTAL_SWINGS) finish(next);
  }, [phase, finish]);

  // Ball animation loop (continuous ping-pong).
  useEffect(() => {
    if (phase !== 'rallying') return;
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
  }, [phase]);

  // Spacebar to swing.
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
    <MinigameShell title="Rally Rhythm" subtitle="Tap as the ball crosses the middle — keep the rally going">
      {/* Horizontal rally track */}
      <div className="relative h-16 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        {/* Strike zone in the center */}
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-green-500/20 border-x-2 border-green-500" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-green-400/70" />
        {/* The ball */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-pixel-accent border-2 border-pixel-text flex items-center justify-center text-sm"
          style={{ left: `calc(${pos}% - 14px)` }}
        >
          🎾
        </div>
      </div>

      {/* Swing pips */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: TOTAL_SWINGS }).map((_, i) => {
          const acc = hits[i];
          const color =
            acc === undefined
              ? 'bg-pixel-bg border-pixel-border'
              : acc >= 0.66
                ? 'bg-green-500 border-green-400'
                : acc >= 0.33
                  ? 'bg-yellow-500 border-yellow-400'
                  : 'bg-gray-600 border-gray-500';
          return <div key={i} className={`w-8 h-3 border-2 ${color}`} />;
        })}
        <span className="text-xs text-pixel-text-muted ml-2">
          {hits.length}/{TOTAL_SWINGS} swings
        </span>
      </div>

      {phase === 'done' && result !== null ? (
        <SupportResult
          count={result}
          note={countNote(result, 'Locked-in rhythm!', 'Good cadence.', 'Rushed the timing.')}
        />
      ) : (
        <Button variant="primary" fullWidth size="lg" onClick={swing}>
          Swing!  (Space)
        </Button>
      )}
    </MinigameShell>
  );
};
