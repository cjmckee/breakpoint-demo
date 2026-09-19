/**
 * Serve Minigame — "Toss & Strike"
 *
 * The toss floats up and drifts to a random side. Slide your strike zone under it and
 * strike while the ball is in the pocket. Each of three tosses is one attempt — a clean
 * strike banks a support. Slow ball + a wide pocket keep it fair despite the movement.
 * See docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, RoundPips, MinigameActionButton } from '../shared/MinigameShell';
import { SupportResult, countNote } from '../shared/trainingReadout';
import type { MinigameProps } from '../types';
import { useMinigameRounds } from '../shared/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../shared/minigameJuice';
import { MinigameArena, ARENA_H, u, uMin, pctY } from '../shared/MinigameArena';
import { directionFromKey, isActionKey } from '../../utils/gameKeys';

// Everything is in arena units (see MinigameArena). The toss is anchored to the
// bottom of the court; the space above its apex is headroom.
const START_Y = ARENA_H - 3.5; // where the toss leaves the hand
const Y_STRIKE = START_Y - 14; // where the pocket sits
const X_MIN = 8; // the toss bounces off these so it stays on court
const X_MAX = 92;
const ZONE_SPEED = 74; // units/sec the strike zone slides
/** Pocket size — near-square, ~10% wider than tall. */
const POCKET_W = 9.9;
const POCKET_H = 8.9;

interface Toss {
  vy0: number; // units/sec upward launch
  g: number; // units/sec^2 gravity
  vx: number; // units/sec horizontal drift
}

/**
 * A high, fast arc: the apex climbs ~41 units, so the ball crosses the strike band on
 * the way up and again on the way down.
 *
 * `speed` replays the same arc faster rather than changing its shape — apex height is
 * vy0²/2g, so scaling vy0 by k and g by k² leaves it untouched while the whole flight
 * runs 1/k as long. Later attempts get less time in the pocket, not a different toss.
 */
const randomToss = (speed: number): Toss => ({
  vy0: -(65.8 + Math.random() * 4.4) * speed,
  g: (52.6 + Math.random() * 6.6) * speed * speed,
  vx: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 7) * speed,
});

