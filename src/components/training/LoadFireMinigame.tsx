/**
 * Backhand Minigame — "Load & Fire"
 *
 * Hold to load the backhand — the charge climbs into a green sweet zone, then overshoots
 * into red if you hold too long. Release inside the sweet zone for the flushest contact.
 * Mostly juice: a mistimed release still lands 1 support.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { scoreToCount, type SupportCount } from '../../game/AnchorTrainingSystem';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, SupportResult, countNote, type MinigameProps } from './MinigameShell';

const CHARGE_SPEED = 120; // units/sec
const MAX_CHARGE = 120; // can overshoot the 100 mark into "overloaded"
const SWEET_CENTER = 88; // ideal release point
const SWEET_SPREAD = 45; // score falloff distance

type Phase = 'ready' | 'charging' | 'done';

export const LoadFireMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const [charge, setCharge] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<{ charge: number; count: SupportCount } | null>(null);

  const chargeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    chargeRef.current = 0;
    setCharge(0);
    setPhase('charging');
  }, []);

  const fire = useCallback(() => {
    if (phaseRef.current !== 'charging') return;
    const captured = chargeRef.current;
    const score = Math.max(0, 1 - Math.abs(captured - SWEET_CENTER) / SWEET_SPREAD);
    const count = scoreToCount(score);
    setResult({ charge: captured, count });
    setPhase('done');
    audioManager.playSfx('ui_click');
    window.setTimeout(() => onComplete(score), 1050);
  }, [onComplete]);

  // Charge loop while held.
  useEffect(() => {
    if (phase !== 'charging') return;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      const next = Math.min(MAX_CHARGE, chargeRef.current + CHARGE_SPEED * dt);
      chargeRef.current = next;
      setCharge(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // Spacebar hold: keydown loads, keyup fires.
  useEffect(() => {
    const onDown = (e: KeyboardEvent): void => {
      if ((e.code === 'Space' || e.key === ' ') && !e.repeat) {
        e.preventDefault();
        startCharge();
      }
    };
    const onUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [startCharge, fire]);

  const chargePct = (charge / MAX_CHARGE) * 100;

  return (
    <MinigameShell title="Load & Fire" subtitle="Hold to load — release in the green">
      <div className="flex items-end justify-center gap-6">
        {/* Vertical charge meter (0..MAX_CHARGE) */}
        <div className="relative h-64 w-24 bg-pixel-bg border-2 border-pixel-border overflow-hidden">
          {/* Overload zone (>100) at the very top */}
          <div className="absolute inset-x-0 top-0 h-[16.6%] bg-red-500/20 border-b border-red-500" />
          {/* Sweet zone 75..100 */}
          <div className="absolute inset-x-0 top-[16.6%] h-[20.8%] bg-green-500/25 border-y-2 border-green-500" />
          <span className="absolute right-1 top-1 text-[10px] font-bold text-red-400">over</span>
          <span className="absolute right-1 top-[22%] text-[10px] font-bold text-green-400">sweet</span>

          {/* Charge fill */}
          <div
            className="absolute inset-x-0 bottom-0 bg-pixel-accent/60"
            style={{ height: `${chargePct}%` }}
          />
          {/* Charge line marker */}
          <div
            className="absolute inset-x-0 h-1 bg-pixel-text"
            style={{ bottom: `calc(${chargePct}% - 2px)` }}
          />
        </div>

        {/* Readout */}
        <div className="w-40">
          {phase === 'done' && result ? (
            <SupportResult
              count={result.count}
              note={countNote(result.count, 'Flush through contact!', 'Solid drive.', result.charge > 100 ? 'Overloaded it.' : 'Fired early.')}
            />
          ) : (
            <div className="text-sm text-pixel-text-muted text-center">
              {phase === 'charging' ? 'Release in the green!' : 'Hold to load the swing.'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {/* Raw button so we can use hold (pointer down/up) semantics. */}
        <button
          type="button"
          disabled={phase === 'done'}
          // Capture the pointer so the hold sticks to this button even if the finger
          // drifts, and always resolve on release OR a browser-issued cancel (e.g. an
          // interrupted touch) so the charge can never get stuck mid-load on mobile.
          onPointerDown={(e) => {
            e.preventDefault();
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // setPointerCapture can throw on some browsers / synthetic events; the
              // hold still works via the up/cancel handlers without capture.
            }
            startCharge();
          }}
          onPointerUp={fire}
          onPointerCancel={fire}
          className="font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1 px-8 py-3 text-lg w-full select-none touch-none"
        >
          {phase === 'done'
            ? 'Great backhand!'
            : phase === 'charging'
              ? 'Release to fire!'
              : 'Hold to Load  (Space)'}
        </button>
      </div>
    </MinigameShell>
  );
};
