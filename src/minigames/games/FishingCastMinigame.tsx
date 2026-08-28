/**
 * Fishing Minigame — "Cast & Reel"
 *
 * The first minigame that is not a training drill, and the reason round count and
 * score scale became inputs rather than constants: five casts, not three reps.
 *
 * A cast marker sweeps across the water. Press to cast; land it on the fish and
 * you have one. Each cast re-rolls where the fish are holding, the marker speeds
 * up as you go, and dithering costs you the cast — the fish move on.
 *
 * Nothing here knows why it is being played. It reports a score out of five and
 * the caller decides what that means. (The shell and the attempt hook still live
 * under components/training, which is where they were built; they are shared, not
 * training-specific.)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, RoundPips, MinigameActionButton } from '../../components/training/MinigameShell';
import { useMinigameRounds } from '../../components/training/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../../components/training/minigameJuice';
import { isActionKey } from '../../utils/gameKeys';
import type { MinigameProps } from '../types';

/** Five casts, ramping. Longer than a training drill, so the ramp is gentler. */
const CASTS = 5;
const SPEED_RAMP = [1, 1.06, 1.13, 1.21, 1.3];

const CAST_TIME = 3600; // ms before the fish move on
const SWEEP_MIN = 900; // ms period
const SWEEP_MAX = 1250;
const AMP = 42; // % swing amplitude around center
const SPLASH_MS = 420;

