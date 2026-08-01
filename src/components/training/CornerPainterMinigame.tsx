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
import { useMinigameRounds } from './useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';

const TOLERANCE = 52; // px radius counted as "on the ring"
const SWEEP_MIN = 2.2; // rad/sec
const SWEEP_MAX = 3.1;

export const CornerPainterMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { trigger: hitstop } = useHitstop();
  const tol = TOLERANCE * (1 + windowBonus);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const speedsRef = useRef<number[]>(
    Array.from({ length: 3 }, () => SWEEP_MIN + Math.random() * (SWEEP_MAX - SWEEP_MIN))
  );
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
      const rect = boxRef.current?.getBoundingClientRect();
      const w = rect?.width ?? 320;
      const h = rect?.height ?? 224;
      const dist = Math.hypot(((lockX - target.x) / 100) * w, ((lockY - target.y) / 100) * h);
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
    const speed = speedsRef.current[Math.min(rounds.round, 2)];
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
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); lock(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lock]);

  return (
    <MinigameShell
      title="Corner Painter"
      subtitle="Lock the sideline, then the depth — paint the corner"
      controls="Space locks each axis"
      phase={rounds.phase}
      onStart={rounds.begin}
    >
      <div ref={boxRef} className="relative h-56 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
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
          <div className="absolute top-0 bottom-0 w-0.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" style={{ left: `${sweep}%` }} />
        )}
        {playing && stage === 'y' && (
          <div className="absolute left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" style={{ top: `${sweep}%` }} />
        )}
        {/* Locked sideline stays visible while picking depth */}
        {(stage === 'y' || stage === 'done') && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-pixel-warning" style={{ left: `${lockXRef.current}%` }} />
        )}

        {/* Shot line + landing splat */}
        {shot && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="50%" y1="100%" x2={`${shot.x}%`} y2={`${shot.y}%`} stroke="rgba(238,238,238,0.4)" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div
              className={`absolute rounded-full ${shot.good ? 'bg-green-500/70' : 'bg-red-600/70'}`}
              style={{ left: `${shot.x}%`, top: `${shot.y}%`, width: 22, height: 22, transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}

        <Sparks burst={burst} />
      </div>

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
          {!playing
            ? rounds.lastPass
              ? 'Painted!'
              : 'Wide'
            : stage === 'x'
              ? 'Lock the sideline  (Space)'
              : 'Lock the depth  (Space)'}
        </MinigameActionButton>
      )}
    </MinigameShell>
  );
};
