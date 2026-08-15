/**
 * Backhand Minigame — "Corner Painter"
 *
 * A two-axis placement game. A vertical sweep locks the sideline on the first press, a
 * horizontal sweep locks the depth on the second — land the ball on the target ring.
 * The target is large and forgiving; the skill is the double-lock. Three corners, each
 * a clean landing banks a support. See docs/training-redesign.md.
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
import { useMinigameRounds, roundSpeed } from './useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';
import { isActionKey } from '../../utils/gameKeys';

/**
 * The landing window is measured against a fixed reference court rather than the live
 * element, so it stays exactly as tuned however the court renders. Measuring the live
 * box tied difficulty to layout: a taller court tightened the depth lock, and a narrow
 * phone loosened the sideline lock, neither of them on purpose.
 */
const REF_W = 584; // px — the court at max-w-2xl, where the window below was tuned
const REF_H = 224;
const TOLERANCE = 52; // px radius on the reference court counted as "on the ring"
const SWEEP_MIN = 4.0; // rad/sec
const SWEEP_MAX = 5.0;

export const CornerPainterMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { trigger: hitstop } = useHitstop();
  const tol = TOLERANCE * (1 + windowBonus);

  const targetsRef = useRef<Array<{ x: number; y: number }>>(
    Array.from({ length: 3 }, () => ({ x: 14 + Math.random() * 72, y: 14 + Math.random() * 72 }))
  );
  const stageRef = useRef<'x' | 'y' | 'done'>('x');
  const lockXRef = useRef(50);
  const sweepRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [sweep, setSweep] = useState(0);
  const [stage, setStage] = useState<'x' | 'y' | 'done'>('x');
  const [shot, setShot] = useState<{ x: number; y: number; good: boolean } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  const target = targetsRef.current[Math.min(rounds.round, 2)];
  const playing = rounds.phase === 'playing';

  const lock = useCallback(() => {
    if (rounds.phase !== 'playing') return;
    if (stageRef.current === 'x') {
      lockXRef.current = sweepRef.current;
      stageRef.current = 'y';
      setStage('y');
      audioManager.playSfx('ui_click');
      return;
    }
    if (stageRef.current === 'y') {
      stageRef.current = 'done';
      setStage('done');
      const lockY = sweepRef.current;
      const lockX = lockXRef.current;
      const dist = Math.hypot(((lockX - target.x) / 100) * REF_W, ((lockY - target.y) / 100) * REF_H);
      const passed = dist <= tol;
      setShot({ x: lockX, y: lockY, good: passed });
      setBurst({ id: performance.now(), x: lockX, y: lockY, tone: passed ? 'good' : 'bad' });
      if (passed) {
        hitstop();
        audioManager.playSfx('hit_ground');
      }
      rounds.commit(passed);
    }
  }, [rounds, target, tol, hitstop]);

  // Arm a fresh corner for each playing round.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    stageRef.current = 'x';
    setStage('x');
    setShot(null);
    sweepRef.current = 0;
    startRef.current = performance.now();
    // Rolled per round, then ramped — later corners sweep faster to lock.
    const speed = (SWEEP_MIN + Math.random() * (SWEEP_MAX - SWEEP_MIN)) * roundSpeed(rounds.round);
    const loop = (now: number): void => {
      if (stageRef.current === 'done') return;
      const el = (now - startRef.current) / 1000;
      sweepRef.current = (Math.sin(el * speed) * 0.5 + 0.5) * 100;
      setSweep(sweepRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isActionKey(e)) { e.preventDefault(); lock(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lock]);

  const idle = rounds.phase === 'ready';

  return (
    <MinigameShell
      title="Corner Painter"
      subtitle="Lock the sideline, then the depth — paint the corner"
      controls="Space | lock the target"
      phase={rounds.phase}
      onStart={rounds.begin}
      footer={
        <>
          <div className="mb-4">
            <RoundPips {...rounds} />
          </div>

          {rounds.phase === 'done' ? (
            <SupportResult
              count={rounds.successes}
              note={countNote(
                rounds.successes,
                'Three corners painted!',
                'Two on the money. Sharp!',
                'One clean corner. Keep aiming!',
                'Sprayed it — line it up next time.'
              )}
            />
          ) : (
            <MinigameActionButton onPress={lock} disabled={!playing}>
              {idle
                ? 'Lock the sideline  (Space)'
                : !playing
                  ? rounds.lastPass
                    ? 'Painted!'
                    : 'Wide'
                  : stage === 'x'
                    ? 'Lock the sideline  (Space)'
                    : 'Lock the depth  (Space)'}
            </MinigameActionButton>
          )}
        </>
      }
    >
      <div className="relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        <ComboBadge streak={rounds.streak} />

        {/* Target ring */}
        <div
          className="absolute rounded-full border-4 border-dashed border-pixel-warning/80"
          style={{ left: `${target.x}%`, top: `${target.y}%`, width: 64, height: 64, transform: 'translate(-50%, -50%)' }}
        >
          <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-pixel-warning" style={{ transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* Sweeps */}
        {playing && stage === 'x' && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-pixel-success shadow-[0_0_8px_rgba(46,204,113,0.8)]" style={{ left: `${sweep}%` }} />
        )}
        {playing && stage === 'y' && (
          <div className="absolute left-0 right-0 h-0.5 bg-pixel-success shadow-[0_0_8px_rgba(46,204,113,0.8)]" style={{ top: `${sweep}%` }} />
        )}
        {/* Locked sideline stays visible while picking depth */}
        {(stage === 'y' || stage === 'done') && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-pixel-warning" style={{ left: `${lockXRef.current}%` }} />
        )}

        {/* Shot line + the ball where it landed — both tinted by the result */}
        {shot && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line
                x1="50%"
                y1="100%"
                x2={`${shot.x}%`}
                y2={`${shot.y}%`}
                stroke={shot.good ? 'rgba(46,204,113,0.9)' : 'rgba(231,76,60,0.9)'}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
            <div
              className={`absolute w-9 h-9 rounded-full bg-pixel-ball border-4 flex items-center justify-center text-base ${shot.good ? 'border-pixel-success' : 'border-pixel-error'}`}
              style={{ left: `${shot.x}%`, top: `${shot.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              🎾
            </div>
          </>
        )}

        <Sparks burst={burst} />
      </div>
    </MinigameShell>
  );
};