export const FishingCastMinigame: React.FC<MinigameProps> = ({
  onComplete,
  windowBonus = 0,
  onFirstAttempt,
  config,
}) => {
  // The game's own shape first, then whatever the caller asked for — so an event
  // can make it longer or shorter without the game losing its defaults.
  const rounds = useMinigameRounds(
    { minigame: 'fishing_cast', config: { rounds: CASTS, speedRamp: SPEED_RAMP, ...config } },
    onComplete,
    onFirstAttempt
  );
  const { frozen, trigger: hitstop } = useHitstop();
  const shoalHalf = 9 * (1 + windowBonus);

  const runningRef = useRef(false);
  const posRef = useRef(50);
  const phaseRef = useRef(0);
  const startRef = useRef(0);
  const shoalRef = useRef(50);
  const sweepRef = useRef(SWEEP_MIN);
  const rafRef = useRef<number | null>(null);
  const splashTimerRef = useRef<number | null>(null);

  const [view, setView] = useState({ pos: 50, timeFrac: 0 });
  const [shoal, setShoal] = useState(50);
  const [onFish, setOnFish] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  /** Where the line landed, kept on screen briefly so a miss is legible. */
  const [splash, setSplash] = useState<{ id: number; x: number; caught: boolean } | null>(null);

  const playing = rounds.phase === 'playing';

  useEffect(
    () => () => {
      if (splashTimerRef.current !== null) window.clearTimeout(splashTimerRef.current);
    },
    []
  );

  const settle = useCallback(
    (caught: boolean) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      rounds.commit(caught);
    },
    [rounds]
  );

  const cast = useCallback(() => {
    if (!runningRef.current) return;
    const caught = Math.abs(posRef.current - shoalRef.current) <= shoalHalf;
    const now = performance.now();
    setBurst({ id: now, x: posRef.current, y: 50, tone: caught ? 'good' : 'bad' });
    setSplash({ id: now, x: posRef.current, caught });
    if (splashTimerRef.current !== null) window.clearTimeout(splashTimerRef.current);
    splashTimerRef.current = window.setTimeout(() => setSplash(null), SPLASH_MS);
    if (caught) {
      hitstop();
      audioManager.playSfx('smash');
    } else {
      audioManager.playSfx('ui_click');
    }
    settle(caught);
  }, [shoalHalf, hitstop, settle]);

  // Arm a fresh cast: the fish hold somewhere new, at a fresh sweep speed.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    phaseRef.current = Math.random() * Math.PI * 2;
    shoalRef.current = 20 + Math.random() * 60;
    // Shorter period = faster sweep, so the ramp divides into it.
    sweepRef.current = (SWEEP_MIN + Math.random() * (SWEEP_MAX - SWEEP_MIN)) / rounds.speed;
    startRef.current = performance.now();
    runningRef.current = true;
    setSplash(null);
    setShoal(shoalRef.current);

    let last = performance.now();
    const loop = (now: number): void => {
      if (!runningRef.current) return;
      if (frozen.current) {
        last = now;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = now - last;
      last = now;
      phaseRef.current += (dt * 2 * Math.PI) / sweepRef.current;
      posRef.current = 50 + AMP * Math.sin(phaseRef.current);
      const timeFrac = (now - startRef.current) / CAST_TIME;
      setView({ pos: posRef.current, timeFrac });
      setOnFish(Math.abs(posRef.current - shoalRef.current) <= shoalHalf);
      if (timeFrac >= 1) {
        settle(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isActionKey(e)) {
        e.preventDefault();
        cast();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cast]);

  const idle = rounds.phase === 'ready';

  return (
    <MinigameShell
      title="Cast & Reel"
      subtitle="Drop the line on the fish. Five casts."
      controls="Space | Cast"
      phase={rounds.phase}
      onStart={rounds.begin}
      footer={
        <>
          <div className="mb-4">
            <RoundPips {...rounds} />
          </div>

          {rounds.phase === 'done' ? (
            <div className="text-center">
              <div
                className={`text-5xl font-bold mb-1 ${
                  rounds.score > 0 ? 'text-pixel-success' : 'text-pixel-text-muted'
                }`}
              >
                {rounds.score}
              </div>
              <div className="text-sm text-pixel-text-muted">
                {rounds.score >= 5
                  ? 'Every single cast. Nobody will believe you.'
                  : rounds.score >= 3
                    ? 'A respectable haul.'
                    : rounds.score >= 1
                      ? 'Well. You caught something.'
                      : 'The fish are fine. You are not.'}
              </div>
              <div className="text-xs text-pixel-text-muted mt-2">
                {rounds.score === 1 ? 'fish caught' : 'fish caught'}
              </div>
            </div>
          ) : (
            <MinigameActionButton onPress={cast} disabled={!playing}>
              {idle || playing ? 'Cast!  (Space)' : rounds.lastPass ? 'Got one!' : 'It got away'}
            </MinigameActionButton>
          )}
        </>
      }
    >
      <div className="relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4 flex items-center justify-center">
        <ComboBadge streak={rounds.streak} />

        {/* How long until the fish move on */}
        <div
          className="absolute top-0 left-0 h-1 bg-pixel-warning"
          style={{ width: `${Math.max(0, (1 - view.timeFrac) * 100)}%` }}
        />

        {/* The water */}
        <div className="absolute left-6 right-6 h-24 border border-pixel-border rounded bg-pixel-secondary/20">
          {/* Where the fish are holding */}
          <div
            className={`absolute top-[-6px] bottom-[-6px] border-l-2 border-r-2 border-dashed flex items-center justify-center ${
              onFish
                ? 'border-pixel-success bg-pixel-success/20'
                : 'border-pixel-accent bg-pixel-accent/10'
            }`}
            style={{ left: `${shoal}%`, width: `${shoalHalf * 2}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-2xl opacity-70 select-none">🐟</span>
          </div>

          {/* The line, sweeping */}
          {playing && (
            <div
              className={`absolute top-[-10px] bottom-[-10px] w-1.5 rounded-full ${
                onFish ? 'bg-pixel-success' : 'bg-pixel-accent'
              }`}
              style={{
                left: `${view.pos}%`,
                transform: 'translateX(-50%)',
                boxShadow: '0 0 10px currentColor',
              }}
            />
          )}

          {/* Where it landed. The outer div owns the centering transform because
              animate-pixel-scale animates transform and would clobber it. */}
          {splash && (
            <div
              className="absolute top-1/2"
              style={{ left: `${splash.x}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                key={splash.id}
                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-lg animate-pixel-scale ${
                  splash.caught
                    ? 'bg-pixel-success/30 border-pixel-success'
                    : 'bg-pixel-bg border-pixel-error'
                }`}
              >
                {splash.caught ? '🐟' : '💧'}
              </div>
            </div>
          )}
        </div>

        <Sparks burst={burst} />

        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted">
            Cast {rounds.round + 1}/{rounds.total}
          </div>
        )}
      </div>
    </MinigameShell>
  );
};
