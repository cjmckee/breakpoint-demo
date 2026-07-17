/**
 * Backhand Minigame — "Load & Fire"
 *
 * Hold to load the swing, release when the charge is inside the green window. The
 * window moves each of three attempts. Every clean release banks a support; the first
 * miss (release outside the window) ends the practice. See docs/training-redesign.md.
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
import { movingBands, type Band } from './minigameWindows';

const CHARGE_SPEED_MIN = 90; // units/sec — randomized per attempt so it can't be counted out
const CHARGE_SPEED_MAX = 125;
const MAX_CHARGE = 120; // caps the climb (holding past the window overshoots -> miss)

export const LoadFireMinigame: React.FC<MinigameProps> = ({ onComplete }) => {
  const rounds = useMinigameRounds(onComplete);
  const [charge, setCharge] = useState(0);
  const [charging, setCharging] = useState(false);

  const bandsRef = useRef<Band[]>(movingBands(52, 96, 14));
  const speedsRef = useRef<number[]>(
    Array.from({ length: 3 }, () => CHARGE_SPEED_MIN + Math.random() * (CHARGE_SPEED_MAX - CHARGE_SPEED_MIN))
  );
  const chargeRef = useRef(0);
  const chargingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const band = bandsRef.current[Math.min(rounds.round, bandsRef.current.length - 1)];
  const speed = speedsRef.current[Math.min(rounds.round, speedsRef.current.length - 1)];
  const playing = rounds.phase === 'playing';

  const startCharge = useCallback(() => {
    if (rounds.phase !== 'playing' || chargingRef.current) return;
    chargingRef.current = true;
    chargeRef.current = 0;
    setCharge(0);
    setCharging(true);
  }, [rounds.phase]);

  const fire = useCallback(() => {
    if (!chargingRef.current) return;
    chargingRef.current = false;
    setCharging(false);
    const c = chargeRef.current;
    const passed = c >= band.lo && c <= band.hi;
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, band]);

  // Reset the charge whenever a fresh attempt arms.
  useEffect(() => {
    chargingRef.current = false;
    setCharging(false);
    chargeRef.current = 0;
    setCharge(0);
  }, [rounds.round]);

  // Charge loop while held.
  useEffect(() => {
    if (!charging) return;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = (now - last) / 1000;
      last = now;
      const next = Math.min(MAX_CHARGE, chargeRef.current + speed * dt);
      chargeRef.current = next;
      setCharge(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [charging]);

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

  const toPct = (v: number): number => (v / MAX_CHARGE) * 100;

  return (
    <MinigameShell title="Load & Fire" subtitle="Release in the green — the window moves each rep">
      <div className="flex items-end justify-center gap-6 mb-4">
        {/* Vertical charge meter (0..MAX_CHARGE) */}
        <div className="relative h-64 w-24 bg-pixel-bg border-2 border-pixel-border overflow-hidden">
          {/* Current release window */}
          <div
            className="absolute inset-x-0 bg-green-500/25 border-y-2 border-green-500"
            style={{ bottom: `${toPct(band.lo)}%`, height: `${toPct(band.hi - band.lo)}%` }}
          />
          {/* Charge fill */}
          <div
            className="absolute inset-x-0 bottom-0 bg-pixel-accent/60"
            style={{ height: `${toPct(charge)}%` }}
          />
          <div
            className="absolute inset-x-0 h-1 bg-pixel-text"
            style={{ bottom: `calc(${toPct(charge)}% - 2px)` }}
          />
        </div>

        <div className="w-40">
          {rounds.phase === 'done' ? (
            <SupportResult
              count={rounds.successes}
              note={countNote(
                rounds.successes,
                'Three flush drives!',
                'Two clean releases.',
                'One clean release.',
                'Released outside the window.'
              )}
            />
          ) : (
            <div className="text-sm text-pixel-text-muted text-center">
              {rounds.phase === 'transition'
                ? rounds.lastPass
                  ? 'Clean! Next load…'
                  : 'Missed — next load…'
                : charging
                  ? 'Release in the green!'
                  : `Backhand ${rounds.round + 1} of 3 — hold to load.`}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? null : (
        <button
          type="button"
          disabled={!playing}
          onPointerDown={(e) => {
            e.preventDefault();
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // setPointerCapture can throw on synthetic events; hold still works.
            }
            startCharge();
          }}
          onPointerUp={fire}
          onPointerCancel={fire}
          className="font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1 px-8 py-3 text-lg w-full select-none touch-none"
        >
          {!playing
            ? rounds.lastPass
              ? 'Nice!'
              : 'Missed'
            : charging
              ? 'Release to fire!'
              : 'Hold to Load  (Space)'}
        </button>
      )}
    </MinigameShell>
  );
};
