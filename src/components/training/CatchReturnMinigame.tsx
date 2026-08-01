/**
 * Return Minigame — "Catch Return"
 *
 * Read where each serve drops and click/tap it out of the air before it lands. Balls
 * come in SETS of three, streaming continuously (catch all three to bank the support) —
 * three sets in all. A quick telegraph from the far baseline marks each serve so it
 * reads as a return, not a ball out of nowhere. See docs/training-redesign.md.
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
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';

const PER_SET = 3;
const HIT_RADIUS = 32; // px — a touch more generous than the visual ball
const FLOOR = 92; // % — where the ball is considered landed

export const CatchReturnMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();
  const hitRadius = HIT_RADIUS * (1 + windowBonus);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef({ x: 50, y: 0 });
  const fallRef = useRef(1100);
  const startRef = useRef(0);
  const tokenRef = useRef(0);
  const idxRef = useRef(0);
  const caughtRef = useRef(0);
  const activeRef = useRef(false);
  const resolvedRef = useRef(false);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [ball, setBall] = useState({ x: 50, y: 0, visible: false });
  const [caught, setCaught] = useState(0);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [soClose, setSoClose] = useState(false);

  const playing = rounds.phase === 'playing';

  const finishSet = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    setSoClose(caughtRef.current === PER_SET - 1);
    rounds.commit(caughtRef.current === PER_SET);
  }, [rounds]);

  const land = useCallback(
    (good: boolean) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      activeRef.current = false;
      const b = ballRef.current;
      setBurst({ id: performance.now(), x: b.x, y: good ? b.y : FLOOR, tone: good ? 'good' : 'bad' });
      if (good) {
        caughtRef.current += 1;
        setCaught(caughtRef.current);
        hitstop();
        audioManager.playSfx('hit_volley');
      }
      idxRef.current += 1;
      setBall((prev) => ({ ...prev, visible: false }));
      nextBall(); // stream straight into the next serve — the only pause is between sets
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hitstop]
  );

  const nextBall = useCallback(() => {
    if (!runningRef.current) return;
    if (idxRef.current >= PER_SET) { finishSet(); return; }
    const token = ++tokenRef.current;
    ballRef.current = { x: 12 + Math.random() * 76, y: 0 };
    fallRef.current = 950 + Math.random() * 500; // 950–1450ms
    activeRef.current = true;
    resolvedRef.current = false;
    startRef.current = performance.now();
    setBall({ x: ballRef.current.x, y: 0, visible: true });

    const loop = (now: number): void => {
      if (token !== tokenRef.current || !activeRef.current) return;
      if (frozen.current) { rafRef.current = requestAnimationFrame(loop); return; }
      const frac = (now - startRef.current) / fallRef.current;
      ballRef.current.y = frac * FLOOR;
      setBall({ x: ballRef.current.x, y: ballRef.current.y, visible: true });
      if (frac >= 1) { land(false); return; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [finishSet, land, frozen]);

  const tryCatch = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeRef.current || resolvedRef.current || !boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const cx = (ballRef.current.x / 100) * rect.width;
      const cy = (ballRef.current.y / 100) * rect.height;
      const dist = Math.hypot(clientX - rect.left - cx, clientY - rect.top - cy);
      if (dist <= hitRadius) land(true); // a miss-click is ignored — the ball keeps falling
    },
    [hitRadius, land]
  );

  // Arm a fresh set for each playing round.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    idxRef.current = 0;
    caughtRef.current = 0;
    runningRef.current = true;
    setCaught(0);
    setSoClose(false);
    nextBall();
    return () => {
      runningRef.current = false;
      activeRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  const telegraphOpacity = ball.visible ? Math.max(0, 1 - ball.y / 22) : 0;

  return (
    <MinigameShell
      title="Catch Return"
      subtitle="Click each ball before it lands"
      controls="click / tap the ball"
      phase={rounds.phase}
      onStart={rounds.begin}
    >
      <div
        ref={boxRef}
        onPointerDown={(e) => { e.preventDefault(); tryCatch(e.clientX, e.clientY); }}
        className={`relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden select-none touch-none ${playing ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <ComboBadge streak={rounds.streak} />

        {/* Floor line */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-pixel-accent/40" />

        {/* Serve telegraph from the far baseline */}
        {playing && telegraphOpacity > 0 && (
          <div
            className="absolute top-0 text-xs text-pixel-text-muted"
            style={{ left: `${ball.x}%`, transform: 'translateX(-50%)', opacity: telegraphOpacity }}
          >
            ▼
          </div>
        )}

        {/* The falling ball */}
        {playing && ball.visible && (
          <div
            className="absolute w-10 h-10 rounded-full bg-pixel-accent border-2 border-pixel-text flex items-center justify-center text-lg pointer-events-none"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            🎾
          </div>
        )}

        <Sparks burst={burst} />

        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted">
            {caught}/{PER_SET} caught
          </div>
        )}
        {rounds.phase === 'transition' && soClose && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-pixel-warning">2/3 — so close!</span>
          </div>
        )}
      </div>

      <div className="mt-4 mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Three perfect sets of returns!',
            'Two clean sets. Great hands!',
            'One clean set. Keep reading it!',
            'Aced — keep your eyes up!'
          )}
        />
      ) : (
        <p className="text-xs text-pixel-text-muted text-center">
          Set {Math.min(rounds.round + 1, 3)} of 3 · catch all three
        </p>
      )}
    </MinigameShell>
  );
};
