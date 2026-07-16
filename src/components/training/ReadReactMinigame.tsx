/**
 * Return Minigame — "Read & React"
 *
 * Wait for the serve. The panel flips to GO after a random delay — tap the instant it
 * does. Faster reactions earn more support stats. Mostly juice: a slow reaction (or an
 * early jump) still lands 1.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { scoreToCount, type SupportCount } from '../../game/AnchorTrainingSystem';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, SupportResult, type MinigameProps } from './MinigameShell';

const MIN_DELAY = 1200;
const MAX_DELAY = 2600;
const FAST_MS = 220; // at/under this reaction -> perfect
const SLOW_MS = 720; // at/over this -> floor

type Phase = 'waiting' | 'go' | 'done';

export const ReadReactMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [result, setResult] = useState<{ count: SupportCount; note: string } | null>(null);

  const phaseRef = useRef<Phase>('waiting');
  phaseRef.current = phase;
  const goTimeRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const finish = useCallback(
    (score: number, note: string) => {
      const count = scoreToCount(score);
      setResult({ count, note });
      setPhase('done');
      audioManager.playSfx('ui_click');
      window.setTimeout(() => onComplete(score), 1050);
    },
    [onComplete]
  );

  const react = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'done') return;
    if (current === 'waiting') {
      // Jumped before the serve — floored, but never zero.
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      finish(0.2, 'Jumped early!');
      return;
    }
    // current === 'go'
    const reaction = performance.now() - goTimeRef.current;
    const score = Math.max(0, Math.min(1, 1 - (reaction - FAST_MS) / (SLOW_MS - FAST_MS)));
    const note =
      reaction <= FAST_MS + 60
        ? `Lightning! ${Math.round(reaction)}ms`
        : reaction <= 480
          ? `Quick — ${Math.round(reaction)}ms`
          : `Late — ${Math.round(reaction)}ms`;
    finish(score, note);
  }, [finish]);

  // Schedule the GO cue after a random delay.
  useEffect(() => {
    timeoutRef.current = window.setTimeout(
      () => {
        goTimeRef.current = performance.now();
        setPhase('go');
      },
      MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
    );
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Spacebar to react.
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

  const panel =
    phase === 'go'
      ? 'bg-green-500/30 border-green-500 text-green-300'
      : phase === 'done'
        ? 'bg-pixel-bg border-pixel-border'
        : 'bg-red-500/20 border-red-500/60 text-red-300';

  return (
    <MinigameShell title="Read & React" subtitle="Tap the instant the serve fires">
      <button
        type="button"
        onClick={react}
        disabled={phase === 'done'}
        className={`w-full h-56 border-4 flex items-center justify-center transition-colors duration-75 select-none ${panel} ${
          phase === 'done' ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {phase === 'waiting' && (
          <div className="text-center">
            <div className="text-4xl mb-2">🎾</div>
            <div className="text-lg font-bold">Wait for it…</div>
          </div>
        )}
        {phase === 'go' && (
          <div className="text-center">
            <div className="text-5xl font-bold">NOW!</div>
            <div className="text-sm">Tap!</div>
          </div>
        )}
        {phase === 'done' && result && <SupportResult count={result.count} note={result.note} />}
      </button>

      {phase !== 'done' && (
        <p className="text-xs text-pixel-text-muted text-center mt-3">
          Faster reaction = more support stats. Click or press Space.
        </p>
      )}
    </MinigameShell>
  );
};
