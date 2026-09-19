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
import { MinigameShell, RoundPips, MinigameActionButton } from '../shared/MinigameShell';
import { SupportResult, countNote } from '../shared/trainingReadout';
import type { MinigameProps } from '../types';
import { useMinigameRounds } from '../shared/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../shared/minigameJuice';
import { MinigameArena, ARENA_H, u, uMin } from '../shared/MinigameArena';
import { isActionKey } from '../../utils/gameKeys';

/**
 * Sweeps and targets are placed as a % of each axis; the landing check converts to
 * arena units so the window is a true circle on every screen.
 */
const TOLERANCE = 8.9; // arena units — radius counted as "on the ring"
const RING = 11; // arena units — the drawn ring's diameter
/**
 * The depth sweep crosses the court's full height, which is taller relative to its
 * width than the court this was tuned on (a 584×224 box). Slowing that sweep by the
 * same ratio keeps the time the line spends inside the window what it was, so a
 * taller court doesn't make the depth lock harder.
 */
const DEPTH_SWEEP_SCALE = (224 / 584) * (100 / ARENA_H);
const SWEEP_MIN = 4.0; // rad/sec
const SWEEP_MAX = 5.0;

export const CornerPainterMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt, config }) => {
  const rounds = useMinigameRounds({ minigame: 'corner_paint', config }, onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();
  const tol = TOLERANCE * (1 + windowBonus);

  const targetsRef = useRef<Array<{ x: number; y: number }>>(
    Array.from({ length: 3 }, () => ({ x: 14 + Math.random() * 72, y: 14 + Math.random() * 72 }))
  );
  const stageRef = useRef<'x' | 'y' | 'done'>('x');
  const lockXRef = useRef(50);
  const sweepRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [sweep, setSweep] = useState(0);
  const [stage, setStage] = useState<'x' | 'y' | 'done'>('x');
  const [shot, setShot] = useState<{ x: number; y: number; good: boolean } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  const target = targetsRef.current[Math.min(rounds.round, 2)];
  const playing = rounds.phase === 'playing';

  const lock = useCallback(() => {
    if (rounds.phase !== 'playing' || frozen.current) return;
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
      const dist = Math.hypot(lockX - target.x, ((lockY - target.y) / 100) * ARENA_H);
      const passed = dist <= tol;
      setShot({ x: lockX, y: lockY, good: passed });
      setBurst({ id: performance.now(), x: lockX, y: lockY, tone: passed ? 'good' : 'bad' });
      if (passed) {
        hitstop();
        audioManager.playSfx('hit_ground');
      }
      rounds.commit(passed);
    }
  }, [rounds, target, tol, hitstop, frozen]);

  // Arm a fresh corner for each playing round.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    stageRef.current = 'x';
    setStage('x');
    setShot(null);
    sweepRef.current = 0;
    // Rolled per round, then ramped — later corners sweep faster to lock.
    const speed = (SWEEP_MIN + Math.random() * (SWEEP_MAX - SWEEP_MIN)) * rounds.speed;
    // Phase is accumulated rather than read off the clock, so the depth sweep can run
    // at its own rate without jumping, and a freeze simply stops it advancing.
    let phase = 0;
    let last = performance.now();
    const loop = (now: number): void => {
      if (stageRef.current === 'done') return;
      const dt = (now - last) / 1000;
      last = now;
      if (!frozen.current) {
        phase += dt * speed * (stageRef.current === 'y' ? DEPTH_SWEEP_SCALE : 1);
      }
      sweepRef.current = (Math.sin(phase) * 0.5 + 0.5) * 100;
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
      <MinigameArena>
        <ComboBadge streak={rounds.streak} />

        {/* Target ring */}
        <div
          className="absolute rounded-full border-4 border-dashed border-pixel-warning/80"
          style={{ left: `${target.x}%`, top: `${target.y}%`, width: u(RING), height: u(RING), transform: 'translate(-50%, -50%)' }}
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
              className={`absolute rounded-full bg-pixel-ball border-4 flex items-center justify-center ${shot.good ? 'border-pixel-success' : 'border-pixel-error'}`}
              style={{
                left: `${shot.x}%`,
                top: `${shot.y}%`,
                width: uMin(6.2, 24),
                height: uMin(6.2, 24),
                fontSize: uMin(2.7, 11),
                transform: 'translate(-50%, -50%)',
              }}
            >
              🎾
            </div>
          </>
        )}

        <Sparks burst={burst} />
      </MinigameArena>
    </MinigameShell>
  );
};