export const ServeMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt, config }) => {
  const rounds = useMinigameRounds({ minigame: 'toss_and_strike', config }, onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();

  const half = { x: (POCKET_W * (1 + windowBonus)) / 2, y: (POCKET_H * (1 + windowBonus)) / 2 };
  const halfRef = useRef(half);
  halfRef.current = half;

  const ballRef = useRef({ x: 50, y: START_Y, vx: 0, vy: 0 });
  const zoneRef = useRef(50);
  const moveRef = useRef(0);
  const struckRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [ball, setBall] = useState({ x: 50, y: START_Y });
  const [zone, setZone] = useState(50);
  const [inPocket, setInPocket] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [struck, setStruck] = useState(false);

  const playing = rounds.phase === 'playing';

  const isInPocket = useCallback(() => {
    const b = ballRef.current;
    const h = halfRef.current;
    return Math.abs(b.y - Y_STRIKE) <= h.y && Math.abs(b.x - zoneRef.current) <= h.x;
  }, []);

  const strike = useCallback(() => {
    if (rounds.phase !== 'playing' || struckRef.current || frozen.current) return;
    struckRef.current = true;
    const passed = isInPocket();
    const b = ballRef.current;
    setBurst({ id: performance.now(), x: b.x, y: pctY(b.y), tone: passed ? 'good' : 'bad' });
    if (passed) {
      hitstop();
      setStruck(true);
      audioManager.playSfx('smash');
    } else {
      audioManager.playSfx('ui_click');
    }
    rounds.commit(passed);
  }, [rounds, isInPocket, hitstop, frozen]);

  // Arm a fresh toss for each playing attempt.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    const toss = randomToss(rounds.speed);
    ballRef.current = { x: 50, y: START_Y, vx: toss.vx, vy: toss.vy0 };
    struckRef.current = false;
    setStruck(false);
    setBall({ x: 50, y: START_Y });
    audioManager.playSfx('serve');

    let last = performance.now();
    const loop = (now: number): void => {
      if (frozen.current) {
        last = now;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = (now - last) / 1000;
      last = now;
      const b = ballRef.current;
      b.vy += toss.g * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      if (b.x < X_MIN) { b.x = X_MIN; b.vx = Math.abs(b.vx); }
      if (b.x > X_MAX) { b.x = X_MAX; b.vx = -Math.abs(b.vx); }
      const edge = halfRef.current.x;
      zoneRef.current = Math.max(edge, Math.min(100 - edge, zoneRef.current + moveRef.current * ZONE_SPEED * dt));
      setBall({ x: b.x, y: b.y });
      setZone(zoneRef.current);
      setInPocket(isInPocket());
      if (b.y > ARENA_H + 1.75 && !struckRef.current) {
        struckRef.current = true;
        setBurst({ id: now, x: b.x, y: 98, tone: 'bad' });
        rounds.commit(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  // Keyboard: ← / → or A / D slide the zone (held via keydown + keyup), Space strikes.
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if (dir === 'left') { e.preventDefault(); moveRef.current = -1; }
      else if (dir === 'right') { e.preventDefault(); moveRef.current = 1; }
      else if (isActionKey(e)) { e.preventDefault(); strike(); }
    };
    const up = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if ((dir === 'left' && moveRef.current === -1) || (dir === 'right' && moveRef.current === 1)) {
        moveRef.current = 0;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [strike]);

  const hold = (dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); moveRef.current = dir; },
    onPointerUp: () => { moveRef.current = 0; },
    onPointerLeave: () => { moveRef.current = 0; },
  });

  const idle = rounds.phase === 'ready';

  return (
    <MinigameShell
      title="Toss & Strike"
      subtitle="Slide under the toss and strike it inside the target"
      controls="← → or A D | Move · Space | Strike"
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
                'Three perfect serves!',
                'Two clean serves. Not bad.',
                'One clean serve. Keep practicing!',
                'Nothing clean — wait for the pocket.'
              )}
            />
          ) : (
            <div className="space-y-2">
              {/* Movement gets its own full-width row — held constantly, so it needs the
                  biggest targets on screen. */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!playing}
                  {...hold(-1)}
                  className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50"
                >
                  ◀
                </button>
                <button
                  type="button"
                  disabled={!playing}
                  {...hold(1)}
                  className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50"
                >
                  ▶
                </button>
              </div>
              <MinigameActionButton onPress={strike} disabled={!playing}>
                {idle || playing ? 'Strike!  (Space)' : rounds.lastPass ? 'Ace!' : 'Missed'}
              </MinigameActionButton>
            </div>
          )}
        </>
      }
    >
      <MinigameArena>
        <ComboBadge streak={rounds.streak} />

        {/* Baseline + toss shadow for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-pixel-border" />
        {playing && !struck && (
          <div
            className="absolute bottom-1 h-2 rounded-full bg-black/40"
            style={{ left: u(ball.x), width: u(4.8), transform: 'translateX(-50%)', opacity: Math.max(0.15, 1 - ball.y / ARENA_H) }}
          />
        )}

        {/* Strike pocket */}
        <div
          className={`absolute border-4 ${inPocket ? 'border-pixel-success bg-pixel-success/20' : 'border-pixel-accent/70'}`}
          style={{
            left: u(zone),
            top: u(Y_STRIKE),
            width: u(half.x * 2),
            height: u(half.y * 2),
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* The ball */}
        {playing && !struck && (
          <div
            className="absolute rounded-full bg-pixel-ball border-2 border-pixel-text flex items-center justify-center"
            style={{
              left: u(ball.x),
              top: u(ball.y),
              width: uMin(6.2, 24),
              height: uMin(6.2, 24),
              fontSize: uMin(2.7, 11),
              transform: 'translate(-50%, -50%)',
            }}
          >
            🎾
          </div>
        )}
        {struck && (
          <div
            className="absolute"
            style={{ left: u(ball.x), top: u(Math.max(2.6, ball.y - 8.8)), fontSize: uMin(4.1, 16), transform: 'translate(-50%, -50%)' }}
          >
            💥
          </div>
        )}

        <Sparks burst={burst} />
      </MinigameArena>
    </MinigameShell>
  );
};
