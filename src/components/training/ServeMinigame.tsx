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
import { directionFromKey, isActionKey } from '../../utils/gameKeys';

const Y_STRIKE = 60; // % from top — where the pocket sits
const ZONE_SPEED = 74; // %/sec the strike zone slides
const START_Y = 92;
/** Pocket size in px — kept near-square (~10% wider than tall) regardless of the box aspect. */
const POCKET_W = 58;
const POCKET_H = 52;

interface Toss {
  vy0: number; // %/sec upward launch
  g: number; // %/sec^2 gravity
  vx: number; // %/sec horizontal drift
}

/**
 * A high, fast arc: the apex lands near the top of the box, so the ball crosses the
 * strike band on the way up and again on the way down.
 *
 * `speed` replays the same arc faster rather than changing its shape — apex height is
 * vy0²/2g, so scaling vy0 by k and g by k² leaves it untouched while the whole flight
 * runs 1/k as long. Later attempts get less time in the pocket, not a different toss.
 */
const randomToss = (speed: number): Toss => ({
  vy0: -(150 + Math.random() * 10) * speed,
  g: (120 + Math.random() * 15) * speed * speed,
  vx: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 7) * speed,
});

export const ServeMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();

  const boxRef = useRef<HTMLDivElement | null>(null);
  // Pocket half-extents as % of the box, derived from the px size so it stays square.
  const halfRef = useRef({ x: 8, y: 10 });
  const [half, setHalf] = useState(halfRef.current);

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

  // Measure the box so the pocket's px size can be expressed in the ball's % space.
  // Re-runs on phase change because the box only mounts once the start gate clears.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const next = {
        x: ((POCKET_W * (1 + windowBonus)) / 2 / rect.width) * 100,
        y: ((POCKET_H * (1 + windowBonus)) / 2 / rect.height) * 100,
      };
      halfRef.current = next;
      setHalf(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [windowBonus, rounds.phase]);

  const isInPocket = useCallback(() => {
    const b = ballRef.current;
    const h = halfRef.current;
    return Math.abs(b.y - Y_STRIKE) <= h.y && Math.abs(b.x - zoneRef.current) <= h.x;
  }, []);

  const strike = useCallback(() => {
    if (rounds.phase !== 'playing' || struckRef.current) return;
    struckRef.current = true;
    const passed = isInPocket();
    const b = ballRef.current;
    setBurst({ id: performance.now(), x: b.x, y: b.y, tone: passed ? 'good' : 'bad' });
    if (passed) {
      hitstop();
      setStruck(true);
      audioManager.playSfx('smash');
    } else {
      audioManager.playSfx('ui_click');
    }
    rounds.commit(passed);
  }, [rounds, isInPocket, hitstop]);

  // Arm a fresh toss for each playing attempt.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    const toss = randomToss(roundSpeed(rounds.round));
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
      if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); }
      if (b.x > 92) { b.x = 92; b.vx = -Math.abs(b.vx); }
      const edge = halfRef.current.x;
      zoneRef.current = Math.max(edge, Math.min(100 - edge, zoneRef.current + moveRef.current * ZONE_SPEED * dt));
      setBall({ x: b.x, y: b.y });
      setZone(zoneRef.current);
      setInPocket(isInPocket());
      if (b.y > 104 && !struckRef.current) {
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

  return (
    <MinigameShell
      title="Toss & Strike"
      subtitle="Slide under the toss and strike in the pocket"
      controls="← → or A D move · Space strike"
      phase={rounds.phase}
      onStart={rounds.begin}
    >
      <div ref={boxRef} className="relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        <ComboBadge streak={rounds.streak} />

        {/* Baseline + toss shadow for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-pixel-border" />
        {playing && !struck && (
          <div
            className="absolute bottom-1 h-2 rounded-full bg-black/40"
            style={{ left: `${ball.x}%`, width: 28, transform: 'translateX(-50%)', opacity: Math.max(0.15, 1 - ball.y / 100) }}
          />
        )}

        {/* Strike pocket */}
        <div
          className={`absolute border-4 rounded ${inPocket ? 'border-green-500 bg-green-500/20' : 'border-pixel-accent/70'}`}
          style={{
            left: `${zone}%`,
            top: `${Y_STRIKE}%`,
            width: `${half.x * 2}%`,
            height: `${half.y * 2}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* The ball */}
        {playing && !struck && (
          <div
            className="absolute w-8 h-8 rounded-full bg-pixel-accent border-2 border-pixel-text flex items-center justify-center text-sm"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            🎾
          </div>
        )}
        {struck && (
          <div
            className="absolute text-2xl"
            style={{ left: `${ball.x}%`, top: `${Math.max(6, ball.y - 20)}%`, transform: 'translate(-50%, -50%)' }}
          >
            💥
          </div>
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
            'Three perfect serves!',
            'Two clean serves. Not bad.',
            'One clean serve. Keep practicing!',
            'You need some work...'
          )}
        />
      ) : (
        <div className="space-y-2">
          {/* Movement gets its own full-width row — held constantly, so it needs the
              biggest targets on screen. */}
          <div className="flex gap-2">
            <button
              type="button"
              {...hold(-1)}
              className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1"
            >
              ◀
            </button>
            <button
              type="button"
              {...hold(1)}
              className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1"
            >
              ▶
            </button>
          </div>
          <MinigameActionButton onPress={strike} disabled={!playing}>
            {playing ? 'Strike!  (Space)' : rounds.lastPass ? 'Ace!' : 'Missed'}
          </MinigameActionButton>
        </div>
      )}
    </MinigameShell>
  );
};
